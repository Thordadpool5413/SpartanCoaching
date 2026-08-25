import { useState } from "react";
import type { ReactNode } from "react";
import { BookOpen, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

type Topic = "hospice-benefit" | "documentation" | "levels-of-care" | "election";
type PolicyBrief = {
  title: string;
  answer: string;
  talkTrack: string;
  reviewChecklist: string[];
  source: { label: string; url: string; checkedAt: string; liveCmsSnapshot: boolean; documentTitle?: string | null };
  boundary: string;
};

const topics: Array<{ value: Topic; label: string; detail: string }> = [
  { value: "hospice-benefit", label: "Hospice benefit", detail: "Explain the Medicare benefit clearly." },
  { value: "documentation", label: "Documentation", detail: "Prepare a compliant documentation conversation." },
  { value: "levels-of-care", label: "Levels of care", detail: "Review the four Medicare hospice levels." },
  { value: "election", label: "Election", detail: "Explain informed choice and coverage." },
];

export function PolicyNavigatorPanel() {
  const [topic, setTopic] = useState<Topic>("hospice-benefit");
  const [brief, setBrief] = useState<PolicyBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const build = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest("POST", "/api/intelligence/policy-brief", { topic });
      const data = await response.json();
      setBrief(data.brief);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The policy guide is unavailable. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return <Card className="p-5 sm:p-7 space-y-6">
    <div className="flex gap-3 items-start"><div className="rounded-xl bg-primary/10 p-2.5"><BookOpen className="h-5 w-5 text-primary" /></div><div><p className="text-[10px] font-bold tracking-widest text-primary uppercase">CMS policy navigator</p><h2 className="mt-1 text-2xl font-black text-foreground">Walk into policy conversations prepared.</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Choose the conversation. Get plain language, a field ready explanation, review points, and visible source status.</p></div></div>
    <div className="grid gap-2 sm:grid-cols-2">{topics.map((item) => <button key={item.value} type="button" onClick={() => { setTopic(item.value); setBrief(null); }} className={`rounded-xl border p-4 text-left transition ${topic === item.value ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50"}`}><span className="font-bold text-foreground">{item.label}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{item.detail}</span></button>)}</div>
    <Button type="button" className="w-full font-bold" disabled={loading} onClick={build}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Build policy guide</Button>
    {error ? <p className="text-sm text-destructive">{error}</p> : null}
    {brief ? <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-5">
      <div><p className="text-[10px] font-bold tracking-widest text-primary uppercase">Ready to explain</p><h3 className="mt-1 text-xl font-black text-foreground">{brief.title}</h3></div>
      <PolicySection title="Plain language"><p>{brief.answer}</p></PolicySection>
      <PolicySection title="Say it this way"><p className="font-semibold">“{brief.talkTrack}”</p></PolicySection>
      <PolicySection title="Review before use"><ul className="space-y-2">{brief.reviewChecklist.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{item}</span></li>)}</ul></PolicySection>
      <div className="rounded-lg border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground"><div className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /><div><p className="font-bold text-foreground">{brief.source.liveCmsSnapshot ? "Live CMS snapshot connected" : "Educational baseline in use"}</p><p className="mt-1">{brief.boundary}</p><p className="mt-2">Source: <a href={brief.source.url} target="_blank" rel="noreferrer" className="text-primary underline">{brief.source.label}</a></p></div></div></div>
    </div> : null}
  </Card>;
}

function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-2 text-sm leading-relaxed text-foreground"><h4 className="text-[10px] font-bold tracking-widest text-primary uppercase">{title}</h4>{children}</section>;
}
