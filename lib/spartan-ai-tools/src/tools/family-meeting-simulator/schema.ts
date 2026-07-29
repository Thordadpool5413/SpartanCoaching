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
    familyMembers: z.array(
      z
        .object({
          role: z.string().min(1),
          perspective: z.string().min(1),
          concern: z.string().min(1),
        })
        .strict(),
    ),
    conversationFlow: z.array(
      z
        .object({
          stage: z.string().min(1),
          prompt: z.string().min(1),
          challenge: z.string().min(1),
          coachingTip: z.string().min(1),
        })
        .strict(),
    ),
    successMetrics: z.array(z.string()),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
