import { db, pool } from "./db";
import { resources, podcasts, articles } from "@shared/schema";
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

export async function seedDatabase() {
  console.log("Starting database seed...");
  console.log(`Environment: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`Database URL exists: ${!!process.env.DATABASE_URL}`);

  try {
    // Test database connection first
    console.log("Testing database connection...");
    const testResult = await db.execute(sql`SELECT 1 as test`);
    console.log("Database connection successful");

    // Check if resources already exist
    console.log("Checking existing resources...");
    const existingResources = await db.select().from(resources);
    console.log(`Found ${existingResources.length} existing resources`);
    
    if (existingResources.length === 0) {
      console.log("Seeding resources...");
      const insertedResources = await db.insert(resources).values(trainingResources).returning();
      console.log(`Successfully inserted ${insertedResources.length} resources`);
    } else {
      console.log(`Resources already exist (${existingResources.length} found), skipping seed`);
    }

    // Check if articles already exist
    console.log("Checking existing articles...");
    const existingArticles = await db.select().from(articles);
    console.log(`Found ${existingArticles.length} existing articles`);
    
    if (existingArticles.length === 0) {
      console.log("Seeding articles...");
      const insertedArticles = await db.insert(articles).values(sampleArticles).returning();
      console.log(`Successfully inserted ${insertedArticles.length} articles`);
    } else {
      console.log(`Articles already exist (${existingArticles.length} found), skipping seed`);
    }

    console.log("Database seed completed successfully!");
    return true;
  } catch (error: any) {
    console.error("Error seeding database:");
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    if (error?.stack) {
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
}

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
