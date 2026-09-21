import { BackButton } from "@/components/BackButton";
import {
  Compass, Users, Target, CheckCircle, Shield, Heart, Eye, Lock,
  Database, UserCheck, ArrowRight, Flame
} from "lucide-react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";

export default function Method() {
  const subjects = [
    {
      title: "Discovery",
      icon: Compass,
      purpose: "Discovery is learning about the contact and their individual needs. This is where we identify what matters to them, what they need help with, and what they require in order to feel confident moving a patient toward hospice.",
      executionStandard: "Ask targeted questions about workflow, decision-making preferences, and patient transition concerns. Listen for the specific language the contact uses to describe their challenges. Document their priorities, communication preferences, and the criteria they use to evaluate a hospice partner. Confirm your understanding before leaving the conversation.",
      measurableOutput: "A completed contact profile that captures the individual's stated needs, preferred communication style, decision-making role, and the specific conditions under which they would feel confident initiating a hospice referral."
    },
    {
      title: "Connecting",
      icon: Users,
      purpose: "Connecting happens after Discovery, once we have learned what the individual needs are. This is where we connect with the contact based on what they told us they need, and we align to how they want to work, communicate, and move decisions forward.",
      executionStandard: "Reference specific needs the contact shared during Discovery. Demonstrate alignment by adapting your communication cadence, format, and content to match their stated preferences. Show how your team operates in ways that fit their workflow, not the other way around. Confirm mutual understanding of how you will work together going forward.",
      measurableOutput: "A documented working agreement that reflects the contact's preferred communication method, frequency, and the specific ways your team will support their workflow. Both sides can describe how the relationship operates."
    },
    {
      title: "Guiding",
      icon: Target,
      purpose: "Guiding is using the solutions we have as a hospice provider to solve and improve the needs of the contact and the account. This is where we show how we support their goals, reduce friction, and make hospice easier to use for the right patients.",
      executionStandard: "Present specific hospice capabilities that directly address the needs and friction points identified in Discovery. Use real examples, case-level scenarios, or clinical support tools that demonstrate how your team reduces burden and improves outcomes. Make the connection between their problem and your solution unmistakable. Let them see the path, not just hear the pitch.",
      measurableOutput: "The contact can articulate at least one specific way your hospice team solves a problem they previously identified. They understand how to use your services for the patients who qualify, and they see hospice as a tool that makes their job easier."
    },
    {
      title: "Commitment",
      icon: CheckCircle,
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
    <div className="page-persuasion w-full surface-page bg-background text-foreground">
      <SEO />

      {/* Navigation Band */}
      <div className="max-w-6xl mx-auto px-6 py-6 border-b border-border">
        <BackButton />
      </div>

      {/* Hero */}
      <section className="py-20 md:py-32 border-b border-border bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <div className="fi-kicker mb-8 animate-fade-in-up">Methodology</div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight text-foreground leading-[0.95] mb-10 animate-fade-in-up" data-testid="text-method-title">
            The <span className="text-primary">Spartan Method</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground/85 leading-relaxed max-w-3xl font-medium animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            A complete methodology for hospice sales mastery. Value is discovered, translated, proven, and made official through four disciplined subjects — each governed by ethics that are non-negotiable.
          </p>
          <div className="mt-10 p-6 bg-muted/30 border-l-4 border-primary inline-block animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <p className="text-sm text-foreground/70 font-mono leading-relaxed max-w-2xl uppercase tracking-wide">
              Coaching installs the method. Practice happens in the field — with human accountability, not a software pitch.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="border-b border-border bg-muted/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-[minmax(0,1fr)_1.5fr] items-stretch">
            <div className="py-16 md:py-24 md:pr-16 border-b md:border-b-0 md:border-r border-border">
              <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase mb-6">
                The Spartan <br /><span className="text-primary">Mission</span>
              </h2>
            </div>
            <div className="py-16 md:py-24 md:pl-16 space-y-6 text-lg md:text-xl text-foreground/90 leading-relaxed">
              <p>
                Spartan Coaching was born in the field. We built teams, ran routes, and sat with clinicians. A pattern emerged: good people failed not because they cared too little, but because the system around them was noisy, complex, and rewarded the wrong activities. We fixed the system. We kept what worked and cut the rest.
              </p>
              <p>
                To us, 'Spartan' means a disciplined commitment to a higher purpose. It's about preparing with intent, practicing under pressure, and measuring progress in the open. Our method is built on clarity, compassionate accountability, and a relentless focus on patient-first outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="py-20 md:py-32 border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-24">
            <div>
              <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-6 tracking-tight text-foreground uppercase">
                The Three <br /><span className="text-primary">Pillars</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                The philosophical foundation that guides everything we do.
              </p>
            </div>

            <div className="space-y-16">
              {/* Discipline */}
              <div>
                <h3 className="font-mono text-sm font-bold tracking-widest text-primary uppercase mb-4 border-b border-border pb-4 flex items-center justify-between">
                  <span>01</span>
                  <span>Discipline</span>
                </h3>
                <p className="text-lg text-foreground/90 leading-relaxed mb-6">
                  Success in hospice sales requires more than good intentions. It demands structure and consistency. Discipline means having a proven framework for territory planning, objection handling, and follow-up strategies. It's about showing up prepared, executing with precision, and tracking what matters. In practice, this looks like a liaison who knows exactly which accounts to visit on Tuesday, what questions to ask, and how to measure success.
                </p>
                <div className="bg-muted/30 p-6 border-l-2 border-primary">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground mb-4">Key Components</h4>
                  <ul className="space-y-3 text-sm text-foreground/80">
                    <li className="flex gap-3"><span className="text-primary mt-0.5 opacity-50">■</span> Weekly territory planning with clear objectives and named accounts</li>
                    <li className="flex gap-3"><span className="text-primary mt-0.5 opacity-50">■</span> Standardized call preparation and follow-up protocols that fit clinical workflows</li>
                    <li className="flex gap-3"><span className="text-primary mt-0.5 opacity-50">■</span> Metrics tracking for activity and outcomes (not vanity numbers)</li>
                    <li className="flex gap-3"><span className="text-primary mt-0.5 opacity-50">■</span> Continuous skill development through deliberate practice, not hope</li>
                  </ul>
                </div>
              </div>

              {/* Empathy */}
              <div>
                <h3 className="font-mono text-sm font-bold tracking-widest text-primary uppercase mb-4 border-b border-border pb-4 flex items-center justify-between">
                  <span>02</span>
                  <span>Empathy</span>
                </h3>
                <p className="text-lg text-foreground/90 leading-relaxed mb-6">
                  At the heart of hospice sales is human connection. Empathy is about listening with intent, understanding the unspoken needs of providers and families, and building trust that goes beyond any single referral. We train you to connect authentically, ask better questions, and position hospice not as a product, but as a partner in delivering comfort and dignity. This means understanding that a case manager at 2pm on Friday has different needs than a physician at 8am Monday morning.
                </p>
                <div className="bg-muted/30 p-6 border-l-2 border-primary">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground mb-4">Core Practices</h4>
                  <ul className="space-y-3 text-sm text-foreground/80">
                    <li className="flex gap-3"><span className="text-primary mt-0.5 opacity-50">■</span> Active listening techniques for clinical conversations (not sales pitches)</li>
                    <li className="flex gap-3"><span className="text-primary mt-0.5 opacity-50">■</span> Understanding provider pain points and workflow constraints</li>
                    <li className="flex gap-3"><span className="text-primary mt-0.5 opacity-50">■</span> Building long-term relationships over transactional wins</li>
                    <li className="flex gap-3"><span className="text-primary mt-0.5 opacity-50">■</span> Patient-centered communication that honors dignity and choice</li>
                  </ul>
                </div>
              </div>

              {/* Strategy */}
              <div>
                <h3 className="font-mono text-sm font-bold tracking-widest text-primary uppercase mb-4 border-b border-border pb-4 flex items-center justify-between">
                  <span>03</span>
                  <span>Strategy</span>
                </h3>
                <p className="text-lg text-foreground/90 leading-relaxed mb-6">
                  Strategy is about acting with purpose, not activity for activity's sake. It means using data, market insights, and proven tools to identify the right referral sources and focus your energy where it will have the greatest impact. We help you cut through the noise, prioritize high-value activities, and build a pipeline that serves the patients who need you most. This looks like knowing which five clinics in your territory treat the most heart failure patients and building your week around them.
                </p>
                <div className="bg-muted/30 p-6 border-l-2 border-primary">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground mb-4">Strategic Elements</h4>
                  <ul className="space-y-3 text-sm text-foreground/80">
                    <li className="flex gap-3"><span className="text-primary mt-0.5 opacity-50">■</span> Data-driven territory analysis and segmentation (not guesswork)</li>
                    <li className="flex gap-3"><span className="text-primary mt-0.5 opacity-50">■</span> Competitive intelligence and market positioning based on real gaps</li>
                    <li className="flex gap-3"><span className="text-primary mt-0.5 opacity-50">■</span> Research and insights tools that save time</li>
                    <li className="flex gap-3"><span className="text-primary mt-0.5 opacity-50">■</span> Intentional account prioritization based on patient impact and referral potential</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Healthcare Sales Mastery Model */}
      <section className="public-dark-surface py-20 md:py-32 border-y border-zinc-800 bg-zinc-950 text-zinc-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-20 text-center max-w-3xl mx-auto">
            <h2 className="font-display text-4xl md:text-5xl font-extrabold mb-8 tracking-tight text-white uppercase" data-testid="text-mastery-model-title">
              Healthcare Sales <span className="text-primary">Mastery Model</span>
            </h2>
            <div className="space-y-6 text-lg md:text-xl leading-relaxed text-zinc-300" data-testid="card-model-context">
              <p>
                This model is built for hospice providers who want referrals to be consistent, appropriate, and repeatable inside an account. Not because someone is "great with people," but because the referral source has a clear path, clear expectations, and a clear reason to call you when the right patient shows up.
              </p>
              <p>
                Hospice referrals do not break because the account does not care. They break because the process is unclear. The triggers are fuzzy. The conversation feels risky. The workflow feels like extra work. This model removes that friction by giving your team a simple, coachable process that works across different roles, different personalities, and different levels of account engagement.
              </p>
              <p className="pt-4 font-mono text-base uppercase tracking-widest text-[#f23a41]">
                The model is structured into four subjects. We run them in sequence every time, because skipping steps is how you end up "checking in" for six months and calling it relationship building.
              </p>
            </div>
          </div>

          <div className="space-y-12" data-testid="subjects-container">
            {subjects.map((subject, idx) => {
              const Icon = subject.icon;
              const isLast = idx === subjects.length - 1;
              return (
                <div key={idx} className="relative">
                  <div className="border border-zinc-700 bg-zinc-900/80 p-8 text-white md:p-12 transition-colors hover:border-primary/70" data-testid={`card-subject-${idx}`}>
                    <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                      <div className="flex-shrink-0 flex flex-col items-center md:items-start gap-4 w-24">
                        <div className="font-mono text-5xl md:text-6xl font-bold text-primary/70 select-none">
                          0{idx + 1}
                        </div>
                        <Icon className="w-10 h-10 text-primary" />
                      </div>

                      <div className="flex-1 space-y-10">
                        <div className="border-b border-zinc-800 pb-6">
                          <h3 className="font-display text-3xl font-bold uppercase tracking-wide text-white mb-2">
                            {subject.title}
                          </h3>
                          <p className="font-mono text-sm tracking-widest text-zinc-300 uppercase">Subject {idx + 1} of 4</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-10">
                          <div>
                            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-primary mb-4">Purpose</h4>
                            <p className="text-base leading-relaxed text-zinc-300">{subject.purpose}</p>
                          </div>
                          <div>
                            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-primary mb-4">Execution Standard</h4>
                            <p className="text-base leading-relaxed text-zinc-300">{subject.executionStandard}</p>
                          </div>
                        </div>

                        <div className="bg-zinc-800/90 p-6 border-l-2 border-primary text-white">
                          <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-white mb-3">Measurable Output</h4>
                          <p className="text-base font-medium leading-relaxed text-zinc-300">{subject.measurableOutput}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!isLast && (
                    <div className="flex justify-center -mb-12 mt-6 h-12 relative z-10" data-testid={`connector-subject-${idx}`}>
                      <div className="w-px h-full bg-zinc-800"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-20 py-8 border-y border-zinc-700 font-mono text-xs text-center uppercase tracking-widest text-zinc-300 leading-loose">
            Design Version: 2026-01-15 <br className="md:hidden" /><span className="hidden md:inline"> • </span> Field-tested <br className="md:hidden" /><span className="hidden md:inline"> • </span> Prepare with intent <br className="md:hidden" /><span className="hidden md:inline"> • </span> Practice under pressure <br className="md:hidden" /><span className="hidden md:inline"> • </span> Measure in the open <br className="md:hidden" /><span className="hidden md:inline"> • </span> Correct fast <br className="md:hidden" /><span className="hidden md:inline"> • </span> Finish strong <br className="md:hidden" /><span className="hidden md:inline"> • </span> Honor choice <br className="md:hidden" /><span className="hidden md:inline"> • </span> Support clinical judgment <br className="md:hidden" /><span className="hidden md:inline"> • </span> Prove progress in the customer's numbers
          </div>
        </div>
      </section>

      {/* Five Fundamentals */}
      <section className="py-20 md:py-32 border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-24">
            <div>
              <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-6 tracking-tight text-foreground uppercase" data-testid="text-fundamentals-title">
                Five <span className="text-primary">Fundamentals</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                These principles anchor every activity, every conversation, every decision. They govern every subject in the model.
              </p>
            </div>

            <div className="grid gap-6">
              {fundamentals.map((fundamental, idx) => (
                <div key={idx} className="group flex flex-col sm:flex-row gap-6 p-6 sm:p-8 border border-border bg-muted/10 hover:bg-muted/30 transition-colors" data-testid={`card-fundamental-${idx}`}>
                  <div className="font-mono text-4xl font-extrabold text-border group-hover:text-primary transition-colors flex-shrink-0 sm:w-16">
                    0{idx + 1}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold mb-3 uppercase tracking-wide">{fundamental.title}</h3>
                    <p className="text-foreground/80 leading-relaxed text-lg">{fundamental.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ethics */}
      <section className="py-20 md:py-32 border-b border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-6 tracking-tight text-foreground uppercase" data-testid="text-ethics-title">
              Ethics That Anchor <br className="hidden md:block" />The Model
            </h2>
            <p className="text-lg text-muted-foreground">
              These values are non-negotiable and visible in every interaction.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {ethics.map((ethic, idx) => {
              const Icon = ethic.icon;
              return (
                <div key={idx} className="bg-background p-10 flex flex-col items-center text-center group hover:bg-muted/10 transition-colors" data-testid={`card-ethic-${idx}`}>
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-8 h-8 text-foreground group-hover:text-primary transition-colors stroke-[1.5]" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-4 uppercase tracking-wide leading-tight h-14 flex items-center justify-center">{ethic.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{ethic.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why the Method Exists */}
      <section className="py-20 md:py-32 border-b border-border bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-20 text-center">
            <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-8 tracking-tight text-foreground uppercase">
              Why the Method <span className="text-primary">Exists</span>
            </h2>
            <p className="text-xl md:text-2xl font-serif text-foreground/80 max-w-3xl mx-auto italic">
              "The Spartan Method is not a sales training framework. It is a patient access framework."
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-px bg-border border border-border">
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
              <div key={i} className="bg-background p-10 flex flex-col justify-center min-h-[220px]">
                <p className="font-mono text-xs font-bold text-primary uppercase tracking-widest mb-6">{item.heading}</p>
                <p className="text-foreground/90 text-lg leading-relaxed">{item.outcome}</p>
              </div>
            ))}
          </div>

          <div className="public-dark-surface mt-20 max-w-4xl mx-auto border border-zinc-700 bg-zinc-900 p-8 text-center text-xl font-medium leading-relaxed text-white md:p-12">
            Every step of the method exists to reduce the friction between a qualifying patient and the care team that can help them. The rep is the bridge. The method is what keeps the bridge standing.
          </div>
        </div>
      </section>

      {/* Traceability */}
      <section className="py-20 md:py-32 border-b border-border bg-muted/10" data-testid="section-traceability">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-16 md:text-center">
            <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-6 tracking-tight text-primary uppercase" data-testid="text-traceability-title">
              Traceability
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every principle maps to a subject. The Mamba standard is not separate from the model. It is woven into every step.
            </p>
          </div>

          <div className="space-y-3">
            {traceabilityMap.map((item, idx) => {
              const Icon = item.icon;
              const isEthicsRow = idx === traceabilityMap.length - 1;
              return (
                <div
                  key={idx}
                  className={`flex flex-col md:flex-row md:items-center gap-6 p-6 border ${isEthicsRow ? 'border-primary bg-primary/5 mt-8' : 'border-border bg-background'}`}
                  data-testid={`card-traceability-${idx}`}
                >
                  <div className="flex-1 font-mono text-sm md:text-base font-bold text-foreground flex items-center gap-4">
                    <Flame className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{item.mamba}</span>
                  </div>

                  <div className="hidden md:flex items-center text-muted-foreground/30 font-mono flex-shrink-0 px-4">
                    <span className="tracking-widest">------------</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                  <div className="md:hidden flex items-center text-muted-foreground/30 font-mono pl-9">
                    <ArrowRight className="w-5 h-5 transform rotate-90" />
                  </div>

                  <div className={`flex-1 font-display text-lg md:text-xl font-bold uppercase tracking-wide flex items-center gap-4 ${isEthicsRow ? 'text-primary' : 'text-foreground'}`}>
                    <Icon className={`w-6 h-6 flex-shrink-0 ${isEthicsRow ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span>{item.subject}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="public-dark-surface py-24 md:py-32 bg-zinc-950 text-zinc-50 text-center border-y border-zinc-800" data-testid="section-method-closing">
        <div className="max-w-4xl mx-auto px-6">
          <h3 className="font-display text-4xl md:text-6xl font-extrabold mb-10 uppercase tracking-tight" data-testid="text-closing-title">
            Built in the Field.<br />
            <span className="text-primary">Proven in Practice.</span>
          </h3>
          <p className="text-lg md:text-xl text-zinc-300 leading-relaxed mb-16 max-w-3xl mx-auto">
            Every framework, every playbook, every drill we teach has been tested in real hospice markets. This is not theory. It is a traceable system where preparation maps to Discovery, practice maps to Connecting, measurement maps to Guiding, and finishing strong maps to Commitment. The ethics hold it all together.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            <Link href="/contact" data-testid="button-method-contact" className="fi-btn-primary w-full sm:w-auto">
              Book a strategy call <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link href="/services" data-testid="button-method-services" className="fi-btn-outline-light w-full sm:w-auto">
              View coaching services
            </Link>
            <Link href="/manifesto" data-testid="button-method-manifesto" className="text-zinc-400 hover:text-white font-mono text-xs font-bold uppercase tracking-widest transition-colors mt-6 sm:mt-0 sm:ml-4 underline underline-offset-4 decoration-zinc-800 hover:decoration-zinc-400">
              Read the Spartan Ethos
            </Link>
          </div>
        </div>
      </section>

      <PublicConversionPanel
        source="method"
        audience="Hospice operators who want an ethical, repeatable way to prepare, practice, and follow through."
        promise="A shared language for turning field preparation into better conversations and measurable next actions."
        evidence="The method maps each principle to a subject, a behavior, and a traceable field output rather than a vague promise."
        primary={{ label: "Apply the method with coaching", href: "/contact?service=Hospice+Sales+Coaching", token: "strategy_call" }}
        secondary={{ label: "Read the Spartan Ethos", href: "/manifesto", token: "manifesto" }}
      />
    </div>
  );
}
