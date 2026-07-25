import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import {
  CheckCircle,
  ArrowRight,
  Building2,
  User,
  Users,
  CreditCard,
  Loader2,
  TrendingUp,
  Award,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBillingActions } from "@/hooks/useBillingActions";
import { FIELD_KIT_TOOLS, FIELD_KIT_CATEGORIES } from "@workspace/field-kit-catalog";

// Gated tools only (exclude brand-video which is public)
const GATED_TOOLS = FIELD_KIT_TOOLS.filter((t) => !t.public);

// Category display order and labels
const CAT_CONFIG: Record<string, { label: string; blurb: string }> = {
  Prepare: {
    label: "Prepare",
    blurb: "Build the right approach before every visit",
  },
  Practice: {
    label: "Practice",
    blurb: "Sharpen the conversations that move referrals",
  },
  Plan: {
    label: "Plan",
    blurb: "Structure every week and every account call",
  },
  Measure: {
    label: "Measure",
    blurb: "Connect field behavior to business outcomes",
  },
};

const TIER_TEAM_FEATURES = [
  "Multi-seat organization account",
  "Per-seat weekly rate on contract",
  "Org admin invites & seat control",
  "Usage visibility for leaders",
  "BAA path for corporate accounts",
];

const TIER_ENTERPRISE_FEATURES = [
  "Everything in Team seats",
  "Custom seat packs under contract",
  "Leadership coaching & workshops",
  "Territory and pipeline systems",
  "Priority strategy access with Nick",
];

export default function FieldKitMembership() {
  const { isAuthenticated, canUseFieldKit, organization, member } = useAuth();
  const { startCheckout, checkoutPending } = useBillingActions();
  const isPersonal = organization?.type === "personal";
  const isPlatform = member?.role === "platform_admin" || organization?.type === "platform";
  const canSubscribe =
    isAuthenticated &&
    isPersonal &&
    !isPlatform &&
    organization?.billingPlan !== "comp" &&
    !(
      organization?.status === "active" &&
      organization?.hasStripeSubscription &&
      (organization?.billingStatus === "active" || organization?.billingStatus === "trialing")
    );

  const SubscribeBtn = ({ testId, size }: { testId: string; size?: "default" | "lg" }) => (
    <Button
      className="font-bold"
      size={size}
      onClick={startCheckout}
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
          Subscribe · $14.99/week
        </>
      )}
    </Button>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12 sm:py-16" data-testid="page-field-kit-membership">
      <SEO />

      {/* ── Hero ── */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">Field Kit membership</p>
        <h1 className="text-h1 font-display font-black text-foreground">
          Private tools. Clear pricing. Human coaching when you need it.
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed">
          Individuals pay <strong className="text-foreground">$14.99 per week</strong> and can cancel in Account →
          Manage billing. Provider and enterprise seats use{" "}
          <strong className="text-foreground">contract weekly rates per seat</strong>. Most people start with a short
          evaluation.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {canSubscribe ? (
            <SubscribeBtn testId="membership-hero-subscribe" size="lg" />
          ) : isAuthenticated ? (
            <Button asChild className="font-bold" size="lg">
              <Link href="/account">Open Account · manage billing</Link>
            </Button>
          ) : (
            <>
              <Button asChild className="font-bold" size="lg">
                <Link href="/register" data-testid="membership-hero-register">Create account · start free trial</Link>
              </Button>
              <Button asChild variant="outline" className="font-bold" size="lg">
                <Link href="/login">Already have an account? Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Social proof strip ── */}
      <div className="border border-border rounded-xl bg-card px-6 py-5 mb-12 max-w-3xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-foreground">12+ years hospice-specific</span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-foreground">500+ reps &amp; leaders coached</span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-foreground">Ethics-first · no PHI in tools</span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-foreground">Built by someone who ran the territory</span>
          </div>
        </div>
      </div>

      {/* ── Tier cards ── */}
      <div className="grid md:grid-cols-3 gap-6 mb-14">
        {/* Individual */}
        <Card
          className="flex flex-col border p-6 bg-card border-border"
          data-testid="card-tier-individual"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Self-serve</p>
          <div className="w-11 h-11 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4">
            <User className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">Individual Field Kit</h2>
          <p className="mb-3">
            <span className="text-2xl font-black text-primary">$14.99</span>
            <span className="text-sm font-semibold text-muted-foreground"> / week</span>
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            For the rep or director who wants private tools between coaching sessions. Cancel anytime from your account.
          </p>
          <ul className="space-y-2 mb-6 flex-1">
            {[
              "All 13 gated Field Kit tools",
              "Objection Handler, Role-Play, Playbooks",
              "Weekly Plan Builder & Sales Command Center",
              "Activity, ROI & Rep Cost Calculators",
              "Cancel anytime — access through paid period",
            ].map((f) => (
              <li key={f} className="flex gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {canSubscribe ? (
            <SubscribeBtn testId="button-tier-individual-subscribe" />
          ) : (
            <Button asChild className="w-full font-bold" data-testid="button-tier-individual">
              <Link href="/register">
                Create account — start free trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          )}
          {isAuthenticated && (
            <Button asChild variant="ghost" className="w-full font-semibold mt-2 text-sm">
              <Link href="/account">I already have access — go to account</Link>
            </Button>
          )}
        </Card>

        {/* Team */}
        <Card
          className="flex flex-col border border-primary shadow-lg p-6 bg-card"
          data-testid="card-tier-team"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Most teams</p>
          <div className="w-11 h-11 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">Provider / team seats</h2>
          <p className="mb-3">
            <span className="text-2xl font-black text-primary">Contract</span>
            <span className="text-sm font-semibold text-muted-foreground"> · per seat / week</span>
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Weekly pricing per end user, set under your hospice contract. Org admin manages seats after activation.
          </p>
          <ul className="space-y-2 mb-6 flex-1">
            {TIER_TEAM_FEATURES.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="w-full font-bold">
            <Link href="/request-access" data-testid="button-tier-team">
              Request team evaluation
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </Card>

        {/* Enterprise */}
        <Card
          className="flex flex-col border p-6 bg-card border-border"
          data-testid="card-tier-enterprise"
        >
          <div className="w-11 h-11 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4 mt-[22px]">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">Enterprise + coaching</h2>
          <p className="mb-3">
            <span className="text-2xl font-black text-primary">Engagement</span>
            <span className="text-sm font-semibold text-muted-foreground">-based</span>
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Field Kit bundled with leadership coaching, workshops, and growth systems.
          </p>
          <ul className="space-y-2 mb-6 flex-1">
            {TIER_ENTERPRISE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="w-full font-bold" variant="outline">
            <Link href="/contact?service=Field+Kit+Enterprise" data-testid="button-tier-enterprise">
              Book a strategy call
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </Card>
      </div>

      {/* ── What's inside the Field Kit ── */}
      <div className="mb-14" data-testid="section-tool-grid">
        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">What you're getting</p>
          <h2 className="text-h2 font-display font-black text-foreground mb-3">
            13 private tools. Every one built for hospice.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Generic sales AI doesn't know the difference between a skeptical oncologist and a long-term care
            director. Every tool here was built on the real conversations that hospice growth professionals
            have on Tuesday mornings.
          </p>
        </div>

        <div className="space-y-8">
          {FIELD_KIT_CATEGORIES.filter((cat) => GATED_TOOLS.some((t) => t.category === cat)).map((cat) => {
            const tools = GATED_TOOLS.filter((t) => t.category === cat);
            const config = CAT_CONFIG[cat];
            return (
              <div key={cat}>
                <div className="flex items-baseline gap-3 mb-3 border-b border-border pb-2">
                  <h3 className="text-base font-bold text-foreground">{config?.label ?? cat}</h3>
                  {config?.blurb && (
                    <p className="text-sm text-muted-foreground">{config.blurb}</p>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {tools.map((tool) => (
                    <div key={tool.id} className="flex gap-3 p-3 rounded-lg border border-border bg-card">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-foreground">{tool.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tool.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ROI framing ── */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-8 sm:p-10 mb-14 text-center max-w-3xl mx-auto" data-testid="section-roi">
        <TrendingUp className="w-8 h-8 text-primary mx-auto mb-4" />
        <h2 className="text-h3 font-bold text-foreground mb-3">
          At $14.99 a week, one better conversation pays for the month.
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The Activity Calculator turns a vague admission goal into a specific number of conversations per day.
          The ROI Calculator puts a revenue number next to every percentage-point improvement in conversion.
          The Objection Handler turns a stalled "not ready" into an education moment that keeps the relationship moving.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A single hospice admission is typically worth $10,000–$20,000 in Medicare revenue to the provider.
          The tools in this kit exist to reduce the number of eligible patients who never get that conversation.
          At $14.99/week, the math is obvious.
        </p>
        {canSubscribe && (
          <div className="mt-6">
            <SubscribeBtn testId="membership-roi-subscribe" size="lg" />
          </div>
        )}
        {!isAuthenticated && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="font-bold" size="lg">
              <Link href="/register">Create account — start free trial</Link>
            </Button>
            <Button asChild variant="outline" className="font-bold" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        )}
      </div>

      {/* ── How it works ── */}
      <Card className="border border-border bg-card p-8 text-center space-y-4 max-w-3xl mx-auto mb-10">
        <h2 className="text-h3 font-bold">How it works</h2>
        <ol className="text-left text-sm text-muted-foreground space-y-2 max-w-xl mx-auto list-decimal list-inside">
          <li>Request evaluation access and get approved (timed Field Kit window).</li>
          <li>Use the tools — same product on web and in the field app.</li>
          <li>
            <strong className="text-foreground">Individuals:</strong> subscribe for $14.99/week from Account when
            ready. Cancel anytime in Manage billing; access continues until the period ends.
          </li>
          <li>
            <strong className="text-foreground">Teams / providers:</strong> we set seats and weekly per-user rate
            under contract, then activate your org.
          </li>
        </ol>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 flex-wrap">
          {canSubscribe && <SubscribeBtn testId="membership-subscribe" />}
          {canUseFieldKit ? (
            <Button asChild className="font-bold" variant={canSubscribe ? "outline" : "default"}>
              <Link href="/account">Manage membership</Link>
            </Button>
          ) : (
            <Button asChild className="font-bold" variant={canSubscribe ? "outline" : "default"}>
              <Link href="/request-access">Request evaluation access</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="font-bold">
            <Link href="/contact?service=Field+Kit+Membership">Talk through options</Link>
          </Button>
          <Button asChild variant="outline" className="font-bold">
            <Link href="/tools">See the Field Kit</Link>
          </Button>
        </div>
        <div
          className="text-left text-xs text-muted-foreground leading-relaxed border-t border-border pt-4 mt-2 max-w-2xl mx-auto space-y-2"
          data-testid="membership-legal"
        >
          <p className="font-semibold text-foreground text-sm">Billing terms (summary)</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong className="text-foreground">Individual:</strong> $14.99 USD per week, billed automatically
              until you cancel. Cancel anytime from Account → Manage billing. Access continues through the end of
              the paid week you already paid for (cancel at period end).
            </li>
            <li>
              <strong className="text-foreground">Provider / corporate:</strong> weekly price per seat is set in
              your contract. Seat counts and invoices are managed with Spartan Coaching; payment may be Stripe
              invoice or offline terms as agreed.
            </li>
            <li>
              Failed payments may suspend Field Kit access until the payment method is updated. No PHI belongs in
              tools.
            </li>
            <li>
              Full legal terms:{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
              {" · "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy
              </Link>
              .
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
