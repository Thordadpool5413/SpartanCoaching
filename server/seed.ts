import { db, pool } from "./db";
import { resources, podcasts, articles, testimonials, caseStudies, assessments, assessmentQuestions } from "@shared/schema";
import { sql } from "drizzle-orm";

const trainingResources = [
  {
    title: "Cold Call Opening Script",
    description: "Expert 30-second opening with psychology-backed framework. Includes Tier 1 & Tier 2 discovery questions, advanced objection handling, and credibility anchoring techniques. Science-based approach to healthcare decision-makers.",
    fileUrl: "/resources/cold-call-script.pdf",
    category: "script",
  },
  {
    title: "Sales Territory Analysis Template",
    description: "Professional territory planning with facility inventory analysis, opportunity sizing, account prioritization matrix (A/B/C priority), and revenue opportunity calculation. Complete strategic framework.",
    fileUrl: "/resources/territory-template.pdf",
    category: "template",
  },
  {
    title: "Pre-Call Research & Preparation Checklist",
    description: "Expert two-week preparation framework. Two-week strategic assessment, one-week tactical prep, three-day materials development, logistics planning, execution framework, and post-call follow-up procedures.",
    fileUrl: "/resources/research-checklist.pdf",
    category: "checklist",
  },
  {
    title: "Medicare/Medicaid Hospice Regulations",
    description: "Comprehensive compliance reference covering four federal eligibility criteria (42 CFR 418.24), disease-specific clinical guidelines (cancer, COPD, CHF, dementia, renal), and optimal 4-step referral process framework.",
    fileUrl: "/resources/regulations-guide.pdf",
    category: "guide",
  },
  {
    title: "Facility-Type Specific Scripts",
    description: "Expert cold call scripts customized for Acute Care Hospitals (24-48 hr windows, readmission penalties), Skilled Nursing Facilities (CMS therapy scrutiny), and Assisted Living (family satisfaction focus). Facility-specific pain points and responses.",
    fileUrl: "/resources/facility-specific-scripts.pdf",
    category: "script",
  },
  {
    title: "Follow-Up Communication Framework",
    description: "Advanced sequences for moving deals forward. Includes post-call email templates, 7-day nurture sequence, phone scripts with conditional responses, and 30-minute first strategy session structure with execution timeline.",
    fileUrl: "/resources/followup-templates.pdf",
    category: "template",
  },
  {
    title: "Physician Engagement Strategy",
    description: "Advanced framework for medical director alignment. The 5 physician hesitation barriers, 5-step engagement framework (educate, credibility, support, partnership, refinement), physician-specific objection responses, and CME proposal language.",
    fileUrl: "/resources/physician-strategy.pdf",
    category: "guide",
  },
  {
    title: "Case Studies: Real Results & ROI",
    description: "Two documented transformation outcomes: 120-bed SNF (2-3 to 8-10 referrals/month, 300% increase) and 280-bed hospital (6-8 to 14-16/month, 100% increase). Includes specific problems, approaches, and quantified results.",
    fileUrl: "/resources/case-studies.pdf",
    category: "checklist",
  },
  {
    title: "Decision Trees & Strategic Frameworks",
    description: "Expert field reference guides. Advanced objection handling tree (reflex vs real), hospice referral identification tree, and account strategy matrix (A/B/C/D priority allocation). Rapid decision-making frameworks.",
    fileUrl: "/resources/decision-trees.pdf",
    category: "guide",
  },
];

const additionalResources = [
  {
    title: "Weekly Activity Tracker",
    description: "Track your daily conversations, referrals, and admissions across a full work week. Includes space for notes on each account visit and a weekly reflection section to identify patterns and improvement areas.",
    fileUrl: "/resources/weekly-activity-tracker.pdf",
    category: "template",
  },
  {
    title: "Hospice Eligibility Quick Reference",
    description: "A concise reference card covering Medicare hospice eligibility criteria for the most common diagnoses. Includes specific decline indicators for cardiac, pulmonary, neurological, liver, renal, and cancer diagnoses.",
    fileUrl: "/resources/eligibility-quick-reference.pdf",
    category: "guide",
  },
  {
    title: "New Hire Onboarding Checklist",
    description: "A structured 90 day onboarding plan for new hospice sales representatives. Covers territory mapping, account research, initial outreach scripts, ride along preparation, and milestone checkpoints for weeks 1, 2, 4, 8, and 12.",
    fileUrl: "/resources/new-hire-onboarding.pdf",
    category: "checklist",
  },
  {
    title: "Lunch and Learn Presentation Template",
    description: "A ready to customize presentation template for delivering educational lunch and learn sessions at referral sources. Covers hospice misconceptions, eligibility basics, and the referral process in a format designed for 15 to 20 minute sessions.",
    fileUrl: "/resources/lunch-learn-template.pdf",
    category: "template",
  },
  {
    title: "Account Tiering Worksheet",
    description: "A practical worksheet for categorizing your referral sources into A, B, and C tiers based on referral volume, growth potential, and relationship strength. Includes guidelines for visit frequency by tier.",
    fileUrl: "/resources/account-tiering-worksheet.pdf",
    category: "template",
  },
  {
    title: "Difficult Conversation Preparation Guide",
    description: "A preparation framework for handling sensitive conversations with families, physicians, and facility staff about end of life care. Includes specific language recommendations and common scenarios with suggested approaches.",
    fileUrl: "/resources/difficult-conversation-guide.pdf",
    category: "guide",
  },
];

const sampleArticles = [
  {
    title: "Why Failure Is a Must: Essential Lessons for Personal Development and Success",
    description: "Why failure is needed. Take a few moments and check out the article.",
    linkedinUrl: "https://www.linkedin.com/posts/nicholas-lynch-coaching_why-failure-is-needed-take-a-few-moments-activity-7395222645656416256-oIr7",
    publishDate: Date.now(),
    featured: true,
    pdfUrl: null,
  },
];

const additionalArticles = [
  {
    title: "The Real Reason Your Hospice Census Is Stuck",
    description: "Most hospice organizations blame their census plateau on market conditions or competition. The truth is almost always internal. This article walks through the three most common internal barriers to census growth and what leadership can do about each one.",
    linkedinUrl: "https://www.linkedin.com/pulse/real-reason-your-hospice-census-stuck-nicholas-lynch",
    publishDate: 1762992000000,
    featured: true,
    pdfUrl: null,
  },
  {
    title: "Stop Calling It a Cold Call",
    description: "The phrase cold call creates the wrong mindset before you even pick up the phone. When you reframe outreach as education and relationship building, everything changes. Here is how to shift your thinking and your results.",
    linkedinUrl: "https://www.linkedin.com/pulse/stop-calling-it-cold-call-nicholas-lynch",
    publishDate: 1762387200000,
    featured: false,
    pdfUrl: null,
  },
  {
    title: "What Your Discharge Planners Wish You Knew",
    description: "After interviewing dozens of discharge planners across the country, the patterns are clear. They do not want another lunch. They do not want another brochure. They want reliability, responsiveness, and someone who makes their job easier. This article breaks down exactly what that looks like.",
    linkedinUrl: "https://www.linkedin.com/pulse/what-your-discharge-planners-wish-you-knew-nicholas-lynch",
    publishDate: 1761782400000,
    featured: false,
    pdfUrl: null,
  },
  {
    title: "Territory Planning Is Not Optional",
    description: "The reps who consistently hit their numbers all share one thing in common: they plan their territory with precision. This article covers the basics of territory planning that most hospice organizations skip entirely, from account tiering to weekly route optimization.",
    linkedinUrl: "https://www.linkedin.com/pulse/territory-planning-not-optional-nicholas-lynch",
    publishDate: 1761177600000,
    featured: true,
    pdfUrl: null,
  },
  {
    title: "The Coaching Conversation Your Sales Manager Owes You",
    description: "If your one on ones consist of 'how are your numbers looking,' you are not being coached. Real coaching means your manager is helping you think differently about your accounts, your conversations, and your process. This article outlines what a productive coaching conversation should include.",
    linkedinUrl: "https://www.linkedin.com/pulse/coaching-conversation-your-sales-manager-owes-you-nicholas-lynch",
    publishDate: 1760572800000,
    featured: false,
    pdfUrl: null,
  },
  {
    title: "Empathy Is Not a Sales Technique",
    description: "Too many sales training programs teach empathy as a tactic. Something you say to get people to trust you. That is manipulation, not empathy. In hospice sales, genuine empathy means understanding what families and clinicians are going through and showing up accordingly. This article explores the difference.",
    linkedinUrl: "https://www.linkedin.com/pulse/empathy-not-sales-technique-nicholas-lynch",
    publishDate: 1759968000000,
    featured: false,
    pdfUrl: null,
  },
  {
    title: "Five Signs Your Hospice Sales Team Needs Outside Help",
    description: "Not every organization needs a consultant. But there are clear warning signs that internal coaching alone is not enough. High turnover among reps, a census that has flatlined for more than two quarters, and a team that cannot articulate their value proposition are just the start.",
    linkedinUrl: "https://www.linkedin.com/pulse/five-signs-your-hospice-sales-team-needs-outside-help-nicholas-lynch",
    publishDate: 1759363200000,
    featured: false,
    pdfUrl: null,
  },
];

const samplePodcasts = [
  { title: "The First 90 Days: Building Your Territory From Scratch", description: "What does it actually look like to walk into a brand new territory with zero relationships? In this episode, Nick breaks down the exact steps a new hospice rep should take in their first 90 days. From mapping your territory to identifying your first 20 accounts, this is the playbook most companies never give you.", episodeNumber: 1, audioUrl: null, duration: "34:12" },
  { title: "Why Most Hospice Reps Fail at Follow Up (And What to Do Instead)", description: "Follow up is where most reps lose. Not because they do not try, but because they do it wrong. This episode covers the difference between checking in and adding value, how to build a follow up rhythm that does not feel pushy, and why most reps give up two conversations too early.", episodeNumber: 2, audioUrl: null, duration: "28:45" },
  { title: "Understanding the Physician Referral: What Doctors Actually Want From You", description: "Most hospice reps treat physician offices like any other referral source. They are not. In this episode, we cover what physicians actually need to hear, how to earn trust in a clinical setting, and the biggest mistakes reps make when approaching doctor offices.", episodeNumber: 3, audioUrl: null, duration: "31:20" },
  { title: "Objection Handling: When the Facility Says They Already Have a Hospice Provider", description: "This is the most common objection in the field and most reps handle it terribly. Nick walks through the real reason behind the objection, why competing on price never works, and the three step approach that opens doors even when someone else already has the contract.", episodeNumber: 4, audioUrl: null, duration: "26:58" },
  { title: "Territory Management for the Rep Who Feels Overwhelmed", description: "When you have 100 accounts and 20 workdays in a month, something has to give. This episode breaks down how to prioritize your accounts, when to cut underperforming sources, and how to build a weekly rhythm that keeps you consistent without burning out.", episodeNumber: 5, audioUrl: null, duration: "33:40" },
  { title: "The Admission Conversation: What Happens After the Referral", description: "Getting the referral is only half the battle. This episode covers the admission conversation with families, how to set expectations without overpromising, and the specific language that helps families feel confident about choosing hospice.", episodeNumber: 6, audioUrl: null, duration: "29:15" },
  { title: "Building Real Relationships With Discharge Planners", description: "Discharge planners are some of the busiest people in healthcare. If you want their referrals, you need to make their job easier, not harder. This episode covers what discharge planners actually care about, how to become their go to hospice contact, and the small things that separate great reps from average ones.", episodeNumber: 7, audioUrl: null, duration: "27:33" },
  { title: "Clinical Conversations for Non Clinical Reps", description: "You do not need a nursing degree to have credible clinical conversations. But you do need to understand the basics. This episode covers the clinical language every hospice rep should know, how to discuss eligibility criteria with confidence, and how to recognize when a patient might qualify even when the referral source is unsure.", episodeNumber: 8, audioUrl: null, duration: "35:08" },
  { title: "Coaching Your Team: What Sales Leaders Get Wrong About Ride Alongs", description: "Ride alongs should be the most valuable coaching tool a sales leader has. Instead, most leaders turn them into silent observation sessions or worse, take over the conversation entirely. This episode is for sales managers who want to coach effectively in the field.", episodeNumber: 9, audioUrl: null, duration: "30:22" },
  { title: "The Ethics of Hospice Sales: Where the Line Actually Is", description: "Selling hospice is not like selling any other product. There are real ethical boundaries that matter. This episode covers what ethical hospice sales looks like, where the line is between education and pressure, and how to build a career you can be proud of in this industry.", episodeNumber: 10, audioUrl: null, duration: "32:45" },
];

const sampleTestimonials = [
  {
    name: "Sarah M.",
    title: "Hospice Liaison",
    company: "Regional Hospice Provider",
    quote: "I was making visits but referrals stalled at 'we'll think about it.' Nick taught me to handle objections in the moment instead of leaving confused. My top five accounts now actually call me when they have an eligible patient.",
    outcome: "Conversion rate from visit to referral increased 52% in first quarter. More conversions meant more patients received care earlier, because conversations that were stalling finally moved forward.",
    category: "individual",
    featured: true,
    displayOrder: 0,
  },
  {
    name: "James T.",
    title: "Hospice Liaison",
    company: "Multi-State Hospice Organization",
    quote: "Before Spartan, I had a full calendar but no system. Nick showed me how to prioritize accounts that actually matter and build follow-up into my routine. I cut drive time by a third and admissions went up, not down.",
    outcome: "Reduced weekly drive time from 18 hours to 12, referrals up 28%. Less time on the road meant better preparation for the visits that matter, and more families reached.",
    category: "individual",
    featured: false,
    displayOrder: 1,
  },
  {
    name: "Maria R.",
    title: "Hospice Liaison",
    company: "Nonprofit Hospice",
    quote: "The objection handling practice was brutal but necessary. I learned what to say when a social worker pushes back on timing or when a physician wants 'one more test.' Now I guide the conversation instead of reacting to it.",
    outcome: "Average time from referral to admission dropped from 4.2 days to 2.6 days. Each day shorter is a day a patient spends less time managing symptoms without expert support.",
    category: "individual",
    featured: false,
    displayOrder: 2,
  },
];

const sampleCaseStudies = [
  {
    title: "From Busy to Productive: Territory Transformation",
    clientLabel: "Mid-Size Regional Hospice / Individual Rep Coaching",
    challenge: "Experienced liaison was making 25+ visits per week but only converting 12% to referrals. Calendar packed with stops at low-volume accounts while high-opportunity SNFs received inconsistent attention. Objections from discharge planners went unanswered, causing deals to stall at 'we'll call you.'",
    solution: "90-day intensive territory redesign: Mapped all 47 accounts by actual referral volume and patient demographics. Built A/B/C prioritization framework with specific visit frequency for each tier. Practiced objection handling for top three stall points. Implemented weekly pipeline review to track every active opportunity.",
    results: [
      "Conversion rate climbed from 12% to 34% in 12 weeks",
      "Top 8 accounts now generate 67% of monthly referrals (was 28%)",
      "Weekly drive time reduced from 22 hours to 14 hours",
      "Lost zero deals to stall objections in final 30 days",
      "More patients received timely referrals as the conversion barriers that had stalled care were removed",
    ],
    category: "individual",
    displayOrder: 0,
  },
  {
    title: "Building a Coaching System That Sticks",
    clientLabel: "For-Profit Hospice Provider / Sales Leadership Development",
    challenge: "Director inherited a six-person team with wildly inconsistent results. Top performer hit 18 admissions monthly while bottom two averaged 4. No documented process, no structured coaching, and manager spent most time firefighting instead of developing talent. Team morale low, turnover high.",
    solution: "Six-month leadership transformation: Built a weekly coaching rhythm with 15-minute one-on-ones focused on one skill at a time. Created a simple pipeline tracking system that takes 10 minutes to update. Trained manager to run structured field rides with clear observation criteria. Implemented new rep onboarding program with week-by-week milestones.",
    results: [
      "All six reps hit monthly targets for four straight quarters",
      "Team average climbed from 9.2 to 14.6 admissions per rep per month",
      "Manager coaching time increased from 2 hours per week to 8 hours per week",
      "New rep time to first admission dropped from 11 weeks to 3.5 weeks",
      "Zero voluntary turnover in 12 months following implementation",
      "Faster onboarding and a higher-performing team meant fewer eligible patients went unserved in the market during that period",
    ],
    category: "leadership",
    displayOrder: 1,
  },
  {
    title: "Scaling Execution Across Markets",
    clientLabel: "Multi-State Hospice Organization / Corporate System Implementation",
    challenge: "Ten markets operating as independent units with no shared process or common language. Executive team could not compare performance across regions or identify why some markets thrived while others struggled. New acquisitions took 18+ months to reach profitability.",
    solution: "18-month enterprise transformation: Collaborated with top performers from each market to design one unified sales process. Trained all regional managers in the new system with emphasis on field application, not theory. Built simple performance dashboard that tracks leading indicators. Conducted quarterly calibration sessions where managers share what is working.",
    results: [
      "All 10 markets now use identical account prioritization and follow-up framework",
      "Performance variance across markets reduced from 340% to 78%",
      "New acquisitions reach break-even in 7 months (was 19 months)",
      "System adoption measured at 91% compliance after 15 months",
      "Forecast accuracy improved from 58% to 86% at corporate level",
      "Referral volume up 37% year-over-year with same headcount",
      "With performance variance reduced and referral volume growing, more families across all 10 markets received access to care at the right time",
    ],
    category: "corporate",
    displayOrder: 2,
  },
];

async function seedByTitle(table: any, allItems: any[], label: string) {
  const existing: any[] = await db.select().from(table);
  const existingTitles = new Set(existing.map((r: any) => r.title));
  const newItems = allItems.filter((item: any) => !existingTitles.has(item.title));
  if (newItems.length > 0) {
    const inserted = await db.insert(table).values(newItems).returning() as any[];
    console.log(`  Inserted ${inserted.length} new ${label}`);
  } else {
    console.log(`  All ${label} already exist (${existing.length} found)`);
  }
}

async function seedAssessments() {
  const existing = await db.select().from(assessments);
  if (existing.length > 0) {
    console.log(`  Assessments already seeded (${existing.length} found)`);
    return;
  }

  // ── Assessment 1: Knowledge Screen ──────────────────────────────────────
  const [a1] = await db.insert(assessments).values({
    name: "Hospice Sales Representative — Knowledge Screen",
    description: "Initial screen for hospice sales rep candidates. Tests foundational knowledge of the hospice benefit, referral relationships, and the Spartan Method philosophy. Estimated completion time: 15–20 minutes.",
  }).returning();

  await db.insert(assessmentQuestions).values([
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "What is the standard prognosis requirement for a patient to qualify for the Medicare Hospice Benefit?",
      options: [
        "3 months or less",
        "6 months or less if the illness runs its normal course",
        "12 months or less",
        "No prognosis requirement — any terminal diagnosis qualifies",
      ],
      correctAnswer: "6 months or less if the illness runs its normal course",
      displayOrder: 1,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "Which of the following is TRUE about the Medicare Hospice Benefit?",
      options: [
        "It covers only inpatient care",
        "It requires a $500 deductible per stay",
        "It is all-inclusive and waives curative treatment for the terminal diagnosis",
        "It is only available to patients over age 80",
      ],
      correctAnswer: "It is all-inclusive and waives curative treatment for the terminal diagnosis",
      displayOrder: 2,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "How many physicians must certify a patient's terminal prognosis to elect the Medicare Hospice Benefit?",
      options: [
        "One attending physician only",
        "Two physicians — the hospice medical director and the patient's attending physician",
        "Three physicians — attending, specialist, and hospice MD",
        "No physician certification is required for the first benefit period",
      ],
      correctAnswer: "Two physicians — the hospice medical director and the patient's attending physician",
      displayOrder: 3,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "Which staff member in a skilled nursing facility typically controls the highest volume of direct hospice referrals?",
      options: [
        "The facility administrator",
        "The Director of Nursing (DON)",
        "The social worker",
        "The activities director",
      ],
      correctAnswer: "The Director of Nursing (DON)",
      displayOrder: 4,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "Under HIPAA, a hospice sales representative should handle patient-identifying information by:",
      options: [
        "Sharing it freely within the care team to coordinate referrals",
        "Never discussing patient cases in any context",
        "Using only the minimum necessary information with authorized parties",
        "Storing it in personal notes for quick reference during visits",
      ],
      correctAnswer: "Using only the minimum necessary information with authorized parties",
      displayOrder: 5,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "The Spartan Method approach to hospice sales is best described as:",
      options: [
        "High-volume cold calling and transactional relationship management",
        "Competing on price and speed of admission to win market share",
        "Consistent, value-driven presence that builds trust with referral sources over time",
        "Focusing exclusively on physician relationships and ignoring facility staff",
      ],
      correctAnswer: "Consistent, value-driven presence that builds trust with referral sources over time",
      displayOrder: 6,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "A hospice sales rep's most important weekly activity metric should be:",
      options: [
        "Number of brochures and marketing materials distributed",
        "Number of meaningful, in-person interactions with referral sources",
        "Number of cold calls made to new prospects",
        "Number of admissions personally coordinated with the clinical team",
      ],
      correctAnswer: "Number of meaningful, in-person interactions with referral sources",
      displayOrder: 7,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "When a referral source says 'I already have a hospice I work with,' the best first response is:",
      options: [
        "Immediately offer a faster admission turnaround time than the competitor",
        "Ask what they value most about their current hospice relationship",
        "Leave your card and say you will follow up next month",
        "Explain your hospice's clinical superiority in detail",
      ],
      correctAnswer: "Ask what they value most about their current hospice relationship",
      displayOrder: 8,
    },
    {
      assessmentId: a1.id,
      type: "scenario",
      text: "You've been calling on a skilled nursing facility for three months. The Director of Nursing is always polite but has never sent a referral. On your next visit she says, 'Honestly, I don't really see a difference between you and the other hospice reps.' How do you respond in that moment — and describe your specific plan for the next 30 days to change her perception and earn her first referral.",
      options: null,
      correctAnswer: null,
      displayOrder: 9,
    },
    {
      assessmentId: a1.id,
      type: "scenario",
      text: "A hospital discharge planner you have a strong relationship with calls you urgently. She has a patient who is clinically appropriate for hospice and the family has been approached — but the family is resistant and says they are 'not ready to give up.' She asks for your advice on what she should say to them. Walk through exactly how you would coach her through that conversation, including specific language she can use.",
      options: null,
      correctAnswer: null,
      displayOrder: 10,
    },
    {
      assessmentId: a1.id,
      type: "scenario",
      text: "You are four weeks into a new territory. Your manager asks you to present a 90-day ramp plan at your next one-on-one. You have identified 50 potential accounts across SNFs, physician offices, and assisted living facilities. Describe your process for prioritizing which accounts to focus on first, what your first two weeks of activity look like day-by-day, and how you will measure whether you are on track at the 30-day mark.",
      options: null,
      correctAnswer: null,
      displayOrder: 11,
    },
  ]);

  // ── Assessment 2: Field Readiness Evaluation ────────────────────────────
  const [a2] = await db.insert(assessments).values({
    name: "Hospice Sales Representative — Field Readiness Evaluation",
    description: "Final-round evaluation for hospice sales rep candidates. Assesses territory strategy, competitive handling, and scenario judgment. Recommended after a first-round interview. Estimated completion time: 20–25 minutes.",
  }).returning();

  await db.insert(assessmentQuestions).values([
    {
      assessmentId: a2.id,
      type: "quiz",
      text: "In a hospice business context, 'Average Daily Census' (ADC) measures:",
      options: [
        "The number of new referrals received per day",
        "The average number of patients currently on hospice service on any given day",
        "The total number of admissions in a calendar month",
        "The average length of a patient's stay in days",
      ],
      correctAnswer: "The average number of patients currently on hospice service on any given day",
      displayOrder: 1,
    },
    {
      assessmentId: a2.id,
      type: "quiz",
      text: "A 'warm' referral source is best described as:",
      options: [
        "A referral source who has sent at least one patient in the past 90 days",
        "A referral source who has expressed interest but has not yet sent a referral",
        "A referral source you are meeting for the very first time",
        "A referral source currently sending exclusively to a competitor",
      ],
      correctAnswer: "A referral source who has expressed interest but has not yet sent a referral",
      displayOrder: 2,
    },
    {
      assessmentId: a2.id,
      type: "quiz",
      text: "Which approach is most effective when re-engaging a referral source who has gone cold after previously referring?",
      options: [
        "Send a thank-you gift and follow up by phone a week later",
        "Lead with a relevant clinical resource, patient outcome story, or case study tied to their patient population",
        "Offer to host a lunch-and-learn at the facility immediately",
        "Ask your clinical team to make the contact call on your behalf",
      ],
      correctAnswer: "Lead with a relevant clinical resource, patient outcome story, or case study tied to their patient population",
      displayOrder: 3,
    },
    {
      assessmentId: a2.id,
      type: "quiz",
      text: "From a referral source's perspective, why does a patient's length of stay on hospice matter to their referral decisions?",
      options: [
        "Longer stays create more paperwork and documentation burden for the facility",
        "Referral sources associate early, appropriate hospice referrals with better patient comfort and quality of life, which reflects on their own care standards",
        "Short stays indicate the hospice is managing patients efficiently",
        "Length of stay has no meaningful influence on referral decisions",
      ],
      correctAnswer: "Referral sources associate early, appropriate hospice referrals with better patient comfort and quality of life, which reflects on their own care standards",
      displayOrder: 4,
    },
    {
      assessmentId: a2.id,
      type: "quiz",
      text: "The best time to request feedback from a referral source about a recently discharged patient is:",
      options: [
        "At least six months after the patient's discharge to allow emotions to settle",
        "Never — raising past cases risks highlighting any problems that occurred",
        "During a regular relationship visit within two weeks of the patient's discharge or death",
        "Only if the outcome was clearly positive and the family expressed satisfaction",
      ],
      correctAnswer: "During a regular relationship visit within two weeks of the patient's discharge or death",
      displayOrder: 5,
    },
    {
      assessmentId: a2.id,
      type: "scenario",
      text: "You receive word that your top SNF account — responsible for roughly 40% of your monthly admissions — has started splitting referrals with a competitor because the competitor promised faster admission turnaround. You have a scheduled visit with the Director of Nursing tomorrow morning. Write out exactly what you will say in that meeting: your opening, how you address the issue directly, what you offer or commit to, and how you close the conversation.",
      options: null,
      correctAnswer: null,
      displayOrder: 6,
    },
    {
      assessmentId: a2.id,
      type: "scenario",
      text: "Your manager asks you to identify your top 10 accounts to prioritize for the next quarter and explain your reasoning. Walk through your exact process for evaluating and ranking your accounts. What criteria matter most to you, what data or observations do you use, and how do you decide which accounts to deprioritize for now?",
      options: null,
      correctAnswer: null,
      displayOrder: 7,
    },
    {
      assessmentId: a2.id,
      type: "scenario",
      text: "A primary care physician you have never met picks up the phone when you make a cold call to his practice. You can tell from his tone you have about 45 seconds before he becomes impatient. Write out exactly what you say — your opening line, how you differentiate yourself from every other hospice rep who has called his office, and how you close for a specific next step.",
      options: null,
      correctAnswer: null,
      displayOrder: 8,
    },
    {
      assessmentId: a2.id,
      type: "scenario",
      text: "Two of your established referral accounts mention to you in the same week that a competitor's representative has been telling people your hospice has had HIPAA violations and quality-of-care issues. None of it is true. Describe exactly how you handle this situation — what you say to the two accounts that mentioned it, what steps you take internally, and whether and how you address the competitor's representative directly.",
      options: null,
      correctAnswer: null,
      displayOrder: 9,
    },
  ]);

  console.log("  Seeded 2 candidate assessments with 20 questions total");
}

export async function seedDatabase() {
  console.log("Starting database seed...");
  console.log(`Environment: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`Database URL exists: ${!!process.env.DATABASE_URL}`);

  try {
    console.log("Testing database connection...");
    await db.execute(sql`SELECT 1 as test`);
    console.log("Database connection successful");

    await seedByTitle(resources, [...trainingResources, ...additionalResources], "resources");
    await seedByTitle(articles, [...sampleArticles, ...additionalArticles], "articles");
    await seedByTitle(podcasts, samplePodcasts, "podcasts");
    await seedByTitle(testimonials, sampleTestimonials, "testimonials");
    await seedByTitle(caseStudies, sampleCaseStudies, "case studies");
    await seedAssessments();

    console.log("Database seed completed successfully!");
    return true;
  } catch (error: any) {
    console.error("Error seeding database (non-fatal):");
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    return false;
  }
}

