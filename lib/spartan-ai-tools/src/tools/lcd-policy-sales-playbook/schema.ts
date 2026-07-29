import { z } from "zod";
import {
  clinicalConfidenceSchema,
  clinicalReviewRequiredSchema,
  evidenceCitationSchema,
} from "../../clinical-contract";

export const inputSchema = z
  .object({
    policyChange: z.record(z.string(), z.unknown()),
    affectedAudiences: z.array(z.string()),
    evidence: z.array(z.record(z.string(), z.unknown())),
  })
  .strict();

export const outputSchema = z
  .object({
    whyItMatters: z
      .object({
        summary: z.string().min(1),
        operationalImpact: z.string().min(1),
        complianceImpact: z.string().min(1),
      })
      .strict(),
    howToPosition: z
      .object({
        coreMessage: z.string().min(1),
        compliantFraming: z.string().min(1),
        languageToAvoid: z.array(z.string()),
      })
      .strict(),
    whatToSay: z
      .object({
        opening: z.string().min(1),
        explanation: z.string().min(1),
        close: z.string().min(1),
      })
      .strict(),
    discoveryQuestions: z.array(
      z
        .object({
          audience: z.string().min(1),
          question: z.string().min(1),
          purpose: z.string().min(1),
        })
        .strict(),
    ),
    objectionHandling: z.array(
      z
        .object({
          objection: z.string().min(1),
          response: z.string().min(1),
          evidenceBoundary: z.string().min(1),
        })
        .strict(),
    ),
    educationalBrief: z
      .object({
        title: z.string().min(1),
        summary: z.string().min(1),
        keyPoints: z.array(z.string()),
      })
      .strict(),
    valueProposition: z
      .object({
        headline: z.string().min(1),
        value: z.string().min(1),
        proofBoundary: z.string().min(1),
      })
      .strict(),
    citations: z.array(evidenceCitationSchema),
    missingEvidence: z.array(z.string()),
    confidence: clinicalConfidenceSchema,
    humanReviewRequired: clinicalReviewRequiredSchema,
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
