import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { TrustStrip } from "@/components/TrustStrip";
import { CheckCircle, ArrowRight, Building2, User, Users, CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBillingActions } from "@/hooks/useBillingActions";

const TIERS = [
  {
    id: "individual",
    icon: User,
    name: "Individual Field Kit",
    price: "$14.99",
    priceSuffix: "/ week",
    blurb:
      "For the rep or director who wants private tools between coaching sessions. Cancel anytime from your account.",
    features: [
      "Full Field Kit access",
      "Calculators & weekly plan builders",
      "Role-play, drills, and Command Center",
      "Cancel yourself anytime (access until period ends)",
      "Optional 1:1 coaching add-on",
    ],
    cta: "Start with evaluation",
    href: "/request-access",
    secondaryCta: "I already have access — go to account",
    secondaryHref: "/account",
  },
  {
    id: "team",
    icon: Users,
    name: "Provider / team seats",
    price: "Contract",
    priceSuffix: " · per seat / week",
    blurb:
      "Weekly pricing per end user, set under your hospice contract. Org admin manages seats after activation.",
    features: [
      "Multi-seat organization account",
      "Per-seat weekly rate on contract",
      "Org admin invites & seat control",
      "Usage visibility for leaders",
      "BAA path for corporate accounts",
    ],
    cta: "Request team evaluation",
    href: "/request-access",
    highlight: true,
  },
  {
    id: "enterprise",
    icon: Building2,
    name: "Enterprise + coaching",
    price: "Engagement",
    priceSuffix: "-based",
    blurb: "Field Kit bundled with leadership coaching, workshops, and growth systems.",
    features: [
      "Everything in Team seats",
      "Custom seat packs under contract",
      "Leadership coaching & workshops",
      "Territory and pipeline systems",
      "Priority strategy access with Nick",
    ],
    cta: "Book a strategy call",
    href: "/contact?service=Field+Kit+Enterprise",
  },
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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12 sm:py-16" data-testid="page-field-kit-membership">
      <SEO />
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">Field Kit membership</p>
        <h1 className="text-h1 font-display font-black text-foreground">
          Private tools. Clear pricing. Human coaching when you need it.
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed">
          Individuals pay <strong className="text-foreground">$14.99 per week</strong> and can cancel in Account →
          Manage billing. Provider and enterprise seats use <strong className="text-foreground">contract
          weekly rates per seat</strong>. Most people start with a short evaluation.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {canSubscribe ? (
            <Button
              className="font-bold"
              onClick={startCheckout}
              disabled={checkoutPending}
              data-testid="membership-hero-subscribe"
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
          ) : isAuthenticated ? (
            <Button asChild className="font-bold">
              <Link href="/account">Open Account · manage billing</Link>
            </Button>
          ) : (
            <>
              <Button asChild className="font-bold">
                <Link href="/login">Log in to subscribe · $14.99/wk</Link>
              </Button>
              <Button asChild variant="outline" className="font-bold">
                <Link href="/request-access">Request evaluation first</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-14">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          return (
            <Card
              key={tier.id}
              className={`flex flex-col border p-6 bg-card ${
                tier.highlight ? "border-primary shadow-lg" : "border-border"
              }`}
              data-testid={`card-tier-${tier.id}`}
            >
              {tier.highlight && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Most teams</p>
              )}
              {tier.id === "individual" && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Self-serve</p>
              )}
              <div className="w-11 h-11 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">{tier.name}</h2>
              <p className="mb-3">
                <span className="text-2xl font-black text-primary">{tier.price}</span>
                {tier.priceSuffix && (
                  <span className="text-sm font-semibold text-muted-foreground">{tier.priceSuffix}</span>
                )}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">{tier.blurb}</p>
              <ul className="space-y-2 mb-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {tier.id === "individual" && canSubscribe ? (
                <Button
                  className="w-full font-bold"
                  onClick={startCheckout}
                  disabled={checkoutPending}
                  data-testid="button-tier-individual-subscribe"
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
              ) : (
                <Button asChild className="w-full font-bold" variant={tier.highlight ? "default" : "outline"}>
                  <Link href={tier.href} data-testid={`button-tier-${tier.id}`}>
                    {tier.cta}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              )}
              {tier.secondaryHref && isAuthenticated && (
                <Button asChild variant="ghost" className="w-full font-semibold mt-2 text-sm">
                  <Link href={tier.secondaryHref}>{tier.secondaryCta}</Link>
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="border border-border bg-card p-8 text-center space-y-4 max-w-3xl mx-auto">
        <h2 className="text-h3 font-bold">How it works</h2>
        <ol className="text-left text-sm text-muted-foreground space-y-2 max-w-xl mx-auto list-decimal list-inside">
          <li>Request evaluation access and get approved (timed Field Kit window).</li>
          <li>Use the tools — same product on web and in the field app.</li>
          <li>
            <strong className="text-foreground">Individuals:</strong> subscribe for $14.99/week from Account when ready.
            Cancel anytime in Manage billing; access continues until the period ends.
          </li>
          <li>
            <strong className="text-foreground">Teams / providers:</strong> we set seats and weekly per-user rate under
            contract, then activate your org.
          </li>
        </ol>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 flex-wrap">
          {canSubscribe && (
            <Button
              className="font-bold"
              onClick={startCheckout}
              disabled={checkoutPending}
              data-testid="membership-subscribe"
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
              <strong className="text-foreground">Individual:</strong> $14.99 USD per week, billed automatically until
              you cancel. Cancel anytime from Account → Manage billing. Access continues through the end of the paid
              week you already paid for (cancel at period end).
            </li>
            <li>
              <strong className="text-foreground">Provider / corporate:</strong> weekly price per seat is set in your
              contract. Seat counts and invoices are managed with Spartan Coaching; payment may be Stripe invoice or
              offline terms as agreed.
            </li>
            <li>
              Failed payments may suspend Field Kit access until the payment method is updated. No PHI belongs in tools.
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

      <div className="mt-12 max-w-5xl mx-auto">
        <TrustStrip compact />
      </div>
    </div>
  );
}
