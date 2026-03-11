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
import { sendInquiryNotification, sendNewsletterConfirmation, sendGeneratedEmail, sendAgreementConfirmation, sendResourceLeadNotification, sendNewsletterNotification, sendNewsletterBroadcast, sendDripDay3, sendDripDay7 } from "./resend";

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
      
      await sendAgreementConfirmation({
        agreementType: agreement.agreementType,
        signerName: agreement.signerName,
        signerTitle: agreement.signerTitle,
        signerOrganization: agreement.signerOrganization,
        signerEmail: agreement.signerEmail,
        signedAt: new Date(agreement.signedAt!).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        }),
      });
      
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
      res.json({ agreements });
    } catch (error: any) {
      console.error("Get signed agreements error:", error);
      res.status(500).json({ error: "Failed to retrieve agreements" });
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
