import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  FileText,
  RefreshCw,
  Shield,
  Smartphone,
  Target,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";

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

export default function MyWork() {
  const [continuity, setContinuity] = useState<ContinuityResponse | null>(null);
  const [resourceWork, setResourceWork] = useState<ResourceWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setWarning("");

    const [continuityResult, resourceResult] = await Promise.allSettled([
      fetch("/api/v1/member-continuity", { credentials: "include" }).then(async (response) => {
        if (!response.ok) throw new Error("Saved tool continuity is unavailable.");
        return response.json() as Promise<ContinuityResponse>;
      }),
      fetch("/api/v1/resource-work", { credentials: "include" }).then(async (response) => {
        if (!response.ok) throw new Error("Interactive resource work is unavailable.");
        return response.json() as Promise<{ items?: ResourceWork[] }>;
      }),
    ]);

    if (continuityResult.status === "fulfilled") setContinuity(continuityResult.value);
    else setContinuity(null);
    if (resourceResult.status === "fulfilled") setResourceWork(resourceResult.value.items ?? []);
    else setResourceWork([]);

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
  const savedCount = reports.length + drafts.length + results.length + downloads.length + resourceWork.length;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8" data-testid="page-my-work">
      <SEO title="My Work | Hospice Sales Pro" description="Resume saved Hospice Sales Pro work from web or iPhone." />
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Saved continuity</p>
            <h1 className="text-4xl font-display font-black tracking-tight sm:text-5xl">My Work</h1>
            <p className="max-w-2xl text-muted-foreground leading-7">
              Resume approved work from the website or iPhone without rebuilding your thinking.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading} className="min-h-11">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{savedCount} saved items</Badge>
          <Badge variant="outline"><Smartphone className="mr-1 h-3 w-3" /> Same account as iPhone</Badge>
          <Badge variant="outline"><Shield className="mr-1 h-3 w-3" /> Nonclinical continuity only</Badge>
        </div>
      </header>

      {loading ? (
        <Card className="p-10 text-center text-muted-foreground">Loading your work…</Card>
      ) : error ? (
        <Card className="space-y-4 p-8 text-center" role="alert">
          <p className="font-bold">My Work is temporarily unavailable</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button type="button" onClick={() => void load()}>Try again</Button>
        </Card>
      ) : (
        <>
          {warning ? (
            <Card className="flex flex-col gap-4 border-amber-500/30 bg-amber-500/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between" role="status" data-testid="my-work-partial-warning">
              <div><p className="font-bold">Some saved work is still syncing</p><p className="mt-1 text-sm text-muted-foreground">{warning}</p></div>
              <Button type="button" variant="outline" onClick={() => void load()} className="shrink-0">Try again</Button>
            </Card>
          ) : null}
          <section className="grid gap-4 md:grid-cols-2">
            <Link href="/my-work/elite-outputs" className="block">
              <Card className="h-full border-primary/25 p-6 transition hover:border-primary hover:shadow-md">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-xl font-black">Saved Elite outputs</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Review completed advanced, nonclinical tool results and reopen the tool that created them.</p>
                <span className="mt-5 inline-flex items-center text-sm font-bold text-primary">Open Elite outputs <ArrowRight className="ml-2 h-4 w-4" /></span>
              </Card>
            </Link>
            <Link href="/portal/coach" className="block">
              <Card className="h-full p-6 transition hover:border-primary hover:shadow-md">
                <Target className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-xl font-black">Current commitment</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {continuity?.commitment?.value || "Open Coach and make one clear commitment for the next field action."}
                </p>
                <span className="mt-5 inline-flex items-center text-sm font-bold text-primary">Open Coach <ArrowRight className="ml-2 h-4 w-4" /></span>
              </Card>
            </Link>
          </section>

          <WorkSection title="Interactive resources" empty="No interactive resource work has been saved yet.">
            {newestFirst([...resourceWork]).map((item) => (
              <WorkLink key={item.id} href={RESOURCE_ROUTES[item.resourceKey] ?? "/resources"} icon={<BookOpen className="h-5 w-5" />} title={item.title} meta={`${item.status === "completed" ? "Completed" : "Draft"} · ${dateLabel(item.updatedAt)}`} />
            ))}
          </WorkSection>

          <WorkSection title="Calculator reports" empty="Saved iPhone calculator reports will appear here after continuity sync.">
            {reports.map((report) => (
              <WorkLink key={report.id} href={CALCULATOR_ROUTES[report.kind]} icon={<Calculator className="h-5 w-5" />} title={report.title} description={report.summary} meta={dateLabel(report.updatedAt)} />
            ))}
          </WorkSection>

          <WorkSection title="Tool drafts and results" empty="Start a supported tool on iPhone and its synced draft or result will appear here.">
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
            <Card className="p-10 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-4 text-xl font-black">Your next piece of work starts in Tools</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Build a plan, run a calculator, use an interactive resource, or complete an Elite tool. Saved continuity returns here.</p>
              <Button asChild className="mt-5"><Link href="/tools">Open Tools</Link></Button>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

function WorkSection({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-black">{title}</h2>
      {items.length ? <div className="grid gap-3 md:grid-cols-2">{children}</div> : <Card className="p-5 text-sm text-muted-foreground">{empty}</Card>}
    </section>
  );
}

function WorkLink({ href, icon, title, description, meta }: { href: string; icon: ReactNode; title: string; description?: string; meta: string }) {
  return (
    <Link href={href} className="block">
      <Card className="flex h-full min-h-28 items-center gap-4 p-5 transition hover:border-primary hover:shadow-sm">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{title}</span>
          {description ? <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{description}</span> : null}
          <span className="mt-2 block text-xs font-semibold text-primary">{meta}</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Card>
    </Link>
  );
}
