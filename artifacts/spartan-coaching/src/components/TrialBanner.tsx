import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useBillingActions } from "@/hooks/useBillingActions";
import { Clock, CreditCard, Loader2 } from "lucide-react";

/** Subtle evaluation countdown for trial clients + continue CTA */
export function TrialBanner() {
  const { isAuthenticated, organization, fieldKit, canUseFieldKit, member } = useAuth();
  const { startCheckout, checkoutPending } = useBillingActions();

  if (!isAuthenticated || !canUseFieldKit || organization?.status !== "trial") {
    return null;
  }

  const isPersonal =
    organization?.type === "personal" && member?.role !== "platform_admin";
  const hours = fieldKit?.hoursRemaining;
  let label = "Evaluation access active";
  if (hours != null) {
    if (hours < 1) {
      const mins = Math.max(1, Math.round(hours * 60));
      label = `Evaluation ends in ${mins}m`;
    } else if (hours < 48) {
      label = `Evaluation ends in ${Math.round(hours)}h`;
    } else {
      label = `Evaluation ends in ${Math.round(hours / 24)}d`;
    }
  }

  return (
    <div
      className="w-full bg-amber-500/10 border-b border-amber-500/25 text-amber-100/90 text-sm"
      data-testid="trial-banner"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5" />
          {label}
        </span>
        {isPersonal && (
          <>
            <button
              type="button"
              onClick={startCheckout}
              disabled={checkoutPending}
              className="inline-flex items-center gap-1 underline font-semibold hover:text-white disabled:opacity-60"
              data-testid="trial-banner-subscribe"
            >
              {checkoutPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              Continue $14.99/wk
            </button>
            <span className="text-amber-100/50">·</span>
          </>
        )}
        <Link
          href="/account"
          className="underline font-semibold hover:text-white"
        >
          Account
        </Link>
        <span className="text-amber-100/50">·</span>
        <Link
          href="/contact?service=Field+Kit+Debrief"
          className="underline font-semibold hover:text-white"
        >
          Book a debrief
        </Link>
        <span className="text-amber-100/50">·</span>
        <Link href="/portal" className="underline hover:text-white">
          First-session checklist
        </Link>
      </div>
    </div>
  );
}
