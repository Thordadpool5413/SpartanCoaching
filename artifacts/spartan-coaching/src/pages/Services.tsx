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
            <p className="text-[1.1rem] leading-[1.65] text-[#11131d]/70">
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
              <p className="mt-8 max-w-lg text-[1.1rem] leading-[1.6] text-[#11131d]/70">
                The right engagement is determined by the breakdown, not by forcing you into a prebuilt package.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 bg-white shadow-xl">
              {decisionSignals.map(({ icon: Icon, title, body }) => (
                <article key={title} className="flex flex-col min-h-[300px] border-b border-r border-[#11131d]/10 p-8 hover:bg-neutral-50 transition-colors">
                  <Icon className="h-7 w-7 text-[#d61f26]" strokeWidth={1.8} aria-hidden />
                  <h3 className="mt-10 font-display text-[1.25rem] font-black uppercase leading-[1.1] tracking-tight text-[#11131d]">{title}</h3>
                  <p className="mt-4 text-[0.95rem] leading-[1.6] text-[#11131d]/70 flex-1">{body}</p>
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
            <p className="max-w-md text-[1.05rem] leading-[1.65] text-[#11131d]/70 lg:mb-2">
              Scope and investment are confirmed only after we understand the problem, the people involved, and what success must look like.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {engagements.map((engagement) => {
              const Icon = engagement.icon;
              return (
                <article key={engagement.id} id={engagement.id} className="flex min-h-full flex-col border border-[#11131d]/10 bg-white p-8 sm:p-10 shadow-xl" data-testid={`card-consulting-${engagement.number}`}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-xs font-bold tracking-[.18em] text-[#d61f26]">{engagement.number}</span>
                    <Icon className="h-8 w-8 text-[#d61f26]" strokeWidth={1.5} aria-hidden />
                  </div>
                  <p className="mt-12 font-mono text-[.68rem] font-bold uppercase tracking-[.16em] text-[#d61f26]">{engagement.eyebrow}</p>
                  <h3 className="mt-4 font-display text-[1.8rem] font-black uppercase leading-[1.05] tracking-tight text-[#11131d]">{engagement.title}</h3>

                  <dl className="mt-8 space-y-6 flex-1">
                    <div>
                      <dt className="font-mono text-[.66rem] font-bold uppercase tracking-[.14em] text-[#11131d]/50">Best fit</dt>
                      <dd className="mt-2 text-[0.95rem] leading-[1.6] text-[#11131d]/80">{engagement.fit}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[.66rem] font-bold uppercase tracking-[.14em] text-[#11131d]/50">How it works</dt>
                      <dd className="mt-2 text-[0.95rem] leading-[1.6] text-[#11131d]/80">{engagement.format}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[.66rem] font-bold uppercase tracking-[.14em] text-[#11131d]/50">What changes</dt>
                      <dd className="mt-2 text-[0.95rem] leading-[1.6] text-[#11131d]/80">{engagement.outcome}</dd>
                    </div>
                  </dl>

                  <ul className="mt-8 space-y-3 border-t border-[#11131d]/10 pt-8">
                    {engagement.includes.map((item) => (
                      <li key={item} className="flex gap-3 text-[0.9rem] leading-[1.6] text-[#11131d]/70">
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

        <section id="spartan-method" className="public-dark-surface -mx-4 bg-black px-4 py-20 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-16 lg:py-28" data-testid="section-services-method">
          <div className="grid gap-12 border-b border-white/15 pb-14 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:gap-24">
            <div>
              <p className="home-photo-kicker !text-[#f23a41]">The Spartan method · consulting standard</p>
              <h2 className="mt-6 max-w-5xl font-display text-[clamp(3.2rem,6vw,6.5rem)] font-black uppercase leading-[0.88] tracking-[-0.055em] text-white">
                We do not deliver training. We install <span className="text-[#d61f26]">performance.</span>
              </h2>
            </div>
            <div className="border-l border-[#d61f26] pl-6 lg:mb-2">
              <p className="text-[1.1rem] leading-[1.7] text-white/72">
                Every engagement follows one disciplined operating sequence. It turns pressure into a clear diagnosis, a field-ready standard, and leadership behavior that lasts after the engagement ends.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 font-mono text-[0.63rem] font-bold uppercase tracking-[0.14em] text-white/45">
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
                <p className="mt-4 text-[0.98rem] leading-[1.7] text-white/62">{body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <p className="max-w-2xl text-[1rem] font-medium leading-relaxed text-white/72">
              The standard is visible, repeatable, and coachable — so progress does not depend on charisma, memory, or another one-time event.
            </p>
            <Link href="/method" className="home-photo-button home-photo-dark-button shrink-0">
              Explore the full method <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>

        <section className="public-dark-surface bg-black text-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-16 py-20 lg:py-28 lg:grid lg:grid-cols-[1fr_auto] lg:items-end gap-12">
          <div>
            <p className="font-mono text-[.75rem] font-bold uppercase tracking-[.18em] text-[#f23a41]">The first conversation</p>
            <h2 className="mt-6 max-w-5xl font-display text-[clamp(3.5rem,7vw,7rem)] font-black uppercase leading-[0.88] tracking-[-0.04em]">
              We will tell you what we see. Even if the answer is <span className="text-[#d61f26]">not us.</span>
            </h2>
            <p className="mt-8 max-w-3xl text-[1.2rem] leading-[1.6] text-white/70">
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
            <p className="mt-6 max-w-md text-[1.05rem] leading-[1.65] text-[#11131d]/70">
              The call is a working conversation, not a sales ambush. These are the questions leaders usually ask first.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="length" className="border-b border-[#11131d]/10 py-2">
              <AccordionTrigger className="text-left font-bold text-[#11131d] text-lg hover:text-[#d61f26]">How long is an engagement?</AccordionTrigger>
              <AccordionContent className="text-[1rem] leading-[1.65] text-[#11131d]/70 pt-2 pb-6">Focused work can be completed in a single session or field day. Team and leadership engagements usually run from 30 days to several months, depending on the constraint and the reinforcement required.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="investment" className="border-b border-[#11131d]/10 py-2">
              <AccordionTrigger className="text-left font-bold text-[#11131d] text-lg hover:text-[#d61f26]">Why is pricing customized?</AccordionTrigger>
              <AccordionContent className="text-[1rem] leading-[1.65] text-[#11131d]/70 pt-2 pb-6">A field ride-along, a leadership operating system, and a multi-market growth partnership are materially different engagements. Scope, travel, team size, and deliverables are confirmed before any commitment.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="fit" className="border-b border-[#11131d]/10 py-2">
              <AccordionTrigger className="text-left font-bold text-[#11131d] text-lg hover:text-[#d61f26]">What if consulting is not the right fit?</AccordionTrigger>
              <AccordionContent className="text-[1rem] leading-[1.65] text-[#11131d]/70 pt-2 pb-6">You will be told directly. If the problem is staffing capacity, clinical operations, or something another expert should own, the call will not be used to force a consulting proposal.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="compliance" className="border-b border-[#11131d]/10 py-2">
              <AccordionTrigger className="text-left font-bold text-[#11131d] text-lg hover:text-[#d61f26]">How is sensitive information handled?</AccordionTrigger>
              <AccordionContent className="text-[1rem] leading-[1.65] text-[#11131d]/70 pt-2 pb-6">Discovery does not require patient information. No PHI should be submitted through the website. A BAA can be discussed when an organizational engagement requires it.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

      </div>
    </PersuasionShell>
  );
}
