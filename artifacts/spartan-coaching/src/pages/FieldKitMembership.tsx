import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { SEO } from "@/components/SEO";
import { AppHandoffPanel } from "@/components/AppHandoffPanel";
import { PRICING_FACTS } from "@/lib/complianceCopy";
import { SubscribeCTA } from "@/components/SubscribeCTA";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { useAuth } from "@/context/AuthContext";
import { SectionHeader } from "@/components/elite/SectionHeader";
import { ProductMap } from "@/components/elite/ProductMap";

export default function FieldKitMembership() {
  const { canUseFieldKit } = useAuth();

  return (
    <div className="public-membership w-full bg-background" data-testid="page-hospice-sales-pro">
      <SEO title="Hospice Sales Pro | Spartan Coaching" />

      {/* EDITORIAL HERO */}
      <section className="border-b border-border py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-6">Hospice Sales Pro</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-foreground leading-[1.1] mb-6">
            Walk in ready. <br />
            <span className="font-display font-black text-primary uppercase tracking-tight">Leave with the next move.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-[1.7] mb-10">
            Stop winging the conversations that decide whether someone understands hospice. Prepare the account, practice the language, and keep the next commitment connected on web and iPhone.
          </p>
          <div className="flex flex-col items-center gap-4">
            <SubscribeCTA surface="membership_pricing" showPreview showHint testId="membership-hero-subscribe" />
            <Link href="/tools" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              Preview the tool directory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CONTEXT (Required by tests) */}
      <section className="py-16 md:py-24 border-b border-border bg-surface px-4 sm:px-6 lg:px-8" data-testid="section-membership-context">
        <div className="max-w-[64rem] mx-auto">
          <div className="mb-12">
            <p className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-3">Choose your path</p>
            <h2 className="text-2xl font-medium text-foreground mb-4">See the workspaces first. Start with the way you work.</h2>
            <p className="text-base text-muted-foreground">One product, three ways in. Use the directory to see a specific job, then pick the route that matches your role.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">Individual rep</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Choose Standard for self-serve field execution or Elite when private coaching matters.</p>
              <Link href="#access-options" className="text-sm text-primary font-medium mt-auto">Compare plans →</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">Team or provider</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Request a timed evaluation, then arrange contracted seats and onboarding.</p>
              <Link href="/request-access" className="text-sm text-primary font-medium mt-auto">Request access →</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">Consulting + seats</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Combine Hospice Sales Pro with leadership coaching or workshops.</p>
              <Link href="/contact" className="text-sm text-primary font-medium mt-auto">Book a call →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* TOOL GRID (Required by tests) */}
      <section className="py-16 md:py-24 border-b border-border px-4 sm:px-6 lg:px-8" data-testid="section-tool-grid">
        <div className="max-w-[64rem] mx-auto">
          <SectionHeader
            kicker="What's inside"
            title="One daily spine. Clear tool groups."
            description="Hospice Sales Pro is not thirteen equal features. Open Command Center for the day, then use practice, plan, and resources as satellites."
          />
          <ProductMap className="mb-6 shadow-sm border border-border" />
        </div>
      </section>

      {/* WHY MEMBERSHIP (Required by tests) */}
      <section className="py-16 md:py-24 bg-primary/5 px-4 sm:px-6 lg:px-8" data-testid="section-why-membership">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-serif text-foreground mb-4">Walk in prepared, not hoping.</h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-8">
            The Objection Handler gives you the response before you walk into the room. Weekly Plan Builder makes Monday intentional. Standard builds prepared field work. Elite adds private coaching.
          </p>
          <div data-testid="membership-roi-subscribe">
            <SubscribeCTA surface="membership_pricing" showPreview showHint={false} testId="membership-why-cta" />
          </div>
        </div>
      </section>

      {/* ACCESS OPTIONS */}
      <section className="py-16 md:py-24 border-t border-b border-border bg-background px-4 sm:px-6 lg:px-8" id="access-options">
        <div className="max-w-[64rem] mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-medium text-foreground mb-4">Self-serve individual access</h2>
            <p className="text-base text-muted-foreground">Weekly access, cancel anytime from your account.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Standard */}
            <div className="border border-border bg-surface p-8 flex flex-col" data-testid="card-tier-individual">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Individual · Standard</p>
              <h3 className="text-xl font-medium text-foreground mb-4">Hospice Sales Pro</h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-3xl font-light text-foreground">${PRICING_FACTS.individualWeeklyUsd}</span>
                <span className="text-sm text-muted-foreground">/ week</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {["Command Center & tools", "Plans, calculators, resources", "Web & iPhone access"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <div data-testid="button-tier-individual-subscribe">
                <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-individual" plan="standard_weekly" />
              </div>
            </div>

            {/* Elite */}
            <div className="border border-primary/30 bg-primary/5 p-8 flex flex-col relative" data-testid="card-tier-elite">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                Recommended
              </div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Individual · Elite</p>
              <h3 className="text-xl font-medium text-foreground mb-4">Hospice Sales Pro</h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-3xl font-light text-foreground">${PRICING_FACTS.eliteWeeklyUsd}</span>
                <span className="text-sm text-muted-foreground">/ week</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {["Everything in Standard", "Private voice coaching", "Deidentified policy education"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <div data-testid="button-tier-elite-subscribe">
                <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-elite" plan="elite_weekly" />
              </div>
            </div>
          </div>

          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="text-xl font-medium text-foreground mb-6 text-center">
              Choose or manage access
            </h2>
            <ol className="text-sm text-muted-foreground space-y-4 list-decimal list-inside pl-4">
              <li>
                <strong className="text-foreground font-medium">Choose Standard or Elite</strong> — Standard is {PRICING_FACTS.individualWeeklyLabel}; Elite is {PRICING_FACTS.eliteWeeklyLabel}.
              </li>
              <li>
                <strong className="text-foreground font-medium">Create or sign in to your account</strong> — your permitted access restores on web and iPhone.
              </li>
              <li>
                <strong className="text-foreground font-medium">Manage from Account</strong> — cancel individual access anytime; teams request contracted seats.
              </li>
            </ol>
            {canUseFieldKit && (
              <div className="mt-8 text-center">
                <Button asChild variant="outline" className="rounded-none border-border">
                  <Link href="/account">Manage account and billing</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground text-center" data-testid="membership-legal">
            <p>Billing continues automatically until you cancel. Teams require contracted seats.</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface px-4">
        <div className="max-w-4xl mx-auto">
          <AppHandoffPanel
            destination="home"
            title="One Field System. Web and iPhone."
            description="Create or sign in with the same Hospice Sales Pro account on both surfaces."
          />
        </div>
      </section>

      <PublicConversionPanel
        source="hospice_sales_pro"
        audience="Individual hospice sales professionals who need daily field preparation."
        promise="Use the same permitted account on web and iPhone, with live tools."
        evidence={`${PRICING_FACTS.previewNote} ${PRICING_FACTS.individualBillingNote}`}
        primary={{ label: "Create Account", href: "/register", token: "create_account" }}
        secondary={{ label: "Request Team Access", href: "/request-access", token: "team_access" }}
      />
    </div>
  );
}
