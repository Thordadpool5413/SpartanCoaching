import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  generateComplexResponse,
  generateQuickResponse,
  generateGroundedSearch,
  generateDailyDrill,
  generateChatResponse,
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
} from "@shared/schema";

import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

// Get admin password from environment, default to secure value for development
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "5413";

// Track if auth has been initialized (for deferred init)
let authInitialized = false;

// Deferred initialization - call this AFTER server.listen()
export async function deferredInit(app: Express): Promise<void> {
  if (!authInitialized) {
    console.log("Running deferred auth initialization...");
    await setupAuth(app);
    authInitialized = true;
    console.log("Auth initialization complete");
  }
}

export function registerRoutes(app: Express): Server {
  // Serve training resources files
  // In development: ./public/resources (from project root)
  // In production: ./dist/public/resources (bundled with the build)
  const resourcesPath = process.env.NODE_ENV === 'production'
    ? path.join(import.meta.dirname, 'public', 'resources')
    : path.join(import.meta.dirname, '..', 'public', 'resources');
  app.use('/resources', express.static(resourcesPath));

  // NOTE: Auth setup is deferred to after server.listen() for faster startup
  // See deferredInit() function above

  // Auth routes - blueprint:javascript_log_in_with_replit
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
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
      const drill = await generateDailyDrill();
      
      res.json({ drill });
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
      console.error("Get articles error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve articles" });
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
      res.status(500).json({ error: error.message || "Failed to retrieve article" });
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
      console.error("Get resources error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve resources" });
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
      console.error("Get podcasts error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve podcasts" });
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

  const httpServer = createServer(app);

  return httpServer;
}
