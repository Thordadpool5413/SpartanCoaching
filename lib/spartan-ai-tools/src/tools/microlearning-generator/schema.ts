import { z } from "zod";

export const inputSchema = z
  .object({
    userId: z.string().min(1),
    difficulty: z.string().min(1),
    category: z.string().min(1),
    previousTopics: z.array(z.string()).optional(),
  })
  .strict();

export const outputSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.string().min(1),
    difficulty: z.string().min(1),
    estimatedTime: z.number().finite(),
    category: z.string().min(1),
    content: z.record(z.string(), z.unknown()),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
