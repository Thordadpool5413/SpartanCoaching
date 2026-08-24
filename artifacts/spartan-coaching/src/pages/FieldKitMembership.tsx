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
import { SectionHeader } from "@/components/elite/SectionHeader";
import { AppHandoffPanel } from "@/components/AppHandoffPanel";
import { PRICING_FACTS, PUBLIC_CLAIM_SAFE } from "@/lib/complianceCopy";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";

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

      {/* This destination owns choosing and managing access, not tool discovery. */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
        <p className="text-kicker justify-center">Hospice Sales Pro</p>
        <h1 className="text-h1 font-display font-black text-foreground">
          Choose access to your field system.
          <br />
          <span className="text-primary">Standard for the system. Elite for private Coach.</span>
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed">
          Choose an individual membership, request provider seats, or manage the access you already have.
          {` ${PRICING_FACTS.heroLine}`}
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

      <Card className="mb-14 border border-border bg-card p-6 sm:p-8" data-testid="section-membership-context">
        <p className="text-kicker mb-3">Before you choose</p>
        <h2 className="text-h3 font-display font-bold text-foreground">See the workspaces first.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Command Center guides today’s field work. Tools prepare and practice. Resources provide approved work aids.
          Use the directory to see a specific job; return here when you are ready to choose or manage access.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="font-bold">
            <Link href="/tools">Preview the tool directory</Link>
          </Button>
          <Button asChild variant="ghost" className="font-bold">
            <Link href="/resources">Browse field resources</Link>
          </Button>
        </div>
      </Card>

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

      <div className="mb-14">
        <AppHandoffPanel
          destination="home"
          title="One field system. Web and iPhone."
          description="Create or sign in with the same Hospice Sales Pro account on both surfaces. Web purchases restore after sign in; App Store purchases restore from Account on iPhone."
        />
      </div>

      {/* ── How it works ── */}
      <Card className="border border-border bg-card p-8 text-center space-y-4 max-w-3xl mx-auto mb-10">
        <h2 className="text-h3 font-bold">Choose or manage access</h2>
        <ol className="text-left text-sm text-muted-foreground space-y-2 max-w-xl mx-auto list-decimal list-inside">
          <li>
            <strong className="text-foreground">Choose Standard or Elite</strong> — Standard is {PRICING_FACTS.individualWeeklyLabel}; Elite is {PRICING_FACTS.eliteWeeklyLabel}.
          </li>
          <li>
            <strong className="text-foreground">Create or sign in to your account</strong> — your permitted access restores on web and iPhone.
          </li>
          <li>
            <strong className="text-foreground">Manage from Account</strong> — cancel individual access anytime; teams request contracted seats.
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
      <PublicConversionPanel
        source="hospice_sales_pro"
        audience="Individual hospice sales professionals who need daily field preparation, practice, and planning tools."
        promise="Use the same permitted Hospice Sales Pro account on web and iPhone, with live tools after subscription."
        evidence={`${PRICING_FACTS.previewNote} ${PRICING_FACTS.individualBillingNote}`}
        primary={{ label: "Create account for Hospice Sales Pro", href: "/register", token: "create_account" }}
        secondary={{ label: "Request team or evaluation access", href: "/request-access", token: "team_access" }}
      />
    </div>
  );
}
