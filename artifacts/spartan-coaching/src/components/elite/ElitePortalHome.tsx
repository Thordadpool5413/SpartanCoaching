import { Link } from "wouter";
import { ArrowRight, BrainCircuit, Crosshair, FolderOpen, MessageCircle, Search, Target, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type NextMove = { title: string; desc: string; href: string };

export function ElitePortalHome({ firstName, nextMove }: { firstName: string; nextMove: NextMove }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return (
    <main className="workspace-home" data-testid="elite-portal-home">
      <header className="workspace-briefing-header">
        <div>
          <p className="workspace-kicker">Private field workspace</p>
          <h1>Good {greeting}{firstName ? `, ${firstName}` : ""}.</h1>
        </div>
        <p>Clarity before the conversation. Discipline through the follow-up.</p>
      </header>

      <section className="workspace-briefing" aria-labelledby="workspace-priority-heading">
        <div className="workspace-briefing-objective">
          <div className="workspace-priority-label">
            <span><Target aria-hidden /> Today’s objective</span>
            <small>Ready for execution</small>
          </div>
          <div className="workspace-objective-copy">
            <p className="workspace-objective-index">01 / Priority</p>
            <h2 id="workspace-priority-heading">{nextMove.title}</h2>
            <p>{nextMove.desc}</p>
          </div>
          <ol className="workspace-operating-sequence" aria-label="Conversation operating sequence">
            {["Prepare", "Practice", "Execute", "Review"].map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>
          <Button asChild size="lg" className="workspace-execute-action">
            <Link href={nextMove.href}>Enter Command Center <ArrowRight aria-hidden /></Link>
          </Button>
        </div>

        <aside className="workspace-briefing-channels" aria-label="Supporting workspace channels">
          <div className="workspace-channel-heading">
            <p>Field support</p>
            <span>Three focused channels</span>
          </div>
          <Link href="/portal/coach" className="workspace-channel">
            <span className="workspace-channel-icon"><MessageCircle aria-hidden /></span>
            <span><strong>Private Coach</strong><small>Pressure-test the language before the meeting.</small></span>
            <ArrowRight aria-hidden />
          </Link>
          <Link href="/tools/intelligence" className="workspace-channel">
            <span className="workspace-channel-icon"><BrainCircuit aria-hidden /></span>
            <span><strong>Intelligence</strong><small>Verify the account, policy, and market context.</small></span>
            <ArrowRight aria-hidden />
          </Link>
          <Link href="/my-work" className="workspace-channel">
            <span className="workspace-channel-icon"><FolderOpen aria-hidden /></span>
            <span><strong>My Work</strong><small>Resume the thinking you already completed.</small></span>
            <ArrowRight aria-hidden />
          </Link>
          <div className="workspace-standard">
            <CheckCircle2 aria-hidden />
            <p><strong>Operating standard</strong><span>Leave every conversation with a defined next commitment.</span></p>
          </div>
        </aside>
      </section>

      <section className="workspace-lanes" aria-labelledby="workspace-lanes-heading">
        <div className="workspace-lanes-heading">
          <div>
            <p className="workspace-kicker">Choose the work</p>
            <h2 id="workspace-lanes-heading">Move with intent.</h2>
          </div>
          <p>One objective at a time. Finish it. Keep the result.</p>
        </div>
        <div className="workspace-lane-list">
          <Link href="/tools/sales-workflow" className="workspace-lane">
            <span className="workspace-lane-number">01</span>
            <span className="workspace-lane-icon"><Crosshair aria-hidden /></span>
            <span className="workspace-lane-copy"><small>Plan and execute</small><strong>Command</strong><p>Organize the account, prepare the conversation, capture the outcome, and protect the next move.</p></span>
            <span className="workspace-lane-action">Run today <ArrowRight aria-hidden /></span>
          </Link>
          <Link href="/tools" className="workspace-lane">
            <span className="workspace-lane-number">02</span>
            <span className="workspace-lane-icon"><Search aria-hidden /></span>
            <span className="workspace-lane-copy"><small>Find the right instrument</small><strong>Explore</strong><p>Open the focused tool, resource, or intelligence workflow for the job in front of you.</p></span>
            <span className="workspace-lane-action">Find a tool <ArrowRight aria-hidden /></span>
          </Link>
          <Link href="/portal/learn" className="workspace-lane">
            <span className="workspace-lane-number">03</span>
            <span className="workspace-lane-icon"><BookOpen aria-hidden /></span>
            <span className="workspace-lane-copy"><small>Build field judgment</small><strong>Learn</strong><p>Study the principle, practice the scenario, and test the decision before it becomes live.</p></span>
            <span className="workspace-lane-action">Build the skill <ArrowRight aria-hidden /></span>
          </Link>
        </div>
      </section>
    </main>
  );
}