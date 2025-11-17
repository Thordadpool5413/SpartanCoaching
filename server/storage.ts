import { 
  inquiries, 
  newsletterSubscribers,
  articles,
  visitors,
  type InsertInquiry, 
  type SelectInquiry,
  type InsertNewsletterSubscriber,
  type SelectNewsletterSubscriber,
  type InsertArticle,
  type SelectArticle,
  type InsertVisitor,
  type SelectVisitor,
  type VisitorAnalytics
} from "@shared/schema";
import { db } from "./db";
import { desc, eq, gte } from "drizzle-orm";

// Storage interface for CRUD operations
export interface IStorage {
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
}

// Database-backed storage implementation
export class DatabaseStorage implements IStorage {
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
      .onConflictDoNothing()
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
    
    const [dayCount, weekCount, monthCount, quarterCount, yearCount] = await Promise.all([
      db.select().from(visitors).where(gte(visitors.visitedAt, dayAgo)),
      db.select().from(visitors).where(gte(visitors.visitedAt, weekAgo)),
      db.select().from(visitors).where(gte(visitors.visitedAt, monthAgo)),
      db.select().from(visitors).where(gte(visitors.visitedAt, quarterAgo)),
      db.select().from(visitors).where(gte(visitors.visitedAt, yearAgo)),
    ]);
    
    return {
      day: dayCount.length,
      week: weekCount.length,
      month: monthCount.length,
      quarter: quarterCount.length,
      year: yearCount.length,
    };
  }
}

export const storage = new DatabaseStorage();
