import { db, pool } from "./db";
import { resources, podcasts, articles } from "@shared/schema";
import { sql } from "drizzle-orm";

const trainingResources = [
  {
    title: "Cold Call Opening Script",
    description: "Expert 30-second opening with psychology-backed framework. Includes Tier 1 & Tier 2 discovery questions, advanced objection handling, and credibility anchoring techniques. Science-based approach to healthcare decision-makers.",
    fileUrl: "/resources/files/cold-call-script.pdf",
    category: "script",
  },
  {
    title: "Sales Territory Analysis Template",
    description: "Professional territory planning with facility inventory analysis, opportunity sizing, account prioritization matrix (A/B/C priority), and revenue opportunity calculation. Complete strategic framework.",
    fileUrl: "/resources/files/territory-template.pdf",
    category: "template",
  },
  {
    title: "Pre-Call Research & Preparation Checklist",
    description: "Expert two-week preparation framework. Two-week strategic assessment, one-week tactical prep, three-day materials development, logistics planning, execution framework, and post-call follow-up procedures.",
    fileUrl: "/resources/files/research-checklist.pdf",
    category: "checklist",
  },
  {
    title: "Medicare/Medicaid Hospice Regulations",
    description: "Comprehensive compliance reference covering four federal eligibility criteria (42 CFR 418.24), disease-specific clinical guidelines (cancer, COPD, CHF, dementia, renal), and optimal 4-step referral process framework.",
    fileUrl: "/resources/files/regulations-guide.pdf",
    category: "guide",
  },
  {
    title: "Facility-Type Specific Scripts",
    description: "Expert cold call scripts customized for Acute Care Hospitals (24-48 hr windows, readmission penalties), Skilled Nursing Facilities (CMS therapy scrutiny), and Assisted Living (family satisfaction focus). Facility-specific pain points and responses.",
    fileUrl: "/resources/files/facility-specific-scripts.pdf",
    category: "script",
  },
  {
    title: "Follow-Up Communication Framework",
    description: "Advanced sequences for moving deals forward. Includes post-call email templates, 7-day nurture sequence, phone scripts with conditional responses, and 30-minute first strategy session structure with execution timeline.",
    fileUrl: "/resources/files/followup-templates.pdf",
    category: "template",
  },
  {
    title: "Physician Engagement Strategy",
    description: "Advanced framework for medical director alignment. The 5 physician hesitation barriers, 5-step engagement framework (educate, credibility, support, partnership, refinement), physician-specific objection responses, and CME proposal language.",
    fileUrl: "/resources/files/physician-strategy.pdf",
    category: "guide",
  },
  {
    title: "Case Studies: Real Results & ROI",
    description: "Two documented transformation outcomes: 120-bed SNF (2-3 to 8-10 referrals/month, 300% increase) and 280-bed hospital (6-8 to 14-16/month, 100% increase). Includes specific problems, approaches, and quantified results.",
    fileUrl: "/resources/files/case-studies.pdf",
    category: "checklist",
  },
  {
    title: "Decision Trees & Strategic Frameworks",
    description: "Expert field reference guides. Advanced objection handling tree (reflex vs real), hospice referral identification tree, and account strategy matrix (A/B/C/D priority allocation). Rapid decision-making frameworks.",
    fileUrl: "/resources/files/decision-trees.pdf",
    category: "guide",
  },
];

const additionalResources = [
  {
    title: "Weekly Activity Tracker",
    description: "Track your daily conversations, referrals, and admissions across a full work week. Includes space for notes on each account visit and a weekly reflection section to identify patterns and improvement areas.",
    fileUrl: "/resources/files/weekly-activity-tracker.pdf",
    category: "template",
  },
  {
    title: "Hospice Eligibility Quick Reference",
    description: "A concise reference card covering Medicare hospice eligibility criteria for the most common diagnoses. Includes specific decline indicators for cardiac, pulmonary, neurological, liver, renal, and cancer diagnoses.",
    fileUrl: "/resources/files/eligibility-quick-reference.pdf",
    category: "guide",
  },
  {
    title: "New Hire Onboarding Checklist",
    description: "A structured 90 day onboarding plan for new hospice sales representatives. Covers territory mapping, account research, initial outreach scripts, ride along preparation, and milestone checkpoints for weeks 1, 2, 4, 8, and 12.",
    fileUrl: "/resources/files/new-hire-onboarding.pdf",
    category: "checklist",
  },
  {
    title: "Lunch and Learn Presentation Template",
    description: "A ready to customize presentation template for delivering educational lunch and learn sessions at referral sources. Covers hospice misconceptions, eligibility basics, and the referral process in a format designed for 15 to 20 minute sessions.",
    fileUrl: "/resources/files/lunch-learn-template.pdf",
    category: "template",
  },
  {
    title: "Account Tiering Worksheet",
    description: "A practical worksheet for categorizing your referral sources into A, B, and C tiers based on referral volume, growth potential, and relationship strength. Includes guidelines for visit frequency by tier.",
    fileUrl: "/resources/files/account-tiering-worksheet.pdf",
    category: "template",
  },
  {
    title: "Difficult Conversation Preparation Guide",
    description: "A preparation framework for handling sensitive conversations with families, physicians, and facility staff about end of life care. Includes specific language recommendations and common scenarios with suggested approaches.",
    fileUrl: "/resources/files/difficult-conversation-guide.pdf",
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
  { title: "The First 90 Days: Building Your Territory From Scratch", description: "What does it actually look like to walk into a brand new territory with zero relationships? In this episode, Nick breaks down the exact steps a new hospice rep should take in their first 90 days. From mapping your territory to identifying your first 20 accounts, this is the playbook most companies never give you.", episodeNumber: 1, audioUrl: "", duration: "34:12" },
  { title: "Why Most Hospice Reps Fail at Follow Up (And What to Do Instead)", description: "Follow up is where most reps lose. Not because they do not try, but because they do it wrong. This episode covers the difference between checking in and adding value, how to build a follow up rhythm that does not feel pushy, and why most reps give up two conversations too early.", episodeNumber: 2, audioUrl: "", duration: "28:45" },
  { title: "Understanding the Physician Referral: What Doctors Actually Want From You", description: "Most hospice reps treat physician offices like any other referral source. They are not. In this episode, we cover what physicians actually need to hear, how to earn trust in a clinical setting, and the biggest mistakes reps make when approaching doctor offices.", episodeNumber: 3, audioUrl: "", duration: "31:20" },
  { title: "Objection Handling: When the Facility Says They Already Have a Hospice Provider", description: "This is the most common objection in the field and most reps handle it terribly. Nick walks through the real reason behind the objection, why competing on price never works, and the three step approach that opens doors even when someone else already has the contract.", episodeNumber: 4, audioUrl: "", duration: "26:58" },
  { title: "Territory Management for the Rep Who Feels Overwhelmed", description: "When you have 100 accounts and 20 workdays in a month, something has to give. This episode breaks down how to prioritize your accounts, when to cut underperforming sources, and how to build a weekly rhythm that keeps you consistent without burning out.", episodeNumber: 5, audioUrl: "", duration: "33:40" },
  { title: "The Admission Conversation: What Happens After the Referral", description: "Getting the referral is only half the battle. This episode covers the admission conversation with families, how to set expectations without overpromising, and the specific language that helps families feel confident about choosing hospice.", episodeNumber: 6, audioUrl: "", duration: "29:15" },
  { title: "Building Real Relationships With Discharge Planners", description: "Discharge planners are some of the busiest people in healthcare. If you want their referrals, you need to make their job easier, not harder. This episode covers what discharge planners actually care about, how to become their go to hospice contact, and the small things that separate great reps from average ones.", episodeNumber: 7, audioUrl: "", duration: "27:33" },
  { title: "Clinical Conversations for Non Clinical Reps", description: "You do not need a nursing degree to have credible clinical conversations. But you do need to understand the basics. This episode covers the clinical language every hospice rep should know, how to discuss eligibility criteria with confidence, and how to recognize when a patient might qualify even when the referral source is unsure.", episodeNumber: 8, audioUrl: "", duration: "35:08" },
  { title: "Coaching Your Team: What Sales Leaders Get Wrong About Ride Alongs", description: "Ride alongs should be the most valuable coaching tool a sales leader has. Instead, most leaders turn them into silent observation sessions or worse, take over the conversation entirely. This episode is for sales managers who want to coach effectively in the field.", episodeNumber: 9, audioUrl: "", duration: "30:22" },
  { title: "The Ethics of Hospice Sales: Where the Line Actually Is", description: "Selling hospice is not like selling any other product. There are real ethical boundaries that matter. This episode covers what ethical hospice sales looks like, where the line is between education and pressure, and how to build a career you can be proud of in this industry.", episodeNumber: 10, audioUrl: "", duration: "32:45" },
];

async function seedByTitle(table: any, allItems: any[], label: string) {
  const existing: any[] = await db.select().from(table);
  const existingTitles = new Set(existing.map((r: any) => r.title));
  const newItems = allItems.filter((item: any) => !existingTitles.has(item.title));
  if (newItems.length > 0) {
    const inserted: any[] = await db.insert(table).values(newItems).returning();
    console.log(`  Inserted ${inserted.length} new ${label}`);
  } else {
    console.log(`  All ${label} already exist (${existing.length} found)`);
  }
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

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
