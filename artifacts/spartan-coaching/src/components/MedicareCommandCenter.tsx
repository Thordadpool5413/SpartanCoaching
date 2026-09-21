import { ArrowRight, BookOpen, Building2, Database, Map, Search, ShieldCheck, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

type Mission = "referral" | "market" | "compare" | "decision" | "policy";

const actions: Array<{ mission: Mission; eyebrow: string; title: string; detail: string; icon: typeof Search }> = [
  { mission: "referral", eyebrow: "Provider", title: "Verify an account", detail: "Search NPPES, confirm identity, and prepare the conversation.", icon: Search },
  { mission: "market", eyebrow: "Market", title: "Read the territory", detail: "Find Medicare-certified hospices and open evidence-rich profiles.", icon: Map },
  { mission: "compare", eyebrow: "Compare", title: "Challenge the shortlist", detail: "Compare up to three hospices without hiding missing evidence.", icon: Building2 },
  { mission: "decision", eyebrow: "Decide", title: "Build the next move", detail: "Turn a verified CCN into an evidence-backed action brief.", icon: Target },
  { mission: "policy", eyebrow: "Policy", title: "Explain the rule", detail: "Translate sourced CMS guidance for the room you are entering.", icon: BookOpen },
];

export function MedicareCommandCenter({ onOpen }: { onOpen: (mission: Mission) => void }) {
  return <div className="space-y-5" data-testid="medicare-command-center">
    <Card className="overflow-hidden border-primary/50 bg-gradient-to-br from-slate-950 via-slate-900 to-primary/80 p-6 text-white shadow-xl sm:p-8">
      <div className="grid gap-7 lg:grid-cols-[1fr_19rem] lg:items-end">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Command center</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Know what is true. See what is missing. Make the next move.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-100 sm:text-base">One Spartan workspace for public CMS evidence, conservative calculations, field decisions, and accountable follow-through.</p>
        </div>
        <div className="grid gap-2 text-xs">
          <Signal icon={ShieldCheck} title="Evidence stays attached" text="Source, period, and limitation travel with the result." />
          <Signal icon={Database} title="Missing is never zero" text="Unavailable evidence lowers coverage, not performance." />
        </div>
      </div>
    </Card>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {actions.map(({ mission, eyebrow, title, detail, icon: Icon }) => <button key={mission} type="button" onClick={() => onOpen(mission)} className="group min-h-40 rounded-3xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <span className="rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></span>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
        </div>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h3 className="mt-1 text-lg font-black text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
      </button>)}
    </div>
  </div>;
}

function Signal({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return <div className="flex gap-3 rounded-2xl border border-white/25 bg-white/10 p-3 backdrop-blur"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /><span><strong className="block text-white">{title}</strong><span className="mt-0.5 block leading-5 text-slate-100">{text}</span></span></div>;
}
