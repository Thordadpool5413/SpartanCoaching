import OpenAI, { toFile } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { isUsableOpenAiApiKey } from "@workspace/spartan-ai-tools";

const DEFAULT_MODEL = "gpt-5";
const DEFAULT_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";
const PROBE_TIMEOUT_MS = 60_000;

const structuredProbeSchema = z.object({
  status: z.literal("ready"),
});

export type AiProbeResult = {
  id: "chat" | "responses" | "structured" | "transcription";
  ok: boolean;
  durationMs: number;
  errorClass?: string;
};

export function aiConfigurationStatus(env: NodeJS.ProcessEnv = process.env) {
  const configured = isUsableOpenAiApiKey(env.OPENAI_API_KEY);
  return {
    configured,
    provider: "openai" as const,
    model: env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
    transcriptionModel:
      env.OPENAI_TRANSCRIPTION_MODEL?.trim() || DEFAULT_TRANSCRIPTION_MODEL,
    pipelines: {
      publicChat: configured,
      coach: configured,
      classicTools: configured,
      advancedTools: configured,
      commandCenter: configured,
      roleplay: configured,
      intelligence: configured,
      transcription: configured,
    },
  };
}

export function classifyAiProviderError(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  const candidate = error as Error & { status?: number; code?: string };
  const code = String(candidate.code || "").toLowerCase();
  const message = candidate.message.toLowerCase();
  if (candidate.status === 401 || code.includes("api_key")) return "authentication";
  if (code === "insufficient_quota" || message.includes("quota") || message.includes("credit")) return "quota";
  if (candidate.status === 429 || code.includes("rate_limit")) return "rate_limit";
  if (candidate.status === 403 || code.includes("model_not_found") || message.includes("model")) return "access";
  if (message.includes("timeout") || code.includes("timeout")) return "timeout";
  return "provider_error";
}

function toneWav(): Buffer {
  const sampleRate = 16_000;
  const seconds = 0.35;
  const samples = Math.floor(sampleRate * seconds);
  const dataLength = samples * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);
  for (let index = 0; index < samples; index += 1) {
    const sample = Math.round(Math.sin((2 * Math.PI * 440 * index) / sampleRate) * 2_000);
    buffer.writeInt16LE(sample, 44 + index * 2);
  }
  return buffer;
}

async function timedProbe(
  id: AiProbeResult["id"],
  action: () => Promise<void>,
): Promise<AiProbeResult> {
  const startedAt = Date.now();
  try {
    await action();
    return { id, ok: true, durationMs: Date.now() - startedAt };
  } catch (error) {
    return {
      id,
      ok: false,
      durationMs: Date.now() - startedAt,
      errorClass: classifyAiProviderError(error),
    };
  }
}

async function executeLiveAiProviderProbe(env: NodeJS.ProcessEnv = process.env) {
  const configuration = aiConfigurationStatus(env);
  if (!configuration.configured) {
    return {
      ok: false,
      configuration,
      probes: [] as AiProbeResult[],
      errorClass: "not_configured",
    };
  }

  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    timeout: PROBE_TIMEOUT_MS,
    maxRetries: 2,
  });
  const model = configuration.model;
  const probes = await Promise.all([
    timedProbe("chat", async () => {
      const result = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: "Reply with READY." }],
        reasoning_effort: "minimal",
        max_completion_tokens: 256,
      });
      if (!result.choices[0]?.message?.content?.trim()) throw new Error("Empty chat completion");
    }),
    timedProbe("responses", async () => {
      const result = await client.responses.create({
        model,
        input: "Reply with READY.",
        reasoning: { effort: "minimal" },
        max_output_tokens: 256,
        store: false,
      });
      if (!result.output_text?.trim()) throw new Error("Empty response output");
    }),
    timedProbe("structured", async () => {
      const result = await client.responses.parse({
        model,
        input: "Return a JSON object whose status is ready.",
        reasoning: { effort: "minimal" },
        max_output_tokens: 256,
        store: false,
        text: { format: zodTextFormat(structuredProbeSchema, "ai_readiness") },
      });
      if (result.output_parsed?.status !== "ready") throw new Error("Invalid structured output");
    }),
    timedProbe("transcription", async () => {
      const file = await toFile(toneWav(), "readiness.wav", { type: "audio/wav" });
      await client.audio.transcriptions.create({
        file,
        model: configuration.transcriptionModel,
        response_format: "text",
      });
    }),
  ] satisfies Array<Promise<AiProbeResult>>);

  return {
    ok: probes.every((probe) => probe.ok),
    configuration,
    probes,
    checkedAt: new Date().toISOString(),
  };
}

type LiveProbeSnapshot = Awaited<ReturnType<typeof executeLiveAiProviderProbe>>;
let lastLiveProbe: LiveProbeSnapshot | null = null;
let activeProbe: Promise<LiveProbeSnapshot> | null = null;

export function aiProviderReadinessSnapshot(env: NodeJS.ProcessEnv = process.env) {
  const configuration = aiConfigurationStatus(env);
  return {
    ok: configuration.configured && lastLiveProbe?.ok === true,
    status: !configuration.configured
      ? "not_configured"
      : activeProbe
        ? "checking"
        : lastLiveProbe?.ok
          ? "ready"
          : lastLiveProbe
            ? "degraded"
            : "not_verified",
    provider: configuration.provider,
    pipelines: configuration.pipelines,
    lastProbe: lastLiveProbe,
  };
}

export async function runLiveAiProviderProbe(env: NodeJS.ProcessEnv = process.env) {
  if (activeProbe) return activeProbe;
  activeProbe = executeLiveAiProviderProbe(env).then((result) => {
    lastLiveProbe = result;
    return result;
  }).finally(() => {
    activeProbe = null;
  });
  return activeProbe;
}
