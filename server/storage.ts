import { inquiries, type InsertInquiry, type SelectInquiry } from "@shared/schema";
import { db } from "./db";
import { desc } from "drizzle-orm";

// Storage interface for CRUD operations
export interface IStorage {
  createInquiry(inquiry: InsertInquiry): Promise<SelectInquiry>;
  getInquiries(): Promise<SelectInquiry[]>;
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
}

export const storage = new DatabaseStorage();
