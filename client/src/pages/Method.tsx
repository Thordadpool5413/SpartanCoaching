import { Card } from "@/components/ui/card";

export default function Method() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-6" data-testid="text-method-title">
          Our Mission & Method
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          We exist to change how healthcare sales is done. The goal is simple: ensure every patient gets the right care, at the right time, at the right level of service. This is our why.
        </p>

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

        <div className="space-y-8">
          <Card>
            <h3 className="text-2xl font-bold text-primary mb-3">Discipline</h3>
            <p className="text-foreground leading-relaxed">
              Success in hospice sales requires more than good intentions—it demands structure and consistency. Discipline means having a proven framework for territory planning, objection handling, and follow-up strategies. It's about showing up prepared, executing with precision, and tracking what matters. We teach you to build habits that lead to predictable, high-impact results.
            </p>
          </Card>

          <Card>
            <h3 className="text-2xl font-bold text-primary mb-3">Empathy</h3>
            <p className="text-foreground leading-relaxed">
              At the heart of hospice sales is human connection. Empathy is about listening with intent, understanding the unspoken needs of providers and families, and building trust that goes beyond any single referral. We train you to connect authentically, ask better questions, and position hospice not as a product, but as a partner in delivering comfort and dignity.
            </p>
          </Card>

          <Card>
            <h3 className="text-2xl font-bold text-primary mb-3">Strategy</h3>
            <p className="text-foreground leading-relaxed">
              Strategy is about acting with purpose. It means using data, market insights, and AI-powered tools to identify the right referral sources and focus your energy where it will have the greatest impact. We help you cut through the noise, prioritize high-value activities, and build a pipeline that serves the patients who need you most. Every move should be intentional and measurable.
            </p>
          </Card>
        </div>

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
