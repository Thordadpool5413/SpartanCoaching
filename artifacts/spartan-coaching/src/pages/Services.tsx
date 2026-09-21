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
        <section className="grid gap-10 border-b border-border pb-14 pt-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.65fr)] lg:items-end lg:pb-20">
          <div>
            <p className="text-kicker mb-5">Hospice growth consulting</p>
            <h1 className="max-w-4xl font-display text-[clamp(3.4rem,7vw,7.4rem)] font-black uppercase leading-[.88] tracking-[-.06em] text-foreground" data-testid="text-services-title">
              Turn growth pressure into <span className="text-primary">field execution.</span>
            </h1>
          </div>
          <div className="border-l-2 border-primary pl-6 lg:mb-1">
            <p className="text-lg leading-8 text-muted-foreground">
              This is not a menu of disconnected services. We find the constraint, build the right engagement, and stay close enough to make the new behavior stick.
            </p>
            <Link
              href="/contact?service=Consulting"
              onClick={() => trackCta("hero_strategy_call")}
              className="mt-7 inline-flex min-h-12 items-center gap-3 bg-primary px-6 font-mono text-xs font-bold uppercase tracking-[.12em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Request a strategy call <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>

        <section className="py-16 sm:py-20" aria-labelledby="consulting-fit-title">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="text-kicker">Start with the pressure</p>
              <h2 id="consulting-fit-title" className="mt-5 max-w-xl font-display text-[clamp(2.8rem,5vw,5.25rem)] font-black uppercase leading-[.9] tracking-[-.055em] text-foreground">
                Where is growth getting <span className="text-primary">stuck?</span>
              </h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
                The right engagement is determined by the breakdown, not by forcing you into a prebuilt package.
              </p>
            </div>
            <div className="grid border-l border-t border-border sm:grid-cols-3">
              {decisionSignals.map(({ icon: Icon, title, body }) => (
                <article key={title} className="min-h-64 border-b border-r border-border p-6 sm:p-7">
                  <Icon className="h-6 w-6 text-primary" strokeWidth={1.8} aria-hidden />
                  <h3 className="mt-10 font-display text-xl font-black uppercase leading-tight tracking-tight text-foreground">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/20 px-0 py-16 sm:py-20" data-testid="section-engagement-guide">
          <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-kicker">Three ways to engage</p>
              <h2 className="mt-5 max-w-4xl font-display text-[clamp(2.8rem,5vw,5.4rem)] font-black uppercase leading-[.9] tracking-[-.055em] text-foreground">
                The right level of support. <span className="text-primary">No catalog maze.</span>
              </h2>
            </div>
            <p className="max-w-md text-base leading-7 text-muted-foreground">
              Scope and investment are confirmed only after we understand the problem, the people involved, and what success must look like.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {engagements.map((engagement) => {
              const Icon = engagement.icon;
              return (
                <article key={engagement.id} id={engagement.id} className="flex min-h-full flex-col border border-border bg-background p-7 shadow-sm sm:p-8" data-testid={`card-consulting-${engagement.number}`}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-xs font-bold tracking-[.18em] text-primary">{engagement.number}</span>
                    <Icon className="h-7 w-7 text-primary" strokeWidth={1.7} aria-hidden />
                  </div>
                  <p className="mt-10 font-mono text-[.68rem] font-bold uppercase tracking-[.16em] text-primary">{engagement.eyebrow}</p>
                  <h3 className="mt-3 font-display text-3xl font-black uppercase leading-[.98] tracking-[-.04em] text-foreground">{engagement.title}</h3>

                  <dl className="mt-7 space-y-5">
                    <div>
                      <dt className="font-mono text-[.66rem] font-bold uppercase tracking-[.14em] text-muted-foreground">Best fit</dt>
                      <dd className="mt-2 text-sm leading-6 text-foreground">{engagement.fit}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[.66rem] font-bold uppercase tracking-[.14em] text-muted-foreground">How it works</dt>
                      <dd className="mt-2 text-sm leading-6 text-foreground">{engagement.format}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[.66rem] font-bold uppercase tracking-[.14em] text-muted-foreground">What changes</dt>
                      <dd className="mt-2 text-sm leading-6 text-foreground">{engagement.outcome}</dd>
                    </div>
                  </dl>

                  <ul className="mt-7 space-y-3 border-t border-border pt-6">
                    {engagement.includes.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/contact?service=${encodeURIComponent(engagement.title)}`}
                    onClick={() => trackCta(engagement.id)}
                    className="mt-8 inline-flex min-h-12 items-center justify-between border border-foreground px-5 font-mono text-[.7rem] font-bold uppercase tracking-[.12em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                  >
                    Discuss this engagement <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="text-kicker">The Spartan method</p>
              <h2 className="mt-5 font-display text-[clamp(2.8rem,5vw,5.3rem)] font-black uppercase leading-[.9] tracking-[-.055em] text-foreground">
                Diagnose. Design. Install. <span className="text-primary">Sustain.</span>
              </h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
                Training is an event. Change is an operating rhythm. Every engagement is built to leave the organization stronger after the work ends.
              </p>
            </div>
            <ol className="border-t border-foreground">
              {process.map(([number, title, body]) => (
                <li key={number} className="grid gap-3 border-b border-border py-7 sm:grid-cols-[64px_180px_1fr] sm:items-start">
                  <span className="font-mono text-xs font-bold tracking-[.16em] text-primary">{number}</span>
                  <h3 className="font-display text-xl font-black uppercase text-foreground">{title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="grid gap-8 bg-[#0b0d14] px-7 py-12 text-white sm:px-10 lg:grid-cols-[1fr_auto] lg:items-end lg:px-14 lg:py-16">
          <div>
            <p className="font-mono text-[.68rem] font-bold uppercase tracking-[.18em] text-[#ee3439]">The first conversation</p>
            <h2 className="mt-5 max-w-4xl font-display text-[clamp(3rem,6vw,6.6rem)] font-black uppercase leading-[.86] tracking-[-.06em]">
              We will tell you what we see. Even if the answer is <span className="text-[#ee3439]">not us.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/65">
              Bring the pressure, the number, and the part that keeps breaking. You will leave with a clearer view of the problem and the next move.
            </p>
          </div>
          <Link
            href="/contact?service=Consulting"
            onClick={() => trackCta("closing_strategy_call")}
            className="inline-flex min-h-12 items-center justify-center gap-3 bg-[#d51f26] px-7 font-mono text-xs font-bold uppercase tracking-[.12em] text-white transition-colors hover:bg-white hover:text-black"
            data-testid="button-services-contact"
          >
            Request a strategy call <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>

        <section className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <div className="flex h-11 w-11 items-center justify-center border border-primary/30 bg-primary/5">
              <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <h2 className="mt-6 font-display text-4xl font-black uppercase tracking-[-.04em] text-foreground">Questions before the call?</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              The call is a working conversation, not a sales ambush. These are the questions leaders usually ask first.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="length">
              <AccordionTrigger className="text-left font-semibold text-foreground">How long is an engagement?</AccordionTrigger>
              <AccordionContent className="leading-7 text-muted-foreground">Focused work can be completed in a single session or field day. Team and leadership engagements usually run from 30 days to several months, depending on the constraint and the reinforcement required.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="investment">
              <AccordionTrigger className="text-left font-semibold text-foreground">Why is pricing customized?</AccordionTrigger>
              <AccordionContent className="leading-7 text-muted-foreground">A field ride-along, a leadership operating system, and a multi-market growth partnership are materially different engagements. Scope, travel, team size, and deliverables are confirmed before any commitment.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="fit">
              <AccordionTrigger className="text-left font-semibold text-foreground">What if consulting is not the right fit?</AccordionTrigger>
              <AccordionContent className="leading-7 text-muted-foreground">You will be told directly. If the problem is staffing capacity, clinical operations, or something another expert should own, the call will not be used to force a consulting proposal.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="compliance">
              <AccordionTrigger className="text-left font-semibold text-foreground">How is sensitive information handled?</AccordionTrigger>
              <AccordionContent className="leading-7 text-muted-foreground">Discovery does not require patient information. No PHI should be submitted through the website. A BAA can be discussed when an organizational engagement requires it.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

      </div>
    </PersuasionShell>
  );
}
