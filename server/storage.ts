import { type Inquiry } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  createInquiry(inquiry: Inquiry): Promise<Inquiry & { id: string }>;
  getInquiries(): Promise<Array<Inquiry & { id: string }>>;
}

export class MemStorage implements IStorage {
  private inquiries: Map<string, Inquiry & { id: string }>;

  constructor() {
    this.inquiries = new Map();
  }

  async createInquiry(inquiry: Inquiry): Promise<Inquiry & { id: string }> {
    const id = randomUUID();
    const inquiryWithId = { ...inquiry, id, submittedAt: Date.now() };
    this.inquiries.set(id, inquiryWithId);
    return inquiryWithId;
  }

  async getInquiries(): Promise<Array<Inquiry & { id: string }>> {
    return Array.from(this.inquiries.values());
  }
}

export const storage = new MemStorage();
