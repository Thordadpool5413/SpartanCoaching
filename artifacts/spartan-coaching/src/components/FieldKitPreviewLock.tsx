import { useCallback, useState, type ReactNode, type SyntheticEvent } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useBillingActions } from "@/hooks/useBillingActions";
import {
  Lock,
  LogIn,
  KeyRound,
  CreditCard,
  Loader2,
  X,
  Eye,
  Phone,
} from "lucide-react";

type Props = {
  children: ReactNode;
};

function isAllowedPreviewTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  // Banner, unlock dialog, Field Kit chrome nav, pure links (breadcrumbs, etc.)
  if (target.closest("[data-preview-interactive]")) return true;
  if (target.closest('[data-testid="field-kit-chrome"]')) return true;
  if (target.closest('[data-testid="field-kit-preview-nudge"]')) return true;
  const anchor = target.closest("a[href]");
  if (anchor) {
    const href = anchor.getAttribute("href") || "";
    // Allow in-app navigation; block javascript: and empty hash-only no-ops still ok
    if (href && !href.startsWith("javascript:")) return true;
  }
  return false;
}

function isToolInteractionTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'button, input, textarea, select, label, form, [role="button"], [role="slider"], [contenteditable="true"], [data-radix-collection-item]',
    ),
  );
}

/**
 * Lets non-subscribers see the real Field Kit tool UI (layout, copy, defaults)
 * while blocking generate/save/run interactions. Server APIs stay requireFieldKit-gated.
 * Navigation (chrome, breadcrumbs, links) still works so users can browse tools.
 */
export function FieldKitPreviewLock({ children }: Props) {
  const { isAuthenticated, organization, member, fieldKit } = useAuth();
  const { startCheckout, openPortal, checkoutPending, portalPending } = useBillingActions();
  const [nudgeOpen, setNudgeOpen] = useState(false);

  const expired = fieldKit?.reason === "expired" || organization?.status === "expired";
  const suspended = fieldKit?.reason === "suspended" || organization?.status === "suspended";
  const isPersonal = organization?.type === "personal";
  const isPlatform = member?.role === "platform_admin" || organization?.type === "platform";
  const canSelfServe = isAuthenticated && isPersonal && !isPlatform;

  let bannerTitle = "Preview only — subscription required to use";
  if (expired) bannerTitle = "Evaluation ended — subscribe to unlock live tools";
  else if (suspended) bannerTitle = "Access paused — update billing to unlock";
  else if (isAuthenticated) bannerTitle = "Preview only — activate membership to use";

  const blockAndNudge = useCallback((e: SyntheticEvent) => {
    if (isAllowedPreviewTarget(e.target)) return;
    if (!isToolInteractionTarget(e.target) && e.type !== "submit") return;
    e.preventDefault();
    e.stopPropagation();
    setNudgeOpen(true);
  }, []);

  const blockTyping = useCallback((e: React.KeyboardEvent) => {
    if (isAllowedPreviewTarget(e.target)) return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest("input, textarea, select, [contenteditable='true']")) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Enter" || e.key.length === 1) setNudgeOpen(true);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-[50vh]" data-testid="field-kit-preview-lock">
      <div
        className="sticky top-0 z-40 border-b border-primary/25 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-sm"
        data-testid="field-kit-preview-banner"
        data-preview-interactive
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 justify-between">
          <div className="flex items-start sm:items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary shrink-0">
              <Eye className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-snug">{bannerTitle}</p>
              <p className="text-xs text-muted-foreground leading-snug">
                Full tool layout is visible. Generate, save, edit, and run require an active membership.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0 pl-10 sm:pl-0">
            {canSelfServe && (
              <Button
                size="sm"
                className="font-bold"
                onClick={startCheckout}
                disabled={checkoutPending}
                data-testid="preview-banner-subscribe"
              >
                {checkoutPending ? (
                  <>
                    <Loader2 className="mr-1.5 w-3.5 h-3.5 animate-spin" /> Redirecting…
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-1.5 w-3.5 h-3.5" />
                    Subscribe · $14.99/wk
                  </>
                )}
              </Button>
            )}
            {canSelfServe && suspended && (
              <Button
                size="sm"
                variant="outline"
                className="font-bold"
                onClick={openPortal}
                disabled={portalPending}
              >
                Manage billing
              </Button>
            )}
            {!isAuthenticated && (
              <>
                <Button size="sm" className="font-bold" asChild data-testid="preview-banner-register">
                  <Link href="/register">
                    <KeyRound className="mr-1.5 w-3.5 h-3.5" />
                    Create account to subscribe
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="font-bold" asChild>
                  <Link href="/login">
                    <LogIn className="mr-1.5 w-3.5 h-3.5" />
                    Sign in
                  </Link>
                </Button>
              </>
            )}
            {isAuthenticated && !canSelfServe && (
              <Button size="sm" className="font-bold" asChild>
                <Link href="/account">Account / billing</Link>
              </Button>
            )}
            <Button size="sm" variant="ghost" className="font-semibold" asChild>
              <Link href="/membership">Pricing</Link>
            </Button>
          </div>
        </div>
      </div>

      <div
        className="relative flex-1"
        data-testid="field-kit-preview-content"
        onClickCapture={blockAndNudge}
        onSubmitCapture={blockAndNudge}
        onChangeCapture={blockAndNudge}
        onInputCapture={blockAndNudge}
        onKeyDownCapture={blockTyping}
        onDropCapture={blockAndNudge}
        onDragOverCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="opacity-[0.96]">{children}</div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 z-[5] bg-gradient-to-t from-background/70 to-transparent"
          aria-hidden
        />
      </div>

      {nudgeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-unlock-title"
          data-testid="field-kit-preview-nudge"
          data-preview-interactive
          onClick={() => setNudgeOpen(false)}
        >
          <Card
            className="w-full max-w-md border border-border bg-card p-6 sm:p-8 space-y-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="preview-unlock-title" className="text-lg font-bold text-foreground">
                    Unlock this tool
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                    You&apos;re viewing the real membership tool interface. Live runs, AI generation, saves, and
                    exports require an active membership or evaluation window.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
                onClick={() => setNudgeOpen(false)}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {canSelfServe && (
                <Button
                  className="w-full font-bold"
                  onClick={startCheckout}
                  disabled={checkoutPending}
                  data-testid="preview-nudge-subscribe"
                >
                  {checkoutPending ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Redirecting…
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 w-4 h-4" />
                      Subscribe · $14.99/week
                    </>
                  )}
                </Button>
              )}
              {!isAuthenticated && (
                <>
                  <Button className="w-full font-bold" asChild data-testid="preview-nudge-register">
                    <Link href="/register">
                      <KeyRound className="mr-2 w-4 h-4" />
                      Create account to subscribe
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full font-bold" asChild>
                    <Link href="/login">
                      <LogIn className="mr-2 w-4 h-4" />
                      Client login
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full font-semibold" asChild>
                    <Link href="/request-access">Team / evaluation access</Link>
                  </Button>
                </>
              )}
              {isAuthenticated && !canSelfServe && (
                <Button className="w-full font-bold" asChild>
                  <Link href="/account">Go to account</Link>
                </Button>
              )}
              <Button variant="ghost" className="w-full font-semibold" asChild>
                <Link href="/contact?service=Membership">
                  <Phone className="mr-2 w-4 h-4" />
                  Talk to Nick
                </Link>
              </Button>
              <Button variant="ghost" className="w-full font-semibold" asChild>
                <Link href="/membership">View membership options</Link>
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              Ethics-first. No PHI in tools. Cancel anytime on individual plans.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
