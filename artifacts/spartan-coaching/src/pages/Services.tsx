import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, Stethoscope, Briefcase, Zap, Compass, Shield, Activity, ArrowRight, Layers, LayoutTemplate } from "lucide-react";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import { SPARTAN_AI_TOOLS } from "@workspace/spartan-ai-tools";
import { cn } from "@/lib/utils";

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
    { id: "individual", label: "Individual Execution", icon: Compass, services: individualServices },
    { id: "leadership", label: "Leadership Coaching", icon: Briefcase, services: leadershipServices },
    { id: "corporate", label: "Corporate Programs", icon: Layers, services: corporateServices },
    { id: "tech", label: "System Delivery", icon: LayoutTemplate, services: techServices },
  ];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 selection:bg-primary/20">
      <SEO title="Consulting & Systems | Spartan Coaching" />
      <BackButton />

      {/* Hero Section */}
      <header className="px-4 pt-32 pb-24 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-sm border border-slate-200 text-slate-600 text-xs font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Consulting & Systems
        </div>

        <h1
          className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 text-balance mx-auto mb-8"
          data-testid="text-services-title"
        >
          When effort is high but execution is inconsistent.
        </h1>

        <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
          For liaisons, sales leaders, and provider teams who need a clearer market plan, a coachable field standard, or a purpose-built workflow. We operate across 12 capabilities and deliver an integrated suite of field software tools.
        </p>
      </header>

      {/* The Baseline Challenge Block */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-24">
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

          <div className="grid lg:grid-cols-2 gap-12 relative z-10">
            <div>
              <h2 className="font-display text-3xl font-bold mb-8 text-white">The baseline challenge</h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5"><span className="text-sm font-bold leading-none">×</span></div>
                  <p className="text-slate-300">Territory activity is not producing clear next moves.</p>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5"><span className="text-sm font-bold leading-none">×</span></div>
                  <p className="text-slate-300">Leaders see results but cannot coach the behavior behind them.</p>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5"><span className="text-sm font-bold leading-none">×</span></div>
                  <p className="text-slate-300">Generic systems create more work than field clarity.</p>
                </li>
              </ul>
            </div>
            <div className="flex flex-col justify-center gap-4 lg:border-l border-slate-800 lg:pl-12">
              <Button size="lg" asChild className="rounded-full w-full bg-primary text-white hover:bg-primary/90 font-medium px-8 min-h-[3.5rem]">
                <Link href="/contact">Book a strategy call</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 font-medium min-h-[3.5rem]">
                <Link href="/method">Review our method</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Sequence */}
      <section className="bg-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-y border-slate-100">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">The Operating Sequence</h2>
          <p className="text-slate-500 text-lg">How every engagement is structured.</p>
        </div>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8 md:gap-12">
          {[
            { num: "01", title: "Diagnose", icon: Compass, copy: "Clarify the business condition, market reality, people involved, and decision that needs to change." },
            { num: "02", title: "Design", icon: Briefcase, copy: "Choose the smallest useful engagement and define the operating standard, scope, and responsibilities." },
            { num: "03", title: "Install", icon: Zap, copy: "Coach the work, practice the behavior, and leave leaders with a repeatable rhythm they can sustain." }
          ].map(({ num, title, icon: Icon, copy }) => (
            <div key={num} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 text-center relative hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-200 text-slate-600 mx-auto mb-6">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900 mb-3">{title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services Portfolio */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
           
           {/* Sidebar Navigation */}
           <aside className="lg:w-64 shrink-0 lg:sticky lg:top-32 hidden lg:block">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Consulting Index</p>
                <nav className="flex flex-col gap-2">
                   {categories.map(c => (
                      <a key={c.id} href={`#${c.id}`} className="text-sm font-medium text-slate-600 hover:text-primary transition-colors py-2 flex items-center gap-3">
                        <c.icon className="w-4 h-4" />
                        {c.label}
                      </a>
                   ))}
                   <div className="h-px bg-slate-100 my-4"></div>
                   <a href="#field-tools" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors py-2 flex items-center gap-3">
                      <LayoutTemplate className="w-4 h-4" />
                      Software Catalog
                   </a>
                </nav>
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/5 rounded-full px-3 py-1.5 w-fit mb-3">
                    <Stethoscope className="w-3.5 h-3.5" /> Privacy First
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Systems work follows strict privacy reviews to isolate PHI from routine operations.
                  </p>
                </div>
              </div>
           </aside>

           {/* Content */}
           <div className="flex-1 space-y-32 w-full">
              {categories.map((category) => (
                  <section
                    key={category.id}
                    id={category.id}
                    className="scroll-mt-32"
                    data-testid={
                      category.id === "individual"
                        ? "pathway-coaching"
                        : category.id === "corporate"
                          ? "pathway-workshops"
                          : category.id === "tech"
                            ? "pathway-technology"
                            : undefined
                    }
                  >
                    <div className="mb-10 flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary">
                         <category.icon className="w-5 h-5" />
                       </div>
                       <h2 className="font-display text-3xl font-bold text-slate-900">{category.label}</h2>
                    </div>

                    <div className="space-y-8">
                       {category.services.map((service, sIdx) => (
                          <ServiceCard key={sIdx} service={service} />
                       ))}
                    </div>
                 </section>
              ))}

              {/* Software Tool Catalog */}
              <section id="field-tools" className="scroll-mt-32 pt-24 border-t border-slate-200">
                <div className="mb-16 max-w-3xl">
                   <h2 className="font-display text-3xl font-bold text-slate-900 mb-6">Field Software Ecosystem</h2>
                   <p className="text-lg text-slate-600 leading-relaxed">
                     Our coaching can be paired with a purpose-built field product spanning 15 active field tools and 14 advanced AI systems. Availability depends on plan, role, clinical permission, and enabled features.
                   </p>
                </div>

                <div className="space-y-16">
                  {/* Classic Tools */}
                  <div>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Activity className="w-5 h-5" />
                      </div>
                      <h3 className="font-display text-xl font-bold text-slate-900">Active Field Tools</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {FIELD_KIT_TOOLS.map((tool) => (
                        <div key={tool.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-3">{tool.category}</span>
                          <h4 className="font-bold text-slate-900 mb-2">{tool.title}</h4>
                          <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">{tool.description}</p>
                          <div className="mt-auto space-y-2">
                            <span className="inline-block bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-md border border-blue-100 font-semibold">
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
                            <span className="inline-block bg-slate-50 text-slate-500 text-xs px-3 py-1 rounded-md border border-slate-100 font-medium">
                              When: {tool.whenToUse}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Tools */}
                  <div>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Shield className="w-5 h-5" />
                      </div>
                      <h3 className="font-display text-xl font-bold text-slate-900">Advanced Intelligence</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {SPARTAN_AI_TOOLS.map((tool) => (
                        <div key={tool.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">{tool.category}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              tool.permission === "clinical:use"
                                ? "bg-red-50 text-red-600 border-red-100"
                                : "bg-purple-50 text-purple-700 border-purple-100"
                            }`}>
                              {tool.permission === "clinical:use" ? "Clinical permission" : "Field Kit access"}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 mb-2">{tool.name}</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{tool.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
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

function ServiceCard({ service }: { service: any }) {
  return (
    <article className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      
      <div className="p-8 md:p-10 border-b border-slate-100">
         <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
           <h3 className="font-display text-2xl font-bold text-slate-900">{service.title}</h3>
           {(service.duration || service.price) && (
             <div className="flex flex-wrap gap-3 shrink-0">
               {service.duration && (
                 <span className="inline-flex bg-slate-50 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full border border-slate-200">
                   {service.duration}
                 </span>
               )}
               {service.price && (
                 <span className="inline-flex bg-primary/5 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/20">
                   {service.price}
                 </span>
               )}
             </div>
           )}
         </div>
         <p className="text-slate-600 leading-relaxed text-lg">
           <strong className="text-slate-900 font-semibold block mb-1">The Problem:</strong>
           {service.problem}
         </p>
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-slate-100 flex-1">
         <div className="p-8 md:p-10 flex flex-col justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">The Solution</p>
              <p className="text-slate-600 leading-relaxed mb-8">{service.solution}</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Target Outcome</p>
              <p className="font-semibold text-slate-900 leading-relaxed">{service.outcome}</p>
            </div>
         </div>
         
         <div className="p-8 md:p-10 bg-slate-50/50 flex flex-col">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5">Scope & Deliverables</p>
            <ul className="space-y-4 mb-8 flex-1">
              {service.includes.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full rounded-full border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900">
              <Link href={`/contact?service=${encodeURIComponent(service.title)}`}>
                Discuss this engagement
              </Link>
            </Button>
         </div>
      </div>
    </article>
  );
}
