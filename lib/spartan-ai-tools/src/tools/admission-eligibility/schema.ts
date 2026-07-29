import { z } from "zod";
import {
  clinicalConfidenceSchema,
  clinicalReviewRequiredSchema,
  evidenceCitationSchema,
} from "../../clinical-contract";

export const inputSchema = z
  .object({
    diagnosis: z.string().min(1),
    patientCondition: z.string().min(1),
    functionStatus: z.string().min(1),
    comorbidities: z.array(z.string()),
    recentHospitalizations: z.string().min(1),
    jurisdiction: z.string().min(1).optional(),
    criteria: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .strict();

export const outputSchema = z
  .object({
    eligibilityAssessment: z.string().min(1),
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
    missingDocumentation: z.array(z.string()),
    recommendedActions: z.array(z.string()),
    prognosisGuidance: z.string().min(1),
    complianceNotes: z.array(z.string()),
    citations: z.array(evidenceCitationSchema),
    confidence: clinicalConfidenceSchema,
    missingEvidence: z.array(z.string()),
    humanReviewRequired: clinicalReviewRequiredSchema,
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
