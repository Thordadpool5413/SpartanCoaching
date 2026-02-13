import { useState } from "react";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";
import { Quote, TrendingUp, Users, Award } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

export default function Testimonials() {
  const [contactFormOpen, setContactFormOpen] = useState(false);

  const testimonials = [
    {
      name: "Sarah M.",
      title: "Hospice Liaison",
      company: "Regional Hospice Provider",
      quote: "I was making visits but referrals stalled at 'we'll think about it.' Nick taught me to handle objections in the moment instead of leaving confused. My top five accounts now actually call me when they have an eligible patient.",
      outcome: "Conversion rate from visit to referral increased 52% in first quarter",
      category: "individual"
    },
    {
      name: "James T.",
      title: "Hospice Liaison",
      company: "Multi-State Hospice Organization",
      quote: "Before Spartan, I had a full calendar but no system. Nick showed me how to prioritize accounts that actually matter and build follow-up into my routine. I cut drive time by a third and admissions went up, not down.",
      outcome: "Reduced weekly drive time from 18 hours to 12, referrals up 28%",
      category: "individual"
    },
    {
      name: "Maria R.",
      title: "Hospice Liaison",
      company: "Nonprofit Hospice",
      quote: "The objection handling practice was brutal but necessary. I learned what to say when a social worker pushes back on timing or when a physician wants 'one more test.' Now I guide the conversation instead of reacting to it.",
      outcome: "Average time from referral to admission dropped from 4.2 days to 2.6 days",
      category: "individual"
    },
  ];

  const caseStudies = [
    {
      title: "From Busy to Productive: Territory Transformation",
      client: "Mid-Size Regional Hospice • Individual Rep Coaching",
      challenge: "Experienced liaison was making 25+ visits per week but only converting 12% to referrals. Calendar packed with stops at low-volume accounts while high-opportunity SNFs received inconsistent attention. Objections from discharge planners went unanswered, causing deals to stall at 'we'll call you.'",
      solution: "90-day intensive territory redesign: Mapped all 47 accounts by actual referral volume and patient demographics. Built A/B/C prioritization framework with specific visit frequency for each tier. Practiced objection handling for top three stall points ('family wants home health first,' 'patient not ready yet,' 'we use another provider'). Implemented weekly pipeline review to track every active opportunity.",
      results: [
        "Conversion rate climbed from 12% to 34% in 12 weeks",
        "Top 8 accounts now generate 67% of monthly referrals (was 28%)",
        "Weekly drive time reduced from 22 hours to 14 hours",
        "Lost zero deals to 'we'll call you' objections in final 30 days",
      ],
      category: "individual"
    },
    {
      title: "Building a Coaching System That Sticks",
      client: "For-Profit Hospice Provider • Sales Leadership Development",
      challenge: "Director inherited a six-person team with wildly inconsistent results. Top performer hit 18 admissions monthly while bottom two averaged 4. No documented process, no structured coaching, and manager spent most time firefighting instead of developing talent. Team morale low, turnover high (lost 3 reps in 8 months).",
      solution: "Six-month leadership transformation: Built a weekly coaching rhythm with 15-minute one-on-ones focused on one skill at a time. Created a simple pipeline tracking system that takes 10 minutes to update. Trained manager to run structured field rides with clear observation criteria. Implemented new rep onboarding program with week-by-week milestones and shadow rides.",
      results: [
        "All six reps hit monthly targets for four straight quarters",
        "Team average climbed from 9.2 to 14.6 admissions per rep per month",
        "Manager coaching time increased from 2 hours/week to 8 hours/week",
        "New rep time-to-first-admission dropped from 11 weeks to 3.5 weeks",
        "Zero voluntary turnover in 12 months following implementation",
      ],
      category: "leadership"
    },
    {
      title: "Scaling Execution Across Markets",
      client: "Multi-State Hospice Organization • Corporate System Implementation",
      challenge: "Ten markets operating as independent units with no shared process or common language. Executive team couldn't compare performance across regions or identify why some markets thrived while others struggled. New acquisitions took 18+ months to reach profitability. Corporate training initiatives ignored by field teams who saw them as 'check-the-box' exercises disconnected from daily reality.",
      solution: "18-month enterprise transformation: Collaborated with top performers from each market to design one unified sales process. Trained all regional managers in the new system with emphasis on field application, not theory. Built simple performance dashboard that tracks leading indicators (visits, follow-ups, objections handled) not just lagging results (admissions). Conducted quarterly calibration sessions where managers share what's working and troubleshoot what's not.",
      results: [
        "All 10 markets now use identical account prioritization and follow-up framework",
        "Performance variance across markets reduced from 340% to 78%",
        "New acquisitions reach break-even in 7 months (was 19 months)",
        "System adoption measured at 91% compliance after 15 months",
        "Forecast accuracy improved from 58% to 86% at corporate level",
        "Referral volume up 37% year-over-year with same headcount",
      ],
      category: "corporate"
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <BackButton />
      <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-16">
        <h1 className="text-h1 text-foreground mb-6" data-testid="text-testimonials-title">
          Success Stories
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed">
          Real results from reps, leaders, and organizations who chose the Spartan way: fewer buzzwords, more practice. Clear standards, straight talk, measurable outcomes.
        </p>
      </div>
      {/* Testimonials Section */}
      <div className="space-y-8 md:space-y-12 lg:space-y-16">
        <div className="flex items-center gap-3 mb-8">
          <Quote className="w-8 h-8 text-primary" />
          <h2 className="text-h2 text-foreground">What People Are Saying</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-cards">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="flex flex-col hover-elevate transition-elegant border-2 group relative spacing-card" data-testid={`card-testimonial-${idx}`}>
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex-1 relative">
                <div className="mb-4">
                  <Quote className="w-8 h-8 text-primary/20" />
                </div>
                <p className="text-base text-muted-foreground italic leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="border-t pt-4">
                  <p className="font-bold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                  <p className="text-sm text-muted-foreground mb-3">{testimonial.company}</p>
                  <div className="bg-primary/10 rounded-lg p-3">
                    <p className="text-sm font-semibold text-primary mb-1">Result:</p>
                    <p className="text-sm text-foreground">{testimonial.outcome}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

      </div>
      {/* Case Studies Section */}
      <div className="space-y-8 md:space-y-12 lg:space-y-16">
        <div className="flex items-center gap-3 mt-12 mb-8">
          <Award className="w-8 h-8 text-primary" />
          <h2 className="text-h2 text-foreground">Case Studies</h2>
        </div>

        <div className="gap-cards">
          {caseStudies.map((study, idx) => (
            <Card key={idx} className="hover-elevate transition-elegant border-2 group relative spacing-card" data-testid={`card-case-study-${idx}`}>
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <h3 className="text-h3 font-bold text-foreground mb-3">{study.title}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{study.client}</p>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-2">The Challenge:</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{study.challenge}</p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-foreground mb-2">The Solution:</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{study.solution}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/30 rounded-lg p-6">
                    <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Results:
                    </p>
                    <ul className="space-y-3">
                      {study.results.map((result, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-sm text-foreground leading-relaxed">{result}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

      </div>
      {/* Categories Explanation */}
      <div className="grid md:grid-cols-3 gap-cards mb-12">
        <Card className="text-center hover-elevate transition-elegant border-2 group relative spacing-card">
          <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-spartan-gradient flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-h3 font-bold text-foreground mb-2">Individual Reps</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sales professionals improving their territory performance, conversion rates, and execution consistency.
            </p>
          </div>
        </Card>

        <Card className="text-center hover-elevate transition-elegant border-2 group relative spacing-card">
          <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-spartan-gradient flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-h3 font-bold text-foreground mb-2">Sales Leadership</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Managers and directors building consistent team performance and scalable coaching systems.
            </p>
          </div>
        </Card>

        <Card className="text-center hover-elevate transition-elegant border-2 group relative spacing-card">
          <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-spartan-gradient flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-h3 font-bold text-foreground mb-2">Corporate Providers</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Multi-market organizations standardizing execution and making growth predictable across regions.
            </p>
          </div>
        </Card>
      </div>
      {/* CTA */}
      <div className="bg-gradient-to-br from-primary/10 to-destructive/10 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-h2 font-bold text-foreground mb-4">
          Ready to Write Your Success Story?
        </h2>
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Whether you're a rep looking to sharpen your skills, a leader building a team, or an executive scaling across markets—let's talk about what's not working and build a plan that fixes it.
        </p>
        <Button
          onClick={() => setContactFormOpen(true)}
          className="font-bold px-8 py-4 rounded-lg transition-all"
          data-testid="button-contact"
        >
          Schedule a Consultation
        </Button>
      </div>

      <ContactForm open={contactFormOpen} onOpenChange={setContactFormOpen} />
    </div>
  );
}
