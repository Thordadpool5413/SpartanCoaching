import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  FileUp,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  buildConnectedToolInput,
  getSpartanAiToolConnections,
  getSpartanAiTool,
  type AiToolField,
  type AiToolSpec,
} from "@workspace/spartan-ai-tools";
import { consumeAiToolHandoff, stageAiToolHandoff } from "@/lib/aiToolHandoff";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { SEO } from "@/components/SEO";

type ApiErrorBody = {
  error?: { code?: string; message?: string; retryable?: boolean };
};

type Run = {
  id?: string;
  toolId: string;
  status?: string;
  output: unknown;
  reviewStatus?: string;
  durationMs?: number | null;
  createdAt: string;
  coverageSnapshotId?: string | null;
  watermark?: string;
  retention?: "ephemeral";
  recoverable?: boolean;
};

type CoverageSnapshot = {
  id: string;
  title: string;
  documentId: string;
  version: string;
  jurisdiction?: string | null;
  effectiveAt?: string | null;
};

class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(
      body.error?.code ?? `HTTP_${response.status}`,
      body.error?.message ?? "The request could not be completed.",
      response.status,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function inputToForm(
  tool: AiToolSpec,
  source: Record<string, unknown> = tool.exampleInput as Record<
    string,
    unknown
  >,
): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {};
  for (const field of tool.fields) {
    const value = source[field.key];
    if (field.kind === "boolean") values[field.key] = value !== false;
    else if (field.kind === "string-list")
      values[field.key] = Array.isArray(value) ? value.join("\n") : "";
    else if (field.kind === "json" || field.kind === "json-list")
      values[field.key] =
        value === undefined ? "" : JSON.stringify(value, null, 2);
    else values[field.key] = value === undefined ? "" : String(value);
  }
  return values;
}

function formToInput(
  tool: AiToolSpec,
  values: Record<string, string | boolean>,
): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const field of tool.fields) {
    const value = values[field.key];
    if (field.kind === "boolean") {
      input[field.key] = value === true;
      continue;
    }
    const text = String(value ?? "").trim();
    if (!text && !field.required) continue;
    if (field.kind === "number") input[field.key] = Number(text);
    else if (field.kind === "string-list")
      input[field.key] = text
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
    else if (field.kind === "json" || field.kind === "json-list")
      input[field.key] = JSON.parse(
        text || (field.kind === "json-list" ? "[]" : "{}"),
      );
    else input[field.key] = text;
  }
  return input;
}

function ResultValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">Not provided</span>;
  }
  if (typeof value === "string") {
    return <p className="whitespace-pre-wrap leading-7">{value}</p>;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="font-medium">{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0)
      return <span className="text-muted-foreground">None</span>;
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border border-border/60 bg-background/70 p-3"
          >
            <ResultValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {Object.entries(value as Record<string, unknown>).map(([key, child]) => (
        <div key={key}>
          <h3
            className={
              depth === 0
                ? "mb-2 text-base font-semibold"
                : "mb-1 text-sm font-semibold"
            }
          >
            {key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ")}
          </h3>
          <ResultValue value={child} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}

function ToolField({
  field,
  value,
  onChange,
}: {
  field: AiToolField;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required ? " *" : ""}
      </Label>
      {field.kind === "boolean" ? (
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
          <input
            id={field.key}
            type="checkbox"
            checked={value === true}
            onChange={(event) => onChange(event.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">Enabled</span>
        </label>
      ) : field.kind === "select" ? (
        <select
          id={field.key}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.kind === "text" ||
        field.kind === "string-list" ||
        field.kind === "json" ||
        field.kind === "json-list" ? (
        <Textarea
          id={field.key}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          rows={field.kind === "json" || field.kind === "json-list" ? 7 : 4}
          required={field.required}
        />
      ) : (
        <Input
          id={field.key}
          type={field.kind === "number" ? "number" : "text"}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      )}
    </div>
  );
}

function MfaPanel({ onVerified }: { onVerified: () => void }) {
  const [challenge, setChallenge] = useState<{
    challengeId: string;
    challengeToken: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function requestCode() {
    setBusy(true);
    setError("");
    try {
      setChallenge(
        await apiJson("/api/clinical/mfa/request", {
          method: "POST",
          body: "{}",
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Code could not be sent.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (!challenge) return;
    setBusy(true);
    setError("");
    try {
      await apiJson("/api/clinical/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ ...challenge, code }),
      });
      onVerified();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Code could not be verified.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-amber-500/40 bg-amber-500/5 p-5">
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-600" />
        <div className="flex-1">
          <h2 className="font-semibold">Clinical verification required</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A six-digit code verifies your clinical session for 15 minutes.
          </p>
          {!challenge ? (
            <Button className="mt-4" onClick={requestCode} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Email verification code
            </Button>
          ) : (
            <div className="mt-4 flex max-w-sm gap-2">
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ""))
                }
                placeholder="000000"
              />
              <Button onClick={verifyCode} disabled={busy || code.length !== 6}>
                Verify
              </Button>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </Card>
  );
}

export default function AiToolPage() {
  const { toolId = "" } = useParams<{ toolId: string }>();
  const [, navigate] = useLocation();
  const tool = getSpartanAiTool(toolId);
  const [values, setValues] = useState<Record<string, string | boolean>>(
    tool ? inputToForm(tool) : {},
  );
  const [run, setRun] = useState<Run | null>(null);
  const [history, setHistory] = useState<Run[]>([]);
  const [snapshots, setSnapshots] = useState<CoverageSnapshot[]>([]);
  const [snapshotId, setSnapshotId] = useState("");
  const [ephemeralSession, setEphemeralSession] = useState<{
    id: string;
    coverageSnapshotId: string;
    expiresAt: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);
  const [clinicalMode, setClinicalMode] = useState<"deidentified" | "phi">(
    "deidentified",
  );
  const [coverageRequired, setCoverageRequired] = useState(false);
  const [allowsDocumentUpload, setAllowsDocumentUpload] = useState(false);
  const [runtimeReady, setRuntimeReady] = useState(true);
  const [missingControls, setMissingControls] = useState<string[]>([]);
  const [confirmedDeidentified, setConfirmedDeidentified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tool) return;
    const handoff = consumeAiToolHandoff(tool.id);
    if (handoff) {
      setValues(
        inputToForm(
          tool,
          buildConnectedToolInput(
            handoff.sourceToolId,
            tool.id,
            handoff.output,
          ),
        ),
      );
      setRun(null);
      return;
    }
    setValues(inputToForm(tool));
  }, [tool?.id]);

  async function loadData() {
    if (!tool) return;
    setError("");
    try {
      if (tool.containsPhi) {
        const snapshotResponse = await apiJson<{
          snapshots: CoverageSnapshot[];
          operationMode: "deidentified" | "phi";
          required: boolean;
          allowsDocumentUpload: boolean;
          runtimeReady?: boolean;
          missingControls?: string[];
        }>("/api/clinical/coverage/snapshots");
        setSnapshots(snapshotResponse.snapshots);
        setClinicalMode(snapshotResponse.operationMode);
        setCoverageRequired(snapshotResponse.required);
        setAllowsDocumentUpload(snapshotResponse.allowsDocumentUpload);
        setRuntimeReady(snapshotResponse.runtimeReady !== false);
        setMissingControls(snapshotResponse.missingControls ?? []);
        setSnapshotId(
          (current) => current || snapshotResponse.snapshots[0]?.id || "",
        );
        setHistory([]);
        setNeedsMfa(false);
      } else {
        const historyResponse = await apiJson<{ runs: Run[] }>(
          `/api/ai-tools/${tool.id}/runs`,
        );
        setHistory(historyResponse.runs);
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        return;
      }
      if (
        caught instanceof ApiError &&
        caught.code === "CLINICAL_MFA_REQUIRED"
      ) {
        setNeedsMfa(true);
      } else {
        setError(
          caught instanceof Error
            ? caught.message
            : "Tool data could not be loaded.",
        );
      }
    }
  }

  useEffect(() => {
    void loadData();
  }, [tool?.id]);

  useEffect(() => {
    const sessionId = ephemeralSession?.id;
    if (!sessionId) return;
    return () => {
      void fetch(`/api/clinical/ephemeral-sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
        keepalive: true,
        headers: { "Cache-Control": "no-store" },
      });
    };
  }, [ephemeralSession?.id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!tool) return;
    setBusy(true);
    setError("");
    try {
      const input = formToInput(tool, values);
      if (tool.containsPhi) {
        const path =
          tool.id === "medical-record-lcd-verifier" && clinicalMode === "phi"
            ? `/api/clinical/ephemeral-sessions/${ephemeralSession?.id ?? ""}/finalize`
            : `/api/ai-tools/${tool.id}/ephemeral-runs`;
        if (
          tool.id === "medical-record-lcd-verifier" &&
          clinicalMode === "phi" &&
          !ephemeralSession
        ) {
          throw new Error("Upload at least one record before finalizing.");
        }
        const response = await apiJson<{ result: Run }>(path, {
          method: "POST",
          body: JSON.stringify({
            input,
            ...(tool.id === "medical-record-lcd-verifier" &&
            clinicalMode === "phi"
              ? {}
              : {
                  coverageSnapshotId: snapshotId || undefined,
                  confirmedDeidentified:
                    clinicalMode === "deidentified"
                      ? confirmedDeidentified
                      : undefined,
                }),
          }),
        });
        setRun(response.result);
        setEphemeralSession(null);
      } else {
        const response = await apiJson<{ run: Run }>(
          `/api/ai-tools/${tool.id}/runs`,
          {
            method: "POST",
            headers: { "Idempotency-Key": crypto.randomUUID() },
            body: JSON.stringify({ input }),
          },
        );
        setRun(response.run);
        setHistory((current) => [
          response.run,
          ...current.filter((item) => item.id !== response.run.id),
        ]);
      }
    } catch (caught) {
      if (
        caught instanceof ApiError &&
        caught.code === "CLINICAL_MFA_REQUIRED"
      ) {
        setNeedsMfa(true);
      }
      setError(caught instanceof Error ? caught.message : "Tool run failed.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadRecords(files: FileList | null) {
    if (
      !tool ||
      tool.id !== "medical-record-lcd-verifier" ||
      !files?.length ||
      !snapshotId
    )
      return;
    setUploading(true);
    setError("");
    try {
      let activeSession = ephemeralSession;
      if (!activeSession || activeSession.coverageSnapshotId !== snapshotId) {
        if (activeSession) {
          await apiJson(
            `/api/clinical/ephemeral-sessions/${activeSession.id}`,
            { method: "DELETE" },
          ).catch(() => undefined);
        }
        const created = await apiJson<{
          session: {
            id: string;
            coverageSnapshotId: string;
            expiresAt: string;
          };
        }>("/api/clinical/ephemeral-sessions", {
          method: "POST",
          body: JSON.stringify({ coverageSnapshotId: snapshotId }),
        });
        activeSession = created.session;
        setEphemeralSession(activeSession);
      }
      const extracted: string[] = [];
      for (const file of Array.from(files)) {
        const authorization = await apiJson<{
          documentToken: string;
          uploadUrl: string;
          requiredHeaders: Record<string, string>;
        }>(
          `/api/clinical/ephemeral-sessions/${activeSession.id}/documents/upload-url`,
          {
            method: "POST",
            body: JSON.stringify({
              contentType: file.type || "application/octet-stream",
              sizeBytes: file.size,
            }),
          },
        );
        const upload = await fetch(authorization.uploadUrl, {
          method: "PUT",
          headers: authorization.requiredHeaders,
          body: file,
        });
        if (!upload.ok) throw new Error(`Upload failed for ${file.name}.`);
        await apiJson(
          `/api/clinical/ephemeral-sessions/${activeSession.id}/documents/${authorization.documentToken}/complete`,
          {
            method: "POST",
            body: "{}",
          },
        );
        const extraction = await apiJson<{ text: string }>(
          `/api/clinical/ephemeral-sessions/${activeSession.id}/documents/${authorization.documentToken}/extract`,
          { method: "POST", body: "{}" },
        );
        extracted.push(`--- ${file.name} ---\n${extraction.text}`);
      }
      setValues((current) => ({
        ...current,
        recordText: [String(current.recordText ?? ""), ...extracted]
          .filter(Boolean)
          .join("\n\n"),
      }));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Document processing failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function copyResult() {
    if (!run?.output) return;
    await navigator.clipboard.writeText(
      JSON.stringify(
        tool?.containsPhi
          ? { watermark: run.watermark, result: run.output }
          : run.output,
        null,
        2,
      ),
    );
  }

  async function downloadResult() {
    if (!run?.output) return;
    setBusy(true);
    setError("");
    try {
      if (tool?.containsPhi) {
        const blob = new Blob(
          [
            JSON.stringify(
              {
                watermark: run.watermark,
                retention: "ephemeral",
                generatedAt: run.createdAt,
                result: run.output,
              },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        );
        const href = URL.createObjectURL(blob);
        try {
          const anchor = document.createElement("a");
          anchor.href = href;
          anchor.download = `${tool.id}-one-time-result.json`;
          anchor.click();
        } finally {
          URL.revokeObjectURL(href);
        }
        return;
      }
      if (!run.id) throw new Error("The saved result is unavailable.");
      const response = await fetch(`/api/ai-tool-runs/${run.id}/export`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(
          body.error?.message ?? "The result could not be exported.",
        );
      }
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `${tool?.id ?? "ai-tool"}-${run.id}.json`;
      anchor.click();
      URL.revokeObjectURL(href);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The result could not be exported.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!tool) {
    return (
      <FieldKitToolLayout title="Tool not found" showHowTo={false}>
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">AI tool not found</h1>
          <Link
            href="/tools/ai"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Return to the AI Tool Library
          </Link>
        </Card>
      </FieldKitToolLayout>
    );
  }

  return (
    <FieldKitToolLayout title={tool.name} showHowTo={false}>
      <SEO
        title={`${tool.name} | Spartan Coaching`}
        description={tool.description}
      />
      <Link
        href="/tools/ai"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        AI Tool Library
      </Link>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex gap-2">
            <Badge variant="outline">{tool.category}</Badge>
            {tool.containsPhi && (
              <Badge className="bg-amber-600">Clinical</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{tool.name}</h1>
          <p className="mt-3 leading-7 text-muted-foreground">
            {tool.description}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadData()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {needsMfa && <MfaPanel onVerified={() => void loadData()} />}

      {tool.containsPhi && clinicalMode === "phi" && !runtimeReady && (
        <Card className="mb-6 border-destructive/40 bg-destructive/5 p-5">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <h2 className="font-semibold text-foreground">
                PHI runtime is not fully configured
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                BAA gates may be set, but required infrastructure is still
                missing. Clinical runs stay fail-closed until every control is
                present.
              </p>
              {missingControls.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {missingControls.map((control) => (
                    <li key={control}>
                      <code className="text-xs">{control}</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <Card className="p-5 sm:p-7">
          <form onSubmit={submit} className="space-y-6">
            {tool.containsPhi && !needsMfa && (
              <div className="space-y-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  Ephemeral clinical workspace
                  {clinicalMode === "phi" && runtimeReady && (
                    <Badge variant="outline" className="ml-1 font-normal">
                      PHI operational
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {clinicalMode === "phi"
                    ? "Patient inputs and generated results are not saved. Closing, refreshing, or signing out permanently loses this work."
                    : "This live workspace accepts de-identified information only. Inputs and generated results are not saved, and qualified clinical review remains required."}
                </p>
                {clinicalMode === "deidentified" && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-500/30 bg-background/70 p-3">
                    <input
                      type="checkbox"
                      checked={confirmedDeidentified}
                      onChange={(event) =>
                        setConfirmedDeidentified(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <span className="text-sm leading-6">
                      I confirm this input contains no patient names, dates of
                      birth, record numbers, contact details, or other
                      identifying information.
                    </span>
                  </label>
                )}
                {coverageRequired && (
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>CMS coverage snapshot</Label>
                      <select
                        value={snapshotId}
                        onChange={(event) => {
                          setSnapshotId(event.target.value);
                          setRun(null);
                        }}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        required
                      >
                        <option value="">Select CMS evidence</option>
                        {snapshots.map((snapshot) => (
                          <option key={snapshot.id} value={snapshot.id}>
                            {snapshot.title} · v{snapshot.version}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {tool.id === "medical-record-lcd-verifier" &&
                  allowsDocumentUpload && (
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-amber-500/50 p-4 text-sm font-medium hover:bg-amber-500/10">
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileUp className="h-4 w-4" />
                      )}
                      {uploading
                        ? "Scanning and extracting…"
                        : "Upload PDF, JPEG, PNG, or text records"}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.txt"
                        multiple
                        className="sr-only"
                        disabled={uploading || !snapshotId}
                        onChange={(event) =>
                          void uploadRecords(event.target.files)
                        }
                      />
                    </label>
                  )}
              </div>
            )}

            {tool.fields.map((field) => (
              <ToolField
                key={field.key}
                field={field}
                value={
                  values[field.key] ?? (field.kind === "boolean" ? false : "")
                }
                onChange={(value) =>
                  setValues((current) => ({ ...current, [field.key]: value }))
                }
              />
            ))}

            {error && (
              <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={
                busy ||
                needsMfa ||
                (tool.containsPhi &&
                  clinicalMode === "phi" &&
                  !runtimeReady) ||
                (tool.containsPhi && coverageRequired && !snapshotId) ||
                (tool.containsPhi &&
                  clinicalMode === "deidentified" &&
                  !confirmedDeidentified)
              }
              className="w-full sm:w-auto"
            >
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run {tool.name}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Result
              </h2>
              {run?.output != null && (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={copyResult}
                    aria-label="Copy result"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => void downloadResult()}
                    aria-label="Download result"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {run?.output != null ? (
              <div className="mt-5">
                {tool.containsPhi && (
                  <div className="mb-5 rounded-lg border-2 border-amber-600 bg-amber-500/10 p-3 text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {run.watermark}
                  </div>
                )}
                <ResultValue value={run.output} />
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">
                    {tool.containsPhi
                      ? "one-time · not retained"
                      : (
                          run.reviewStatus ??
                          run.status ??
                          "completed"
                        ).replaceAll("_", " ")}
                  </Badge>
                  {run.durationMs != null && (
                    <span>{(run.durationMs / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Complete the form to generate a structured result.
              </p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Clock3 className="h-4 w-4" />
              {tool.containsPhi ? "No clinical history" : "Recent runs"}
            </h2>
            <div className="mt-4 space-y-2">
              {tool.containsPhi ? (
                <p className="text-sm text-muted-foreground">
                  Clinical inputs and results are never added to history. Local
                  exports are generated from this page and their Blob URLs are
                  immediately revoked.
                </p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No saved runs yet.
                </p>
              ) : (
                history.slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRun(item)}
                    className="w-full rounded-lg border border-border/60 p-3 text-left hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                      <Badge variant="outline">
                        {item.status ?? "completed"}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          {run?.output != null &&
            getSpartanAiToolConnections(tool.id).length > 0 && (
              <Card className="p-5">
                <h2 className="font-semibold">Continue this workflow</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prefill a compatible tool from this result. The handoff stays
                  in memory and is never written to browser storage.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {getSpartanAiToolConnections(tool.id).map((connection) => {
                    const target = getSpartanAiTool(connection.to);
                    if (!target) return null;
                    return (
                      <Button
                        key={connection.to}
                        variant="outline"
                        className="justify-start"
                        title={connection.description}
                        onClick={() => {
                          stageAiToolHandoff({
                            sourceToolId: tool.id,
                            targetToolId: connection.to,
                            output: run.output,
                          });
                          navigate(target.webPath);
                        }}
                      >
                        {connection.label}
                      </Button>
                    );
                  })}
                </div>
              </Card>
            )}
        </div>
      </div>
    </FieldKitToolLayout>
  );
}
