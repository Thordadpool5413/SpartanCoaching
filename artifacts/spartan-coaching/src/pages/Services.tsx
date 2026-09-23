import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  Crosshair,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import { BackButton } from "@/components/BackButton";
import { SEO } from "@/components/SEO";
import { PersuasionShell } from "@/components/PersuasionShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "@/lib/publicFunnel";

type Engagement = {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  fit: string;
  format: string;
  outcome: string;
  includes: string[];
  icon: typeof UserRound;
};

type ConsultingService = {
  title: string;
  duration: string;
  description: string;
  includes: string[];
  label?: string;
  bestFor?: string;
  outcome?: string;
};

type ConsultingServiceGroup = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  services: ConsultingService[];
};

const engagements: Engagement[] = [
  {
    id: "field-performance",
    number: "01",
    eyebrow: "For individual reps",
    title: "Field Performance Intensive",
    fit: "A rep has activity, but the right conversations are not converting into commitments or referrals.",
    format: "Focused virtual coaching, territory work, or a full field ride-along built around real accounts.",
    outcome: "A sharper next move, stronger talk tracks, and a field plan the rep can use immediately.",
    includes: ["Live observation or role-play", "Account and territory diagnosis", "Written next-action plan"],
    icon: UserRound,
  },
  {
    id: "team-system",
    number: "02",
    eyebrow: "For sales teams",
    title: "Sales Team Operating System",
    fit: "Everyone is working hard, but each person is running a different playbook and managers are chasing results.",
    format: "A customized workshop plus the language, routines, scorecards, and coaching cadence needed after training.",
    outcome: "One shared standard the team can execute and leaders can coach every week.",
    includes: ["Hospice-specific workshop", "Field-ready playbook", "Manager reinforcement plan"],
    icon: Users,
  },
  {
    id: "growth-partnership",
    number: "03",
    eyebrow: "For leaders and organizations",
    title: "Growth Leadership Partnership",
    fit: "Growth is inconsistent across territories or markets and leadership needs a clear diagnosis, not another generic plan.",
    format: "A 90-day or multi-month partnership connecting market strategy, leadership behavior, and field execution.",
    outcome: "Clear priorities, accountable leaders, and a repeatable growth system that does not depend on heroics.",
    includes: ["Growth constraint assessment", "Leadership coaching", "Execution scorecard and review rhythm"],
    icon: BriefcaseBusiness,
  },
];

const consultingServiceGroups: ConsultingServiceGroup[] = [
  {
    id: "individual-coaching",
    eyebrow: "Individual services",
    title: "Coaching for field performance",
    description: "Focused support for representatives who need stronger conversations, clearer territory priorities, and coaching in the work itself.",
    services: [
      {
        title: "Virtual Coaching Sessions",
        duration: "30 or 60 minutes",
        description: "Targeted, real-time coaching for a specific objection, stalled account, territory challenge, or referral conversation.",
        includes: ["Pre-session problem diagnosis", "Live role-play with real scenarios", "One-page immediate action plan"],
      },
      {
        title: "Field Coaching Ridealongs",
        duration: "Full day",
        description: "Live field observation and coaching with real referral sources, followed by practical correction and repeatable talk tracks.",
        includes: ["Pre-work goal setting", "Full day of field observation", "Written action summary and talk tracks"],
      },
      {
        title: "Territory Management Coaching",
        duration: "2–3 sessions",
        description: "A practical territory system that clarifies where to go, who to see, and how to follow up with the accounts most likely to convert.",
        includes: ["Territory and account analysis", "A/B/C account prioritization", "Weekly routing and follow-up cadence"],
      },
    ],
  },
  {
    id: "leadership-development",
    eyebrow: "Leadership services",
    title: "Leadership and team development",
    description: "Shared standards, coaching rhythms, and growth strategy for leaders who need to turn isolated wins into consistent team execution.",
    services: [
      {
        title: "Team Training Workshops",
        duration: "1–2 days",
        description: "Customized, hospice-specific workshops that give the team one language, one process, and a playbook leaders can reinforce.",
        includes: ["Customized market curriculum", "Live objection and discovery practice", "Written execution playbook"],
      },
      {
        title: "Leadership Coaching",
        duration: "Monthly or quarterly",
        description: "Skill-based management coaching that helps leaders diagnose behavior, run useful pipeline reviews, and coach beyond the final number.",
        includes: ["One-to-one leadership coaching", "Pipeline and huddle frameworks", "Behavior-based scorecard design"],
      },
      {
        title: "Growth Strategy Consulting",
        duration: "3–6 months",
        description: "A market-specific roadmap showing where referral growth should come from and what must change to capture it.",
        includes: ["Market and referral-pattern analysis", "Growth opportunity identification", "Sales-process redesign and reviews"],
      },
    ],
  },
  {
    id: "corporate-consulting",
    eyebrow: "Corporate services",
    title: "Multi-market growth systems",
    description: "Enterprise-level analysis, implementation, and executive support for providers that need one standard across markets.",
    services: [
      {
        title: "Market & Territory Analysis",
        duration: "4–6 weeks",
        description: "A complete view of referral patterns, competitor position, territory design, and the highest-value growth opportunities.",
        includes: ["Referral-source and diagnosis analysis", "Competitor and market assessment", "Top growth opportunities with action plans"],
      },
      {
        title: "System Implementation & Training",
        duration: "3–6 months",
        description: "One documented execution system for prospecting, presenting, objection handling, follow-up, and performance visibility.",
        includes: ["Sales-process design", "Virtual or on-site team rollout", "Manager coaching and performance dashboards"],
      },
      {
        title: "Executive Consulting",
        duration: "Ongoing retainer",
        description: "Hospice-specific strategic guidance for market expansion, M&A integration, performance turnarounds, and sales-force effectiveness.",
        includes: ["Monthly strategic planning", "Expansion and acquisition guidance", "Performance audits and turnaround support"],
      },
    ],
  },
  {
    id: "growth-operations",
    eyebrow: "Growth operations services",
    title: "Referral, clinical, and sales alignment",
    description: "Operational consulting that connects referral development, clinical readiness, admissions, leadership, and technology into one measurable growth process.",
    services: [
      {
        title: "Referral-to-Admission Process Optimization",
        duration: "6–12 weeks",
        label: "New",
        bestFor: "Hospices losing qualified referrals to slow response times, unclear handoffs, inconsistent follow-up, or avoidable intake friction.",
        description: "A detailed redesign of the path from first referral contact through eligibility review, family communication, admission, and referral-source follow-up.",
        outcome: "A faster, more accountable referral pathway with fewer preventable losses and clear ownership at every handoff.",
        includes: ["End-to-end referral journey audit", "Response-time, handoff, and escalation standards", "Conversion dashboard and lost-referral review cadence"],
      },
      {
        title: "Sales & Clinical Alignment Consulting",
        duration: "8–16 weeks",
        label: "New",
        bestFor: "Organizations where sales promises, clinical capacity, eligibility decisions, or service expectations are creating friction and lost trust.",
        description: "A facilitated operating model that gives sales, intake, clinical, and executive teams shared language, expectations, and decision rules.",
        outcome: "Stronger internal trust, cleaner referral communication, and growth commitments the clinical operation can consistently deliver.",
        includes: ["Cross-functional alignment assessment", "Shared service and eligibility communication standards", "Joint huddles, escalation paths, and accountability scorecard"],
      },
      {
        title: "CRM Implementation & Sales Process Design",
        duration: "8–20 weeks",
        label: "New",
        bestFor: "Hospices adopting a CRM—or underusing one—without a defined sales process, reliable data standards, or manager coaching rhythm.",
        description: "A hospice-specific CRM implementation that begins with the sales process, then configures the technology around how representatives and leaders actually work.",
        outcome: "A usable CRM, a visible pipeline, and a management system that turns field activity into accountable next actions and growth insight.",
        includes: ["Sales-process and data architecture design", "CRM configuration, migration planning, and workflow setup", "Team rollout, adoption coaching, and reporting standards"],
      },
    ],
  },
  {
    id: "technology-solutions",
    eyebrow: "Technology services",
    title: "Connected digital growth platforms",
    description: "Custom digital products designed around hospice growth, referral, intake, and field workflows—available individually or as one connected platform.",
    services: [
      {
        title: "Hospice Website Design & Development",
        duration: "12–20 weeks",
        label: "New",
        bestFor: "Hospices that need a credible, differentiated website serving families, referral partners, recruits, and local markets.",
        description: "A strategy-led hospice website built to explain care clearly, establish trust, support local discovery, and move each audience toward the right next step.",
        outcome: "A fast, accessible, conversion-focused web presence that reflects the organization and supports measurable growth.",
        includes: ["Audience, brand, content, and conversion strategy", "Custom responsive design with referral and family pathways", "CMS, analytics, local SEO, accessibility, and launch support"],
      },
      {
        title: "Custom Hospice iOS App Development",
        duration: "16–28 weeks",
        label: "New",
        bestFor: "Hospice teams that need a secure, purpose-built iPhone or iPad workflow instead of a generic mobile form or browser-only system.",
        description: "A custom iOS product for field sales, referral intake, leadership visibility, education, or another defined hospice workflow.",
        outcome: "A deployable mobile experience that reduces field friction, improves data quality, and gives teams the right information at the point of work.",
        includes: ["Product discovery, workflow mapping, and UX design", "Native iOS development with secure API integration", "Testing, App Store deployment, documentation, and launch support"],
      },
      {
        title: "Custom Hospice Sales CRM",
        duration: "16–28 weeks",
        label: "New",
        bestFor: "Hospices whose referral-development model cannot be managed well in an off-the-shelf CRM.",
        description: "A custom CRM centered on referral relationships, account history, commitments, field activity, territory intelligence, and census impact.",
        outcome: "One source of truth for field execution and leadership decisions, designed around the hospice's actual sales process.",
        includes: ["Custom account, contact, territory, and pipeline model", "Field workflows, dashboards, permissions, and integrations", "Data migration, team training, launch, and adoption support"],
      },
      {
        title: "CRM + Website Development",
        duration: "20–32 weeks",
        label: "New",
        bestFor: "Hospices ready to connect public lead and referral experiences directly to the team responsible for follow-up.",
        description: "A coordinated website and CRM build that joins external conversion paths with internal ownership, follow-up, reporting, and relationship history.",
        outcome: "A connected growth system in which web inquiries and referrals enter a defined workflow and leaders can see what happens next.",
        includes: ["Unified website, content, CRM, and data strategy", "Secure forms, routing, automation, and source attribution", "Role-based dashboards, analytics, training, and coordinated launch"],
      },
      {
        title: "CRM + Website + iOS App Development",
        duration: "28–44 weeks",
        label: "New",
        bestFor: "Multi-location or growth-stage hospices seeking one connected platform across public engagement, office operations, and field execution.",
        description: "A complete digital growth platform combining a conversion-focused website, hospice-specific CRM, and custom iOS field experience.",
        outcome: "One coordinated system from first digital touch through referral follow-up and field execution, with shared data and leadership visibility.",
        includes: ["Platform architecture and phased product roadmap", "Custom website, CRM, iOS app, APIs, and role-based security", "Data migration, integrations, quality assurance, deployment, and adoption program"],
      },
    ],
  },
];

const decisionSignals = [
  {
    icon: Crosshair,
    title: "The team is busy, but growth is flat",
    body: "We diagnose whether the constraint is targeting, conversation quality, follow-through, or leadership cadence.",
  },
  {
    icon: Target,
    title: "Performance changes by territory",
    body: "We turn isolated wins into one standard that can travel across representatives, branches, and markets.",
  },
  {
    icon: BarChart3,
    title: "Managers only see the final number",
    body: "We give leaders a practical way to coach the behaviors that create the number before the month is over.",
  },
];

const process = [
  ["01", "Diagnose", "Find the real growth constraint across strategy, leadership, and field behavior."],
  ["02", "Design", "Build the engagement around your market, team, operating reality, and goals."],
  ["03", "Install", "Put the language, routines, tools, and expectations into the actual work."],
  ["04", "Sustain", "Coach until leaders can reinforce the standard without outside dependence."],
];

export default function Services() {
  const trackCta = (label: string) => {
    trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, `services:${label}`);
  };

  return (
    <PersuasionShell>
      <SEO
        title="Hospice Growth Consulting | Spartan Coaching"
        description="Hospice-specific field coaching, team training, leadership development, and growth systems built around real execution."
      />
      <BackButton />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8" data-testid="page-services">
        <section className="grid gap-10 pb-14 pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.65fr)] lg:items-end lg:pb-24">
          <div>
            <p className="home-photo-kicker text-[#d61f26] border-[#d61f26] mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-[#d61f26]" aria-hidden="true" />
                Hospice growth consulting
              </p>
            <h1 className="max-w-4xl font-display text-[clamp(3.5rem,8vw,7.4rem)] font-black uppercase leading-[0.88] tracking-[-0.04em] text-[#11131d]" data-testid="text-services-title">
              Turn growth pressure into <span className="text-[#d61f26]">field execution.</span>
            </h1>
          </div>
          <div className="border-l border-[#d61f26]/30 pl-8 lg:mb-2">
            <p className="text-[1.1rem] leading-[1.65] text-[#11131d]/85">
              This is not a menu of disconnected services. We find the constraint, build the right engagement, and stay close enough to make the new behavior stick.
            </p>
            <Link
              href="/contact?service=Consulting"
              onClick={() => trackCta("hero_strategy_call")}
              className="mt-8 home-photo-button home-photo-button-primary"
            >
              Request a strategy call <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>

        <section className="py-20 border-t border-[#11131d]/10" aria-labelledby="consulting-fit-title">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:gap-24">
            <div>
              <p className="home-photo-kicker text-[#d61f26] border-[#d61f26]">Start with the pressure</p>
              <h2 id="consulting-fit-title" className="mt-6 max-w-xl font-display text-[clamp(3rem,6vw,5.5rem)] font-black uppercase leading-[0.9] tracking-[-0.05em] text-[#11131d]">
                Where is growth getting <span className="text-[#d61f26]">stuck?</span>
              </h2>
              <p className="mt-8 max-w-lg text-[1.1rem] leading-[1.6] text-[#11131d]/85">
                The right engagement is determined by the breakdown, not by forcing you into a prebuilt package.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 bg-white shadow-xl">
              {decisionSignals.map(({ icon: Icon, title, body }) => (
                <article key={title} className="flex flex-col min-h-[300px] border-b border-r border-[#11131d]/10 p-8 hover:bg-neutral-50 transition-colors">
                  <Icon className="h-7 w-7 text-[#d61f26]" strokeWidth={1.8} aria-hidden />
                  <h3 className="mt-10 font-display text-[1.25rem] font-black uppercase leading-[1.1] tracking-tight text-[#11131d]">{title}</h3>
              <p className="mt-4 flex-1 text-[1rem] leading-[1.65] text-[#11131d]/95">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f5f3ef] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-20 lg:py-24 border-y border-[#11131d]/10" data-testid="section-engagement-guide">
          <div className="mb-16 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="home-photo-kicker text-[#d61f26] border-[#d61f26]">Three ways to engage</p>
              <h2 className="mt-6 max-w-4xl font-display text-[clamp(3rem,6vw,5.5rem)] font-black uppercase leading-[0.9] tracking-[-0.05em] text-[#11131d]">
                The right level of support. <span className="text-[#d61f26]">No catalog maze.</span>
              </h2>
            </div>
            <p className="max-w-md text-[1.05rem] leading-[1.65] text-[#11131d]/85 lg:mb-2">
              Scope and investment are confirmed only after we understand the problem, the people involved, and what success must look like.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {engagements.map((engagement) => {
              const Icon = engagement.icon;
              return (
                <article key={engagement.id} id={engagement.id} className="flex min-h-full flex-col border border-[#11131d]/10 bg-white p-8 sm:p-10 shadow-xl" data-testid={`card-consulting-${engagement.number}`}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-[0.8rem] font-bold tracking-[.18em] text-[#d61f26]">{engagement.number}</span>
                    <Icon className="h-8 w-8 text-[#d61f26]" strokeWidth={1.5} aria-hidden />
                  </div>
                    <p className="mt-12 font-mono text-[.76rem] font-bold uppercase tracking-[.13em] text-[#d61f26]">{engagement.eyebrow}</p>
                  <h3 className="mt-4 font-display text-[1.8rem] font-black uppercase leading-[1.05] tracking-tight text-[#11131d]">{engagement.title}</h3>

                  <dl className="mt-8 space-y-6 flex-1">
                    <div>
                      <dt className="font-mono text-[.66rem] font-bold uppercase tracking-[.14em] text-[#11131d]/65">Best fit</dt>
                      <dd className="mt-2 text-[0.95rem] leading-[1.6] text-[#11131d]/95">{engagement.fit}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[.66rem] font-bold uppercase tracking-[.14em] text-[#11131d]/65">How it works</dt>
                      <dd className="mt-2 text-[0.95rem] leading-[1.6] text-[#11131d]/95">{engagement.format}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[.66rem] font-bold uppercase tracking-[.14em] text-[#11131d]/65">What changes</dt>
                      <dd className="mt-2 text-[0.95rem] leading-[1.6] text-[#11131d]/95">{engagement.outcome}</dd>
                    </div>
                  </dl>

                  <ul className="mt-8 space-y-3 border-t border-[#11131d]/10 pt-8">
                    {engagement.includes.map((item) => (
                      <li key={item} className="flex gap-3 text-[0.95rem] leading-[1.65] text-[#11131d]/90">
                        <Check className="mt-[2px] h-4 w-4 shrink-0 text-[#d61f26]" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/contact?service=${encodeURIComponent(engagement.title)}`}
                    onClick={() => trackCta(engagement.id)}
                    className="mt-10 home-photo-button home-photo-button-outline w-full justify-between"
                  >
                    Discuss this engagement <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="py-20 lg:py-28" aria-labelledby="complete-services-title" data-testid="section-complete-services">
          <div className="max-w-4xl">
            <p className="home-photo-kicker text-[#d61f26] border-[#d61f26]">Complete consulting catalog</p>
            <h2 id="complete-services-title" className="mt-6 font-display text-[clamp(3rem,6vw,5.5rem)] font-black uppercase leading-[0.9] tracking-[-0.05em] text-[#11131d]">
              Every service is still <span className="text-[#d61f26]">available.</span>
            </h2>
            <p className="mt-8 max-w-3xl text-[1.1rem] leading-[1.7] text-[#11131d]/90">
              The three engagement paths above help identify the right level of support. The complete individual, leadership, corporate, and technology service catalog is listed below.
            </p>
          </div>

          <div className="mt-14 space-y-6">
            {consultingServiceGroups.map((group) => (
              <Accordion key={group.id} type="single" collapsible defaultValue={group.id}>
                <AccordionItem value={group.id} className="border border-[#11131d]/12 bg-white px-6 shadow-sm sm:px-8">
                  <AccordionTrigger className="py-7 text-left hover:no-underline">
                    <span>
                      <span className="block font-mono text-[0.72rem] font-bold uppercase tracking-[.15em] text-[#d61f26]">{group.eyebrow}</span>
                      <span className="mt-2 block font-display text-[1.65rem] font-black uppercase leading-tight text-[#11131d]">{group.title}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-8">
                    <p className="max-w-3xl text-[1rem] leading-[1.65] text-[#11131d]/85">{group.description}</p>
                    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {group.services.map((service) => (
                        <article key={service.title} className="flex h-full flex-col border border-[#11131d]/10 bg-[#f5f3ef] p-6" data-testid={`service-${service.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[.12em] text-[#d61f26]">{service.duration}</p>
                            {service.label && (
                              <span className="border border-[#d61f26] bg-[#d61f26] px-2.5 py-1 font-mono text-[0.62rem] font-black uppercase tracking-[.16em] text-white">
                                {service.label}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-4 font-display text-[1.35rem] font-black uppercase leading-[1.08] text-[#11131d]">{service.title}</h3>
                          {service.bestFor && (
                            <div className="mt-5 border-l-2 border-[#d61f26] pl-4">
                              <p className="font-mono text-[0.64rem] font-bold uppercase tracking-[.13em] text-[#11131d]/65">Best for</p>
                              <p className="mt-2 text-[0.9rem] leading-[1.55] text-[#11131d]/90">{service.bestFor}</p>
                            </div>
                          )}
                          <p className="mt-5 text-[0.96rem] leading-[1.65] text-[#11131d]/90">{service.description}</p>
                          {service.outcome && (
                            <div className="mt-5 bg-white/80 p-4">
                              <p className="font-mono text-[0.64rem] font-bold uppercase tracking-[.13em] text-[#d61f26]">What changes</p>
                              <p className="mt-2 text-[0.9rem] font-medium leading-[1.55] text-[#11131d]/82">{service.outcome}</p>
                            </div>
                          )}
                          <ul className="mt-6 space-y-2 border-t border-[#11131d]/10 pt-5">
                            {service.includes.map((item) => (
                              <li key={item} className="flex gap-2 text-[0.9rem] leading-[1.5] text-[#11131d]/90">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d61f26]" aria-hidden />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                          <Link
                            href={`/contact?service=${encodeURIComponent(service.title)}`}
                            onClick={() => trackCta(`catalog_${group.id}_${service.title}`)}
                            className="mt-7 inline-flex min-h-11 items-center gap-2 font-bold text-[#d61f26] hover:text-[#11131d]"
                          >
                            Discuss this service <ArrowRight className="h-4 w-4" aria-hidden />
                          </Link>
                        </article>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-5 border-l-4 border-[#d61f26] bg-[#f5f3ef] p-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-[1.45rem] font-black uppercase text-[#11131d]">Looking for the provider programs?</h3>
              <p className="mt-2 text-[0.98rem] leading-relaxed text-[#11131d]/85">The full implementation-program catalog remains available on the Programs page.</p>
            </div>
            <Link href="/programs" className="home-photo-button home-photo-button-outline shrink-0">
              View all programs <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>

        <section id="spartan-method" className="public-dark-surface -mx-4 bg-black px-4 py-20 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-16 lg:py-28" data-testid="section-services-method">
          <div className="grid gap-12 border-b border-white/15 pb-14 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:gap-24">
            <div>
              <p className="home-photo-kicker !text-[#f23a41]">The Spartan method · consulting standard</p>
              <h2 className="mt-6 max-w-5xl font-display text-[clamp(3.2rem,6vw,6.5rem)] font-black uppercase leading-[0.88] tracking-[-0.055em] text-white">
                We do not deliver training. We install <span className="text-[#d61f26]">performance.</span>
              </h2>
            </div>
            <div className="border-l border-[#d61f26] pl-6 lg:mb-2">
              <p className="text-[1.1rem] leading-[1.7] text-white/95">
                Every engagement follows one disciplined operating sequence. It turns pressure into a clear diagnosis, a field-ready standard, and leadership behavior that lasts after the engagement ends.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 font-mono text-[0.75rem] font-bold uppercase tracking-[0.12em] text-white/85">
                <span>Hospice-specific</span>
                <span>Field-tested</span>
                <span>Leader-coachable</span>
              </div>
            </div>
          </div>

          <ol className="grid border-b border-white/15 lg:grid-cols-4">
            {process.map(([number, title, body]) => (
              <li key={number} className="group relative min-h-[310px] border-t border-white/15 px-0 py-9 transition-colors hover:bg-white/[0.035] lg:border-l lg:border-t-0 lg:px-8 first:lg:border-l-0 first:lg:pl-0 last:lg:pr-0">
                <span className="font-display text-[4.7rem] font-black leading-none tracking-[-0.08em] text-[#f23a41] transition-colors group-hover:text-white">{number}</span>
                <div className="mt-10 h-px w-10 bg-[#d61f26]" aria-hidden="true" />
                <h3 className="mt-6 font-display text-[1.55rem] font-black uppercase leading-tight text-white">{title}</h3>
                <p className="mt-4 text-[1rem] leading-[1.7] text-white/82">{body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <p className="max-w-2xl text-[1rem] font-medium leading-relaxed text-white/95">
              The standard is visible, repeatable, and coachable — so progress does not depend on charisma, memory, or another one-time event.
            </p>
            <Link href="/method" className="home-photo-button home-photo-dark-button shrink-0">
              Explore the full method <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>

        <section className="public-dark-surface bg-black text-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-16 py-20 lg:py-28 lg:grid lg:grid-cols-[1fr_auto] lg:items-end gap-12" data-testid="section-services-closing">
          <div>
            <p className="font-mono text-[.75rem] font-bold uppercase tracking-[.18em] text-[#f23a41]">The first conversation</p>
            <h2 className="mt-6 max-w-5xl font-display text-[clamp(3.5rem,7vw,7rem)] font-black uppercase leading-[0.88] tracking-[-0.04em]">
              We will tell you what we see. Even if the answer is <span className="text-[#d61f26]">not us.</span>
            </h2>
            <p className="mt-8 max-w-3xl text-[1.2rem] leading-[1.6] text-white/95">
              Bring the pressure, the number, and the part that keeps breaking. You will leave with a clearer view of the problem and the next move.
            </p>
          </div>
          <Link
            href="/contact?service=Consulting"
            onClick={() => trackCta("closing_strategy_call")}
            className="home-photo-button home-photo-button-primary bg-[#d61f26] border-[#d61f26] mt-10 lg:mt-0"
            data-testid="button-services-contact"
          >
            Request a strategy call <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>

        <section className="grid gap-12 py-20 lg:py-32 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
          <div>
            <div className="flex h-14 w-14 items-center justify-center border border-[#d61f26]/20 bg-[#d61f26]/5 rounded-sm">
              <ClipboardCheck className="h-6 w-6 text-[#d61f26]" aria-hidden />
            </div>
            <h2 className="mt-8 font-display text-[2.5rem] font-black uppercase tracking-tight leading-[1.05] text-[#11131d]">Questions before the call?</h2>
            <p className="mt-6 max-w-md text-[1.05rem] leading-[1.65] text-[#11131d]/85">
              The call is a working conversation, not a sales ambush. These are the questions leaders usually ask first.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="length" className="border-b border-[#11131d]/10 py-2">
              <AccordionTrigger className="text-left font-bold text-[#11131d] text-lg hover:text-[#d61f26]">How long is an engagement?</AccordionTrigger>
              <AccordionContent className="text-[1rem] leading-[1.65] text-[#11131d]/85 pt-2 pb-6">Focused work can be completed in a single session or field day. Team and leadership engagements usually run from 30 days to several months, depending on the constraint and the reinforcement required.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="investment" className="border-b border-[#11131d]/10 py-2">
              <AccordionTrigger className="text-left font-bold text-[#11131d] text-lg hover:text-[#d61f26]">Why is pricing customized?</AccordionTrigger>
              <AccordionContent className="text-[1rem] leading-[1.65] text-[#11131d]/85 pt-2 pb-6">A field ride-along, a leadership operating system, and a multi-market growth partnership are materially different engagements. Scope, travel, team size, and deliverables are confirmed before any commitment.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="fit" className="border-b border-[#11131d]/10 py-2">
              <AccordionTrigger className="text-left font-bold text-[#11131d] text-lg hover:text-[#d61f26]">What if consulting is not the right fit?</AccordionTrigger>
              <AccordionContent className="text-[1rem] leading-[1.65] text-[#11131d]/85 pt-2 pb-6">You will be told directly. If the problem is staffing capacity, clinical operations, or something another expert should own, the call will not be used to force a consulting proposal.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="compliance" className="border-b border-[#11131d]/10 py-2">
              <AccordionTrigger className="text-left font-bold text-[#11131d] text-lg hover:text-[#d61f26]">How is sensitive information handled?</AccordionTrigger>
              <AccordionContent className="text-[1rem] leading-[1.65] text-[#11131d]/85 pt-2 pb-6">Discovery does not require patient information. No PHI should be submitted through the website. A BAA can be discussed when an organizational engagement requires it.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

      </div>
    </PersuasionShell>
  );
}
