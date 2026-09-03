import { Card } from "@/components/ui/card";
import { CheckIcon } from "@/components/icons";
import { BackButton } from "@/components/BackButton";
import { Users, Building2, UserCheck, ClipboardList, MessageCircleQuestion, ArrowRight, X, Shield, MonitorSmartphone } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { PersuasionShell } from "@/components/PersuasionShell";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

  return (
    <PersuasionShell>
      <SEO />
      <BackButton />
      <div className="text-center max-w-4xl mx-auto mb-14 sm:mb-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent blur-3xl -z-10" />
        <p className="text-kicker mb-4 animate-fade-in-up">Hospice growth consulting</p>
        <h1 className="text-hero text-foreground mb-6 animate-fade-in-up font-display" data-testid="text-services-title">
          Work <span className="text-primary">With Us</span>
        </h1>
        <p className="text-body-lg text-muted-foreground mb-4 animate-fade-in-up max-w-2xl mx-auto" style={{ animationDelay: "0.1s" }}>
          Human coaching, team systems, and leadership rhythms for hospice growth — so the right conversations happen when eligible patients need care.
        </p>
        <p className="text-body text-muted-foreground max-w-3xl mx-auto animate-fade-in-up mb-8" style={{ animationDelay: "0.2s" }}>
          Every engagement exists because good people still miss referrals without structure. We install the coaching and the weekly system — not a slide deck you forget on Monday.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
          <Button size="lg" asChild className="font-bold">
            <Link href="/contact">
              Book a strategy call <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="font-bold">
            <Link href="/method">See the Spartan Method</Link>
          </Button>
        </div>
      </div>

      {/* Engagement guide — help visitors choose before the full catalog */}
      <div
        className="max-w-6xl mx-auto mb-12 sm:mb-16"
        data-testid="section-engagement-guide"
      >
        <div className="text-center max-w-2xl mx-auto mb-6">
          <p className="text-kicker justify-center mb-3">Start with the right fit</p>
          <h2 className="text-h2 font-display text-foreground">What kind of <span className="text-primary">help</span> do you need?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            Choose the closest match. Each path opens the kind of conversation, time commitment, and next step you can expect.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            t: "Individual coaching",
            frame: "Session-based",
            d: "One rep’s obstacle, territory, or conversation. Investment is scoped on the call.",
            href: "#individual",
            action: "See individual options",
          },
          {
            t: "Team workshops",
            frame: "Typically 1–2 days",
            d: "Shared language, practice, and a repeatable team process for your market.",
            href: "#leadership",
            action: "See team options",
          },
          {
            t: "Leadership & strategy",
            frame: "Monthly or multi-month",
            d: "Director coaching, growth systems, and multi-market execution with a clear roadmap.",
            href: "#corporate",
            action: "See leadership options",
          },
          {
            t: "Technology solutions",
            frame: "Custom engagement",
            d: "Purpose-built CRM, iOS, or web tools for hospice-specific workflows.",
            href: "#technology",
            action: "See technology options",
          },
        ].map((s) => (
          <Card key={s.t} className="border border-border/80 bg-card p-5 text-left h-full flex flex-col">
            <p className="text-[10px] font-bold tracking-widest uppercase text-primary mb-1">
              {s.frame}
            </p>
            <h3 className="text-base font-display font-bold text-foreground mb-2">{s.t}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">{s.d}</p>
            <Link
              href={s.href}
              className="inline-flex items-center gap-1.5 mt-5 min-h-11 text-sm font-bold text-primary hover:underline underline-offset-4"
              data-testid={`link-engagement-${s.t.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {s.action}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </Card>
        ))}
        </div>
      </div>

      {/* How engagements work — craft strip, coaching-first */}
      <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-16 sm:mb-20">
        {[
          { t: "Diagnose", d: "Territory, team, and referral pattern — honest read, no fluff." },
          { t: "Install", d: "Coaching, workshops, and a weekly rhythm the team can run without you." },
          { t: "Sustain", d: "Scorecards, ridealongs, and leadership coaching that hold through busy season." },
        ].map((s) => (
          <Card key={s.t} className="border border-border/80 bg-card p-5 text-center sm:text-left">
            <p className="text-kicker mb-2 justify-center sm:justify-start">{s.t}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
          </Card>
        ))}
      </div>

      {/* Individual Sales Reps Section */}
      <div id="individual" className="space-y-8 md:space-y-12 lg:space-y-16 scroll-mt-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-h2 text-foreground mb-1 font-display tracking-tight">For Individual <span className="text-primary">Sales Reps</span></h2>
            <p className="text-body text-muted-foreground">Get better at the job you&apos;re doing right now.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-cards">
          {individualServices.map((service, idx) => (
            <Card key={idx} className="flex flex-col border group relative spacing-card shadow-lg hover-card bg-card dark:border-border border-l-4 border-l-primary" data-testid={`card-individual-${idx}`}>
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-radial from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
              <div className="flex-1 relative">
                <h3 className="text-h3 font-bold text-foreground mb-3">{service.title}</h3>
                <div className="flex items-baseline gap-3 mb-6">
                  <p className="text-3xl font-black text-primary">{service.price}</p>
                  <p className="text-sm text-muted-foreground">{service.duration}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Problem:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.problem}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Solution:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.solution}</p>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-semibold text-foreground mb-3">What's Included:</p>
                  <ul className="space-y-2">
                    {service.includes.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-accent/30 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold text-foreground mb-2">Outcome:</p>
                  <p className="text-sm text-muted-foreground">{service.outcome}</p>
                </div>
              </div>
              <div className="relative">
                <Button size="sm" asChild className="w-full font-bold" data-testid={`button-get-started-individual-${idx}`}>
                  <Link href={`/contact?service=${encodeURIComponent(service.title)}`}>
                    <span>Get Started</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      {/* Sales Leadership Section */}
      <div id="leadership" className="space-y-8 md:space-y-12 lg:space-y-16 scroll-mt-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mt-16 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-spartan-gradient flex items-center justify-center shadow-2xl flex-shrink-0">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-h2 text-foreground mb-1">For Sales <span className="text-primary">Leadership</span></h2>
            <p className="text-body text-muted-foreground">Build teams that execute consistently and scale what works.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-cards">
          {leadershipServices.map((service, idx) => (
            <Card key={idx} className="flex flex-col border group relative spacing-card shadow-lg hover-card bg-card dark:border-border border-l-4 border-l-primary" data-testid={`card-leadership-${idx}`}>
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-radial from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
              <div className="flex-1 relative">
                <h3 className="text-h3 font-bold text-foreground mb-3">{service.title}</h3>
                <div className="flex items-baseline gap-3 mb-6">
                  <p className="text-3xl font-black text-primary">{service.price}</p>
                  <p className="text-sm text-muted-foreground">{service.duration}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Problem:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.problem}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Solution:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.solution}</p>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-semibold text-foreground mb-3">What's Included:</p>
                  <ul className="space-y-2">
                    {service.includes.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-accent/30 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold text-foreground mb-2">Outcome:</p>
                  <p className="text-sm text-muted-foreground">{service.outcome}</p>
                </div>
              </div>
              <div className="relative">
                <Button size="sm" asChild className="w-full font-bold" data-testid={`button-get-started-leadership-${idx}`}>
                  <Link href={`/contact?service=${encodeURIComponent(service.title)}`}>
                    <span>Get Started</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      {/* Corporate Providers Section */}
      <div id="corporate" className="space-y-8 md:space-y-12 lg:space-y-16 scroll-mt-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mt-16 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-spartan-gradient flex items-center justify-center shadow-2xl flex-shrink-0">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-h2 text-foreground mb-1">For Corporate <span className="text-primary">Hospice Providers</span></h2>
            <p className="text-body text-muted-foreground">Scale execution across markets and make growth predictable.</p>
          </div>
        </div>

        <Card className="flex items-center gap-4 p-4 border-2 border-primary/20 bg-primary/5" data-testid="card-corporate-compliance">
          <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">HIPAA Compliant Engagement</p>
            <p className="text-xs text-muted-foreground">No PHI stored or processed. BAA available for corporate accounts. <Link href="/compliance" className="text-primary font-semibold hover:underline">View compliance details</Link></p>
          </div>
          <Button size="sm" asChild className="font-bold shrink-0 gap-1" data-testid="button-request-baa-services">
            <Link href="/contact?service=HIPAA+BAA+Request">
              Request a BAA
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-cards">
          {corporateServices.map((service, idx) => (
            <Card key={idx} className="flex flex-col border-2 group relative spacing-card shadow-lg" data-testid={`card-corporate-${idx}`}>
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-radial from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
              <div className="flex-1 relative">
                <h3 className="text-h3 font-bold text-foreground mb-3">{service.title}</h3>
                <div className="flex items-baseline gap-3 mb-6">
                  <p className="text-3xl font-black text-primary">{service.price}</p>
                  <p className="text-sm text-muted-foreground">{service.duration}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Problem:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.problem}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Solution:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.solution}</p>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-semibold text-foreground mb-3">What's Included:</p>
                  <ul className="space-y-2">
                    {service.includes.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-accent/30 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold text-foreground mb-2">Outcome:</p>
                  <p className="text-sm text-muted-foreground">{service.outcome}</p>
                </div>
              </div>
              <div className="relative">
                <Button size="sm" asChild className="w-full font-bold" data-testid={`button-get-started-corporate-${idx}`}>
                  <Link href={`/contact?service=${encodeURIComponent(service.title)}`}>
                    <span>Get Started</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Technology Solutions Section */}
      <div id="technology" className="space-y-8 md:space-y-12 lg:space-y-16 scroll-mt-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mt-16 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-spartan-gradient flex items-center justify-center shadow-2xl flex-shrink-0">
            <MonitorSmartphone className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-h2 text-foreground mb-1">Technology Solutions</h2>
            <p className="text-body text-muted-foreground">Custom-built tools designed specifically for hospice providers.</p>
          </div>
        </div>

        <div className="bg-accent/20 rounded-xl p-5 border border-border mb-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Off-the-shelf software is built for generic sales teams. Hospice operations have specific workflows, compliance requirements, and relationship dynamics that generic tools don't account for. These engagements deliver purpose-built technology that fits your organization, not the other way around.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-cards">
          {techServices.map((service, idx) => (
            <Card key={idx} className="flex flex-col border-2 group relative spacing-card shadow-lg" data-testid={`card-technology-${idx}`}>
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-radial from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
              <div className="flex-1 relative">
                <h3 className="text-h3 font-bold text-foreground mb-3">{service.title}</h3>
                <p className="text-3xl font-black text-primary mb-6">{service.price}</p>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Problem:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.problem}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Solution:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.solution}</p>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-semibold text-foreground mb-3">What's Included:</p>
                  <ul className="space-y-2">
                    {service.includes.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-accent/30 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold text-foreground mb-2">Outcome:</p>
                  <p className="text-sm text-muted-foreground">{service.outcome}</p>
                </div>
              </div>
              <div className="relative">
                <Button size="sm" asChild className="w-full font-bold" data-testid={`button-get-started-technology-${idx}`}>
                  <Link href={`/contact?service=${encodeURIComponent(service.title)}`}>
                    <span>Get Started</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* What This Is All For — dark authority band inside hybrid page */}
      <div className="surface-band rounded-3xl p-10 md:p-16 text-center mt-16 text-foreground border border-border">
        <h2 className="text-h2 font-black text-foreground mb-6">What This Is <span className="text-primary">All For</span></h2>
        <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
          Every coaching session, every field ride, every team workshop exists because eligible patients are not getting referred. Not because hospice is the wrong answer. Because the person who should have had that conversation was not prepared to have it. Spartan Coaching exists to fix that, one rep, one team, one market at a time.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild className="font-bold">
            <Link href="/contact">
              Book a strategy call <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="font-bold">
            <Link href="/method">See the Spartan Method</Link>
          </Button>
        </div>
      </div>

      {/* Application Process Section */}
      <div className="mt-16 sm:mt-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-h2 text-foreground mb-1 font-display tracking-tight">How we start</h2>
            <p className="text-body text-muted-foreground">Four steps from first contact to weekly coaching.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: 1,
              title: "Reach out",
              description: "Tell us about your role, your challenges, and what you want to improve.",
            },
            {
              step: 2,
              title: "Initial consult",
              description: "We review your situation and schedule a conversation to discuss fit.",
            },
            {
              step: 3,
              title: "Coaching plan",
              description: "We build a plan with clear deliverables, timeline, and success metrics.",
            },
            {
              step: 4,
              title: "Execute and refine",
              description: "Weekly coaching begins. We track progress, adjust, and build consistency.",
            },
          ].map((item) => (
            <Card key={item.step} className="spacing-card border-2 relative" data-testid={`card-step-${item.step}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {item.step}
                </div>
                <h3 className="text-h3 font-bold text-foreground">{item.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Common Questions Section */}
      <div className="mt-16 sm:mt-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-spartan-gradient flex items-center justify-center shadow-2xl flex-shrink-0">
            <MessageCircleQuestion className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-h2 text-foreground mb-1">Common Questions</h2>
            <p className="text-body text-muted-foreground">Answers to the questions we hear most before getting started.</p>
          </div>
        </div>

        <div className="max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="engagement-length" data-testid="faq-engagement-length">
              <AccordionTrigger className="text-left text-foreground font-semibold">
                How long is a typical engagement?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Engagements are flexible. Some clients do a focused 4 to 8 week sprint. Others maintain ongoing coaching. We recommend a timeline during your initial consult based on your goals.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="switch-types" data-testid="faq-switch-types">
              <AccordionTrigger className="text-left text-foreground font-semibold">
                Can I switch between coaching types?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Yes. Many clients start with individual coaching and expand to team training as they see results. We can adjust scope as your needs evolve.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="not-right-fit" data-testid="faq-not-right-fit">
              <AccordionTrigger className="text-left text-foreground font-semibold">
                What if coaching is not the right fit?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                We will tell you during the consult. If your challenge is better solved by a different approach, we will say so. No pressure, no wasted time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="outside-us" data-testid="faq-outside-us">
              <AccordionTrigger className="text-left text-foreground font-semibold">
                Do you work with hospice organizations outside the US?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Currently our coaching and consulting services focus on the US hospice market and Medicare regulations.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="time-commitment" data-testid="faq-time-commitment">
              <AccordionTrigger className="text-left text-foreground font-semibold">
                What is the time commitment?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Plan for 2 to 3 hours per week, including prep work, the coaching session, and post-session execution. The system is designed to fit into a working week, not replace it.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* CTA Section */}
      <div className="surface-band rounded-3xl p-10 md:p-16 text-center mt-16 text-foreground border border-border">
        <h2 className="text-h2 font-black text-foreground mb-6">
          Not Sure Which Service Fits?
        </h2>
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Every engagement starts with understanding your specific challenge. Let's talk about what is not working and build a plan that fixes it.
        </p>
        <Button size="lg" asChild className="font-bold shadow-lg touch-manipulation group px-10 bg-red-600 text-white border-red-600" data-testid="button-services-contact">
          <Link href="/contact">
            <span>Book a strategy call</span>
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
      <PublicConversionPanel
        source="services"
        audience="Hospice reps, sales leaders, and provider organizations with a specific execution or growth problem."
        promise="A scoped engagement with live coaching, practical deliverables, and a next-step plan."
        evidence="Services are organized by role and delivery format; the first conversation confirms fit before scope is set."
        primary={{ label: "Book a strategy call", href: "/contact?service=Consulting", token: "strategy_call" }}
        secondary={{ label: "See structured programs", href: "/programs", token: "programs" }}
      />
    </PersuasionShell>
  );
}
