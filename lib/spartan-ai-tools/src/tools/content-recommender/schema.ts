import { z } from "zod";

export const inputSchema = z
  .object({
    userProfile: z.record(z.string(), z.unknown()),
    contentCatalog: z.array(z.record(z.string(), z.unknown())),
    interactionHistory: z.array(z.record(z.string(), z.unknown())).optional(),
    referenceContent: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const outputSchema = z
  .object({
    recommendations: z.array(
      z
        .object({
          contentId: z.string().min(1),
          title: z.string().min(1),
          reason: z.string().min(1),
          rank: z.number().int().positive(),
        })
        .strict(),
    ),
    reasoning: z.array(z.string()),
    diversityNotes: z.array(z.string()),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
