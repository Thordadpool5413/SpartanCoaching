import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BrainCircuit, CheckCircle2, Loader2, ShieldAlert, Target } from "lucide-react";
import { AccentText } from "@/components/AccentText";
import { ToolResultActions } from "@/components/ToolResultActions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

type DecisionBrief = {
  title: string;
  purpose: string;
  recommendedMove: string;
  whyNow: string[];
  evidence: Array<{ label: string; value: string; period: string; interpretation: string }>;
  questionsToValidate: string[];
  nextActions: Array<{ timing: string; action: string; successSignal: string }>;
  stopConditions: string[];
  confidence: { score: number; label: string; availableSignals: number; possibleSignals: number; explanation: string };
  limitations: string[];
  sources: Array<{ label: string; url: string; checkedAt: string }>;
};

export function MedicareDecisionPanel() {
  const [ccn, setCcn] = useState("");
  const [goal, setGoal] = useState("");
  const [brief, setBrief] = useState<DecisionBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const build = async () => {
    if (!/^\d{6}$/.test(ccn)) {
      setError("Enter the six-digit CCN from a verified hospice profile.");
      return;
    }
    setLoading(true);
    setError("");
    setBrief(null);
    try {
      const response = await apiRequest("POST", "/api/intelligence/market-decision", { ccn, goal });
      const data = await response.json();
      setBrief(data.brief);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The decision brief could not be built.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="space-y-5">
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-3 lg:items-end">
        <div className="lg:col-span-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Decision Room</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl"><AccentText>Turn Medicare evidence into one defensible next move.</AccentText></h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Start with a verified hospice CCN. The brief separates evidence from assumptions, shows coverage, and defines when to advance or stop.</p>
        </div>
        <div className="rounded-2xl border border-border bg-background/80 p-4 text-xs leading-5 text-muted-foreground">
          <ShieldAlert className="mb-2 h-5 w-5 text-primary" />
          Missing evidence lowers coverage. It is never converted into poor performance.
        </div>
      </div>
    </Card>

    <Card className="space-y-4 p-5 sm:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2"><Label htmlFor="decision-ccn">Hospice CCN</Label><Input id="decision-ccn" inputMode="numeric" value={ccn} onChange={(event) => setCcn(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Six digits" /></div>
        <div className="space-y-2 md:col-span-2"><Label htmlFor="decision-goal">Decision you need to make</Label><Textarea id="decision-goal" value={goal} onChange={(event) => setGoal(event.target.value)} rows={3} placeholder="Example: Decide whether this account deserves focused field development this quarter." /></div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={build} disabled={loading} className="font-bold">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}Build decision brief</Button>
        <Button asChild variant="outline"><Link href="/portal/coach"><BrainCircuit className="mr-2 h-4 w-4" />Ask Coach</Link></Button>
      </div>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </Card>

    {brief ? <Card className="space-y-6 border-primary/30 p-5 sm:p-7" data-testid="medicare-decision-brief">
      <header className="border-b border-border pb-5">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary-foreground">{brief.confidence.label} confidence</span><span className="text-xs font-semibold text-muted-foreground">{brief.confidence.score}% evidence coverage</span></div>
        <h3 className="mt-3 text-2xl font-black text-foreground"><AccentText>{brief.title}</AccentText></h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{brief.purpose}</p>
      </header>
      <DecisionSection title="Recommended move"><p className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-base font-bold leading-7 text-foreground">{brief.recommendedMove}</p></DecisionSection>
      <div className="grid gap-5 lg:grid-cols-2"><DecisionSection title="Why now"><BulletList items={brief.whyNow} /></DecisionSection><DecisionSection title="Questions to validate"><BulletList items={brief.questionsToValidate} numbered /></DecisionSection></div>
      <DecisionSection title="Evidence ledger"><div className="grid gap-3 md:grid-cols-2">{brief.evidence.map((item) => <article key={`${item.label}-${item.period}`} className="rounded-2xl border border-border bg-background/70 p-4"><div className="flex items-start justify-between gap-3"><h5 className="text-sm font-bold text-foreground">{item.label}</h5><span className="shrink-0 text-sm font-black tabular-nums text-primary">{item.value}</span></div><p className="mt-2 text-xs font-semibold text-muted-foreground">Period: {item.period}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.interpretation}</p></article>)}</div></DecisionSection>
      <DecisionSection title="Execution plan"><div className="space-y-3">{brief.nextActions.map((item, index) => <article key={item.timing} className="rounded-2xl border border-border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">{index + 1}</span><div className="flex-1"><p className="text-xs font-black uppercase tracking-wide text-primary">{item.timing}</p><p className="mt-1 text-sm font-semibold text-foreground">{item.action}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Success: {item.successSignal}</p></div></div></article>)}</div></DecisionSection>
      <div className="grid gap-5 lg:grid-cols-2"><DecisionSection title="Stop conditions"><BulletList items={brief.stopConditions} warning /></DecisionSection><DecisionSection title="Evidence boundary"><p className="text-sm leading-6 text-muted-foreground">{brief.confidence.explanation}</p><BulletList items={brief.limitations} /></DecisionSection></div>
      <ToolResultActions toolId="spartan-intelligence" title="Keep this decision moving" description="Save the brief to My Work, then use Coach to challenge or prepare the action." saveResult={{ toolId: "spartan-intelligence", title: brief.title, kind: "intelligence_brief", value: JSON.stringify(brief), input: { ccn, goal }, nextAction: { title: brief.nextActions[0]?.action || brief.recommendedMove, href: "/tools/intelligence" } }} actions={[{ id: "coach", label: "Challenge with Coach", href: "/portal/coach" }, { id: "my-work", label: "Open My Work", href: "/my-work" }]} testId="market-decision-actions" />
    </Card> : null}
  </div>;
}

function DecisionSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-3"><h4 className="text-[10px] font-black uppercase tracking-widest text-primary"><AccentText>{title}</AccentText></h4>{children}</section>;
}

function BulletList({ items, numbered = false, warning = false }: { items: string[]; numbered?: boolean; warning?: boolean }) {
  return <ol className="space-y-2">{items.map((item, index) => <li key={item} className="flex gap-3 text-sm leading-6 text-foreground">{warning ? <ShieldAlert className="mt-1 h-4 w-4 shrink-0 text-amber-500" /> : numbered ? <span className="font-black text-primary">{index + 1}</span> : <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />}<span>{item}</span></li>)}</ol>;
}
