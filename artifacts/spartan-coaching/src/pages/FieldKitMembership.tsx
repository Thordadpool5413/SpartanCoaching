import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
import { SEO } from "@/components/SEO";
import { AppHandoffPanel } from "@/components/AppHandoffPanel";
import { PRICING_FACTS } from "@/lib/complianceCopy";
import { SubscribeCTA } from "@/components/SubscribeCTA";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { useAuth } from "@/context/AuthContext";

import uiDark from "@assets/hospice-sales-pro-command-center-public.png";
import uiLight from "@assets/hospice-sales-pro-workflow-public.png";

export default function FieldKitMembership() {
  const { canUseFieldKit } = useAuth();

  return (
    <div className="page-persuasion font-sans" data-testid="page-hospice-sales-pro">
      <SEO title="Hospice Sales Pro | Spartan Coaching" />

      {/* Hero Section */}
      <section className="fi-dark bg-[var(--fi-field)] text-[var(--fi-cream)]">
        <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#e8a183]">
                Premium Field Product
              </p>
              <h1 className="fi-serif text-[clamp(3.5rem,7vw,6.5rem)] leading-[.86] mb-8">
                Walk in ready.<br /><span className="text-[#e8a183]">Leave with the next move.</span>
              </h1>
              <p className="mb-10 max-w-[500px] text-[17px] leading-[1.7] text-[rgba(251,248,241,.72)]">
                Stop winging the conversations that decide whether someone understands hospice. Prepare the account, practice the language, and keep the next commitment connected across web and iPhone.
              </p>
              <div className="flex w-full flex-col items-start gap-5 sm:w-auto sm:flex-row sm:items-center">
                <div className="membership-hero-cta w-full sm:w-auto">
                  <SubscribeCTA
                    surface="membership_pricing"
                    showHint={false}
                    testId="membership-hero-subscribe"
                    className="max-w-full whitespace-normal !bg-[var(--fi-rust)] !text-[var(--fi-cream)] hover:!bg-[#974a34]"
                  />
                </div>
                <a href="#access-options" className="fi-btn-outline border-[var(--fi-cream)] hover:bg-[var(--fi-cream)] hover:text-[var(--fi-ink)]">
                  View access plans
                </a>
              </div>
            </div>
            
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute -bottom-5 -left-5 h-28 w-28 border-b border-l border-[#e8a183]" />
              <div className="relative overflow-hidden border border-[rgba(251,248,241,.2)] bg-[#d8ddd5]">
                <div className="flex items-center justify-between border-b border-[rgba(19,32,31,.1)] bg-[rgba(251,248,241,.9)] px-4 py-3 text-[var(--fi-ink)]">
                  <div className="flex gap-2 items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[rgba(19,32,31,.6)]">Live Workspace</span>
                </div>
                <img src={uiDark} alt="Hospice Sales Pro Command Center workspace" className="block h-auto w-full fi-fade-image" />
              </div>
              <p className="mt-4 flex justify-between text-[10px] font-bold uppercase tracking-[.15em] text-[rgba(251,248,241,.6)]">
                <span>Command Center</span><span>Web + iPhone</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Workflow */}
      <section className="bg-[var(--fi-paper)]" data-testid="section-daily-workflow">
        <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_.9fr]">
            <div className="relative order-2 lg:order-1" data-testid="section-tool-grid">
              <div className="absolute -top-5 -right-5 h-28 w-28 border-t border-r border-[var(--fi-rust)]" />
              <div className="relative overflow-hidden border border-[var(--fi-line)] bg-white">
                <div className="flex items-center justify-between border-b border-[var(--fi-line)] bg-[var(--fi-cream)] px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[rgba(19,32,31,.6)]">Product Architecture</p>
                </div>
                <img src={uiLight} alt="Hospice Sales Pro field workflow" className="block h-auto w-full fi-fade-image" />
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:pl-10">
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--fi-rust)]">Interface</p>
              <h2 className="fi-serif text-[clamp(2.8rem,5vw,4.5rem)] leading-[.9] mb-6">The daily field workflow.</h2>
              <p className="text-[17px] leading-[1.7] text-[rgba(19,32,31,.72)] mb-10">
                Start in Command Center, open the tool the conversation requires, and capture the outcome immediately. The architecture mirrors actual field behavior, not generic CRM logging.
              </p>
              <div className="space-y-8 border-t border-[var(--fi-line)] pt-8">
                <div>
                  <h3 className="text-lg font-bold">Command Center Base</h3>
                  <p className="text-sm leading-[1.6] text-[rgba(19,32,31,.65)] mt-2">One clear view of your active territory plan.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Embedded AI Tooling</h3>
                  <p className="text-sm leading-[1.6] text-[rgba(19,32,31,.65)] mt-2">Summon playbooks and scripts exactly when needed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Access Context */}
      <section className="border-t border-[var(--fi-line)] bg-[var(--fi-cream)]" data-testid="section-membership-context">
        <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
          <div className="mb-16 max-w-2xl">
            <h2 className="fi-serif text-[clamp(2.8rem,5vw,4.5rem)] leading-[.9] mb-6">One product.<br />Three ways in.</h2>
            <p className="text-[17px] leading-[1.7] text-[rgba(19,32,31,.72)]">
              See the workspaces first. Use the directory to see a specific job, then choose the access path that matches your role.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                num: "01",
                title: "Individual Rep",
                desc: "Choose Standard for self-serve field execution or Elite when private coaching matters.",
                href: "#access-options",
                action: "Compare plans",
                isHash: true
              },
              {
                num: "02",
                title: "Team or Provider",
                desc: "Request a timed evaluation, then arrange contracted seats and group onboarding.",
                href: "/request-access",
                action: "Request access",
                isHash: false
              },
              {
                num: "03",
                title: "Consulting + Seats",
                desc: "Combine Hospice Sales Pro seats with structural leadership coaching or workshops.",
                href: "/contact",
                action: "Book a call",
                isHash: false
              }
            ].map((path) => (
              <div key={path.num} className="border border-[var(--fi-line)] bg-[var(--fi-paper)] p-8 flex flex-col transition-colors hover:bg-white">
                <span className="text-[11px] font-bold text-[var(--fi-rust)] mb-6">{path.num}</span>
                <h3 className="text-xl font-bold mb-4">{path.title}</h3>
                <p className="text-[15px] leading-[1.65] text-[rgba(19,32,31,.72)] mb-8 flex-1">{path.desc}</p>
                {path.isHash ? (
                  <a href={path.href} className="fi-link inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[.12em] text-[var(--fi-rust)] self-start">
                    {path.action} <ArrowRight size={14} />
                  </a>
                ) : (
                  <Link href={path.href} className="fi-link inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[.12em] text-[var(--fi-rust)] self-start">
                    {path.action} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Access Plans */}
      <section className="bg-[var(--fi-paper)]" id="access-options">
        <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-32">
          <div className="mb-20 text-center">
            <h2 className="fi-serif text-[clamp(3.2rem,6vw,5.5rem)] leading-[.9] mb-4">Self-serve access plans</h2>
            <p className="text-[16px] text-[rgba(19,32,31,.72)]">Weekly access, cancel anytime from your account. Teams require contracted seats.</p>
          </div>

          <div className="mx-auto grid max-w-[900px] gap-8 md:grid-cols-2">
            {/* Standard */}
            <div className="border border-[var(--fi-line)] bg-[var(--fi-cream)] p-10 flex flex-col" data-testid="card-tier-individual">
              <div className="mb-8">
                <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[rgba(19,32,31,.5)] mb-3 block">Base Capability</span>
                <h3 className="text-2xl font-bold uppercase tracking-wider">Individual Standard</h3>
              </div>
              <div className="mb-10 flex items-baseline gap-2 border-b border-[var(--fi-line)] pb-8">
                <span className="fi-serif text-5xl">${PRICING_FACTS.individualWeeklyUsd}</span>
                <span className="text-[13px] font-bold uppercase tracking-widest text-[rgba(19,32,31,.5)]">/ week</span>
              </div>
              <ul className="mb-12 space-y-5 flex-1">
                {["Command Center & tools", "Plans, calculators, resources", "Web & iPhone access"].map(f => (
                  <li key={f} className="flex items-start gap-3 text-[15px] font-medium text-[rgba(19,32,31,.8)]">
                    <Check className="mt-[2px] w-4 h-4 text-[var(--fi-rust)] shrink-0" /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div data-testid="button-tier-individual-subscribe">
                <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-individual" plan="standard_weekly" />
              </div>
            </div>

            {/* Elite */}
            <div className="fi-dark border border-[var(--fi-rust)] bg-[var(--fi-field)] p-10 flex flex-col text-[var(--fi-cream)] relative" data-testid="card-tier-elite">
              <div className="absolute top-0 right-0 bg-[var(--fi-rust)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[.2em]">
                Recommended
              </div>
              <div className="mb-8">
                <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#e8a183] mb-3 block">Maximum Readiness</span>
                <h3 className="text-2xl font-bold uppercase tracking-wider">Elite</h3>
              </div>
              <div className="mb-10 flex items-baseline gap-2 border-b border-[rgba(251,248,241,.15)] pb-8">
                <span className="fi-serif text-5xl">${PRICING_FACTS.eliteWeeklyUsd}</span>
                <span className="text-[13px] font-bold uppercase tracking-widest text-[rgba(251,248,241,.6)]">/ week</span>
              </div>
              <ul className="mb-12 space-y-5 flex-1">
                {["Everything in Standard", "Private voice coaching", "Deidentified policy education"].map(f => (
                  <li key={f} className="flex items-start gap-3 text-[15px] font-medium">
                    <Check className="mt-[2px] w-4 h-4 text-[#e8a183] shrink-0" /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div data-testid="button-tier-elite-subscribe">
                <SubscribeCTA surface="membership_pricing" showHint={false} testId="button-tier-elite" plan="elite_weekly" />
              </div>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-[900px] border border-[var(--fi-line)] bg-[var(--fi-cream)] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-lg font-bold mb-2">Choose or manage access</h3>
              <p className="text-[14px] leading-[1.6] text-[rgba(19,32,31,.72)]">Choose Standard or Elite, then create or sign in to your account. Manage from Account to cancel individual access anytime; teams request contracted seats.</p>
            </div>
            {canUseFieldKit && (
              <Link href="/account" className="fi-btn-outline whitespace-nowrap">
                Manage from Account
              </Link>
            )}
          </div>
          <div className="mx-auto mt-8 max-w-[900px] text-center text-[11px] font-semibold uppercase tracking-wider text-[rgba(19,32,31,.5)]" data-testid="membership-legal">
            <p>Billing continues automatically until you cancel. Teams require contracted seats.</p>
          </div>
        </div>
      </section>

      <section className="fi-dark bg-[var(--fi-ink)] text-[var(--fi-cream)]">
        <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10">
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
