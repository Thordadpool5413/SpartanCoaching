import { Link } from "wouter";
import { ArrowRight, BookOpen, BrainCircuit, CheckCircle2, Crosshair, FolderOpen, MessageCircle, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

type NextMove = { title: string; desc: string; href: string };

const workspaces = [
  { icon: Crosshair, number: "01", eyebrow: "Daily execution", title: "Command", body: "Organize accounts, prepare the conversation, capture the outcome, and protect the next move.", href: "/tools/sales-workflow", action: "Run today" },
  { icon: BrainCircuit, number: "02", eyebrow: "Verified preparation", title: "Intelligence", body: "Research referral partners, answer policy questions, and understand the market before you walk in.", href: "/tools/intelligence", action: "Build intelligence" },
  { icon: Wrench, number: "03", eyebrow: "Focused production", title: "Tools", body: "Turn a real field need into a finished plan, talk track, calculation, email, or rehearsal.", href: "/tools", action: "Choose an outcome" },
  { icon: MessageCircle, number: "04", eyebrow: "Private guidance", title: "Coach", body: "Think through the hard conversation, sharpen the language, and commit to the strongest next action.", href: "/portal/coach", action: "Start coaching" },
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
          <p>Your field operating system is ready. Start with the conversation that matters most, finish the work, and leave with a clear next move.</p>
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
          <div><p>Choose your mission</p><h2 id="workspace-map-heading">What needs to move forward?</h2></div>
          <Button asChild variant="outline"><Link href="/my-work"><FolderOpen /> My Work</Link></Button>
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

      <section className="workspace-onboarding-strip">
        <div className="workspace-onboarding-icon"><BookOpen /></div>
        <div><p>New to Hospice Sales Pro?</p><h2>Learn the system once. Use it every day.</h2><span>The Field Workshop walks you through Command, Intelligence, Tools, Coach, and My Work in the right order.</span></div>
        <Button asChild variant="outline" className="workspace-secondary-action"><Link href="/portal/learn">Open Field Workshop <ArrowRight /></Link></Button>
      </section>
    </main>
  );
}
