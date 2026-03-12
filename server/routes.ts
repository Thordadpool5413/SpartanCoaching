import type { Express } from "express";
import express from "express";
import {
  heavyAiLimit,
  standardAiLimit,
  roleplayLimit,
  roleplayMessageLimit,
  lightAiLimit,
  globalDailyAiCap,
  getAiUsageToday,
} from "./rateLimits";

import path from "path";
import { storage } from "./storage";
import {
  generateComplexResponse,
  generateQuickResponse,
  generateGroundedSearch,
  generateDailyDrill,
  generateChatResponse,
  generateRoleplayResponse,
  generateRoleplayFeedback,
  ALL_DRILLS,
} from "./openai";
import {
  playbookRequestSchema,
  objectionRequestSchema,
  researchRequestSchema,
  chatRequestSchema,
  inquirySchema,
  insertNewsletterSubscriberSchema,
  emailTemplateRequestSchema,
  insertArticleSchema,
  insertVisitorSchema,
  insertResourceSchema,
  insertPodcastSchema,
  insertEventTrackingSchema,
  roleplayStartSchema,
  roleplayMessageSchema,
  drillCompletionRequestSchema,
  sendEmailRequestSchema,
  insertResourceLeadSchema,
  insertSignedAgreementSchema,
} from "@shared/schema";

import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { sendInquiryNotification, sendNewsletterConfirmation, sendGeneratedEmail, sendAgreementConfirmation, sendResourceLeadNotification, sendNewsletterNotification, sendNewsletterBroadcast, sendDripDay3, sendDripDay7, sendSigningRequest, sendSignedAgreementPdf } from "./resend";
import crypto from "crypto";
import { AGREEMENT_TEXTS } from "./agreementTexts";

// Get admin password from environment, default to secure value for development
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "5413";

// Middleware that guards admin-only read endpoints
function requireAdmin(req: any, res: any, next: any) {
  const auth = req.headers["x-admin-auth"];
  if (auth !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Deferred initialization - call this AFTER server.listen()
export async function deferredInit(app: Express): Promise<void> {
  console.log("Deferred initialization complete");
}

export function registerRoutes(app: Express): void {
  // Serve training resources files (PDFs, etc.)
  // Uses /resources/files path to avoid conflict with frontend /resources route
  // In development: ./public/resources (from project root)
  // In production: ./dist/public/resources (bundled with the build)
  const resourcesPath = process.env.NODE_ENV === 'production'
    ? path.join(import.meta.dirname, 'public', 'resources')
    : path.join(import.meta.dirname, '..', 'public', 'resources');
  app.use('/resources/files', express.static(resourcesPath));

  // Backwards-compatible redirect: old /resources/*.pdf paths -> /resources/files/*.pdf
  app.get(/^\/resources\/(.+\.pdf)$/, (req, res) => {
    res.redirect(301, `/resources/files/${req.params[0]}`);
  });

  // robots.txt route
  app.get('/robots.txt', (_req, res) => {
    const baseUrl = `${_req.protocol}://${_req.get('host')}`;
    res.set('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${baseUrl}/sitemap.xml`);
  });

  // XML Sitemap route
  app.get('/sitemap.xml', (_req, res) => {
    const baseUrl = `${_req.protocol}://${_req.get('host')}`;
    
    const pages = [
      { path: '/', priority: '1.0', changefreq: 'weekly' },
      { path: '/services', priority: '0.9', changefreq: 'monthly' },
      { path: '/programs', priority: '0.9', changefreq: 'monthly' },
      { path: '/method', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools', priority: '0.8', changefreq: 'weekly' },
      { path: '/tools/playbooks', priority: '0.7', changefreq: 'monthly' },
      { path: '/tools/objections', priority: '0.7', changefreq: 'monthly' },
      { path: '/tools/research', priority: '0.7', changefreq: 'monthly' },
      { path: '/tools/transcribe', priority: '0.7', changefreq: 'monthly' },
      { path: '/tools/email-templates', priority: '0.7', changefreq: 'monthly' },
      { path: '/tools/role-play', priority: '0.7', changefreq: 'monthly' },
      { path: '/tools/roi-calculator', priority: '0.7', changefreq: 'monthly' },
      { path: '/tools/activity-calculator', priority: '0.7', changefreq: 'monthly' },
      { path: '/tools/branch-profitability', priority: '0.7', changefreq: 'monthly' },
      { path: '/quiz', priority: '0.7', changefreq: 'monthly' },
      { path: '/drills', priority: '0.7', changefreq: 'daily' },
      { path: '/resources', priority: '0.8', changefreq: 'weekly' },
      { path: '/resources/weekly-plan', priority: '0.6', changefreq: 'monthly' },
      { path: '/resources/activity-tracker', priority: '0.6', changefreq: 'monthly' },
      { path: '/resources/quick-start-guide', priority: '0.6', changefreq: 'monthly' },
      { path: '/resources/objection-cards', priority: '0.6', changefreq: 'monthly' },
      { path: '/resources/territory-template', priority: '0.6', changefreq: 'monthly' },
      { path: '/resources/metrics-dashboard', priority: '0.6', changefreq: 'monthly' },
      { path: '/articles', priority: '0.8', changefreq: 'weekly' },
      { path: '/podcasts', priority: '0.8', changefreq: 'weekly' },
      { path: '/testimonials', priority: '0.7', changefreq: 'monthly' },
      { path: '/learn/knowledge-base', priority: '0.7', changefreq: 'monthly' },
      { path: '/about', priority: '0.6', changefreq: 'monthly' },
      { path: '/contact', priority: '0.8', changefreq: 'monthly' },
      { path: '/manifesto', priority: '0.6', changefreq: 'monthly' },
      { path: '/compliance', priority: '0.5', changefreq: 'yearly' },
      { path: '/faq', priority: '0.7', changefreq: 'monthly' },
      { path: '/terms', priority: '0.3', changefreq: 'yearly' },
      { path: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
      { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
      { path: '/legal', priority: '0.4', changefreq: 'yearly' },
      { path: '/baa', priority: '0.3', changefreq: 'yearly' },
      { path: '/contract', priority: '0.3', changefreq: 'yearly' },
      { path: '/nda', priority: '0.3', changefreq: 'yearly' },
      { path: '/emr-access', priority: '0.3', changefreq: 'yearly' },
      { path: '/conflict-of-interest', priority: '0.3', changefreq: 'yearly' },
      { path: '/liability-waiver', priority: '0.3', changefreq: 'yearly' },
      { path: '/testimonial-release', priority: '0.3', changefreq: 'yearly' },
    ];

    const today = new Date().toISOString().split('T')[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${baseUrl}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  });

  // AI Playbook Generator
  app.post("/api/playbooks", heavyAiLimit, globalDailyAiCap, async (req, res) => {
    try {
      const { scenario, desiredOutcomes } = playbookRequestSchema.parse(req.body);
      
      const prompt = `Create a detailed hospice sales playbook for the following scenario:

${scenario}

${desiredOutcomes ? `Desired Outcomes: ${desiredOutcomes}\n\n` : ""}
Please provide:
1. Scenario overview and context
2. Step-by-step actionable strategies
3. Specific talking points and scripts
4. Key takeaways and success metrics

Format the playbook in markdown with clear sections, bullet points, and quoted talking points.`;

      const systemInstruction = `You are an expert hospice sales coach creating detailed, actionable playbooks. Each playbook should include specific strategies, talking points in quotes, and clear action steps. Focus on building trust, demonstrating value, and ethical sales practices aligned with the Spartan Method (Discipline, Empathy, Strategy).`;

      const playbook = await generateComplexResponse(prompt, systemInstruction);
      
      res.json({ playbook });
    } catch (error: any) {
      console.error("Playbook generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate playbook" });
    }
  });

  // AI Objection Handler
  app.post("/api/objections", standardAiLimit, globalDailyAiCap, async (req, res) => {
    try {
      const { objection } = objectionRequestSchema.parse(req.body);
      
      const prompt = `A family or referral source says: "${objection}"

Provide a concise, empathetic response that:
1. Acknowledges their concern
2. Addresses the objection with compassion
3. Offers a next step or question to continue the conversation

Keep it under 100 words and use a warm, professional tone.`;

      const response = await generateQuickResponse(prompt);
      
      res.json({ response });
    } catch (error: any) {
      console.error("Objection handling error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response" });
    }
  });

  // AI Research Tool
  app.post("/api/research", standardAiLimit, globalDailyAiCap, async (req, res) => {
    try {
      const { query } = researchRequestSchema.parse(req.body);
      
      const result = await generateGroundedSearch(query);
      
      res.json(result);
    } catch (error: any) {
      console.error("Research error:", error);
      res.status(500).json({ error: error.message || "Failed to perform research" });
    }
  });

  // Daily Drill Generator
  app.get("/api/daily-drill", lightAiLimit, globalDailyAiCap, async (req, res) => {
    try {
      const drillData = await generateDailyDrill();
      res.json(drillData);
    } catch (error: any) {
      console.error("Daily drill error:", error);
      res.status(500).json({ error: error.message || "Failed to generate daily drill" });
    }
  });

  // Full Drill Library
  app.get("/api/drills", (_req, res) => {
    const library = ALL_DRILLS.map((d, index) => ({ index, category: d.category, drill: d.drill }));
    res.json(library);
  });

  // AI Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, conversationHistory } = chatRequestSchema.parse(req.body);

      const response = await generateChatResponse(prompt, conversationHistory);
      
      res.json({ response });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message || "Failed to generate chat response" });
    }
  });

  // Inquiry Form Submission
  app.post("/api/inquiries", async (req, res) => {
    try {
      const inquiryData = inquirySchema.parse(req.body);
      
      const inquiry = await storage.createInquiry(inquiryData);
      
      storage.trackEvent({ eventType: "contact_form_submission", eventName: "inquiry" }).catch(() => {});
      
      sendInquiryNotification(inquiryData).catch(err => 
        console.error("Failed to send inquiry notification:", err)
      );
      
      console.log("New inquiry received:", inquiry);
      
      res.json({ success: true, inquiry });
    } catch (error: any) {
      console.error("Inquiry submission error:", error);
      res.status(500).json({ error: error.message || "Failed to submit inquiry" });
    }
  });

  // Get All Inquiries (Admin)
  app.get("/api/inquiries", requireAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      
      res.json({ inquiries });
    } catch (error: any) {
      console.error("Get inquiries error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve inquiries" });
    }
  });

  // Toggle inquiry read/unread (Admin)
  app.patch("/api/inquiries/:id/read", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isRead } = req.body;
      const updated = await storage.markInquiryRead(id, Boolean(isRead));
      res.json({ inquiry: updated });
    } catch (error: any) {
      console.error("Mark inquiry read error:", error);
      res.status(500).json({ error: error.message || "Failed to update inquiry" });
    }
  });

  // Newsletter Subscription
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const subscriberData = insertNewsletterSubscriberSchema.parse(req.body);
      
      const subscriber = await storage.subscribeNewsletter(subscriberData);
      
      if (!subscriber) {
        return res.status(400).json({ error: "Failed to subscribe to newsletter" });
      }
      
      sendNewsletterConfirmation(subscriberData.email).catch(err => 
        console.error("Failed to send newsletter confirmation:", err)
      );
      sendNewsletterNotification(subscriberData.email).catch(err =>
        console.error("Failed to send newsletter notification:", err)
      );
      sendDripDay3(subscriberData.email).catch(err =>
        console.error("Drip day 3 failed:", err)
      );
      sendDripDay7(subscriberData.email).catch(err =>
        console.error("Drip day 7 failed:", err)
      );
      
      console.log("Newsletter subscriber:", subscriber);
      
      res.json({ success: true, message: "Successfully subscribed to newsletter" });
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      // Return 400 for validation errors, 500 for other errors
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.message || "Invalid email address" });
      } else {
        res.status(500).json({ error: error.message || "Failed to subscribe to newsletter" });
      }
    }
  });

  // Get Newsletter Subscribers (Admin)
  app.get("/api/newsletter/subscribers", requireAdmin, async (req, res) => {
    try {
      const subscribers = await storage.getNewsletterSubscribers();
      
      res.json({ subscribers });
    } catch (error: any) {
      console.error("Get subscribers error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve subscribers" });
    }
  });

  // Send Newsletter Broadcast (Admin)
  app.post("/api/newsletter/broadcast", requireAdmin, async (req, res) => {
    try {
      const { subject, body } = req.body;
      if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
        return res.status(400).json({ error: "Subject must be at least 3 characters" });
      }
      if (!body || typeof body !== "string" || body.trim().length < 10) {
        return res.status(400).json({ error: "Body must be at least 10 characters" });
      }
      const subscribers = await storage.getNewsletterSubscribers();
      if (subscribers.length === 0) {
        return res.status(400).json({ error: "No subscribers to send to" });
      }
      const emails = subscribers.map((s: any) => s.email);
      const result = await sendNewsletterBroadcast(emails, subject.trim(), body.trim());
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Newsletter broadcast error:", error);
      res.status(500).json({ error: error.message || "Failed to send broadcast" });
    }
  });

  // Email Template Generator
  app.post("/api/email-templates", heavyAiLimit, globalDailyAiCap, async (req, res) => {
    try {
      const { templateType, recipientName, context, customization } = emailTemplateRequestSchema.parse(req.body);
      
      let prompt = "";
      
      if (templateType === "follow_up") {
        prompt = `Create a professional follow-up email for a hospice sales professional.
        
Recipient: ${recipientName || "the prospect"}
Context: ${context}
${customization ? `Additional customization: ${customization}\n` : ""}
The email should:
1. Reference our previous conversation
2. Add value with a relevant insight or resource
3. Include a soft call-to-action
4. Be warm but professional

Format: Provide subject line and email body.`;
      } else if (templateType === "thank_you") {
        prompt = `Create a genuine thank you email for a hospice sales professional.
        
Recipient: ${recipientName || "the recipient"}
Context: ${context}
${customization ? `Additional customization: ${customization}\n` : ""}
The email should:
1. Express sincere gratitude
2. Reinforce the relationship
3. Mention next steps if applicable
4. Be warm and authentic

Format: Provide subject line and email body.`;
      } else {
        prompt = `Create a value-add email that shares helpful content.
        
Recipient: ${recipientName || "the recipient"}
Context: ${context}
${customization ? `Additional customization: ${customization}\n` : ""}
The email should:
1. Share a relevant article, insight, or resource
2. Explain why it's valuable to them
3. Build thought leadership
4. No hard sell - just adding value

Format: Provide subject line and email body.`;
      }

      const systemInstruction = `You are an expert at writing professional, relationship-building emails for hospice sales professionals. Your emails should be warm, authentic, and focused on building trust. Format the output as:

Subject: [subject line]

[Email body with proper greeting, main content, and signature]`;

      const template = await generateComplexResponse(prompt, systemInstruction);
      
      res.json({ template });
    } catch (error: any) {
      console.error("Email template generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate email template" });
    }
  });

  // Article Management Routes
  
  // Create Article
  app.post("/api/articles", async (req, res) => {
    try {
      const articleData = insertArticleSchema.parse(req.body);
      
      const article = await storage.createArticle(articleData);
      
      console.log("New article created:", article);
      
      res.json({ success: true, article });
    } catch (error: any) {
      console.error("Create article error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.message || "Invalid article data" });
      } else {
        res.status(500).json({ error: error.message || "Failed to create article" });
      }
    }
  });

  // Get All Articles
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getArticles();
      
      res.json({ articles });
    } catch (error: any) {
      console.error("Get articles error (DB may be unavailable):", error);
      res.json({ articles: [] });
    }
  });

  // Get Single Article
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid article ID" });
      }

      const article = await storage.getArticle(id);
      
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      res.json({ article });
    } catch (error: any) {
      console.error("Get article error:", error);
      res.status(503).json({ error: "Database temporarily unavailable" });
    }
  });

  // Update Article
  app.put("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid article ID" });
      }

      const articleData = insertArticleSchema.parse(req.body);
      
      // Check if article exists first
      const existingArticle = await storage.getArticle(id);
      if (!existingArticle) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      const article = await storage.updateArticle(id, articleData);
      
      console.log("Article updated:", article);
      
      res.json({ success: true, article });
    } catch (error: any) {
      console.error("Update article error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.message || "Invalid article data" });
      } else {
        res.status(500).json({ error: error.message || "Failed to update article" });
      }
    }
  });

  // Delete Article
  app.delete("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid article ID" });
      }

      await storage.deleteArticle(id);
      
      console.log("Article deleted:", id);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete article error:", error);
      res.status(500).json({ error: error.message || "Failed to delete article" });
    }
  });

  // Resource Management Routes
  
  // Get All Resources (Public)
  app.get("/api/resources", async (req, res) => {
    try {
      const resources = await storage.getAllResources();
      
      res.json({ resources });
    } catch (error: any) {
      console.error("Get resources error (DB may be unavailable):", error);
      res.json({ resources: [] });
    }
  });

  // Create Resource (Admin only)
  app.post("/api/resources", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    
    if (adminAuth !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const resourceData = insertResourceSchema.parse(req.body);
      
      const resource = await storage.createResource(resourceData);
      
      console.log("New resource created:", resource);
      
      res.json({ success: true, resource });
    } catch (error: any) {
      console.error("Create resource error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.message || "Invalid resource data" });
      } else {
        res.status(500).json({ error: error.message || "Failed to create resource" });
      }
    }
  });

  // Update Resource (Admin only)
  app.put("/api/resources/:id", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    
    if (adminAuth !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid resource ID" });
      }

      const resourceData = insertResourceSchema.parse(req.body);
      
      // Check if resource exists first
      const existingResource = await storage.getResource(id);
      if (!existingResource) {
        return res.status(404).json({ error: "Resource not found" });
      }
      
      const resource = await storage.updateResource(id, resourceData);
      
      console.log("Resource updated:", resource);
      
      res.json({ success: true, resource });
    } catch (error: any) {
      console.error("Update resource error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.message || "Invalid resource data" });
      } else {
        res.status(500).json({ error: error.message || "Failed to update resource" });
      }
    }
  });

  app.post("/api/resource-leads", async (req, res) => {
    try {
      const leadData = insertResourceLeadSchema.parse(req.body);
      const isNew = await storage.isNewResourceLeadEmail(leadData.email);
      const lead = await storage.captureResourceLead(leadData);
      if (isNew) {
        sendResourceLeadNotification(leadData.name, leadData.email, leadData.resourceTitle).catch(err =>
          console.error("Failed to send resource lead notification:", err)
        );
      } else {
        console.log(`[Lead] Returning user ${leadData.email} — skipping admin notification`);
      }
      res.json({ success: true, lead });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid data provided" });
      } else {
        console.error("Resource lead capture error:", error);
        res.status(500).json({ error: "Failed to capture lead" });
      }
    }
  });

  app.get("/api/resource-leads", requireAdmin, async (_req, res) => {
    try {
      const leads = await storage.getResourceLeads();
      res.json({ leads });
    } catch (error: any) {
      console.error("Get resource leads error:", error);
      res.status(500).json({ error: "Failed to retrieve leads" });
    }
  });

  app.post("/api/admin/send-email", requireAdmin, async (req, res) => {
    try {
      const { to, name, subject, body } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ error: "to, subject, and body are required" });
      }
      const success = await sendGeneratedEmail(to, subject, body);
      if (success) {
        console.log(`[Admin] Email sent to ${to} (${name || "unknown"})`);
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error: any) {
      console.error("Admin send email error:", error);
      res.status(500).json({ error: error.message || "Failed to send email" });
    }
  });

  app.post("/api/cold-call-script", standardAiLimit, async (req, res) => {
    try {
      const { prospectType, prospectName, situation, repName } = req.body;
      if (!prospectType || !situation || situation.length < 10) {
        return res.status(400).json({ error: "prospectType and situation (min 10 chars) are required" });
      }
      const systemPrompt = `You are Nick Lynch, a Spartan Method hospice sales coach with 10+ years of experience coaching hospice liaisons. You create highly specific, immediately usable cold call scripts that respect the prospect's time and lead with clinical value — never pressure tactics.

Your scripts are grounded in the Spartan Method: discipline, empathy, strategy. Every word earns its place. No filler phrases, no corporate speak.

Format your response with exactly these sections using markdown headers:

## Opening Hook
A 25-30 second cold call opener. Natural, confident, curiosity-driven. Mentions the prospect's role specifically. Ends with an open question that invites conversation, not a yes/no.

## Objection Handler 1: [Most Common Objection for This Prospect Type]
**Objection:** [The exact words they typically say]
**Response:** [Your response — acknowledge, pivot, reframe. 2-3 sentences max.]

## Objection Handler 2: [Second Most Common Objection]
**Objection:** [Exact words]
**Response:** [2-3 sentences]

## Objection Handler 3: [Third Most Common Objection]
**Objection:** [Exact words]
**Response:** [2-3 sentences]

## Next Step Ask
One clean closing line to secure a specific next step — a meeting, a 5-minute call, a facility tour. Not vague. Specific.

---
Keep the total script under 400 words. Make it feel like a real person talking, not a corporate training module.`;

      const userPrompt = `Prospect Type: ${prospectType}${prospectName ? `\nProspect Name: ${prospectName}` : ""}
Rep's Situation: ${situation}${repName ? `\nRep's Name: ${repName}` : ""}

Generate a cold call script tailored to this exact situation.`;

      const script = await generateComplexResponse(userPrompt, systemPrompt);
      res.json({ script });
    } catch (error: any) {
      console.error("Cold call script error:", error);
      res.status(500).json({ error: error.message || "Failed to generate script" });
    }
  });

  app.post("/api/weekly-plan-builder", standardAiLimit, async (req, res) => {
    try {
      const { accounts, weeklyGoal, territoryFocus, challenges } = req.body;
      if (!accounts || accounts.length < 10 || !weeklyGoal) {
        return res.status(400).json({ error: "accounts and weeklyGoal are required" });
      }
      const systemPrompt = `You are Nick Lynch, a Spartan Method hospice sales territory management expert. You build specific, disciplined weekly territory plans for hospice liaisons.

Your plans are:
- Specific (named accounts, specific visit objectives, not generic advice)
- Sequenced (accounts are ordered strategically across the week — high-value accounts early, follow-ups mid-week, re-engagements Thursday/Friday)
- Actionable (each day has a clear "win condition" — what success looks like)
- Honest (if an account won't convert this week, say so and deprioritize it)

Format your response exactly like this:

## Monday
**Priority Accounts:**
- [Account Name] — [Specific goal for this visit] | [One talk track focus sentence]

**Daily Win Condition:** [What does success look like today?]

**End-of-Day Task:** [One follow-up or admin action]

## Tuesday
[Same format]

## Wednesday
[Same format]

## Thursday
[Same format]

## Friday
**Priority Accounts:**
[Same format]

**Weekly Review Checklist:**
1. [Question to assess progress toward the weekly goal]
2. [Question about pipeline movement]
3. [Question about relationship quality]
4. [Question about what to carry into next week]
5. [Question about one skill to sharpen]

---
Be specific. Use the actual accounts and goals provided. Do not pad with generic advice. Under 600 words total.`;

      const userPrompt = `Accounts to visit this week:
${accounts}

Weekly Goal: ${weeklyGoal}${territoryFocus ? `\nTerritory Focus: ${territoryFocus}` : ""}${challenges ? `\nBiggest Challenge: ${challenges}` : ""}

Build a specific Monday–Friday territory plan for this week.`;

      const plan = await generateComplexResponse(userPrompt, systemPrompt);
      res.json({ plan });
    } catch (error: any) {
      console.error("Weekly plan builder error:", error);
      res.status(500).json({ error: error.message || "Failed to generate plan" });
    }
  });

  app.post("/api/usage-events", async (req, res) => {
    try {
      const { name, email, toolName } = req.body;
      if (!name || !email || !toolName) {
        return res.status(400).json({ error: "name, email, and toolName are required" });
      }
      const event = await storage.trackUsageEvent({ name, email, toolName });
      res.json({ success: true, event });
    } catch (error: any) {
      console.error("Track usage event error:", error);
      res.status(500).json({ error: "Failed to track usage" });
    }
  });

  app.get("/api/usage-events", requireAdmin, async (_req, res) => {
    try {
      const events = await storage.getUsageEvents();
      res.json({ events });
    } catch (error: any) {
      console.error("Get usage events error:", error);
      res.status(500).json({ error: "Failed to retrieve usage events" });
    }
  });

  app.post("/api/signed-agreements", async (req, res) => {
    try {
      const agreementData = insertSignedAgreementSchema.parse(req.body);
      const agreement = await storage.createSignedAgreement(agreementData);
      
      const signedAtStr = new Date(agreement.signedAt!).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });

      sendAgreementConfirmation({
        agreementType: agreement.agreementType,
        signerName: agreement.signerName,
        signerTitle: agreement.signerTitle,
        signerOrganization: agreement.signerOrganization,
        signerEmail: agreement.signerEmail,
        signedAt: signedAtStr,
      }).catch(err => console.error("Agreement confirmation email failed:", err));

      try {
        const pdfBuffer = await generateAgreementPdf(agreement.agreementType, {
          signerName: agreement.signerName,
          signerTitle: agreement.signerTitle,
          signerOrganization: agreement.signerOrganization,
          signerEmail: agreement.signerEmail,
          signatureImage: agreement.signatureImage || undefined,
          signedAt: signedAtStr,
        });
        const pdfBase64 = pdfBuffer.toString("base64");
        await storage.updateSignedAgreementPdf(agreement.id, pdfBase64);
        const filename = `${agreement.agreementType.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-signed.pdf`;
        sendSignedAgreementPdf(agreement.signerEmail, agreement.signerName, agreement.agreementType, pdfBuffer, filename).catch(err =>
          console.error("Failed to send signed agreement PDF:", err)
        );
      } catch (pdfErr) {
        console.error("PDF generation for agreement failed (non-blocking):", pdfErr);
      }
      
      res.json({ success: true, agreement });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid data provided" });
      } else {
        console.error("Signed agreement error:", error);
        res.status(500).json({ error: "Failed to save agreement" });
      }
    }
  });

  app.get("/api/signed-agreements", requireAdmin, async (_req, res) => {
    try {
      const agreements = await storage.getSignedAgreements();
      const sanitized = agreements.map(({ pdfData, ...rest }) => ({ ...rest, hasPdf: !!pdfData }));
      res.json({ agreements: sanitized });
    } catch (error: any) {
      console.error("Get signed agreements error:", error);
      res.status(500).json({ error: "Failed to retrieve agreements" });
    }
  });

  app.get("/api/signed-agreements/:id/pdf", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const agreement = await storage.getSignedAgreementById(id);
      if (!agreement) return res.status(404).json({ error: "Agreement not found" });
      if (!agreement.pdfData) return res.status(404).json({ error: "PDF not available for this agreement" });
      const pdfBuffer = Buffer.from(agreement.pdfData, "base64");
      const filename = `${agreement.agreementType.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-signed.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Download signed agreement PDF error:", error);
      res.status(500).json({ error: "Failed to download PDF" });
    }
  });

  app.post("/api/agreement-requests", requireAdmin, async (req, res) => {
    try {
      const { recipientEmail, recipientName, documentTypes } = req.body;
      if (!recipientEmail || !recipientName || !Array.isArray(documentTypes) || documentTypes.length === 0) {
        return res.status(400).json({ error: "recipientEmail, recipientName, and documentTypes are required" });
      }
      const token = crypto.randomBytes(32).toString("hex");
      const request = await storage.createAgreementRequest(
        { recipientEmail, recipientName, documentTypes },
        token
      );
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const signingUrl = `${baseUrl}/sign/${token}`;
      sendSigningRequest(recipientEmail, recipientName, documentTypes, signingUrl).catch(err =>
        console.error("Failed to send signing request email:", err)
      );
      res.json({ success: true, request });
    } catch (error: any) {
      console.error("Create agreement request error:", error);
      res.status(500).json({ error: "Failed to create agreement request" });
    }
  });

  app.get("/api/agreement-requests", requireAdmin, async (_req, res) => {
    try {
      const requests = await storage.getAgreementRequests();
      res.json({ requests });
    } catch (error: any) {
      console.error("Get agreement requests error:", error);
      res.status(500).json({ error: "Failed to retrieve agreement requests" });
    }
  });

  app.post("/api/agreement-requests/:id/resend", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const requests = await storage.getAgreementRequests();
      const request = requests.find(r => r.id === id);
      if (!request) return res.status(404).json({ error: "Request not found" });

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const signingUrl = `${baseUrl}/sign/${request.token}`;
      await sendSigningRequest(request.recipientEmail, request.recipientName, request.documentTypes, signingUrl);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Resend agreement request error:", error);
      res.status(500).json({ error: "Failed to resend" });
    }
  });

  app.get("/api/sign/:token", async (req, res) => {
    try {
      const request = await storage.getAgreementRequestByToken(req.params.token);
      if (!request) return res.status(404).json({ error: "Invalid or expired signing link" });
      const signedAgreements = await storage.getSignedAgreementsByRequestId(request.id);
      const signedTypes = signedAgreements.map(a => a.agreementType);
      res.json({
        request: {
          id: request.id,
          recipientEmail: request.recipientEmail,
          recipientName: request.recipientName,
          documentTypes: request.documentTypes,
          status: request.status,
        },
        signedTypes,
      });
    } catch (error: any) {
      console.error("Get signing request error:", error);
      res.status(500).json({ error: "Failed to load signing request" });
    }
  });

  app.post("/api/sign/:token", async (req, res) => {
    try {
      const request = await storage.getAgreementRequestByToken(req.params.token);
      if (!request) return res.status(404).json({ error: "Invalid or expired signing link" });

      const { signerName, signerTitle, signerOrganization, signerEmail, signatureImage, agreementType } = req.body;
      if (!signerName || !signerTitle || !signerOrganization || !signerEmail || !agreementType) {
        return res.status(400).json({ error: "All signer fields and agreementType are required" });
      }
      if (!request.documentTypes.includes(agreementType)) {
        return res.status(400).json({ error: "Agreement type not part of this request" });
      }
      if (signerEmail.toLowerCase() !== request.recipientEmail.toLowerCase()) {
        return res.status(400).json({ error: "Signer email must match the recipient email for this request" });
      }

      const agreement = await storage.createSignedAgreement({
        agreementType,
        signerName,
        signerTitle,
        signerOrganization,
        signerEmail,
        signatureImage: signatureImage || null,
        requestId: request.id,
      });

      sendAgreementConfirmation({
        agreementType: agreement.agreementType,
        signerName: agreement.signerName,
        signerTitle: agreement.signerTitle,
        signerOrganization: agreement.signerOrganization,
        signerEmail: agreement.signerEmail,
        signedAt: new Date(agreement.signedAt!).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
      }).catch(err => console.error("Agreement confirmation email failed:", err));

      try {
        const pdfBuffer = await generateAgreementPdf(agreementType, {
          signerName, signerTitle, signerOrganization, signerEmail,
          signatureImage: signatureImage || undefined,
          signedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        });
        const pdfBase64 = pdfBuffer.toString("base64");
        await storage.updateSignedAgreementPdf(agreement.id, pdfBase64);
        const filename = `${agreementType.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-signed.pdf`;
        sendSignedAgreementPdf(signerEmail, signerName, agreementType, pdfBuffer, filename).catch(err =>
          console.error("Failed to send signed agreement PDF:", err)
        );
      } catch (pdfErr) {
        console.error("PDF generation for agreement failed (non-blocking):", pdfErr);
      }

      const allSigned = await storage.getSignedAgreementsByRequestId(request.id);
      const allTypes = request.documentTypes;
      const signedTypes = allSigned.map(a => a.agreementType);
      const allCompleted = allTypes.every(t => signedTypes.includes(t));
      if (allCompleted) {
        await storage.updateAgreementRequestStatus(request.id, "completed", new Date());
      }

      res.json({ success: true, agreement, allCompleted });
    } catch (error: any) {
      console.error("Sign agreement error:", error);
      res.status(500).json({ error: "Failed to sign agreement" });
    }
  });

  // Testimonials
  app.get("/api/testimonials", async (_req, res) => {
    try {
      const items = await storage.getTestimonials();
      res.json({ testimonials: items });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to retrieve testimonials" });
    }
  });

  app.post("/api/testimonials", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    if (adminAuth !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    try {
      const data = req.body;
      const item = await storage.createTestimonial(data);
      res.json({ testimonial: item });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create testimonial" });
    }
  });

  app.put("/api/testimonials/:id", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    if (adminAuth !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    try {
      const item = await storage.updateTestimonial(parseInt(req.params.id), req.body);
      res.json({ testimonial: item });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update testimonial" });
    }
  });

  app.delete("/api/testimonials/:id", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    if (adminAuth !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    try {
      await storage.deleteTestimonial(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete testimonial" });
    }
  });

  // Case Studies
  app.get("/api/case-studies", async (_req, res) => {
    try {
      const items = await storage.getCaseStudies();
      res.json({ caseStudies: items });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to retrieve case studies" });
    }
  });

  app.post("/api/case-studies", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    if (adminAuth !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    try {
      const item = await storage.createCaseStudy(req.body);
      res.json({ caseStudy: item });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create case study" });
    }
  });

  app.put("/api/case-studies/:id", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    if (adminAuth !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    try {
      const item = await storage.updateCaseStudy(parseInt(req.params.id), req.body);
      res.json({ caseStudy: item });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update case study" });
    }
  });

  app.delete("/api/case-studies/:id", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    if (adminAuth !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    try {
      await storage.deleteCaseStudy(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete case study" });
    }
  });

  // Delete Resource (Admin only)
  app.delete("/api/resources/:id", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    
    if (adminAuth !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid resource ID" });
      }

      await storage.deleteResource(id);
      
      console.log("Resource deleted:", id);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete resource error:", error);
      res.status(500).json({ error: error.message || "Failed to delete resource" });
    }
  });

  // Podcast Management Routes
  
  // Get All Podcasts (Public)
  app.get("/api/podcasts", async (req, res) => {
    try {
      const podcasts = await storage.getAllPodcasts();
      
      res.json({ podcasts });
    } catch (error: any) {
      console.error("Get podcasts error (DB may be unavailable):", error);
      res.json({ podcasts: [] });
    }
  });

  // Create Podcast (Admin only)
  app.post("/api/podcasts", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    
    if (adminAuth !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const podcastData = insertPodcastSchema.parse(req.body);
      
      const podcast = await storage.createPodcast(podcastData);
      
      console.log("New podcast created:", podcast);
      
      res.json({ success: true, podcast });
    } catch (error: any) {
      console.error("Create podcast error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.message || "Invalid podcast data" });
      } else {
        res.status(500).json({ error: error.message || "Failed to create podcast" });
      }
    }
  });

  // Update Podcast (Admin only)
  app.put("/api/podcasts/:id", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    
    if (adminAuth !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid podcast ID" });
      }

      const podcastData = insertPodcastSchema.parse(req.body);
      
      // Check if podcast exists first
      const existingPodcast = await storage.getPodcast(id);
      if (!existingPodcast) {
        return res.status(404).json({ error: "Podcast not found" });
      }
      
      const podcast = await storage.updatePodcast(id, podcastData);
      
      console.log("Podcast updated:", podcast);
      
      res.json({ success: true, podcast });
    } catch (error: any) {
      console.error("Update podcast error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.message || "Invalid podcast data" });
      } else {
        res.status(500).json({ error: error.message || "Failed to update podcast" });
      }
    }
  });

  // Delete Podcast (Admin only)
  app.delete("/api/podcasts/:id", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    
    if (adminAuth !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid podcast ID" });
      }

      await storage.deletePodcast(id);
      
      console.log("Podcast deleted:", id);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete podcast error:", error);
      res.status(500).json({ error: error.message || "Failed to delete podcast" });
    }
  });

  // Track Visitor
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const visitorData = insertVisitorSchema.parse(req.body);
      
      await storage.trackVisitor(visitorData);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Track visitor error:", error);
      res.status(500).json({ error: error.message || "Failed to track visitor" });
    }
  });

  // Get Visitor Analytics
  app.get("/api/analytics/visitors", requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getVisitorAnalytics();
      
      res.json({ analytics });
    } catch (error: any) {
      console.error("Get analytics error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve analytics" });
    }
  });

  app.post("/api/analytics/events", async (req, res) => {
    try {
      const eventData = insertEventTrackingSchema.parse(req.body);
      await storage.trackEvent(eventData);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Track event error:", error);
      res.status(500).json({ error: error.message || "Failed to track event" });
    }
  });

  app.get("/api/analytics/events", requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getEventAnalytics();
      res.json({ analytics });
    } catch (error: any) {
      console.error("Get event analytics error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve event analytics" });
    }
  });

  app.get("/api/admin/ai-usage", requireAdmin, (_req, res) => {
    res.json(getAiUsageToday());
  });

  // Object Storage: Get upload URL for PDF (Admin only - requires password verification)
  app.post("/api/objects/upload", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    
    if (adminAuth !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Upload URL generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate upload URL" });
    }
  });

  // Normalize PDF upload URL and set ACL policy
  app.post("/api/articles/normalize-pdf", async (req, res) => {
    const adminAuth = req.headers["x-admin-auth"];
    
    if (adminAuth !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const { uploadURL } = req.body;
      
      if (!uploadURL) {
        return res.status(400).json({ error: "uploadURL is required" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
        uploadURL,
        {
          owner: "admin",
          visibility: "public",
        }
      );
      
      res.json({ normalizedPath });
    } catch (error: any) {
      console.error("Error normalizing PDF path:", error);
      res.status(500).json({ error: error.message || "Failed to normalize PDF path" });
    }
  });

  // ===== ROLE-PLAY PRACTICE ROUTES =====

  app.post("/api/roleplay/sessions", roleplayLimit, globalDailyAiCap, async (req, res) => {
    try {
      const { scenarioId, scenarioTitle } = roleplayStartSchema.parse(req.body);
      const session = await storage.createRoleplaySession({ scenarioId, scenarioTitle, status: "active" });

      const initialResponse = await generateRoleplayResponse(scenarioId, scenarioTitle, "Hello, I'm here to speak with you today.", []);
      await storage.createRoleplayMessage({ sessionId: session.id, role: "character", content: initialResponse });

      res.json({ session, initialMessage: initialResponse });
    } catch (error: any) {
      console.error("Roleplay session creation error:", error);
      res.status(500).json({ error: error.message || "Failed to create roleplay session" });
    }
  });

  app.get("/api/roleplay/sessions", async (_req, res) => {
    try {
      const sessions = await storage.getRoleplaySessions();
      res.json(sessions);
    } catch (error: any) {
      console.error("Get roleplay sessions error:", error);
      res.json([]);
    }
  });

  app.get("/api/roleplay/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getRoleplaySession(id);
      if (!session) return res.status(404).json({ error: "Session not found" });
      const messages = await storage.getRoleplayMessages(id);
      res.json({ session, messages });
    } catch (error: any) {
      console.error("Get roleplay session error:", error);
      res.status(500).json({ error: error.message || "Failed to get session" });
    }
  });

  app.post("/api/roleplay/sessions/:id/messages", roleplayMessageLimit, globalDailyAiCap, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { content } = roleplayMessageSchema.parse(req.body);

      const session = await storage.getRoleplaySession(sessionId);
      if (!session) return res.status(404).json({ error: "Session not found" });
      if (session.status !== "active") return res.status(400).json({ error: "Session is no longer active" });

      await storage.createRoleplayMessage({ sessionId, role: "user", content });

      const messages = await storage.getRoleplayMessages(sessionId);
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const response = await generateRoleplayResponse(session.scenarioId, session.scenarioTitle, content, history.slice(0, -1));
      await storage.createRoleplayMessage({ sessionId, role: "character", content: response });

      storage.trackEvent({ eventType: "ai_tool_usage", eventName: "roleplay" }).catch(() => {});

      res.json({ response });
    } catch (error: any) {
      console.error("Roleplay message error:", error);
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });

  app.post("/api/roleplay/sessions/:id/feedback", roleplayMessageLimit, globalDailyAiCap, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getRoleplaySession(sessionId);
      if (!session) return res.status(404).json({ error: "Session not found" });

      const messages = await storage.getRoleplayMessages(sessionId);
      const transcript = messages.map(m => ({ role: m.role, content: m.content }));

      const { feedback, rating } = await generateRoleplayFeedback(session.scenarioTitle, transcript);
      const updated = await storage.updateRoleplaySession(sessionId, { status: "completed", feedback, rating });

      res.json({ session: updated, feedback, rating });
    } catch (error: any) {
      console.error("Roleplay feedback error:", error);
      res.status(500).json({ error: error.message || "Failed to generate feedback" });
    }
  });

  // ===== DAILY DRILL ROUTES =====

  app.post("/api/drills/completions", async (req, res) => {
    try {
      const data = drillCompletionRequestSchema.parse(req.body);
      const completion = await storage.createDrillCompletion(data);
      storage.trackEvent({ eventType: "ai_tool_usage", eventName: "drill_completion" }).catch(() => {});
      res.json(completion);
    } catch (error: any) {
      console.error("Drill completion error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid completion data" });
      }
      res.status(503).json({ error: "Unable to save completion right now. Please try again shortly." });
    }
  });

  app.get("/api/drills/completions", async (_req, res) => {
    try {
      const completions = await storage.getDrillCompletions();
      res.json(completions);
    } catch (error: any) {
      console.error("Get drill completions error:", error);
      res.json([]);
    }
  });

  // ===== SEND EMAIL ROUTE =====

  app.post("/api/send-email", standardAiLimit, globalDailyAiCap, async (req, res) => {
    try {
      const { to, subject, body } = sendEmailRequestSchema.parse(req.body);
      const success = await sendGeneratedEmail(to, subject, body);
      if (!success) {
        return res.status(500).json({ error: "Failed to send email" });
      }
      storage.trackEvent({ eventType: "ai_tool_usage", eventName: "email_sent" }).catch(() => {});
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Send email error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid email data" });
      } else {
        res.status(500).json({ error: error.message || "Failed to send email" });
      }
    }
  });

  // Audio transcription endpoint
  app.post("/api/transcribe", heavyAiLimit, globalDailyAiCap, async (req, res) => {
    try {
      const multer = (await import("multer")).default;
      const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
      upload.single("audio")(req, res as any, async (err) => {
        if (err) {
          return res.status(400).json({ error: "File upload failed: " + err.message });
        }
        if (!req.file) {
          return res.status(400).json({ error: "No audio file provided" });
        }
        try {
          const OpenAI = (await import("openai")).default;
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const { toFile } = await import("openai");
          const audioFile = await toFile(req.file.buffer, req.file.originalname || "audio.webm", { type: req.file.mimetype });
          const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            response_format: "json",
          });
          return res.json({ transcript: transcription.text });
        } catch (apiErr: any) {
          console.error("Transcription API error:", apiErr);
          return res.status(500).json({ error: "Transcription failed: " + apiErr.message });
        }
      });
    } catch (error: any) {
      console.error("Transcribe route error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Analyze transcript with AI coaching feedback
  app.post("/api/transcribe/analyze", heavyAiLimit, globalDailyAiCap, async (req, res) => {
    try {
      const { transcript } = req.body;
      if (!transcript || typeof transcript !== "string") {
        return res.status(400).json({ error: "transcript is required" });
      }
      const analysis = await generateComplexResponse(
        `You are reviewing a transcript of a hospice sales call or practice conversation. Provide specific, actionable coaching feedback based on the Spartan Method (Discipline, Empathy, Strategy).

TRANSCRIPT:
${transcript}

Structure your response with these sections:
## What Went Well
Specific observations from the transcript with direct quotes where helpful.

## Areas for Improvement
Two to three concrete, actionable suggestions.

## Spartan Method Score
Rate Discipline, Empathy, and Strategy each on a 1 to 5 scale and explain briefly.

## One Thing to Practice
The single most important skill to work on before the next conversation.`,
        "You are an expert hospice sales coach providing detailed, constructive feedback on practice conversations and real sales calls. Be specific, reference what was said, and provide actionable advice based on the Spartan Method."
      );
      res.json({ analysis });
    } catch (error: any) {
      console.error("Transcript analysis error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  async function generateAgreementPdf(
    agreementType: string,
    signer: { signerName: string; signerTitle: string; signerOrganization: string; signerEmail: string; signatureImage?: string; signedAt: string }
  ): Promise<Buffer> {
    const PDFDocument = (await import("pdfkit")).default;
    return new Promise((resolve, reject) => {
      const MARGIN = 60;
      const doc = new PDFDocument({
        margin: MARGIN,
        size: "LETTER",
        bufferPages: true,
        info: { Title: `${agreementType} — Signed`, Author: "Spartan Coaching", Creator: "Spartan Coaching" },
      });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const RED = "#C8102E";
      const RED_DEEP = "#9B0E23";
      const DARK = "#111827";
      const MUTED = "#6B7280";
      const WHITE = "#FFFFFF";
      const LIGHT_RULE = "#E5E7EB";
      const PAGE_W = doc.page.width;
      const CW = PAGE_W - MARGIN * 2;

      doc.rect(0, 0, PAGE_W, 82).fill(RED);
      doc.rect(0, 0, PAGE_W, 5).fill(RED_DEEP);
      doc.fontSize(13).font("Helvetica-Bold").fillColor(WHITE).text("SPARTAN COACHING", MARGIN, 22, { lineBreak: false });
      doc.fontSize(8).font("Helvetica").fillColor("#E8899A").text("SIGNED AGREEMENT", MARGIN, 42, { lineBreak: false });
      doc.y = 104;

      doc.fontSize(22).font("Helvetica-Bold").fillColor(DARK).text(agreementType, MARGIN, doc.y, { width: CW });
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica").fillColor(MUTED).text("Digitally Signed Document", MARGIN, doc.y, { width: CW });
      doc.moveDown(0.7);
      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CW, doc.y).strokeColor(RED).lineWidth(2).stroke();
      doc.moveDown(1.5);

      doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK).text("Signer Information", MARGIN, doc.y, { width: CW });
      doc.moveDown(0.4);
      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CW, doc.y).strokeColor(LIGHT_RULE).lineWidth(0.5).stroke();
      doc.moveDown(0.6);

      const fields = [
        ["Name", signer.signerName],
        ["Title", signer.signerTitle],
        ["Organization", signer.signerOrganization],
        ["Email", signer.signerEmail],
        ["Date Signed", signer.signedAt],
        ["Agreement Type", agreementType],
      ];

      for (const [label, value] of fields) {
        const fieldY = doc.y;
        doc.fontSize(10).font("Helvetica-Bold").fillColor(MUTED).text(label + ":", MARGIN, fieldY, { width: 120, lineBreak: false });
        doc.fontSize(10.5).font("Helvetica").fillColor(DARK).text(value, MARGIN + 125, fieldY, { width: CW - 125 });
        doc.moveDown(0.3);
      }

      if (signer.signatureImage) {
        doc.moveDown(1);
        doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK).text("Digital Signature", MARGIN, doc.y, { width: CW });
        doc.moveDown(0.4);
        doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CW, doc.y).strokeColor(LIGHT_RULE).lineWidth(0.5).stroke();
        doc.moveDown(0.8);

        try {
          const base64Data = signer.signatureImage.replace(/^data:image\/\w+;base64,/, "");
          const imgBuffer = Buffer.from(base64Data, "base64");
          doc.image(imgBuffer, MARGIN, doc.y, { width: 250, height: 80 });
          doc.y += 90;
        } catch (imgErr) {
          doc.fontSize(10).font("Helvetica").fillColor(MUTED).text("[Signature image could not be rendered]", MARGIN, doc.y, { width: CW });
          doc.moveDown(0.5);
        }
      }

      const agreementContent = AGREEMENT_TEXTS[agreementType];
      if (agreementContent && agreementContent.sections.length > 0) {
        doc.moveDown(1.5);
        doc.fontSize(15).font("Helvetica-Bold").fillColor(DARK).text("Agreement Terms", MARGIN, doc.y, { width: CW });
        doc.moveDown(0.4);
        doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CW, doc.y).strokeColor(RED).lineWidth(1.5).stroke();
        doc.moveDown(0.8);

        for (const section of agreementContent.sections) {
          if (doc.y > doc.page.height - 120) {
            doc.addPage();
          }
          if (section.heading) {
            doc.fontSize(11).font("Helvetica-Bold").fillColor(DARK).text(section.heading, MARGIN, doc.y, { width: CW });
            doc.moveDown(0.3);
          }
          doc.fontSize(9.5).font("Helvetica").fillColor(MUTED).text(section.body, MARGIN, doc.y, { width: CW, lineGap: 2, paragraphGap: 3 });
          doc.moveDown(0.7);
        }
      }

      doc.moveDown(1.5);
      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CW, doc.y).strokeColor(LIGHT_RULE).lineWidth(0.5).stroke();
      doc.moveDown(0.65);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(DARK).text("Legal Notice", MARGIN, doc.y, { width: CW });
      doc.moveDown(0.4);
      doc.fontSize(8).font("Helvetica").fillColor(MUTED).text(
        "This document confirms that the above-named individual has digitally signed the referenced agreement through the Spartan Coaching platform. This constitutes a legally binding digital signature as acknowledged by the signer.\n\n\u00A9 " + new Date().getFullYear() + " Spartan Coaching. All rights reserved. | spartanhospicecoaching.com",
        MARGIN, doc.y, { width: CW, lineGap: 2, paragraphGap: 4 }
      );

      doc.flushPages();
      doc.end();
    });
  }

  // PDF Export: generate a branded PDF from structured content
  async function generatePdfBuffer(title: string, subtitle: string | undefined, sections: Array<{ heading?: string; body: string }>): Promise<Buffer> {
    const PDFDocument = (await import("pdfkit")).default;
    return new Promise((resolve, reject) => {
      const MARGIN = 60;
      const doc = new PDFDocument({
        margin: MARGIN,
        size: "LETTER",
        bufferPages: true,
        info: { Title: title, Author: "Spartan Coaching", Creator: "Spartan Coaching" },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ── Brand palette ──
      const RED        = "#C8102E";
      const RED_DEEP   = "#9B0E23";
      const DARK       = "#111827";
      const MUTED      = "#6B7280";
      const WHITE      = "#FFFFFF";
      const LIGHT_RULE = "#E5E7EB";
      const BANNER_SUB = "#E8899A"; // muted rose for secondary text on red banner

      const PAGE_W   = doc.page.width;   // 612 pt
      const PAGE_H   = doc.page.height;  // 792 pt
      const CW       = PAGE_W - MARGIN * 2; // content width = 492 pt
      const YEAR     = new Date().getFullYear();
      const DATE_STR = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      // ── Page-1 cover header ──────────────────────────────────────────────
      const BANNER_H1 = 82;
      const ACCENT_H  = 5; // thin dark stripe at top
      doc.rect(0, 0, PAGE_W, BANNER_H1).fill(RED);
      doc.rect(0, 0, PAGE_W, ACCENT_H).fill(RED_DEEP);
      // Company name
      doc.fontSize(13).font("Helvetica-Bold").fillColor(WHITE)
        .text("SPARTAN COACHING", MARGIN, 22, { lineBreak: false });
      // Tagline
      doc.fontSize(8).font("Helvetica").fillColor(BANNER_SUB)
        .text("HOSPICE SALES TRAINING", MARGIN, 42, { lineBreak: false });
      // Date (right side of banner)
      doc.fontSize(8.5).font("Helvetica").fillColor(BANNER_SUB)
        .text(DATE_STR, MARGIN, 27, { width: CW, align: "right", lineBreak: false });
      // Vertical rule accent on right edge
      doc.rect(PAGE_W - ACCENT_H, 0, ACCENT_H, BANNER_H1).fill(RED_DEEP);

      // Start content below banner + padding
      doc.y = BANNER_H1 + 22;

      // ── Title block ─────────────────────────────────────────────────────
      doc.fontSize(24).font("Helvetica-Bold").fillColor(DARK)
        .text(title, MARGIN, doc.y, { width: CW });
      if (subtitle) {
        doc.moveDown(0.3);
        doc.fontSize(11.5).font("Helvetica").fillColor(MUTED)
          .text(subtitle, MARGIN, doc.y, { width: CW });
      }
      doc.moveDown(0.7);
      // Red rule beneath title block
      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CW, doc.y)
        .strokeColor(RED).lineWidth(2).stroke();
      doc.moveDown(1.2);

      // ── Mini header on subsequent pages ─────────────────────────────────
      const MINI_H = 30;
      doc.on("pageAdded", () => {
        doc.rect(0, 0, PAGE_W, MINI_H).fill(RED);
        doc.rect(0, 0, PAGE_W, 3).fill(RED_DEEP);
        doc.rect(PAGE_W - 3, 0, 3, MINI_H).fill(RED_DEEP);
        doc.fontSize(9).font("Helvetica-Bold").fillColor(WHITE)
          .text("SPARTAN COACHING", MARGIN, 10, { lineBreak: false });
        const shortTitle = title.length > 52 ? title.substring(0, 49) + "\u2026" : title;
        doc.fontSize(8.5).font("Helvetica").fillColor(BANNER_SUB)
          .text(shortTitle, MARGIN, 11, { width: CW, align: "right", lineBreak: false });
        doc.y = MINI_H + 18;
      });

      // ── Space guard ─────────────────────────────────────────────────────
      const ensureSpace = (minPts: number) => {
        if (doc.y + minPts > PAGE_H - MARGIN) {
          doc.addPage();
        }
      };

      // ── Body text renderer (handles bullets, numbers, paragraphs) ────────
      const renderBody = (rawBody: string) => {
        const lines = rawBody.split("\n");
        let paraLines: string[] = [];

        const flushPara = () => {
          if (paraLines.length === 0) return;
          const para = paraLines.join(" ").trim();
          if (para) {
            doc.fontSize(10.5).font("Helvetica").fillColor(DARK)
              .text(para, MARGIN, doc.y, { width: CW, lineGap: 2.5, paragraphGap: 0 });
            doc.moveDown(0.55);
          }
          paraLines = [];
        };

        for (const rawLine of lines) {
          const line = rawLine.trim();

          // Bullet line (• from cleanMarkdown, or - / * originals)
          if (/^[•\-\*]\s/.test(line)) {
            flushPara();
            ensureSpace(30); // must come before capturing bulletY
            const bulletText = line.replace(/^[•\-\*]\s+/, "").trim();
            const bulletY = doc.y;
            doc.fontSize(10.5).font("Helvetica-Bold").fillColor(RED)
              .text("\u2022", MARGIN + 2, bulletY, { lineBreak: false, width: 14 });
            doc.fontSize(10.5).font("Helvetica").fillColor(DARK)
              .text(bulletText, MARGIN + 16, bulletY, { width: CW - 16, lineGap: 2.5 });
            doc.moveDown(0.25);
            continue;
          }

          // Numbered list line
          if (/^\d+\.\s/.test(line)) {
            flushPara();
            ensureSpace(30); // must come before capturing numY
            const match = line.match(/^(\d+\.\s+)(.*)/);
            if (match) {
              const numLabel = match[1].trim();
              const numText  = match[2].trim();
              const numY = doc.y;
              doc.fontSize(10.5).font("Helvetica-Bold").fillColor(RED)
                .text(numLabel, MARGIN + 2, numY, { lineBreak: false, width: 22 });
              doc.fontSize(10.5).font("Helvetica").fillColor(DARK)
                .text(numText, MARGIN + 26, numY, { width: CW - 26, lineGap: 2.5 });
              doc.moveDown(0.25);
            }
            continue;
          }

          // Empty line = flush paragraph
          if (!line) {
            flushPara();
            continue;
          }

          paraLines.push(line);
        }
        flushPara();
      };

      // ── Sections ────────────────────────────────────────────────────────
      for (const section of sections) {
        const safeBody = typeof section.body === "string" ? section.body.trim() : "";

        if (section.heading) {
          ensureSpace(90);
          const hY = doc.y;
          // Red left accent bar
          doc.rect(MARGIN, hY, 4, 17).fill(RED);
          // Heading text
          doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK)
            .text(section.heading, MARGIN + 11, hY, { width: CW - 11 });
          doc.moveDown(0.3);
          // Subtle rule under heading
          doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CW, doc.y)
            .strokeColor(LIGHT_RULE).lineWidth(0.5).stroke();
          doc.moveDown(0.55);
        }

        if (safeBody) {
          renderBody(safeBody);
          doc.moveDown(0.3);
        }
      }

      // ── Disclaimer ──────────────────────────────────────────────────────
      ensureSpace(210);
      doc.moveDown(0.6);
      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CW, doc.y)
        .strokeColor(LIGHT_RULE).lineWidth(0.5).stroke();
      doc.moveDown(0.65);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(DARK)
        .text("Disclaimer & Legal Notice", MARGIN, doc.y, { width: CW });
      doc.moveDown(0.4);
      doc.fontSize(8).font("Helvetica").fillColor(MUTED)
        .text(
          "This document was generated using artificial intelligence (OpenAI GPT-4o) through the Spartan Coaching platform and is provided for educational and training purposes only. It does not constitute professional, legal, clinical, regulatory, or compliance advice. Content should be reviewed, verified, and adapted to your specific organizational policies, state regulations, and individual patient circumstances before use.\n\nIntellectual Property: All AI-generated content produced through Spartan Coaching\u2019s platform is the exclusive property of Spartan Coaching. Unauthorized reproduction, redistribution, or commercial use is strictly prohibited.\n\n\u00A9 " + YEAR + " Spartan Coaching. All rights reserved. | spartanhospicecoaching.com",
          MARGIN, doc.y, { width: CW, lineGap: 2, paragraphGap: 4 }
        );

      // ── Footer on every page ─────────────────────────────────────────────
      const pageRange = doc.bufferedPageRange();
      const totalPages = pageRange.count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(pageRange.start + i);
        doc.page.margins.bottom = 0;
        const footerY = PAGE_H - MARGIN + 12;
        doc.moveTo(MARGIN, footerY - 6).lineTo(MARGIN + CW, footerY - 6)
          .strokeColor(LIGHT_RULE).lineWidth(0.5).stroke();
        doc.fontSize(7).font("Helvetica").fillColor(MUTED)
          .text(`\u00A9 ${YEAR} Spartan Coaching  \u00B7  spartanhospicecoaching.com`, MARGIN, footerY, {
            width: Math.floor(CW * 0.65), lineBreak: false,
          });
        doc.fontSize(7).font("Helvetica").fillColor(MUTED)
          .text(`Page ${i + 1} of ${totalPages}`, MARGIN, footerY, {
            width: CW, align: "right", lineBreak: false,
          });
        doc.page.margins.bottom = MARGIN;
      }

      doc.flushPages();
      doc.end();
    });
  }

  app.post("/api/pdf/export", standardAiLimit, async (req, res) => {
    const { filename, title, subtitle, sections } = req.body;
    if (!title || !Array.isArray(sections)) {
      return res.status(400).json({ error: "title and sections are required" });
    }
    try {
      const buffer = await generatePdfBuffer(title, subtitle, sections);
      const safeFilename = (filename || "spartan-document").replace(/[^a-z0-9\-_]/gi, "-");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.pdf"`);
      res.send(buffer);
    } catch (error: any) {
      console.error("PDF generation error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF" });
      }
    }
  });

  app.post("/api/pdf/email", async (req, res) => {
    const { email, name, title, filename, subtitle, sections } = req.body;
    if (!email || !name || !title || !Array.isArray(sections)) {
      return res.status(400).json({ error: "email, name, title, and sections are required" });
    }
    try {
      const buffer = await generatePdfBuffer(title, subtitle, sections);
      const safeFilename = ((filename || "spartan-document").replace(/[^a-z0-9\-_]/gi, "-")) + ".pdf";
      const { sendPdfToUser } = await import("./resend");
      await sendPdfToUser(email, name, buffer, safeFilename, title);
      console.log(`[PDF email] Sent "${title}" to ${email}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error(`[PDF email] FAILED sending "${title}" to ${email}:`, error?.message || error, error?.stack || "");
      res.status(500).json({ error: "Failed to email PDF" });
    }
  });

  // ─── Assessment Routes ───────────────────────────────────────────────

  app.get("/api/assessments", requireAdmin, async (_req, res) => {
    try {
      const list = await storage.getAssessments();
      res.json({ assessments: list });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch assessments" });
    }
  });

  app.post("/api/assessments", requireAdmin, async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name || typeof name !== "string" || name.trim().length < 1) {
        return res.status(400).json({ error: "Name is required" });
      }
      const assessment = await storage.createAssessment({ name: name.trim(), description: description?.trim() || null });
      res.json({ assessment });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create assessment" });
    }
  });

  app.delete("/api/assessments/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteAssessment(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete assessment" });
    }
  });

  app.get("/api/assessments/:id/questions", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const questions = await storage.getAssessmentQuestions(id);
      res.json({ questions });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch questions" });
    }
  });

  app.post("/api/assessments/:id/questions", requireAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) return res.status(400).json({ error: "Invalid ID" });
      const { type, text, options, correctAnswer, displayOrder } = req.body;
      if (!type || !text) return res.status(400).json({ error: "type and text are required" });
      if (type === "quiz" && (!options || !Array.isArray(options) || options.length < 2)) {
        return res.status(400).json({ error: "Quiz questions need at least 2 options" });
      }
      if (type === "quiz" && (!correctAnswer || typeof correctAnswer !== "string")) {
        return res.status(400).json({ error: "Quiz questions need a correct answer" });
      }
      const question = await storage.createAssessmentQuestion({
        assessmentId,
        type,
        text,
        options: type === "quiz" ? options : null,
        correctAnswer: type === "quiz" ? correctAnswer : null,
        displayOrder: displayOrder ?? 0,
      });
      res.json({ question });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to add question" });
    }
  });

  app.delete("/api/assessments/questions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteAssessmentQuestion(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete question" });
    }
  });

  app.get("/api/assessments/:id/public", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const assessment = await storage.getAssessment(id);
      if (!assessment) return res.status(404).json({ error: "Assessment not found" });
      const questions = await storage.getAssessmentQuestions(id);
      const publicQuestions = questions.map(q => ({
        id: q.id,
        type: q.type,
        text: q.text,
        options: q.options,
        displayOrder: q.displayOrder,
      }));
      res.json({ assessment: { id: assessment.id, name: assessment.name, description: assessment.description }, questions: publicQuestions });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch assessment" });
    }
  });

  app.post("/api/assessments/:id/submit", async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) return res.status(400).json({ error: "Invalid ID" });

      const { candidateName, candidateEmail, answers, inviteToken, clientSlug } = req.body;
      if (!candidateName || !candidateEmail || !answers) {
        return res.status(400).json({ error: "candidateName, candidateEmail, and answers are required" });
      }

      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) return res.status(404).json({ error: "Assessment not found" });

      let validatedInviteId: number | null = null;
      if (inviteToken) {
        const invite = await storage.getAssessmentInviteByToken(inviteToken);
        if (!invite) {
          return res.status(400).json({ error: "Invalid invite token" });
        }
        if (invite.usedAt) {
          return res.status(403).json({ error: "This invite link has already been used" });
        }
        if (invite.assessmentId !== assessmentId) {
          return res.status(403).json({ error: "This invite token does not match this assessment" });
        }
        validatedInviteId = invite.id;
      }

      const questions = await storage.getAssessmentQuestions(assessmentId);
      if (questions.length === 0) return res.status(400).json({ error: "This assessment has no questions" });

      const scenarioExists = questions.some(q => q.type === "scenario");
      if (!scenarioExists) return res.status(400).json({ error: "This assessment must include at least one scenario question" });

      const allQuestionIds = questions.map(q => String(q.id));
      const missingAnswers = allQuestionIds.filter(id => !answers[id] || String(answers[id]).trim() === "");
      if (missingAnswers.length > 0) {
        return res.status(400).json({ error: "All questions must be answered" });
      }

      const submission = await storage.createAssessmentSubmission({
        assessmentId,
        candidateName,
        candidateEmail,
        answers,
        clientSlug: clientSlug || null,
      });

      const quizQuestions = questions.filter(q => q.type === "quiz");
      const scenarioQuestions = questions.filter(q => q.type === "scenario");

      let quizScore: number | null = null;
      if (quizQuestions.length > 0) {
        let correct = 0;
        for (const q of quizQuestions) {
          const candidateAnswer = (answers as Record<string, string>)[String(q.id)];
          if (candidateAnswer && q.correctAnswer && candidateAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            correct++;
          }
        }
        quizScore = Math.round((correct / quizQuestions.length) * 100);
      }

      let aiScore: number | null = null;
      let aiFeedback = "";

      if (scenarioQuestions.length > 0) {
        try {
          const scenarioResponses = scenarioQuestions.map(q => ({
            question: q.text,
            answer: (answers as Record<string, string>)[String(q.id)] || "(No response)",
          }));

          const systemPrompt = `You are Nick Lynch, founder of Spartan Hospice Coaching — the most results-focused hospice sales training system in the country. You spent years in the field as a hospice sales rep and manager before founding Spartan Coaching to train high-performance reps and help hospice organizations grow census systematically. You have personally coached and evaluated hundreds of hospice sales reps. You know this industry inside and out, and you know the difference between someone who can talk sales and someone who can actually move census in a hospice territory.

You evaluate candidates with the precision of a seasoned practitioner, not an HR checkbox. You are honest, direct, and specific. You reference what candidates actually said — not what you hoped they would say.

==============================================================================
THE SPARTAN METHOD — FULL PHILOSOPHY AND EVALUATION FRAMEWORK
==============================================================================

CORE TRUTH: Hospice sales success is not about charm, territory size, or clinical features. It comes from one thing: consistent, intentional presence backed by genuine value delivery. Reps who show up with a purpose every single time — and who deeply understand the emotional world of their referral sources — build referral relationships that last. Reps who rely on pitching, price, or personality alone wash out.

--------------------------------------------------------------------
1. RELATIONSHIP-FIRST SELLING
--------------------------------------------------------------------
Every Spartan rep earns the right to ask for a referral. They do not demand it, imply it, or expect it because they showed up with donuts. They earn it by: (a) understanding the referral source's patient population deeply, (b) bringing something of clinical or operational value to every visit — not just a business card — and (c) following through on every commitment they make.

When a Spartan rep walks into a skilled nursing facility, they already know: which nurses are carrying the heaviest patient loads, which patients on that floor are likely eligible for hospice, what the DON's biggest clinical frustration is this week, and what they promised to bring on the last visit. This is relationship-first selling — not transactional back-slapping.

A strong candidate demonstrates they lead with curiosity, not a pitch. When challenged ("I already work with a hospice," "I don't see a difference between you"), the Spartan response is always a question first: "What do you value most in a hospice partner right now?" or "What does that relationship do well for you?" Only after listening does a Spartan rep differentiate.

--------------------------------------------------------------------
2. CONSISTENCY IS THE ONLY COMPETITIVE MOAT
--------------------------------------------------------------------
The most powerful thing a rep can do is be more present after a referral than before. Most reps disappear between referrals and reappear only when they need something. The Spartan rep closes the loop on every patient — reporting back to the referral source on how the patient and family are doing — and uses that touchpoint to deepen the relationship, not to ask for another referral.

This post-referral follow-through is what builds loyalty that competitors cannot buy. A strong candidate understands this instinctively or can articulate it clearly when prompted. Candidates who see follow-up as optional, or who only discuss pre-referral activity, are showing a fundamental gap.

--------------------------------------------------------------------
3. TERRITORY MANAGEMENT AS A SYSTEM
--------------------------------------------------------------------
Spartan reps manage their territory with a tiered account structure. Every account is classified:

TIER 1 — High-volume, high-relationship accounts. Weekly in-person contact minimum. These accounts receive the most preparation before each visit and the most follow-through after.
TIER 2 — Growth-potential accounts. Bi-weekly in-person contact. These are accounts with referral volume that hasn't been unlocked yet.
TIER 3 — Awareness accounts. Monthly or less. These are accounts being maintained while the rep focuses energy on Tier 1 and Tier 2.

Strong candidates can articulate how they determine account tiers — referral volume potential, patient population fit, relationship warmth, competitive landscape. Weak candidates say things like "I would try to cover everyone equally" or "I'd focus on whoever is most responsive." No system = failure in this industry.

Spartan activity metrics that matter:
- 8 to 12 meaningful face-to-face visits per week (not calls, not emails)
- At least one value-added touchpoint per visit (clinical resource, patient outcome story, education, feedback loop from prior referral)
- Post-referral follow-through within 48 hours of patient admission
- Re-engagement plan for cold accounts: what specific value will re-open the door?

--------------------------------------------------------------------
4. HOSPICE-SPECIFIC EMOTIONAL INTELLIGENCE
--------------------------------------------------------------------
This is what separates hospice sales from every other form of healthcare sales. Families who say "we're not ready to give up" are not objecting to hospice — they are expressing fear based on a fundamental misunderstanding of what hospice is. They believe hospice means:
- Giving up on their loved one
- The doctor has stopped caring
- Death is imminent and being accelerated

A skilled hospice sales rep — and a skilled discharge planner they coach — knows how to reframe without minimizing:
- "Hospice isn't about giving up. It's about making sure your mom gets the most out of whatever time she has — with expert symptom management, emotional support, and a team that's focused entirely on her comfort and your family's well-being."
- "Choosing hospice doesn't mean stopping treatment — it means choosing a different kind of care that's focused on quality of life."
- "The research actually shows that patients on hospice often live longer than those who continue aggressive curative treatment, because their symptoms are managed better and their stress is lower."

Candidates who treat "not ready to give up" as a standard sales objection to overcome — rather than a deeply human fear to address with compassion — will damage referral relationships and patient experiences.

Referral sources (especially nurses, social workers, and discharge planners) carry the emotional weight of recommending hospice to families. They need to trust that the rep they send to support those conversations will handle them with care. A rep who pushes, pressures, or sells to families has permanently burned that referral source.

--------------------------------------------------------------------
5. COMPETITIVE HANDLING
--------------------------------------------------------------------
The Spartan rep never attacks a competitor. Never. Not explicitly, not implicitly, not by suggesting "we have fewer complaints" or "I've heard they've had quality issues." Any competitive attack — even a truthful one — makes the rep look insecure and makes the referral source uncomfortable.

Instead: ask what the referral source values in their current hospice relationship. Listen fully. Then demonstrate, over time, that you deliver more of exactly that. Consistent presence + value delivery always wins over pitch-based selling.

When a competitor spreads false information (HIPAA rumors, quality allegations), the Spartan response is:
1. Stay calm. Thank the referral source for telling you.
2. Acknowledge the concern professionally: "I understand why you'd want to know if that's true. Here's what I can tell you directly..."
3. Address it factually, briefly, and without attacking the competitor.
4. Involve your organization's compliance or leadership team to respond formally if needed.
5. Use the incident as an opportunity to deepen trust: you handled it with professionalism, not panic.

--------------------------------------------------------------------
6. WHAT ELITE CANDIDATES LOOK LIKE (AND WHAT WEAK ONES LOOK LIKE)
--------------------------------------------------------------------
STRONG SIGNALS:
- Leads with a question when challenged, not a pitch
- Has a specific, tiered account management plan — not "I'd cover the territory"
- Understands why families resist hospice and frames their response with genuine compassion, not a rebuttal
- Post-referral follow-through is instinctive — they mention it without being prompted
- Self-aware about gaps and coachable about feedback
- Speaks about referral sources as people, not targets
- Gives specific examples of what "value" means in their visits (not just "building relationships")
- Thinks in systems, cadences, and rhythms

RED FLAGS THAT ELIMINATE CANDIDATES:
- "I would differentiate on faster admissions" — transactional thinking that will fail
- "I'd explain why we're better than their current hospice" — combative, non-relational
- No mention of asking questions before pitching
- Vague strategy: "I would stay consistent and build trust" with no specifics on how
- No understanding of why families resist hospice; treats it as a standard objection
- Suggests spreading false information about a competitor or retaliating
- No post-referral follow-through instinct
- No account prioritization logic — treating all accounts the same

COACHABILITY SIGNALS (important for Solid Candidates):
- Acknowledges uncertainty or gaps: "I would need to learn more about..."
- Shows intellectual curiosity about hospice: asks about things outside their experience
- Frames past failures as learning moments
- Welcomes feedback or probing without becoming defensive
- Demonstrates a growth mindset about sales craft

==============================================================================
SCORING TIERS
==============================================================================
85-100: STRONG HIRE. Deep hospice knowledge, Spartan Method alignment, specific and executable thinking. Nick should move fast.
70-84: SOLID CANDIDATE. Right instincts, some gaps in specificity or hospice depth. Coachable. Worth a focused second conversation.
50-69: DEVELOPMENT NEEDED. Has potential but needs significant coaching before running a territory independently. Consider only if other factors are very strong.
0-49: NOT READY. Generic sales thinking, no hospice context, or behaviors that would actively damage referral relationships in the field.`;

          const prompt = `Evaluate this candidate's full assessment responses for a hospice sales representative position.

ASSESSMENT: "${assessment.name}"
CANDIDATE NAME: ${candidateName}
CANDIDATE EMAIL: ${candidateEmail}

==============================================================================
QUIZ PERFORMANCE
==============================================================================
Quiz Score: ${quizScore !== null ? `${quizScore}%` : "Not calculated"}

Note: Review what quiz score implies. A candidate with deep field experience may perform differently than a candidate with strong theoretical knowledge. Consider the quiz score as context — the scenario responses are the primary evaluation signal.

==============================================================================
SCENARIO RESPONSES TO EVALUATE
==============================================================================

${scenarioResponses.map((sr, i) => `SCENARIO ${i + 1}
Question: ${sr.question}

Candidate's Response:
${sr.answer}

---`).join("\n\n")}

==============================================================================
SCORING CRITERIA (100 points total across 4 categories)
==============================================================================

1. HOSPICE INDUSTRY KNOWLEDGE (25 pts)
Real depth in: Medicare Hospice Benefit mechanics (6-month prognosis, physician certifications, benefit periods, what's covered), why facilities refer and stop referring, how length of stay reflects quality back to the referral source, and the clinical-emotional weight of end-of-life care. Generic healthcare sales answers with no hospice-specific knowledge = 0-8 pts. Solid foundational knowledge = 9-17 pts. Deep mastery with nuanced application = 18-25 pts.

2. RELATIONSHIP-FIRST SELLING AND SPARTAN ALIGNMENT (25 pts)
Leading with curiosity, asking before pitching, demonstrating that referral trust is earned over time through value and consistency — not won on a single visit. Post-referral follow-through instinct. Red flag: any transactional or price-based differentiation. Strong: specific discovery questions, patience, the instinct to listen before responding.

3. EMPATHY AND HOSPICE-SPECIFIC COMMUNICATION (25 pts)
Understanding that "not ready to give up" is fear, not objection. Ability to guide resistant families with compassion. Awareness that referral sources carry emotional weight about end-of-life conversations and need a rep they trust to handle families with care. Treats this as a human challenge, not a sales problem.

4. STRATEGIC THINKING AND TERRITORY EXECUTION (25 pts)
Tiered account management, specific weekly cadence, executable plans. Ability to re-engage cold accounts with a specific value-driven approach. Competitive handling that differentiates without attacking. Strong = very specific, system-driven, measurable. Weak = buzzwords and platitudes with no operational specifics.

==============================================================================
REQUIRED OUTPUT — RETURN ONLY VALID JSON, NO MARKDOWN, NO EXTRA TEXT
==============================================================================

{
  "overallScore": <number 0-100, weighted 60% scenario / 40% quiz if quiz data exists>,
  "fieldReadinessScore": <number 0-100, your assessment of how ready this person is to work a territory TODAY — separate from their learning potential>,
  "categoryScores": {
    "hospiceKnowledge": <number 0-25>,
    "relationshipSelling": <number 0-25>,
    "empathyCommunication": <number 0-25>,
    "strategicExecution": <number 0-25>
  },
  "tier": "<Strong Hire | Solid Candidate | Development Needed | Not Ready>",
  "quizAnalysis": "<1-2 sentences interpreting the quiz score in context of their scenario performance — are they consistent or is there a gap?>",
  "standoutQualities": [
    "<the single most impressive thing about this candidate's responses — be specific>",
    "<second standout quality if one exists>"
  ],
  "strengths": [
    "<specific strength directly referencing something the candidate wrote>",
    "<specific strength>",
    "<specific strength>"
  ],
  "developmentAreas": [
    "<specific gap, what they said or failed to say, and what a stronger answer would have included>",
    "<specific gap>",
    "<specific gap>"
  ],
  "redFlags": [
    "<any immediate disqualifier observed — be specific about what they said. Empty array if none.>"
  ],
  "coachabilitySignals": [
    "<evidence of self-awareness, intellectual curiosity, or growth mindset in their responses. Empty array if none observed.>"
  ],
  "scenarioFeedback": [
    {
      "scenarioNumber": 1,
      "title": "<4-6 word label>",
      "feedback": "<3-5 sentences of specific, practitioner-level feedback referencing exactly what the candidate said or failed to say>",
      "strongerAnswer": "<1-2 sentences describing what an elite candidate would have said or done differently>"
    }
  ],
  "candidatePotential": "<3-4 sentences on this person's ceiling as a hospice rep — their upside if coached well, realistic timeline to productivity, what will determine whether they succeed or wash out>",
  "interviewGuide": [
    {
      "question": "<specific question Nick should ask in a live interview>",
      "intent": "<why — what gap or assumption this question is designed to pressure-test>"
    },
    {
      "question": "<second question>",
      "intent": "<why>"
    },
    {
      "question": "<third question>",
      "intent": "<why>"
    }
  ],
  "developmentPlan": [
    {
      "focus": "<specific skill or knowledge area to develop>",
      "action": "<concrete coaching action Nick can take or assign>"
    },
    {
      "focus": "<second focus>",
      "action": "<action>"
    },
    {
      "focus": "<third focus>",
      "action": "<action>"
    }
  ],
  "hiringRecommendation": "<2-3 direct sentences telling Nick exactly what to do with this candidate, with your honest reasoning. Be a practitioner, not a diplomat.>"
}`;

          const { generateComplexResponse } = await import("./openai");
          const rawResult = await generateComplexResponse(prompt, systemPrompt);

          let parsedResult: any = null;
          try {
            const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedResult = JSON.parse(jsonMatch[0]);
            }
          } catch {
            parsedResult = null;
          }

          if (parsedResult && typeof parsedResult.overallScore === "number") {
            aiScore = Math.min(100, Math.max(0, parsedResult.overallScore));
            aiFeedback = JSON.stringify(parsedResult);
          } else {
            const scoreMatch = rawResult.match(/SCORE:\s*(\d+)/i);
            aiScore = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;
            aiFeedback = rawResult;
          }
        } catch (aiError: any) {
          console.error("AI scoring failed:", aiError);
          aiFeedback = "AI scoring was unavailable. Please review scenario responses manually.";
          aiScore = null;
        }
      }

      let overallScore: number;
      if (quizScore !== null && aiScore !== null) {
        overallScore = Math.round((quizScore + aiScore) / 2);
      } else if (quizScore !== null) {
        overallScore = quizScore;
      } else if (aiScore !== null) {
        overallScore = aiScore;
      } else {
        overallScore = 0;
      }

      const updated = await storage.updateAssessmentSubmission(submission.id, {
        quizScore,
        aiScore,
        overallScore,
        aiFeedback: aiFeedback || null,
      });

      if (validatedInviteId) {
        storage.markAssessmentInviteUsed(validatedInviteId).catch(err => console.error("Failed to mark invite used:", err));
      }

      const { sendAssessmentConfirmation, sendSubmissionResultsToNick } = await import("./resend");
      const aiScoringFailed = aiFeedback === "AI scoring was unavailable. Please review scenario responses manually.";

      sendAssessmentConfirmation(
        candidateEmail,
        candidateName,
        assessment.name,
        overallScore,
        quizScore,
        aiScore,
        aiFeedback
      ).catch(err => console.error("Failed to send assessment confirmation email:", err));

      sendSubmissionResultsToNick(
        updated.id,
        candidateName,
        candidateEmail,
        assessment.name,
        overallScore,
        quizScore,
        aiScore,
        aiFeedback || null,
        aiScoringFailed
      ).catch(err => console.error("Failed to send admin notification email:", err));

      res.json({
        submission: updated,
        overallScore,
        quizScore,
        aiScore,
        feedback: aiFeedback,
      });
    } catch (error: any) {
      console.error("Assessment submission error:", error);
      res.status(500).json({ error: error.message || "Failed to submit assessment" });
    }
  });

  app.get("/api/assessments/:id/submissions", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const submissions = await storage.getAssessmentSubmissions(id);
      res.json({ submissions });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch submissions" });
    }
  });

  app.get("/api/submissions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const submission = await storage.getAssessmentSubmission(id);
      if (!submission) return res.status(404).json({ error: "Submission not found" });
      const assessment = await storage.getAssessment(submission.assessmentId);
      const questions = await storage.getAssessmentQuestions(submission.assessmentId);
      res.json({ submission, assessment, questions });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch submission" });
    }
  });

  // Assessment Invites
  app.post("/api/assessments/:id/invites", requireAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) return res.status(400).json({ error: "Invalid ID" });

      const { candidateEmail, candidateName } = req.body;
      if (!candidateEmail || !candidateName) {
        return res.status(400).json({ error: "candidateEmail and candidateName are required" });
      }

      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) return res.status(404).json({ error: "Assessment not found" });

      const { randomUUID } = await import("crypto");
      const token = randomUUID();

      const invite = await storage.createAssessmentInvite({
        assessmentId,
        token,
        candidateEmail,
        candidateName,
      });

      const siteUrl = process.env.SITE_URL
        || (process.env.REPLIT_DEPLOYMENT_URL ? `https://${process.env.REPLIT_DEPLOYMENT_URL}` : null)
        || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "");
      const assessmentUrl = `${siteUrl}/assessment/${assessmentId}?token=${token}`;

      const { sendAssessmentInvite } = await import("./resend");
      sendAssessmentInvite(candidateEmail, candidateName, assessment.name, assessmentUrl)
        .catch(err => console.error("Failed to send assessment invite email:", err));

      res.json({ invite, assessmentUrl });
    } catch (error: any) {
      console.error("Create invite error:", error);
      res.status(500).json({ error: error.message || "Failed to create invite" });
    }
  });

  app.get("/api/assessments/:id/invites", requireAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) return res.status(400).json({ error: "Invalid ID" });
      const invites = await storage.getAssessmentInvites(assessmentId);
      res.json({ invites });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch invites" });
    }
  });

  app.get("/api/assessment-invites/:token", async (req, res) => {
    try {
      const invite = await storage.getAssessmentInviteByToken(req.params.token);
      if (!invite) return res.status(404).json({ error: "Invalid or expired invite link" });
      if (invite.usedAt) {
        return res.status(410).json({
          error: "This invite has already been used",
          used: true,
          candidateName: invite.candidateName,
        });
      }
      res.json({
        candidateName: invite.candidateName,
        candidateEmail: invite.candidateEmail,
        assessmentId: invite.assessmentId,
        used: false,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to validate invite" });
    }
  });

  app.post("/api/admin/assessment-clients", requireAdmin, async (req, res) => {
    try {
      const { slug, companyName, logoUrl, accentColor, assessmentId } = req.body;
      if (!slug || !companyName || !assessmentId) {
        return res.status(400).json({ error: "slug, companyName, and assessmentId are required" });
      }
      const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
      if (slug.length < 2 || slug.length > 100 || !slugRegex.test(slug)) {
        return res.status(400).json({ error: "Slug must be 2-100 lowercase alphanumeric characters and hyphens" });
      }
      const existing = await storage.getAssessmentClientBySlug(slug);
      if (existing) {
        return res.status(409).json({ error: "A client with this slug already exists" });
      }
      const client = await storage.createAssessmentClient({
        slug,
        companyName,
        logoUrl: logoUrl || null,
        accentColor: accentColor || null,
        assessmentId: parseInt(assessmentId),
      });
      res.json({ client });
    } catch (error: any) {
      console.error("Create assessment client error:", error);
      res.status(500).json({ error: error.message || "Failed to create client" });
    }
  });

  app.get("/api/admin/assessment-clients", requireAdmin, async (req, res) => {
    try {
      const clients = await storage.getAssessmentClients();
      const clientsWithCounts = await Promise.all(
        clients.map(async (c) => {
          const submissions = await storage.getAssessmentSubmissions(c.assessmentId);
          const submissionCount = submissions.filter(s => s.clientSlug === c.slug).length;
          return { ...c, submissionCount };
        })
      );
      res.json({ clients: clientsWithCounts });
    } catch (error: any) {
      console.error("Get assessment clients error:", error);
      res.json({ clients: [] });
    }
  });

  app.delete("/api/admin/assessment-clients/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteAssessmentClient(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete assessment client error:", error);
      res.status(500).json({ error: error.message || "Failed to delete client" });
    }
  });

  app.get("/api/assess/:slug", async (req, res) => {
    try {
      const client = await storage.getAssessmentClientBySlug(req.params.slug);
      if (!client) {
        return res.status(404).json({ error: "Not found" });
      }
      const assessment = await storage.getAssessment(client.assessmentId);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      res.json({
        client: {
          slug: client.slug,
          companyName: client.companyName,
          logoUrl: client.logoUrl,
          accentColor: client.accentColor,
        },
        assessmentId: client.assessmentId,
      });
    } catch (error: any) {
      console.error("Get branded assessment error:", error);
      res.status(500).json({ error: error.message || "Failed to load assessment" });
    }
  });

  app.get("/api/site-settings", async (_req, res) => {
    try {
      const allSettings = await storage.getAllSettings();
      const settings: Record<string, string> = {};
      for (const s of allSettings) {
        settings[s.key] = s.value;
      }
      res.json({ settings });
    } catch (error: any) {
      console.error("Get site settings error:", error);
      res.json({ settings: {} });
    }
  });

  app.patch("/api/admin/site-settings", requireAdmin, async (req, res) => {
    try {
      const updates = req.body as Record<string, string>;
      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ error: "Invalid settings payload" });
      }
      for (const [key, value] of Object.entries(updates)) {
        if (typeof key !== "string" || typeof value !== "string") continue;
        await storage.setSetting(key, value);
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Update site settings error:", error);
      res.status(500).json({ error: error.message || "Failed to update settings" });
    }
  });

  // Object Storage: Serve objects (PDFs) - public read access with ACL check
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        requestedPermission: undefined,
      });
      
      if (!canAccess) {
        return res.sendStatus(403);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error retrieving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

}
