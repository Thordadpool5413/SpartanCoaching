import { Link } from "wouter";
import { ArrowRight, BookOpen, CheckCircle2, MessageCircle, Target, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { ToolDisclaimer } from "@/components/ToolDisclaimer";

const modules = [
  { number: "01", title: "Prepare the conversation", description: "Research the account, define the purpose, and enter with one clear next move.", lessons: ["Account preparation", "Referral-source priorities", "Meeting plan"], href: "/tools/intelligence", action: "Start with Intelligence", icon: Target },
  { number: "02", title: "Lead the conversation", description: "Open with relevance, ask better questions, and keep the conversation human.", lessons: ["Credible opening", "Discovery questions", "Value connection"], href: "/resources/quick-start-guide", action: "Open the field guide", icon: MessageCircle },
  { number: "03", title: "Practice the pressure", description: "Rehearse objections and difficult moments before they happen in the field.", lessons: ["Objection framework", "Role-play rep", "Language review"], href: "/tools/role-play", action: "Begin role-play", icon: BookOpen },
  { number: "04", title: "Finish the follow-through", description: "Capture the outcome, commit to the next step, and improve the next attempt.", lessons: ["Outcome review", "Follow-up", "Weekly commitment"], href: "/tools/sales-workflow", action: "Open Command Center", icon: Trophy },
];

export default function Workshop() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12" data-testid="page-workshop">
      <SEO title="Field Workshop | Hospice Sales Pro" noIndex />
      <header className="mb-8 rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Hospice Sales Pro · Field Workshop</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-foreground sm:text-5xl">Learn it. Practice it. Use it in the field.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">A focused path through the work that matters most. Each module moves from judgment to practice to one real field action.</p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground"><span>4 modules</span><span aria-hidden="true">•</span><span>12 field lessons</span><span aria-hidden="true">•</span><span>AI practice included</span></div>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => {
          const Icon = module.icon;
          return <Card key={module.number} className="flex h-full flex-col border-border p-5 sm:p-6">
            <div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><div><p className="text-xs font-bold tracking-[0.16em] text-primary">MODULE {module.number}</p><h2 className="mt-1 text-xl font-black text-foreground">{module.title}</h2></div></div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{module.description}</p>
            <ul className="mt-5 flex-1 space-y-2">{module.lessons.map((lesson) => <li key={lesson} className="flex items-center gap-2 text-sm text-foreground"><CheckCircle2 className="h-4 w-4 text-primary" />{lesson}</li>)}</ul>
            <Button asChild className="mt-6 w-full font-bold"><Link href={module.href}>{module.action}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </Card>;
        })}
      </div>
      <ToolDisclaimer className="mt-8 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-center" />
    </div>
  );
}
