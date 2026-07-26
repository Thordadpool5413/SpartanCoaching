import { z } from "zod";

export const inputSchema = z
  .object({
    title: z.string().min(1),
    content: z.string().min(1),
    allowedCategories: z.array(z.string()),
    allowedTags: z.array(z.string()).optional(),
  })
  .strict();

export const outputSchema = z
  .object({
    category: z.string().min(1),
    tags: z.array(z.string()),
    confidence: z.number().finite(),
    rationale: z.string().min(1),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
