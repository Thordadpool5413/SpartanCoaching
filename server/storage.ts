import { 
  inquiries, 
  newsletterSubscribers,
  type InsertInquiry, 
  type SelectInquiry,
  type InsertNewsletterSubscriber,
  type SelectNewsletterSubscriber
} from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";

// Storage interface for CRUD operations
export interface IStorage {
  createInquiry(inquiry: InsertInquiry): Promise<SelectInquiry>;
  getInquiries(): Promise<SelectInquiry[]>;
  subscribeNewsletter(subscriber: InsertNewsletterSubscriber): Promise<SelectNewsletterSubscriber>;
  getNewsletterSubscribers(): Promise<SelectNewsletterSubscriber[]>;
  unsubscribeNewsletter(email: string): Promise<void>;
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
}

export const storage = new DatabaseStorage();
