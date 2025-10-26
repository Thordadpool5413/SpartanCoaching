import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";

export default function About() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <BackButton />
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-8 text-center" data-testid="text-about-title">
          About the Founder
        </h1>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-1">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-destructive/20 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-card flex items-center justify-center mb-4">
                  <span className="text-5xl font-black text-primary">NL</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground">Nick Lynch</h2>
                <p className="text-muted-foreground">Founder</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <Card>
              <blockquote className="text-lg italic text-foreground leading-relaxed border-l-4 border-primary pl-6 mb-6">
                "Nick has built and led field teams across hospice, home health, and post-acute care. He builds practical frameworks that respect clinical workflow and deliver measurable improvements in admissions and case mix quality. He believes in simple plans repeated well, and in coaching that happens in the work, not in a lecture hall."
              </blockquote>
              <p className="text-muted-foreground leading-relaxed">
                Nick Lynch brings years of hands-on experience in hospice sales, team leadership, and operational excellence. His approach is born from real-world challenges—sitting in clinics, riding with liaisons, and building systems that actually work in the field.
              </p>
            </Card>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">Experience & Expertise</h2>
          <div className="space-y-4">
            <Card className="hover-elevate transition-all">
              <h3 className="text-xl font-bold text-primary mb-2">Field Leadership</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built and led field sales teams across multiple markets, developing territory strategies that respect clinical workflows while driving measurable growth in referrals and patient census.
              </p>
            </Card>

            <Card className="hover-elevate transition-all">
              <h3 className="text-xl font-bold text-primary mb-2">Operational Excellence</h3>
              <p className="text-muted-foreground leading-relaxed">
                Designed and implemented systems for admissions speed, start-of-care readiness, and IDT communication that reduce delays and improve patient outcomes.
              </p>
            </Card>

            <Card className="hover-elevate transition-all">
              <h3 className="text-xl font-bold text-primary mb-2">Practical Coaching</h3>
              <p className="text-muted-foreground leading-relaxed">
                Believes in coaching that happens in the work, not in theory. Every framework is field-tested, every playbook is battle-proven, and every strategy prioritizes patient-first outcomes.
              </p>
            </Card>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-destructive/10 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Let's Work Together
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
            Whether you need one-on-one coaching, a full program build, or strategic consulting, Spartan Coaching is here to help you deliver better outcomes for the patients who need you most.
          </p>
          <a href="mailto:contact@spartancoaching.com" className="inline-block">
            <button className="bg-primary text-primary-foreground font-bold px-8 py-4 rounded-lg hover-elevate transition-all" data-testid="button-contact">
              Get in Touch
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
