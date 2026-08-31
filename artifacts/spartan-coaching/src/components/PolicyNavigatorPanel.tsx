import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { ToolResultActions } from "@/components/ToolResultActions";
import { US_STATES } from "@/lib/usStates";

type Topic = "hospice-benefit" | "eligibility-certification" | "election" | "election-addendum" | "revocation-discharge" | "plan-of-care-idg" | "levels-of-care" | "continuous-home-care" | "general-inpatient-care" | "inpatient-respite" | "face-to-face-recertification" | "documentation";
type Audience = "family" | "referral-source" | "sales-rep" | "clinical-leader";
type PolicyBrief = {
  topic: Topic; audience: Audience; title: string; purpose: string; answer: string;
  keyFacts: string[]; talkTrack: string; reviewChecklist: string[]; whatNotToSay: string[];
  escalation: string; question?: string | null; state?: string | null; generatedBy?: string;
  sources: Array<{ label: string; url: string; checkedAt: string }>;
  source: { label: string; url: string; checkedAt: string; liveCmsSnapshot: boolean; documentTitle?: string | null };
  boundary: string;
};

const topics: Array<{ value: Topic; label: string }> = [
  { value: "hospice-benefit", label: "Hospice benefit" },
  { value: "eligibility-certification", label: "Eligibility & certification" },
  { value: "election", label: "Election" },
  { value: "election-addendum", label: "Election addendum" },
  { value: "revocation-discharge", label: "Revocation & discharge" },
  { value: "plan-of-care-idg", label: "Plan of care & IDG" },
  { value: "levels-of-care", label: "Levels of care" },
  { value: "continuous-home-care", label: "Continuous home care" },
  { value: "general-inpatient-care", label: "General inpatient care" },
  { value: "inpatient-respite", label: "Inpatient respite" },
  { value: "face-to-face-recertification", label: "Face-to-face & recertification" },
  { value: "documentation", label: "Documentation" },
];

const audienceOptions: Array<{ value: Audience; label: string }> = [
  { value: "referral-source", label: "Referral source" },
  { value: "family", label: "Family" },
  { value: "sales-rep", label: "Sales professional" },
  { value: "clinical-leader", label: "Clinical leader" },
];

export function PolicyNavigatorPanel() {
  const [topic, setTopic] = useState<Topic>("hospice-benefit");
  const [audience, setAudience] = useState<Audience>("referral-source");
  const [state, setState] = useState("");
  const [question, setQuestion] = useState("");
  const [brief, setBrief] = useState<PolicyBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!loading) { setElapsed(0); return; }
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [loading]);

  const progressMessage = elapsed < 6
    ? "Reviewing your question"
    : elapsed < 14
      ? "Checking the official guidance"
      : elapsed < 24
        ? "Building your field-ready explanation"
        : "Finishing the sourced brief. This can take up to a minute.";

  const build = async () => {
    setLoading(true); setError("");
    try {
      const response = await apiRequest("POST", "/api/intelligence/policy-brief", { topic, audience, state, concern: question });
      const data = await response.json();
      setBrief(data.brief);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The policy guide is unavailable. Try again in a moment.");
    } finally { setLoading(false); }
  };

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
    <Card className="p-5 sm:p-6 space-y-5 h-fit">
      <div className="flex gap-3 items-start">
        <div className="rounded-xl bg-primary/10 p-2.5"><BookOpen className="h-5 w-5 text-primary" /></div>
        <div><p className="text-xs font-bold tracking-wider text-primary uppercase">Policy Intelligence</p><h2 className="mt-1 text-xl font-black text-foreground">Ask the question you will hear in the field.</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Choose a policy lane, audience, and state context. Spartan AI turns the official baseline into a usable explanation without making a patient-specific decision.</p></div>
      </div>
      <div className="space-y-2"><Label htmlFor="policy-topic">Policy lane</Label><select id="policy-topic" value={topic} onChange={(event) => { setTopic(event.target.value as Topic); setBrief(null); }} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">{topics.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="policy-audience">Who needs the answer?</Label><select id="policy-audience" value={audience} onChange={(event) => setAudience(event.target.value as Audience)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">{audienceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="policy-state">State context</Label><select id="policy-state" value={state} onChange={(event) => setState(event.target.value)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="">Federal guidance</option>{US_STATES.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}</select></div>
      </div>
      <div className="space-y-2"><Label htmlFor="policy-question">Question or concern</Label><Textarea id="policy-question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} placeholder="Example: How do I explain continuous home care without promising round-the-clock care?" /><p className="text-xs text-muted-foreground">Do not enter names, diagnoses, dates of birth, or other patient information.</p></div>
      <Button type="button" className="w-full h-11 font-bold" disabled={loading} onClick={build}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{loading ? progressMessage : "Build AI policy brief"}</Button>
      {loading ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-3" role="status" aria-live="polite"><p className="text-sm font-semibold text-foreground">{progressMessage}</p><p className="mt-1 text-xs text-muted-foreground">Your question is safe. Keep this page open while Spartan Intelligence completes the brief. {elapsed}s</p></div> : null}
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </Card>

    <Card className="p-5 sm:p-6 min-h-[28rem]">
      {!brief ? <div className="flex min-h-[25rem] flex-col items-center justify-center text-center px-5"><ShieldCheck className="h-9 w-9 text-primary" /><h3 className="mt-4 text-xl font-black">Your sourced field guide appears here.</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">It will separate the explanation, talk track, verification steps, language to avoid, escalation boundary, and official sources.</p></div> :
      <div className="space-y-5" data-testid="policy-brief-result">
        <div className="border-b border-border pb-4"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{brief.generatedBy || "Spartan Intelligence"}</span><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{brief.source.liveCmsSnapshot ? "Live CMS snapshot" : "Official-reference baseline"}</span></div><h3 className="mt-3 text-2xl font-black text-foreground">{brief.title}</h3><p className="mt-2 text-sm text-muted-foreground">{brief.purpose}</p></div>
        <PolicySection title="Direct answer"><p>{brief.answer}</p></PolicySection>
        <PolicySection title="Say it this way"><p className="rounded-xl bg-background p-4 font-semibold">“{brief.talkTrack}”</p></PolicySection>
        <div className="grid gap-4 md:grid-cols-2"><PolicySection title="What to verify"><List items={brief.reviewChecklist} /></PolicySection><PolicySection title="Do not say"><List items={brief.whatNotToSay} /></PolicySection></div>
        <PolicySection title="Escalation boundary"><p>{brief.escalation}</p></PolicySection>
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-relaxed text-muted-foreground">{brief.boundary}</div>
        <div className="space-y-2"><h4 className="text-xs font-bold tracking-wider text-primary uppercase">Official sources</h4>{brief.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border p-3 text-sm font-semibold text-foreground hover:border-primary">{source.label}<span className="mt-1 block text-xs font-normal text-muted-foreground">Checked {new Date(source.checkedAt).toLocaleDateString()}</span></a>)}</div>
        <ToolResultActions toolId="spartan-intelligence" title="Keep this guidance" description="Save the brief to My Work for use on web and iPhone." saveResult={{ toolId: "spartan-intelligence", title: brief.title, kind: "intelligence_brief", value: JSON.stringify(brief), input: { topic, audience, state, question }, nextAction: { title: "Review this guidance before the conversation", href: "/tools/intelligence" } }} actions={[{ id: "my-work", label: "Open My Work", href: "/my-work" }]} testId="policy-brief-actions" />
      </div>}
    </Card>
  </div>;
}

function List({ items }: { items: string[] }) { return <ul className="space-y-2">{items.map((item) => <li key={item} className="flex gap-2"><span className="font-bold text-primary">•</span><span>{item}</span></li>)}</ul>; }
function PolicySection({ title, children }: { title: string; children: ReactNode }) { return <section className="space-y-2 text-sm leading-relaxed text-foreground"><h4 className="text-xs font-bold tracking-wider text-primary uppercase">{title}</h4>{children}</section>; }
