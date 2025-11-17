import { z } from "zod";
import { pgTable, text, serial, bigint, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Chat message schema for AI interactions
export const chatMessageSchema = z.object({
  role: z.enum(["user", "model"]),
  content: z.string(),
  timestamp: z.number().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// AI request/response schemas
export const aiRequestSchema = z.object({
  prompt: z.string().min(1),
  systemInstruction: z.string().optional(),
  maxTokens: z.number().optional(),
});

export type AIRequest = z.infer<typeof aiRequestSchema>;

export const aiResponseSchema = z.object({
  text: z.string(),
  sources: z.array(z.object({
    title: z.string(),
    uri: z.string(),
  })).optional(),
});

export type AIResponse = z.infer<typeof aiResponseSchema>;

// Playbook generation schema
export const playbookRequestSchema = z.object({
  scenario: z.string().min(10, "Scenario must be at least 10 characters"),
  desiredOutcomes: z.string().optional(),
});

export type PlaybookRequest = z.infer<typeof playbookRequestSchema>;

// Objection handler schema
export const objectionRequestSchema = z.object({
  objection: z.string().min(5, "Objection must be at least 5 characters"),
});

export type ObjectionRequest = z.infer<typeof objectionRequestSchema>;

// Research query schema
export const researchRequestSchema = z.object({
  query: z.string().min(5, "Query must be at least 5 characters"),
  useGrounding: z.boolean().default(true),
});

export type ResearchRequest = z.infer<typeof researchRequestSchema>;

// Chat request schema
export const chatRequestSchema = z.object({
  prompt: z.string().min(1, "Message cannot be empty"),
  conversationHistory: z.array(chatMessageSchema).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

// Text-to-speech schema
export const ttsRequestSchema = z.object({
  text: z.string().min(1),
});

export type TTSRequest = z.infer<typeof ttsRequestSchema>;

// Audio transcription schema
export const transcriptionRequestSchema = z.object({
  audioData: z.string(), // base64 encoded audio
  mimeType: z.string(),
});

export type TranscriptionRequest = z.infer<typeof transcriptionRequestSchema>;

// Inquiry form schema
export const inquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  company: z.string().optional(),
  serviceType: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  submittedAt: z.number().optional(),
});

export type Inquiry = z.infer<typeof inquirySchema>;

// Drizzle table definition for inquiries
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company"),
  serviceType: text("service_type"),
  message: text("message").notNull(),
  submittedAt: bigint("submitted_at", { mode: "number" }).notNull(),
});

// Insert schema and types for inquiries
export const insertInquirySchema = createInsertSchema(inquiries).omit({ 
  id: true, 
  submittedAt: true 
});
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type SelectInquiry = typeof inquiries.$inferSelect;

// Drizzle table definition for newsletter subscribers
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  subscribedAt: bigint("subscribed_at", { mode: "number" }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Insert schema and types for newsletter subscribers
export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({ 
  id: true, 
  subscribedAt: true,
  isActive: true
});
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type SelectNewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

// Drizzle table definition for articles
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  linkedinUrl: text("linkedin_url").notNull(),
  publishDate: bigint("publish_date", { mode: "number" }).notNull(),
  featured: boolean("featured").notNull().default(false),
});

// Insert schema and types for articles
export const insertArticleSchema = createInsertSchema(articles).omit({ 
  id: true
});
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type SelectArticle = typeof articles.$inferSelect;

// Drizzle table definition for visitor tracking
export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  pagePath: text("page_path").notNull(),
  visitedAt: bigint("visited_at", { mode: "number" }).notNull(),
});

// Insert schema and types for visitors
export const insertVisitorSchema = createInsertSchema(visitors).omit({ 
  id: true, 
  visitedAt: true 
});
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type SelectVisitor = typeof visitors.$inferSelect;

// Visitor analytics response schema
export const visitorAnalyticsSchema = z.object({
  day: z.number(),
  week: z.number(),
  month: z.number(),
  quarter: z.number(),
  year: z.number(),
});

export type VisitorAnalytics = z.infer<typeof visitorAnalyticsSchema>;

// Email template request schema
export const emailTemplateRequestSchema = z.object({
  templateType: z.enum(["follow_up", "thank_you", "value_add"]),
  recipientName: z.string().optional(),
  context: z.string().min(10, "Context must be at least 10 characters"),
  customization: z.string().optional(),
});

export type EmailTemplateRequest = z.infer<typeof emailTemplateRequestSchema>;

// Theme preference
export type Theme = "light" | "dark";

// Service/Program data types (for display only, no database storage needed for MVP)
export interface CoachingService {
  title: string;
  price: number;
  duration: string;
  description: string;
  features: string[];
}

export interface HospiceProgram {
  title: string;
  duration: string;
  description: string;
  deliverables: string[];
  icon?: string;
}

export interface StrategicService {
  title: string;
  description: string;
  deliverables: string[];
}

export interface Resource {
  title: string;
  description: string;
  fileSize?: string;
  downloadUrl?: string;
}
