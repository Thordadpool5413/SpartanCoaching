import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useBillingActions } from "@/hooks/useBillingActions";
import { Clock, CreditCard, Loader2 } from "lucide-react";

// Tools to rotate through — no backend tracking needed, cycles by wall-clock time
const ROTATING_TOOLS = [
  { title: "Objection Handler", path: "/tools/objections" },
  { title: "Weekly Plan Builder", path: "/tools/weekly-plan-builder" },
  { title: "Cold Call Script Generator", path: "/tools/cold-call-script" },
  { title: "Role-Play Practice", path: "/tools/role-play" },
  { title: "Playbook Generator", path: "/tools/playbooks" },
  { title: "Sales Command Center", path: "/tools/sales-workflow" },
];

/** Subtle evaluation countdown for trial clients + tool-aware nudge */
export function TrialBanner() {
  const { isAuthenticated, organization, fieldKit, canUseFieldKit, member } = useAuth();
  const { startCheckout, checkoutPending } = useBillingActions();

  if (!isAuthenticated || !canUseFieldKit || organization?.status !== "trial") {
    return null;
  }

  const isPersonal =
    organization?.type === "personal" && member?.role !== "platform_admin";
  const hours = fieldKit?.hoursRemaining;

  let timeLabel = "Evaluation access active";
  if (hours != null) {
    if (hours < 1) {
      const mins = Math.max(1, Math.round(hours * 60));
      timeLabel = `${mins}m left`;
    } else if (hours < 48) {
      timeLabel = `${Math.round(hours)}h left`;
    } else {
      timeLabel = `${Math.round(hours / 24)}d left`;
    }
  }

  // Rotate every 15 minutes using wall-clock time — no state, no backend
  const rotatingTool =
    ROTATING_TOOLS[Math.floor(Date.now() / (1000 * 60 * 15)) % ROTATING_TOOLS.length];

  const hasTimeInfo = hours != null;

  return (
    <div
      className="w-full bg-amber-500/15 border-b border-amber-600/30 text-amber-950 dark:text-amber-100 text-sm"
      data-testid="trial-banner"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {hasTimeInfo ? (
            <>
              <span>{timeLabel} in your evaluation</span>
              <span className="text-amber-800/60 dark:text-amber-100/50 mx-1">—</span>
              <span>have you tried the</span>{" "}
              <Link
                href={rotatingTool.path}
                className="underline font-semibold hover:text-foreground"
                data-testid="trial-banner-tool-nudge"
              >
                {rotatingTool.title}
              </Link>
              <span>yet?</span>
            </>
          ) : (
            "Evaluation access active"
          )}
        </span>
        {isPersonal && (
          <>
            <span className="text-amber-800/60 dark:text-amber-100/50">·</span>
            <button
              type="button"
              onClick={startCheckout}
              disabled={checkoutPending}
              className="inline-flex items-center gap-1 underline font-semibold hover:text-foreground disabled:opacity-60"
              data-testid="trial-banner-subscribe"
            >
              {checkoutPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              Continue $14.99/wk
            </button>
          </>
        )}
        <span className="text-amber-800/60 dark:text-amber-100/50">·</span>
        <Link href="/account" className="underline font-semibold hover:text-foreground">
          Account
        </Link>
        <span className="text-amber-800/60 dark:text-amber-100/50">·</span>
        <Link
          href="/contact?service=Field+Kit+Debrief"
          className="underline font-semibold hover:text-foreground"
        >
          Book a debrief
        </Link>
      </div>
    </div>
  );
}
