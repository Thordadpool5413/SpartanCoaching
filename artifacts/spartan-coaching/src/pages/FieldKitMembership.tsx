import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, ShieldCheck, LayoutDashboard, Compass } from "lucide-react";
import { SEO } from "@/components/SEO";
import { AppHandoffPanel } from "@/components/AppHandoffPanel";
import { PRICING_FACTS } from "@/lib/complianceCopy";
import { SubscribeCTA } from "@/components/SubscribeCTA";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { useAuth } from "@/context/AuthContext";
import { ProductMap } from "@/components/elite/ProductMap";

import uiDark from "@assets/hospice-sales-pro-command-center-public.png";
import uiLight from "@assets/hospice-sales-pro-workflow-public.png";

export default function FieldKitMembership() {
  const { canUseFieldKit } = useAuth();

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 selection:bg-primary/20" data-testid="page-hospice-sales-pro">
      <SEO title="Hospice Sales Pro | Spartan Coaching" />

      {/* Command Center Hero */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/4"></div>
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white shadow-sm border border-slate-200 text-slate-600 text-xs font-semibold rounded-full mb-8">
               <ShieldCheck className="w-4 h-4 text-primary" /> Premium Field Product
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 text-balance">
              Walk in ready.<br/><span className="text-primary">Leave with the next move.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
              Stop winging the conversations that decide whether someone understands hospice. Prepare the account, practice the language, and keep the next commitment connected across web and iPhone.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <SubscribeCTA surface="membership_pricing" showHint={false} testId="membership-hero-subscribe" />
              <Button variant="outline" asChild className="rounded-full font-medium w-full sm:w-auto px-8 border-slate-300 hover:bg-slate-100">
                <a href="#access-options">View access plans</a>
              </Button>
            </div>
          </div>

          {/* Authentic product spine screenshot */}
          <div className="relative z-10 w-full h-full lg:min-h-[500px] flex items-center justify-center">
             <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 backdrop-blur-md">
                  <div className="flex gap-2 items-center">
                     <span className="w-3 h-3 rounded-full bg-red-400"></span>
                     <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                     <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    Live Workspace
                  </span>
                </div>
                 <div className="aspect-[16/10] overflow-hidden bg-slate-950">
                   <img
                     src={uiDark}
                     alt="Hospice Sales Pro Command Center workspace"
                     className="w-full h-full object-cover object-top"
                   />
                 </div>
             </div>
          </div>
        </div>
      </section>

      {/* Real workflow / Tool preview */}
      <section className="py-24 bg-white border-y border-slate-100 px-4 sm:px-6 lg:px-8" data-testid="section-daily-workflow">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16 items-center">
             <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold mb-6">
                 <span className="w-2 h-2 rounded-full bg-primary"></span>
                 Interface
               </div>
               <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-6">The daily field workflow.</h2>
               <p className="text-lg text-slate-600 leading-relaxed mb-8">
                 Start in Command Center, open the tool the conversation requires, and capture the outcome immediately. 
                 The architecture mirrors actual field behavior, not generic CRM logging.
               </p>
               <ul className="space-y-5">
                 <li className="flex gap-4 items-start">
                   <div className="mt-1 w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                     <LayoutDashboard className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="font-semibold text-slate-900">Command Center Base</p>
                     <p className="text-sm text-slate-600 mt-1">One clear view of your active territory plan.</p>
                   </div>
                 </li>
                 <li className="flex gap-4 items-start">
                   <div className="mt-1 w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                     <Compass className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="font-semibold text-slate-900">Embedded AI Tooling</p>
                     <p className="text-sm text-slate-600 mt-1">Summon playbooks and scripts exactly when needed.</p>
                   </div>
                 </li>
               </ul>
             </div>
             
             <div className="relative" data-testid="section-tool-grid">
                <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-2xl transform -translate-x-4 translate-y-4"></div>
                <div className="relative bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Architecture</p>
                  </div>
                   <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                     <img
                       src={uiLight}
                       alt="Hospice Sales Pro field workflow"
                       className="w-full h-full object-cover object-top"
                     />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Access Paths Context */}
      <section className="py-24 bg-slate-50 px-4 sm:px-6 lg:px-8 border-b border-slate-200" data-testid="section-membership-context">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">One product. Three ways in.</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              See the workspaces first. Use the directory to see a specific job, then choose the access path that matches your role.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Individual Rep",
                desc: "Choose Standard for self-serve field execution or Elite when private coaching matters.",
                href: "#access-options",
                action: "Compare plans"
              },
              {
                title: "Team or Provider",
                desc: "Request a timed evaluation, then arrange contracted seats and group onboarding.",
                href: "/request-access",
                action: "Request access"
              },
              {
                title: "Consulting + Seats",
                desc: "Combine Hospice Sales Pro seats with structural leadership coaching or workshops.",
                href: "/contact",
                action: "Book a call"
              }
            ].map((path, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-lg transition-shadow group relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors"></div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold mb-6">
                  {i + 1}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{path.title}</h3>
                <p className="text-slate-600 leading-relaxed mb-8 flex-1">{path.desc}</p>
                {path.href.startsWith('#') ? (
                  <a href={path.href} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 group-hover:gap-3">
                    {path.action} <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <Link href={path.href} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 group-hover:gap-3">
                    {path.action} <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Access Plans */}
      <section className="py-24 md:py-32 bg-white px-4 sm:px-6 lg:px-8" id="access-options">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-slate-900 mb-6">Self-serve access plans</h2>
            <p className="text-lg text-slate-600">Weekly access, cancel anytime from your account. Teams require contracted seats.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Standard */}
            <div className="rounded-3xl border border-slate-200 bg-white flex flex-col p-8 md:p-10 shadow-sm hover:shadow-md transition-shadow" data-testid="card-tier-individual">
              <div className="mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Base Capability</span>
                <h3 className="font-display text-2xl font-bold text-slate-900">Individual Standard</h3>
              </div>
              <div className="mb-8 flex items-baseline gap-2 pb-8 border-b border-slate-100">
                <span className="text-5xl font-display font-extrabold text-slate-900">${PRICING_FACTS.individualWeeklyUsd}</span>
                <span className="text-sm font-semibold text-slate-500">/ week</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {["Command Center & tools", "Plans, calculators, resources", "Web & iPhone access"].map(f => (
                  <li key={f} className="flex items-start gap-3 text-slate-700">
                    <Check className="w-5 h-5 text-primary shrink-0" /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div data-testid="button-tier-individual-subscribe">
                <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-individual" plan="standard_weekly" />
              </div>
            </div>

            {/* Elite */}
            <div className="rounded-3xl border-2 border-primary bg-primary/5 flex flex-col p-8 md:p-10 shadow-xl relative" data-testid="card-tier-elite">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                Recommended
              </div>
              <div className="mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">Maximum Readiness</span>
                <h3 className="font-display text-2xl font-bold text-slate-900">Elite</h3>
              </div>
              <div className="mb-8 flex items-baseline gap-2 pb-8 border-b border-primary/20">
                <span className="text-5xl font-display font-extrabold text-slate-900">${PRICING_FACTS.eliteWeeklyUsd}</span>
                <span className="text-sm font-semibold text-slate-600">/ week</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {["Everything in Standard", "Private voice coaching", "Deidentified policy education"].map(f => (
                  <li key={f} className="flex items-start gap-3 text-slate-900 font-semibold">
                    <Check className="w-5 h-5 text-primary shrink-0" /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div data-testid="button-tier-elite-subscribe">
                <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-elite" plan="elite_weekly" />
              </div>
            </div>
          </div>

          <div className="mt-16 bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-200 max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900 mb-2">Choose or manage access</h3>
              <p className="text-slate-600 text-sm">Choose Standard or Elite, then create or sign in to your account. Manage from Account to cancel individual access anytime; teams request contracted seats.</p>
            </div>
            {canUseFieldKit && (
              <Button asChild variant="outline" className="rounded-full whitespace-nowrap font-medium border-slate-300 hover:bg-slate-100">
                <Link href="/account">Manage from Account</Link>
              </Button>
            )}
          </div>
          <div className="mt-8 text-center max-w-4xl mx-auto text-xs text-slate-500 font-medium" data-testid="membership-legal">
            <p>Billing continues automatically until you cancel. Teams require contracted seats.</p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900 text-white px-4 sm:px-6 lg:px-8 border-y border-slate-800">
        <div className="max-w-7xl mx-auto">
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
