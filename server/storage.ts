import { 
  inquiries, 
  newsletterSubscribers,
  articles,
  visitors,
  users,
  resources,
  podcasts,
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
  type SelectPodcast
} from "@shared/schema";
import { db } from "./db";
import { desc, eq, gte, count } from "drizzle-orm";

// Storage interface for CRUD operations
export interface IStorage {
  // User operations (Replit Auth - blueprint:javascript_log_in_with_replit)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  // Other operations
  createInquiry(inquiry: InsertInquiry): Promise<SelectInquiry>;
  getInquiries(): Promise<SelectInquiry[]>;
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
  getAllPodcasts(): Promise<SelectPodcast[]>;
  getPodcast(id: number): Promise<SelectPodcast | undefined>;
  createPodcast(data: InsertPodcast): Promise<SelectPodcast>;
  deletePodcast(id: number): Promise<void>;
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

  async deletePodcast(id: number): Promise<void> {
    await db
      .delete(podcasts)
      .where(eq(podcasts.id, id));
  }
}

export const storage = new DatabaseStorage();
