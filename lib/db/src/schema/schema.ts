import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { pgTable, text, serial, bigint, boolean, varchar, timestamp, jsonb, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Replit Auth: Session storage table
// This table is mandatory for Replit Auth - from blueprint:javascript_log_in_with_replit
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Replit Auth: User storage table
// This table is mandatory for Replit Auth - from blueprint:javascript_log_in_with_replit
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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
  isRead: boolean("is_read").default(false).notNull(),
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

export const resourceLeads = pgTable("resource_leads", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  email: text("email").notNull(),
  resourceId: integer("resource_id").notNull(),
  resourceTitle: varchar("resource_title").notNull(),
  capturedAt: timestamp("captured_at").defaultNow(),
});

export const insertResourceLeadSchema = createInsertSchema(resourceLeads).omit({ 
  id: true,
  capturedAt: true
});
export type InsertResourceLead = z.infer<typeof insertResourceLeadSchema>;
export type SelectResourceLead = typeof resourceLeads.$inferSelect;

export const usageEvents = pgTable("usage_events", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  email: text("email").notNull(),
  toolName: varchar("tool_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shared daily quota so AI spend remains capped across restarts and instances.
export const aiUsageDaily = pgTable("ai_usage_daily", {
  date: varchar("date", { length: 10 }).primaryKey(),
  count: integer("count").notNull().default(0),
});

export const emailUsageDaily = pgTable("email_usage_daily", {
  date: varchar("date", { length: 10 }).primaryKey(),
  count: integer("count").notNull().default(0),
});

export const objectUploadTokens = pgTable("object_upload_tokens", {
  token: varchar("token", { length: 36 }).primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertUsageEventSchema = createInsertSchema(usageEvents).omit({ id: true, createdAt: true });
export type InsertUsageEvent = z.infer<typeof insertUsageEventSchema>;
export type SelectUsageEvent = typeof usageEvents.$inferSelect;

export const signedAgreements = pgTable("signed_agreements", {
  id: serial("id").primaryKey(),
  agreementType: varchar("agreement_type").notNull(),
  signerName: varchar("signer_name").notNull(),
  signerTitle: varchar("signer_title").notNull(),
  signerOrganization: varchar("signer_organization").notNull(),
  signerEmail: text("signer_email").notNull(),
  signatureImage: text("signature_image"),
  pdfData: text("pdf_data"),
  requestId: integer("request_id"),
  signedAt: timestamp("signed_at").defaultNow(),
});

export const insertSignedAgreementSchema = createInsertSchema(signedAgreements).omit({
  id: true,
  signedAt: true,
});
export type InsertSignedAgreement = z.infer<typeof insertSignedAgreementSchema>;
export type SelectSignedAgreement = typeof signedAgreements.$inferSelect;

export const agreementRequests = pgTable("agreement_requests", {
  id: serial("id").primaryKey(),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: varchar("recipient_name").notNull(),
  documentTypes: text("document_types").array().notNull(),
  token: varchar("token").notNull().unique(),
  status: varchar("status").notNull().default("pending"),
  sentAt: timestamp("sent_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertAgreementRequestSchema = createInsertSchema(agreementRequests).omit({
  id: true,
  token: true,
  status: true,
  sentAt: true,
  completedAt: true,
});
export type InsertAgreementRequest = z.infer<typeof insertAgreementRequestSchema>;
export type SelectAgreementRequest = typeof agreementRequests.$inferSelect;

// Drizzle table definition for articles
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  linkedinUrl: text("linkedin_url").notNull(),
  publishDate: bigint("publish_date", { mode: "number" }).notNull(),
  featured: boolean("featured").notNull().default(false),
  pdfUrl: text("pdf_url"),
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

export const eventTracking = pgTable("event_tracking", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  eventName: text("event_name").notNull(),
  metadata: text("metadata"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  /** Owning Field Kit member — populated by mobile clients; null for anonymous/web events. */
  memberId: integer("member_id"),
});

export const insertEventTrackingSchema = createInsertSchema(eventTracking).omit({
  id: true,
  createdAt: true,
});
export type InsertEventTracking = z.infer<typeof insertEventTrackingSchema>;
export type SelectEventTracking = typeof eventTracking.$inferSelect;

// Drizzle table definition for resources
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  fileUrl: varchar("file_url").notNull(),
  category: varchar("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schema and types for resources
export const insertResourceSchema = createInsertSchema(resources).omit({ 
  id: true,
  createdAt: true
});
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type SelectResource = typeof resources.$inferSelect;

// Drizzle table definition for podcasts
export const podcasts = pgTable("podcasts", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  episodeNumber: integer("episode_number"),
  audioUrl: varchar("audio_url"),
  publishDate: timestamp("publish_date").notNull().defaultNow(),
  duration: varchar("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schema and types for podcasts
export const insertPodcastSchema = createInsertSchema(podcasts).omit({ 
  id: true,
  createdAt: true,
  publishDate: true
});
export type InsertPodcast = z.infer<typeof insertPodcastSchema>;
export type SelectPodcast = typeof podcasts.$inferSelect;

// Visitor analytics response schema
export const visitorAnalyticsSchema = z.object({
  day: z.number(),
  week: z.number(),
  month: z.number(),
  quarter: z.number(),
  year: z.number(),
});

export type VisitorAnalytics = z.infer<typeof visitorAnalyticsSchema>;

// Shared schema for the event-analytics API response.
// All fields here are required — removing or renaming one is a build-time error
// in both the IStorage interface and the DatabaseStorage implementation.
const eventCountItemSchema = z.object({
  eventName: z.string(),
  count: z.number(),
});

export const eventAnalyticsSchema = z.object({
  aiToolUsage: z.array(eventCountItemSchema),
  resourceDownloads: z.array(eventCountItemSchema),
  contactSubmissions: z.number(),
  mobileAiToolUsage: z.array(eventCountItemSchema),
  mobileToolViews: z.array(eventCountItemSchema),
  mobileAppOpens: z.object({
    day: z.number(),
    week: z.number(),
    month: z.number(),
  }),
});

export type EventAnalytics = z.infer<typeof eventAnalyticsSchema>;

export const mobileUsagePerMemberSchema = z.object({
  memberId: z.number(),
  mobileEvents: z.number(),
  webEvents: z.number(),
});

export type MobileUsagePerMember = z.infer<typeof mobileUsagePerMemberSchema>;

// Email template request schema
export const emailTemplateRequestSchema = z.object({
  templateType: z.enum(["follow_up", "thank_you", "value_add"]),
  recipientName: z.string().optional(),
  context: z.string().min(10, "Context must be at least 10 characters"),
  customization: z.string().optional(),
});

export type EmailTemplateRequest = z.infer<typeof emailTemplateRequestSchema>;

// Role-play practice sessions (tenant-safe: memberId + organizationId required for new rows)
export const roleplaySessions = pgTable(
  "roleplay_sessions",
  {
    id: serial("id").primaryKey(),
    /** Owning Field Kit member. Null only on pre-tenant legacy rows (never exposed). */
    memberId: integer("member_id"),
    /** Owning org. Null only on pre-tenant legacy rows (never exposed). */
    organizationId: integer("organization_id"),
    scenarioId: text("scenario_id").notNull(),
    scenarioTitle: text("scenario_title").notNull(),
    scenarioDescription: text("scenario_description"),
    status: text("status").notNull().default("active"), // "active" | "completed"
    feedback: text("feedback"),
    rating: integer("rating"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
  },
  (table) => [
    index("IDX_roleplay_sessions_member").on(table.memberId),
    index("IDX_roleplay_sessions_org").on(table.organizationId),
  ],
);

export const insertRoleplaySessionSchema = createInsertSchema(roleplaySessions).omit({
  id: true,
  createdAt: true,
  feedback: true,
  rating: true,
});
export type InsertRoleplaySession = z.infer<typeof insertRoleplaySessionSchema>;
export type SelectRoleplaySession = typeof roleplaySessions.$inferSelect;

// Role-play conversation messages
export const roleplayMessages = pgTable("roleplay_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  role: text("role").notNull(), // "user" | "character"
  content: text("content").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const insertRoleplayMessageSchema = createInsertSchema(roleplayMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertRoleplayMessage = z.infer<typeof insertRoleplayMessageSchema>;
export type SelectRoleplayMessage = typeof roleplayMessages.$inferSelect;

// Daily drill completions (tenant-scoped — memberId required for new rows)
export const drillCompletions = pgTable("drill_completions", {
  id: serial("id").primaryKey(),
  drillIndex: integer("drill_index").notNull(),
  drillTitle: text("drill_title").notNull(),
  notes: text("notes"),
  completedAt: bigint("completed_at", { mode: "number" }).notNull(),
  /** Field Kit member who completed the drill (null = legacy pre-tenancy row) */
  memberId: integer("member_id"),
  organizationId: integer("organization_id"),
});

export const insertDrillCompletionSchema = createInsertSchema(drillCompletions).omit({
  id: true,
  completedAt: true,
});
export type InsertDrillCompletion = z.infer<typeof insertDrillCompletionSchema>;
export type SelectDrillCompletion = typeof drillCompletions.$inferSelect;

// Role-play request schemas
export const roleplayStartSchema = z.object({
  scenarioId: z.string().min(1),
  scenarioTitle: z.string().min(1),
  scenarioDescription: z.string().optional(),
});
export type RoleplayStartRequest = z.infer<typeof roleplayStartSchema>;

export const roleplayMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});
export type RoleplayMessageRequest = z.infer<typeof roleplayMessageSchema>;

// Drill completion request schema
export const drillCompletionRequestSchema = z.object({
  drillIndex: z.number().int().min(0),
  drillTitle: z.string().min(1),
  notes: z.string().optional(),
});
export type DrillCompletionRequest = z.infer<typeof drillCompletionRequestSchema>;

// Send email request schema
export const sendEmailRequestSchema = z.object({
  to: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
});
export type SendEmailRequest = z.infer<typeof sendEmailRequestSchema>;

// Theme preference
// (chat model exported from schema/index.ts)

export type Theme = "light" | "dark";

// Testimonials
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  quote: text("quote").notNull(),
  outcome: text("outcome").notNull(),
  category: text("category").notNull().default("individual"),
  featured: boolean("featured").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
});
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type SelectTestimonial = typeof testimonials.$inferSelect;

// Case Studies
export const caseStudies = pgTable("case_studies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  clientLabel: text("client_label").notNull(),
  challenge: text("challenge").notNull(),
  solution: text("solution").notNull(),
  results: text("results").array().notNull(),
  category: text("category").notNull().default("individual"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCaseStudySchema = createInsertSchema(caseStudies).omit({
  id: true,
  createdAt: true,
});
export type InsertCaseStudy = z.infer<typeof insertCaseStudySchema>;
export type SelectCaseStudy = typeof caseStudies.$inferSelect;

// Assessments
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type SelectAssessment = typeof assessments.$inferSelect;

// Assessment Questions
export const assessmentQuestions = pgTable("assessment_questions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  type: varchar("type").notNull(), // "quiz" | "scenario"
  text: text("text").notNull(),
  options: text("options").array(), // for quiz type, JSON array of option strings
  correctAnswer: text("correct_answer"), // for quiz type
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions).omit({
  id: true,
});
export type InsertAssessmentQuestion = z.infer<typeof insertAssessmentQuestionSchema>;
export type SelectAssessmentQuestion = typeof assessmentQuestions.$inferSelect;

// Assessment Clients (branded assessment URLs)
export const assessmentClients = pgTable("assessment_clients", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  companyName: varchar("company_name").notNull(),
  logoUrl: text("logo_url"),
  accentColor: varchar("accent_color", { length: 20 }),
  assessmentId: integer("assessment_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssessmentClientSchema = createInsertSchema(assessmentClients).omit({
  id: true,
  createdAt: true,
});
export type InsertAssessmentClient = z.infer<typeof insertAssessmentClientSchema>;
export type SelectAssessmentClient = typeof assessmentClients.$inferSelect;

// Assessment Submissions
export const assessmentSubmissions = pgTable("assessment_submissions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  candidateName: varchar("candidate_name").notNull(),
  candidateEmail: text("candidate_email").notNull(),
  answers: jsonb("answers").notNull(), // JSON: { questionId: answer }
  quizScore: integer("quiz_score"),
  aiScore: integer("ai_score"),
  overallScore: integer("overall_score"),
  aiFeedback: text("ai_feedback"),
  clientSlug: varchar("client_slug", { length: 100 }),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertAssessmentSubmissionSchema = createInsertSchema(assessmentSubmissions).omit({
  id: true,
  quizScore: true,
  aiScore: true,
  overallScore: true,
  aiFeedback: true,
  completedAt: true,
});
export type InsertAssessmentSubmission = z.infer<typeof insertAssessmentSubmissionSchema>;
export type SelectAssessmentSubmission = typeof assessmentSubmissions.$inferSelect;

// Assessment Invites
export const assessmentInvites = pgTable("assessment_invites", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  token: varchar("token").notNull().unique(),
  candidateEmail: text("candidate_email").notNull(),
  candidateName: varchar("candidate_name").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

export const insertAssessmentInviteSchema = createInsertSchema(assessmentInvites).omit({
  id: true,
  sentAt: true,
  usedAt: true,
});
export type InsertAssessmentInvite = z.infer<typeof insertAssessmentInviteSchema>;
export type SelectAssessmentInvite = typeof assessmentInvites.$inferSelect;

// Service/Program data types (for display only, no database storage needed for MVP)
export interface CoachingService {
  title: string;
  price: number;
  duration: string;
  description: string;
  features: string[];
}

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SelectSiteSetting = typeof siteSettings.$inferSelect;

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
