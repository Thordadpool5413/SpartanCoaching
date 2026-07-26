import { 
  inquiries, 
  newsletterSubscribers,
  articles,
  visitors,
  users,
  resources,
  podcasts,
  eventTracking,
  type InsertInquiry, 
  type SelectInquiry,
  type InsertNewsletterSubscriber,
  type SelectNewsletterSubscriber,
  type InsertArticle,
  type SelectArticle,
  type InsertVisitor,
  type SelectVisitor,
  type VisitorAnalytics,
  type User,
  type UpsertUser,
  type InsertResource,
  type SelectResource,
  type InsertPodcast,
  type SelectPodcast,
  type InsertEventTracking,
  type SelectEventTracking,
  roleplaySessions,
  roleplayMessages,
  drillCompletions,
  type InsertRoleplaySession,
  type SelectRoleplaySession,
  type InsertRoleplayMessage,
  type SelectRoleplayMessage,
  type InsertDrillCompletion,
  type SelectDrillCompletion,
  resourceLeads,
  type InsertResourceLead,
  type SelectResourceLead,
  usageEvents,
  type InsertUsageEvent,
  type SelectUsageEvent,
  signedAgreements,
  type InsertSignedAgreement,
  type SelectSignedAgreement,
  agreementRequests,
  type InsertAgreementRequest,
  type SelectAgreementRequest,
  testimonials,
  type InsertTestimonial,
  type SelectTestimonial,
  caseStudies,
  type InsertCaseStudy,
  type SelectCaseStudy,
  assessments,
  assessmentQuestions,
  assessmentSubmissions,
  assessmentInvites,
  assessmentClients,
  siteSettings,
  type SelectSiteSetting,
  type EventAnalytics,
  type MobileUsagePerMember,
  type InsertAssessment,
  type SelectAssessment,
  type InsertAssessmentQuestion,
  type SelectAssessmentQuestion,
  type InsertAssessmentSubmission,
  type SelectAssessmentSubmission,
  type InsertAssessmentInvite,
  type SelectAssessmentInvite,
  type InsertAssessmentClient,
  type SelectAssessmentClient,
} from "@workspace/db";
import { db } from "./db";
import { and, desc, eq, gte, count, ilike, isNotNull, sql } from "drizzle-orm";

// Storage interface for CRUD operations
export interface IStorage {
  // User operations (Replit Auth - blueprint:javascript_log_in_with_replit)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  // Other operations
  createInquiry(inquiry: InsertInquiry): Promise<SelectInquiry>;
  getInquiries(): Promise<SelectInquiry[]>;
  markInquiryRead(id: number, isRead: boolean): Promise<SelectInquiry>;
  subscribeNewsletter(subscriber: InsertNewsletterSubscriber): Promise<SelectNewsletterSubscriber>;
  getNewsletterSubscribers(): Promise<SelectNewsletterSubscriber[]>;
  unsubscribeNewsletter(email: string): Promise<void>;
  createArticle(article: InsertArticle): Promise<SelectArticle>;
  getArticles(): Promise<SelectArticle[]>;
  getArticle(id: number): Promise<SelectArticle | undefined>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<SelectArticle>;
  deleteArticle(id: number): Promise<void>;
  trackVisitor(visitor: InsertVisitor): Promise<SelectVisitor>;
  getVisitorAnalytics(): Promise<VisitorAnalytics>;
  getAllResources(): Promise<SelectResource[]>;
  getResource(id: number): Promise<SelectResource | undefined>;
  createResource(data: InsertResource): Promise<SelectResource>;
  deleteResource(id: number): Promise<void>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<SelectResource>;
  getAllPodcasts(): Promise<SelectPodcast[]>;
  getPodcast(id: number): Promise<SelectPodcast | undefined>;
  createPodcast(data: InsertPodcast): Promise<SelectPodcast>;
  updatePodcast(id: number, podcast: Partial<InsertPodcast>): Promise<SelectPodcast>;
  deletePodcast(id: number): Promise<void>;
  trackEvent(event: InsertEventTracking): Promise<SelectEventTracking>;
  getEventCounts(eventType: string): Promise<Array<{ eventName: string; count: number }>>;
  getEventAnalytics(): Promise<EventAnalytics>;
  getMobileUsagePerMember(): Promise<MobileUsagePerMember[]>;
  // Role-play operations (tenant-safe — never returns unowned legacy rows)
  createRoleplaySession(session: InsertRoleplaySession): Promise<SelectRoleplaySession>;
  getRoleplaySession(id: number): Promise<SelectRoleplaySession | undefined>;
  getRoleplaySessionsForMember(memberId: number): Promise<SelectRoleplaySession[]>;
  getOwnedRoleplaySessions(): Promise<SelectRoleplaySession[]>;
  getRoleplayStatsForMember(memberId: number): Promise<Array<{ scenarioId: string; count: number; lastPracticedAt: number | null }>>;
  updateRoleplaySession(id: number, updates: Partial<{ status: string; feedback: string; rating: number }>): Promise<SelectRoleplaySession>;
  createRoleplayMessage(message: InsertRoleplayMessage): Promise<SelectRoleplayMessage>;
  getRoleplayMessages(sessionId: number): Promise<SelectRoleplayMessage[]>;
  // Drill operations (tenant-scoped for members; admin lists all)
  createDrillCompletion(completion: InsertDrillCompletion): Promise<SelectDrillCompletion>;
  getDrillCompletions(): Promise<SelectDrillCompletion[]>;
  getDrillCompletionsForMember(memberId: number): Promise<SelectDrillCompletion[]>;
  // Resource lead operations
  captureResourceLead(lead: InsertResourceLead): Promise<SelectResourceLead>;
  getResourceLeads(): Promise<SelectResourceLead[]>;
  isNewResourceLeadEmail(email: string): Promise<boolean>;
  // Usage event tracking
  trackUsageEvent(event: InsertUsageEvent): Promise<SelectUsageEvent>;
  getUsageEvents(): Promise<SelectUsageEvent[]>;
  createSignedAgreement(agreement: InsertSignedAgreement): Promise<SelectSignedAgreement>;
  getSignedAgreements(): Promise<SelectSignedAgreement[]>;
  createAgreementRequest(request: InsertAgreementRequest, token: string): Promise<SelectAgreementRequest>;
  getAgreementRequests(): Promise<SelectAgreementRequest[]>;
  getAgreementRequestByToken(token: string): Promise<SelectAgreementRequest | undefined>;
  updateAgreementRequestStatus(id: number, status: string, completedAt?: Date): Promise<SelectAgreementRequest>;
  getSignedAgreementsByRequestId(requestId: number): Promise<SelectSignedAgreement[]>;
  getSignedAgreementById(id: number): Promise<SelectSignedAgreement | undefined>;
  updateSignedAgreementPdf(id: number, pdfData: string): Promise<void>;
  // Testimonial operations
  getTestimonials(): Promise<SelectTestimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<SelectTestimonial>;
  updateTestimonial(id: number, testimonial: Partial<InsertTestimonial>): Promise<SelectTestimonial>;
  deleteTestimonial(id: number): Promise<void>;
  // Case study operations
  getCaseStudies(): Promise<SelectCaseStudy[]>;
  createCaseStudy(study: InsertCaseStudy): Promise<SelectCaseStudy>;
  updateCaseStudy(id: number, study: Partial<InsertCaseStudy>): Promise<SelectCaseStudy>;
  deleteCaseStudy(id: number): Promise<void>;
  // Assessment operations
  createAssessment(assessment: InsertAssessment): Promise<SelectAssessment>;
  getAssessments(): Promise<SelectAssessment[]>;
  getAssessment(id: number): Promise<SelectAssessment | undefined>;
  deleteAssessment(id: number): Promise<void>;
  createAssessmentQuestion(question: InsertAssessmentQuestion): Promise<SelectAssessmentQuestion>;
  getAssessmentQuestions(assessmentId: number): Promise<SelectAssessmentQuestion[]>;
  deleteAssessmentQuestion(id: number): Promise<void>;
  createAssessmentSubmission(submission: InsertAssessmentSubmission): Promise<SelectAssessmentSubmission>;
  updateAssessmentSubmission(id: number, updates: Partial<SelectAssessmentSubmission>): Promise<SelectAssessmentSubmission>;
  getAssessmentSubmissions(assessmentId: number): Promise<SelectAssessmentSubmission[]>;
  getAssessmentSubmission(id: number): Promise<SelectAssessmentSubmission | undefined>;
  createAssessmentInvite(invite: InsertAssessmentInvite): Promise<SelectAssessmentInvite>;
  getAssessmentInvites(assessmentId: number): Promise<SelectAssessmentInvite[]>;
  getAssessmentInviteByToken(token: string): Promise<SelectAssessmentInvite | undefined>;
  markAssessmentInviteUsed(id: number): Promise<SelectAssessmentInvite>;
  createAssessmentClient(client: InsertAssessmentClient): Promise<SelectAssessmentClient>;
  getAssessmentClients(): Promise<SelectAssessmentClient[]>;
  getAssessmentClientBySlug(slug: string): Promise<SelectAssessmentClient | undefined>;
  deleteAssessmentClient(id: number): Promise<void>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<SelectSiteSetting[]>;
}

// Database-backed storage implementation
export class DatabaseStorage implements IStorage {
  // User operations (Replit Auth - blueprint:javascript_log_in_with_replit)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createInquiry(inquiry: InsertInquiry): Promise<SelectInquiry> {
    const inquiryWithTimestamp = {
      ...inquiry,
      submittedAt: Date.now(),
    };
    
    const [created] = await db
      .insert(inquiries)
      .values(inquiryWithTimestamp)
      .returning();
    
    return created;
  }

  async getInquiries(): Promise<SelectInquiry[]> {
    return await db
      .select()
      .from(inquiries)
      .orderBy(desc(inquiries.submittedAt));
  }

  async markInquiryRead(id: number, isRead: boolean): Promise<SelectInquiry> {
    const [updated] = await db
      .update(inquiries)
      .set({ isRead })
      .where(eq(inquiries.id, id))
      .returning();
    return updated;
  }

  async subscribeNewsletter(subscriber: InsertNewsletterSubscriber): Promise<SelectNewsletterSubscriber> {
    const subscriberWithTimestamp = {
      ...subscriber,
      subscribedAt: Date.now(),
      isActive: true,
    };
    
    const [created] = await db
      .insert(newsletterSubscribers)
      .values(subscriberWithTimestamp)
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: { isActive: true, subscribedAt: Date.now() }
      })
      .returning();
    
    return created;
  }

  async getNewsletterSubscribers(): Promise<SelectNewsletterSubscriber[]> {
    return await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.isActive, true))
      .orderBy(desc(newsletterSubscribers.subscribedAt));
  }

  async unsubscribeNewsletter(email: string): Promise<void> {
    await db
      .update(newsletterSubscribers)
      .set({ isActive: false })
      .where(eq(newsletterSubscribers.email, email));
  }

  async createArticle(article: InsertArticle): Promise<SelectArticle> {
    const [created] = await db
      .insert(articles)
      .values(article)
      .returning();
    
    return created;
  }

  async getArticles(): Promise<SelectArticle[]> {
    return await db
      .select()
      .from(articles)
      .orderBy(desc(articles.publishDate));
  }

  async getArticle(id: number): Promise<SelectArticle | undefined> {
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id));
    
    return article;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<SelectArticle> {
    const [updated] = await db
      .update(articles)
      .set(article)
      .where(eq(articles.id, id))
      .returning();
    
    return updated;
  }

  async deleteArticle(id: number): Promise<void> {
    await db
      .delete(articles)
      .where(eq(articles.id, id));
  }

  async trackVisitor(visitor: InsertVisitor): Promise<SelectVisitor> {
    const visitorWithTimestamp = {
      ...visitor,
      visitedAt: Date.now(),
    };
    
    const [created] = await db
      .insert(visitors)
      .values(visitorWithTimestamp)
      .returning();
    
    return created;
  }

  async getVisitorAnalytics(): Promise<VisitorAnalytics> {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    const dayAgo = now - msPerDay;
    const weekAgo = now - (7 * msPerDay);
    const monthAgo = now - (30 * msPerDay);
    const quarterAgo = now - (90 * msPerDay);
    const yearAgo = now - (365 * msPerDay);
    
    const [dayResult, weekResult, monthResult, quarterResult, yearResult] = await Promise.all([
      db.select({ count: count() }).from(visitors).where(gte(visitors.visitedAt, dayAgo)),
      db.select({ count: count() }).from(visitors).where(gte(visitors.visitedAt, weekAgo)),
      db.select({ count: count() }).from(visitors).where(gte(visitors.visitedAt, monthAgo)),
      db.select({ count: count() }).from(visitors).where(gte(visitors.visitedAt, quarterAgo)),
      db.select({ count: count() }).from(visitors).where(gte(visitors.visitedAt, yearAgo)),
    ]);
    
    return {
      day: dayResult[0].count,
      week: weekResult[0].count,
      month: monthResult[0].count,
      quarter: quarterResult[0].count,
      year: yearResult[0].count,
    };
  }

  async getAllResources(): Promise<SelectResource[]> {
    return await db
      .select()
      .from(resources)
      .orderBy(desc(resources.createdAt));
  }

  async getResource(id: number): Promise<SelectResource | undefined> {
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, id));
    
    return resource;
  }

  async createResource(data: InsertResource): Promise<SelectResource> {
    const [created] = await db
      .insert(resources)
      .values(data)
      .returning();
    
    return created;
  }

  async deleteResource(id: number): Promise<void> {
    await db
      .delete(resources)
      .where(eq(resources.id, id));
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<SelectResource> {
    const [updated] = await db
      .update(resources)
      .set(resource)
      .where(eq(resources.id, id))
      .returning();
    
    return updated;
  }

  async getAllPodcasts(): Promise<SelectPodcast[]> {
    return await db
      .select()
      .from(podcasts)
      .orderBy(desc(podcasts.publishDate));
  }

  async getPodcast(id: number): Promise<SelectPodcast | undefined> {
    const [podcast] = await db
      .select()
      .from(podcasts)
      .where(eq(podcasts.id, id));
    
    return podcast;
  }

  async createPodcast(data: InsertPodcast): Promise<SelectPodcast> {
    const [created] = await db
      .insert(podcasts)
      .values(data)
      .returning();
    
    return created;
  }

  async updatePodcast(id: number, podcast: Partial<InsertPodcast>): Promise<SelectPodcast> {
    const [updated] = await db
      .update(podcasts)
      .set(podcast)
      .where(eq(podcasts.id, id))
      .returning();
    
    return updated;
  }

  async deletePodcast(id: number): Promise<void> {
    await db
      .delete(podcasts)
      .where(eq(podcasts.id, id));
  }

  async trackEvent(event: InsertEventTracking): Promise<SelectEventTracking> {
    const [created] = await db
      .insert(eventTracking)
      .values({ ...event, createdAt: Date.now() })
      .returning();
    return created;
  }

  async getEventCounts(eventType: string): Promise<Array<{ eventName: string; count: number }>> {
    const results = await db
      .select({ 
        eventName: eventTracking.eventName, 
        count: count() 
      })
      .from(eventTracking)
      .where(eq(eventTracking.eventType, eventType))
      .groupBy(eventTracking.eventName)
      .orderBy(desc(count()));
    return results;
  }

  async getEventAnalytics(): Promise<EventAnalytics> {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const dayAgo = now - msPerDay;
    const weekAgo = now - 7 * msPerDay;
    const monthAgo = now - 30 * msPerDay;

    const [
      aiToolUsage,
      resourceDownloads,
      contactResults,
      mobileAiToolUsage,
      mobileToolViews,
      mobileAppOpenDay,
      mobileAppOpenWeek,
      mobileAppOpenMonth,
    ] = await Promise.all([
      this.getEventCounts("ai_tool_usage"),
      this.getEventCounts("resource_download"),
      db.select({ count: count() }).from(eventTracking).where(eq(eventTracking.eventType, "contact_form_submission")),
      this.getEventCounts("mobile_ai_tool_usage"),
      this.getEventCounts("mobile_tool_view"),
      db.select({ count: count() }).from(eventTracking).where(and(eq(eventTracking.eventType, "mobile_app_open"), gte(eventTracking.createdAt, dayAgo))),
      db.select({ count: count() }).from(eventTracking).where(and(eq(eventTracking.eventType, "mobile_app_open"), gte(eventTracking.createdAt, weekAgo))),
      db.select({ count: count() }).from(eventTracking).where(and(eq(eventTracking.eventType, "mobile_app_open"), gte(eventTracking.createdAt, monthAgo))),
    ]);
    return {
      aiToolUsage,
      resourceDownloads,
      contactSubmissions: contactResults[0]?.count || 0,
      mobileAiToolUsage,
      mobileToolViews,
      mobileAppOpens: {
        day: mobileAppOpenDay[0]?.count || 0,
        week: mobileAppOpenWeek[0]?.count || 0,
        month: mobileAppOpenMonth[0]?.count || 0,
      },
    };
  }

  async getMobileUsagePerMember(): Promise<MobileUsagePerMember[]> {
    const [mobileRows, webRows] = await Promise.all([
      db
        .select({ memberId: eventTracking.memberId, cnt: count() })
        .from(eventTracking)
        .where(and(isNotNull(eventTracking.memberId), sql`${eventTracking.eventType} LIKE 'mobile_%'`))
        .groupBy(eventTracking.memberId),
      db
        .select({ memberId: eventTracking.memberId, cnt: count() })
        .from(eventTracking)
        .where(and(isNotNull(eventTracking.memberId), sql`${eventTracking.eventType} NOT LIKE 'mobile_%'`))
        .groupBy(eventTracking.memberId),
    ]);
    const mobileMap = new Map(mobileRows.map((r) => [r.memberId as number, r.cnt]));
    const webMap = new Map(webRows.map((r) => [r.memberId as number, r.cnt]));
    const allIds = new Set([...mobileMap.keys(), ...webMap.keys()]);
    return Array.from(allIds).map((memberId) => ({
      memberId,
      mobileEvents: mobileMap.get(memberId) ?? 0,
      webEvents: webMap.get(memberId) ?? 0,
    }));
  }
  async createRoleplaySession(session: InsertRoleplaySession): Promise<SelectRoleplaySession> {
    if (session.memberId == null || session.organizationId == null) {
      throw new Error("Role-play sessions require memberId and organizationId");
    }
    const [created] = await db
      .insert(roleplaySessions)
      .values({ ...session, createdAt: Date.now() })
      .returning();
    return created;
  }

  async getRoleplaySession(id: number): Promise<SelectRoleplaySession | undefined> {
    const [session] = await db.select().from(roleplaySessions).where(eq(roleplaySessions.id, id));
    // Never surface unowned legacy rows through the normal read path.
    if (!session || session.memberId == null || session.organizationId == null) {
      return undefined;
    }
    return session;
  }

  async getRoleplaySessionsForMember(memberId: number): Promise<SelectRoleplaySession[]> {
    return await db
      .select()
      .from(roleplaySessions)
      .where(and(eq(roleplaySessions.memberId, memberId), isNotNull(roleplaySessions.organizationId)))
      .orderBy(desc(roleplaySessions.createdAt));
  }

  /** Platform-admin view: only tenant-owned sessions (excludes pre-tenant legacy). */
  async getOwnedRoleplaySessions(): Promise<SelectRoleplaySession[]> {
    return await db
      .select()
      .from(roleplaySessions)
      .where(and(isNotNull(roleplaySessions.memberId), isNotNull(roleplaySessions.organizationId)))
      .orderBy(desc(roleplaySessions.createdAt));
  }

  async getRoleplayStatsForMember(
    memberId: number,
  ): Promise<Array<{ scenarioId: string; count: number; lastPracticedAt: number | null }>> {
    const rows = await db
      .select({
        scenarioId: roleplaySessions.scenarioId,
        count: count(),
        lastPracticedAt: sql<number | null>`max(${roleplaySessions.createdAt})`,
      })
      .from(roleplaySessions)
      .where(and(eq(roleplaySessions.memberId, memberId), isNotNull(roleplaySessions.organizationId)))
      .groupBy(roleplaySessions.scenarioId);
    return rows.map((r) => ({
      scenarioId: r.scenarioId,
      count: Number(r.count) || 0,
      lastPracticedAt: r.lastPracticedAt ?? null,
    }));
  }

  async updateRoleplaySession(id: number, updates: Partial<{ status: string; feedback: string; rating: number }>): Promise<SelectRoleplaySession> {
    const [updated] = await db
      .update(roleplaySessions)
      .set(updates)
      .where(and(eq(roleplaySessions.id, id), isNotNull(roleplaySessions.memberId)))
      .returning();
    return updated;
  }

  async createRoleplayMessage(message: InsertRoleplayMessage): Promise<SelectRoleplayMessage> {
    const [created] = await db
      .insert(roleplayMessages)
      .values({ ...message, createdAt: Date.now() })
      .returning();
    return created;
  }

  async getRoleplayMessages(sessionId: number): Promise<SelectRoleplayMessage[]> {
    return await db
      .select()
      .from(roleplayMessages)
      .where(eq(roleplayMessages.sessionId, sessionId))
      .orderBy(roleplayMessages.createdAt);
  }

  async createDrillCompletion(completion: InsertDrillCompletion): Promise<SelectDrillCompletion> {
    const [created] = await db
      .insert(drillCompletions)
      .values({ ...completion, completedAt: Date.now() })
      .returning();
    return created;
  }

  async getDrillCompletions(): Promise<SelectDrillCompletion[]> {
    return await db
      .select()
      .from(drillCompletions)
      .orderBy(desc(drillCompletions.completedAt));
  }

  async getDrillCompletionsForMember(memberId: number): Promise<SelectDrillCompletion[]> {
    return await db
      .select()
      .from(drillCompletions)
      .where(eq(drillCompletions.memberId, memberId))
      .orderBy(desc(drillCompletions.completedAt));
  }

  async captureResourceLead(lead: InsertResourceLead): Promise<SelectResourceLead> {
    const [result] = await db.insert(resourceLeads).values(lead).returning();
    return result;
  }

  async getResourceLeads(): Promise<SelectResourceLead[]> {
    return await db.select().from(resourceLeads).orderBy(desc(resourceLeads.capturedAt));
  }

  async isNewResourceLeadEmail(email: string): Promise<boolean> {
    const existing = await db.select({ id: resourceLeads.id }).from(resourceLeads).where(ilike(resourceLeads.email, email.trim())).limit(1);
    return existing.length === 0;
  }

  async trackUsageEvent(event: InsertUsageEvent): Promise<SelectUsageEvent> {
    const [result] = await db.insert(usageEvents).values(event).returning();
    return result;
  }

  async getUsageEvents(): Promise<SelectUsageEvent[]> {
    return await db.select().from(usageEvents).orderBy(desc(usageEvents.createdAt));
  }

  async createSignedAgreement(agreement: InsertSignedAgreement): Promise<SelectSignedAgreement> {
    const [result] = await db.insert(signedAgreements).values(agreement).returning();
    return result;
  }

  async getSignedAgreements(): Promise<SelectSignedAgreement[]> {
    return await db.select().from(signedAgreements).orderBy(desc(signedAgreements.signedAt));
  }

  async createAgreementRequest(request: InsertAgreementRequest, token: string): Promise<SelectAgreementRequest> {
    const [result] = await db.insert(agreementRequests).values({ ...request, token, status: "pending" }).returning();
    return result;
  }

  async getAgreementRequests(): Promise<SelectAgreementRequest[]> {
    return await db.select().from(agreementRequests).orderBy(desc(agreementRequests.sentAt));
  }

  async getAgreementRequestByToken(token: string): Promise<SelectAgreementRequest | undefined> {
    const [result] = await db.select().from(agreementRequests).where(eq(agreementRequests.token, token));
    return result;
  }

  async updateAgreementRequestStatus(id: number, status: string, completedAt?: Date): Promise<SelectAgreementRequest> {
    const updates: any = { status };
    if (completedAt) updates.completedAt = completedAt;
    const [result] = await db.update(agreementRequests).set(updates).where(eq(agreementRequests.id, id)).returning();
    return result;
  }

  async getSignedAgreementsByRequestId(requestId: number): Promise<SelectSignedAgreement[]> {
    return await db.select().from(signedAgreements).where(eq(signedAgreements.requestId, requestId));
  }

  async getSignedAgreementById(id: number): Promise<SelectSignedAgreement | undefined> {
    const [result] = await db.select().from(signedAgreements).where(eq(signedAgreements.id, id));
    return result;
  }

  async updateSignedAgreementPdf(id: number, pdfData: string): Promise<void> {
    await db.update(signedAgreements).set({ pdfData }).where(eq(signedAgreements.id, id));
  }

  async getTestimonials(): Promise<SelectTestimonial[]> {
    return await db.select().from(testimonials).orderBy(testimonials.displayOrder, testimonials.id);
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<SelectTestimonial> {
    const [result] = await db.insert(testimonials).values(testimonial).returning();
    return result;
  }

  async updateTestimonial(id: number, testimonial: Partial<InsertTestimonial>): Promise<SelectTestimonial> {
    const [result] = await db.update(testimonials).set(testimonial).where(eq(testimonials.id, id)).returning();
    return result;
  }

  async deleteTestimonial(id: number): Promise<void> {
    await db.delete(testimonials).where(eq(testimonials.id, id));
  }

  async getCaseStudies(): Promise<SelectCaseStudy[]> {
    return await db.select().from(caseStudies).orderBy(caseStudies.displayOrder, caseStudies.id);
  }

  async createCaseStudy(study: InsertCaseStudy): Promise<SelectCaseStudy> {
    const [result] = await db.insert(caseStudies).values(study).returning();
    return result;
  }

  async updateCaseStudy(id: number, study: Partial<InsertCaseStudy>): Promise<SelectCaseStudy> {
    const [result] = await db.update(caseStudies).set(study).where(eq(caseStudies.id, id)).returning();
    return result;
  }

  async deleteCaseStudy(id: number): Promise<void> {
    await db.delete(caseStudies).where(eq(caseStudies.id, id));
  }

  async createAssessment(assessment: InsertAssessment): Promise<SelectAssessment> {
    const [result] = await db.insert(assessments).values(assessment).returning();
    return result;
  }

  async getAssessments(): Promise<SelectAssessment[]> {
    return await db.select().from(assessments).orderBy(desc(assessments.createdAt));
  }

  async getAssessment(id: number): Promise<SelectAssessment | undefined> {
    const [result] = await db.select().from(assessments).where(eq(assessments.id, id));
    return result;
  }

  async deleteAssessment(id: number): Promise<void> {
    await db.delete(assessmentInvites).where(eq(assessmentInvites.assessmentId, id));
    await db.delete(assessmentQuestions).where(eq(assessmentQuestions.assessmentId, id));
    await db.delete(assessmentSubmissions).where(eq(assessmentSubmissions.assessmentId, id));
    await db.delete(assessments).where(eq(assessments.id, id));
  }

  async createAssessmentQuestion(question: InsertAssessmentQuestion): Promise<SelectAssessmentQuestion> {
    const [result] = await db.insert(assessmentQuestions).values(question).returning();
    return result;
  }

  async getAssessmentQuestions(assessmentId: number): Promise<SelectAssessmentQuestion[]> {
    return await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.assessmentId, assessmentId)).orderBy(assessmentQuestions.displayOrder);
  }

  async deleteAssessmentQuestion(id: number): Promise<void> {
    await db.delete(assessmentQuestions).where(eq(assessmentQuestions.id, id));
  }

  async createAssessmentSubmission(submission: InsertAssessmentSubmission): Promise<SelectAssessmentSubmission> {
    const [result] = await db.insert(assessmentSubmissions).values(submission).returning();
    return result;
  }

  async updateAssessmentSubmission(id: number, updates: Partial<SelectAssessmentSubmission>): Promise<SelectAssessmentSubmission> {
    const [result] = await db.update(assessmentSubmissions).set(updates).where(eq(assessmentSubmissions.id, id)).returning();
    return result;
  }

  async getAssessmentSubmissions(assessmentId: number): Promise<SelectAssessmentSubmission[]> {
    return await db.select().from(assessmentSubmissions).where(eq(assessmentSubmissions.assessmentId, assessmentId)).orderBy(desc(assessmentSubmissions.completedAt));
  }

  async getAssessmentSubmission(id: number): Promise<SelectAssessmentSubmission | undefined> {
    const [result] = await db.select().from(assessmentSubmissions).where(eq(assessmentSubmissions.id, id));
    return result;
  }

  async createAssessmentInvite(invite: InsertAssessmentInvite): Promise<SelectAssessmentInvite> {
    const [result] = await db.insert(assessmentInvites).values(invite).returning();
    return result;
  }

  async getAssessmentInvites(assessmentId: number): Promise<SelectAssessmentInvite[]> {
    return await db.select().from(assessmentInvites).where(eq(assessmentInvites.assessmentId, assessmentId)).orderBy(desc(assessmentInvites.sentAt));
  }

  async getAssessmentInviteByToken(token: string): Promise<SelectAssessmentInvite | undefined> {
    const [result] = await db.select().from(assessmentInvites).where(eq(assessmentInvites.token, token));
    return result;
  }

  async markAssessmentInviteUsed(id: number): Promise<SelectAssessmentInvite> {
    const [result] = await db.update(assessmentInvites).set({ usedAt: new Date() }).where(eq(assessmentInvites.id, id)).returning();
    return result;
  }

  async createAssessmentClient(client: InsertAssessmentClient): Promise<SelectAssessmentClient> {
    const [result] = await db.insert(assessmentClients).values(client).returning();
    return result;
  }

  async getAssessmentClients(): Promise<SelectAssessmentClient[]> {
    return await db.select().from(assessmentClients).orderBy(desc(assessmentClients.createdAt));
  }

  async getAssessmentClientBySlug(slug: string): Promise<SelectAssessmentClient | undefined> {
    const [result] = await db.select().from(assessmentClients).where(eq(assessmentClients.slug, slug));
    return result;
  }

  async deleteAssessmentClient(id: number): Promise<void> {
    await db.delete(assessmentClients).where(eq(assessmentClients.id, id));
  }

  async getSetting(key: string): Promise<string | null> {
    const [result] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return result?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db
      .insert(siteSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      });
  }

  async getAllSettings(): Promise<SelectSiteSetting[]> {
    return await db.select().from(siteSettings);
  }
}

export const storage = new DatabaseStorage();
