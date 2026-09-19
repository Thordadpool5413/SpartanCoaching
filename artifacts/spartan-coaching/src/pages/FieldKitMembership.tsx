import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, ShieldCheck } from "lucide-react";
import { SEO } from "@/components/SEO";
import { AppHandoffPanel } from "@/components/AppHandoffPanel";
import { PRICING_FACTS } from "@/lib/complianceCopy";
import { SubscribeCTA } from "@/components/SubscribeCTA";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { useAuth } from "@/context/AuthContext";
import { ProductMap } from "@/components/elite/ProductMap";

export default function FieldKitMembership() {
  const { canUseFieldKit } = useAuth();

  return (
    <div className="public-membership w-full bg-background min-h-screen" data-testid="page-hospice-sales-pro">
      <SEO title="Hospice Sales Pro | Spartan Coaching" />

      {/* Command Center Hero */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-[84rem] mx-auto border-b border-border">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary font-mono text-[10px] font-bold uppercase tracking-widest mb-8 border border-primary/20">
               <ShieldCheck className="w-3.5 h-3.5" /> Premium Field Product
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-[5.5rem] uppercase leading-[0.95] tracking-tight text-foreground mb-6 text-balance">
              Walk in ready.<br/><span className="text-primary">Leave with the next move.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-[1.6] mb-10 max-w-xl">
              Stop winging the conversations that decide whether someone understands hospice. Prepare the account, practice the language, and keep the next commitment connected across web and iPhone.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <SubscribeCTA surface="membership_pricing" showHint={false} testId="membership-hero-subscribe" />
              <Button variant="ghost" asChild className="rounded-none font-mono text-[10px] font-bold uppercase tracking-widest h-11 border border-border bg-card hover:bg-muted/50">
                <a href="#access-options">View access plans</a>
              </Button>
            </div>
          </div>

          {/* Real product spine, not a fabricated dashboard screenshot. */}
          <div className="relative bg-muted/10 border border-border p-4 md:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Live product workflow
              </p>
              <span className="font-mono text-[9px] uppercase tracking-widest bg-primary/10 text-primary font-bold px-2 py-1">
                Web + iPhone
              </span>
            </div>
            <ProductMap groups={[]} showSpine={true} />
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              This is the actual navigation spine used inside Hospice Sales Pro. Access requires an active seat.
            </p>
          </div>
        </div>
      </section>

      {/* Real workflow / Tool preview */}
      <section className="py-20 md:py-28 border-b border-border bg-card px-4 sm:px-6 lg:px-8" data-testid="section-daily-workflow">
        <div className="max-w-[84rem] mx-auto">
          <div className="grid lg:grid-cols-[1fr_2.5fr] gap-12 lg:gap-20 items-start">
             <div>
               <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-3">
                 <span className="w-4 h-px bg-primary"></span>
                 Interface
               </p>
               <h2 className="font-display text-4xl uppercase tracking-tight text-foreground mb-6 leading-[1.1]">The daily field workflow.</h2>
               <p className="text-base text-muted-foreground leading-[1.7]">
                 Start in Command Center, open the tool the conversation requires, and capture the outcome immediately. 
                 The architecture mirrors actual field behavior, not generic CRM logging.
               </p>
             </div>
             
             <div className="bg-background border border-border p-4 shadow-sm" data-testid="section-tool-grid">
               <div className="border border-border p-6 md:p-10 bg-muted/5">
                 <ProductMap showSpine={true} />
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Access Paths Context */}
      <section className="py-20 md:py-28 border-b border-border bg-muted/20 px-4 sm:px-6 lg:px-8" data-testid="section-membership-context">
        <div className="max-w-[84rem] mx-auto">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <p className="font-mono text-[11px] font-bold tracking-widest uppercase text-muted-foreground mb-4">Deployment Models</p>
            <h2 className="font-display text-4xl uppercase tracking-tight text-foreground mb-6">One product. Three ways in.</h2>
            <p className="text-base leading-[1.7] text-muted-foreground">
              See the workspaces first. Use the directory to see a specific job, then choose the access path that matches your role.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border p-8 shadow-sm">
              <h3 className="text-2xl font-display uppercase tracking-tight text-foreground mb-3">Individual Rep</h3>
              <p className="text-sm text-muted-foreground leading-[1.7] mb-8">Choose Standard for self-serve field execution or Elite when private coaching matters.</p>
              <a href="#access-options" className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors flex items-center gap-2">
                Compare plans <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="bg-card border border-border p-8 shadow-sm">
              <h3 className="text-2xl font-display uppercase tracking-tight text-foreground mb-3">Team or Provider</h3>
              <p className="text-sm text-muted-foreground leading-[1.7] mb-8">Request a timed evaluation, then arrange contracted seats and group onboarding.</p>
              <Link href="/request-access" className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors flex items-center gap-2">
                Request access <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="bg-card border border-border p-8 shadow-sm">
              <h3 className="text-2xl font-display uppercase tracking-tight text-foreground mb-3">Consulting + Seats</h3>
              <p className="text-sm text-muted-foreground leading-[1.7] mb-8">Combine Hospice Sales Pro seats with structural leadership coaching or workshops.</p>
              <Link href="/contact" className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors flex items-center gap-2">
                Book a call <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Access Plans */}
      <section className="py-20 md:py-32 border-b border-border bg-background px-4 sm:px-6 lg:px-8" id="access-options">
        <div className="max-w-[84rem] mx-auto">
          <div className="mb-16">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-3">
              <span className="w-4 h-px bg-primary"></span>
              Procurement
            </p>
            <h2 className="font-display text-4xl md:text-5xl uppercase tracking-tight text-foreground mb-4">Self-serve access plans</h2>
            <p className="text-base text-muted-foreground max-w-xl">Weekly access, cancel anytime from your account. Teams require contracted seats.</p>
          </div>

          <div className="grid md:grid-cols-[1fr_1fr] border border-border shadow-sm max-w-5xl mx-auto">
            {/* Standard */}
            <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col" data-testid="card-tier-individual">
              <div className="mb-8">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Base Capability</p>
                <h3 className="font-display text-3xl uppercase tracking-tight text-foreground">Individual Standard</h3>
              </div>
              <div className="mb-8 flex items-baseline gap-2 pb-8 border-b border-border/50">
                <span className="text-5xl font-light text-foreground tracking-tight">${PRICING_FACTS.individualWeeklyUsd}</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">/ week</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {["Command Center & tools", "Plans, calculators, resources", "Web & iPhone access"].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div data-testid="button-tier-individual-subscribe">
                <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-individual" plan="standard_weekly" />
              </div>
            </div>

            {/* Elite */}
            <div className="p-8 md:p-12 bg-muted/10 flex flex-col relative" data-testid="card-tier-elite">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-primary-foreground font-mono text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 shadow-sm">
                Recommended Standard
              </div>
              <div className="mb-8">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Maximum Readiness</p>
                <h3 className="font-display text-3xl uppercase tracking-tight text-foreground">Individual Elite</h3>
              </div>
              <div className="mb-8 flex items-baseline gap-2 pb-8 border-b border-primary/20">
                <span className="text-5xl font-light text-foreground tracking-tight">${PRICING_FACTS.eliteWeeklyUsd}</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">/ week</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {["Everything in Standard", "Private voice coaching", "Deidentified policy education"].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground font-medium">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div data-testid="button-tier-elite-subscribe">
                <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-elite" plan="elite_weekly" />
              </div>
            </div>
          </div>

          <div className="mt-16 bg-card p-8 border border-border max-w-5xl mx-auto shadow-sm">
            <h3 className="font-display text-2xl uppercase tracking-tight text-foreground mb-6">Choose or manage access</h3>
            <ol className="text-sm text-muted-foreground space-y-4 list-decimal list-inside">
              <li><strong className="text-foreground font-medium">Choose Standard or Elite</strong> — Standard is {PRICING_FACTS.individualWeeklyLabel}; Elite is {PRICING_FACTS.eliteWeeklyLabel}.</li>
              <li><strong className="text-foreground font-medium">Create or sign in to your account</strong> — your permitted access restores on web and iPhone.</li>
              <li><strong className="text-foreground font-medium">Manage from Account</strong> — cancel individual access anytime; teams request contracted seats.</li>
            </ol>
            {canUseFieldKit && (
              <div className="mt-8 pt-6 border-t border-border">
                <Button asChild variant="outline" className="font-mono text-[10px] font-bold uppercase tracking-widest rounded-none h-10 border-border">
                  <Link href="/account">Manage from Account</Link>
                </Button>
              </div>
            )}
          </div>
          <div className="mt-6 text-center max-w-5xl mx-auto text-[11px] text-muted-foreground" data-testid="membership-legal">
            <p>Billing continues automatically until you cancel. Teams require contracted seats.</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/5 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-[84rem] mx-auto">
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
