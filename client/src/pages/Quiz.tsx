import { useState, useRef } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/BackButton";
import { CheckCircle, XCircle, Printer, RotateCcw, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface Question {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const questions: Question[] = [
  {
    id: 1,
    category: "Eligibility",
    question: "What is the primary eligibility requirement for a patient to enroll in the Medicare Hospice Benefit?",
    options: [
      "The patient must be over 65 and have Medicare Part A",
      "Two physicians must certify a life expectancy of six months or less if the disease runs its normal course",
      "The patient must have a DNR order on file",
      "The attending physician must refer the patient in writing",
    ],
    correctIndex: 1,
    explanation: "Medicare requires certification by the patient's attending physician and the hospice medical director that the patient has a terminal prognosis of six months or less. A DNR and written referral are not eligibility requirements.",
  },
  {
    id: 2,
    category: "Eligibility",
    question: "When a patient enrolls in Medicare Hospice, what must they agree to?",
    options: [
      "Forgoing all medications except comfort-related drugs",
      "Electing the hospice benefit in place of curative treatment for the terminal diagnosis",
      "Signing a Do Not Resuscitate order",
      "Transferring their primary care to the hospice medical director",
    ],
    correctIndex: 1,
    explanation: "Electing the hospice benefit means the patient chooses comfort-focused care and foregoes curative treatment for the terminal diagnosis. They can still receive treatment for unrelated conditions. A DNR is not required.",
  },
  {
    id: 3,
    category: "Eligibility",
    question: "What are the four levels of hospice care under the Medicare Hospice Benefit?",
    options: [
      "Routine Home Care, Continuous Home Care, Inpatient Respite, General Inpatient Care",
      "Basic Care, Advanced Care, Crisis Care, Terminal Care",
      "Home Care, Skilled Nursing, Inpatient, Palliative",
      "Level 1 through Level 4, as defined by the patient's hospice team",
    ],
    correctIndex: 0,
    explanation: "Medicare defines four levels: Routine Home Care (standard daily care at home), Continuous Home Care (crisis periods requiring nursing 8+ hrs/day), General Inpatient Care (unmanageable symptoms requiring hospital-level care), and Inpatient Respite (short-term relief for caregivers).",
  },
  {
    id: 4,
    category: "Clinical Terms",
    question: "What is the key distinction between palliative care and hospice?",
    options: [
      "Palliative care is only for cancer patients; hospice is for all terminal diagnoses",
      "Palliative care focuses on comfort but can be provided alongside curative treatment at any stage; hospice requires forgoing curative treatment",
      "Hospice is administered only in a facility; palliative care can happen at home",
      "There is no meaningful distinction — the terms are interchangeable",
    ],
    correctIndex: 1,
    explanation: "Palliative care is a broader approach to symptom management and quality of life that can accompany curative treatment at any disease stage. Hospice is a specific Medicare benefit requiring election, prognosis certification, and a shift away from curative treatment for the terminal diagnosis.",
  },
  {
    id: 5,
    category: "Clinical Terms",
    question: "What does ADL stand for and why is it relevant in hospice eligibility conversations?",
    options: [
      "Advanced Disease Limitations — used to describe late-stage illness severity",
      "Activities of Daily Living — decline in ADLs is a key clinical indicator supporting hospice eligibility",
      "Admission and Discharge Logistics — the process for transitioning a patient",
      "Attending Doctor Liaison — the contact person at a referring facility",
    ],
    correctIndex: 1,
    explanation: "Activities of Daily Living (bathing, dressing, toileting, transferring, continence, eating) are closely tracked in eligibility documentation. Measurable decline in ADLs — especially when combined with weight loss and reduced oral intake — supports the clinical picture of a six-month prognosis.",
  },
  {
    id: 6,
    category: "Clinical Terms",
    question: "Which of the following best describes the role of the hospice Interdisciplinary Team (IDT)?",
    options: [
      "A group of physicians who certify patient eligibility every 90 days",
      "A billing and compliance committee that reviews Medicare documentation",
      "A team including nurses, social workers, chaplains, aides, and the medical director who collaborate on the patient's plan of care",
      "The administrative staff at the hospice agency responsible for scheduling",
    ],
    correctIndex: 2,
    explanation: "The IDT is a core component of hospice care. It typically includes RNs, CNAs, social workers, chaplains, and the medical director — all working together on each patient's individualized plan of care. Understanding the IDT helps reps explain the depth of hospice support to referral sources.",
  },
  {
    id: 7,
    category: "Objection Handling",
    question: "A discharge planner tells you: 'We already have a hospice we work with.' What is the best first response?",
    options: [
      "Offer a lower cost or faster admission turnaround to compete directly",
      "Ask how that relationship is working and what would make referring to a second provider worth considering",
      "Acknowledge the relationship and immediately leave — coming back repeatedly will eventually change their mind",
      "Challenge them by pointing out that patient choice requires offering multiple options",
    ],
    correctIndex: 1,
    explanation: "The goal isn't to replace their current provider — it's to earn the right to be an option. Asking how the relationship is working opens a genuine conversation. Competing on price devalues your offering, and invoking patient choice as a challenge creates defensiveness rather than partnership.",
  },
  {
    id: 8,
    category: "Objection Handling",
    question: "A family member says: 'I feel like enrolling in hospice means we're giving up on my father.' How should you respond?",
    options: [
      "Reassure them that hospice is not giving up — and quickly move on to the paperwork",
      "Agree that it's a hard decision, then explain that hospice often extends quality — and sometimes length — of life by focusing on comfort and whole-person care",
      "Explain the Medicare eligibility criteria to show the decision is medically appropriate",
      "Tell them that their physician already made this recommendation, so it's the right path",
    ],
    correctIndex: 1,
    explanation: "Families need to feel heard before they can receive information. Validating the emotion, then reframing hospice as an active, caring choice — rather than abandonment — is the approach that builds trust. Leading with paperwork or deferring to physician authority bypasses the emotional core of the objection.",
  },
  {
    id: 9,
    category: "Objection Handling",
    question: "A physician says: 'My patient isn't ready for hospice yet.' What is the most effective response?",
    options: [
      "Respect the physician's judgment and follow up in two weeks",
      "Ask the physician what 'ready' looks like clinically — and explore whether the current trajectory already meets criteria",
      "Provide the eligibility criteria in writing and ask them to reconsider",
      "Suggest the family request hospice evaluation directly to work around the physician",
    ],
    correctIndex: 1,
    explanation: "A physician's 'not yet' often signals uncertainty rather than a hard no. Asking what 'ready' looks like creates a collaborative clinical conversation. Handing over paperwork can feel dismissive. Going around the physician damages the relationship and the patient's continuity of care.",
  },
  {
    id: 10,
    category: "Objection Handling",
    question: "Which of the following is the most common reason hospice reps lose referrals after they're made?",
    options: [
      "The patient or family changes their mind about hospice",
      "The competition offers faster admission",
      "Slow response time — the referral source perceives the hospice as unreliable",
      "The hospice medical director declines the patient",
    ],
    correctIndex: 2,
    explanation: "Speed-to-contact and responsiveness are the most frequently cited reasons referral sources switch or diversify providers. A referral source who feels ignored or left waiting will stop calling. Admission response time is a key metric that directly drives referral loyalty.",
  },
  {
    id: 11,
    category: "Territory Strategy",
    question: "What defines an A-tier account in a hospice sales territory?",
    options: [
      "Any account that has made at least one referral in the past six months",
      "Large facilities with more than 100 beds, regardless of referral history",
      "Accounts with high referral volume or high growth potential that justify the most consistent visit frequency",
      "Accounts where you have a personal relationship with the director",
    ],
    correctIndex: 2,
    explanation: "A-tier accounts are defined by referral output and growth potential — not simply by size or existing relationships. These accounts receive the highest visit frequency (often weekly) and the most tailored engagement strategy. Relationship quality is a result of consistent execution, not the basis for tiering.",
  },
  {
    id: 12,
    category: "Territory Strategy",
    question: "A hospice rep has 90 accounts and 20 working days per month. What is the most important first step in managing this territory effectively?",
    options: [
      "Visit every account at least once per month to maintain visibility",
      "Segment accounts by tier (A/B/C) and assign visit frequency based on tier — not on equal distribution",
      "Focus exclusively on the top 10 accounts and ignore the rest until referrals increase",
      "Build a spreadsheet of all contacts and call them on a rotating basis",
    ],
    correctIndex: 1,
    explanation: "Attempting to visit 90 accounts equally across 20 days is not executable. Tiered segmentation allows you to concentrate your highest-value time on the accounts most likely to produce referrals, while maintaining lighter touch with B and C accounts. Equal distribution dilutes impact across the territory.",
  },
  {
    id: 13,
    category: "Territory Strategy",
    question: "What is the primary purpose of a pre-call plan before visiting a referral source?",
    options: [
      "To prepare talking points about the hospice's services and differentiators",
      "To document the visit in the CRM before it happens",
      "To identify a specific, relevant objective for the visit — so the conversation adds value instead of just checking in",
      "To review the facility's census to see if any patients may be eligible",
    ],
    correctIndex: 2,
    explanation: "A pre-call plan centers on your objective for that specific visit and that specific person. Referral sources can tell the difference between a rep who came to check in and one who came to solve something or bring something useful. Consistent value delivery is what earns trust over time.",
  },
  {
    id: 14,
    category: "Physician Engagement",
    question: "When approaching a physician office for the first time, what should your initial goal be?",
    options: [
      "Secure a referral commitment from the attending physician",
      "Leave educational materials with the front desk and request a follow-up",
      "Earn a brief, focused meeting with the physician or NP to understand how they currently handle hospice conversations",
      "Present your hospice's outcomes data and admission response times",
    ],
    correctIndex: 2,
    explanation: "The first visit is about understanding, not pitching. Physicians respond to reps who listen and ask smart questions. Your goal is to learn how they think about hospice, what hesitations they have, and what would make them comfortable referring. That insight shapes every subsequent interaction.",
  },
  {
    id: 15,
    category: "Physician Engagement",
    question: "A physician tells you they hesitate to refer because 'patients feel abandoned when I move them to hospice.' What does this tell you about how to engage this physician?",
    options: [
      "This physician is not a viable referral source — their mindset won't change",
      "This physician needs education on Medicare eligibility criteria",
      "This physician has a relationship-driven concern about continuity of care and needs reassurance that hospice supports — not replaces — the physician relationship",
      "You should bring a hospice nurse to the next visit to explain the clinical model",
    ],
    correctIndex: 2,
    explanation: "A physician who says patients feel 'abandoned' is telling you their core concern is the ongoing care relationship. The right response is to explain how hospice supports the physician — through IDT updates, symptom management that reduces hospitalizations, and family support — rather than leading with eligibility data.",
  },
  {
    id: 16,
    category: "Follow-Up",
    question: "What is the key difference between a value-add follow-up and a check-in call?",
    options: [
      "A value-add follow-up is longer and more formal; a check-in is a quick call",
      "A value-add follow-up brings something relevant and useful to the referral source; a check-in is contact for the sake of contact",
      "A check-in is reserved for existing referral relationships; a value-add is for prospecting",
      "There is no meaningful difference — both accomplish the same goal",
    ],
    correctIndex: 1,
    explanation: "Check-ins ('just wanted to see how things are going') add no value and train referral sources to ignore your calls. Value-add follow-ups bring something specific — an article, an eligibility update, a solved problem, or a relevant case insight. Over time, value-add contacts build the kind of trust that translates to referrals.",
  },
  {
    id: 17,
    category: "Follow-Up",
    question: "Research shows that most hospice reps give up on a prospect after how many contacts?",
    options: [
      "1–2 contacts",
      "2–3 contacts",
      "5–6 contacts",
      "10 or more contacts",
    ],
    correctIndex: 1,
    explanation: "Most reps give up after 2–3 contacts, while research consistently shows that meaningful relationships in healthcare sales require 7–12 touches before a referral pattern develops. Persistence — combined with genuine value — separates reps who build territories from those who plateau.",
  },
  {
    id: 18,
    category: "Compliance & Ethics",
    question: "The Federal Anti-Kickback Statute prohibits hospice reps from doing which of the following?",
    options: [
      "Meeting with discharge planners more than once per week",
      "Offering gifts, meals, or remuneration to referral sources in exchange for patient referrals",
      "Discussing hospice eligibility criteria with physicians who haven't asked",
      "Leaving printed materials at a facility without prior approval from the administrator",
    ],
    correctIndex: 1,
    explanation: "The Anti-Kickback Statute (42 U.S.C. § 1320a-7b) makes it a federal crime to offer anything of value to induce or reward referrals for Medicare-covered services. This applies to meals, gifts, event tickets, and any other remuneration. Frequency of visits and educational discussions are not covered under this statute.",
  },
  {
    id: 19,
    category: "Compliance & Ethics",
    question: "Under HIPAA, a hospice rep discussing a specific patient's clinical condition with a discharge planner at the referring facility is:",
    options: [
      "Always a HIPAA violation, since the rep is not a clinical employee",
      "Permissible only if the patient has signed a specific HIPAA release form for that conversation",
      "Generally permissible for treatment coordination purposes — sharing minimum necessary information to facilitate care",
      "Not regulated by HIPAA since the discharge planner already has the patient's information",
    ],
    correctIndex: 2,
    explanation: "HIPAA permits sharing of protected health information for treatment, payment, and healthcare operations without a separate authorization. Care coordination between a referring facility and a hospice provider falls under the treatment exception. 'Minimum necessary' information should guide what is shared.",
  },
  {
    id: 20,
    category: "Sales Methodology",
    question: "Which of the following best describes the Spartan approach to hospice sales?",
    options: [
      "Volume-based cold calling with a focus on reach and frequency",
      "Relationship-first engagement built on consistent accountability, ethical messaging, and measurable weekly execution",
      "Patient advocacy that positions the rep as a clinical resource rather than a salesperson",
      "Digital-first outreach using LinkedIn and email to reduce time spent in the field",
    ],
    correctIndex: 1,
    explanation: "The Spartan method is grounded in consistent, accountable field execution — not volume alone. It combines relationship-building with territory discipline, ethical clinical conversations, and weekly performance metrics. The goal is a system that produces predictable referral growth, not sporadic wins.",
  },
];

type Screen = "intro" | "question" | "results";

export default function Quiz() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [revealed, setRevealed] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const question = questions[current];
  const score = answers.filter((a, i) => a === questions[i].correctIndex).length;
  const pct = Math.round((score / questions.length) * 100);

  const performanceLabel = () => {
    if (pct >= 90) return { label: "Expert", color: "text-green-600 dark:text-green-400" };
    if (pct >= 75) return { label: "Proficient", color: "text-blue-600 dark:text-blue-400" };
    if (pct >= 55) return { label: "Developing", color: "text-yellow-600 dark:text-yellow-400" };
    return { label: "Needs Work", color: "text-red-600 dark:text-red-400" };
  };

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
  };

  const handleReveal = () => {
    if (selected === null) return;
    const updated = [...answers];
    updated[current] = selected;
    setAnswers(updated);
    setRevealed(true);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setScreen("results");
    }
  };

  const handleRestart = () => {
    setScreen("intro");
    setCurrent(0);
    setSelected(null);
    setAnswers(new Array(questions.length).fill(null));
    setRevealed(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const perf = performanceLabel();

  return (
    <>
      <SEO
        title="Hospice Sales Knowledge Quiz | Spartan Coaching"
        description="Test your hospice sales knowledge across eligibility, objection handling, territory strategy, physician engagement, and compliance."
      />

      <style>{`
        @media print {
          header, footer, nav, .no-print, .back-button-wrap { display: none !important; }
          .print-results { display: block !important; }
          body { background: white !important; color: black !important; }
          .quiz-results-card { box-shadow: none !important; border: 1px solid #ccc !important; }
        }
      `}</style>

      <div className="min-h-screen bg-background">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

          {/* ── INTRO SCREEN ── */}
          {screen === "intro" && (
            <div className="space-y-8">
              <div className="back-button-wrap">
                <BackButton />
              </div>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-foreground">
                  Hospice Sales Knowledge Quiz
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Test your knowledge across eligibility criteria, objection handling, territory strategy, physician engagement, follow-up, and compliance.
                </p>
              </div>

              <Card className="quiz-results-card">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div>
                      <div className="text-3xl font-black text-foreground">{questions.length}</div>
                      <div className="text-sm text-muted-foreground">Questions</div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-foreground">6</div>
                      <div className="text-sm text-muted-foreground">Topics</div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-foreground">~10</div>
                      <div className="text-sm text-muted-foreground">Minutes</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground mb-6">
                    {["Eligibility & Medicare Hospice Benefit", "Clinical Terminology", "Objection Handling", "Territory Strategy", "Physician & Follow-Up", "Compliance & Ethics"].map(topic => (
                      <div key={topic} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setScreen("question")}
                    data-testid="button-start-quiz"
                  >
                    Start Quiz
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── QUESTION SCREEN ── */}
          {screen === "question" && (
            <div className="space-y-6">
              <div className="no-print">
                <BackButton />
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Question {current + 1} of {questions.length}</span>
                  <Badge variant="secondary" data-testid="badge-category">{question.category}</Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                    data-testid="progress-bar"
                  />
                </div>
              </div>

              {/* Question */}
              <Card className="quiz-results-card">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl leading-snug" data-testid="text-question">
                    {question.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {question.options.map((option, idx) => {
                    const isSelected = selected === idx;
                    const isCorrect = idx === question.correctIndex;
                    const showResult = revealed;

                    let stateClass = "cursor-pointer hover-elevate border-border";
                    if (showResult) {
                      if (isCorrect) stateClass = "border-green-500 bg-green-50 dark:bg-green-950/30 cursor-default";
                      else if (isSelected && !isCorrect) stateClass = "border-red-400 bg-red-50 dark:bg-red-950/30 cursor-default";
                      else stateClass = "opacity-50 cursor-default border-border";
                    } else if (isSelected) {
                      stateClass = "border-primary bg-primary/5 cursor-pointer";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-md border transition-colors flex items-start gap-3",
                          stateClass
                        )}
                        data-testid={`option-${idx}`}
                        disabled={revealed}
                      >
                        <span className="flex-shrink-0 mt-0.5">
                          {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />}
                          {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                          {(!showResult || (!isCorrect && !isSelected)) && (
                            <span className={cn(
                              "inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs font-bold",
                              isSelected ? "border-primary text-primary bg-primary/10" : "border-muted-foreground/40 text-muted-foreground"
                            )}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                          )}
                        </span>
                        <span className={cn(
                          "text-sm leading-relaxed",
                          showResult && isCorrect ? "text-foreground font-medium" : "text-foreground"
                        )}>
                          {option}
                        </span>
                      </button>
                    );
                  })}

                  {/* Explanation */}
                  {revealed && (
                    <div className="mt-4 p-4 rounded-md bg-muted/60 border border-border" data-testid="text-explanation">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground">Explanation: </span>
                        {question.explanation}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    {!revealed ? (
                      <Button
                        onClick={handleReveal}
                        disabled={selected === null}
                        className="flex-1"
                        data-testid="button-submit-answer"
                      >
                        Submit Answer
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        className="flex-1"
                        data-testid="button-next-question"
                      >
                        {current < questions.length - 1 ? "Next Question" : "See Results"}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── RESULTS SCREEN ── */}
          {screen === "results" && (
            <div className="space-y-6" ref={resultsRef}>
              <div className="no-print">
                <BackButton />
              </div>

              {/* Score summary */}
              <Card className="quiz-results-card text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="text-6xl font-black text-foreground mb-1" data-testid="text-score">
                    {score} <span className="text-3xl text-muted-foreground font-normal">/ {questions.length}</span>
                  </div>
                  <div className={cn("text-2xl font-bold mb-2", perf.color)} data-testid="text-performance-label">
                    {perf.label}
                  </div>
                  <p className="text-muted-foreground text-sm mb-6">
                    You answered {score} of {questions.length} questions correctly ({pct}%).
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button onClick={handlePrint} variant="outline" className="no-print" data-testid="button-print-results">
                      <Printer className="w-4 h-4 mr-2" />
                      Print Results
                    </Button>
                    <Button onClick={handleRestart} variant="outline" className="no-print" data-testid="button-retake-quiz">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Retake Quiz
                    </Button>
                    <Button asChild variant="outline" className="no-print" data-testid="button-study-knowledge-base">
                      <Link href="/learn/knowledge-base">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Study Knowledge Base
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Per-question breakdown */}
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-foreground">Question Breakdown</h2>
                {questions.map((q, i) => {
                  const userAnswer = answers[i];
                  const correct = userAnswer === q.correctIndex;
                  return (
                    <Card
                      key={q.id}
                      className={cn(
                        "quiz-results-card",
                        correct ? "border-green-500/40" : "border-red-400/40"
                      )}
                      data-testid={`result-card-${q.id}`}
                    >
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {correct
                              ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              : <XCircle className="w-5 h-5 text-red-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">{q.category}</Badge>
                              <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground mb-2">{q.question}</p>
                            {!correct && userAnswer !== null && (
                              <p className="text-xs text-red-600 dark:text-red-400 mb-1">
                                Your answer: {q.options[userAnswer]}
                              </p>
                            )}
                            <p className="text-xs text-green-700 dark:text-green-400 mb-2">
                              Correct: {q.options[q.correctIndex]}
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 pb-8 no-print">
                <Button onClick={handlePrint} variant="outline" data-testid="button-print-results-bottom">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Results
                </Button>
                <Button onClick={handleRestart} variant="outline" data-testid="button-retake-quiz-bottom">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake Quiz
                </Button>
                <Button asChild variant="outline" data-testid="button-study-knowledge-base-bottom">
                  <Link href="/learn/knowledge-base">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Study Knowledge Base
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
