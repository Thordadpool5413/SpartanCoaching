import { Link } from "wouter";
import { ArrowRight, BrainCircuit, Crosshair, MessageCircle, Search, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StateBlock } from "@/components/StateBlock";
import { recordPersonalizationEvent } from "@/lib/personalizationClient";

export type NextMoveData = {
  id: string;
  stage: "Prepare" | "Practice" | "Execute" | "Review";
  title: string;
  description: string;
  reason: string;
  webHref: string;
  resumeWorkId?: string;
};

type ElitePortalHomeProps = {
  firstName: string;
  nextMove: NextMoveData | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
};

export function ElitePortalHome({ firstName, nextMove, loading, error, onRetry }: ElitePortalHomeProps) {
  const effectiveMove = error ? {
    id: "fallback-command-center",
    stage: "Execute" as const,
    title: "Open today’s Command Center",
    description: "Choose the next account, prepare the conversation, record the outcome, and lock the next commitment.",
    reason: "",
    webHref: "/tools/sales-workflow",
  } : nextMove;

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

  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8" data-testid="elite-portal-home">
      <header className="mb-10 border-b border-border pb-6">
        <h1 className="field-greeting text-3xl font-bold tracking-tight text-foreground">Daily Operating Brief</h1>
        <p className="mt-2 text-[13px] font-mono tracking-widest text-muted-foreground uppercase">{today}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section aria-labelledby="heading-now">
            <h2 id="heading-now" className="mb-4 text-xs font-mono font-bold tracking-widest text-primary uppercase">Now / Active Objective</h2>

            <div className="rounded-none border border-border bg-card shadow-sm">
              {loading ? (
                <StateBlock variant="loading" title="Analyzing context" description="Building your recommended next move..." className="p-8" />
              ) : effectiveMove ? (
                <div className="p-6 sm:p-8">
                  {error && (
                    <StateBlock
                      variant="warning"
                      title="Using the daily Command fallback"
                      description="Personalized context is temporarily unavailable. Your core field workflow is still ready."
                      action={{ label: "Retry personalization", onClick: onRetry }}
                      className="mb-6 rounded-none px-4 py-4 text-left [&_svg]:mx-0 [&_h2]:text-sm [&_p]:mx-0 [&_p]:mb-2 [&>div]:justify-start"
                    />
                  )}

                  <div className="flex items-center gap-3 text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    <Target className="h-4 w-4 text-primary" aria-hidden />
                    {effectiveMove.stage} Stage
                  </div>

                  <h3 className="field-objective-heading text-xl sm:text-2xl font-bold text-foreground mb-3">{effectiveMove.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl">{effectiveMove.description}</p>

                  {effectiveMove.reason && (
                    <div className="mb-6 border-l-2 border-primary bg-primary/5 p-4 text-[13px] leading-relaxed text-foreground">
                      <span className="block font-mono font-bold uppercase tracking-widest text-primary mb-1 text-[10px]">Context</span>
                      {effectiveMove.reason}
                    </div>
                  )}

                  <Button asChild onClick={handleNextMoveClick} className="w-full sm:w-auto rounded-none font-bold uppercase tracking-widest text-xs h-12 bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Link href={effectiveMove.webHref}>Open next action <ArrowRight className="ml-3 h-4 w-4" aria-hidden /></Link>
                  </Button>
                </div>
              ) : (
                <StateBlock variant="empty" title="Ready for input" description="No urgent commitments found. Choose a tool to begin." className="p-8" />
              )}
            </div>
          </section>

          {effectiveMove?.resumeWorkId ? (
            <section aria-labelledby="heading-continue">
              <h2 id="heading-continue" className="mb-4 text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase">Continue</h2>
              <Link href="/my-work" className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50">
                <span>
                  <span className="block text-sm font-bold text-foreground">Resume saved work</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Open the durable work connected to your next move.</span>
                </span>
                <ArrowRight className="h-4 w-4 text-primary" aria-hidden />
              </Link>
            </section>
          ) : null}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <section aria-labelledby="heading-next">
             <h2 id="heading-next" className="mb-4 text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase">Next / Resources</h2>
             <div className="rounded-none border border-border bg-card shadow-sm divide-y divide-border">
                <Link href="/tools/sales-workflow" className="flex items-start p-4 hover:bg-muted/50 transition-colors group">
                  <Crosshair className="h-5 w-5 text-muted-foreground mt-0.5 mr-3 group-hover:text-primary transition-colors" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-foreground">Command Center</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Daily field execution spine</p>
                  </div>
                </Link>
                <Link href="/portal/coach" className="flex items-start p-4 hover:bg-muted/50 transition-colors group">
                  <MessageCircle className="h-5 w-5 text-muted-foreground mt-0.5 mr-3 group-hover:text-primary transition-colors" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-foreground">Private Coach</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Pressure-test language and strategy</p>
                  </div>
                </Link>
                <Link href="/tools/intelligence" className="flex items-start p-4 hover:bg-muted/50 transition-colors group">
                  <BrainCircuit className="h-5 w-5 text-muted-foreground mt-0.5 mr-3 group-hover:text-primary transition-colors" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-foreground">Medicare Intelligence</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Verify provider and market evidence</p>
                  </div>
                </Link>
                <Link href="/tools" className="flex items-start p-4 hover:bg-muted/50 transition-colors group">
                  <Search className="h-5 w-5 text-muted-foreground mt-0.5 mr-3 group-hover:text-primary transition-colors" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-foreground">Tool Catalog</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Find the right instrument for the job</p>
                  </div>
                </Link>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
