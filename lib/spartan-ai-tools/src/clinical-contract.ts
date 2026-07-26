import { z } from "zod";

export const evidenceCitationSchema = z
  .object({
    source: z.string().min(1),
    documentId: z.string().min(1),
    version: z.string().min(1),
    contentHash: z.string().min(1),
    sourceUrl: z.string().url().optional(),
    locator: z.string().min(1).optional(),
    supportedClaim: z.string().min(1),
  })
  .strict();

export const clinicalConfidenceSchema = z.number().min(0).max(1);

export const clinicalReviewRequiredSchema = z.literal(true);
