import type { Express } from "express";
import express from "express";

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
} from "./gemini";
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
import { sendInquiryNotification, sendNewsletterConfirmation, sendGeneratedEmail, sendAgreementConfirmation, sendResourceLeadNotification, sendNewsletterNotification } from "./resend";

// Get admin password from environment, default to secure value for development
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "5413";

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
      { path: '/drills', priority: '0.7', changefreq: 'daily' },
      { path: '/resources', priority: '0.8', changefreq: 'weekly' },
      { path: '/resources/weekly-plan', priority: '0.6', changefreq: 'monthly' },
      { path: '/resources/quick-start-guide', priority: '0.6', changefreq: 'monthly' },
      { path: '/resources/objection-cards', priority: '0.6', changefreq: 'monthly' },
      { path: '/resources/territory-template', priority: '0.6', changefreq: 'monthly' },
      { path: '/resources/metrics-dashboard', priority: '0.6', changefreq: 'monthly' },
      { path: '/articles', priority: '0.8', changefreq: 'weekly' },
      { path: '/podcasts', priority: '0.8', changefreq: 'weekly' },
      { path: '/testimonials', priority: '0.7', changefreq: 'monthly' },
      { path: '/learn/knowledge-base', priority: '0.7', changefreq: 'monthly' },
      { path: '/about', priority: '0.6', changefreq: 'monthly' },
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
  app.post("/api/playbooks", async (req, res) => {
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
  app.post("/api/objections", async (req, res) => {
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
  app.post("/api/research", async (req, res) => {
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
  app.get("/api/daily-drill", async (req, res) => {
    try {
      const drillData = await generateDailyDrill();
      res.json(drillData);
    } catch (error: any) {
      console.error("Daily drill error:", error);
      res.status(500).json({ error: error.message || "Failed to generate daily drill" });
    }
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
  app.get("/api/inquiries", async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      
      res.json({ inquiries });
    } catch (error: any) {
      console.error("Get inquiries error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve inquiries" });
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
  app.get("/api/newsletter/subscribers", async (req, res) => {
    try {
      const subscribers = await storage.getNewsletterSubscribers();
      
      res.json({ subscribers });
    } catch (error: any) {
      console.error("Get subscribers error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve subscribers" });
    }
  });

  // Email Template Generator
  app.post("/api/email-templates", async (req, res) => {
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
      const lead = await storage.captureResourceLead(leadData);
      sendResourceLeadNotification(leadData.name, leadData.email, leadData.resourceTitle).catch(err =>
        console.error("Failed to send resource lead notification:", err)
      );
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

  app.get("/api/resource-leads", async (_req, res) => {
    try {
      const leads = await storage.getResourceLeads();
      res.json({ leads });
    } catch (error: any) {
      console.error("Get resource leads error:", error);
      res.status(500).json({ error: "Failed to retrieve leads" });
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

  app.get("/api/signed-agreements", async (_req, res) => {
    try {
      const agreements = await storage.getSignedAgreements();
      res.json({ agreements });
    } catch (error: any) {
      console.error("Get signed agreements error:", error);
      res.status(500).json({ error: "Failed to retrieve agreements" });
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
  app.get("/api/analytics/visitors", async (req, res) => {
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

  app.get("/api/analytics/events", async (req, res) => {
    try {
      const analytics = await storage.getEventAnalytics();
      res.json({ analytics });
    } catch (error: any) {
      console.error("Get event analytics error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve event analytics" });
    }
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

  app.post("/api/roleplay/sessions", async (req, res) => {
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

  app.post("/api/roleplay/sessions/:id/messages", async (req, res) => {
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

  app.post("/api/roleplay/sessions/:id/feedback", async (req, res) => {
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
      res.status(500).json({ error: error.message || "Failed to record completion" });
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

  app.post("/api/send-email", async (req, res) => {
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
