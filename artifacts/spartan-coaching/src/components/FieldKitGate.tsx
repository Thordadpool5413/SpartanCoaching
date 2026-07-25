import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBillingActions } from "@/hooks/useBillingActions";
import { Lock, LogIn, KeyRound, Phone, CreditCard, Loader2, Shield } from "lucide-react";

type Props = {
  /** Compact mode for embedding above a tool */
  compact?: boolean;
};

/**
 * Consulting-grade gate when Field Kit is locked (logged out, expired, suspended).
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

  let title = "Private Field Kit";
  let body =
    "The Spartan Field Kit is reserved for clients and approved evaluators — a private toolkit for hospice growth execution between coaching sessions.";

  if (expired) {
    title = "Your evaluation window has ended";
    body = canSelfServe
      ? "Thank you for testing the Field Kit. Individuals can continue for $14.99/week from your account — cancel anytime. Teams continue under a provider contract."
      : "Thank you for putting real scenarios through the Field Kit. Continue as a client under contract, request an extension, or close the loop with a short debrief.";
  } else if (suspended) {
    title = "Access is currently paused";
    body = canSelfServe
      ? "Often this is a failed payment. Update your card under Manage billing to restore Field Kit access."
      : "Your organization’s Field Kit access is paused. Update billing or contact Spartan Coaching to restore access.";
  } else if (isAuthenticated && !fieldKit?.allowed) {
    title = "Field Kit access is not active";
    body = "Your account is signed in, but Field Kit access is not currently active. Subscribe, renew, or contact us to continue.";
  }

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
      data-testid="field-kit-gate"
    >
      <Card className="w-full max-w-2xl border border-border bg-card p-8 sm:p-10 space-y-8">
        <div className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground">{title}</h1>
          <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">{body}</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-left">
          {[
            { label: "Prepare", desc: "Playbooks, cold calls, emails" },
            { label: "Practice", desc: "Objections, role-play, drills" },
            { label: "Plan & measure", desc: "Weekly plans, calculators" },
          ].map((c) => (
            <div key={c.label} className="border border-border rounded-md p-3">
              <p className="text-sm font-bold text-foreground">{c.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
          {!isAuthenticated && (
            <>
              <Button asChild className="font-bold" data-testid="gate-request">
                <Link href="/request-access">
                  <KeyRound className="mr-2 w-4 h-4" />
                  Request evaluation access
                </Link>
              </Button>
              <Button asChild variant="outline" className="font-bold" data-testid="gate-login">
                <Link href="/login">
                  <LogIn className="mr-2 w-4 h-4" />
                  Client login
                </Link>
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
                  Subscribe · $14.99/week
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
              <Link href="/contact?service=Field+Kit+Membership">
                <Phone className="mr-2 w-4 h-4" />
                {canSelfServe ? "Talk to Nick" : "Continue as a client — book a call"}
              </Link>
            </Button>
          )}
          {expired && (
            <Button asChild variant="outline" className="font-bold" data-testid="gate-pricing">
              <Link href="/field-kit-membership">View membership options</Link>
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
              { t: "2. Choose a path", d: "Individual $14.99/wk, team seats under contract, or coaching." },
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
