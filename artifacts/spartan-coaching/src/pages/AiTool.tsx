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
  Check,
  Clock3,
  Copy,
  Download,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  buildAiToolExperienceInput,
  buildConnectedToolInput,
  getAiToolExperience,
  getSpartanAiToolConnections,
  getSpartanAiTool,
  hydrateAiToolExperienceValues,
  initialAiToolExperienceValues,
  type AiToolExperienceContext,
  type AiToolExperienceField,
  type AiToolExperienceValue,
} from "@workspace/spartan-ai-tools";
import { consumeAiToolHandoff, stageAiToolHandoff } from "@/lib/aiToolHandoff";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { ToolResultPanel } from "@/components/ToolResultPanel";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";
import { CLINICAL_VAULT } from "@/lib/complianceCopy";

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

function errorNextSteps(code: string): { label: string; href?: string; retry?: boolean }[] {
  const upper = code.toUpperCase();
  if (
    upper.includes("PROVIDER_NOT_CONFIGURED") ||
    upper.includes("BAA") ||
    upper.includes("PHI_") ||
    upper.includes("RUNTIME")
  ) {
    return [
      { label: "Retry", retry: true },
      { label: "Contact support", href: "/contact" },
    ];
  }
  if (upper.includes("AUTH") || upper.includes("401") || upper.includes("403")) {
    return [
      { label: "Sign in", href: "/login" },
      { label: "Account", href: "/account" },
    ];
  }
  if (upper.includes("RATE") || upper.includes("TIMEOUT") || upper.includes("BUSY")) {
    return [{ label: "Try again", retry: true }];
  }
  return [
    { label: "Retry", retry: true },
    { label: "Back to library", href: "/tools/ai" },
  ];
}

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

type FormValue = AiToolExperienceValue;

function humanKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

type EmailOption = {
  id?: unknown;
  label?: unknown;
  subject?: unknown;
  body?: unknown;
  rationale?: unknown;
  previewText?: unknown;
};

function isEmailOption(value: unknown): value is EmailOption {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.subject === "string" && typeof record.body === "string";
}

function EmailOptionCard({ option, index }: { option: EmailOption; index: number }) {
  const [copied, setCopied] = useState(false);
  const subject = String(option.subject);
  const body = String(option.body);
  const title = typeof option.label === "string" && option.label.trim()
    ? option.label
    : `Email option ${index + 1}`;

  async function copyEmail() {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <article className="rounded-2xl border border-border/70 bg-background/80 p-5 space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
          {index + 1}
        </span>
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-primary">READY TO SEND</p>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
        </div>
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground">SUBJECT</p>
        <p className="mt-2 text-sm font-semibold text-foreground">{subject}</p>
      </div>
      <p className="whitespace-pre-wrap text-[15px] leading-7 text-foreground">{body}</p>
      {typeof option.rationale === "string" && option.rationale.trim() ? (
        <div className="border-t border-border/60 pt-4">
          <p className="text-[10px] font-bold tracking-[0.16em] text-primary">WHY THIS WORKS</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{option.rationale}</p>
        </div>
      ) : null}
      <Button type="button" onClick={() => void copyEmail()} className="w-full rounded-xl">
        {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
        {copied ? "Copied" : "Copy email"}
      </Button>
    </article>
  );
}

function formatResultForCopy(value: unknown, depth = 0): string {
  if (value == null) return "Not provided";
  if (isEmailOption(value)) return `Subject: ${String(value.subject)}\n\n${String(value.body)}`;
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        item != null && typeof item === "object"
          ? formatResultForCopy(item, depth + 1)
          : `• ${String(item)}`,
      )
      .join("\n");
  }
  return Object.entries(value as Record<string, unknown>)
    .map(([key, child]) => {
      const heading = `${"  ".repeat(depth)}${humanKey(key)}`;
      const body = formatResultForCopy(child, depth + 1);
      return `${heading}\n${body}`;
    })
    .join("\n\n");
}

function ResultValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">Not provided</span>;
  }
  if (typeof value === "string") {
    return (
      <p className="whitespace-pre-wrap leading-7 text-foreground/95">{value}</p>
    );
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="font-semibold tabular-nums">{String(value)}</span>;
  }
  if (isEmailOption(value)) return <EmailOptionCard option={value} index={0} />;
  if (Array.isArray(value)) {
    if (value.length === 0)
      return <span className="text-muted-foreground">None</span>;
    if (value.every(isEmailOption)) {
      return (
        <div className="space-y-4">
          {value.map((option, index) => (
            <EmailOptionCard key={String(option.id ?? index)} option={option} index={index} />
          ))}
        </div>
      );
    }
    // String lists as field bullets
    if (value.every((item) => typeof item === "string")) {
      return (
        <ul className="space-y-2">
          {value.map((item, index) => (
            <li
              key={index}
              className="flex gap-2 text-sm leading-relaxed rounded-lg border border-border/50 bg-background/60 px-3 py-2"
            >
              <span className="text-primary font-bold shrink-0">·</span>
              <span>{item as string}</span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-border/60 bg-background/70 p-4"
          >
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
              Item {index + 1}
            </p>
            <ResultValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={depth === 0 ? "space-y-5" : "space-y-3"}>
      {Object.entries(value as Record<string, unknown>).map(([key, child]) => (
        <div
          key={key}
          className={
            depth === 0
              ? "rounded-xl border border-border/70 bg-muted/20 p-4"
              : undefined
          }
        >
          <h3
            className={
              depth === 0
                ? "mb-2 text-sm font-bold tracking-wide text-primary uppercase"
                : "mb-1 text-sm font-semibold text-foreground"
            }
          >
            {humanKey(key)}
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
  field: AiToolExperienceField;
  value: FormValue;
  onChange: (value: FormValue) => void;
}) {
  const options = field.options ?? [];
  const selectedValues = Array.isArray(value) ? value : [];
  const initialCustom =
    field.kind === "multi-choice"
      ? selectedValues.find((item) => !options.includes(item)) ?? ""
      : typeof value === "string" && value && !options.includes(value)
        ? value
        : "";
  const [otherOpen, setOtherOpen] = useState(Boolean(initialCustom));
  const [otherValue, setOtherValue] = useState(initialCustom);

  const updateOther = (next: string) => {
    const previous = otherValue;
    setOtherValue(next);
    if (field.kind === "multi-choice") {
      onChange([
        ...selectedValues.filter((item) => item !== previous && options.includes(item)),
        ...(next.trim() ? [next] : []),
      ]);
    } else {
      onChange(next);
    }
  };

  if (field.kind === "single-choice" || field.kind === "multi-choice") {
    return (
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">
          {field.label}
          {field.required ? " *" : ""}
        </legend>
        {field.helper && <p className="text-sm text-muted-foreground">{field.helper}</p>}
        <div className="flex flex-wrap gap-2" role={field.kind === "single-choice" ? "radiogroup" : "group"}>
          {options.map((option) => {
            const selected =
              field.kind === "multi-choice"
                ? selectedValues.includes(option)
                : value === option;
            return (
              <button
                key={option}
                type="button"
                role={field.kind === "single-choice" ? "radio" : "checkbox"}
                aria-checked={selected}
                onClick={() => {
                  setOtherOpen(false);
                  setOtherValue("");
                  if (field.kind === "multi-choice") {
                    onChange(
                      selected
                        ? selectedValues.filter((item) => item !== option)
                        : [...selectedValues, option],
                    );
                  } else {
                    onChange(option);
                  }
                }}
                className={cn(
                  "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/60",
                )}
              >
                {option}
              </button>
            );
          })}
          {field.allowOther && (
            <button
              type="button"
              onClick={() => {
                setOtherOpen(true);
                if (field.kind === "single-choice") onChange(otherValue);
              }}
              className={cn(
                "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition",
                otherOpen
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary/60",
              )}
            >
              Other
            </button>
          )}
        </div>
        {otherOpen && (
          <Input
            aria-label={`Other ${field.label}`}
            value={otherValue}
            onChange={(event) => updateOther(event.target.value)}
            placeholder="Enter your own response"
            autoFocus
          />
        )}
      </fieldset>
    );
  }

  const multiline = field.kind === "long-text";
  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required ? " *" : ""}
      </Label>
      {field.helper && <p className="text-sm text-muted-foreground">{field.helper}</p>}
      {multiline ? (
        <Textarea
          id={field.key}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          rows={5}
          required={field.required}
        />
      ) : (
        <Input
          id={field.key}
          type={field.kind === "number" ? "number" : "text"}
          min={field.minimum}
          max={field.maximum}
          value={String(value ?? "")}
          onChange={(event) =>
            onChange(field.kind === "number" ? Number(event.target.value) : event.target.value)
          }
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
  const experience = tool ? getAiToolExperience(tool.id) : null;
  const [values, setValues] = useState<Record<string, FormValue>>(
    tool ? initialAiToolExperienceValues(tool.id) : {},
  );
  const [run, setRun] = useState<Run | null>(null);
  const [experienceContext, setExperienceContext] = useState<AiToolExperienceContext>({});
  const [history, setHistory] = useState<Run[]>([]);
  const [busy, setBusy] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progressStage, setProgressStage] = useState(0);
  const [confirmedDeidentified, setConfirmedDeidentified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tool) return;
    const handoff = consumeAiToolHandoff(tool.id);
    if (handoff) {
      setValues(
        hydrateAiToolExperienceValues(
          tool.id,
          buildConnectedToolInput(handoff.sourceToolId, tool.id, handoff.output),
        ),
      );
      setRun(null);
      return;
    }
    setValues(initialAiToolExperienceValues(tool.id));
  }, [tool?.id]);

  useEffect(() => {
    if (!busy || !experience) {
      setElapsedSeconds(0);
      setProgressStage(0);
      return;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setElapsedSeconds(elapsed);
      setProgressStage(Math.min(experience.progressStages.length - 1, Math.floor(elapsed / 4)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [busy, experience]);

  async function loadData() {
    if (!tool) return;
    setError("");
    try {
      if (tool.containsPhi) {
        await apiJson("/api/clinical/coverage/snapshots");
        setHistory([]);
      } else {
        const historyResponse = await apiJson<{ runs: Run[] }>(
          `/api/ai-tools/${tool.id}/runs`,
        );
        const savedRuns = historyResponse.runs ?? [];
        setHistory(savedRuns);
        if (tool.id === "content-recommender" || tool.id === "content-gap-analyzer") {
          const [articleResponse, podcastResponse, resourceResponse] = await Promise.all([
            apiJson<{ articles?: Array<Record<string, unknown>> }>("/api/articles"),
            apiJson<{ podcasts?: Array<Record<string, unknown>> }>("/api/podcasts"),
            apiJson<{ resources?: Array<Record<string, unknown>> }>("/api/resources"),
          ]);
          setExperienceContext({
            contentCatalog: [
              ...(articleResponse.articles ?? []).map((item) => ({ ...item, contentType: "article" })),
              ...(podcastResponse.podcasts ?? []).map((item) => ({ ...item, contentType: "audio" })),
              ...(resourceResponse.resources ?? []).map((item) => ({ ...item, contentType: "resource" })),
            ],
            interactionHistory: savedRuns.map((item) => ({ toolId: tool.id, status: item.status, createdAt: item.createdAt })),
            usageMetrics: savedRuns.map((item) => ({ toolId: tool.id, completion: item.status ?? "completed", createdAt: item.createdAt })),
          });
        }
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        return;
      }
      setError(
        caught instanceof Error
          ? caught.message
          : "Tool data could not be loaded.",
      );
    }
  }

  useEffect(() => {
    void loadData();
  }, [tool?.id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!tool || !experience) return;
    setBusy(true);
    setError("");
    try {
      const input = tool.inputSchema.parse(buildAiToolExperienceInput(tool.id, values, experienceContext)) as Record<string, unknown>;
      if (tool.containsPhi) {
        const response = await apiJson<{ result: Run }>(
          `/api/ai-tools/${tool.id}/ephemeral-runs`,
          {
          method: "POST",
          body: JSON.stringify({
            input,
            confirmedDeidentified,
          }),
          },
        );
        setRun(response.result);
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
      setError(caught instanceof Error ? caught.message : "Tool run failed.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadResult() {
    if (!run?.output) return;
    setBusy(true);
    setError("");
    try {
      if (tool?.containsPhi) {
        const blob = new Blob(
          [
            [
              experience?.title ?? tool.name,
              run.watermark,
              "",
              formatResultForCopy(run.output),
              "",
              "Suggested guidance from Spartan Coaching. Qualified review remains required.",
            ].filter(Boolean).join("\n"),
          ],
          { type: "text/plain;charset=utf-8" },
        );
        const href = URL.createObjectURL(blob);
        try {
          const anchor = document.createElement("a");
          anchor.href = href;
          anchor.download = `${tool.id}-one-time-result.txt`;
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

  if (!tool || !experience) {
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

  const missingRequired = experience.fields.some((field) => {
    if (!field.required) return false;
    const value = values[field.key];
    return Array.isArray(value)
      ? value.length === 0
      : String(value ?? "").trim().length === 0;
  });
  const runDisabled =
    busy ||
    missingRequired ||
    (tool.containsPhi && !confirmedDeidentified);

  const errorCode =
    error.match(/\b[A-Z][A-Z0-9_]{3,}\b/)?.[0] ??
    (error.toLowerCase().includes("not configured")
      ? "PROVIDER_NOT_CONFIGURED"
      : "UNKNOWN");

  return (
    <FieldKitToolLayout
      title={tool.name}
      showHowTo={false}
      showChrome={!tool.containsPhi}
    >
      <SEO
        title={`${tool.name} | Spartan Coaching`}
        description={tool.description}
      />
      <Link
        href="/tools/ai"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold"
      >
        <ArrowLeft className="h-4 w-4" />
        {tool.containsPhi ? "Clinical vault" : "Advanced library"}
      </Link>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="outline">{tool.category}</Badge>
            {tool.containsPhi && (
              <Badge className="gap-1 bg-amber-600 hover:bg-amber-600">
                <ShieldCheck className="h-3 w-3" />
                Clinical vault
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight text-foreground">
            {experience.title ?? tool.name}
          </h1>
          <p className="mt-3 leading-7 text-muted-foreground">
            {experience.promise}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadData()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="mt-2 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <Card
          className={cn(
            "p-5 sm:p-7",
            tool.containsPhi && "border-amber-500/20",
          )}
        >
          <form id="ai-tool-run-form" onSubmit={submit} className="space-y-6">
            <div className="space-y-1 border-b border-border/60 pb-4">
              <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
                1 · Inputs
              </p>
              <p className="text-sm text-muted-foreground">
                Complete required fields, then run. Results appear on the right
                (below on mobile).
              </p>
            </div>
            {tool.containsPhi && (
              <div className="space-y-5 rounded-xl border border-amber-500/35 bg-gradient-to-br from-amber-500/[0.08] to-transparent p-4">
                <div className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  Deidentified guidance workspace
                  <Badge variant="outline" className="font-normal">
                    Approval required
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  This workspace accepts deidentified information only. Do not enter patient names, dates, record numbers, contact details, or documents. Outputs are suggestions and require medical director, compliance, or both to approve them.
                </p>
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
                    I confirm this input is deidentified and contains no patient documents.
                  </span>
                </label>
              </div>
            )}

            {experience.fields.map((field) => (
              <ToolField
                key={field.key}
                field={field}
                value={
                  values[field.key] ?? (field.kind === "multi-choice" ? [] : "")
                }
                onChange={(value) =>
                  setValues((current) => ({ ...current, [field.key]: value }))
                }
              />
            ))}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3"
              >
                <div className="flex gap-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="font-medium leading-relaxed">{error}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {errorNextSteps(errorCode).map((step) =>
                    step.href ? (
                      <Button key={step.label} asChild variant="outline" size="sm">
                        <Link href={step.href}>{step.label}</Link>
                      </Button>
                    ) : (
                      <Button
                        key={step.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setError("");
                          if (step.retry) void loadData();
                        }}
                      >
                        {step.label}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            )}

            <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-7 mt-2 border-t border-border/80 bg-card/95 px-5 py-3 sm:px-7 backdrop-blur-sm sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              <Button
                type="submit"
                size="lg"
                disabled={runDisabled}
                className="w-full sm:w-auto font-bold min-h-12"
                data-testid="ai-tool-run"
              >
{busy ? (
                  <span className="flex flex-col items-center gap-1" role="status" aria-live="polite">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {experience.progressStages[progressStage]}
                    </span>
                    <span className="text-xs opacity-80">
                      {elapsedSeconds < 8 ? "Building your result" : `Still working · ${elapsedSeconds}s`}
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Play className="mr-2 h-4 w-4" />
                    {experience.submitLabel}
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6" id="ai-tool-result">
          <div className="space-y-1 mb-1">
            <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
              2 · Result
            </p>
          </div>
          <ToolResultPanel
            title={run?.output != null ? experience.resultTitle : "Your result will appear here"}
            loading={busy}
            empty={!busy && run?.output == null}
            copyText={
              run?.output != null ? formatResultForCopy(run.output) : undefined
            }
            disclaimer={
              tool.containsPhi
                ? run?.watermark || CLINICAL_VAULT.runWatermark
                : "Field-ready draft — review before use with referral partners or families."
            }
            footer={
              run?.output != null ? (
                <div className="flex flex-wrap items-center gap-2">
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
                    <span className="text-xs text-muted-foreground">
                      {(run.durationMs / 1000).toFixed(1)}s
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void downloadResult()}
                    className="ml-auto"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              ) : undefined
            }
          >
            {run?.output != null && (
              <>
                {tool.containsPhi && run.watermark && (
                  <div className="mb-5 rounded-lg border-2 border-amber-600 bg-amber-500/10 p-3 text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {run.watermark}
                  </div>
                )}
                <ResultValue value={run.output} />
              </>
            )}
          </ToolResultPanel>

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
