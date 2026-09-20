import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import { SPARTAN_AI_TOOLS } from "@workspace/spartan-ai-tools";
import { useState } from "react";

export default function Services() {
  const individualServices = [
    {
      title: "Virtual Coaching Sessions",
      duration: "30 or 60 minutes",
      price: "Custom · session-based",
      problem: "You're stuck on a specific challenge, an objection you can't handle, a territory that isn't producing, or a referral partner who won't commit.",
      solution: "Get targeted, real-time coaching to break through the exact obstacle holding you back. No wasted time on theory you already know, just focused work on the one thing stopping you from moving forward right now.",
      includes: [
        "Prep form to identify the exact problem",
        "Live session with role-play and real scenarios",
        "One-page action plan for immediate implementation",
        "Recording for review (60 min sessions)",
      ],
      outcome: "Walk away with a clear next step you can execute Tuesday morning. Better execution means fewer stalled referrals, and fewer stalled referrals means more patients receive care when they need it.",
    },
    {
      title: "Field Coaching Ridealongs",
      duration: "Full day",
      price: "Custom pricing",
      problem: "You know what to say in theory, but it doesn't land in real conversations. You need live feedback, not more classroom training.",
      solution: "Experience coaching where it actually matters, in the field with real referral sources. Watch what works, practice it in live situations, and get immediate correction so you walk away with skills you can repeat in every call.",
      includes: [
        "Pre-work session with hospice liaison to set goals",
        "Full day of field time with live observation",
        "Real-time coaching between sales calls",
        "Post-call follow-up with written action summary and talk tracks",
      ],
      outcome: "See exactly what works in the field and practice it until it is repeatable. When real visits convert at a higher rate, eligible patients get referred instead of waiting.",
    },
    {
      title: "Territory Management Coaching",
      duration: "2-3 sessions",
      price: "Custom pricing",
      problem: "Your calendar is full but your pipeline isn't moving. You're busy but not productive.",
      solution: "Stop the chaos. Build a territory system that tells you exactly where to go, who to see, and when to follow up, so you spend time on accounts that actually convert instead of spinning your wheels on low-value visits.",
      includes: [
        "Territory analysis: who refers, who should, who's wasting your time",
        "Account prioritization system (A/B/C classification)",
        "Weekly routing plan for maximum efficiency",
        "Follow-up cadence that prevents dropped balls",
      ],
      outcome: "Spend less time driving, more time with decision-makers who can say yes. Focused reps reach the right people more often, and more of the right conversations lead to patients getting referred.",
    },
  ];

  const leadershipServices = [
    {
      title: "Team Training Workshops",
      duration: "1-2 days",
      price: "Custom pricing",
      problem: "Your team knows they should be doing better, but they don't have a shared system. Everyone's running their own playbook.",
      solution: "Give your entire team the same language, the same process, and the same skills, so they can coach each other, hold themselves accountable, and execute consistently without you micromanaging every interaction.",
      includes: [
        "Customized curriculum based on your market and challenges",
        "Live practice with objection handling and discovery",
        "Territory planning workshop with real accounts",
        "Written playbook your team can reference daily",
      ],
      outcome: "Your team speaks the same language, uses the same process, and coaches each other up. Consistent teams generate consistent referrals, and consistent referrals mean fewer eligible patients go unserved.",
    },
    {
      title: "Leadership Coaching",
      duration: "Monthly or quarterly",
      price: "Custom pricing",
      problem: "You're managing by results instead of coaching to behaviors. When numbers are down, you don't know what to fix.",
      solution: "Transform from firefighting to coaching. Learn to diagnose performance gaps, coach one skill at a time, and build a weekly rhythm that develops your team's capability instead of just chasing this month's numbers.",
      includes: [
        "1:1 coaching on skill-based management",
        "Pipeline review framework that drives action",
        "Weekly huddle structure (5 minutes that matter)",
        "Scorecard design: what to measure, how to use it",
      ],
      outcome: "You will know what good looks like, how to spot it, and how to coach your team to it. Leaders who develop people build teams that serve more patients at a higher standard.",
    },
    {
      title: "Growth Strategy Consulting",
      duration: "3-6 months",
      price: "Custom pricing",
      problem: "You're not sure where growth will come from. You need a plan that's specific, not aspirational.",
      solution: "Stop guessing. Get a clear roadmap showing exactly where referrals should come from, which accounts to prioritize, and what needs to change in your sales process to capture the opportunities you're currently missing.",
      includes: [
        "Market analysis: diagnosis mix, competitor positioning, referral patterns",
        "Growth opportunity identification (untapped accounts, diagnosis gaps)",
        "Sales process redesign for faster conversions",
        "Quarterly reviews to track progress and adjust",
      ],
      outcome: "A repeatable system for growth that does not depend on hope or heroics. Sustainable growth means more markets reached and more patients connected to care at the right time.",
    },
  ];

  const corporateServices = [
    {
      title: "Market & Territory Analysis",
      duration: "4-6 weeks",
      price: "Custom pricing",
      problem: "You don't know where referrals are coming from, where they should be coming from, or why the gap exists.",
      solution: "Get complete visibility into your market opportunity. Discover which accounts are underperforming, where competitors are winning, and which diagnosis categories represent untapped growth, so you can deploy resources where they'll actually move the needle.",
      includes: [
        "Referral source analysis by market and diagnosis",
        "Competitor positioning and market share assessment",
        "Territory design: account assignment, routing optimization",
        "Top 10 growth opportunities with action plans",
      ],
      outcome: "You will know exactly where to focus resources for the highest return. Better targeting means teams spend time on accounts where eligible patients are actually being missed.",
    },
    {
      title: "System Implementation & Training",
      duration: "3-6 months",
      price: "Custom pricing",
      problem: "You have markets performing differently with no standard process. Wins aren't repeatable and you can't scale what's working.",
      solution: "Build one execution system that works in every market. Standardize how your team prospects, presents, handles objections, and follows up, so you can finally replicate what top performers do and stop relying on individual heroics.",
      includes: [
        "Sales process design and documentation",
        "Team training rollout (virtual or on-site)",
        "Leadership coaching for local managers",
        "Performance tracking system and dashboards",
      ],
      outcome: "Every market runs the same playbook. You can see what is working and replicate it. Standardized execution across markets means no region leaves eligible patients underserved.",
    },
    {
      title: "Executive Consulting",
      duration: "Ongoing retainer",
      price: "Custom pricing",
      problem: "You need strategic guidance for growth, M&A integration, or performance turnarounds, not generic consulting, but hospice-specific expertise.",
      solution: "Access senior-level strategic thinking without hiring a full-time executive. Get hospice-specific guidance on growth strategy, M&A integration, and performance turnarounds, from someone who's been in the field, knows what actually works, and can help you navigate complex decisions faster.",
      includes: [
        "Monthly strategic planning sessions",
        "Market expansion and acquisition guidance",
        "Sales force effectiveness audits",
        "Crisis response and performance turnarounds",
      ],
      outcome: "Make better decisions faster with someone who knows hospice sales inside and out. Strategic clarity at the top translates to more families reached and served in every market.",
    },
  ];

  const techServices = [
    {
      title: "Custom CRM Development",
      price: "Custom pricing",
      problem: "Generic CRMs are built for sales teams that sell products, not hospice liaisons managing relationships with physicians, facilities, and families. You're forcing a tool that doesn't fit your workflow, and it's costing you visibility.",
      solution: "Get a CRM built specifically for hospice sales operations. Track referral relationships, physician outreach cadences, facility account history, and census impact in one system designed around how hospice liaisons actually work.",
      includes: [
        "Discovery and workflow mapping with your team",
        "Custom fields, pipelines, and dashboards for hospice-specific data",
        "Referral source tracking by account type and diagnosis",
        "Integration with existing EMR or reporting tools where possible",
        "Training and documentation for your team",
      ],
      outcome: "Your team stops working around their tools and starts working with them. Better data means better decisions, more consistent follow-through, and fewer referral opportunities that fall through the cracks.",
    },
    {
      title: "iOS App Development",
      price: "Custom pricing",
      problem: "Your liaisons are in the field all day with no reliable way to log visits, update account status, or access patient eligibility information in real time. Field work happens on paper or memory and critical data gets lost.",
      solution: "Put a purpose-built iOS app in the hands of every field liaison. Log visits, update referral source notes, track follow-up commitments, and access territory intelligence from any location, all built around the specific workflows of your organization.",
      includes: [
        "iOS native app built for iPhone and iPad",
        "Offline mode for areas with limited connectivity",
        "Real-time sync with your CRM or backend system",
        "Visit logging, account notes, and follow-up scheduling",
        "App Store submission and deployment support",
      ],
      outcome: "Your liaisons capture better data in the field, follow through on more commitments, and spend less time on administrative catch-up. The organization gets real-time visibility into field activity without adding reporting burden.",
    },
    {
      title: "Custom Website Development",
      price: "Custom pricing",
      problem: "Your website looks like a template. It does not reflect your organization's culture, differentiate your care model, or give referral sources and families a clear reason to choose you over a competitor two miles away.",
      solution: "Build a website that works for your hospice organization specifically. One that speaks to your referral sources, communicates your care philosophy, and makes it easy for families in crisis to take the next step without confusion.",
      includes: [
        "Discovery session to understand your market, brand, and referral source audience",
        "Custom design aligned with your organization's identity",
        "Referral source portal or intake flow (if needed)",
        "Mobile-optimized and fast-loading on all devices",
        "SEO foundation targeting your service areas and diagnosis categories",
      ],
      outcome: "A website that does actual work. Referral sources who visit understand what makes you different. Families in need find a clear path to care. Your digital presence stops being a liability and starts generating inbound interest.",
    },
  ];

  const categories = [
    { id: "individual", label: "Individual Execution", services: individualServices },
    { id: "leadership", label: "Leadership Coaching", services: leadershipServices },
    { id: "corporate", label: "Corporate Programs", services: corporateServices },
    { id: "tech", label: "System Delivery", services: techServices },
  ];

  const [activeCategory, setActiveCategory] = useState("individual");

  const activeServices = categories.find(c => c.id === activeCategory)?.services || [];

  return (
    <div className="page-persuasion font-sans">
      <SEO title="Consulting & Systems | Spartan Coaching" />
      <BackButton />

      {/* Hero */}
      <section className="fi-dark fi-section bg-[var(--fi-ink)]">
        <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
          <div className="flex flex-col justify-between gap-10 border-b border-[var(--fi-line-light)] pb-12 md:flex-row md:items-end">
            <div>
              <p className="fi-kicker fi-kicker-light mb-8">Consulting & Systems</p>
              <h1 className="fi-serif text-[clamp(3.5rem,7vw,7rem)] leading-[0.9] max-w-[800px]" data-testid="text-services-title">
                When effort is high <span className="text-[var(--fi-red)]">but execution is inconsistent.</span>
              </h1>
            </div>
            <p className="max-w-[340px] text-[1.125rem] leading-[1.6] text-white/80 font-medium">
              For liaisons, sales leaders, and provider teams who need a clearer market plan, a coachable field standard, or a purpose-built workflow. We operate across 12 capabilities and deliver an integrated suite of field software tools.
            </p>
          </div>
          
          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              { num: "01", title: "Diagnose", copy: "Clarify the business condition, market reality, people involved, and decision that needs to change." },
              { num: "02", title: "Design", copy: "Choose the smallest useful engagement and define the operating standard, scope, and responsibilities." },
              { num: "03", title: "Install", copy: "Coach the work, practice the behavior, and leave leaders with a repeatable rhythm they can sustain." }
            ].map(({ num, title, copy }) => (
              <div key={num} className="pt-6 border-t border-[var(--fi-line-light)]">
                <span className="text-[0.75rem] font-bold text-[var(--fi-red)] font-mono">{num}</span>
                <h3 className="mt-4 text-xl font-bold uppercase tracking-wider">{title}</h3>
                <p className="mt-4 text-sm leading-[1.6] text-white/70 font-medium">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Portfolio */}
      <section className="fi-section bg-[var(--fi-paper)]">
        <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24">
          <div
            className="mb-14 flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-[var(--fi-line)]"
            role="tablist"
            aria-label="Consulting capability categories"
          >
            {categories.map(c => (
              <button
                key={c.id}
                id={`services-tab-${c.id}`}
                type="button"
                role="tab"
                aria-selected={activeCategory === c.id}
                aria-controls="services-category-panel"
                onClick={() => setActiveCategory(c.id)}
                className={`pb-4 text-[0.75rem] font-bold font-mono uppercase tracking-[.15em] transition-colors ${
                  activeCategory === c.id 
                    ? "border-b-2 border-[var(--fi-red)] text-[var(--fi-red)]" 
                    : "text-black/50 hover:text-[var(--fi-ink)]"
                }`}
                data-testid={
                  c.id === "individual" ? "pathway-coaching" : 
                  c.id === "corporate" ? "pathway-workshops" : 
                  c.id === "tech" ? "pathway-technology" : undefined
                }
              >
                {c.label}
              </button>
            ))}
          </div>

          <div
            id="services-category-panel"
            className="space-y-16 lg:space-y-24"
            role="tabpanel"
            aria-labelledby={`services-tab-${activeCategory}`}
          >
            {activeServices.map((service, sIdx) => (
              <ServiceBlock key={sIdx} service={service} index={sIdx} />
            ))}
          </div>
        </div>
      </section>

      {/* Software Catalog */}
      <section id="field-tools" className="fi-section bg-white">
         <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24">
            <div className="mb-16 max-w-2xl">
              <p className="fi-kicker mb-8">Software Ecosystem</p>
              <h2 className="fi-serif text-[clamp(2.5rem,5vw,4.5rem)] leading-[.9]">Field tools &<br />advanced intelligence.</h2>
              <p className="mt-6 text-[1.125rem] leading-[1.6] font-medium text-black/70">
                Our coaching can be paired with a purpose-built field product spanning 15 active field tools and 14 advanced AI systems. Availability depends on plan, role, clinical permission, and enabled features.
              </p>
            </div>

            <div className="space-y-20">
              {/* Classic Tools */}
              <div>
                <h3 className="mb-10 text-xl font-bold uppercase tracking-wider border-b border-[var(--fi-line)] pb-4">Active Field Tools</h3>
                <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {FIELD_KIT_TOOLS.map((tool) => (
                    <div key={tool.id} className="flex flex-col">
                      <span className="mb-4 text-[0.75rem] font-bold uppercase tracking-wider text-[var(--fi-red)] font-mono">{tool.category}</span>
                      <h4 className="mb-3 text-[1.25rem] font-bold">{tool.title}</h4>
                      <p className="mb-6 flex-1 text-[0.9rem] leading-[1.65] font-medium text-black/70">{tool.description}</p>
                      <div className="mt-auto space-y-2 text-[0.75rem] font-bold font-mono">
                        <span className="block border border-[var(--fi-line)] px-3 py-2 uppercase tracking-wider bg-[var(--fi-paper)]">
                          {tool.public
                            ? "Public preview"
                            : `${tool.membership === "elite" ? "Elite" : "Standard"} · ${
                                tool.mobile === "native"
                                  ? "Web + iPhone"
                                  : tool.mobile === "webview"
                                    ? "Web + iPhone web"
                                    : "Web"
                              }`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Tools */}
              <div>
                <h3 className="mb-10 text-xl font-bold uppercase tracking-wider border-b border-[var(--fi-line)] pb-4">Advanced Intelligence</h3>
                <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {SPARTAN_AI_TOOLS.map((tool) => (
                    <div key={tool.id} className="flex flex-col">
                      <div className="mb-4 flex justify-between items-start gap-4 font-mono">
                        <span className="text-[0.75rem] font-bold uppercase tracking-wider text-black/50">{tool.category}</span>
                        <span className={`text-[0.75rem] font-bold uppercase tracking-wider px-2 py-1 border border-[var(--fi-line)] ${
                          tool.permission === "clinical:use" ? "bg-red-50 text-[var(--fi-red)] border-[var(--fi-red)]" : "bg-[var(--fi-paper)]"
                        }`}>
                          {tool.permission === "clinical:use" ? "Clinical" : "Field Kit"}
                        </span>
                      </div>
                      <h4 className="mb-3 text-[1.25rem] font-bold">{tool.name}</h4>
                      <p className="text-[0.9rem] leading-[1.65] font-medium text-black/70">{tool.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
         </div>
      </section>

      <PublicConversionPanel
        source="services"
        audience="Leaders looking for structural coaching and strategic systems."
        promise="A direct conversation about the reality of your market, not a generic pitch."
        evidence="Built from the field for the field."
        primary={{ label: "Book Strategy Call", href: "/contact", token: "strategy_call" }}
        secondary={{ label: "View Our Method", href: "/method", token: "method" }}
      />
    </div>
  );
}

function ServiceBlock({ service, index }: { service: any, index: number }) {
  return (
    <article className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-16 items-start">
      <div>
        <p className="mb-3 text-[0.75rem] font-bold uppercase tracking-[.2em] text-black/50 font-mono">0{index + 1}</p>
        <h3 className="fi-serif text-[clamp(2.2rem,4vw,3.5rem)] leading-[1] mb-6">{service.title}</h3>
        {(service.duration || service.price) && (
          <div className="mb-8 flex flex-wrap gap-4 text-[0.75rem] font-bold uppercase tracking-wider font-mono">
            {service.duration && <span className="border border-[var(--fi-line)] bg-white px-4 py-2">{service.duration}</span>}
            {service.price && <span className="border border-[var(--fi-line)] bg-white text-[var(--fi-ink)] px-4 py-2">{service.price}</span>}
          </div>
        )}
        <div className="bg-white p-6 md:p-8 border border-[var(--fi-line)]">
          <p className="fi-kicker mb-4">Target Outcome</p>
          <p className="font-bold leading-[1.6] text-[1.125rem]">{service.outcome}</p>
        </div>
      </div>

      <div className="space-y-10 lg:border-l lg:border-[var(--fi-line)] lg:pl-16 lg:pt-8">
        <div>
           <p className="text-[0.75rem] font-bold uppercase tracking-[.2em] text-black/50 mb-4 font-mono">The Problem</p>
           <p className="text-[1.125rem] leading-[1.6] font-medium text-black/80">{service.problem}</p>
        </div>
        <div>
           <p className="text-[0.75rem] font-bold uppercase tracking-[.2em] text-black/50 mb-4 font-mono">The Solution</p>
           <p className="text-[1.125rem] leading-[1.6] font-medium text-[var(--fi-red)]">{service.solution}</p>
        </div>
        <div className="border-t border-[var(--fi-line)] pt-8">
           <p className="text-[0.75rem] font-bold uppercase tracking-[.2em] text-black/50 mb-5 font-mono">Scope & Deliverables</p>
           <ul className="space-y-4">
             {service.includes.map((item: string, i: number) => (
               <li key={i} className="flex items-start gap-4 text-[1rem] font-bold text-black/80">
                 <span className="mt-[8px] w-2 h-2 bg-[var(--fi-red)] shrink-0" />
                 <span>{item}</span>
               </li>
             ))}
           </ul>
        </div>
      </div>
    </article>
  );
}
