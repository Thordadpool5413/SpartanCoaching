import { z } from "zod";

export const inputSchema = z
  .object({
    brief: z.string().min(1),
    audience: z.string().min(1),
    format: z.string().min(1),
    tone: z.string().min(1),
    evidence: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .strict();

export const outputSchema = z
  .object({
    title: z.string().min(1),
    content: z.string().min(1),
    keyPoints: z.array(z.string()),
    citations: z.array(z.record(z.string(), z.unknown())),
    reviewNotes: z.array(z.string()),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
