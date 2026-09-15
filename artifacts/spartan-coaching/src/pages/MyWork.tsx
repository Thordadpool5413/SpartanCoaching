import { AccentText } from "@/components/AccentText";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  FileText,
  RefreshCw,
  Shield,
  Smartphone,
  Crosshair,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { StateBlock } from "@/components/StateBlock";
import { loadMemberWork, type MemberWorkItem } from "@/lib/memberWorkClient";

type ToolDraft = { value: Record<string, string>; updatedAt: string };
type ToolResult = { value: string; updatedAt: string };
type CalculatorReport = {
  id: string;
  kind: "activity" | "roi" | "rep-cost" | "branch";
  title: string;
  summary: string;
  report: string;
  createdAt: string;
  updatedAt: string;
};
type DownloadRecord = {
  sourceUrl: string;
  title: string;
  kind: "article" | "audio" | "resource";
  description?: string;
  updatedAt: string;
};
type ContinuityResponse = {
  payload: {
    schemaVersion: 1;
    toolDrafts: Record<string, ToolDraft>;
    toolResults: Record<string, ToolResult>;
    calculatorReports: Record<string, CalculatorReport>;
    downloads: Record<string, DownloadRecord>;
  };
  commitment: { value: string; updatedAt: string } | null;
};
type MemberSyncRecord = {
  recordType: "commitment" | "tool_draft" | "tool_result" | "calculator_report" | "library_download";
  recordId: string;
  payload: Record<string, unknown>;
  clientUpdatedAt: string;
  updatedAt: string;
  isDeleted: boolean;
};
type MemberSyncResponse = { records?: MemberSyncRecord[]; serverTime?: string };
type ResourceWork = {
  id: number;
  resourceKey: string;
  title: string;
  status: "draft" | "completed";
  updatedAt: string;
};

const TOOL_ROUTES: Record<string, { label: string; href: string }> = {
  objection: { label: "Objection Handler", href: "/tools/objections" },
  playbook: { label: "Playbook Generator", href: "/tools/playbooks" },
  weekly: { label: "Weekly Plan Builder", href: "/tools/weekly-plan-builder" },
  cold: { label: "Cold Call Script", href: "/tools/cold-call-script" },
  email: { label: "Email Templates", href: "/tools/email-templates" },
  research: { label: "Grounded Research", href: "/tools/research" },
};

const CALCULATOR_ROUTES: Record<CalculatorReport["kind"], string> = {
  activity: "/tools/activity-calculator",
  roi: "/tools/roi-calculator",
  "rep-cost": "/tools/rep-cost-calculator",
  branch: "/tools/branch-profitability",
};

const RESOURCE_ROUTES: Record<string, string> = {
  "weekly-plan": "/resources/weekly-plan",
};

function newestFirst<T extends { updatedAt: string }>(items: T[]) {
  return items.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently updated" : date.toLocaleString();
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Convert the record-based, PHI-resistant sync contract into the sections rendered by My Work. */
export function normalizeMemberSync(response: MemberSyncResponse): ContinuityResponse {
  const continuity: ContinuityResponse = {
    payload: {
      schemaVersion: 1,
      toolDrafts: {},
      toolResults: {},
      calculatorReports: {},
      downloads: {},
    },
    commitment: null,
  };

  for (const record of response.records ?? []) {
    if (!record || record.isDeleted || !record.payload) continue;
    const updatedAt = record.clientUpdatedAt || record.updatedAt;

    if (record.recordType === "commitment" && record.recordId === "current") {
      const value = asText(record.payload.value);
      if (value) continuity.commitment = { value, updatedAt };
      continue;
    }
    if (record.recordType === "tool_draft") {
      const draft = record.payload.draft;
      if (draft && typeof draft === "object" && !Array.isArray(draft)) {
        continuity.payload.toolDrafts[record.recordId] = {
          value: Object.fromEntries(
            Object.entries(draft).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
          ),
          updatedAt,
        };
      }
      continue;
    }
    if (record.recordType === "tool_result") {
      const value = asText(record.payload.result);
      if (value) continuity.payload.toolResults[record.recordId] = { value, updatedAt };
      continue;
    }
    if (record.recordType === "calculator_report") {
      const kind = record.payload.kind;
      if (kind !== "activity" && kind !== "roi" && kind !== "rep-cost" && kind !== "branch") continue;
      const id = asText(record.payload.id) || record.recordId.replace(/^calc:/, "");
      continuity.payload.calculatorReports[record.recordId] = {
        id,
        kind,
        title: asText(record.payload.title) || "Saved calculator report",
        summary: asText(record.payload.summary),
        report: asText(record.payload.report),
        createdAt: asText(record.payload.createdAt) || updatedAt,
        updatedAt,
      };
      continue;
    }
    if (record.recordType === "library_download") {
      const sourceUrl = asText(record.payload.sourceUrl);
      const kind = record.payload.kind;
      if (!sourceUrl || (kind !== "article" && kind !== "audio" && kind !== "resource")) continue;
      continuity.payload.downloads[record.recordId] = {
        sourceUrl,
        title: asText(record.payload.title) || "Saved library item",
        kind,
        description: asText(record.payload.description),
        updatedAt,
      };
    }
  }
  return continuity;
}

export default function MyWork() {
  const [continuity, setContinuity] = useState<ContinuityResponse | null>(null);
  const [resourceWork, setResourceWork] = useState<ResourceWork[]>([]);
  const [memberWork, setMemberWork] = useState<MemberWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setWarning("");

    const [continuityResult, resourceResult, memberWorkResult] = await Promise.allSettled([
      fetch("/api/v1/member-sync", { credentials: "include" }).then(async (response) => {
        if (!response.ok) throw new Error("Saved tool continuity is unavailable.");
        return normalizeMemberSync(await response.json() as MemberSyncResponse);
      }),
      fetch("/api/v1/resource-work", { credentials: "include" }).then(async (response) => {
        if (!response.ok) throw new Error("Interactive resource work is unavailable.");
        return response.json() as Promise<{ items?: ResourceWork[] }>;
      }),
      loadMemberWork(),
    ]);

    if (continuityResult.status === "fulfilled") setContinuity(continuityResult.value);
    else setContinuity(null);
    if (resourceResult.status === "fulfilled") setResourceWork(resourceResult.value.items ?? []);
    else setResourceWork([]);
    if (memberWorkResult.status === "fulfilled") setMemberWork(memberWorkResult.value);

    if (continuityResult.status === "rejected" && resourceResult.status === "rejected") {
      setError("Your saved work could not be loaded.");
    } else if (continuityResult.status === "rejected") {
      setWarning("Saved tool results are temporarily unavailable. Your resource work is still ready below.");
    } else if (resourceResult.status === "rejected") {
      setWarning("Interactive resource work is temporarily unavailable. Your other saved work is still ready below.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reports = useMemo(
    () => newestFirst(Object.values(continuity?.payload.calculatorReports ?? {})),
    [continuity],
  );
  const drafts = useMemo(
    () => newestFirst(Object.entries(continuity?.payload.toolDrafts ?? {}).map(([id, item]) => ({ id, ...item }))),
    [continuity],
  );
  const results = useMemo(
    () => newestFirst(Object.entries(continuity?.payload.toolResults ?? {}).map(([id, item]) => ({ id, ...item }))),
    [continuity],
  );
  const downloads = useMemo(
    () => newestFirst(Object.values(continuity?.payload.downloads ?? {})),
    [continuity],
  );
  const savedCount = reports.length + drafts.length + results.length + downloads.length + resourceWork.length + memberWork.length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12" data-testid="page-my-work">
      <SEO title="My Work | Spartan Coaching" noIndex />
      <header className="mb-10 border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase font-display"><AccentText>My Work</AccentText></h1>
          <p className="mt-2 text-[13px] font-mono tracking-widest text-muted-foreground uppercase leading-relaxed max-w-2xl">
            Recent activity and saved field resources. Secure continuity across iPhone and Web.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="rounded-none uppercase tracking-widest text-[10px] font-bold h-10">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Sync iPhone work
        </Button>
      </header>

      {loading ? (
        <StateBlock variant="loading" title="Loading your work" description="Syncing cross-device continuity..." />
      ) : error ? (
        <StateBlock variant="error" title="My Work is temporarily unavailable" description={error} action={{ label: "Try again", onClick: () => void load() }} />
      ) : (
        <>
          {warning ? (
            <div className="mb-6" data-testid="my-work-partial-warning">
              <StateBlock variant="warning" title="Some saved work is still syncing" description={warning} action={{ label: "Try again", onClick: () => void load() }} />
            </div>
          ) : null}
          <section className="grid gap-4 md:grid-cols-2">
            <Link href="/tools/sales-workflow" className="block">
              <Card className="h-full border-primary/25 p-6 transition hover:border-primary hover:shadow-md bg-primary/5">
                <Crosshair className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-xl font-black text-primary"><AccentText>Continue Command Center</AccentText></h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {continuity?.commitment?.value || "Resume your account preparation and execution plan."}
                </p>
                <span className="mt-5 inline-flex items-center text-sm font-bold text-primary">Open Command Center <ArrowRight className="ml-2 h-4 w-4" /></span>
              </Card>
            </Link>
            <Link href="/my-work/elite-outputs" className="block">
              <Card className="h-full border-primary/25 p-6 transition hover:border-primary hover:shadow-md">
                <Shield className="h-6 w-6 text-highlight" />
                <h2 className="mt-4 text-xl font-black"><AccentText>Saved Elite outputs</AccentText></h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Review completed advanced, nonclinical tool results and reopen the tool that created them.</p>
                <span className="mt-5 inline-flex items-center text-sm font-bold text-highlight">Open Elite outputs <ArrowRight className="ml-2 h-4 w-4" /></span>
              </Card>
            </Link>
          </section>

          <WorkSection title="Interactive resources" empty="No interactive resource work has been saved yet.">
            {newestFirst([...resourceWork]).map((item) => (
              <WorkLink key={item.id} href={RESOURCE_ROUTES[item.resourceKey] ?? "/resources"} icon={<BookOpen className="h-5 w-5" />} title={item.title} meta={`${item.status === "completed" ? "Completed" : "Draft"} · ${dateLabel(item.updatedAt)}`} />
            ))}
          </WorkSection>

          <WorkSection title="Shared field work" empty="Saved tool results and next actions from web or iPhone will appear here.">
            {memberWork.map((item) => (
              <WorkLink
                key={item.id}
                href={item.nextAction?.href || TOOL_ROUTES[item.toolId]?.href || "/tools"}
                icon={item.status === "completed" ? <Shield className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                title={item.title}
                description={item.nextAction?.title || "Resume this saved field-work item."}
                meta={`${item.status === "completed" ? "Completed" : item.status === "failed" ? "Needs retry" : "Draft"} · ${dateLabel(item.updatedAt)}`}
              />
            ))}
          </WorkSection>

          <WorkSection title="Calculator reports" empty="Saved iPhone calculator reports will appear here after continuity sync.">
            {reports.map((report) => (
              <WorkLink key={report.id} href={CALCULATOR_ROUTES[report.kind]} icon={<Calculator className="h-5 w-5" />} title={report.title} description={report.summary} meta={dateLabel(report.updatedAt)} />
            ))}
          </WorkSection>

          <WorkSection title="Tool drafts and results" empty="Approved nonclinical tool work will appear here when it is safe to sync.">
            {[...drafts.map((item) => ({ ...item, kind: "Draft" })), ...results.map((item) => ({ ...item, kind: "Result" }))]
              .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
              .map((item) => {
                const destination = TOOL_ROUTES[item.id] ?? { label: item.id, href: "/tools" };
                return <WorkLink key={`${item.kind}-${item.id}`} href={destination.href} icon={<FileText className="h-5 w-5" />} title={destination.label} meta={`${item.kind} · ${dateLabel(item.updatedAt)}`} />;
              })}
          </WorkSection>

          <WorkSection title="Library continuity" empty="Library items saved on iPhone will appear here so you can find the source again.">
            {downloads.map((item) => (
              <WorkLink key={item.sourceUrl} href="/portal/learn" icon={<BookOpen className="h-5 w-5" />} title={item.title} description={item.description} meta={`${item.kind} · ${dateLabel(item.updatedAt)}`} />
            ))}
          </WorkSection>

          {savedCount === 0 ? (
            <div className="mt-8">
              <StateBlock variant="empty" title="Your next piece of work starts in Tools" description="Build a plan, run a calculator, use an interactive resource, or complete an Elite tool. Saved continuity returns here." action={{ label: "Open Tools", href: "/tools" }} />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function WorkSection({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold uppercase tracking-tight text-foreground font-display mb-2"><AccentText>{title}</AccentText></h2>
      {items.length ? (
        <div className="flex flex-col border-t border-border">{children}</div>
      ) : (
        <div className="rounded-none border border-border/70 bg-card p-6 shadow-sm"><p className="text-sm text-muted-foreground">{empty}</p></div>
      )}
    </section>
  );
}

function WorkLink({ href, icon, title, description, meta }: { href: string; icon: ReactNode; title: string; description?: string; meta: string }) {
  return (
    <Link href={href} className="block group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-border bg-card hover:bg-muted/30 transition-colors min-h-24">
        <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded-none border border-border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-muted text-foreground">
                 {meta.split(' · ')[0]}
              </span>
           </div>
           <h3 className="text-[15px] font-bold text-foreground truncate"><AccentText>{title}</AccentText></h3>
           {description ? <p className="text-[13px] text-muted-foreground truncate mt-0.5 max-w-2xl">{description}</p> : null}
           <p className="text-[11px] text-muted-foreground truncate font-mono uppercase tracking-wide mt-1.5">{meta.split(' · ')[1] || meta}</p>
        </div>
        <span className="inline-flex min-h-9 shrink-0 items-center rounded-md border border-border px-3 text-xs font-bold text-foreground transition-colors group-hover:border-primary/40 group-hover:bg-primary/5">
          Open <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
