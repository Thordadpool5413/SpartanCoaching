import { AccentText } from "@/components/AccentText";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBillingActions } from "@/hooks/useBillingActions";
import { PRICING_FACTS } from "@/lib/complianceCopy";
import { Lock, LogIn, KeyRound, Phone, CreditCard, Loader2, Shield, Check } from "lucide-react";
import {
  entitlementShellCopy,
  resolveEntitlementShell,
} from "@/lib/fieldKitCatalog";

type Props = {
  /** Compact mode for embedding above a tool */
  compact?: boolean;
};

/**
 * Gate when membership tools are locked (logged out, expired, suspended).
 */
export function FieldKitGate({ compact }: Props) {
  const { isAuthenticated, fieldKit, organization, member } = useAuth();
  const { toast } = useToast();
  const { startCheckout, openPortal, checkoutPending, portalPending } = useBillingActions();
  const [extMessage, setExtMessage] = useState("");
  const [extPending, setExtPending] = useState(false);
  const [extSent, setExtSent] = useState(false);

  const reason = fieldKit?.reason;
  const expired = reason === "expired" || organization?.status === "expired";
  const suspended = reason === "suspended" || organization?.status === "suspended";
  const isPersonal = organization?.type === "personal";
  const isPlatform = member?.role === "platform_admin" || organization?.type === "platform";
  const canSelfServe = isAuthenticated && isPersonal && !isPlatform;

  const shellId = resolveEntitlementShell({
    isAuthenticated,
    orgStatus: organization?.status,
    orgType: organization?.type,
    billingPlan: organization?.billingPlan,
    fieldKitAllowed: fieldKit?.allowed,
    fieldKitReason: fieldKit?.reason,
  });
  const shell = entitlementShellCopy(
    isAuthenticated ? shellId : "logged_out",
  );

  const title = shell.title;
  const body =
    expired && !canSelfServe
      ? "Thank you for putting real scenarios through Hospice Sales Pro. Continue as a client under contract, request an extension, or close the loop with a short debrief."
      : shell.body;

  const requestExtension = async () => {
    setExtPending(true);
    try {
      const res = await fetch("/api/auth/request-extension", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: extMessage.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      setExtSent(true);
      toast({
        title: "Extension requested",
        description: "We will review within one business day.",
      });
    } catch (err: any) {
      toast({
        title: "Could not submit",
        description: err?.message || "Try again or book a call.",
        variant: "destructive",
      });
    } finally {
      setExtPending(false);
    }
  };

  return (
    <div
      className={compact ? "py-8" : "min-h-[60vh] flex items-center justify-center px-4 py-16"}
      data-testid="membership-gate"
    >
      <Card className="w-full max-w-2xl border border-border bg-card p-8 sm:p-10 space-y-8">
        <div className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground"><AccentText>{title}</AccentText></h1>
          <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">{body}</p>
        </div>

        <div className="space-y-2 text-left">
          <p className="text-xs font-bold tracking-widest text-primary uppercase text-center">
            What unlocks with Hospice Sales Pro
          </p>
          <ul className="grid sm:grid-cols-2 gap-2 mb-3">
            {shell.benefits.map((b) => (
              <li key={b} className="flex gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" aria-hidden />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">{shell.restoreNote}</p>
          <div className="grid sm:grid-cols-2 gap-2 mt-4">
            {[
              {
                title: "Objection Handler",
                desc: "Field-ready responses to every objection you hear this week — 'not ready,' 'already have a provider,' and more.",
                cat: "Practice",
              },
              {
                title: "Playbook Generator",
                desc: "Custom talking points and a specific next-step ask for any account visit, generated in seconds.",
                cat: "Prepare",
              },
              {
                title: "Weekly Plan Builder",
                desc: "Monday–Friday territory plan with win conditions for every account before the week runs you.",
                cat: "Plan",
              },
              {
                title: "Role-Play Practice",
                desc: "Simulate physician and family conversations with AI feedback before you're in the room.",
                cat: "Practice",
              },
              {
                title: "Cold Call Script Generator",
                desc: "Openers, objection handlers, and a clear next-step ask — for a full block of new outreach.",
                cat: "Prepare",
              },
              {
                title: "Sales Command Center",
                desc: "Pre-call prep, outcome capture, coaching review, and next-step scheduling in one continuous workflow.",
                cat: "Plan",
              },
            ].map((t) => (
              <div key={t.title} className="border border-border rounded-md p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{t.title}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70 shrink-0">{t.cat}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center pt-1">+ Activity Calculator, ROI Calculator, Email Templates, Grounded Research, and more</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
          {!isAuthenticated && (
            <>
              <Button asChild className="font-bold" data-testid="gate-register">
                <Link href="/register">
                  <KeyRound className="mr-2 w-4 h-4" />
                  Create account to subscribe
                </Link>
              </Button>
              <Button asChild variant="outline" className="font-bold" data-testid="gate-login">
                <Link href="/login">
                  <LogIn className="mr-2 w-4 h-4" />
                  Client login
                </Link>
              </Button>
              <Button asChild variant="ghost" className="font-semibold" data-testid="gate-request">
                <Link href="/request-access">Team / evaluation access</Link>
              </Button>
            </>
          )}
          {canSelfServe && (expired || suspended || !fieldKit?.allowed) && (
            <Button
              className="font-bold"
              onClick={startCheckout}
              disabled={checkoutPending}
              data-testid="gate-subscribe"
            >
              {checkoutPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Redirecting…
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 w-4 h-4" />
                  Subscribe · {PRICING_FACTS.individualWeeklyLabel}
                </>
              )}
            </Button>
          )}
          {canSelfServe && suspended && (
            <Button
              variant="outline"
              className="font-bold"
              onClick={openPortal}
              disabled={portalPending}
              data-testid="gate-manage-billing"
            >
              {portalPending ? "Opening…" : "Manage billing"}
            </Button>
          )}
          {(expired || isAuthenticated) && (
            <Button asChild className={canSelfServe && (expired || suspended) ? "font-bold" : "font-bold"} variant={canSelfServe && (expired || suspended) ? "outline" : "default"} data-testid="gate-contact">
              <Link href="/contact?service=Hospice+Sales+Pro">
                <Phone className="mr-2 w-4 h-4" />
                {canSelfServe ? "Talk to Nick" : "Continue as a client — book a call"}
              </Link>
            </Button>
          )}
          {expired && (
            <Button asChild variant="outline" className="font-bold" data-testid="gate-pricing">
              <Link href="/hospice-sales-pro">View Hospice Sales Pro</Link>
            </Button>
          )}
          {isAuthenticated && (
            <Button asChild variant="ghost" className="font-bold" data-testid="gate-account">
              <Link href="/account">Account</Link>
            </Button>
          )}
        </div>

        {expired && (
          <div className="grid sm:grid-cols-3 gap-3 text-left text-sm">
            {[
              { t: "1. Debrief", d: "15–30 min call on what you tested and what stalled." },
              { t: "2. Choose a path", d: `Individual ${PRICING_FACTS.individualWeeklyShort}, team seats under contract, or coaching.` },
              { t: "3. Activate", d: "Subscribe from Account, or we activate your team under contract." },
            ].map((s) => (
              <div key={s.t} className="border border-border rounded-md p-3">
                <p className="font-bold text-foreground mb-1">{s.t}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        )}

        {expired && isAuthenticated && (
          <div className="border border-border rounded-md p-4 space-y-3 text-left">
            <p className="text-sm font-semibold text-foreground">Or request extended evaluation</p>
            {extSent ? (
              <p className="text-sm text-muted-foreground">
                Request received. We will review within one business day.
              </p>
            ) : (
              <>
                <Textarea
                  placeholder="Optional note for Nick (team size, what you still need to test)…"
                  value={extMessage}
                  onChange={(e) => setExtMessage(e.target.value)}
                  rows={3}
                />
                <Button
                  variant="outline"
                  className="font-bold"
                  disabled={extPending}
                  onClick={requestExtension}
                  data-testid="gate-extend"
                >
                  {extPending ? "Submitting…" : "Submit extension request"}
                </Button>
              </>
            )}
          </div>
        )}

        {expired && !isAuthenticated && (
          <div className="text-center">
            <Button asChild variant="outline" className="font-bold">
              <Link href="/request-access">Request extended evaluation</Link>
            </Button>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-muted-foreground justify-center max-w-md mx-auto">
          <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
          <p>
            Built for hospice growth professionals. Ethics-first. No PHI in tools.{" "}
            <Link href="/compliance" className="text-primary hover:underline">
              Compliance
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
