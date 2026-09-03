import { AccentText } from "@/components/AccentText";
/**
 * First meaningful value loop (HSP-39) — real product steps, not a long tutorial.
 * Registration/subscription alone is not activation.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, ArrowRight, Loader2 } from "lucide-react";
import { trackEvent, trackProductOutcome } from "@/lib/analytics";
import type { ActivationStepStatus, ActivationView } from "@/lib/fieldKitCatalog";
import { cn } from "@/lib/utils";

type Props = {
  /** When false, hide (e.g. no Field Kit) */
  enabled?: boolean;
};

export function ActivationLoopPanel({ enabled = true }: Props) {
  const [activation, setActivation] = useState<ActivationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setActivation(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/me/onboarding", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setActivation(data.activation ?? null);
    } catch {
      setActivation(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (body: Record<string, unknown>, stepId?: string) => {
    setBusy(stepId || "save");
    try {
      const res = await fetch("/api/me/onboarding", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setActivation(data.activation ?? null);
        if (body.skipActivation) {
          trackEvent("activation_skipped", "onboarding");
        } else if (stepId) {
          trackEvent("activation_step", stepId);
          // Product outcome: confirmed next action in activation loop (safe id only)
          trackProductOutcome("next_action_confirmation", {
            stepId: String(stepId).slice(0, 64),
            surface: "web",
          });
        }
        if (data.activation?.activated) {
          const role = typeof data.activation.role === "string" ? data.activation.role : "unknown";
          trackEvent("activation_completed", role);
          trackProductOutcome("workflow_completion", {
            outcome: "activation",
            role: role.replace(/\s+/g, "_").slice(0, 64),
            surface: "web",
          });
        }
      }
    } finally {
      setBusy(null);
    }
  };

  if (!enabled) return null;
  if (loading) {
    return (
      <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        Loading your activation path…
      </div>
    );
  }
  if (!activation || activation.activated) {
    if (activation?.activated && !activation.skipped) {
      return (
        <Card
          className="mb-8 border border-primary/25 bg-primary/[0.04] p-4 sm:p-5"
          data-testid="activation-complete"
        >
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
            Activated
          </p>
          <p className="text-sm text-foreground mt-1 leading-relaxed">
            First value loop complete for{" "}
            <span className="font-semibold">{activation.role}</span>. Keep running the day from
            Command Center — that is the product, not a checklist.
          </p>
        </Card>
      );
    }
    if (activation?.skipped) {
      return (
        <Card className="mb-8 border border-border p-4" data-testid="activation-skipped-banner">
          <p className="text-sm text-muted-foreground">
            Activation skipped for experienced users. You can still use every tool from the portal.
          </p>
        </Card>
      );
    }
    return null;
  }

  const pct =
    activation.totalRequired > 0
      ? Math.round((activation.completedRequired / activation.totalRequired) * 100)
      : 0;

  return (
    <section
      className="mb-8 rounded-2xl border border-primary/30 bg-card p-5 sm:p-7 space-y-5"
      data-testid="section-activation-loop"
      aria-label="First value loop"
      id="activation-loop"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
            First value loop · {activation.role}
          </p>
          <h2 className="text-xl font-display font-black text-foreground">
            Get to real field <span className="text-spartan-red">value</span>
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Subscribing is not activation. Complete this short path in the real product — Command
            Center, prep, outcome, next action. Optional practice is available for reps.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="font-semibold shrink-0"
          disabled={!!busy}
          onClick={() => void patch({ skipActivation: true })}
          data-testid="activation-skip"
        >
          I know the product — skip
        </Button>
      </div>

      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span className="font-semibold uppercase tracking-wide">Required progress</span>
          <span className="tabular-nums font-semibold text-foreground">
            {activation.completedRequired}/{activation.totalRequired}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {activation.nextStep ? (
        <Card className="border border-primary/40 bg-primary/[0.06] p-4 space-y-3" data-testid="activation-next">
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Next step</p>
          <h3 className="text-lg font-bold text-foreground"><AccentText>{activation.nextStep.title}</AccentText></h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{activation.nextStep.why}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="font-bold" data-testid="activation-go">
              <Link href={activation.nextStep.webHref}>
                Open in product
                <ArrowRight className="w-4 h-4 ml-1" aria-hidden />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="font-semibold"
              disabled={busy === activation.nextStep.id}
              onClick={() =>
                void patch(
                  {
                    activationStep: { id: activation.nextStep!.id, done: true },
                  },
                  activation.nextStep!.id,
                )
              }
              data-testid="activation-mark-done"
            >
              {busy === activation.nextStep.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Mark done"
              )}
            </Button>
          </div>
        </Card>
      ) : null}

      <ol className="space-y-2">
        {activation.steps.map((step: ActivationStepStatus, i: number) => (
          <li
            key={step.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-3 py-2.5",
              step.done ? "border-border/60 bg-muted/20" : "border-border bg-background",
            )}
          >
            {step.done ? (
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {i + 1}. {step.title}
                {!step.required ? (
                  <span className="ml-2 text-[10px] font-bold uppercase text-muted-foreground">
                    Optional
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">{step.why}</p>
            </div>
            {!step.done ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 text-xs font-semibold"
                disabled={!!busy}
                onClick={() =>
                  void patch({ activationStep: { id: step.id, done: true } }, step.id)
                }
              >
                Done
              </Button>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
