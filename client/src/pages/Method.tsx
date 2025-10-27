import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BackButton } from "@/components/BackButton";
import { Compass, Users, Target, CheckCircle, Lightbulb, BarChart3, Shield, Heart, Eye } from "lucide-react";

export default function Method() {
  const salesStages = [
    {
      title: "Discovery",
      icon: Compass,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      purpose: "Diagnose how care actually moves, quantify the gaps in the numbers, and earn the next meeting.",
      entry: "Qualified meeting with a stakeholder who can describe the flow of care.",
      exitArtifact: "Discovery Brief in the customer's language.",
      activities: [
        "Ask questions about current provider and patient discharge challenges",
        "Understand workflow, timing windows, and permission to return",
        "Document gaps and pain points in their own words"
      ],
      decisionToAdvance: "Recap confirmed, timing windows known; permission to return."
    },
    {
      title: "Connecting",
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-800",
      purpose: "Turn shared fit into two or three pillars of proof and a first test stretched in the customer's calendar.",
      entry: "Discovery Brief accepted.",
      exitArtifact: "Fit Outline with pillars, proofs, and test sketch.",
      activities: [
        "Create two or three pillars of proof that demonstrate value",
        "Conduct first test stretched in customer's own numbers",
        "Build credibility through clinical case stories"
      ],
      decisionToAdvance: "Agreement to try it where a starting location and named success checks are understood by everyone."
    },
    {
      title: "Guiding",
      icon: Target,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      borderColor: "border-orange-200 dark:border-orange-800",
      purpose: "Fit Outline approved by the people who will own the work.",
      entry: "One Page Plan and two calendars.",
      exitArtifact: "One Page Plan and two calendars.",
      activities: [
        "Reduce risk and show progress quickly in the customer's own numbers",
        "Create simple plan that owners named, access started, success checks understood",
        "Track progress with visible milestones"
      ],
      decisionToAdvance: "Owners named, access started, success checks understood by everyone."
    },
    {
      title: "Commitment",
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
      purpose: "Make premium official while alignment is fresh. Reclaim the sales calendar. Welcome Packet sent.",
      entry: "Face Plan accepted and work own present.",
      exitArtifact: "Signed agreement, Decision to advance, Welcome Packet sent.",
      activities: [
        "Finalize partnership with clear terms and expectations",
        "Send the agreement clearly send the expectations",
        "Deliver Welcome Packet with onboarding materials"
      ],
      decisionToAdvance: "First win stated and scheduled."
    }
  ];

  const fundamentals = [
    {
      title: "Mamba mentality in practice and in performance",
      description: "Relentless focus on execution excellence, not motivational speeches. Practice the fundamentals until they become instinct."
    },
    {
      title: "Plain language that leaders can use the same day",
      description: "No jargon, no buzzwords. Clear, actionable language that can be implemented immediately in the field."
    },
    {
      title: "Minimum necessary data only, with named users only",
      description: "Track what matters, ignore the noise. Every metric has an owner and a purpose."
    },
    {
      title: "Shared definitions and formulas so numbers cannot be gamed",
      description: "Common understanding of what success looks like. Transparent metrics that everyone trusts."
    },
    {
      title: "Visible work that another person can see, repeat, and coach",
      description: "Everything is documented, repeatable, and coachable. No black boxes, no secret sauce."
    }
  ];

  const ethics = [
    {
      title: "Respect understood, not just stated",
      icon: Heart,
      description: "We honor the clinical judgment and workflow of providers. Our frameworks support their work, not disrupt it."
    },
    {
      title: "Clinical judgment is supported and never replaced",
      icon: Shield,
      description: "Sales serves clinical excellence. We help identify appropriate patients, but clinical decisions remain with clinicians."
    },
    {
      title: "Privacy is explained in human language and protected by behavior",
      icon: Eye,
      description: "Patient privacy isn't just policy—it's practiced in every conversation, every handoff, every decision."
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <BackButton />
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent blur-3xl -z-10"></div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-6 sm:mb-8 animate-fade-in-up" data-testid="text-method-title">
          The <span className="text-gradient-primary">Spartan Method</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          A complete methodology for hospice sales excellence. Built on three philosophical pillars and executed through a proven four-stage process.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-16 sm:space-y-20">
        {/* Mission */}
        <Card className="relative overflow-hidden border-2 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="relative p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-4 sm:mb-6">The Spartan Mission</h2>
            <p className="text-base sm:text-lg text-foreground/90 leading-relaxed mb-4 sm:mb-6">
              Spartan Coaching was born in the field. We built teams, ran routes, and sat with clinicians. A pattern emerged: good people failed not because they cared too little, but because the system around them was noisy, complex, and rewarded the wrong activities. We fixed the system. We kept what worked and cut the rest.
            </p>
            <p className="text-base sm:text-lg text-foreground/90 leading-relaxed">
              To us, 'Spartan' means a disciplined commitment to a higher purpose. It's about preparing with intent, practicing under pressure, and measuring progress in the open. Our method is built on clarity, compassionate accountability, and a relentless focus on patient-first outcomes.
            </p>
          </div>
        </Card>

        {/* Three Pillars */}
        <section>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-3 sm:mb-4 text-center">The Three Pillars</h2>
          <p className="text-center text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto">
            The philosophical foundation that guides everything we do
          </p>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="discipline">
              <AccordionTrigger className="text-2xl font-bold text-primary hover:text-primary/80">
                Discipline
              </AccordionTrigger>
              <AccordionContent className="text-foreground leading-relaxed pt-4 space-y-4">
                <p>
                  Success in hospice sales requires more than good intentions—it demands structure and consistency. Discipline means having a proven framework for territory planning, objection handling, and follow-up strategies. It's about showing up prepared, executing with precision, and tracking what matters. In practice, this looks like a liaison who knows exactly which accounts to visit on Tuesday, what questions to ask, and how to measure success.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Key Components:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Weekly territory planning with clear objectives and named accounts</li>
                    <li>Standardized call preparation and follow-up protocols that fit clinical workflows</li>
                    <li>Metrics tracking for activity and outcomes (not vanity numbers)</li>
                    <li>Continuous skill development through deliberate practice, not hope</li>
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
                  At the heart of hospice sales is human connection. Empathy is about listening with intent, understanding the unspoken needs of providers and families, and building trust that goes beyond any single referral. We train you to connect authentically, ask better questions, and position hospice not as a product, but as a partner in delivering comfort and dignity. This means understanding that a case manager at 2pm on Friday has different needs than a physician at 8am Monday morning.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Core Practices:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Active listening techniques for clinical conversations (not sales pitches)</li>
                    <li>Understanding provider pain points and workflow constraints</li>
                    <li>Building long-term relationships over transactional wins</li>
                    <li>Patient-centered communication that honors dignity and choice</li>
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
                  Strategy is about acting with purpose, not activity for activity's sake. It means using data, market insights, and AI-powered tools to identify the right referral sources and focus your energy where it will have the greatest impact. We help you cut through the noise, prioritize high-value activities, and build a pipeline that serves the patients who need you most. This looks like knowing which five clinics in your territory treat the most heart failure patients and building your week around them.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Strategic Elements:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Data-driven territory analysis and segmentation (not guesswork)</li>
                    <li>Competitive intelligence and market positioning based on real gaps</li>
                    <li>AI-powered research and insights tools that save time</li>
                    <li>Intentional account prioritization based on patient impact and referral potential</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Healthcare Sales Mastery Model */}
        <section>
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-3 sm:mb-4">Healthcare Sales Mastery Model</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              The four-stage process that turns philosophy into practice. Each stage has a single purpose, a clear entry condition, disciplined activities, a visible exit artifact, and a single decision that advances the work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
            {salesStages.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <Card key={idx} className={`border-2 ${stage.borderColor} hover:shadow-2xl transition-elegant group relative overflow-hidden`} data-testid={`card-stage-${idx}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-6">
                    <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${stage.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stage.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-2xl font-bold ${stage.color} mb-1`}>{stage.title}</h3>
                      <p className="text-sm text-muted-foreground italic">Stage {idx + 1} of 4</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-foreground mb-1">Purpose</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{stage.purpose}</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-foreground mb-1">Entry</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{stage.entry}</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-foreground mb-1">Activities</h4>
                      <ul className="space-y-1">
                        {stage.activities.map((activity, aIdx) => (
                          <li key={aIdx} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span className="text-sm text-muted-foreground">{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={`p-3 rounded-lg ${stage.bgColor} border ${stage.borderColor}`}>
                      <h4 className="font-bold text-sm text-foreground mb-1">Exit Artifact</h4>
                      <p className="text-sm text-foreground">{stage.exitArtifact}</p>
                    </div>

                    <div className="pt-2 border-t">
                      <h4 className="font-bold text-sm text-foreground mb-1">Decision to Advance</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{stage.decisionToAdvance}</p>
                    </div>
                  </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="bg-muted/30 text-center">
            <p className="text-sm text-muted-foreground italic">
              <strong className="text-foreground">Design Version:</strong> 2025-10-13. Field-tested. Prepare with intent. Practice under pressure. Measure in the open. Correct fast. Finish strong. Honor choice. Support clinical judgment. Prove progress in the customer's numbers.
            </p>
          </Card>
        </section>

        {/* Five Fundamentals */}
        <section>
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-3 sm:mb-4">Five Fundamentals That Govern Every Stage</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              These principles anchor every activity, every conversation, every decision
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {fundamentals.map((fundamental, idx) => (
              <Card key={idx} className="hover:shadow-2xl transition-elegant border-2 group" data-testid={`card-fundamental-${idx}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-2">{fundamental.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{fundamental.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Ethics */}
        <section>
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-3 sm:mb-4">Ethics That Anchor The Model</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              These values are non-negotiable and visible in every interaction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {ethics.map((ethic, idx) => {
              const Icon = ethic.icon;
              return (
                <Card key={idx} className="text-center hover:shadow-2xl transition-elegant border-2 group relative overflow-hidden" data-testid={`card-ethic-${idx}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-3">{ethic.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{ethic.description}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Closing */}
        <Card className="relative overflow-hidden border-2 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="relative p-6 sm:p-8 text-center">
            <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-4 sm:mb-6">
              Built in the Field, Proven in Practice
            </h3>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
              Every framework, every playbook, every drill we teach has been tested in real-world hospice sales. This isn't theory—it's battle-tested strategy designed to help you win with integrity.
            </p>
            <p className="text-sm text-muted-foreground italic">
              The Spartan Method: Where discipline, empathy, and strategy meet execution.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
