import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";
import { Quote, TrendingUp, Users, Award } from "lucide-react";

export default function Testimonials() {
  // Placeholder testimonials - ready for real content
  const testimonials = [
    {
      name: "Placeholder Name",
      title: "Hospice Sales Representative",
      company: "Provider Name",
      quote: "Testimonial content will go here. This is where sales reps share how Spartan Coaching helped them improve their territory performance, objection handling, and conversion rates.",
      outcome: "Specific measurable outcome (e.g., '40% increase in referral conversions')",
      category: "individual"
    },
    {
      name: "Placeholder Name",
      title: "Director of Sales",
      company: "Hospice Organization",
      quote: "Leadership testimonial goes here. Sales leaders share how Spartan Coaching helped them build consistent team performance, implement effective coaching systems, and scale growth.",
      outcome: "Team-level outcome (e.g., 'Reduced onboarding time by 50%')",
      category: "leadership"
    },
    {
      name: "Placeholder Name",
      title: "VP of Operations",
      company: "Multi-Market Hospice Provider",
      quote: "Corporate testimonial goes here. Executives share how Spartan Coaching helped standardize execution across markets, improve predictability, and drive sustainable growth.",
      outcome: "Organizational outcome (e.g., 'Standardized performance across 8 markets')",
      category: "corporate"
    },
  ];

  const caseStudies = [
    {
      title: "Territory Turnaround: From Reactive to Strategic",
      client: "Individual Sales Rep",
      challenge: "Rep was busy but pipeline wasn't converting. Calendar full of activity but referrals stalled at verbal interest.",
      solution: "3-month territory management program: account prioritization, follow-up cadence, objection handling practice.",
      results: [
        "Referral conversion rate increased 45% in 90 days",
        "Reduced drive time by 30% through better routing",
        "Top 10 accounts now produce 60% of referrals (was 35%)",
      ],
      category: "individual"
    },
    {
      title: "Team Alignment: Building a Coaching Culture",
      client: "Regional Hospice Provider",
      challenge: "5-person sales team with inconsistent performance. No shared process, light coaching, results varied by rep.",
      solution: "6-month leadership program: team training workshop, weekly pipeline reviews, skill-based coaching framework.",
      results: [
        "Team hit referral targets 4 months in a row (first time in 2 years)",
        "New rep onboarding reduced from 6 months to 8 weeks",
        "Manager now coaches 1 skill per week vs. vague 'work harder' feedback",
      ],
      category: "leadership"
    },
    {
      title: "Multi-Market System Implementation",
      client: "Corporate Hospice Organization",
      challenge: "8 markets performing differently with no standard process. Wins weren't repeatable, growth was unpredictable.",
      solution: "12-month system implementation: process design, manager training, performance tracking across all markets.",
      results: [
        "All markets now use same sales process and language",
        "Variability in performance reduced by 60%",
        "Corporate can identify and scale what's working",
      ],
      category: "corporate"
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <BackButton />
      
      <div className="text-center max-w-4xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-6" data-testid="text-testimonials-title">
          Success Stories
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Real results from reps, leaders, and organizations who chose the Spartan way: fewer buzzwords, more practice. Clear standards, straight talk, measurable outcomes.
        </p>
      </div>

      {/* Testimonials Section */}
      <div className="mb-24">
        <div className="flex items-center gap-3 mb-8">
          <Quote className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">What People Are Saying</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="flex flex-col hover-elevate transition-all" data-testid={`card-testimonial-${idx}`}>
              <div className="flex-1 p-6">
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

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground italic">
            Client testimonials will be added as engagements are completed. Privacy and confidentiality always respected.
          </p>
        </div>
      </div>

      {/* Case Studies Section */}
      <div className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <Award className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Case Studies</h2>
        </div>

        <div className="space-y-8">
          {caseStudies.map((study, idx) => (
            <Card key={idx} className="hover-elevate transition-all" data-testid={`card-case-study-${idx}`}>
              <div className="p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold text-foreground mb-3">{study.title}</h3>
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

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground italic">
            Detailed case studies will be published with client permission. All metrics are verifiable and outcomes are sustainable.
          </p>
        </div>
      </div>

      {/* Categories Explanation */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="text-center hover-elevate transition-all">
          <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Individual Reps</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sales professionals improving their territory performance, conversion rates, and execution consistency.
          </p>
        </Card>

        <Card className="text-center hover-elevate transition-all">
          <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Sales Leadership</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Managers and directors building consistent team performance and scalable coaching systems.
          </p>
        </Card>

        <Card className="text-center hover-elevate transition-all">
          <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
            <Award className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Corporate Providers</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Multi-market organizations standardizing execution and making growth predictable across regions.
          </p>
        </Card>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-primary/10 to-destructive/10 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Ready to Write Your Success Story?
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Whether you're a rep looking to sharpen your skills, a leader building a team, or an executive scaling across markets—let's talk about what's not working and build a plan that fixes it.
        </p>
        <a href="mailto:contact@spartancoaching.com" className="inline-block">
          <button className="bg-primary text-primary-foreground font-bold px-8 py-4 rounded-lg hover-elevate transition-all" data-testid="button-contact">
            Schedule a Consultation
          </button>
        </a>
      </div>
    </div>
  );
}
