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
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { FIELD_KIT_TOOLS, FIELD_KIT_CATEGORIES, FIELD_KIT_CAT_BLURBS } from "@workspace/field-kit-catalog";

// Gated tools only (exclude brand-video which is public)
const GATED_TOOLS = FIELD_KIT_TOOLS.filter((tool) => !tool.public);

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
      <div className="text-center max-w-4xl mx-auto mb-16 space-y-6">
        <p className="home-photo-kicker text-[#d61f26] border-[#d61f26] justify-center mx-auto">Hospice Sales Pro</p>
        <h1 className="font-display text-[clamp(3.5rem,8vw,6.5rem)] font-black uppercase leading-[0.88] tracking-[-0.04em] text-[#11131d]">
          Walk in ready.
          <br />
          <span className="text-[#d61f26]">Leave with the next move.</span>
        </h1>
        <p className="max-w-3xl mx-auto text-[1.2rem] leading-[1.65] text-[#11131d]/70">
          Stop winging the conversations that decide whether someone understands hospice. Prepare the account,
          practice the language, run the numbers, and keep the next commitment connected on web and iPhone.
          <span className="font-semibold text-[#11131d]/80 block mt-2">{` ${PRICING_FACTS.heroLine}`}</span>
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6" data-testid="membership-hero-cta">
          <SubscribeCTA
            surface="membership_pricing"
            showPreview
            showHint
            testId="membership-hero-subscribe"
            className="home-photo-button home-photo-button-primary bg-[#d61f26] border-[#d61f26] w-full sm:w-auto text-[13px] py-4 px-8"
          />
        </div>
      </div>

      {/* ── Trust strip (quiet) ── */}
      <div className="border border-[#11131d]/10 bg-white shadow-sm p-6 mb-20 max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
          {[
            { icon: Award, t: "Built by a hospice sales coach" },
            { icon: CheckCircle, t: PUBLIC_CLAIM_SAFE.yearsHospice },
            { icon: TrendingUp, t: PUBLIC_CLAIM_SAFE.fieldCraft },
            { icon: Users, t: PUBLIC_CLAIM_SAFE.ethics },
          ].map(({ icon: Icon, t }) => (
            <div key={t} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-[#d61f26]" />
              <span className="font-bold text-[0.8rem] uppercase tracking-widest text-[#11131d]/80">{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-20 border border-[#11131d]/10 bg-white shadow-xl p-8 sm:p-12" data-testid="section-membership-context">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between pb-10 border-b border-[#11131d]/10">
          <div>
            <p className="home-photo-kicker text-[#d61f26] border-[#d61f26] mb-4">Choose your path</p>
            <h2 className="font-display text-[2rem] font-black uppercase leading-[1.05] tracking-tight text-[#11131d] max-w-2xl">See the workspaces first. Start with the way you work.</h2>
          </div>
          <p className="max-w-sm text-[1rem] leading-[1.65] text-[#11131d]/70 pb-1">
            One product, three ways in. Use the directory to see a specific job, then pick the route that matches your role and the amount of support you need.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="border border-[#11131d]/10 p-8 hover:bg-neutral-50 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-5 w-5 text-[#d61f26]" aria-hidden />
              <p className="text-[1.1rem] font-bold text-[#11131d]">Individual rep</p>
            </div>
            <p className="text-[0.95rem] leading-[1.65] text-[#11131d]/70 mb-8">
              Choose Standard for self-serve field execution or Elite when private coaching and policy education matter.
            </p>
            <Link href="#access-options" className="text-[0.85rem] font-bold text-[#d61f26] uppercase tracking-widest flex items-center group">
              Compare individual plans <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" aria-hidden />
            </Link>
          </div>
          <div className="border border-[#11131d]/10 p-8 hover:bg-neutral-50 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-5 w-5 text-[#d61f26]" aria-hidden />
              <p className="text-[1.1rem] font-bold text-[#11131d]">Team or provider</p>
            </div>
            <p className="text-[0.95rem] leading-[1.65] text-[#11131d]/70 mb-8">
              Request a timed evaluation, then arrange contracted seats and onboarding if it fits your organization.
            </p>
            <Link href="/request-access" className="text-[0.85rem] font-bold text-[#d61f26] uppercase tracking-widest flex items-center group">
              Request team access <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" aria-hidden />
            </Link>
          </div>
          <div className="border border-[#11131d]/10 p-8 hover:bg-neutral-50 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-5 w-5 text-[#d61f26]" aria-hidden />
              <p className="text-[1.1rem] font-bold text-[#11131d]">Consulting + seats</p>
            </div>
            <p className="text-[0.95rem] leading-[1.65] text-[#11131d]/70 mb-8">
              Combine Hospice Sales Pro with leadership coaching, workshops, or a broader growth engagement.
            </p>
            <Link href="/contact?service=Consulting+%2B+Hospice+Sales+Pro" className="text-[0.85rem] font-bold text-[#d61f26] uppercase tracking-widest flex items-center group">
              Book a strategy call <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/tools" className="home-photo-button home-photo-button-outline">Preview the tool directory</Link>
          <Link href="/resources" className="home-photo-button home-photo-button-outline border-transparent">Browse field resources</Link>
        </div>
      </div>
      <div className="mb-20" data-testid="section-tool-grid">
        <div className="text-center mb-12">
          <p className="home-photo-kicker text-[#d61f26] border-[#d61f26] justify-center mx-auto mb-4">What's inside</p>
          <h2 className="font-display text-[2.5rem] font-black uppercase tracking-tight text-[#11131d]">One daily spine. Clear tool groups.</h2>
          <p className="mt-4 max-w-2xl mx-auto text-[1.1rem] leading-[1.65] text-[#11131d]/70">
            Hospice Sales Pro is not thirteen equal features. Open Command Center for the day, then use practice, plan, and resources as satellites — same product on web and iPhone.
          </p>
        </div>
        <ProductMap className="mb-8" />

        <details className="border border-[#11131d]/10 bg-white shadow-sm p-6 sm:p-8">
          <summary className="cursor-pointer text-[1.05rem] font-bold text-[#11131d]">
            Full tool list ({GATED_TOOLS.length})
          </summary>
          <div className="space-y-10 mt-8">
            {FIELD_KIT_CATEGORIES.filter((cat) => GATED_TOOLS.some((t) => t.category === cat)).map((cat) => {
              const tools = GATED_TOOLS.filter((t) => t.category === cat);
              const config = FIELD_KIT_CAT_BLURBS[cat];
              return (
                <div key={cat}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-6 border-b border-[#11131d]/10 pb-4">
                    <h3 className="text-[1.2rem] font-bold text-[#11131d] uppercase tracking-tight">{config?.label ?? cat}</h3>
                    {config?.blurb && (
                      <p className="text-[0.95rem] text-[#11131d]/70">{config.blurb}</p>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {tools.map((tool) => (
                      <div key={tool.id} className="flex gap-4 p-5 border border-[#11131d]/10 bg-neutral-50/50">
                        <CheckCircle className="w-5 h-5 text-[#d61f26] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[1rem] font-bold text-[#11131d]">{tool.title}</p>
                          <p className="text-[0.9rem] text-[#11131d]/70 mt-1.5 leading-[1.6]">{tool.description}</p>
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
      <div className="mb-20 scroll-mt-32" id="access-options">
        <div className="text-center mb-12">
          <p className="home-photo-kicker text-[#d61f26] border-[#d61f26] justify-center mx-auto mb-4">Access</p>
          <h2 className="font-display text-[2.5rem] font-black uppercase tracking-tight text-[#11131d]">How people get Hospice Sales Pro</h2>
          <p className="mt-4 max-w-2xl mx-auto text-[1.1rem] leading-[1.65] text-[#11131d]/70">
            Individuals self-serve weekly. Teams and consulting-plus-seats use contract paths.
          </p>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="order-2 flex flex-col border border-[#11131d]/10 p-8 bg-white shadow-sm hover:shadow-xl transition-shadow" data-testid="card-tier-individual">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#d61f26] mb-4">Individual · Standard</p>
            <div className="w-12 h-12 bg-[#d61f26]/5 text-[#d61f26] flex items-center justify-center mb-6">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-[1.2rem] font-bold text-[#11131d] mb-2">Hospice Sales Pro Standard</h2>
            <p className="mb-4">
              <span className="text-[1.8rem] font-black text-[#d61f26]">
                ${PRICING_FACTS.individualWeeklyUsd.toFixed(2)}
              </span>
              <span className="text-[0.9rem] font-bold text-[#11131d]/50"> / week</span>
            </p>
            <p className="text-[0.95rem] text-[#11131d]/70 leading-[1.6] mb-8">
              The complete field system for disciplined weekly execution. Cancel anytime.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Command Center + practice tools",
                "Plans, calculators, resources",
                "Web + iPhone same product",
              ].map((f) => (
                <li key={f} className="flex gap-3 text-[0.9rem] text-[#11131d]/80">
                  <CheckCircle className="w-4 h-4 text-[#d61f26] shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div data-testid="button-tier-individual-subscribe">
              <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-individual" plan="standard_weekly" className="home-photo-button home-photo-button-primary bg-[#d61f26] border-[#d61f26] w-full" />
            </div>
          </div>

          <div className="order-1 flex flex-col border-2 border-[#d61f26] p-8 bg-[#d61f26]/[0.02] shadow-xl relative" data-testid="card-tier-elite">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#d61f26] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1">Recommended</div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#d61f26] mb-4">Elite</p>
            <div className="w-12 h-12 bg-[#d61f26] text-white flex items-center justify-center mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-[1.2rem] font-bold text-[#11131d] mb-2">{PRICING_FACTS.eliteProductName}</h2>
            <p className="mb-4">
              <span className="text-[1.8rem] font-black text-[#d61f26]">
                ${PRICING_FACTS.eliteWeeklyUsd.toFixed(2)}
              </span>
              <span className="text-[0.9rem] font-bold text-[#11131d]/50"> / week</span>
            </p>
            <p className="text-[0.95rem] text-[#11131d]/70 leading-[1.6] mb-8">
              Standard plus private Spartan Coach and deidentified hospice policy education. Cancel anytime.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {["Everything in Standard", "Private voice coaching", "Deidentified hospice policy education"].map((f) => (
                <li key={f} className="flex gap-3 text-[0.9rem] text-[#11131d]/80">
                  <CheckCircle className="w-4 h-4 text-[#d61f26] shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div data-testid="button-tier-elite-subscribe">
              <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-elite" plan="elite_weekly" className="home-photo-button home-photo-button-primary bg-[#d61f26] border-[#d61f26] w-full" />
            </div>
          </div>

          <div className="order-3 flex flex-col border border-[#11131d]/10 p-8 bg-white shadow-sm hover:shadow-xl transition-shadow" data-testid="card-tier-team">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#11131d]/50 mb-4">Teams</p>
            <div className="w-12 h-12 bg-[#11131d]/5 text-[#11131d]/70 flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-[1.2rem] font-bold text-[#11131d] mb-2">Provider seats</h2>
            <p className="mb-4">
              <span className="text-[1.8rem] font-black text-[#11131d]">Contract</span>
              <span className="text-[0.9rem] font-bold text-[#11131d]/50"> · per seat / week</span>
            </p>
            <p className="text-[0.95rem] text-[#11131d]/70 leading-[1.6] mb-8">
              Multi-seat org under your hospice contract. Admin invites and seat control.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {TIER_TEAM_FEATURES.slice(0, 3).map((f) => (
                <li key={f} className="flex gap-3 text-[0.9rem] text-[#11131d]/80">
                  <CheckCircle className="w-4 h-4 text-[#d61f26] shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/request-access" data-testid="button-tier-team" className="home-photo-button home-photo-button-outline w-full justify-between">
              Request team evaluation
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-col border border-[#11131d]/10 p-8 bg-white shadow-sm hover:shadow-xl transition-shadow" data-testid="card-tier-enterprise">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#11131d]/50 mb-4">With consulting</p>
            <div className="w-12 h-12 bg-[#11131d]/5 text-[#11131d]/70 flex items-center justify-center mb-6">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-[1.2rem] font-bold text-[#11131d] mb-2">Enterprise + coaching</h2>
            <p className="mb-4">
              <span className="text-[1.8rem] font-black text-[#11131d]">Engagement</span>
            </p>
            <p className="text-[0.95rem] text-[#11131d]/70 leading-[1.6] mb-8">
              Hospice Sales Pro seats bundled with leadership coaching and workshops.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {TIER_ENTERPRISE_FEATURES.slice(0, 3).map((f) => (
                <li key={f} className="flex gap-3 text-[0.9rem] text-[#11131d]/80">
                  <CheckCircle className="w-4 h-4 text-[#d61f26] shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/contact?service=Consulting+%2B+Hospice+Sales+Pro" data-testid="button-tier-enterprise" className="home-photo-button home-photo-button-outline w-full justify-between">
              Book a strategy call
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-20">
        <AppHandoffPanel
          destination="home"
          title="One field system. Web and iPhone."
          description="Create or sign in with the same Hospice Sales Pro account on both surfaces. Web purchases restore after sign in; App Store purchases restore from Account on iPhone."
        />
      </div>

      {/* ── Why (end-user edge) ── */}
      <div
        className="bg-[#f5f3ef] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-20 lg:py-24 border-y border-[#11131d]/10 mb-20 text-center"
        data-testid="section-why-membership"
      >
        <div className="max-w-4xl mx-auto">
          <TrendingUp className="w-8 h-8 text-[#d61f26] mx-auto mb-8" />
          <h2 className="font-display text-[clamp(2.5rem,5vw,3.5rem)] font-black uppercase leading-[0.95] tracking-tight text-[#11131d] mb-8">
            Walk in prepared — not hoping the conversation goes your way.
            <br />
            <span className="text-[#d61f26] mt-4 block">
              Standard builds prepared field work. Elite adds private coaching and hospice policy education.
            </span>
          </h2>
          <p className="text-[1.15rem] text-[#11131d]/70 leading-[1.65] max-w-3xl mx-auto mb-6">
            The Objection Handler gives you the response before you walk into the room. Weekly Plan Builder makes Monday
            intentional. Command Center turns every visit into a continuous, coachable account workflow — not ten random
            tabs.
          </p>
          <p className="text-[1rem] text-[#11131d]/60 leading-[1.6] max-w-2xl mx-auto">
            Preview tools free. Subscribe to generate, save, and run live. Cancel anytime from Account — access continues
            through the period you already paid for.
          </p>
          <div className="mt-10 flex justify-center" data-testid="membership-roi-subscribe">
            <SubscribeCTA surface="membership_pricing" showPreview showHint={false} testId="membership-why-cta" className="home-photo-button home-photo-button-primary bg-[#d61f26] border-[#d61f26]" />
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="border border-[#11131d]/10 bg-white shadow-xl p-8 sm:p-16 text-center space-y-8 max-w-4xl mx-auto mb-20">
        <h2 className="font-display text-[2rem] font-black uppercase tracking-tight text-[#11131d]">Choose or manage access</h2>
        <div className="text-left text-[1.05rem] text-[#11131d]/70 space-y-4 max-w-2xl mx-auto bg-neutral-50/50 p-6 border border-[#11131d]/5">
          <div className="flex gap-4">
            <span className="font-mono text-[#d61f26] font-bold">01</span>
            <p><strong className="text-[#11131d]">Choose Standard or Elite</strong> — Standard is {PRICING_FACTS.individualWeeklyLabel}; Elite is {PRICING_FACTS.eliteWeeklyLabel}.</p>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-[#d61f26] font-bold">02</span>
            <p><strong className="text-[#11131d]">Create or sign in to your account</strong> — your permitted access restores on web and iPhone.</p>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-[#d61f26] font-bold">03</span>
            <p><strong className="text-[#11131d]">Manage from Account</strong> — cancel individual access anytime; teams request contracted seats.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 flex-wrap items-center">
          <SubscribeCTA surface="membership_pricing" showHint={false} testId="membership-subscribe" className="home-photo-button home-photo-button-primary bg-[#d61f26] border-[#d61f26] w-full sm:w-auto" />
          {canUseFieldKit && (
            <Link href="/account" className="home-photo-button home-photo-button-outline w-full sm:w-auto">Manage billing</Link>
          )}
          <Link href="/request-access" className="home-photo-button home-photo-button-outline w-full sm:w-auto">Team / evaluation</Link>
          <Link href="/contact?service=Hospice+Sales+Pro" className="home-photo-button home-photo-button-outline w-full sm:w-auto border-transparent">Talk through options</Link>
        </div>

        <div
          className="text-left text-[0.85rem] text-[#11131d]/60 leading-[1.6] border-t border-[#11131d]/10 pt-8 mt-12 max-w-3xl mx-auto space-y-4"
          data-testid="membership-legal"
        >
          <p className="font-bold text-[#11131d] uppercase tracking-widest text-xs">Billing terms (summary)</p>
          <ul className="list-disc list-outside ml-4 space-y-2">
            <li>
              <strong className="text-[#11131d]">Individual:</strong> Standard is ${PRICING_FACTS.individualWeeklyUsd.toFixed(2)} USD per week. Elite is ${PRICING_FACTS.eliteWeeklyUsd.toFixed(2)} USD per week. Billing continues automatically until you cancel. Access continues through the paid period.
            </li>
            <li>
              <strong className="text-[#11131d]">Provider / corporate:</strong> {PRICING_FACTS.teamNote} Seat counts
              and invoices are managed with Spartan Coaching; payment may be Stripe invoice or offline terms as agreed.
            </li>
            <li>{PRICING_FACTS.consultingSeparate}</li>
            <li>
              Failed payments may suspend Hospice Sales Pro access until the payment method is updated. No PHI belongs in
              tools.
            </li>
            <li>
              Full legal terms:{" "}
              <Link href="/trust" className="text-[#d61f26] hover:underline underline-offset-4">
                Trust Center
              </Link>
              {" · "}
              <Link href="/terms" className="text-[#d61f26] hover:underline underline-offset-4">
                Terms of Service
              </Link>
              {" · "}
              <Link href="/privacy" className="text-[#d61f26] hover:underline underline-offset-4">
                Privacy
              </Link>
              .
            </li>
          </ul>
        </div>
      </div>
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
