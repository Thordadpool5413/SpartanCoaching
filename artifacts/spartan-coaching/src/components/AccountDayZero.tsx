import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBillingActions } from "@/hooks/useBillingActions";
import { trackEvent } from "@/lib/analytics";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import {
  CheckCircle,
  CreditCard,
  Loader2,
  ArrowRight,
  Crosshair,
  MessageSquare,
  CalendarDays,
  Eye,
} from "lucide-react";

type Props = {
  firstName?: string;
  /** just registered */
  isWelcome?: boolean;
  /** org ended evaluation or never activated */
  isExpired?: boolean;
  /** payment issue */
  isSuspended?: boolean;
};

const DAY_ZERO = [
  {
    icon: Crosshair,
    title: "Open Command Center",
    body: "Add one real account visit for this week — spine of your membership tools.",
  },
  {
    icon: MessageSquare,
    title: "Run one Objection Handler",
    body: "Paste a real 'not ready' or preferred-hospice line you heard (no PHI).",
  },
  {
    icon: CalendarDays,
    title: "Build Monday–Friday",
    body: "Weekly Plan Builder so Tuesday starts intentional, not reactive.",
  },
] as const;

/**
 * Ceremonial money-moment for personal accounts that can subscribe
 * but do not yet have membership access (register → expired → pay).
 */
export function AccountDayZero({ firstName, isWelcome, isExpired, isSuspended }: Props) {
  const { startCheckout, openPortal, checkoutPending, portalPending } = useBillingActions();
  const name = firstName?.trim() || "there";

  const headline = isSuspended
    ? "Restore access"
    : isExpired && !isWelcome
      ? "Membership access has ended"
      : isWelcome
        ? `Welcome, ${name}`
        : `You're one step from membership, ${name}`;

  const sub = isSuspended
    ? "Update your card to unlock live tools again. Preview still works while you're here."
    : isExpired && !isWelcome
      ? "Resubscribe for $14.99/week to unlock live tools again — or preview interfaces free anytime. Cancel anytime."
      : "Account created. Subscribe to generate, save, and run tools live. Cancel anytime from Manage billing.";

  const unlockTools = FIELD_KIT_TOOLS.filter((t) => t.id !== "brand-video").slice(0, 8);

  return (
    <Card
      className="border-2 border-primary/40 bg-primary/5 p-6 sm:p-8 space-y-6 shadow-md"
      data-testid="card-account-day-zero"
      id="day-zero"
      role="region"
      aria-labelledby="day-zero-heading"
    >
      <div className="space-y-2">
        <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
          {isWelcome ? "Almost there" : "Unlock membership"}
        </p>
        <h2
          id="day-zero-heading"
          className="text-2xl sm:text-3xl font-display font-black text-foreground leading-tight"
        >
          {headline}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">{sub}</p>
      </div>

      {/* Progress steps */}
      <ol className="grid sm:grid-cols-3 gap-3">
        {[
          { n: "1", t: "Account", d: "Done", done: true },
          {
            n: "2",
            t: "Subscribe",
            d: isSuspended ? "Update card" : "$14.99/week",
            done: false,
            active: true,
          },
          { n: "3", t: "Day Zero", d: "First field win", done: false },
        ].map((s) => (
          <li
            key={s.n}
            className={`rounded-lg border p-3 ${
              s.active
                ? "border-primary bg-background"
                : s.done
                  ? "border-border bg-background/60"
                  : "border-border/60 bg-background/40"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Step {s.n}</p>
            <p className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1.5">
              {s.done && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
              {s.t}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.d}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-col sm:flex-row gap-3">
        {isSuspended ? (
          <Button
            size="lg"
            className="font-bold"
            onClick={() => {
              trackEvent("account_day_zero", "portal", "suspended");
              void openPortal();
            }}
            disabled={portalPending}
            data-testid="button-day-zero-portal"
          >
            {portalPending ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Opening…
              </>
            ) : (
              <>
                <CreditCard className="mr-2 w-4 h-4" />
                Update billing
              </>
            )}
          </Button>
        ) : (
          <Button
            size="lg"
            className="font-bold"
            onClick={() => {
              trackEvent("account_day_zero", "checkout", isWelcome ? "welcome" : "locked");
              void startCheckout();
            }}
            disabled={checkoutPending}
            data-testid="button-day-zero-subscribe"
          >
            {checkoutPending ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Redirecting…
              </>
            ) : (
              <>
                <CreditCard className="mr-2 w-4 h-4" />
                {isExpired && !isWelcome ? "Resubscribe · $14.99/wk" : "Subscribe · $14.99/wk"}
              </>
            )}
          </Button>
        )}
        <Button size="lg" variant="outline" asChild className="font-bold">
          <Link href="/tools">
            <Eye className="mr-2 w-4 h-4" />
            Preview tools first
          </Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">What unlocks</p>
          <ul className="space-y-1.5">
            {unlockTools.map((t) => (
              <li key={t.id} className="flex gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold text-foreground">{t.title}</span>
                </span>
              </li>
            ))}
            <li className="text-xs text-muted-foreground pl-5">+ more · 13 tools total</li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">After you subscribe · Day Zero</p>
          <ul className="space-y-3">
            {DAY_ZERO.map((step) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary shrink-0">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Secure Stripe checkout · cancel anytime · access continues through the period you paid for ·{" "}
        <Link href="/membership" className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5">
          Why membership <ArrowRight className="w-3 h-3" />
        </Link>
      </p>
    </Card>
  );
}
