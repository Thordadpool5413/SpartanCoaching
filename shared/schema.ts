import { z } from "zod";

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
