import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/icons";
import { BackButton } from "@/components/BackButton";
import { ProgramDetailDialog, ProgramDetail } from "@/components/ProgramDetailDialog";
import { Eye } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";

export default function Programs() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ProgramDetail | null>(null);

  const hospicePrograms: ProgramDetail[] = [
    {
      title: "Admissions Speed Boost",
      description: "Fix slow handoffs, unclear owners, and delays from referral to start of care by installing a same-day contact rule and a daily admissions huddle.",
      why: {
        problem: "Most hospice providers lose eligible patients because of slow response times. When a referral comes in on Monday but the patient isn't contacted until Wednesday, families find another provider or the clinical window closes. The problem isn't laziness. It is unclear ownership, clunky handoffs between sales and intake, and no forcing mechanism to move fast.",
        impact: "Every day of delay reduces conversion rates and shortens average length of stay. Patients who could benefit from 60+ days of hospice care end up with 14 days or less. This isn't just lost revenue. It is lost opportunity to serve families during the hardest moments of their lives."
      },
      delivery: {
        approach: "This is a 4-week intensive program with a kickoff session, weekly working sessions with your admissions team, optional field shadowing, and a final summary with clear wins, remaining blockers, and next steps.",
        phases: [
          {
            name: "Kickoff & Diagnosis",
            description: "Map your current referral-to-admission workflow. Identify where handoffs fail, who owns what, and where urgency dies. Document current average time-to-contact and admission conversion rates."
          },
          {
            name: "Same-Day Contact Protocol",
            description: "Install a forcing function: every referral gets contacted within 4 hours. Build call scripts that work for intake staff, create escalation paths for after-hours, and establish clear ownership between sales and clinical intake."
          },
          {
            name: "Daily Admissions Huddle",
            description: "Implement a 10-minute daily stand-up between sales, intake, and clinical leadership. Review every open referral, assign next actions, and surface blockers in real-time. No email chains, no waiting."
          },
          {
            name: "Measure & Refine",
            description: "Track time-to-contact, conversion rates, and start-of-care speed. Identify what's working, what's not, and what needs executive attention. Deliver a one-page summary with recommended next steps."
          }
        ]
      },
      outcomes: [
        "Reduce average time-to-contact from days to hours",
        "Increase admission conversion rates by 15-30%",
        "Shorten time from referral to start-of-care by 30-50%",
        "Clear ownership and accountability at every handoff point",
        "Daily visibility into pipeline health and bottlenecks"
      ],
      whoItsFor: "Hospice providers with slow admission pipelines, unclear handoffs between sales and intake, or providers losing patients to competitors who move faster. Ideal for organizations with 10+ referrals per week where speed and coordination matter.",
      deliverables: [
        "One-page workflow map showing every touchpoint",
        "Same-day contact call scripts and escalation protocols",
        "Daily admissions huddle checklist and meeting structure",
        "Tracking template for time-to-contact and conversion metrics",
        "Final summary with wins, blockers, and next steps"
      ]
    },
    {
      title: "Hospital Referral Pathway",
      description: "Build a repeatable, respectful weekly touch pattern that fits hospital discharge windows and hold rhythms to earn consistent referrals from case managers.",
      why: {
        problem: "Hospital case managers move fast. They have 15-20 discharge decisions to make every day, and they default to providers who are reliable, present, and easy to work with. Most hospice liaisons show up sporadically, drop off lunch trays without meaningful conversation, or worse, never build relationships with the people who actually control the referral flow.",
        impact: "Without a systematic hospital strategy, you're invisible when discharge decisions happen. Case managers refer to whoever they remember, whoever picked up the phone last time, or whoever the hospital has a preferred relationship with. You lose winnable referrals because you weren't in the room when it mattered."
      },
      delivery: {
        approach: "This is a 6-week program that includes a kickoff, weekly coaching sessions, field observation (optional), and a final debrief. We'll build your hospital floor map, create a touch pattern that respects hospital workflows, and develop clinical case stories that earn trust.",
        phases: [
          {
            name: "Hospital Mapping & Targeting",
            description: "Identify which units, case managers, and discharge planners matter most. Map discharge rhythms, hold schedules, and relationship strength. Prioritize where to invest time based on referral potential."
          },
          {
            name: "Weekly Touch Pattern Design",
            description: "Build a respectful, repeatable rhythm that fits hospital workflows. No more random drop-bys. Create a structured weekly plan that includes pre-planned touchpoints, meaningful conversations, and value-add moments."
          },
          {
            name: "Clinical Case Story Development",
            description: "Develop three compelling clinical case stories that demonstrate your team's ability to handle complex patients well. These aren't sales pitches. They are proof points that build credibility with clinical decision-makers."
          },
          {
            name: "Field Practice & Refinement",
            description: "Shadow your liaison during hospital visits, coach on approach and messaging, and refine the touch pattern based on real-world feedback. Get clinical leadership approval on case stories."
          }
        ]
      },
      outcomes: [
        "Repeatable weekly hospital visit pattern that fits discharge rhythms",
        "Stronger relationships with 5-10 key case managers and discharge planners",
        "Three clinically credible case stories approved by your clinical team",
        "Increased hospital referral volume within 60-90 days",
        "Clear process for maintaining hospital relationships long-term"
      ],
      whoItsFor: "Hospice providers with weak or inconsistent hospital relationships, new markets where you need to establish presence, or organizations that have relied too heavily on informal relationships that aren't producing referrals.",
      deliverables: [
        "Hospital floor map with contact list and referral potential scoring",
        "Weekly touch pattern calendar with pre-planned visit days and times",
        "Three clinical case stories reviewed and approved by clinical leadership",
        "Case manager relationship tracker with notes and next actions",
        "Final summary with relationship strength assessment and growth plan"
      ]
    },
    {
      title: "Assisted Living & Memory Care Growth",
      description: "Provide clarity on when hospice helps and how staff and families should be approached, aligning with staff workflows to grow referral flow.",
      why: {
        problem: "Assisted living and memory care facilities want to serve residents well, but hospice remains confusing for many staff members. Executive directors worry about triggering families too early, floor nurses don't know when to escalate, and families feel blindsided when hospice is finally mentioned. The result? Referrals happen too late or not at all.",
        impact: "Late hospice enrollment means residents suffer longer than necessary, families feel unprepared, and your average length of stay is crushed. Communities that could be strong referral partners stay on the sidelines because they don't have clear frameworks for when and how to involve hospice."
      },
      delivery: {
        approach: "This is an 8-week program combining staff education, family communication tools, and liaison rhythm-building. Includes kickoff, biweekly working sessions, on-site training at the facility, and a final assessment with long-term partnership plan.",
        phases: [
          {
            name: "Staff Education & Referral Markers",
            description: "Train assisted living staff on clinical markers that warrant hospice evaluation. Create simple, practical frameworks they can use without fear of 'getting it wrong.' Build trust that involving hospice early helps residents, not harms them."
          },
          {
            name: "Family-Facing Communication Materials",
            description: "Develop materials that help facility staff and families understand what hospice is, when it's appropriate, and how it complements existing care. Remove the fear and stigma that delays referrals."
          },
          {
            name: "Monthly Event Calendar & Value-Add Strategy",
            description: "Design a monthly event calendar that keeps your hospice visible and valuable: lunch & learns, family education nights, staff appreciation moments, and holiday remembrance events. Stay present without being pushy."
          },
          {
            name: "Liaison Rhythm & Relationship Building",
            description: "Establish a consistent visit pattern with executive directors, nurses, and care coordinators. Build relationships grounded in resident care, not just sales. Create accountability for follow-through."
          }
        ]
      },
      outcomes: [
        "Facility staff understand when to involve hospice and feel confident initiating conversations",
        "Family communication materials that reduce fear and increase early hospice enrollment",
        "12-month event calendar that keeps your hospice top-of-mind",
        "Stronger relationships with 3-5 assisted living communities",
        "Increased referral volume and longer lengths of stay from community partners"
      ],
      whoItsFor: "Hospice providers looking to grow assisted living and memory care partnerships, organizations struggling with late referrals from communities, or providers entering new markets where community relationships need to be built from scratch.",
      deliverables: [
        "Partner guide for facility staff with referral markers and conversation starters",
        "Family-facing education materials (brochures, FAQ sheets, decision guides)",
        "12-month event calendar with themes, materials, and logistics",
        "Staff training on hospice eligibility and when to escalate",
        "Liaison visit schedule with accountability tracking"
      ]
    },
    {
      title: "Physician Office Route & Message",
      description: "Target the right clinics by diagnosis and create a visit rhythm and discovery process that fits the fast-paced clinic flow.",
      why: {
        problem: "Most hospice liaisons waste time visiting physician offices that will never refer. They show up with donuts, drop off brochures, and hope something sticks. Meanwhile, the clinics that treat the most heart failure, COPD, and cancer patients, the ones with real referral potential, never get the focused attention they deserve.",
        impact: "Without a targeted approach, you're spending time and money on relationships that don't produce referrals. Your liaison is busy, but not effective. The clinics that could be your strongest referral partners don't even know you exist."
      },
      delivery: {
        approach: "This is a 3-week sprint to identify high-potential clinics, build a structured visit route, and create a discovery process that respects clinic workflows. Includes kickoff, weekly check-ins, and a final route plan with messaging framework.",
        phases: [
          {
            name: "Clinic Targeting by Diagnosis",
            description: "Use local data to identify which clinics treat the most patients with hospice-appropriate diagnoses (heart failure, COPD, cancer, dementia). Score clinics by referral potential and current relationship strength."
          },
          {
            name: "Optimized Weekly Route Plan",
            description: "Build a structured visit route that maximizes face-time with high-potential clinics while minimizing drive time. Create a realistic schedule that your liaison can actually execute week after week."
          },
          {
            name: "Discovery Process & Visit-Friendly Tools",
            description: "Develop a discovery sheet that helps your liaison ask the right questions, understand clinic pain points, and position hospice as a solution. Make it easy for busy clinic staff to engage without derailing their day."
          }
        ]
      },
      outcomes: [
        "Targeted list of 15-25 high-potential clinics based on diagnosis data",
        "Structured weekly route plan that maximizes efficiency and consistency",
        "Discovery process that uncovers real needs and builds trust",
        "Increased physician referrals from targeted clinics within 60-90 days",
        "Clear framework for prioritizing and deprioritizing clinic relationships"
      ],
      whoItsFor: "Hospice providers with unfocused physician outreach, new markets where you need to establish clinic relationships quickly, or organizations that have relied on ad-hoc visits without a strategic plan.",
      deliverables: [
        "Targeted clinic list scored by diagnosis and referral potential",
        "Optimized weekly route plan with visit frequency and timing",
        "Discovery sheet with questions tailored to clinic workflows",
        "Clinic relationship tracker with notes and next actions",
        "Final summary with top priorities and growth targets"
      ]
    },
    {
      title: "After-Hours Readiness",
      description: "Prevent loss of conversions during evenings and weekends with a simple triage and messaging flow for urgent cases.",
      why: {
        problem: "Hospice referrals don't stop at 5pm on Friday. Patients decline on Saturday afternoons, families panic on Sunday evenings, and hospital case managers need answers at 9pm. If your on-call system isn't ready to convert these urgent referrals, families call the next hospice on the list, and you lose the patient.",
        impact: "After-hours referrals are often the most urgent and the most valuable. These are families in crisis who need help now. If your on-call team fumbles the phone call, doesn't know what to say, or can't coordinate a rapid start-of-care, you lose conversions and damage your reputation with referral sources."
      },
      delivery: {
        approach: "This is a 2-week intensive sprint to build after-hours readiness. Includes kickoff with on-call staff, script development, role-playing scenarios, and a final readiness checklist. Focused, practical, and fast.",
        phases: [
          {
            name: "On-Call Assessment & Gap Analysis",
            description: "Interview on-call staff to understand current processes, pain points, and failure modes. Identify where after-hours conversions break down and what tools are missing."
          },
          {
            name: "Triage & Messaging Flow Development",
            description: "Create simple, clear scripts for handling urgent referrals. Build a triage process that helps on-call staff determine urgency, coordinate with admissions, and communicate with families effectively."
          },
          {
            name: "Start-of-Care Readiness Checklist",
            description: "Develop a pocket guide that helps on-call staff prepare for rapid admissions: what needs to happen, who to call, what to tell the family, and how to coordinate with weekend clinical teams."
          },
          {
            name: "Role-Playing & Final Readiness Check",
            description: "Practice real scenarios with on-call staff to build confidence and identify remaining gaps. Refine scripts and checklists based on feedback. Deliver final tools ready for immediate use."
          }
        ]
      },
      outcomes: [
        "On-call staff feel confident handling urgent hospice referrals",
        "Clear triage process that determines urgency and next actions",
        "Messaging scripts that reassure families and coordinate rapid admissions",
        "Increased after-hours conversion rates",
        "Reduced stress and confusion for on-call teams"
      ],
      whoItsFor: "Hospice providers losing conversions during evenings and weekends, organizations with on-call teams that feel unprepared, or providers in competitive markets where after-hours responsiveness is a differentiator.",
      deliverables: [
        "On-call pocket guide with triage questions and decision trees",
        "Messaging scripts for urgent family conversations",
        "Start-of-care readiness checklist for rapid admissions",
        "Role-playing scenarios and coaching notes",
        "Final summary with remaining gaps and improvement plan"
      ]
    },
    {
      title: "Objection Handling for Hospice Conversations",
      description: "Address common objections from families and clinicians that reduce conversion with tested counters and short scripts for the most common concerns.",
      why: {
        problem: "Hospice conversations trigger fear, resistance, and misunderstanding. Families worry that choosing hospice means giving up. Physicians hesitate because they don't want to feel like they're abandoning patients. Nurses push back because they've seen hospice done poorly. These objections are predictable, but most hospice staff don't have clear, confident responses ready.",
        impact: "Every fumbled objection is a lost patient. When your team doesn't know what to say, they avoid the conversation altogether, refer too late, or lose the family to a competitor who handled the concern better. Patients who could benefit from hospice never get the chance."
      },
      delivery: {
        approach: "This is a 2-week intensive focused on the 8 most common hospice objections. Includes kickoff, script development, role-playing practice, and a final playbook with do/don't examples. Fast, practical, and immediately usable.",
        phases: [
          {
            name: "Objection Identification & Analysis",
            description: "Identify the most common objections your team faces from families, physicians, and referral sources. Understand the emotional and logical concerns behind each objection."
          },
          {
            name: "Tested Response Development",
            description: "Build short, empathetic scripts that acknowledge concerns, reframe the conversation, and move toward enrollment. Focus on what works, not theory."
          },
          {
            name: "Live Practice Scenarios",
            description: "Role-play real objection scenarios with your team. Practice until responses feel natural, not scripted. Build confidence through repetition."
          },
          {
            name: "Final Playbook & Do/Don't Examples",
            description: "Deliver a pocket-sized playbook with tested responses, do/don't examples, and coaching tips. Make it easy for staff to reference in the moment."
          }
        ]
      },
      outcomes: [
        "Staff feel confident addressing the 8 most common hospice objections",
        "Empathetic, tested scripts that acknowledge concerns and move conversations forward",
        "Increased conversion rates from initial inquiry to admission",
        "Reduced anxiety and avoidance around difficult hospice conversations",
        "Playbook that becomes a training tool for new staff"
      ],
      whoItsFor: "Hospice providers with low conversion rates, new sales staff who lack confidence in objection handling, or organizations hearing the same objections repeatedly without clear responses.",
      deliverables: [
        "Short playbook with responses to the 8 most common objections",
        "Do/don't examples showing what works and what backfires",
        "Live practice scenarios with coaching feedback",
        "Pocket-sized reference card for in-the-moment use",
        "Final summary with additional coaching recommendations"
      ]
    },
  ];

  const strategicServices: ProgramDetail[] = [
    {
      title: "Referral Data & Market Scan",
      description: "A practical look at who refers, what diagnoses move, and where time is wasted.",
      why: {
        problem: "Most hospice providers make territory decisions based on gut feel, history, or wishful thinking. They don't actually know which referral sources produce the most patients, which diagnoses convert best, or where their liaisons are spending time on low-value relationships. Without data, you're flying blind.",
        impact: "You waste liaison time on referral sources that will never produce. You miss high-potential opportunities in your own backyard. Your team stays busy without being effective, and you have no clear way to improve because you don't know what's actually working."
      },
      delivery: {
        approach: "This is a one-week sprint. We pull your referral data, analyze it for patterns, and deliver a one-page summary with the top 10 targets and three quick moves you can make in the next two weeks. Fast, focused, and immediately actionable.",
        phases: [
          {
            name: "Data Pull & Analysis",
            description: "Extract referral data from your EMR or CRM. Analyze by source, diagnosis, time-to-admission, and length of stay. Identify patterns you're missing."
          },
          {
            name: "Market Scan & Opportunity Mapping",
            description: "Overlay your data with local market intelligence: which clinics, hospitals, and communities are underserved? Where are competitors strong? Where do you have openings?"
          },
          {
            name: "Top 10 Target List & Quick Moves",
            description: "Deliver a one-page summary showing your best opportunities, your biggest time-wasters, and three specific moves you can make in the next two weeks to improve results."
          }
        ]
      },
      outcomes: [
        "Clear understanding of which referral sources actually produce patients",
        "Top 10 target list prioritized by referral potential",
        "Identification of time-wasters and low-value relationships",
        "Three immediate action items to improve territory effectiveness",
        "Data-driven foundation for all future territory planning"
      ],
      whoItsFor: "Hospice providers making territory decisions without data, organizations entering new markets, or leadership teams looking to optimize liaison productivity and focus.",
      deliverables: [
        "One-page data summary showing referral patterns and trends",
        "Top 10 target list with prioritization rationale",
        "Three quick moves for the next two weeks",
        "Market scan highlighting competitive threats and opportunities"
      ]
    },
    {
      title: "Start of Care Readiness Kit",
      description: "A field-ready packet for liaisons and intake to ensure a smooth admission process.",
      why: {
        problem: "The moment between 'yes, we want hospice' and the first clinical visit is where things fall apart. Families don't know what to expect, paperwork gets delayed, and simple questions go unanswered. If intake and liaisons don't have clear tools for this handoff, families get frustrated and admissions stall.",
        impact: "Slow or confusing start-of-care processes hurt patient experience, delay billable days, and damage your reputation with referral sources. Families who were excited about hospice end up confused and disappointed before the nurse even arrives."
      },
      delivery: {
        approach: "This is a one-week build. We create a field-ready packet with pre-admit checklists, family talking points, and same-day touch scripts. Everything your team needs to make the first 24 hours smooth and professional.",
        phases: [
          {
            name: "Current Process Assessment",
            description: "Interview intake and liaison staff to understand where the start-of-care process breaks down. Identify common failure points and missing tools."
          },
          {
            name: "Tool Development",
            description: "Build pre-admit checklists, family talking points, and same-day touch scripts. Make them simple, practical, and easy to use in the field."
          },
          {
            name: "Video Refresher & Training",
            description: "Create a short video refresher showing best practices for the first 24 hours. Use it for onboarding new staff and reinforcing standards."
          }
        ]
      },
      outcomes: [
        "Standardized start-of-care process that reduces confusion",
        "Intake and liaison teams aligned on roles and responsibilities",
        "Families know what to expect in the first 24 hours",
        "Faster time to first clinical visit",
        "Improved patient and family experience from day one"
      ],
      whoItsFor: "Hospice providers with inconsistent start-of-care processes, organizations onboarding new intake or liaison staff, or teams hearing complaints about slow or confusing admissions.",
      deliverables: [
        "Pre-admit checklist for intake staff",
        "Family talking points explaining what happens next",
        "Same-day touch script for first 24 hours",
        "Video refresher showing start-of-care best practices",
        "One-page process map for liaison and intake alignment"
      ]
    },
    {
      title: "IDT Communication Tune-Up",
      description: "Tidy the communication loop between referral field, intake, and clinical leaders to prevent dropped balls.",
      why: {
        problem: "In most hospice organizations, the referral team, intake, and clinical staff operate in silos. Sales doesn't know why admissions are getting delayed. Intake doesn't know which referrals are hot. Clinical leadership hears about problems too late. Email chains, voicemails, and Slack threads create confusion instead of clarity.",
        impact: "Communication breakdowns lead to dropped referrals, delayed admissions, frustrated staff, and lost revenue. When no one has visibility into what's actually happening, small problems become crises and winnable patients slip through the cracks."
      },
      delivery: {
        approach: "This is a two-week tune-up. We design two short weekly touchpoints, a five-minute huddle structure, and a single-page scoreboard that gives everyone visibility. Simple, repeatable, and sustainable.",
        phases: [
          {
            name: "Communication Audit",
            description: "Interview referral, intake, and clinical teams to understand current communication patterns. Identify where information gets lost and what everyone actually needs to know."
          },
          {
            name: "Touchpoint Design",
            description: "Design two short weekly touchpoints: a sales-intake sync and a pipeline review with clinical leadership. Keep them brief, focused, and action-oriented."
          },
          {
            name: "Scoreboard & Huddle Structure",
            description: "Create a single-page scoreboard showing active referrals, hot prospects, and blockers. Build a five-minute huddle guide that keeps meetings focused and productive."
          }
        ]
      },
      outcomes: [
        "Clear communication loops between sales, intake, and clinical teams",
        "Reduced dropped referrals and delayed admissions",
        "Visibility into pipeline health for all stakeholders",
        "Faster problem resolution and better team alignment",
        "Sustainable meeting rhythms that don't waste time"
      ],
      whoItsFor: "Hospice providers with communication breakdowns between teams, organizations with dropped referrals due to poor handoffs, or leadership teams looking to improve operational coordination.",
      deliverables: [
        "Two weekly touchpoint structures with agendas",
        "Five-minute huddle guide for daily or weekly use",
        "Single-page scoreboard tracking active referrals and blockers",
        "Process map showing information flow between teams",
        "Final summary with sustainability recommendations"
      ]
    },
    {
      title: "New Liaison Starter Week",
      description: "A five-day starter week for new marketers to ensure they hit the ground running effectively.",
      why: {
        problem: "Most new hospice liaisons get thrown into the field with vague instructions, a stack of business cards, and hope. They don't know which accounts to prioritize, what to say, or how to structure their week. The first 30 days determine whether they succeed or flounder, and most organizations leave this to chance.",
        impact: "New liaisons waste weeks building confidence and figuring out basics that should have been taught on day one. Territory ramp time stretches from 30 days to 90+ days. Some never gain traction and quit within six months. You lose time, money, and market opportunity."
      },
      delivery: {
        approach: "This is a one-week intensive designed for new liaisons. Day one: orientation and account prioritization. Days two through five: structured field visits with coaching. By day five, they've made 10 quality touches and have a repeatable weekly rhythm.",
        phases: [
          {
            name: "Day 1: Orientation & Account Prioritization",
            description: "Review territory, prioritize top 20 accounts, understand hospice value proposition, and build the first week's visit plan."
          },
          {
            name: "Days 2-4: Structured Field Visits with Coaching",
            description: "Execute pre-planned visits to high-priority accounts. Coach on approach, messaging, and relationship-building. Debrief daily to refine technique."
          },
          {
            name: "Day 5: Readiness Check & Weekly Rhythm Build",
            description: "Review the week's activity, assess readiness, and build a sustainable weekly rhythm. Deliver a field readiness checklist and scorecard for ongoing accountability."
          }
        ]
      },
      outcomes: [
        "New liaison makes 10 quality touches in first five days",
        "Clear understanding of territory priorities and account potential",
        "Confidence in messaging and relationship-building approach",
        "Sustainable weekly rhythm established from day one",
        "Faster ramp time and higher likelihood of long-term success"
      ],
      whoItsFor: "Hospice providers onboarding new liaisons, organizations expanding into new markets, or teams that have struggled with slow ramp times and new hire turnover.",
      deliverables: [
        "Starter kit with territory overview and account priorities",
        "Plan for 10 quality touches in first five days",
        "Field readiness checklist and coaching notes",
        "Weekly rhythm template and accountability scorecard",
        "Final debrief with strengths, gaps, and next steps"
      ]
    },
  ];

  const handleLearnMore = (program: ProgramDetail) => {
    setSelectedDetail(program);
    setDetailOpen(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <BackButton />
      <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent blur-3xl -z-10"></div>
        <h1 className="text-hero text-foreground mb-8 animate-fade-in-up" data-testid="text-programs-title">
          Hospice Provider <span className="text-gradient-primary">Programs</span>
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Full program builds intended to be purchased as discrete projects. Each includes a kickoff, weekly working sessions, optional field practice, and a final summary with wins, blockers, and next steps.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-cards gap-sections">
        {hospicePrograms.map((program, idx) => (
          <Card key={idx} className="flex flex-col hover-card bg-card dark:border-border border-l-4 border-l-primary group relative spacing-card" data-testid={`card-program-${idx}`}>
            <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className="relative flex-1">
              <h3 className="text-h3 font-bold text-foreground mb-3">{program.title}</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed text-sm">{program.description}</p>
              <div className="mb-4">
                <p className="text-sm font-bold text-foreground mb-2">Key Deliverables:</p>
                <ul className="space-y-2">
                  {program.deliverables.slice(0, 3).map((item, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                {program.deliverables.length > 3 && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    + {program.deliverables.length - 3} more deliverables
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1 font-bold touch-manipulation py-2.5"
                  data-testid={`button-learn-more-program-${idx}`}
                  onClick={() => handleLearnMore(program)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Learn More
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {/* Strategic Services */}
      <div className="space-y-8 md:space-y-12 lg:space-y-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-foreground mt-16 mb-8 text-h2">
            Strategic Services
          </h2>
          <p className="text-body-lg text-muted-foreground leading-relaxed">
            Standalone one-off services or add-ons to programs. Simple to use, easy to teach, and fast to measure. Every deliverable stays patient-first and compliant.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-cards">
          {strategicServices.map((service, idx) => (
            <Card key={idx} className="flex flex-col hover-card bg-card dark:border-border border-l-4 border-l-primary group relative spacing-card" data-testid={`card-strategic-${idx}`}>
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-5 transition-opacity"></div>
              <div className="flex-1">
                <h3 className="text-h3 font-bold text-foreground mb-3">{service.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed text-sm">{service.description}</p>
                <div className="mb-4">
                  <p className="text-sm font-bold text-foreground mb-2">Key Deliverables:</p>
                  <ul className="space-y-2">
                    {service.deliverables.slice(0, 3).map((item, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2">
                        <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                  {service.deliverables.length > 3 && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      + {service.deliverables.length - 3} more deliverables
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1 font-bold touch-manipulation py-2.5"
                  data-testid={`button-learn-more-strategic-${idx}`}
                  onClick={() => handleLearnMore(service)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Learn More
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <ProgramDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        program={selectedDetail}
      />
      <PublicConversionPanel
        source="programs"
        audience="Hospice providers that need a defined project, team workshop, or market operating system."
        promise="A discrete program with a kickoff, working sessions, deliverables, and a final next-step summary."
        evidence="Every program publishes its audience, delivery approach, outcomes, and concrete deliverables before a conversation."
        primary={{ label: "Discuss a program", href: "/contact?service=Provider+Program", token: "program_consult" }}
        secondary={{ label: "View consulting services", href: "/services", token: "services" }}
      />
    </div>
  );
}
