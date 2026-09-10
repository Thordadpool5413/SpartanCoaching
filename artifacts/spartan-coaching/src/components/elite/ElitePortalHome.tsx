import { Link } from "wouter";
import { ArrowRight, BrainCircuit, Crosshair, FolderOpen, MessageCircle, Search, Target, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StateBlock } from "@/components/StateBlock";
import { recordPersonalizationEvent } from "@/lib/personalizationClient";
import "@/styles/workspace.css";

export type NextMoveData = {
  id: string;
  stage: "Prepare" | "Practice" | "Execute" | "Review";
  title: string;
  description: string;
  reason: string;
  webHref: string;
};

type ElitePortalHomeProps = {
  firstName: string;
  nextMove: NextMoveData | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
};

export function ElitePortalHome({ firstName, nextMove, loading, error, onRetry }: ElitePortalHomeProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  const effectiveMove = error ? {
    id: "fallback-command-center",
    stage: "Execute" as const,
    title: "Open today’s Command Center",
    description: "Choose the next account, prepare the conversation, record the outcome, and lock the next commitment.",
    reason: "",
    webHref: "/tools/sales-workflow",
  } : nextMove;

  const STAGES = ["Prepare", "Practice", "Execute", "Review"];
  const activeStageIndex = effectiveMove ? STAGES.indexOf(effectiveMove.stage) : -1;

  const handleNextMoveClick = () => {
    if (effectiveMove) {
      const kind =
        effectiveMove.webHref.startsWith("/tools/sales-workflow") ? "workflow" :
        effectiveMove.webHref.startsWith("/tools") ? "tool" :
        effectiveMove.webHref.startsWith("/resources") ? "resource" :
        effectiveMove.webHref.startsWith("/my-work") ? "saved_work" :
        "page";
      void recordPersonalizationEvent({
        action: "open",
        item: {
          id: effectiveMove.id,
          kind,
          href: effectiveMove.webHref,
        },
      }).catch(() => undefined);
    }
  };

  return (
    <div className="field-home" data-testid="elite-portal-home">
      <header className="field-home-header">
        <span className="field-kicker">Private field workspace</span>
        <h1 className="field-greeting">Good {greeting}{firstName ? `, ${firstName}` : ""}.</h1>
        <p className="field-subtitle">Clarity before the conversation. Discipline through the follow-up.</p>
      </header>

      <div className="field-grid">
        <section className="field-card flex flex-col" aria-labelledby="workspace-priority-heading">
          <div className="field-card-header">
            <span className="field-card-title">
              <Target aria-hidden /> Today’s objective
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-primary hidden sm:inline-block">
              {effectiveMove ? `${effectiveMove.stage} stage` : "Calculating"}
            </span>
          </div>

          <div className="field-objective-content flex-1 flex flex-col">
            {loading ? (
              <StateBlock variant="loading" title="Analyzing context" description="Building your recommended next move..." className="flex-1 rounded-none border-0 bg-transparent px-0 py-8" />
            ) : effectiveMove ? (
              <>
                {error && (
                  <StateBlock
                    variant="warning"
                    title="Using the daily Command fallback"
                    description="Personalized context is temporarily unavailable. Your core field workflow is still ready."
                    action={{ label: "Retry personalization", onClick: onRetry }}
                    className="mb-5 rounded-none px-4 py-5 text-left [&_svg]:mx-0 [&_h2]:text-sm [&_p]:mx-0 [&_p]:mb-2 [&>div]:justify-start"
                  />
                )}
                <span className="field-objective-index">01 / PRIORITY</span>
                <h2 id="workspace-priority-heading" className="field-objective-heading">{effectiveMove.title}</h2>
                <p className="field-objective-desc">{effectiveMove.description}</p>

                {effectiveMove.reason && (
                  <p className="mt-4 text-xs font-medium text-primary bg-primary/5 p-3 border-l-2 border-primary">
                    <span className="block font-bold uppercase tracking-wider mb-1">Why this matters:</span>
                    {effectiveMove.reason}
                  </p>
                )}

                <div className="field-sequence" aria-label="Conversation operating sequence">
                  {STAGES.map((step, index) => (
                    <div key={step} className={`field-sequence-step ${index === activeStageIndex ? "ring-2 ring-primary bg-primary/10" : ""}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong className={index === activeStageIndex ? "text-primary" : ""}>{step}</strong>
                    </div>
                  ))}
                </div>

                <Button asChild size="lg" onClick={handleNextMoveClick} className="w-full sm:w-auto font-bold uppercase tracking-widest text-xs h-14 rounded-none bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-colors mt-auto">
                  <Link href={effectiveMove.webHref}>Open next move <ArrowRight className="ml-3 w-4 h-4" aria-hidden /></Link>
                </Button>
              </>
            ) : (
              <StateBlock variant="empty" title="Ready for input" description="No urgent commitments found. Choose a tool to begin." className="flex-1 rounded-none border-0 bg-transparent px-0 py-8" />
            )}
          </div>
        </section>

        <aside className="field-card flex flex-col" aria-label="Supporting workspace channels">
          <div className="field-card-header">
            <span className="field-card-title">Field Support</span>
          </div>

          <div className="field-channel-list flex-1">
            <Link href="/portal/coach" className="field-channel group">
              <div className="field-channel-icon"><MessageCircle aria-hidden className="w-5 h-5" /></div>
              <div className="field-channel-content">
                <strong>Private Coach</strong>
                <small>Pressure-test language.</small>
              </div>
              <ArrowRight className="field-channel-arrow" aria-hidden />
            </Link>

            <Link href="/tools/intelligence" className="field-channel group">
              <div className="field-channel-icon"><BrainCircuit aria-hidden className="w-5 h-5" /></div>
              <div className="field-channel-content">
                <strong>Intelligence</strong>
                <small>Verify account context.</small>
              </div>
              <ArrowRight className="field-channel-arrow" aria-hidden />
            </Link>

            <Link href="/my-work" className="field-channel group">
              <div className="field-channel-icon"><FolderOpen aria-hidden className="w-5 h-5" /></div>
              <div className="field-channel-content">
                <strong>My Work</strong>
                <small>Resume thinking.</small>
              </div>
              <ArrowRight className="field-channel-arrow" aria-hidden />
            </Link>
          </div>
          <div className="p-6 bg-muted/20 border-t border-border flex items-start gap-3 mt-auto">
             <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
             <div>
               <strong className="block text-sm font-bold uppercase tracking-wide text-foreground mb-1">Operating Standard</strong>
               <p className="text-xs text-muted-foreground leading-relaxed">Leave every conversation with a defined next commitment.</p>
             </div>
          </div>
        </aside>
      </div>

      <section className="field-lanes-section" aria-labelledby="workspace-lanes-heading">
        <div className="field-lanes-header">
          <span className="field-kicker">Choose the work</span>
          <h2 id="workspace-lanes-heading">Move with intent.</h2>
          <p className="text-muted-foreground font-serif text-lg">One objective at a time. Finish it. Keep the result.</p>
        </div>

        <div className="field-lane-grid">
          <Link href="/tools/sales-workflow" className="field-lane group">
            <span className="field-lane-number">01</span>
            <div className="field-lane-icon"><Crosshair aria-hidden className="w-6 h-6" /></div>
            <small>Plan and execute</small>
            <strong>Command</strong>
            <p>Organize the account, prepare the conversation, capture the outcome, and protect the next move.</p>
            <span className="field-lane-action">Run today <ArrowRight aria-hidden /></span>
          </Link>

          <Link href="/tools" className="field-lane group">
            <span className="field-lane-number">02</span>
            <div className="field-lane-icon"><Search aria-hidden className="w-6 h-6" /></div>
            <small>Find the right instrument</small>
            <strong>Tools</strong>
            <p>Open the focused tool, resource, or intelligence workflow for the job in front of you.</p>
            <span className="field-lane-action">Find a tool <ArrowRight aria-hidden /></span>
          </Link>

          <Link href="/portal/learn" className="field-lane group">
            <span className="field-lane-number">03</span>
            <div className="field-lane-icon"><BookOpen aria-hidden className="w-6 h-6" /></div>
            <small>Build field judgment</small>
            <strong>Library</strong>
            <p>Study the principle, practice the scenario, and test the decision before it becomes live.</p>
            <span className="field-lane-action">Build the skill <ArrowRight aria-hidden /></span>
          </Link>
        </div>
      </section>
    </div>
  );
}
