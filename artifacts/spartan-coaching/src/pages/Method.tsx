import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BackButton } from "@/components/BackButton";
import { Compass, Users, Target, CheckCircle, Shield, Heart, Eye, Lock, Database, UserCheck, ArrowDown, ArrowRight, Flame, Wrench } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

export default function Method() {
  const subjects = [
    {
      title: "Discovery",
      icon: Compass,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      purpose: "Discovery is learning about the contact and their individual needs. This is where we identify what matters to them, what they need help with, and what they require in order to feel confident moving a patient toward hospice.",
      executionStandard: "Ask targeted questions about workflow, decision-making preferences, and patient transition concerns. Listen for the specific language the contact uses to describe their challenges. Document their priorities, communication preferences, and the criteria they use to evaluate a hospice partner. Confirm your understanding before leaving the conversation.",
      measurableOutput: "A completed contact profile that captures the individual's stated needs, preferred communication style, decision-making role, and the specific conditions under which they would feel confident initiating a hospice referral."
    },
    {
      title: "Connecting",
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-800",
      purpose: "Connecting happens after Discovery, once we have learned what the individual needs are. This is where we connect with the contact based on what they told us they need, and we align to how they want to work, communicate, and move decisions forward.",
      executionStandard: "Reference specific needs the contact shared during Discovery. Demonstrate alignment by adapting your communication cadence, format, and content to match their stated preferences. Show how your team operates in ways that fit their workflow, not the other way around. Confirm mutual understanding of how you will work together going forward.",
      measurableOutput: "A documented working agreement that reflects the contact's preferred communication method, frequency, and the specific ways your team will support their workflow. Both sides can describe how the relationship operates."
    },
    {
      title: "Guiding",
      icon: Target,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      borderColor: "border-orange-200 dark:border-orange-800",
      purpose: "Guiding is using the solutions we have as a hospice provider to solve and improve the needs of the contact and the account. This is where we show how we support their goals, reduce friction, and make hospice easier to use for the right patients.",
      executionStandard: "Present specific hospice capabilities that directly address the needs and friction points identified in Discovery. Use real examples, case-level scenarios, or clinical support tools that demonstrate how your team reduces burden and improves outcomes. Make the connection between their problem and your solution unmistakable. Let them see the path, not just hear the pitch.",
      measurableOutput: "The contact can articulate at least one specific way your hospice team solves a problem they previously identified. They understand how to use your services for the patients who qualify, and they see hospice as a tool that makes their job easier."
    },
    {
      title: "Commitment",
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
      purpose: "Commitment is getting the contact and the account to commit to a patient referral. This is where the next step becomes clear action. Who calls, when they call, what triggers the call, and what happens once the referral is made.",
      executionStandard: "Define the referral trigger clearly. What clinical or situational signal tells the contact it is time to call. Establish who makes the call, what information is needed, and what happens on your end once the referral is received. Remove ambiguity from every step. Walk through the process together so the contact knows exactly what to expect.",
      measurableOutput: "A referral pathway document or verbal commitment that names the trigger, the caller, the method, and the follow-up process. The contact can describe when and how they will refer without needing to ask."
    }
  ];

  const fundamentals = [
    {
      title: "Mamba mentality in practice and performance",
      description: "Repetitions on purpose, film review, and one tiny edge recorded after every session. Excellence is not accidental. It is engineered through deliberate, relentless refinement of the craft."
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
      description: "If the work cannot be observed, it cannot be improved. Every activity is documented, repeatable, and designed to be coached. No black boxes, no hidden methods."
    }
  ];

  const ethics = [
    {
      title: "Patient choice is honored at every step",
      icon: Heart,
      description: "Every interaction upholds the patient's right to choose. Autonomy is not a formality. It is the foundation upon which all clinical and commercial activity rests."
    },
    {
      title: "Clinical judgment is supported and never replaced",
      icon: Shield,
      description: "Sales serves clinical excellence. Our frameworks inform and support clinical decision-making, but the clinician's judgment is sovereign and final."
    },
    {
      title: "Privacy is protected by behavior and explained in human language",
      icon: Eye,
      description: "Patient privacy is not merely policy. It is practiced in every conversation, every handoff, every system interaction. We explain it in words anyone can understand."
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
      description: "Data boundaries are absolute. Protected information stays within sanctioned systems. No exceptions, no workarounds, no shortcuts."
    }
  ];

  const traceabilityMap = [
    { mamba: "Prepare with intent", subject: "Discovery", icon: Compass },
    { mamba: "Practice under pressure", subject: "Connecting", icon: Users },
    { mamba: "Measure in the open", subject: "Guiding", icon: Target },
    { mamba: "Finish strong", subject: "Commitment", icon: CheckCircle },
    { mamba: "Honor choice, support clinical judgment, and protect privacy", subject: "Every subject", icon: Shield }
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
          A complete methodology for healthcare sales mastery. Value is discovered, translated, proven, and made official through four disciplined subjects, each governed by ethics that are non-negotiable.
        </p>
        <p className="text-sm text-muted-foreground mt-4 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          Coaching teaches the method. The private Field Kit helps you practice it between sessions — by request and approval, not self-serve checkout.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 lg:space-y-16">
        {/* Mission */}
        <Card className="relative border-2 shadow-lg spacing-card">
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
                  Success in hospice sales requires more than good intentions. It demands structure and consistency. Discipline means having a proven framework for territory planning, objection handling, and follow-up strategies. It's about showing up prepared, executing with precision, and tracking what matters. In practice, this looks like a liaison who knows exactly which accounts to visit on Tuesday, what questions to ask, and how to measure success.
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
                  Strategy is about acting with purpose, not activity for activity's sake. It means using data, market insights, and proven tools to identify the right referral sources and focus your energy where it will have the greatest impact. We help you cut through the noise, prioritize high-value activities, and build a pipeline that serves the patients who need you most. This looks like knowing which five clinics in your territory treat the most heart failure patients and building your week around them.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Strategic Elements:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Data-driven territory analysis and segmentation (not guesswork)</li>
                    <li>Competitive intelligence and market positioning based on real gaps</li>
                    <li>Research and insights tools that save time</li>
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
            <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              This model is built for hospice providers who want referrals to be consistent, appropriate, and repeatable inside an account. Not because someone is "great with people," but because the referral source has a clear path, clear expectations, and a clear reason to call you when the right patient shows up.
            </p>
          </div>

          <Card className="mb-10 spacing-card border-2" data-testid="card-model-context">
            <div className="space-y-4">
              <p className="text-body text-foreground/90 leading-relaxed">
                Hospice referrals do not break because the account does not care. They break because the process is unclear. The triggers are fuzzy. The conversation feels risky. The workflow feels like extra work. This model removes that friction by giving your team a simple, coachable process that works across different roles, different personalities, and different levels of account engagement.
              </p>
              <p className="text-body text-muted-foreground leading-relaxed">
                The model is structured into four subjects. Each subject has a purpose, an execution standard, and a measurable output. We run them in sequence every time, because skipping steps is how you end up "checking in" for six months and calling it relationship building.
              </p>
            </div>
          </Card>

          <div className="relative" data-testid="subjects-container">
            {subjects.map((subject, idx) => {
              const Icon = subject.icon;
              const isLast = idx === subjects.length - 1;
              return (
                <div key={idx} className="relative">
                  <Card className={`border-2 ${subject.borderColor} spacing-card shadow-lg`} data-testid={`card-subject-${idx}`}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`flex-shrink-0 p-3 rounded-md ${subject.bgColor}`}>
                        <Icon className={`w-6 h-6 ${subject.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-h3 font-bold ${subject.color} mb-1`}>{subject.title}</h3>
                        <p className="text-sm text-muted-foreground italic">Subject {idx + 1} of 4</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-sm text-foreground mb-1">Purpose</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{subject.purpose}</p>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-foreground mb-1">Execution Standard</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{subject.executionStandard}</p>
                      </div>

                      <div className={`p-3 rounded-md ${subject.bgColor} border ${subject.borderColor}`}>
                        <h4 className="font-bold text-sm text-foreground mb-1">Measurable Output</h4>
                        <p className="text-sm text-foreground">{subject.measurableOutput}</p>
                      </div>
                    </div>
                  </Card>

                  {!isLast && (
                    <div className="flex justify-center py-3" data-testid={`connector-subject-${idx}`}>
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
              <strong className="text-foreground">Design Version:</strong> 2026-01-15. Field-tested. Prepare with intent. Practice under pressure. Measure in the open. Correct fast. Finish strong. Honor choice. Support clinical judgment. Prove progress in the customer's numbers.
            </p>
          </Card>
        </section>

        {/* Five Fundamentals */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-h2 text-foreground mb-4" data-testid="text-fundamentals-title">Five Fundamentals That Govern Every Subject</h2>
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

        {/* Why the Method Exists */}
        <section>
          <Card className="relative border-2 shadow-lg spacing-card bg-gray-950 border-0">
            <div className="text-center mb-8">
              <h2 className="text-h2 text-white mb-4">Why the Method Exists</h2>
              <p className="text-body-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
                The Spartan Method is not a sales training framework. It is a patient access framework.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[
                {
                  heading: "When Discovery is skipped",
                  outcome: "The rep shows up with a pitch instead of a question. The contact feels sold to. Trust erodes. Referrals stay inconsistent.",
                },
                {
                  heading: "When Connecting is done well",
                  outcome: "The contact knows you understand their workflow. They pick up your calls because they trust that you have something worth hearing.",
                },
                {
                  heading: "When Guiding lands",
                  outcome: "The physician sees hospice as a clinical tool that makes their job easier, not a sales call they have to manage.",
                },
                {
                  heading: "When Commitment is clear",
                  outcome: "A patient who qualifies gets referred when the moment is right. Not someday. Not maybe. On a specific day with a specific next step.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-5 space-y-2">
                  <p className="text-sm font-bold text-red-400 uppercase tracking-wide">{item.heading}</p>
                  <p className="text-body text-white/75 leading-relaxed">{item.outcome}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <p className="text-body-lg text-white/80 font-semibold max-w-2xl mx-auto leading-relaxed">
                Every step of the method exists to reduce the friction between a qualifying patient and the care team that can help them. The rep is the bridge. The method is what keeps the bridge standing.
              </p>
            </div>
          </Card>
        </section>

        {/* Traceability */}
        <section data-testid="section-traceability">
          <div className="text-center mb-12">
            <h2 className="text-h2 text-foreground mb-4" data-testid="text-traceability-title">Traceability</h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              Every principle maps to a subject. The Mamba standard is not separate from the model. It is woven into every step.
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
                      <span className={`text-body font-semibold ${isEthicsRow ? 'text-primary' : 'text-foreground'}`}>{item.subject}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Field Kit bridge */}
        <Card className="border-2 border-primary/25 bg-primary/5 spacing-card" data-testid="section-method-field-kit">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div className="space-y-3 flex-1">
              <h2 className="text-h2 text-foreground">Practice the method in the Field Kit</h2>
              <p className="text-body text-muted-foreground leading-relaxed">
                Coaching installs the system. Between sessions, approved clients and evaluators use the private Field Kit —
                objections, weekly plans, role-play, calculators — to run real territory work. Access is request → approve →
                timed evaluation → continue as a client. Never enter PHI into tools.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="font-bold">
                  <Link href="/request-access">
                    Request Field Kit access <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="font-bold">
                  <Link href="/tools">Field Kit overview</Link>
                </Button>
                <Button asChild variant="ghost" className="font-bold">
                  <Link href="/services">View coaching services</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Closing */}
        <Card className="relative overflow-hidden border-0 shadow-2xl spacing-card bg-gray-950">
          <div className="relative text-center">
            <h3 className="text-h3 text-white mb-6" data-testid="text-closing-title">
              Built in the Field. Proven in Practice.
            </h3>
            <p className="text-body-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-8">
              Every framework, every playbook, every drill we teach has been tested in real hospice markets. This is not theory. It is a traceable system where preparation maps to Discovery, practice maps to Connecting, measurement maps to Guiding, and finishing strong maps to Commitment. The ethics hold it all together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Button asChild className="font-bold" data-testid="button-method-contact">
                <Link href="/contact">
                  Book a strategy call <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="font-bold border-white/30 text-white" data-testid="button-method-request">
                <Link href="/request-access">Request evaluation access</Link>
              </Button>
              <Button asChild variant="ghost" className="font-bold text-white hover:bg-white/10" data-testid="button-method-manifesto">
                <Link href="/manifesto">Read the Spartan Ethos</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
