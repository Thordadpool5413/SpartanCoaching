import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/icons";

export default function Programs() {
  const hospicePrograms = [
    {
      title: "Admissions Speed Boost",
      duration: "4 weeks",
      description: "Fix slow handoffs, unclear owners, and delays from referral to start of care by installing a same-day contact rule and a daily admissions huddle.",
      deliverables: [
        "One-page workflow map",
        "Same-day contact call scripts",
        "Admissions huddle checklist",
      ],
    },
    {
      title: "Hospital Referral Pathway",
      duration: "6 weeks",
      description: "Build a repeatable, respectful weekly touch pattern that fits hospital discharge windows and hold rhythms to earn consistent referrals from case managers.",
      deliverables: [
        "Hospital floor map & contact plan",
        "Three clinical case stories",
        "Approved by clinical leadership",
      ],
    },
    {
      title: "Assisted Living & Memory Care Growth",
      duration: "8 weeks",
      description: "Provide clarity on when hospice helps and how staff and families should be approached, aligning with staff workflows to grow referral flow.",
      deliverables: [
        "Partner guide & family-facing materials",
        "Monthly event calendar",
        "Staff training on referral markers",
      ],
    },
    {
      title: "Physician Office Route & Message",
      duration: "3 weeks",
      description: "Target the right clinics by diagnosis and create a visit rhythm and discovery process that fits the fast-paced clinic flow.",
      deliverables: [
        "Targeted clinic list by diagnosis",
        "Optimized weekly route plan",
        "Visit-friendly discovery sheet",
      ],
    },
    {
      title: "After-Hours Readiness",
      duration: "2 weeks",
      description: "Prevent loss of conversions during evenings and weekends with a simple triage and messaging flow for urgent cases.",
      deliverables: [
        "On-call pocket guide",
        "Start of care readiness checklist",
      ],
    },
    {
      title: "Objection Handling for Hospice Conversations",
      duration: "2 weeks",
      description: "Address common objections from families and clinicians that reduce conversion with tested counters and short scripts for the most common concerns.",
      deliverables: [
        "Short playbook with do/don't examples",
        "Live practice scenarios",
      ],
    },
  ];

  const strategicServices = [
    {
      title: "Referral Data & Market Scan",
      description: "A practical look at who refers, what diagnoses move, and where time is wasted.",
      deliverables: [
        "One-page summary of local data",
        "Top 10 target list",
        "Three quick moves for the next two weeks",
      ],
    },
    {
      title: "Start of Care Readiness Kit",
      description: "A field-ready packet for liaisons and intake to ensure a smooth admission process.",
      deliverables: [
        "Pre-admit checklist",
        "Family talking points",
        "Same-day touch script & video refresher",
      ],
    },
    {
      title: "IDT Communication Tune-Up",
      description: "Tidy the communication loop between referral field, intake, and clinical leaders to prevent dropped balls.",
      deliverables: [
        "Two short weekly touchpoints",
        "Five-minute huddle guide",
        "Single page scoreboard",
      ],
    },
    {
      title: "New Liaison Starter Week",
      description: "A five-day starter week for new marketers to ensure they hit the ground running effectively.",
      deliverables: [
        "Starter kit & scorecard",
        "Plan for 10 quality touches by day five",
        "Field readiness checklist",
      ],
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4" data-testid="text-programs-title">
          Hospice Provider Programs
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Full program builds intended to be purchased as discrete projects. Each includes a kickoff, weekly working sessions, optional field practice, and a final summary with wins, blockers, and next steps.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
        {hospicePrograms.map((program, idx) => (
          <Card key={idx} className="flex flex-col hover-elevate transition-all" data-testid={`card-program-${idx}`}>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-primary uppercase tracking-wide">
                  {program.duration}
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{program.title}</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">{program.description}</p>
              <div className="mb-4">
                <p className="text-sm font-bold text-foreground mb-2">Deliverables:</p>
                <ul className="space-y-2">
                  {program.deliverables.map((item, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Button variant="outline" className="w-full font-bold mt-4" data-testid={`button-inquire-program-${idx}`}>
              Inquire About Program
            </Button>
          </Card>
        ))}
      </div>

      {/* Strategic Services */}
      <div className="mb-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            Strategic Services
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Standalone one-off services or add-ons to programs. Simple to use, easy to teach, and fast to measure. Every deliverable stays patient-first and compliant.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {strategicServices.map((service, idx) => (
            <Card key={idx} className="hover-elevate transition-all" data-testid={`card-strategic-${idx}`}>
              <h3 className="text-xl font-bold text-foreground mb-3">{service.title}</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">{service.description}</p>
              <div className="mb-4">
                <p className="text-sm font-bold text-foreground mb-2">Deliverables:</p>
                <ul className="space-y-2">
                  {service.deliverables.map((item, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button variant="outline" className="w-full font-bold" data-testid={`button-inquire-strategic-${idx}`}>
                Inquire About Service
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
