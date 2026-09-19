import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Stethoscope } from "lucide-react";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";

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

  const pathways = [
    {
      id: "coaching",
      title: "Coaching & Strategy",
      subtitle: "For Leaders & High-Performing Reps",
      desc: "Direct strategy and coaching. Break through stalled territories, handle objections, and build a system that tells you where to go and who to see.",
    },
    {
      id: "workshops",
      title: "Team Workshops",
      subtitle: "For Organizations Scaling Execution",
      desc: "Give your entire team the same language and process. Transform from firefighting to coaching with a standardized playbook that drives results.",
    },
    {
      id: "technology",
      title: "Technology Solutions",
      subtitle: "For Corporate Providers",
      desc: "Stop forcing generic CRMs to fit hospice workflows. We build custom iOS apps, specific CRMs, and web portals designed exactly for how liaisons actually work.",
    }
  ];

  return (
    <div className="bg-background min-h-screen">
      <SEO title="Consulting & Services | Spartan Coaching" />
      <BackButton />

      {/* Hero Section */}
      <section className="px-4 py-16 sm:px-6 md:py-24 lg:px-8 border-b border-border">
        <div className="mx-auto max-w-[78rem] grid lg:grid-cols-[1.25fr_.75fr] gap-12 lg:items-end">
          <div>
            <p className="mb-6 font-mono text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-3">
              <span className="w-6 h-px bg-primary"></span>
              Consulting for hospice growth leaders
            </p>
            <h1
              className="font-serif text-4xl font-medium leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl text-balance"
              data-testid="text-services-title"
            >
              When effort is high but execution is inconsistent.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              For liaisons, sales leaders, and provider teams who need a clearer market plan, a coachable field standard, or a purpose-built workflow.
            </p>
          </div>

          <div className="bg-card p-8 border border-border shadow-sm">
            <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-foreground border-b border-border pb-3">The Baseline Challenge</p>
            <ul className="space-y-4 text-sm leading-relaxed text-muted-foreground mb-8">
              <li className="flex gap-3"><span className="text-primary font-bold">×</span> Territory activity is not producing clear next moves.</li>
              <li className="flex gap-3"><span className="text-primary font-bold">×</span> Leaders see results but cannot coach the behavior behind them.</li>
              <li className="flex gap-3"><span className="text-primary font-bold">×</span> Generic systems create more work than field clarity.</li>
            </ul>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button size="lg" asChild className="rounded-none w-full sm:w-auto font-mono text-xs font-bold tracking-widest uppercase">
                <Link href="/contact">Book a strategy call</Link>
              </Button>
              <Link href="/method" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/30 pb-0.5">
                Review our method
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Sequence */}
      <section className="border-b border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[78rem]">
          <div className="mb-12">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">How an engagement proceeds</p>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">
              The operating sequence
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-0 border border-border bg-border">
            {[
              { num: "01", title: "Diagnose", copy: "Clarify the business condition, market reality, people involved, and decision that needs to change." },
              { num: "02", title: "Design", copy: "Choose the smallest useful engagement and define the operating standard, scope, and responsibilities." },
              { num: "03", title: "Install", copy: "Coach the work, practice the behavior, and leave leaders with a repeatable rhythm they can sustain." }
            ].map(({ num, title, copy }) => (
              <div key={num} className="bg-card p-8">
                <span className="font-mono text-lg font-bold text-primary mb-6 block">{num}</span>
                <h3 className="font-serif text-2xl font-medium tracking-tight text-foreground mb-3">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Buyer Pathways overview */}
      <section className="py-16 md:py-24 bg-background px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-[78rem] mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {pathways.map(pathway => (
              <div key={pathway.id} className="flex flex-col" data-testid={`pathway-${pathway.id}`}>
                <p className="font-mono text-[10px] font-bold text-primary uppercase tracking-widest mb-3">{pathway.subtitle}</p>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-4">{pathway.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{pathway.desc}</p>
                <a href={`#section-${pathway.id}`} className="font-mono text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2 hover:underline">
                  View catalog <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Catalog Render */}
      <div className="bg-background pb-24 md:pb-32">
        {/* Coaching & Strategy Group */}
        <section id="section-coaching" className="pt-16 md:pt-24 px-4 sm:px-6 lg:px-8 scroll-mt-12">
          <div className="max-w-[78rem] mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-12 border-b border-border pb-6">
              Coaching & Strategy
            </h2>

            <div className="space-y-16">
              {individualServices.concat(leadershipServices).map((service, idx) => (
                <ServiceEntry key={idx} service={service} groupLabel={idx < 3 ? "Individual Execution" : "Leadership"} />
              ))}
            </div>
          </div>
        </section>

        {/* Corporate Workshops */}
        <section id="section-workshops" className="pt-24 md:pt-32 px-4 sm:px-6 lg:px-8 scroll-mt-12 border-t border-border mt-24">
          <div className="max-w-[78rem] mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-12 border-b border-border pb-6">
              Corporate & Growth
            </h2>

            <div className="space-y-16">
              {corporateServices.map((service, idx) => (
                <ServiceEntry key={idx} service={service} groupLabel="Corporate Programs" />
              ))}
            </div>
          </div>
        </section>

        {/* Technology */}
        <section id="section-technology" className="pt-24 md:pt-32 px-4 sm:px-6 lg:px-8 scroll-mt-12 border-t border-border mt-24">
          <div className="max-w-[78rem] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-border pb-6">
              <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-foreground">
                Technology Solutions
              </h2>
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-sm">
                <Stethoscope className="w-3.5 h-3.5" /> Privacy-First Delivery
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground max-w-3xl mb-12 border-l-2 border-primary pl-4">
              Technology work begins with workflow discovery, delivery scope, ownership, support expectations, and a privacy review. CRM, portal, and iOS work is not proposed until those conditions are understood to keep PHI out of routine tools.
            </p>

            <div className="space-y-16">
              {techServices.map((service, idx) => (
                <ServiceEntry key={idx} service={service} groupLabel="System Delivery" />
              ))}
            </div>
          </div>
        </section>
      </div>

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

function ServiceEntry({ service, groupLabel }: { service: any, groupLabel: string }) {
  return (
    <div className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16 items-start">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{groupLabel}</p>
        <h3 className="font-serif text-2xl font-medium text-foreground mb-4">{service.title}</h3>
        {service.duration && (
          <p className="text-sm text-muted-foreground mb-2"><span className="font-medium text-foreground">Duration:</span> {service.duration}</p>
        )}
        <Button asChild variant="outline" className="mt-6 rounded-none font-mono text-xs uppercase tracking-widest">
          <Link href={`/contact?service=${encodeURIComponent(service.title)}`}>
            Discuss this service
          </Link>
        </Button>
      </div>

      <div className="bg-card p-8 border border-border shadow-sm">
        <div className="space-y-6">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">The Problem</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{service.problem}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground mb-2">The Solution</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{service.solution}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground mb-3">Scope & Deliverables</p>
            <ul className="space-y-3">
              {service.includes.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-6 border-t border-border">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary mb-2">The Outcome</p>
            <p className="text-sm font-medium leading-relaxed text-foreground">{service.outcome}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
