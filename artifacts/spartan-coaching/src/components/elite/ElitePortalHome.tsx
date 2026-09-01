import { Link } from "wouter";
import { ArrowRight, BrainCircuit, CheckCircle2, Crosshair, FolderOpen, MessageCircle, Sparkles } from "lucide-react";
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
    <main className="workspace-home" data-testid="elite-portal-home">
      <section className="workspace-command-hero">
        <div className="workspace-command-copy">
          <div className="workspace-overline"><span>Hospice Sales Pro</span><span className="workspace-live-dot">Live workspace</span></div>
          <h1>Good {greeting}{firstName ? `, ${firstName}` : ""}.</h1>
          <p>Start with the conversation that matters most. Prepare it, handle it, and leave with the next move already locked.</p>
          <div className="workspace-principles" aria-label="Workspace operating method">
            <span><CheckCircle2 /> Choose the outcome</span>
            <span><CheckCircle2 /> Do the work</span>
            <span><CheckCircle2 /> Keep the result</span>
          </div>
        </div>
        <aside className="workspace-next-card" aria-label="Continue your work">
          <div className="workspace-next-top"><span>Priority move</span><Sparkles /></div>
          <h2>{nextMove.title}</h2>
          <p>{nextMove.desc}</p>
          <Button asChild size="lg" className="workspace-primary-action"><Link href={nextMove.href}>Continue the work <ArrowRight /></Link></Button>
        </aside>
      </section>

      <section className="workspace-section" aria-labelledby="workspace-map-heading">
        <div className="workspace-section-heading">
          <div><p>Pick the job</p><h2 id="workspace-map-heading">One move. Finish it.</h2></div>
        </div>
        <div className="workspace-mission-grid">
          {workspaces.map(({ icon: Icon, number, eyebrow, title, body, href, action }, index) => (
            <Link key={title} href={href} className={`workspace-mission-card workspace-mission-${index + 1}`}>
              <div className="workspace-mission-header"><span>{number}</span><Icon /></div>
              <p className="workspace-mission-eyebrow">{eyebrow}</p>
              <h3>{title}</h3>
              <p className="workspace-mission-copy">{body}</p>
              <span className="workspace-mission-action">{action}<ArrowRight /></span>
            </Link>
          ))}
        </div>
      </section>

      <nav className="workspace-utility-rail" aria-label="Workspace shortcuts">
        <Link href="/my-work"><FolderOpen /><span><strong>My Work</strong><small>Resume saved work</small></span><ArrowRight /></Link>
        <Link href="/tools/intelligence"><BrainCircuit /><span><strong>Intelligence</strong><small>Verify before the conversation</small></span><ArrowRight /></Link>
        <Link href="/portal/learn"><Sparkles /><span><strong>Learn</strong><small>Build the next skill</small></span><ArrowRight /></Link>
      </nav>
    </main>
  );
}
