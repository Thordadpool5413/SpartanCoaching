import { z } from "zod";
import {
  clinicalConfidenceSchema,
  clinicalReviewRequiredSchema,
  evidenceCitationSchema,
} from "../../clinical-contract";

export const inputSchema = z
  .object({
    recordText: z.string().min(1),
    fileMetadata: z.record(z.string(), z.unknown()).optional(),
    records: z.array(z.record(z.string(), z.unknown())).optional(),
    lcdEvidence: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .strict();

export const outputSchema = z
  .object({
    extractedData: z
      .object({
        recordSummary: z.string().min(1),
        functionalStatus: z.string().min(1),
        nutrition: z.string().min(1),
        recentUtilization: z.string().min(1),
      })
      .strict(),
    diagnoses: z.array(
      z
        .object({
          diagnosis: z.string().min(1),
          sourceText: z.string().min(1),
        })
        .strict(),
    ),
    declineMetrics: z.array(
      z
        .object({
          metric: z.string().min(1),
          value: z.string().min(1),
          sourceText: z.string().min(1),
        })
        .strict(),
    ),
    symptomEvidence: z.array(z.object({ finding: z.string(), sourceText: z.string() }).strict()),
    medicationReconciliation: z.array(z.object({ documentedMedication: z.string(), sourceText: z.string(), clinicianQuestion: z.string() }).strict()),
    laboratoryEvidence: z.array(z.object({ finding: z.string(), sourceText: z.string() }).strict()),
    carePlanQuestions: z.array(z.object({ symptomOrNeed: z.string(), documentedEvidence: z.string(), questionForClinician: z.string() }).strict()),
    codingReview: z.array(z.object({ documentedDiagnosis: z.string(), codeInRecord: z.string(), evidence: z.string(), verificationNeeded: z.string() }).strict()),
    criteriaAnalysis: z.array(
      z
        .object({
          criterion: z.string().min(1),
          status: z.enum(["supported", "not_supported", "unclear"]),
          evidence: z.string().min(1),
          rationale: z.string().min(1),
        })
        .strict(),
    ),
    citations: z.array(evidenceCitationSchema),
    confidence: clinicalConfidenceSchema,
    missingInformation: z.array(z.string()),
    missingEvidence: z.array(z.string()),
    humanReviewRequired: clinicalReviewRequiredSchema,
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
