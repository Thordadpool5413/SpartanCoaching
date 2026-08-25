import { z } from "zod";

export const inputSchema = z
  .object({
    prospectType: z.string().trim().min(1).max(100),
    situation: z.string().trim().min(1).max(2_000),
    objective: z.string().trim().min(1).max(500),
    tone: z.enum(["warm", "concise", "educational", "consultative", "direct"]),
    previousInteraction: z.string().trim().max(2_000).optional(),
    accountHistory: z
      .array(z.string().trim().min(1).max(500))
      .max(20)
      .optional(),
    includeSequence: z.boolean().default(true),
  })
  .strict();

export const emailTemplateSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1).max(80),
    subject: z.string().min(1).max(120),
    body: z.string().min(1).max(1_500),
    rationale: z.string().min(1).max(280),
  })
  .strict();

export const sequenceStepSchema = z
  .object({
    day: z.number().int().min(1).max(30),
    purpose: z.string().min(1).max(120),
    subject: z.string().min(1).max(120),
    body: z.string().min(1).max(900),
  })
  .strict();

export const outputSchema = z
  .object({
    templates: z.array(emailTemplateSchema).length(3),
    sequence: z.array(sequenceStepSchema).max(3),
    coachingNotes: z.array(z.string().min(1).max(240)).max(3),
    complianceReview: z.array(z.string().min(1).max(240)).max(4),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
