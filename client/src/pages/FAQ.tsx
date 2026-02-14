import { useState } from "react";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
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
    title: "Getting Started",
    questions: [
      {
        id: "what-is-spartan",
        q: "What is Spartan Coaching?",
        a: "Spartan Coaching is a specialized hospice sales consulting firm with over 15 years of hands-on industry experience. We help hospice organizations and individual sales representatives dramatically improve their referral rates, close ratios, and overall sales effectiveness through expert coaching, structured training programs, and proven methodologies like the Spartan Method.",
      },
      {
        id: "who-is-it-for",
        q: "Who is Spartan Coaching for?",
        a: "Our services are designed for hospice sales representatives, sales managers, directors of business development, and hospice organization leaders. Whether you're a new rep looking to build a foundation or an experienced professional seeking to break through a plateau, our programs are tailored to meet you where you are.",
      },
      {
        id: "how-to-start",
        q: "How do I get started?",
        a: "It starts with a free strategy call. We'll discuss your specific challenges, goals, and current situation. From there, we'll recommend the right program or coaching engagement. There's no pressure and no commitment required \u2014 just an honest conversation about how we can help.",
      },
    ],
  },
  {
    title: "Coaching & Programs",
    questions: [
      {
        id: "typical-engagement",
        q: "What does a typical coaching engagement look like?",
        a: "Engagements are tailored to your needs. A typical individual coaching program includes weekly one-on-one sessions (30-60 minutes), personalized action plans, real-time support between sessions, and access to our full library of tools and resources. Most clients see measurable improvement within the first 30 days.",
      },
      {
        id: "program-length",
        q: "How long does a coaching program last?",
        a: "Programs are flexible. Some clients engage for a focused 90-day sprint to address specific challenges, while others maintain ongoing coaching relationships for continuous growth. We'll recommend a timeline during your strategy call based on your goals.",
      },
      {
        id: "teams-or-individuals",
        q: "Do you work with entire teams or just individuals?",
        a: "Both. We offer individual coaching for sales reps and managers, as well as comprehensive team training programs for organizations. Team programs include group workshops, individual coaching sessions, and organizational strategy consulting.",
      },
      {
        id: "different-approach",
        q: "What makes your approach different from other sales training?",
        a: "Most sales training is generic. We specialize exclusively in hospice sales, which means we understand the clinical nuances, regulatory landscape, and relationship dynamics unique to this industry. Our Spartan Method combines discipline, empathy, and strategy \u2014 it's not about aggressive selling, it's about getting eligible patients into care earlier through authentic relationships.",
      },
    ],
  },
  {
    title: "Investment & Results",
    questions: [
      {
        id: "coaching-cost",
        q: "How much does coaching cost?",
        a: "Investment varies based on the scope of engagement \u2014 individual coaching, team training, or organizational consulting each have different structures. We believe in transparency, so we'll discuss pricing openly during your free strategy call. What we can tell you is that our clients consistently see ROI that far exceeds their investment, often within the first quarter.",
      },
      {
        id: "expected-results",
        q: "What kind of results can I expect?",
        a: "Our clients typically see a 30-50% increase in referral rates, significantly improved close ratios, stronger relationships with referral sources, and greater confidence in clinical conversations. Results vary by individual and organization, but our track record speaks for itself.",
      },
      {
        id: "guarantee",
        q: "Is there a guarantee?",
        a: "We don't offer money-back guarantees because results require your active participation. What we do guarantee is our commitment \u2014 if you show up, do the work, and follow the process, you will see improvement. Every strategy call includes a candid assessment of whether our services are the right fit for your situation.",
      },
    ],
  },
  {
    title: "Logistics & Process",
    questions: [
      {
        id: "virtual-or-inperson",
        q: "Are sessions virtual or in-person?",
        a: "Most coaching sessions are conducted virtually via video call, making it convenient regardless of your location. For team training and organizational consulting, we offer both virtual and on-site options depending on your needs and preferences.",
      },
      {
        id: "technology-needed",
        q: "What technology or tools do I need?",
        a: "Just a computer or smartphone with a reliable internet connection. All our coaching tools, resources, and training materials are accessible through our website. No special software or equipment is required.",
      },
      {
        id: "tools-without-coaching",
        q: "Can I access coaching tools without a coaching engagement?",
        a: "Yes! Our website offers free access to AI-powered tools like the Sales Playbook Generator, Objection Handler, Territory Research tool, and more. These tools are available to all hospice sales professionals. Coaching engagements provide the personalized guidance and accountability that tools alone can't replace.",
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
            Get answers to common questions about our hospice sales coaching programs, process, and how we can help transform your sales performance.
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
              Book a free strategy call and get personalized answers about how Spartan Coaching can help you or your team achieve breakthrough results.
            </p>
            <Button
              size="lg"
              onClick={() => setContactFormOpen(true)}
              className="bg-white text-red-700 font-bold text-base sm:text-lg px-8 sm:px-10 py-3 shadow-xl border-white"
              data-testid="button-faq-book-call"
            >
              <Phone className="mr-2 w-5 h-5" />
              Book a Free Strategy Call
            </Button>
          </div>
        </section>
      </FadeIn>

      <ContactForm open={contactFormOpen} onOpenChange={setContactFormOpen} />
    </div>
  );
}
