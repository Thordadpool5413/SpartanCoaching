import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Smartphone, Workflow } from "lucide-react";
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
    <div className="public-membership w-full bg-background" data-testid="page-hospice-sales-pro">
      <SEO title="Hospice Sales Pro | Spartan Coaching" />

      {/* Editorial Hero */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-20 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-[72rem] mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
          <div>
            <p className="font-mono text-xs font-bold tracking-widest uppercase text-primary mb-6">Hospice Sales Pro</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-foreground leading-[1.1] mb-6 text-balance">
              Walk in ready. Leave with the next move.
            </h1>
            <p className="text-lg text-muted-foreground leading-[1.6] mb-8 max-w-xl">
              Stop winging the conversations that decide whether someone understands hospice. Prepare the account, practice the language, and keep the next commitment connected.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <SubscribeCTA surface="membership_pricing" showHint={false} testId="membership-hero-subscribe" />
              <Link href="#access-options" className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-4 py-3">
                View plans
              </Link>
            </div>
          </div>

          {/* Visual Product representation replacing fake skeletons */}
          <div className="bg-card border border-border p-6 rounded-none shadow-sm relative overflow-hidden hidden lg:block">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-primary" />
                </div>
                <div className="w-8 h-8 bg-muted flex items-center justify-center">
                  <Workflow className="w-4 h-4 text-primary" />
                </div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground ml-2">Web & iPhone Sync</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="bg-muted/30 border border-border p-4">
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary mb-1">Command Center</p>
                <p className="text-xs text-muted-foreground">Daily spine for field execution</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-surface border border-border p-3 text-center">
                  <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">1. Prepare</p>
                </div>
                <div className="bg-surface border border-border p-3 text-center">
                  <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">2. Practice</p>
                </div>
                <div className="bg-surface border border-border p-3 text-center">
                  <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">3. Capture</p>
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 p-4 flex items-center justify-between mt-2">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">Lock Next Step</p>
                </div>
                <Check className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real workflow / Tool preview */}
      <section className="py-16 md:py-24 border-b border-border bg-surface px-4 sm:px-6 lg:px-8" data-testid="section-daily-workflow">
        <div className="max-w-[72rem] mx-auto">
          <div className="mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">The daily field workflow.</h2>
            <p className="text-base text-muted-foreground max-w-2xl">Start in Command Center, open the tool the conversation requires, and capture the outcome immediately.</p>
          </div>

          <div className="bg-background border border-border p-6 md:p-8" data-testid="section-tool-grid">
             <ProductMap showSpine={true} />
          </div>
        </div>
      </section>

      {/* Access Paths Context */}
      <section className="py-16 md:py-20 border-b border-border bg-background px-4 sm:px-6 lg:px-8" data-testid="section-membership-context">
        <div className="max-w-[72rem] mx-auto">
          <p className="font-mono text-xs font-bold tracking-widest uppercase text-muted-foreground mb-8">One product. Three ways in.</p>
          <p className="mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
            See the workspaces first. Use the directory to see a specific job, then choose the access path that matches your role.
          </p>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div>
              <h3 className="text-lg font-serif text-foreground mb-2">Individual Rep</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">Choose Standard for self-serve field execution or Elite when private coaching matters.</p>
              <a href="#access-options" className="text-sm font-medium text-primary hover:underline">Compare plans →</a>
            </div>
            <div>
              <h3 className="text-lg font-serif text-foreground mb-2">Team or Provider</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">Request a timed evaluation, then arrange contracted seats and group onboarding.</p>
              <Link href="/request-access" className="text-sm font-medium text-primary hover:underline">Request access →</Link>
            </div>
            <div>
              <h3 className="text-lg font-serif text-foreground mb-2">Consulting + Seats</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">Combine Hospice Sales Pro seats with structural leadership coaching or workshops.</p>
              <Link href="/contact" className="text-sm font-medium text-primary hover:underline">Book a call →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-24 border-b border-border bg-surface px-4 sm:px-6 lg:px-8" id="access-options">
        <div className="max-w-[72rem] mx-auto">
          <div className="mb-12">
            <h2 className="font-serif text-3xl text-foreground mb-2">Self-serve individual access</h2>
            <p className="text-sm text-muted-foreground">Weekly access, cancel anytime from your account.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
            <div className="bg-background border border-border p-8 flex flex-col" data-testid="card-tier-individual">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Individual Standard</p>
              <h3 className="text-2xl font-serif text-foreground mb-2">Hospice Sales Pro</h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-light text-foreground">${PRICING_FACTS.individualWeeklyUsd}</span>
                <span className="text-xs text-muted-foreground">/ week</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {["Command Center & tools", "Plans, calculators, resources", "Web & iPhone access"].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <div data-testid="button-tier-individual-subscribe">
                <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-individual" plan="standard_weekly" />
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/30 p-8 flex flex-col relative" data-testid="card-tier-elite">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-primary-foreground font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                Recommended
              </div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Individual Elite</p>
              <h3 className="text-2xl font-serif text-foreground mb-2">Hospice Sales Pro</h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-light text-foreground">${PRICING_FACTS.eliteWeeklyUsd}</span>
                <span className="text-xs text-muted-foreground">/ week</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {["Everything in Standard", "Private voice coaching", "Deidentified policy education"].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <div data-testid="button-tier-elite-subscribe">
                <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-elite" plan="elite_weekly" />
              </div>
            </div>
          </div>

          <div className="mt-16 bg-background p-8 border border-border max-w-4xl">
            <h3 className="font-serif text-xl text-foreground mb-4">Choose or manage access</h3>
            <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
              <li><strong className="text-foreground">Choose Standard or Elite</strong> — Standard is {PRICING_FACTS.individualWeeklyLabel}; Elite is {PRICING_FACTS.eliteWeeklyLabel}.</li>
              <li><strong className="text-foreground">Create or sign in to your account</strong> — your permitted access restores on web and iPhone.</li>
              <li><strong className="text-foreground">Manage from Account</strong> — cancel individual access anytime; teams request contracted seats.</li>
            </ol>
            {canUseFieldKit && (
              <div className="mt-6 pt-6 border-t border-border">
                <Button asChild variant="outline" size="sm" className="font-mono text-xs uppercase tracking-widest">
                  <Link href="/account">Manage from Account</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="mt-8 text-xs text-muted-foreground" data-testid="membership-legal">
            <p>Billing continues automatically until you cancel. Teams require contracted seats.</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background px-4">
        <div className="max-w-[72rem] mx-auto">
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