import { Link } from "wouter";
import { ArrowRight, BrainCircuit, CheckCircle2, Crosshair, FolderOpen, MessageCircle, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

type NextMove = { title: string; desc: string; href: string };

const workspaces = [
  { icon: Crosshair, number: "01", eyebrow: "Daily execution", title: "Command", body: "Organize accounts, prepare the conversation, capture the outcome, and protect the next move.", href: "/tools/sales-workflow", action: "Run today" },
  { icon: MessageCircle, number: "02", eyebrow: "Private guidance", title: "Coach", body: "Think through the hard conversation, sharpen the language, and commit to the strongest next action.", href: "/portal/coach", action: "Start coaching" },
  { icon: BrainCircuit, number: "03", eyebrow: "Tools, intelligence, and learning", title: "Explore", body: "Research an account, build the talk track, run the numbers, or open a field-ready resource.", href: "/tools", action: "Find what you need" },
];

export function ElitePortalHome({ firstName, nextMove }: { firstName: string; nextMove: NextMove }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return (
    <main className="workspace-home max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" data-testid="elite-portal-home">
      <section className="workspace-command-hero rounded-2xl overflow-hidden border border-border/80 shadow-2xl shadow-black/5 bg-card relative z-10">
        <div className="workspace-command-copy flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative z-10">
          <div>
            <div className="workspace-overline flex items-center gap-3 mb-4 text-primary font-extrabold text-[10px] tracking-[0.2em] uppercase">
              <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Operations</span>
              <span className="workspace-live-dot flex items-center gap-1.5 text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> Live
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-foreground">Good {greeting}{firstName ? `, ${firstName}` : ""}.</h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">Start with the conversation that matters most. Prepare it, handle it, and leave with the next move already locked.</p>
          </div>
          <div className="workspace-principles pt-8 border-t border-border/40 mt-10 flex flex-wrap items-center gap-6" aria-label="Workspace operating method">
            <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-primary" /> Choose the outcome</span>
            <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-primary" /> Do the work</span>
            <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-primary" /> Keep the result</span>
          </div>
        </div>
        <aside className="workspace-next-card flex flex-col relative overflow-hidden group p-6 sm:p-10 border-l border-border/40 bg-muted" aria-label="Continue your work">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="workspace-next-top relative z-10 flex items-center justify-between text-primary font-extrabold text-[10px] tracking-[0.2em] uppercase">
            <span>Priority move</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="relative z-10 flex-1 flex flex-col justify-center py-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4 text-foreground">{nextMove.title}</h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{nextMove.desc}</p>
          </div>
          <Button asChild size="lg" className="workspace-primary-action relative z-10 w-full rounded-md font-bold tracking-wide shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
            <Link href={nextMove.href}>Continue the work <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </aside>
      </section>

      <section className="workspace-section mt-12 sm:mt-16" aria-labelledby="workspace-map-heading">
        <div className="workspace-section-heading mb-6 px-1">
          <div><p className="text-primary text-[10px] font-extrabold uppercase tracking-[0.2em] mb-2">Pick the job</p><h2 id="workspace-map-heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">One move. Finish it.</h2></div>
        </div>
        <div className="workspace-mission-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          {workspaces.map(({ icon: Icon, number, eyebrow, title, body, href, action }, index) => (
            <Link key={title} href={href} className={`workspace-mission-card workspace-mission-${index + 1} group relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 sm:p-8 flex flex-col hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300`}>
              <div className="workspace-mission-header flex items-center justify-between text-primary font-extrabold text-[11px] tracking-[0.16em] mb-8">
                <span>{number}</span>
                <Icon className="w-5 h-5 opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-transform" />
              </div>
              <p className="workspace-mission-eyebrow text-muted-foreground text-[10px] uppercase font-extrabold tracking-[0.12em] mb-3">{eyebrow}</p>
              <h3 className="text-xl sm:text-2xl font-extrabold mb-3 text-foreground">{title}</h3>
              <p className="workspace-mission-copy text-muted-foreground text-sm flex-1 leading-relaxed">{body}</p>
              <span className="workspace-mission-action flex items-center gap-2 text-primary font-bold text-sm mt-8 group-hover:translate-x-1 transition-transform">
                {action} <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <nav className="workspace-utility-rail grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 px-1" aria-label="Workspace shortcuts">
        <Link href="/my-work" className="group flex items-center gap-4 p-5 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-muted/50 transition-colors">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors"><FolderOpen className="w-5 h-5" /></div>
          <div className="flex-1 flex flex-col"><strong className="font-bold text-sm text-foreground">My Work</strong><small className="text-muted-foreground text-xs mt-0.5">Resume saved work</small></div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
        <Link href="/tools/intelligence" className="group flex items-center gap-4 p-5 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-muted/50 transition-colors">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors"><BrainCircuit className="w-5 h-5" /></div>
          <div className="flex-1 flex flex-col"><strong className="font-bold text-sm text-foreground">Intelligence</strong><small className="text-muted-foreground text-xs mt-0.5">Verify before the conversation</small></div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
        <Link href="/portal/learn" className="group flex items-center gap-4 p-5 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-muted/50 transition-colors">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors"><Sparkles className="w-5 h-5" /></div>
          <div className="flex-1 flex flex-col"><strong className="font-bold text-sm text-foreground">Learn</strong><small className="text-muted-foreground text-xs mt-0.5">Build the next skill</small></div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </nav>
    </main>
  );
}