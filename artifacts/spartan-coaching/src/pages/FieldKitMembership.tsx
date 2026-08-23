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
  TrendingUp,
  Award,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SubscribeCTA } from "@/components/SubscribeCTA";
import { ProductMap } from "@/components/elite/ProductMap";
import { SectionHeader } from "@/components/elite/SectionHeader";
import { AppHandoffPanel } from "@/components/AppHandoffPanel";
import { PRICING_FACTS, PUBLIC_CLAIM_SAFE } from "@/lib/complianceCopy";
import { FIELD_KIT_TOOLS, FIELD_KIT_CATEGORIES, FIELD_KIT_CAT_BLURBS } from "@workspace/field-kit-catalog";

// Gated tools only (exclude brand-video which is public)
const GATED_TOOLS = FIELD_KIT_TOOLS.filter((t) => !t.public);

const TIER_TEAM_FEATURES = [
  "Multi-seat organization account",
  "Per-seat weekly rate on contract",
  "Org admin invites & seat control",
  "Usage visibility for leaders",
  "Contracted Standard or Elite access",
];

const TIER_ENTERPRISE_FEATURES = [
  "Everything in Team seats",
  "Custom seat packs under contract",
  "Leadership coaching & workshops",
  "Territory and pipeline systems",
  "Priority strategy access with Nick",
];

export default function FieldKitMembership() {
  const { canUseFieldKit } = useAuth();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 surface-page" data-testid="page-hospice-sales-pro">
      <SEO />

      {/* ── Hero — Hospice Sales Pro product ── */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
        <p className="text-kicker justify-center">Hospice Sales Pro</p>
        <h1 className="text-h1 font-display font-black text-foreground">
          The tools product for hospice growth.
          <br />
          <span className="text-primary">Command Center · practice · plans · resources.</span>
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed">
          Hospice Sales Pro is what you open on web and iPhone between coaching sessions — or on its own:
          Sales Command Center, objections, role-play, playbooks, weekly plans, calculators, and field resources.{" "}
          {PRICING_FACTS.heroLine}
        </p>
        <div className="flex flex-col items-center gap-3 pt-2" data-testid="membership-hero-cta">
          <SubscribeCTA
            surface="membership_pricing"
            showPreview
            showHint
            testId="membership-hero-subscribe"
          />
          <Button asChild variant="ghost" className="font-medium" size="sm">
            <Link href="/tools">Preview tools →</Link>
          </Button>
        </div>
      </div>

      {/* ── Trust strip (quiet) ── */}
      <div className="border border-border/80 rounded-xl bg-card/80 px-5 py-4 mb-12 max-w-3xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-sm">
          {[
            { icon: Award, t: "Built by territory reps" },
            { icon: CheckCircle, t: PUBLIC_CLAIM_SAFE.yearsHospice },
            { icon: TrendingUp, t: PUBLIC_CLAIM_SAFE.fieldCraft },
            { icon: Users, t: PUBLIC_CLAIM_SAFE.ethics },
          ].map(({ icon: Icon, t }) => (
            <div key={t} className="flex items-center gap-2 text-muted-foreground">
              <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground text-xs sm:text-sm">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Product map BEFORE pricing (understandability) ── */}
      <div className="mb-14" data-testid="section-tool-grid">
        <SectionHeader
          kicker="What's inside"
          title="One daily spine. Clear tool groups."
          description="Hospice Sales Pro is not thirteen equal features. Open Command Center for the day, then use practice, plan, and resources as satellites — same product on web and iPhone."
        />
        <ProductMap className="mb-8" />

        <details className="rounded-xl border border-border bg-card/50 p-4 sm:p-5">
          <summary className="cursor-pointer text-sm font-bold text-foreground">
            Full tool list ({GATED_TOOLS.length})
          </summary>
          <div className="space-y-6 mt-4">
            {FIELD_KIT_CATEGORIES.filter((cat) => GATED_TOOLS.some((t) => t.category === cat)).map((cat) => {
              const tools = GATED_TOOLS.filter((t) => t.category === cat);
              const config = FIELD_KIT_CAT_BLURBS[cat];
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
        </details>
      </div>

      {/* ── Access options (pricing after product understanding) ── */}
      <div className="mb-14">
        <SectionHeader
          kicker="Access"
          title="How people get Hospice Sales Pro"
          description="Individuals self-serve weekly. Teams and consulting-plus-seats use contract paths."
        />
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          <Card className="order-2 flex flex-col border border-border p-6 bg-card" data-testid="card-tier-individual">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Individual · Standard</p>
            <div className="w-11 h-11 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Hospice Sales Pro Standard</h2>
            <p className="mb-3">
              <span className="text-2xl font-black text-primary">
                ${PRICING_FACTS.individualWeeklyUsd.toFixed(2)}
              </span>
              <span className="text-sm font-semibold text-muted-foreground"> / week</span>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              The complete field system for disciplined weekly execution. Cancel anytime.
            </p>
            <ul className="space-y-2 mb-6 flex-1">
              {[
                "Command Center + practice tools",
                "Plans, calculators, resources",
                "Web + iPhone same product",
              ].map((f) => (
                <li key={f} className="flex gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div data-testid="button-tier-individual-subscribe">
              <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-individual" plan="standard_weekly" />
            </div>
          </Card>

          <Card className="order-1 flex flex-col border-2 border-primary p-6 bg-primary/[0.04] elite-emphasis" data-testid="card-tier-elite">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Elite · recommended</p>
            <div className="w-11 h-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">{PRICING_FACTS.eliteProductName}</h2>
            <p className="mb-3">
              <span className="text-2xl font-black text-primary">
                ${PRICING_FACTS.eliteWeeklyUsd.toFixed(2)}
              </span>
              <span className="text-sm font-semibold text-muted-foreground"> / week</span>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Standard plus private Spartan Coach and deidentified clinical guidance. Cancel anytime.
            </p>
            <ul className="space-y-2 mb-6 flex-1">
              {["Everything in Standard", "Private voice coaching", "Deidentified clinical guidance"].map((f) => (
                <li key={f} className="flex gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div data-testid="button-tier-elite-subscribe">
              <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-elite" plan="elite_weekly" />
            </div>
          </Card>

          <Card className="order-3 flex flex-col border border-border p-6 bg-card" data-testid="card-tier-team">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Teams</p>
            <div className="w-11 h-11 rounded-lg bg-muted text-foreground flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Provider seats</h2>
            <p className="mb-3">
              <span className="text-2xl font-black text-foreground">Contract</span>
              <span className="text-sm font-semibold text-muted-foreground"> · per seat / week</span>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Multi-seat org under your hospice contract. Admin invites and seat control.
            </p>
            <ul className="space-y-2 mb-6 flex-1">
              {TIER_TEAM_FEATURES.slice(0, 3).map((f) => (
                <li key={f} className="flex gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="w-full font-bold" variant="outline">
              <Link href="/request-access" data-testid="button-tier-team">
                Request team evaluation
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </Card>

          <Card className="flex flex-col border border-border p-6 bg-card" data-testid="card-tier-enterprise">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">With consulting</p>
            <div className="w-11 h-11 rounded-lg bg-muted text-foreground flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Enterprise + coaching</h2>
            <p className="mb-3">
              <span className="text-2xl font-black text-foreground">Engagement</span>
              <span className="text-sm font-semibold text-muted-foreground">-based</span>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Hospice Sales Pro seats bundled with leadership coaching and workshops.
            </p>
            <ul className="space-y-2 mb-6 flex-1">
              {TIER_ENTERPRISE_FEATURES.slice(0, 3).map((f) => (
                <li key={f} className="flex gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="w-full font-bold" variant="outline">
              <Link href="/contact?service=Consulting+%2B+Hospice+Sales+Pro" data-testid="button-tier-enterprise">
                Book a strategy call
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </Card>
        </div>
      </div>

      {/* ── Why (end-user edge) ── */}
      <div
        className="rounded-xl border border-primary/25 bg-primary/[0.04] p-8 sm:p-10 mb-14 text-center max-w-3xl mx-auto"
        data-testid="section-why-membership"
      >
        <TrendingUp className="w-8 h-8 text-primary mx-auto mb-4" />
        <h2 className="text-h3 font-bold text-foreground mb-3">
          Walk in prepared — not hoping the conversation goes your way.
          <br />
          <span className="text-primary">
            Standard builds prepared field work. Elite adds private coaching and clinical guidance.
          </span>
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The Objection Handler gives you the response before you walk into the room. Weekly Plan Builder makes Monday
          intentional. Command Center turns every visit into a continuous, coachable account workflow — not ten random
          tabs.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Preview tools free. Subscribe to generate, save, and run live. Cancel anytime from Account — access continues
          through the period you already paid for.
        </p>
        <div className="mt-6 flex justify-center" data-testid="membership-roi-subscribe">
          <SubscribeCTA surface="membership_pricing" showPreview showHint={false} testId="membership-why-cta" />
        </div>
      </div>

      <div className="mb-14">
        <AppHandoffPanel
          destination="home"
          title="One field system. Web and iPhone."
          description="Create or sign in with the same Hospice Sales Pro account on both surfaces. Web purchases restore after sign in; App Store purchases restore from Account on iPhone."
        />
      </div>

      {/* ── How it works ── */}
      <Card className="border border-border bg-card p-8 text-center space-y-4 max-w-3xl mx-auto mb-10">
        <h2 className="text-h3 font-bold">How to get access</h2>
        <ol className="text-left text-sm text-muted-foreground space-y-2 max-w-xl mx-auto list-decimal list-inside">
          <li>
            <strong className="text-foreground">Preview free</strong> — open any tool UI on the Tools page without
            paying.
          </li>
          <li>
            <strong className="text-foreground">Create your account</strong> — two minutes, no admin approval for
            individual seats.
          </li>
          <li>
            <strong className="text-foreground">Choose Standard or Elite</strong> from Account. Standard is {PRICING_FACTS.individualWeeklyLabel}. Elite is {PRICING_FACTS.eliteWeeklyLabel}. Cancel anytime.
          </li>
          <li>
            <strong className="text-foreground">Teams / providers:</strong> request team access — seats and weekly
            per-user rate under contract.
          </li>
        </ol>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 flex-wrap items-center">
          <SubscribeCTA surface="membership_pricing" showHint={false} testId="membership-subscribe" />
          {canUseFieldKit && (
            <Button asChild className="font-bold" variant="outline">
              <Link href="/account">Manage billing</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="font-bold">
            <Link href="/request-access">Team / evaluation</Link>
          </Button>
          <Button asChild variant="outline" className="font-bold">
            <Link href="/contact?service=Hospice+Sales+Pro">Talk through options</Link>
          </Button>
          <Button asChild variant="outline" className="font-bold">
            <Link href="/tools">Preview tools</Link>
          </Button>
        </div>
        <div
          className="text-left text-xs text-muted-foreground leading-relaxed border-t border-border pt-4 mt-2 max-w-2xl mx-auto space-y-2"
          data-testid="membership-legal"
        >
          <p className="font-semibold text-foreground text-sm">Billing terms (summary)</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong className="text-foreground">Individual:</strong> Standard is ${PRICING_FACTS.individualWeeklyUsd.toFixed(2)} USD per week. Elite is ${PRICING_FACTS.eliteWeeklyUsd.toFixed(2)} USD per week. Billing continues automatically until you cancel. Access continues through the paid period.
            </li>
            <li>
              <strong className="text-foreground">Provider / corporate:</strong> {PRICING_FACTS.teamNote} Seat counts
              and invoices are managed with Spartan Coaching; payment may be Stripe invoice or offline terms as agreed.
            </li>
            <li>{PRICING_FACTS.consultingSeparate}</li>
            <li>
              Failed payments may suspend Hospice Sales Pro access until the payment method is updated. No PHI belongs in
              tools.
            </li>
            <li>
              Full legal terms:{" "}
              <Link href="/trust" className="text-primary hover:underline">
                Trust Center
              </Link>
              {" · "}
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
