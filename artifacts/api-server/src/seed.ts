import { db, pool } from "./db";
import { resources, podcasts, articles, testimonials, caseStudies, assessments, assessmentQuestions } from "@workspace/db";
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
  const alreadySeeded = existing.some(a => a.name === "Hospice Sales Representative Candidate Assessment");
  if (alreadySeeded) {
    console.log(`  Assessments already seeded (${existing.length} found)`);
    return;
  }

  const [a1] = await db.insert(assessments).values({
    name: "Hospice Sales Representative Candidate Assessment",
    description: "A comprehensive evaluation for hospice sales candidates covering the Medicare Hospice Benefit, referral relationships, HIPAA, the Spartan Method philosophy, and real-world scenario judgment. Estimated completion time: 25 to 30 minutes.",
  }).returning();

  await db.insert(assessmentQuestions).values([
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "How long does a patient's prognosis need to be in order to qualify for the Medicare Hospice Benefit?",
      options: [
        "3 months or less",
        "6 months or less if the illness runs its normal course",
        "12 months or less",
        "Any terminal diagnosis qualifies regardless of prognosis",
      ],
      correctAnswer: "6 months or less if the illness runs its normal course",
      displayOrder: 1,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "Which of the following statements about the Medicare Hospice Benefit is accurate?",
      options: [
        "It only covers inpatient hospice stays",
        "It requires a $500 deductible at the start of each benefit period",
        "It is all-inclusive and the patient agrees to stop curative treatment for the terminal diagnosis",
        "It is only available to patients who are 80 years old or older",
      ],
      correctAnswer: "It is all-inclusive and the patient agrees to stop curative treatment for the terminal diagnosis",
      displayOrder: 2,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "How many physicians need to certify a patient has a terminal prognosis before they can elect the hospice benefit?",
      options: [
        "Just one - the patient's attending physician",
        "Two - the hospice medical director and the patient's attending physician",
        "Three - the attending, a specialist, and the hospice medical director",
        "No certification is required for the first 90 days",
      ],
      correctAnswer: "Two - the hospice medical director and the patient's attending physician",
      displayOrder: 3,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "In a skilled nursing facility, which staff member typically has the most influence over which hospice receives referrals?",
      options: [
        "The facility administrator",
        "The Director of Nursing",
        "The social worker",
        "The activities director",
      ],
      correctAnswer: "The Director of Nursing",
      displayOrder: 4,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "When it comes to HIPAA, how should a hospice sales rep handle patient information during referral conversations?",
      options: [
        "Share it freely within the care team to make coordination easier",
        "Avoid discussing any patient cases under any circumstances",
        "Only share the minimum necessary information with people who are authorized to receive it",
        "Keep detailed notes on personal devices for easy reference during visits",
      ],
      correctAnswer: "Only share the minimum necessary information with people who are authorized to receive it",
      displayOrder: 5,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "Which of these best describes the Spartan Method philosophy for hospice sales?",
      options: [
        "Make a high volume of cold calls and track every lead in a CRM",
        "Compete on faster admission turnaround and less hassle for referral staff",
        "Show up consistently, bring real value, and build trust with referral sources over time",
        "Focus only on physician relationships and skip the facility-level staff",
      ],
      correctAnswer: "Show up consistently, bring real value, and build trust with referral sources over time",
      displayOrder: 6,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "What is the single most important weekly activity metric for a hospice sales rep to track?",
      options: [
        "Number of brochures and marketing materials distributed",
        "Number of meaningful face-to-face interactions with referral sources",
        "Number of cold calls made to new prospects",
        "Number of admissions personally coordinated with the clinical team",
      ],
      correctAnswer: "Number of meaningful face-to-face interactions with referral sources",
      displayOrder: 7,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "When a referral source tells you they already work with a hospice, what is your best first move?",
      options: [
        "Immediately offer a faster admission turnaround than whoever they currently use",
        "Ask them what they value most about the hospice relationship they have now",
        "Leave your card and say you will follow up again next month",
        "Walk them through a detailed comparison of your clinical services",
      ],
      correctAnswer: "Ask them what they value most about the hospice relationship they have now",
      displayOrder: 8,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "What does ADC stand for, and what does it actually measure in a hospice business?",
      options: [
        "Annual Daily Count - the number of new referrals received each day",
        "Average Daily Census - the average number of patients on service on any given day",
        "Admissions and Discharge Count - total patients admitted and discharged each month",
        "Average Duration of Care - how long each patient stays on service",
      ],
      correctAnswer: "Average Daily Census - the average number of patients on service on any given day",
      displayOrder: 9,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "How would you describe a referral source who is considered warm?",
      options: [
        "Someone who has sent you at least one referral in the last 90 days",
        "Someone who has shown genuine interest but has not sent you a referral yet",
        "Someone you are visiting for the first time",
        "Someone who currently sends exclusively to a competitor",
      ],
      correctAnswer: "Someone who has shown genuine interest but has not sent you a referral yet",
      displayOrder: 10,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "What tends to be the most effective way to re-engage a referral source who previously referred and then stopped sending patients?",
      options: [
        "Send a thank-you gift and call a week later to check in",
        "Lead with something clinically useful - a case study, patient outcome story, or resource relevant to their patients",
        "Offer to host a lunch and learn at the facility right away",
        "Have your clinical team reach out on your behalf to rebuild the relationship",
      ],
      correctAnswer: "Lead with something clinically useful - a case study, patient outcome story, or resource relevant to their patients",
      displayOrder: 11,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "Why does a patient's length of stay on hospice tend to matter to referral sources when they decide who to send patients to?",
      options: [
        "Longer stays mean more documentation and paperwork burden for the facility",
        "Referral sources connect early and appropriate hospice referrals with better patient comfort and quality of life, which reflects on their own care standards",
        "Short lengths of stay show the hospice is efficient and well-managed",
        "Length of stay generally does not influence referral decisions",
      ],
      correctAnswer: "Referral sources connect early and appropriate hospice referrals with better patient comfort and quality of life, which reflects on their own care standards",
      displayOrder: 12,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "When is the right time to reach out to a referral source for feedback after a patient they referred has passed or been discharged?",
      options: [
        "At least six months later so emotions have settled",
        "Never - bringing it up risks drawing attention to anything that went wrong",
        "Within about two weeks, during a regular relationship visit",
        "Only if the family gave very positive feedback about the experience",
      ],
      correctAnswer: "Within about two weeks, during a regular relationship visit",
      displayOrder: 13,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "What should be your primary goal when visiting a referral account for the very first time?",
      options: [
        "Close the relationship and ask for a referral before the visit ends",
        "Drop off as many brochures and marketing materials as possible",
        "Learn about their patient population and understand what they value in a hospice partner",
        "Walk them through your hospice services in full detail so they know what you offer",
      ],
      correctAnswer: "Learn about their patient population and understand what they value in a hospice partner",
      displayOrder: 14,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "Which of the following would be considered a red flag behavior for a hospice sales rep?",
      options: [
        "Spending most of a visit listening and asking questions",
        "Reaching out to referral sources after patient discharge to check in and gather feedback",
        "Leading with price, admission speed, or a competitor comparison on a first visit",
        "Prioritizing a small number of high-value accounts over spreading visits across every account equally",
      ],
      correctAnswer: "Leading with price, admission speed, or a competitor comparison on a first visit",
      displayOrder: 15,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "When someone in hospice talks about census, what are they referring to?",
      options: [
        "The number of new patient inquiries received in a given month",
        "The total number of patients on service at any point in time",
        "The geographic territory assigned to a sales rep",
        "The number of referral sources in a given territory",
      ],
      correctAnswer: "The total number of patients on service at any point in time",
      displayOrder: 16,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "When a patient's family says they are not ready to give up, what does that usually signal to you as a hospice sales rep?",
      options: [
        "The patient is probably not clinically eligible for hospice yet",
        "The family likely misunderstands what hospice means and may believe it hastens death or means giving up",
        "The referral source made a mistake and this patient should not have been referred",
        "You should step back and let the referral source handle the family conversation on their own",
      ],
      correctAnswer: "The family likely misunderstands what hospice means and may believe it hastens death or means giving up",
      displayOrder: 17,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "Which of the following best describes a high-value referral account worth prioritizing in your territory?",
      options: [
        "Any facility or practice that has a large building and a high staff count",
        "An account with a high volume of patients who match hospice eligibility criteria and where you can build a genuine relationship with the decision-makers",
        "An account that is the farthest from other competitors in your territory",
        "Any account that has agreed to display your marketing materials in their lobby",
      ],
      correctAnswer: "An account with a high volume of patients who match hospice eligibility criteria and where you can build a genuine relationship with the decision-makers",
      displayOrder: 18,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "How often should you generally aim to visit your top-tier referral accounts?",
      options: [
        "Once a month at most so you do not wear out your welcome",
        "Only when they call you with a referral or a question",
        "Weekly or more often, with each visit offering something of value to the relationship",
        "Quarterly, since these accounts already know and trust you",
      ],
      correctAnswer: "Weekly or more often, with each visit offering something of value to the relationship",
      displayOrder: 19,
    },
    {
      assessmentId: a1.id,
      type: "quiz",
      text: "When you are competing with another hospice for the same referral account, what tends to be the most sustainable way to differentiate yourself?",
      options: [
        "Offering faster admission turnaround than the competitor",
        "Being more responsive to calls and messages than anyone else in the market",
        "Building a deeper, more consistent relationship with the referral source than any competitor can match",
        "Having the best-designed printed marketing materials and branded leave-behinds",
      ],
      correctAnswer: "Building a deeper, more consistent relationship with the referral source than any competitor can match",
      displayOrder: 20,
    },
    {
      assessmentId: a1.id,
      type: "scenario",
      text: "You have been calling on a skilled nursing facility for three months. The Director of Nursing is always polite but has never sent you a single referral. On your next visit, she looks at you and says, honestly, she does not really see a difference between you and any of the other hospice reps. How do you respond in that moment? And what does your specific plan look like for the next 30 days to change her perception and earn that first referral?",
      options: null,
      correctAnswer: null,
      displayOrder: 21,
    },
    {
      assessmentId: a1.id,
      type: "scenario",
      text: "A hospital discharge planner you have a solid relationship with calls you sounding stressed. She has a patient who is clinically ready for hospice and she approached the family, but they pushed back and said they are not ready to give up. She is asking you what to say to them. Walk through exactly how you would coach her through that conversation, including the specific language you would suggest she use.",
      options: null,
      correctAnswer: null,
      displayOrder: 22,
    },
    {
      assessmentId: a1.id,
      type: "scenario",
      text: "You find out that your top SNF account, which has been responsible for about 40 percent of your monthly admissions, has started splitting referrals with a competitor because the competitor promised faster admission turnaround. You have a visit with the Director of Nursing scheduled for tomorrow morning. Write out exactly what you plan to say in that meeting - your opening, how you bring up the situation, what you offer or commit to, and how you close the conversation.",
      options: null,
      correctAnswer: null,
      displayOrder: 23,
    },
    {
      assessmentId: a1.id,
      type: "scenario",
      text: "A primary care physician you have never spoken with picks up the phone when you cold call his practice. From his tone you can tell you have about 45 seconds before he becomes impatient and ends the call. Write out exactly what you say - your opening line, how you set yourself apart from every other hospice rep who has called his office, and how you close for a specific next step before he hangs up.",
      options: null,
      correctAnswer: null,
      displayOrder: 24,
    },
    {
      assessmentId: a1.id,
      type: "scenario",
      text: "Two of your established referral accounts tell you in the same week that a rep from a competing hospice has been telling people your organization has had HIPAA violations and quality issues. None of it is true. Describe exactly how you handle this - what you say to the two accounts who brought it up, what steps you take internally, and how you decide whether and how to address the competing rep directly.",
      options: null,
      correctAnswer: null,
      displayOrder: 25,
    },
  ]);

  console.log("  Seeded 1 candidate assessment with 25 questions (20 quiz + 5 scenario)");
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

