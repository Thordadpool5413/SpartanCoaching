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
        a: "Spartan Coaching is a practical consulting practice for hospice growth professionals. We help liaisons, business development reps, and growth leaders build consistent referral relationships and execute territory strategy with discipline, ethical messaging, and measurable weekly accountability. Coaching is human-first. The Field Kit is a private execution layer for clients and approved evaluators.",
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
        a: "The Field Kit is a private set of AI-assisted tools for hospice growth work: objections, playbooks, role-play, calculators, weekly plans, and more. It is not a self-serve SaaS product. Access is by request and approval — reserved for coaching clients and people Nick approves for a timed evaluation.",
      },
      {
        id: "how-to-get-access",
        q: "How do I get Field Kit access?",
        a: "Request access on the site. Nick reviews every request. If approved, you receive a secure email to set your password and start a timed evaluation (typically 24 hours for individuals, 72 hours for company teams). After the window, continue as a client by conversation and invoice — there is no checkout cart on the site.",
      },
      {
        id: "trial-hours",
        q: "How long is the evaluation trial?",
        a: "Individual evaluations are usually 24 hours. Company / multi-seat evaluations are usually 72 hours. Windows can be extended from the Access Desk when a real evaluation needs more time. The clock starts when your account is approved and you are set up to sign in.",
      },
      {
        id: "tools-without-coaching",
        q: "Can I use the tools without a coaching engagement?",
        a: "You can request a short evaluation without buying coaching first. Ongoing Field Kit membership is custom (individual, team seats, or enterprise with coaching). Many clients combine tools with coaching; others continue tools-only after evaluation. Either path is activated manually after we agree on seats and terms — not via self-serve billing.",
      },
      {
        id: "already-have-account",
        q: "I already have an account. How do I sign in?",
        a: "Use Client Login with the email that was approved. You can also request a magic sign-in link from the login page. If your evaluation expired, you will see a clear message with options to request an extension or book a strategy call.",
      },
      {
        id: "company-seats",
        q: "How do company seats work?",
        a: "Company access creates an organization with a seat limit. An org admin can invite teammates. Leaders can see seat usage and keep one playbook across the team. Enterprise packages can bundle seats with leadership coaching and workshops.",
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
        a: "Two paths: (1) Request Field Kit evaluation access if you want to test the tools first, or (2) Book a strategy call if you want coaching, team systems, or enterprise scope. There is no pressure and no automated checkout.",
      },
      {
        id: "cost",
        q: "How much does it cost?",
        a: "Pricing is custom. Individual Field Kit membership, multi-seat teams, and enterprise + coaching each differ by census, seats, and intensity. We discuss numbers openly after evaluation or on a strategy call. Payment is handled offline or by invoice for now — Stripe is not on the site yet.",
      },
      {
        id: "virtual-or-inperson",
        q: "Are sessions virtual or in-person?",
        a: "Most coaching sessions are virtual. For team training and organizational consulting, we offer virtual and on-site options depending on your needs and market.",
      },
      {
        id: "what-after-trial",
        q: "What happens when my evaluation ends?",
        a: "Tool access pauses when the window ends. You will get a clear next-step path: book a debrief, request an extension if you still need time, or continue as an activated client with agreed seats and terms. Your account remains so we can pick up cleanly — you are not left guessing.",
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
            Coaching, Field Kit access, evaluation trials, compliance, and how Spartan works as a consulting practice — not a self-serve checkout.
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
                className="font-bold border-white/40 text-white bg-transparent hover:bg-white/10 touch-manipulation px-10"
                data-testid="button-faq-request"
              >
                <Link href="/request-access">Request Field Kit access</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-white/70">
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
