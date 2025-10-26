import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BackButton } from "@/components/BackButton";

export default function Method() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <BackButton />
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4" data-testid="text-method-title">
          The Spartan Method
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          A practical framework built on three pillars: Discipline, Empathy, and Strategy. Each pillar is essential. Together, they create a system for serving patients with excellence.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="bg-accent/30 mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">The Spartan Mission</h2>
          <p className="text-foreground leading-relaxed mb-4">
            Spartan Coaching was born in the field. We built teams, ran routes, and sat with clinicians. A pattern emerged: good people failed not because they cared too little, but because the system around them was noisy, complex, and rewarded the wrong activities. We fixed the system. We kept what worked and cut the rest.
          </p>
          <p className="text-foreground leading-relaxed">
            To us, 'Spartan' means a disciplined commitment to a higher purpose. It's about preparing with intent, practicing under pressure, and measuring progress in the open. Our method is built on clarity, compassionate accountability, and a relentless focus on patient-first outcomes. We build practical frameworks that respect clinical workflow and deliver measurable improvements.
          </p>
        </Card>

        <h2 className="text-3xl font-bold text-foreground mb-8">The Three Pillars</h2>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="discipline">
            <AccordionTrigger className="text-2xl font-bold text-primary hover:text-primary/80">
              Discipline
            </AccordionTrigger>
            <AccordionContent className="text-foreground leading-relaxed pt-4 space-y-4">
              <p>
                Success in hospice sales requires more than good intentions—it demands structure and consistency. Discipline means having a proven framework for territory planning, objection handling, and follow-up strategies. It's about showing up prepared, executing with precision, and tracking what matters.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Key Components:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Weekly territory planning with clear objectives</li>
                  <li>Standardized call preparation and follow-up protocols</li>
                  <li>Metrics tracking for activity and outcomes</li>
                  <li>Continuous skill development through practice</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="empathy">
            <AccordionTrigger className="text-2xl font-bold text-primary hover:text-primary/80">
              Empathy
            </AccordionTrigger>
            <AccordionContent className="text-foreground leading-relaxed pt-4 space-y-4">
              <p>
                At the heart of hospice sales is human connection. Empathy is about listening with intent, understanding the unspoken needs of providers and families, and building trust that goes beyond any single referral. We train you to connect authentically, ask better questions, and position hospice not as a product, but as a partner in delivering comfort and dignity.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Core Practices:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Active listening techniques for clinical conversations</li>
                  <li>Understanding provider pain points and workflows</li>
                  <li>Building long-term relationships over transactional wins</li>
                  <li>Patient-centered communication that honors dignity</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="strategy">
            <AccordionTrigger className="text-2xl font-bold text-primary hover:text-primary/80">
              Strategy
            </AccordionTrigger>
            <AccordionContent className="text-foreground leading-relaxed pt-4 space-y-4">
              <p>
                Strategy is about acting with purpose. It means using data, market insights, and AI-powered tools to identify the right referral sources and focus your energy where it will have the greatest impact. We help you cut through the noise, prioritize high-value activities, and build a pipeline that serves the patients who need you most.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Strategic Elements:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Data-driven territory analysis and segmentation</li>
                  <li>Competitive intelligence and market positioning</li>
                  <li>AI-powered research and insights tools</li>
                  <li>Intentional account prioritization based on impact</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-12 bg-gradient-to-br from-primary/10 to-destructive/10 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Built in the Field, Proven in Practice
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every framework, every playbook, every drill we teach has been tested in real-world hospice sales. This isn't theory—it's battle-tested strategy designed to help you win with integrity.
          </p>
        </div>
      </div>
    </div>
  );
}
