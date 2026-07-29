import { z } from "zod";

export const evidenceCitationSchema = z
  .object({
    source: z.string().min(1),
    documentId: z.string().min(1),
    version: z.string().min(1),
    contentHash: z.string().min(1),
    sourceUrl: z.string().min(1),
    locator: z.string().min(1),
    supportedClaim: z.string().min(1),
  })
  .strict();

export const clinicalConfidenceSchema = z.number().min(0).max(1);

export const clinicalReviewRequiredSchema = z.literal(true);
