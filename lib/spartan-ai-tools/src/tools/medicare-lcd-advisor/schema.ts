import { z } from "zod";
import {
  clinicalConfidenceSchema,
  clinicalReviewRequiredSchema,
  evidenceCitationSchema,
} from "../../clinical-contract";

export const inputSchema = z
  .object({
    diagnosis: z.string().min(1),
    question: z.string().min(1),
    jurisdiction: z.string().min(1).optional(),
    context: z.string().min(1).optional(),
    evidence: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .strict();

export const outputSchema = z
  .object({
    answer: z.string().min(1),
    admissionCriteria: z.array(z.string()),
    supportingDocumentation: z.array(z.string()),
    declineIndicators: z.array(z.string()),
    medicareRequirements: z.string().min(1),
    jurisdictionNotes: z.string().min(1),
    citations: z.array(evidenceCitationSchema),
    missingEvidence: z.array(z.string()),
    confidence: clinicalConfidenceSchema,
    humanReviewRequired: clinicalReviewRequiredSchema,
    complianceReminder: z.string().min(1),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
