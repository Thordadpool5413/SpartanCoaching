import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ZodType } from "zod";
import {
  getSpartanAiTool,
  isClinicalTool,
  type AiToolSpec,
  type SpartanAiToolId,
} from "./registry";
import {
  outputSchema as territoryOutputSchema,
  type ToolInput as TerritoryInput,
} from "./tools/territory-account-discovery/schema";

export class SpartanAiToolError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    readonly retryable = false,
  ) {
    super(message);
  }
}

export interface ToolRunOptions {
  apiKey?: string;
  client?: OpenAI;
  model?: string;
  requestId?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface SpartanAiToolResult {
  output: unknown;
  metadata: {
    toolId: SpartanAiToolId;
    toolVersion: string;
    model: string;
    promptVersion: string;
    requestId?: string;
    durationMs: number;
    safetyWarnings: readonly string[];
    humanReviewRequired: boolean;
  };
}

const MAX_INPUT_BYTES = 256 * 1024;
const FORBIDDEN_INPUT_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export function isToolFeatureEnabled(
  tool: AiToolSpec,
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  const configured = environment[tool.featureFlag];
  if (configured === "true") return true;
  if (configured === "false") return false;

  // Tools ship ready for entitled members. An explicit false remains the
  // emergency kill switch. Clinical PHI mode has independent runtime,
  // permission, MFA, evidence, and storage gates.
  return true;
}

function assertSafeInput(value: unknown): void {
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new SpartanAiToolError(
      "INVALID_INPUT",
      400,
      "Tool input must be valid JSON.",
    );
  }
  if (Buffer.byteLength(serialized, "utf8") > MAX_INPUT_BYTES) {
    throw new SpartanAiToolError(
      "INPUT_TOO_LARGE",
      413,
      "Tool input exceeds the 256 KB safety limit.",
    );
  }

  const inspect = (current: unknown, depth: number): void => {
    if (depth > 20) {
      throw new SpartanAiToolError(
        "INPUT_TOO_DEEP",
        400,
        "Tool input contains excessive nesting.",
      );
    }
    if (!current || typeof current !== "object") return;
    for (const [key, child] of Object.entries(current)) {
      if (FORBIDDEN_INPUT_KEYS.has(key)) {
        throw new SpartanAiToolError(
          "UNSAFE_INPUT",
          400,
          "Tool input contains a forbidden object key.",
        );
      }
      inspect(child, depth + 1);
    }
  };
  inspect(value, 0);
}

function isPhiClinicalOperationMode(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  const explicit = environment.CLINICAL_OPERATION_MODE?.trim().toLowerCase();
  if (explicit === "deidentified") return false;
  if (explicit === "phi") return true;
  // Auto-enable PHI when vendor BAAs are confirmed (matches API runtime readiness).
  return (
    environment.HIPAA_PHI_ENABLED === "true" &&
    environment.OPENAI_BAA_CONFIRMED === "true" &&
    environment.OPENAI_MODIFIED_RETENTION_CONFIRMED === "true" &&
    environment.GOOGLE_CLOUD_BAA_CONFIRMED === "true" &&
    environment.PHI_STORAGE_BAA_CONFIRMED === "true"
  );
}

function assertClinicalLaunchGate(tool: AiToolSpec): void {
  if (!isClinicalTool(tool)) return;
  if (!isPhiClinicalOperationMode()) return;
  if (process.env.HIPAA_PHI_ENABLED !== "true") {
    throw new SpartanAiToolError(
      "PHI_PROCESSING_DISABLED",
      503,
      "Clinical tools are unavailable until the HIPAA production controls are enabled.",
    );
  }
  if (process.env.OPENAI_BAA_CONFIRMED !== "true") {
    throw new SpartanAiToolError(
      "OPENAI_BAA_REQUIRED",
      503,
      "Clinical AI processing requires a confirmed OpenAI Business Associate Agreement.",
    );
  }
  if (process.env.OPENAI_MODIFIED_RETENTION_CONFIRMED !== "true") {
    throw new SpartanAiToolError(
      "OPENAI_RETENTION_REQUIRED",
      503,
      "Clinical AI processing requires confirmed OpenAI modified retention / ZDR controls.",
    );
  }
  if (process.env.GOOGLE_CLOUD_BAA_CONFIRMED !== "true") {
    throw new SpartanAiToolError(
      "GOOGLE_CLOUD_BAA_REQUIRED",
      503,
      "Clinical AI processing requires a confirmed Google Cloud Business Associate Agreement.",
    );
  }
  if (process.env.PHI_STORAGE_BAA_CONFIRMED !== "true") {
    throw new SpartanAiToolError(
      "PHI_STORAGE_BAA_REQUIRED",
      503,
      "Clinical AI processing requires a confirmed BAA-covered storage environment.",
    );
  }
}

function runTerritory(input: unknown): unknown {
  const parsed = getSpartanAiTool(
    "territory-account-discovery",
  )!.inputSchema.parse(input) as TerritoryInput;
  const allowed = new Set(
    parsed.facilityTypes.map((value) => value.toLowerCase()),
  );
  const seen = new Set<string>();
  const matchedFacilities = parsed.facilities.filter((facility) => {
    const type = String(
      facility.facilityType ?? facility.type ?? "",
    ).toLowerCase();
    const id = String(
      facility.placeId ?? facility.id ?? JSON.stringify(facility),
    );
    if (!allowed.has(type) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return territoryOutputSchema.parse({
    matchedFacilities,
    searchedZipCodes: parsed.zipCodes,
    summary: {
      matched: matchedFacilities.length,
      radiusMiles: parsed.radiusMiles,
      requestedTypes: parsed.facilityTypes,
    },
    implementationNote:
      "Deterministic filtering was applied to the supplied facility search results.",
  });
}

function mapProviderError(error: unknown): SpartanAiToolError {
  if (error instanceof SpartanAiToolError) return error;
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "APIConnectionTimeoutError"
  ) {
    return new SpartanAiToolError(
      "PROVIDER_TIMEOUT",
      504,
      "AI service timed out.",
      true,
    );
  }
  if (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return new SpartanAiToolError(
      error.name === "AbortError" ? "PROVIDER_CANCELLED" : "PROVIDER_TIMEOUT",
      error.name === "AbortError" ? 499 : 504,
      error.name === "AbortError"
        ? "AI request was cancelled."
        : "AI service timed out.",
      error.name !== "AbortError",
    );
  }
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : 502;
  if (status === 401 || status === 403) {
    return new SpartanAiToolError(
      "PROVIDER_AUTH",
      503,
      "AI service authentication failed.",
    );
  }
  if (status === 429) {
    return new SpartanAiToolError(
      "PROVIDER_RATE_LIMITED",
      429,
      "AI service is busy. Try again shortly.",
      true,
    );
  }
  if (status === 408) {
    return new SpartanAiToolError(
      "PROVIDER_TIMEOUT",
      504,
      "AI service timed out.",
      true,
    );
  }
  return new SpartanAiToolError(
    "PROVIDER_FAILED",
    502,
    "AI service could not complete the request.",
    true,
  );
}

export async function runSpartanAiTool(
  toolId: string,
  input: unknown,
  options: ToolRunOptions = {},
): Promise<SpartanAiToolResult> {
  const started = Date.now();
  const tool = getSpartanAiTool(toolId);
  if (!tool) {
    throw new SpartanAiToolError(
      "TOOL_NOT_FOUND",
      404,
      "AI tool was not found.",
    );
  }
  if (!isToolFeatureEnabled(tool)) {
    throw new SpartanAiToolError("TOOL_DISABLED", 503, "AI tool is disabled.");
  }
  assertClinicalLaunchGate(tool);
  assertSafeInput(input);
  const parsed = tool.inputSchema.safeParse(input);
  if (!parsed.success) {
    throw new SpartanAiToolError(
      "INVALID_INPUT",
      400,
      "Tool input did not match the required schema.",
    );
  }

  const model = tool.deterministic
    ? "deterministic-v1"
    : (options.model ?? process.env.OPENAI_MODEL ?? "gpt-5");
  const timeoutMs =
    options.timeoutMs ?? (isClinicalTool(tool) ? 120_000 : 90_000);
  try {
    const output = tool.deterministic
      ? runTerritory(parsed.data)
      : await (async () => {
          const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
          if (!options.client && !apiKey) {
            throw new SpartanAiToolError(
              "PROVIDER_NOT_CONFIGURED",
              503,
              "AI service is not configured.",
            );
          }
          const client =
            options.client ??
            new OpenAI({
              apiKey,
              timeout: timeoutMs,
              maxRetries: 1,
            });
          const response = await client.responses.parse(
            {
              model,
              store: false,
              input: [
                { role: "system", content: tool.systemPrompt },
                {
                  role: "user",
                  content: tool.buildPrompt(parsed.data as never),
                },
              ],
              text: {
                format: zodTextFormat(
                  tool.outputSchema as ZodType,
                  tool.id.replaceAll("-", "_"),
                ),
              },
            },
            {
              timeout: timeoutMs,
              signal: options.signal,
              headers: options.requestId
                ? { "X-Client-Request-Id": options.requestId }
                : undefined,
            },
          );
          if (!response.output_parsed) {
            throw new SpartanAiToolError(
              "INVALID_MODEL_OUTPUT",
              502,
              "AI returned an invalid structured response.",
              true,
            );
          }
          return tool.outputSchema.parse(response.output_parsed);
        })();

    return {
      output,
      metadata: {
        toolId: tool.id,
        toolVersion: tool.version,
        model,
        promptVersion: `${tool.id}-v1`,
        requestId: options.requestId,
        durationMs: Date.now() - started,
        safetyWarnings: tool.safetyWarnings,
        humanReviewRequired: tool.containsPhi,
      },
    };
  } catch (error) {
    throw mapProviderError(error);
  }
}
