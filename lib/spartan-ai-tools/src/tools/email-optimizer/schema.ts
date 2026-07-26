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
    label: z.string().min(1),
    subject: z.string().min(1).max(160),
    previewText: z.string().min(1).max(200),
    body: z.string().min(1),
    rationale: z.string().min(1),
    callToAction: z.string().min(1),
  })
  .strict();
export const sequenceStepSchema = z
  .object({
    day: z.number().int().min(0).max(60),
    purpose: z.string().min(1),
    subject: z.string().min(1),
    body: z.string().min(1),
  })
  .strict();
export const outputSchema = z
  .object({
    templates: z.array(emailTemplateSchema).min(3).max(3),
    sequence: z.array(sequenceStepSchema).max(6),
    personalizationElements: z.array(z.string().min(1)).max(8),
    simulatedMetrics: z
      .object({
        disclaimer: z.string().min(1),
        relativeRanking: z
          .array(
            z
              .object({
                templateId: z.string(),
                rank: z.number().int().min(1).max(3),
                rationale: z.string(),
              })
              .strict(),
          )
          .length(3),
      })
      .strict(),
    simulationNotice: z.string().min(1),
    complianceReview: z.array(z.string().min(1)).max(6),
  })
  .strict();
export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
