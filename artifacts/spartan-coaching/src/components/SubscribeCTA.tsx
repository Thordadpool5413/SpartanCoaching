import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useBillingActions } from "@/hooks/useBillingActions";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { ArrowRight, CreditCard, Loader2, ExternalLink } from "lucide-react";

export type SubscribeSurface =
  | "field_kit_hero"
  | "field_kit_why"
  | "field_kit_pricing"
  | "preview_lock"
  | "account"
  | "other";

type Props = {
  surface: SubscribeSurface;
  /** default = primary filled; outline / ghost for secondary placement */
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  /** Show supporting sublabel under the button cluster */
  showHint?: boolean;
  /** When true, also render Preview tools secondary for logged-out / locked */
  showPreview?: boolean;
  testId?: string;
};

/**
 * Honest Field Kit conversion CTA.
 * Self-serve individuals: register → expired org → Stripe subscribe.
 * Evaluation trials are admin/request-access only — never promised here.
 */
export function SubscribeCTA({
  surface,
  variant = "default",
  size = "lg",
  className,
  showHint = true,
  showPreview = false,
  testId = "subscribe-cta",
}: Props) {
  const { isAuthenticated, canUseFieldKit, organization, member, fieldKit } = useAuth();
  const { startCheckout, openPortal, checkoutPending, portalPending } = useBillingActions();

  const isPersonal = organization?.type === "personal";
  const isPlatform = member?.role === "platform_admin" || organization?.type === "platform";
  const isCompany = organization?.type === "company";
  const expired = fieldKit?.reason === "expired" || organization?.status === "expired";
  const suspended = fieldKit?.reason === "suspended" || organization?.status === "suspended";

  const canSelfServeCheckout =
    isAuthenticated &&
    isPersonal &&
    !isPlatform &&
    organization?.billingPlan !== "comp" &&
    !(
      organization?.status === "active" &&
      organization?.hasStripeSubscription &&
      (organization?.billingStatus === "active" || organization?.billingStatus === "trialing")
    );

  const track = (action: string) => {
    trackEvent("subscribe_cta", action, `${surface}:${action}`);
  };

  const hint = (() => {
    if (!showHint) return null;
    if (canUseFieldKit) return "Your membership is unlocked.";
    if (!isAuthenticated) {
      return "Create your account, then start membership · $14.99/week · cancel anytime";
    }
    if (canSelfServeCheckout) {
      return expired
        ? "Resubscribe to unlock live tools again · cancel anytime"
        : "Unlock tools & resources after checkout · cancel anytime from Account";
    }
    if (suspended && isPersonal) return "Update your card to restore access.";
    if (isCompany) return "Team seats are activated under contract — not self-serve individual checkout.";
    return null;
  })();

  const cluster = (() => {
    if (canUseFieldKit) {
      return (
        <Button asChild variant={variant} size={size} className={cn("font-bold", className)} data-testid={testId}>
          <Link href="/portal" onClick={() => track("open_field_kit")}>
            Open portal
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      );
    }

    if (!isAuthenticated) {
      return (
        <>
          <Button asChild variant={variant} size={size} className={cn("font-bold", className)} data-testid={testId}>
            <Link href="/register" onClick={() => track("register")}>
              Create account for membership
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          {showPreview && (
            <Button asChild variant="outline" size={size} className="font-bold" data-testid={`${testId}-preview`}>
              <Link href="/tools" onClick={() => track("preview")}>
                Preview tools
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" size={size} className="font-semibold">
            <Link href="/login" onClick={() => track("login")}>
              Sign in
            </Link>
          </Button>
        </>
      );
    }

    if (suspended && isPersonal && !isPlatform) {
      return (
        <Button
          variant={variant}
          size={size}
          className={cn("font-bold", className)}
          onClick={() => {
            track("portal_suspended");
            void openPortal();
          }}
          disabled={portalPending}
          data-testid={testId}
        >
          {portalPending ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Opening…
            </>
          ) : (
            <>
              Update billing
              <ExternalLink className="ml-2 w-3.5 h-3.5" />
            </>
          )}
        </Button>
      );
    }

    if (canSelfServeCheckout) {
      return (
        <>
          <Button
            variant={variant}
            size={size}
            className={cn("font-bold", className)}
            onClick={() => {
              track(expired ? "resubscribe" : "checkout");
              void startCheckout();
            }}
            disabled={checkoutPending}
            data-testid={testId}
          >
            {checkoutPending ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Redirecting…
              </>
            ) : (
              <>
                <CreditCard className="mr-2 w-4 h-4" />
                {expired ? "Resubscribe · $14.99/wk" : "Start membership · $14.99/wk"}
              </>
            )}
          </Button>
          {showPreview && (
            <Button asChild variant="outline" size={size} className="font-bold">
              <Link href="/tools" onClick={() => track("preview")}>
                Preview tools
              </Link>
            </Button>
          )}
        </>
      );
    }

    if (isCompany || (!isPersonal && isAuthenticated)) {
      return (
        <>
          <Button asChild variant={variant} size={size} className={cn("font-bold", className)} data-testid={testId}>
            <Link href="/request-access" onClick={() => track("team_request")}>
              Request team access
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size={size} className="font-bold">
            <Link href="/account">Account</Link>
          </Button>
        </>
      );
    }

    return (
      <Button asChild variant={variant} size={size} className={cn("font-bold", className)} data-testid={testId}>
        <Link href="/account" onClick={() => track("account")}>
          Account / billing
        </Link>
      </Button>
    );
  })();

  return (
    <div className="flex flex-col items-stretch sm:items-center gap-2 w-full sm:w-auto" data-testid={`${testId}-wrap`}>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center flex-wrap">{cluster}</div>
      {hint && <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-md mx-auto">{hint}</p>}
    </div>
  );
}
