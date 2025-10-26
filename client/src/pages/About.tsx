import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";
import { Target, Users, TrendingUp } from "lucide-react";

export default function About() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <BackButton />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-6" data-testid="text-about-title">
            Why Spartan Coaching Exists
          </h1>
          <p className="text-2xl text-muted-foreground leading-relaxed">
            Hospice is not a mystery. It is a promise.
          </p>
        </div>

        {/* The Why Section - Core Message */}
        <div className="mb-20">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-destructive/5 border-2">
            <div className="space-y-6 text-lg leading-relaxed">
              <p className="text-foreground">
                The promise is simple. When a person is eligible, they should receive expert, compassionate care without delay, and their family should feel supported at every step. That promise breaks when sales teams are left with vague goals, light coaching, and a calendar full of activity that does not move referrals.
              </p>
              <p className="text-foreground font-semibold text-xl">
                Spartan Coaching exists to close the gap between good intentions and consistent execution so more eligible patients receive care earlier in their journey.
              </p>
              <p className="text-foreground">
                This is about moral clarity and measurable outcomes living in the same room. Ethics without structure does not scale. Structure without heart does not last. We teach both.
              </p>
              <p className="text-foreground">
                Reps learn what to do at 8 on Monday, how to prepare for a physician visit at 11, and how to close the loop by 4 so nothing stalls. Leaders learn how to coach one skill at a time, how to run short pipeline reviews that actually change behavior, and how to build a team rhythm that survives busy seasons, market changes, and turnover.
              </p>
            </div>
          </Card>
        </div>

        {/* The Stakes */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-8">The Stakes Are Real</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate transition-all text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">For Teams</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When teams communicate clearly with referral partners and remove friction from the pathway, length of stay stabilizes, hospital readmissions drop, and families feel seen.
              </p>
            </Card>

            <Card className="hover-elevate transition-all text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">For Reps</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When reps carry a clean plan for their top accounts, follow up is faster, objections become opportunities to educate, and referrals move from interest to signed order without getting lost.
              </p>
            </Card>

            <Card className="hover-elevate transition-all text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">For Organizations</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When the corporate office can see the same standards across markets, wins are repeatable and growth is not guesswork.
              </p>
            </Card>
          </div>
        </div>

        {/* What We Built */}
        <div className="mb-20">
          <Card className="p-8 md:p-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">What We Built</h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                We built Spartan Coaching because hospice deserves better than motivational posters and one-time pep talks. People need a system they can run on Tuesday afternoon when a clinic is short-staffed, the hospitalist is behind, and the family is scared.
              </p>
              <p>
                That system has to be simple, honest, and teachable. It has to honor Medicare rules and protect trust with physicians and facilities. It has to turn mission into steps that any trained rep can take and any skilled leader can coach.
              </p>
              <p className="font-semibold text-foreground text-lg">
                Spartan is a choice. It means fewer buzzwords and more practice. Fewer meetings and more field work. Clear standards. Straight talk. Daily accountability.
              </p>
              <p>
                It means we measure what matters so effort turns into access for the people who need it most. We do this work because the end of life is not the end of care. It is when care must be at its best.
              </p>
            </div>
          </Card>
        </div>

        {/* About the Founder */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">About the Founder</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-1">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-destructive/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto rounded-full bg-card flex items-center justify-center mb-4">
                    <span className="text-5xl font-black text-primary">NL</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Nick Lynch</h3>
                  <p className="text-muted-foreground">Founder</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <Card>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Nick Lynch brings years of hands-on experience in hospice sales, team leadership, and operational excellence. His approach is born from real-world challenges—sitting in clinics, riding with liaisons, and building systems that actually work in the field.
                </p>
                <blockquote className="text-base italic text-foreground leading-relaxed border-l-4 border-primary pl-6">
                  "Nick has built and led field teams across hospice, home health, and post-acute care. He builds practical frameworks that respect clinical workflow and deliver measurable improvements in admissions and case mix quality. He believes in simple plans repeated well, and in coaching that happens in the work, not in a lecture hall."
                </blockquote>
              </Card>
            </div>
          </div>

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

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary/10 to-destructive/10 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Let's Work Together
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
            Whether you need one-on-one coaching, team training, or strategic consulting, Spartan Coaching is here to help you deliver better outcomes for the patients who need you most.
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
