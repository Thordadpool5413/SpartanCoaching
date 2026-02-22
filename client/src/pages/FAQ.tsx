import { useState } from "react";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = [
  {
    title: "Coaching and Process",
    questions: [
      {
        id: "what-is-spartan",
        q: "What is Spartan Coaching?",
        a: "Spartan Coaching is a practical coaching system for hospice growth professionals. We help liaisons, business development reps, and growth leaders build consistent referral relationships and execute territory strategy with discipline, ethical messaging, and measurable weekly accountability.",
      },
      {
        id: "who-is-this-for",
        q: "Who is this for?",
        a: "Hospice liaisons, hospice business development reps, directors of business development, and hospice growth leaders. Also hospice owners and executive directors who want their team to perform consistently.",
      },
      {
        id: "how-does-coaching-work",
        q: "How does coaching work?",
        a: "It starts with an intake and baseline assessment. In week one we build your territory plan and set success metrics. From there, you get weekly coaching sessions with execution debriefs, scorecard accountability, and ongoing refinement. Most clients commit 2 to 3 hours per week including prep and session time.",
      },
      {
        id: "what-makes-different",
        q: "What makes this different from other sales training?",
        a: "Most sales training is generic or motivational. Spartan is hospice-specific, compliance-aware, and built around weekly execution. We focus on what you do on Tuesday afternoon when the clinic is short-staffed, not what sounds good in a conference room.",
      },
    ],
  },
  {
    title: "What You Receive",
    questions: [
      {
        id: "what-do-i-get",
        q: "What do I actually get as a coaching client?",
        a: "You receive a territory and account planning system, referral source segmentation framework, weekly scorecard and accountability rhythm, messaging library with outreach scripts by referral source type, objection handling scripts, follow-up sequences and cadence templates, and a structured weekly coaching agenda with pre-work.",
      },
      {
        id: "ai-tools",
        q: "Do you offer AI tools?",
        a: "Yes. We offer optional AI-enabled planning tools for organizing messaging and territory workflow. These tools are for planning support only. Do not enter patient identifiers or protected health information into any tool.",
      },
      {
        id: "tools-without-coaching",
        q: "Can I access tools without a coaching engagement?",
        a: "Yes. Our website offers free access to AI-powered tools including the Sales Playbook Generator, Objection Handler, Territory Research tool, and more. Coaching adds the personalized guidance and accountability that tools alone cannot replace.",
      },
    ],
  },
  {
    title: "Compliance and Ethics",
    questions: [
      {
        id: "compliance",
        q: "How do you handle compliance?",
        a: "Coaching focuses on ethical relationship building and education, not inducements. We do not train aggressive tactics, misleading messaging, or shortcuts around eligibility criteria. All messaging respects hospice regulations and clinical workflow.",
      },
      {
        id: "patient-data",
        q: "Is patient data safe?",
        a: "Tools are for planning and messaging workflows, not documentation. Do not enter patient identifiers or PHI into any tool. Client data is not used to train public models.",
      },
      {
        id: "guarantee-results",
        q: "Do you guarantee results?",
        a: "No. Spartan Coaching does not guarantee admissions, referrals, or census growth. Results depend on execution, market conditions, and organizational commitment. What we do guarantee is a structured process and honest coaching.",
      },
    ],
  },
  {
    title: "Getting Started",
    questions: [
      {
        id: "how-to-start",
        q: "How do I get started?",
        a: "Submit an application. We will review your situation and schedule a consult to discuss your specific challenges, goals, and whether Spartan is the right fit. There is no pressure and no commitment required.",
      },
      {
        id: "cost",
        q: "How much does it cost?",
        a: "Investment varies based on scope. Individual coaching, team training, and organizational consulting each have different structures. We discuss pricing openly during your initial consult.",
      },
      {
        id: "virtual-or-inperson",
        q: "Are sessions virtual or in-person?",
        a: "Most coaching sessions are conducted virtually. For team training and organizational consulting, we offer both virtual and on-site options depending on your needs.",
      },
    ],
  },
];

export default function FAQ() {
  const [contactFormOpen, setContactFormOpen] = useState(false);

  return (
    <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <BackButton />

      <FadeIn>
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <h1 className="text-h1 text-foreground mb-6" data-testid="text-faq-title">
            Frequently Asked Questions
          </h1>
          <p className="text-body-lg text-muted-foreground leading-relaxed">
            Get answers to common questions about Spartan Coaching, our process, compliance standards, and how we help hospice growth professionals execute with discipline and accountability.
          </p>
        </div>
      </FadeIn>

      <StaggerContainer className="space-y-12 max-w-4xl mx-auto">
        {faqCategories.map((category) => (
          <StaggerItem key={category.title}>
            <h2 className="text-h2 text-foreground mb-4" data-testid={`text-category-${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
              {category.title}
            </h2>
            <Accordion type="multiple" className="space-y-2">
              {category.questions.map((item) => (
                <AccordionItem key={item.id} value={item.id} data-testid={`accordion-item-${item.id}`}>
                  <AccordionTrigger className="text-left text-base font-medium" data-testid={`accordion-trigger-${item.id}`}>
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent data-testid={`accordion-content-${item.id}`}>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.a}
                    </p>
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)] pointer-events-none rounded-md"></div>
          <div className="relative max-w-3xl mx-auto px-6 sm:px-8 py-14 sm:py-16 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              Still have questions?
            </h2>
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
              Submit an application and get personalized answers about how Spartan Coaching can help you or your team execute with discipline and accountability.
            </p>
            <Button
              size="lg"
              onClick={() => setContactFormOpen(true)}
              className="bg-white text-red-700 font-bold text-base sm:text-lg px-8 sm:px-10 py-3 shadow-xl border-white"
              data-testid="button-faq-apply-now"
            >
              <ArrowRight className="mr-2 w-5 h-5" />
              Apply Now
            </Button>
          </div>
        </section>
      </FadeIn>

      <ContactForm open={contactFormOpen} onOpenChange={setContactFormOpen} />
    </div>
  );
}
