import { z } from "zod";

export const inputSchema = z
  .object({
    scenario: z.string().min(1),
    familyDynamics: z.string().min(1),
    culturalBackground: z.string().min(1),
    difficulty: z.string().min(1),
  })
  .strict();

export const outputSchema = z
  .object({
    scenarioSetup: z.string().min(1),
    familyMembers: z.array(z.record(z.string(), z.unknown())),
    conversationFlow: z.array(z.record(z.string(), z.unknown())),
    successMetrics: z.array(z.string()),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
