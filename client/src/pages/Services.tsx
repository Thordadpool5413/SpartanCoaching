import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/icons";
import { InquiryForm } from "@/components/InquiryForm";
import { BackButton } from "@/components/BackButton";
import { Users, Building2, UserCheck } from "lucide-react";

export default function Services() {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");

  const individualServices = [
    {
      title: "Virtual Coaching Sessions",
      duration: "30 or 60 minutes",
      price: "$40 / $70",
      problem: "You're stuck on a specific challenge—an objection you can't handle, a territory that isn't producing, or a referral partner who won't commit.",
      solution: "Focused coaching via Teams or Zoom to fix what's broken right now.",
      includes: [
        "Prep form to identify the exact problem",
        "Live session with role-play and real scenarios",
        "One-page action plan for immediate implementation",
        "Recording for review (60 min sessions)",
      ],
      outcome: "Walk away with a clear next step you can execute Tuesday morning.",
    },
    {
      title: "Field Coaching Ridealongs",
      duration: "Half or full day",
      price: "Custom pricing",
      problem: "You know what to say in theory, but it doesn't land in real conversations. You need live feedback, not more classroom training.",
      solution: "I ride with you to actual sales calls—hospitals, clinics, facilities—and coach you in real time.",
      includes: [
        "Pre-call to set specific goals for the day",
        "Live observation of 4-6 sales interactions",
        "Real-time coaching between calls",
        "Debrief with written action summary and talk tracks",
      ],
      outcome: "See exactly what works in the field and practice it until it's repeatable.",
    },
    {
      title: "Territory Management Coaching",
      duration: "2-3 sessions",
      price: "Custom pricing",
      problem: "Your calendar is full but your pipeline isn't moving. You're busy but not productive.",
      solution: "Build a territory plan that focuses effort where it actually converts.",
      includes: [
        "Territory analysis: who refers, who should, who's wasting your time",
        "Account prioritization system (A/B/C classification)",
        "Weekly routing plan for maximum efficiency",
        "Follow-up cadence that prevents dropped balls",
      ],
      outcome: "Spend less time driving, more time with decision-makers who can say yes.",
    },
  ];

  const leadershipServices = [
    {
      title: "Team Training Workshops",
      duration: "1-2 days",
      price: "Custom pricing",
      problem: "Your team knows they should be doing better, but they don't have a shared system. Everyone's running their own playbook.",
      solution: "Intensive on-site or virtual training that teaches your entire team the same execution framework.",
      includes: [
        "Customized curriculum based on your market and challenges",
        "Live practice with objection handling and discovery",
        "Territory planning workshop with real accounts",
        "Written playbook your team can reference daily",
      ],
      outcome: "Your team speaks the same language, uses the same process, and coaches each other up.",
    },
    {
      title: "Leadership Coaching",
      duration: "Monthly or quarterly",
      price: "Custom pricing",
      problem: "You're managing by results instead of coaching to behaviors. When numbers are down, you don't know what to fix.",
      solution: "Learn to coach one skill at a time, run effective pipeline reviews, and build team rhythm that survives turnover.",
      includes: [
        "1:1 coaching on skill-based management",
        "Pipeline review framework that drives action",
        "Weekly huddle structure (5 minutes that matter)",
        "Scorecard design: what to measure, how to use it",
      ],
      outcome: "You'll know what good looks like, how to spot it, and how to coach your team to it.",
    },
    {
      title: "Growth Strategy Consulting",
      duration: "3-6 months",
      price: "Custom pricing",
      problem: "You're not sure where growth will come from. You need a plan that's specific, not aspirational.",
      solution: "Identify where referrals should come from, build the system to capture them, and measure what matters.",
      includes: [
        "Market analysis: diagnosis mix, competitor positioning, referral patterns",
        "Growth opportunity identification (untapped accounts, diagnosis gaps)",
        "Sales process redesign for faster conversions",
        "Quarterly reviews to track progress and adjust",
      ],
      outcome: "A repeatable system for growth that doesn't depend on hope or heroics.",
    },
  ];

  const corporateServices = [
    {
      title: "Market & Territory Analysis",
      duration: "4-6 weeks",
      price: "Custom pricing",
      problem: "You don't know where referrals are coming from, where they should be coming from, or why the gap exists.",
      solution: "Deep analysis of your markets to understand what's working, what's broken, and where opportunity lives.",
      includes: [
        "Referral source analysis by market and diagnosis",
        "Competitor positioning and market share assessment",
        "Territory design: account assignment, routing optimization",
        "Top 10 growth opportunities with action plans",
      ],
      outcome: "You'll know exactly where to focus resources for the highest return.",
    },
    {
      title: "System Implementation & Training",
      duration: "3-6 months",
      price: "Custom pricing",
      problem: "You have markets performing differently with no standard process. Wins aren't repeatable and you can't scale what's working.",
      solution: "Install a repeatable sales system across all markets so execution is consistent and results are predictable.",
      includes: [
        "Sales process design and documentation",
        "Team training rollout (virtual or on-site)",
        "Leadership coaching for local managers",
        "Performance tracking system and dashboards",
      ],
      outcome: "Every market runs the same playbook. You can see what's working and replicate it.",
    },
    {
      title: "Executive Consulting",
      duration: "Ongoing retainer",
      price: "Custom pricing",
      problem: "You need strategic guidance for growth, M&A integration, or performance turnarounds—not generic consulting, but hospice-specific expertise.",
      solution: "Ongoing access to senior-level strategic consulting for complex challenges.",
      includes: [
        "Monthly strategic planning sessions",
        "Market expansion and acquisition guidance",
        "Sales force effectiveness audits",
        "Crisis response and performance turnarounds",
      ],
      outcome: "Make better decisions faster with someone who knows hospice sales inside and out.",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
      <BackButton />
      
      <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent blur-3xl -z-10"></div>
        <h1 className="text-hero text-foreground mb-8 animate-fade-in-up" data-testid="text-services-title">
          Services Built for <span className="text-gradient-primary">Hospice Sales</span>
        </h1>
        <p className="text-body-lg text-muted-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          No motivational speeches. No one-size-fits-all programs. Just practical systems that work on Tuesday afternoon when the clinic is short-staffed and the family is scared.
        </p>
        <p className="text-body text-muted-foreground/80 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Whether you're an individual rep sharpening your skills, a leader building a team, or a corporate executive scaling across markets—we have services designed for where you are.
        </p>
      </div>

      {/* Individual Sales Reps Section */}
      <div className="space-y-8 md:space-y-12 lg:space-y-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-spartan-gradient flex items-center justify-center shadow-2xl flex-shrink-0">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-h2 text-foreground mb-1">For Individual Sales Reps</h2>
            <p className="text-body text-muted-foreground">Get better at the job you're doing right now.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-cards">
          {individualServices.map((service, idx) => (
            <Card key={idx} className="flex flex-col hover:shadow-2xl transition-elegant border-2 group relative overflow-hidden spacing-card" data-testid={`card-individual-${idx}`}>
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex-1">
                <h3 className="text-h3 font-bold text-foreground mb-3">{service.title}</h3>
                <div className="flex items-baseline gap-3 mb-6">
                  <p className="text-3xl font-black text-primary">{service.price}</p>
                  <p className="text-sm text-muted-foreground">{service.duration}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Problem:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.problem}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Solution:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.solution}</p>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-semibold text-foreground mb-3">What's Included:</p>
                  <ul className="space-y-2">
                    {service.includes.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-accent/30 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold text-foreground mb-2">Outcome:</p>
                  <p className="text-sm text-muted-foreground">{service.outcome}</p>
                </div>
              </div>

              <Button
                className="w-full font-bold mt-auto"
                data-testid={`button-book-individual-${idx}`}
                onClick={() => {
                  setSelectedService(service.title);
                  setInquiryOpen(true);
                }}
              >
                Get Started
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Sales Leadership Section */}
      <div className="space-y-8 md:space-y-12 lg:space-y-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-spartan-gradient flex items-center justify-center shadow-2xl flex-shrink-0">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-h2 text-foreground mb-1">For Sales Leadership</h2>
            <p className="text-body text-muted-foreground">Build teams that execute consistently and scale what works.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-cards">
          {leadershipServices.map((service, idx) => (
            <Card key={idx} className="flex flex-col hover:shadow-2xl transition-elegant border-2 group relative overflow-hidden spacing-card" data-testid={`card-leadership-${idx}`}>
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex-1">
                <h3 className="text-h3 font-bold text-foreground mb-3">{service.title}</h3>
                <div className="flex items-baseline gap-3 mb-6">
                  <p className="text-3xl font-black text-primary">{service.price}</p>
                  <p className="text-sm text-muted-foreground">{service.duration}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Problem:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.problem}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Solution:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.solution}</p>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-semibold text-foreground mb-3">What's Included:</p>
                  <ul className="space-y-2">
                    {service.includes.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-accent/30 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold text-foreground mb-2">Outcome:</p>
                  <p className="text-sm text-muted-foreground">{service.outcome}</p>
                </div>
              </div>

              <Button
                className="w-full font-bold mt-auto"
                data-testid={`button-book-leadership-${idx}`}
                onClick={() => {
                  setSelectedService(service.title);
                  setInquiryOpen(true);
                }}
              >
                Get Started
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Corporate Providers Section */}
      <div className="space-y-8 md:space-y-12 lg:space-y-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-spartan-gradient flex items-center justify-center shadow-2xl flex-shrink-0">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-h2 text-foreground mb-1">For Corporate Hospice Providers</h2>
            <p className="text-body text-muted-foreground">Scale execution across markets and make growth predictable.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-cards">
          {corporateServices.map((service, idx) => (
            <Card key={idx} className="flex flex-col hover:shadow-2xl transition-elegant border-2 group relative overflow-hidden spacing-card" data-testid={`card-corporate-${idx}`}>
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex-1">
                <h3 className="text-h3 font-bold text-foreground mb-3">{service.title}</h3>
                <div className="flex items-baseline gap-3 mb-6">
                  <p className="text-3xl font-black text-primary">{service.price}</p>
                  <p className="text-sm text-muted-foreground">{service.duration}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Problem:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.problem}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">The Solution:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.solution}</p>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-semibold text-foreground mb-3">What's Included:</p>
                  <ul className="space-y-2">
                    {service.includes.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-accent/30 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold text-foreground mb-2">Outcome:</p>
                  <p className="text-sm text-muted-foreground">{service.outcome}</p>
                </div>
              </div>

              <Button
                className="w-full font-bold mt-auto"
                data-testid={`button-book-corporate-${idx}`}
                onClick={() => {
                  setSelectedService(service.title);
                  setInquiryOpen(true);
                }}
              >
                Get Started
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent rounded-3xl p-8 sm:p-10 md:p-12 text-center overflow-hidden border-2 border-red-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="relative">
          <h2 className="text-h2 text-foreground mb-4 sm:mb-6">
            Not Sure Which Service Fits?
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10">
            Every engagement starts with understanding your specific challenge. Let's talk about what's not working and build a plan that fixes it.
          </p>
          <Button
            size="lg"
            className="font-bold text-base px-8 sm:px-10 py-6 shadow-xl glow-primary-hover"
            data-testid="button-contact-us"
            onClick={() => {
              setSelectedService("");
              setInquiryOpen(true);
            }}
          >
            Schedule a Consultation
          </Button>
        </div>
      </div>

      <InquiryForm
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        defaultServiceType={selectedService}
      />
    </div>
  );
}
