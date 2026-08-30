import { Link } from "wouter";
import { ArrowRight, BookOpen, BrainCircuit, Crosshair, FolderOpen, MessageCircle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type NextMove = { title: string; desc: string; href: string };

export function ElitePortalHome({ firstName, nextMove }: { firstName: string; nextMove: NextMove }) {
  const workspaces = [
    { icon: Crosshair, title: "Run the day", body: "Plan calls, prepare, capture outcomes, and lock the next step.", href: "/tools/sales-workflow", action: "Open Command" },
    { icon: BrainCircuit, title: "Prepare with evidence", body: "Research an account, answer a CMS question, or understand a market.", href: "/tools/intelligence", action: "Open Intelligence" },
    { icon: Wrench, title: "Finish a specific job", body: "Build a plan, handle an objection, rehearse, calculate, or follow up.", href: "/tools", action: "Choose a tool" },
    { icon: MessageCircle, title: "Get coached", body: "Work through a difficult situation and leave with a field-ready next move.", href: "/portal/coach", action: "Open Coach" },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8" data-testid="elite-portal-home">
      <section className="mb-7 grid gap-6 border-b border-border/70 pb-8 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <p className="text-kicker">Hospice Sales Pro</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Your field day, organized{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Command runs the day. Intelligence prepares the conversation. Tools finish a specific job. Coach helps when the situation gets complicated. My Work keeps the result.
          </p>
        </div>
        <Card className="border-primary/30 bg-primary/[0.05] p-5 shadow-none">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Continue where you left off</p>
          <h2 className="mt-2 text-xl font-bold text-foreground">{nextMove.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{nextMove.desc}</p>
          <Button asChild className="mt-4 w-full font-bold">
            <Link href={nextMove.href}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </Card>
      </section>

      <section aria-labelledby="workspace-map-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Start with the outcome</p>
            <h2 id="workspace-map-heading" className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">What do you need to accomplish?</h2>
          </div>
          <Button asChild variant="outline" size="sm"><Link href="/my-work"><FolderOpen className="mr-2 h-4 w-4" />Open My Work</Link></Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {workspaces.map(({ icon: Icon, title, body, href, action }, index) => (
            <Card key={title} className="group border-border/80 p-5 shadow-none transition-colors hover:border-primary/40">
              <div className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 text-lg font-bold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
                  <Link href={href} className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-primary hover:underline">{action}<ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-7 grid gap-3 sm:grid-cols-3" aria-label="How the workspace works">
        {[
          ["1. Choose", "Start with the outcome, not a feature list."],
          ["2. Do the work", "Use one focused workspace through completion."],
          ["3. Keep the result", "Save the output, next action, and context in My Work."],
        ].map(([title, body]) => <div key={title} className="rounded-xl border border-border/70 bg-card/50 p-4"><p className="font-bold text-foreground">{title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p></div>)}
      </section>

      <section className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/60 p-4">
        <div className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-primary" /><div><p className="font-bold">New here?</p><p className="text-sm text-muted-foreground">Take the Field Workshop to learn the system in the order it is meant to be used.</p></div></div>
        <Button asChild variant="ghost" className="font-bold"><Link href="/portal/learn">Open Field Workshop <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      </section>
    </main>
  );
}
