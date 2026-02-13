import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BackButton } from "@/components/BackButton";
import { Compass, Users, Target, CheckCircle, Shield, Heart, Eye, Lock, Database, UserCheck, AlertTriangle, ArrowDown, ArrowRight, Flame } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Method() {
  const salesStages = [
    {
      title: "Discovery",
      icon: Compass,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      purpose: "Learn how care actually moves, quantify friction in the customer's numbers, and earn the next meeting.",
      entry: "A qualified meeting with a stakeholder who can describe the flow of care.",
      standardWork: [
        "Set the aim for the engagement",
        "Map the path from first signal to first visit or appropriate alternative",
        "Land three frictions as a time, a rate, and a count — using ranges first",
        "Identify roles and the decision path",
        "Surface constraints worth respecting",
        "Deliver a ninety-second recap in their language"
      ],
      exitArtifact: "Discovery Brief confirmed by the customer.",
      decisionLabel: "Decision to Advance",
      decisionToAdvance: "Recap confirmed, timing windows known, permission to return for a fit review."
    },
    {
      title: "Connecting",
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-800",
      purpose: "Translate Discovery into two or three fit pillars with believable proof and a first test sketched in the customer's language.",
      entry: "Discovery Brief accepted by the people who will own the work.",
      standardWork: [
        "Deliver a sixty-second recap of Discovery findings",
        "Present two or three pillars that map one-to-one with outcomes they named",
        "Show one proof per pillar",
        "Invite live edits to co-author the language",
        "Sketch the first test and the measures the customer already tracks"
      ],
      exitArtifact: "Fit Outline with pillars, proofs, and a first test sketch.",
      decisionLabel: "Decision to Advance",
      decisionToAdvance: "Agreement to try it here with a starting location and named access."
    },
    {
      title: "Guiding",
      icon: Target,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      borderColor: "border-orange-200 dark:border-orange-800",
      purpose: "Turn shared fit into a small plan that reduces risk and shows progress in the customer's numbers.",
      entry: "Fit Outline approved by the people who will own the work.",
      standardWork: [
        "Write a One Page Plan in the customer's language",
        "Assign owners and dates",
        "Start privacy and access steps",
        "Define success checks with the exact data source",
        "Place a midpoint review and a decision review on calendars before the meeting ends"
      ],
      exitArtifact: "One Page Plan and two calendar links.",
      decisionLabel: "Decision to Advance",
      decisionToAdvance: "Owners named, access started, success checks understood by everyone."
    },
    {
      title: "Commitment",
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
      purpose: "Make momentum official while alignment is fresh.",
      entry: "One Page Plan accepted and owners present.",
      standardWork: [
        "Restate the plan and privacy posture in plain language",
        "Send the correct agreement while sharing screens and confirm the signature path",
        "Book kickoff and confirm acceptance while present",
        "Deliver the Welcome Packet within two hours",
        "State the first visible win and schedule it"
      ],
      exitArtifact: "Signed agreement, kickoff on calendar, Welcome Packet sent.",
      decisionLabel: "Decision to Finish",
      decisionToAdvance: "First visible win stated and scheduled."
    }
  ];

  const fundamentals = [
    {
      title: "Mamba mentality in practice and performance",
      description: "Repetitions on purpose, film review, and one tiny edge recorded after every session. Excellence is not accidental — it is engineered through deliberate, relentless refinement of the craft."
    },
    {
      title: "Plain language that busy clinical leaders can use the same day",
      description: "No jargon, no abstractions. Every word earns its place. Communication lands when it is clear enough to act on immediately, in the hallway or at the bedside."
    },
    {
      title: "Minimum necessary data with named users only",
      description: "Track what matters, discard the noise. Every data point has a purpose, every user has a name, and every access decision is intentional and auditable."
    },
    {
      title: "Shared definitions and formulas, so numbers cannot be gamed",
      description: "When everyone agrees on how success is measured, trust follows. Transparent metrics eliminate ambiguity and create a foundation for honest progress."
    },
    {
      title: "Visible work that another person can see, repeat, and coach",
      description: "If the work cannot be observed, it cannot be improved. Every activity is documented, repeatable, and designed to be coached — no black boxes, no hidden methods."
    }
  ];

  const ethics = [
    {
      title: "Patient choice is honored at every step",
      icon: Heart,
      description: "Every interaction upholds the patient's right to choose. Autonomy is not a formality — it is the foundation upon which all clinical and commercial activity rests."
    },
    {
      title: "Clinical judgment is supported and never replaced",
      icon: Shield,
      description: "Sales serves clinical excellence. Our frameworks inform and support clinical decision-making, but the clinician's judgment is sovereign and final."
    },
    {
      title: "Privacy is protected by behavior and explained in human language",
      icon: Eye,
      description: "Patient privacy is not merely policy — it is practiced in every conversation, every handoff, every system interaction. We explain it in words anyone can understand."
    },
    {
      title: "Only the minimum necessary data is used",
      icon: Database,
      description: "Data discipline is non-negotiable. We collect only what is required, retain only what is justified, and treat every data point as a responsibility, not an asset."
    },
    {
      title: "Only named users have access",
      icon: UserCheck,
      description: "Access is personal and accountable. Every user is identified by name, every permission is intentional, and anonymous access does not exist in our systems."
    },
    {
      title: "No protected information leaves approved systems",
      icon: Lock,
      description: "Data boundaries are absolute. Protected information stays within sanctioned systems — no exceptions, no workarounds, no shortcuts."
    }
  ];

  const traceabilityMap = [
    { mamba: "Prepare with intent", stage: "Discovery", icon: Compass },
    { mamba: "Practice under pressure", stage: "Connecting", icon: Users },
    { mamba: "Measure in the open", stage: "Guiding", icon: Target },
    { mamba: "Finish strong", stage: "Commitment", icon: CheckCircle },
    { mamba: "Honor choice, support clinical judgment, and protect privacy", stage: "Every stage", icon: Shield }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <BackButton />
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent blur-3xl -z-10"></div>
        <h1 className="text-hero text-foreground mb-8 animate-fade-in-up" data-testid="text-method-title">
          The <span className="text-gradient-primary">Spartan Method</span>
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          A complete methodology for healthcare sales mastery. Value is discovered, translated, proven, and made official through four disciplined stages — each governed by ethics that are non-negotiable.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 lg:space-y-16">
        {/* Mission */}
        <Card className="relative overflow-hidden border-2 shadow-2xl spacing-card">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="relative">
            <h2 className="text-h2 text-foreground mb-6">The Spartan Mission</h2>
            <p className="text-body-lg text-foreground/90 leading-relaxed mb-6">
              Spartan Coaching was born in the field. We built teams, ran routes, and sat with clinicians. A pattern emerged: good people failed not because they cared too little, but because the system around them was noisy, complex, and rewarded the wrong activities. We fixed the system. We kept what worked and cut the rest.
            </p>
            <p className="text-body-lg text-foreground/90 leading-relaxed">
              To us, 'Spartan' means a disciplined commitment to a higher purpose. It's about preparing with intent, practicing under pressure, and measuring progress in the open. Our method is built on clarity, compassionate accountability, and a relentless focus on patient-first outcomes.
            </p>
          </div>
        </Card>

        {/* Three Pillars */}
        <section>
          <h2 className="text-h2 text-foreground mb-4 text-center">The Three Pillars</h2>
          <p className="text-center text-body-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            The philosophical foundation that guides everything we do
          </p>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="discipline">
              <AccordionTrigger className="text-h3 font-bold text-primary hover:text-primary/80">
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
              <AccordionTrigger className="text-h3 font-bold text-primary hover:text-primary/80">
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
              <AccordionTrigger className="text-h3 font-bold text-primary hover:text-primary/80">
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
          <div className="text-center mb-12">
            <h2 className="text-h2 text-foreground mb-4" data-testid="text-mastery-model-title">Healthcare Sales Mastery Model</h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              Four stages that turn philosophy into measurable practice. Each stage has a clear purpose, a defined entry condition, disciplined standard work, a visible exit artifact, and a single decision that advances the work.
            </p>
          </div>

          {/* Quality Gate Rule */}
          <Card className="mb-10 border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 spacing-card" data-testid="card-quality-gate">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 rounded-md bg-amber-100 dark:bg-amber-900/40">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-h3 text-foreground mb-2">Quality Gate Rule</h3>
                <p className="text-body text-foreground/90 leading-relaxed font-medium">
                  Entry is permission. Exit is an artifact. If the artifact is missing, the stage is not complete.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This rule governs every stage transition. No exceptions, no shortcuts. The artifact proves the work was done.
                </p>
              </div>
            </div>
          </Card>

          {/* Stages - Vertical Sequential Flow */}
          <div className="relative" data-testid="stages-container">
            {salesStages.map((stage, idx) => {
              const Icon = stage.icon;
              const isLast = idx === salesStages.length - 1;
              return (
                <div key={idx} className="relative">
                  <Card className={`border-2 ${stage.borderColor} spacing-card shadow-lg`} data-testid={`card-stage-${idx}`}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`flex-shrink-0 p-3 rounded-md ${stage.bgColor}`}>
                        <Icon className={`w-6 h-6 ${stage.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-h3 font-bold ${stage.color} mb-1`}>{stage.title}</h3>
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
                        <h4 className="font-bold text-sm text-foreground mb-1">Standard Work</h4>
                        <ul className="space-y-1">
                          {stage.standardWork.map((item, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span className="text-sm text-muted-foreground">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className={`p-3 rounded-md ${stage.bgColor} border ${stage.borderColor}`}>
                        <h4 className="font-bold text-sm text-foreground mb-1">Exit Artifact</h4>
                        <p className="text-sm text-foreground">{stage.exitArtifact}</p>
                      </div>

                      <div className="pt-2 border-t">
                        <h4 className="font-bold text-sm text-foreground mb-1">{stage.decisionLabel}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{stage.decisionToAdvance}</p>
                      </div>
                    </div>
                  </Card>

                  {!isLast && (
                    <div className="flex justify-center py-3" data-testid={`connector-stage-${idx}`}>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-0.5 h-4 bg-muted-foreground/30"></div>
                        <ArrowDown className="w-5 h-5 text-muted-foreground/50" />
                        <div className="w-0.5 h-4 bg-muted-foreground/30"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Card className="bg-muted/30 text-center spacing-card mt-8">
            <p className="text-sm text-muted-foreground italic">
              <strong className="text-foreground">Design Version:</strong> 2025-10-13. Field-tested. Prepare with intent. Practice under pressure. Measure in the open. Correct fast. Finish strong. Honor choice. Support clinical judgment. Prove progress in the customer's numbers.
            </p>
          </Card>
        </section>

        {/* Five Fundamentals */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-h2 text-foreground mb-4" data-testid="text-fundamentals-title">Five Fundamentals That Govern Every Stage</h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              These principles anchor every activity, every conversation, every decision
            </p>
          </div>

          <div className="grid gap-4">
            {fundamentals.map((fundamental, idx) => (
              <Card key={idx} className="border-2 spacing-card shadow-lg" data-testid={`card-fundamental-${idx}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-base font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-h3 text-foreground mb-2">{fundamental.title}</h3>
                    <p className="text-body text-muted-foreground leading-relaxed">{fundamental.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Ethics */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-h2 text-foreground mb-4" data-testid="text-ethics-title">Ethics That Anchor The Model</h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              These values are non-negotiable and visible in every interaction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-cards">
            {ethics.map((ethic, idx) => {
              const Icon = ethic.icon;
              return (
                <Card key={idx} className="text-center border-2 spacing-card shadow-lg" data-testid={`card-ethic-${idx}`}>
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-spartan-gradient shadow-lg">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-h3 text-foreground mb-3">{ethic.title}</h3>
                  <p className="text-body text-muted-foreground leading-relaxed">{ethic.description}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Traceability */}
        <section data-testid="section-traceability">
          <div className="text-center mb-12">
            <h2 className="text-h2 text-foreground mb-4" data-testid="text-traceability-title">Traceability</h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              Every principle maps to a stage. The Mamba standard is not separate from the model — it is woven into every step.
            </p>
          </div>

          <div className="grid gap-3">
            {traceabilityMap.map((item, idx) => {
              const Icon = item.icon;
              const isEthicsRow = idx === traceabilityMap.length - 1;
              return (
                <Card
                  key={idx}
                  className={`border-2 spacing-card ${isEthicsRow ? 'border-primary/30 bg-primary/5' : ''}`}
                  data-testid={`card-traceability-${idx}`}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                      <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                      <span className="text-body font-medium text-foreground">{item.mamba}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex items-center gap-3 flex-1 min-w-[160px]">
                      <div className="p-2 rounded-md bg-muted/50">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className={`text-body font-semibold ${isEthicsRow ? 'text-primary' : 'text-foreground'}`}>{item.stage}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Closing */}
        <Card className="relative overflow-hidden border-2 shadow-2xl spacing-card">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="relative text-center">
            <h3 className="text-h3 text-foreground mb-6" data-testid="text-closing-title">
              Built in the Field, Proven in Practice
            </h3>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
              Every framework, every playbook, every drill we teach has been tested in real-world healthcare sales. This is not theory — it is a traceable system where preparation maps to Discovery, pressure maps to Connecting, measurement maps to Guiding, and finishing strong maps to Commitment. The ethics hold it all together.
            </p>
            <p className="text-sm text-muted-foreground italic">
              The Spartan Method: Where discipline, empathy, and strategy meet execution — and every step traces back to purpose.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
