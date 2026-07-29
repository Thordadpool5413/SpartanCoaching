import { z } from "zod";
import {
  clinicalConfidenceSchema,
  clinicalReviewRequiredSchema,
  evidenceCitationSchema,
} from "../../clinical-contract";

export const inputSchema = z
  .object({
    clinicalData: z.record(z.string(), z.unknown()),
    criteria: z.array(z.record(z.string(), z.unknown())),
    documentedEvidence: z.array(z.record(z.string(), z.unknown())),
  })
  .strict();

export const outputSchema = z
  .object({
    gaps: z.array(
      z
        .object({
          criterion: z.string().min(1),
          gap: z.string().min(1),
          evidenceNeeded: z.string().min(1),
          priority: z.enum(["high", "medium", "low"]),
        })
        .strict(),
    ),
    priorityActions: z.array(z.string()),
    questionsForClinicalTeam: z.array(z.string()),
    citations: z.array(evidenceCitationSchema),
    missingEvidence: z.array(z.string()),
    confidence: clinicalConfidenceSchema,
    humanReviewRequired: clinicalReviewRequiredSchema,
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
