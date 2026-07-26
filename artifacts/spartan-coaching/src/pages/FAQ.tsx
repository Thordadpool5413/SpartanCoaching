import { useEffect, useMemo, useState } from "react";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { PersuasionShell } from "@/components/PersuasionShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = [
  {
    title: "Coaching and process",
    questions: [
      {
        id: "what-is-spartan",
        q: "What is Spartan Coaching?",
        a: "Spartan Coaching is a practical consulting practice for hospice growth professionals. We help liaisons, business development reps, and growth leaders build consistent referral relationships and execute territory strategy with discipline, ethical messaging, and measurable weekly accountability. Coaching is human-first. The Field Kit is the private execution layer — preview free, individuals subscribe for $14.99/week, teams under contract.",
      },
      {
        id: "who-is-this-for",
        q: "Who is this for?",
        a: "Hospice liaisons, business development reps, directors of growth, VPs, and owners who want a repeatable field system — not generic sales motivation. Individual reps and multi-seat teams both fit.",
      },
      {
        id: "how-does-coaching-work",
        q: "How does coaching work?",
        a: "It starts with an honest conversation about your market, team, and gaps. Engagements can include 1:1 coaching, leadership rhythms, field ridealongs, workshops, and scorecard accountability. Scope is custom — we design around what will actually change Tuesday behavior.",
      },
      {
        id: "what-makes-different",
        q: "What makes this different from other sales training?",
        a: "Most sales training is generic or motivational. Spartan is hospice-specific, compliance-aware, and built around weekly execution. We focus on what you do on Tuesday afternoon when the clinic is short-staffed — not what sounds good in a conference room.",
      },
    ],
  },
  {
    title: "Field Kit access",
    questions: [
      {
        id: "what-is-field-kit",
        q: "What is the Field Kit?",
        a: "The Field Kit is a private set of AI-assisted tools for hospice growth work: objections, playbooks, role-play, calculators, weekly plans, Sales Command Center, and more. You can preview tool interfaces free. Live generation and saves unlock with membership ($14.99/week individual) or team/evaluation access.",
      },
      {
        id: "how-to-get-access",
        q: "How do I get Field Kit access?",
        a: "Individuals: create an account, then subscribe for $14.99/week from Account (cancel anytime). You can preview tools before paying. Teams and arranged evaluations: request access or book a strategy call — Nick sets seats under contract or a timed evaluation when appropriate.",
      },
      {
        id: "trial-hours",
        q: "Is there a free evaluation trial?",
        a: "Self-serve individual accounts subscribe to unlock live tools (you can still preview the UI free). Timed evaluation windows are arranged when you request team access or Nick approves an evaluation path — typically 24 hours for individuals and 72 hours for company teams when used.",
      },
      {
        id: "tools-without-coaching",
        q: "Can I use the tools without a coaching engagement?",
        a: "Yes. Individuals can subscribe to Field Kit only for $14.99/week without buying coaching. Many clients also add coaching; teams and enterprise packages combine seats with leadership work under contract.",
      },
      {
        id: "already-have-account",
        q: "I already have an account. How do I sign in?",
        a: "Use Client Login with your email. You can also request a magic sign-in link from the login page. If access expired, sign in and use Subscribe ($14.99/week) on Account, request an extension for evaluation orgs, or book a strategy call for team contracts.",
      },
      {
        id: "company-seats",
        q: "How do company seats work?",
        a: "Company access creates an organization with a seat limit. Seats are billed weekly per end user at a rate set under your contract. An org admin can invite teammates up to the seat limit. Leaders can see seat usage. Enterprise packages can bundle seats with leadership coaching and workshops.",
      },
      {
        id: "cancel-subscription",
        q: "How do I cancel individual membership?",
        a: "Sign in → Account → Manage billing / cancel. You cancel yourself in the secure billing portal. Access continues until the end of the week you already paid for (cancel at period end). Provider contracts follow the terms you signed with Spartan Coaching.",
      },
    ],
  },
  {
    title: "Compliance and privacy",
    questions: [
      {
        id: "compliance",
        q: "How do you handle compliance?",
        a: "Coaching focuses on ethical relationship building and education, not inducements. We do not train aggressive tactics, misleading messaging, or shortcuts around eligibility criteria. All messaging respects hospice regulations and clinical workflow.",
      },
      {
        id: "patient-data",
        q: "Is patient data safe? Do you store PHI?",
        a: "No. Field Kit tools are for planning and messaging workflows — not clinical documentation. Do not enter patient names, MRNs, diagnoses, or other PHI. We do not use your tool inputs to train public models. See Compliance & Data Practices and the Privacy Policy for detail. Corporate accounts can request a BAA path for procurement.",
      },
      {
        id: "guarantee-results",
        q: "Do you guarantee results?",
        a: "No. Spartan Coaching does not guarantee admissions, referrals, or census growth. Results depend on execution, market conditions, and organizational commitment. What we guarantee is a structured process, ethical boundaries, and honest coaching.",
      },
    ],
  },
  {
    title: "Pricing and getting started",
    questions: [
      {
        id: "how-to-start",
        q: "How do I get started?",
        a: "Two paths: (1) Request Field Kit evaluation access if you want to test the tools first, or (2) Book a strategy call if you want coaching, team systems, or enterprise scope. Individuals who finish evaluation can subscribe for $14.99/week from Account.",
      },
      {
        id: "cost",
        q: "How much does it cost?",
        a: "Individual Field Kit membership is $14.99 per week (auto-renew; cancel anytime from Account). Provider and team seats use weekly per-user pricing set under your contract. Enterprise + coaching is engagement-based. See Membership for details.",
      },
      {
        id: "virtual-or-inperson",
        q: "Are sessions virtual or in-person?",
        a: "Most coaching sessions are virtual. For team training and organizational consulting, we offer virtual and on-site options depending on your needs and market.",
      },
      {
        id: "what-after-trial",
        q: "What happens when my evaluation ends?",
        a: "Tool access pauses when the window ends. Individuals can subscribe for $14.99/week from Account (or the lock screen) and cancel anytime. Teams book a debrief or request contract activation for seats. You can also request an extension if you still need evaluation time.",
      },
    ],
  },
];

export default function FAQ() {
  const allIds = useMemo(
    () => faqCategories.flatMap((c) => c.questions.map((q) => q.id)),
    [],
  );
  const [openItems, setOpenItems] = useState<string[]>([]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && allIds.includes(hash)) {
      setOpenItems((prev) => (prev.includes(hash) ? prev : [...prev, hash]));
      // Allow layout to paint, then scroll to the item
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [allIds]);

  return (
    <PersuasionShell>
      <SEO />
      <BackButton />

      <FadeIn>
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <h1 className="text-h1 text-foreground mb-6" data-testid="text-faq-title">
            Frequently Asked Questions
          </h1>
          <p className="text-body-lg text-muted-foreground leading-relaxed">
            Coaching, Field Kit access, evaluation trials, individual $14.99/week membership, team contracts, and compliance.
          </p>
        </div>
      </FadeIn>

      <StaggerContainer className="space-y-12 max-w-4xl mx-auto">
        {faqCategories.map((category) => (
          <StaggerItem key={category.title}>
            <h2
              className="text-h2 text-foreground mb-4"
              data-testid={`text-category-${category.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {category.title}
            </h2>
            <Accordion
              type="multiple"
              className="space-y-2"
              value={openItems.filter((id) => category.questions.some((q) => q.id === id))}
              onValueChange={(vals) => {
                const categoryIds = category.questions.map((q) => q.id);
                setOpenItems((prev) => {
                  const outside = prev.filter((id) => !categoryIds.includes(id));
                  return [...outside, ...vals];
                });
              }}
            >
              {category.questions.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  id={item.id}
                  className="scroll-mt-28"
                  data-testid={`accordion-item-${item.id}`}
                >
                  <AccordionTrigger
                    className="text-left text-base font-medium"
                    data-testid={`accordion-trigger-${item.id}`}
                  >
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent data-testid={`accordion-content-${item.id}`}>
                    <p className="text-muted-foreground leading-relaxed">{item.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeIn delay={0.3}>
        <section
          className="mt-16 sm:mt-20 bg-gradient-to-br from-red-600 via-red-700 to-red-800 relative rounded-md"
          data-testid="section-faq-cta"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)] pointer-events-none rounded-md" />
          <div className="relative max-w-3xl mx-auto px-6 sm:px-8 py-14 sm:py-16 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              Ready for a clear next step?
            </h2>
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed mb-8">
              Request a timed Field Kit evaluation, or book a strategy call about coaching and team systems. Honest conversation — no pressure.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                asChild
                className="font-bold bg-white text-red-700 hover:bg-white/90 touch-manipulation group px-10"
                data-testid="button-faq-contact"
              >
                <Link href="/contact">
                  <span>Book a strategy call</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="font-bold border-white/50 text-white bg-transparent hover:bg-white/10 touch-manipulation px-10"
                data-testid="button-faq-request"
              >
                <Link href="/request-access">Request Field Kit access</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-white/80">
              <Link href="/field-kit-membership" className="underline underline-offset-4 hover:text-white" data-testid="button-faq-membership">
                Membership path
              </Link>
            </p>
          </div>
        </section>
      </FadeIn>
    </PersuasionShell>
  );
}
