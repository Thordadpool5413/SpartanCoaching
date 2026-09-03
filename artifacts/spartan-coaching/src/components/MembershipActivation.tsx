import { AccentText } from "@/components/AccentText";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Crosshair, Loader2, Sparkles, Shield, X } from "lucide-react";

function queryFlag(name: string): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has(name) ||
    new URLSearchParams(window.location.search).get(name) === "1";
}

/**
 * Post-Stripe ceremony: confirm entitlement (webhook may lag), then
 * route attention into Command Center — not billing Account.
 */
export function MembershipActivation() {
  const { organization, canUseFieldKit, refresh, member } = useAuth();
  const [show, setShow] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!queryFlag("activated")) return;
    setShow(true);
    // Clean query without full reload
    const url = new URL(window.location.href);
    url.searchParams.delete("activated");
    url.searchParams.delete("session_id");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, []);

  useEffect(() => {
    if (!show) return;
    if (canUseFieldKit && organization?.status === "active") {
      setConfirmed(true);
      setConfirming(false);
      return;
    }
    setConfirming(true);
    let tries = 0;
    const maxTries = 12; // ~30s
    const tick = async () => {
      tries += 1;
      await refresh();
      // refresh updates context async; re-check on next render via deps
      if (tries >= maxTries) setConfirming(false);
    };
    const id = window.setInterval(() => {
      void tick();
    }, 2500);
    void tick();
    return () => window.clearInterval(id);
  }, [show, canUseFieldKit, organization?.status, refresh]);

  useEffect(() => {
    if (show && canUseFieldKit && organization?.status === "active") {
      setConfirmed(true);
      setConfirming(false);
    }
  }, [show, canUseFieldKit, organization?.status]);

  if (!show) return null;

  const firstName = member?.name?.split(" ")[0] || "";
  const planLabel =
    organization?.billingPlan === "individual_weekly"
      ? "Individual · $14.99/week"
      : organization?.billingPlan === "corporate_contract"
        ? "Team · under contract"
        : organization?.billingPlan === "comp"
          ? "Complimentary access"
          : "Hospice Sales Pro";

  const dismiss = () => setShow(false);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      data-testid="membership-activation-ceremony"
      role="dialog"
      aria-modal="true"
      aria-labelledby="membership-activation-title"
    >
      <Card className="relative w-full max-w-lg border-2 border-primary/40 bg-card p-8 sm:p-10 space-y-6 shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-3 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            {confirming && !confirmed ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <Sparkles className="w-7 h-7" />
            )}
          </div>
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
            Hospice Sales Pro
          </p>
          <h2
            id="membership-activation-title"
            className="text-2xl sm:text-3xl font-display font-black text-foreground"
          ><AccentText>{confirmed
              ? `You're in${firstName ? `, ${firstName}` : ""}`
              : confirming
                ? "Confirming Hospice Sales Pro…"
                : `Welcome${firstName ? `, ${firstName}` : ""}`}</AccentText></h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {confirmed
              ? "Hospice Sales Pro is active. Start in Sales Command Center — add your next facility account (no PHI) and run the day from there."
              : confirming
                ? "Payment received. Unlocking Hospice Sales Pro tools — this usually takes a few seconds."
                : "If tools stay locked, refresh in a moment or open Account. Support can confirm billing if needed."}
          </p>
          {confirmed && (
            <p className="text-xs font-semibold text-foreground border border-border rounded-md px-3 py-2 inline-block">
              {planLabel} · cancel anytime from Account
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild className="font-bold w-full" size="lg" data-testid="activation-open-command">
            <Link href="/tools/sales-workflow" onClick={dismiss}>
              <Crosshair className="mr-2 w-4 h-4" />
              Open Command Center
            </Link>
          </Button>
          <Button asChild variant="outline" className="font-bold w-full" onClick={dismiss}>
            <Link href="/portal">Stay on portal</Link>
          </Button>
          <Button asChild variant="ghost" className="font-semibold w-full text-sm">
            <Link href="/account" onClick={dismiss}>
              Manage billing
            </Link>
          </Button>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground justify-center">
          <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
          <p>Facility and field work only — never patient names, MRNs, or other PHI.</p>
        </div>
      </Card>
    </div>
  );
}
