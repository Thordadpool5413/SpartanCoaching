import { z } from 'zod';
import OpenAI from 'openai';

declare const roleplayMessageSchema: z.ZodObject<{
    role: z.ZodEnum<{
        learner: "learner";
        prospect: "prospect";
    }>;
    content: z.ZodString;
}, z.core.$strict>;
declare const inputSchema: z.ZodObject<{
    stage: z.ZodString;
    userInput: z.ZodString;
    conversationHistory: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            learner: "learner";
            prospect: "prospect";
        }>;
        content: z.ZodString;
    }, z.core.$strict>>;
    scenario: z.ZodOptional<z.ZodObject<{
        scenarioSetup: z.ZodString;
        prospectProfile: z.ZodObject<{
            name: z.ZodString;
            role: z.ZodString;
            personality: z.ZodString;
            priorities: z.ZodArray<z.ZodString>;
            concerns: z.ZodArray<z.ZodString>;
        }, z.core.$strict>;
        successMetrics: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>;
    speechAnalysis: z.ZodOptional<z.ZodObject<{
        pace: z.ZodOptional<z.ZodNumber>;
        clarity: z.ZodOptional<z.ZodNumber>;
        fillerWordCount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
}, z.core.$strict>;
declare const outputSchema: z.ZodObject<{
    prospectResponse: z.ZodString;
    coachingTip: z.ZodString;
    emotionalTone: z.ZodEnum<{
        open: "open";
        neutral: "neutral";
        skeptical: "skeptical";
        concerned: "concerned";
        frustrated: "frustrated";
        reassured: "reassured";
    }>;
    difficultyAdjustment: z.ZodEnum<{
        easier: "easier";
        same: "same";
        harder: "harder";
    }>;
    evaluation: z.ZodObject<{
        score: z.ZodNumber;
        empathy: z.ZodNumber;
        discovery: z.ZodNumber;
        clarity: z.ZodNumber;
        evidence: z.ZodArray<z.ZodString>;
        nextMove: z.ZodString;
    }, z.core.$strict>;
    sessionComplete: z.ZodBoolean;
}, z.core.$strict>;
type ToolInput = z.infer<typeof inputSchema>;
type ToolOutput = z.infer<typeof outputSchema>;

interface ProviderUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}
interface ProviderResult {
    output: ToolOutput;
    responseId?: string;
    model: string;
    usage?: ProviderUsage;
}
interface ProviderOptions {
    requestId?: string;
    timeoutMs?: number;
    maxSchemaRetries?: number;
    maxOutputTokens?: number;
    safetyIdentifier?: string;
}
interface ToolProvider {
    generate(input: ToolInput, options?: ProviderOptions): Promise<ProviderResult>;
}
interface OpenAIProviderConfig {
    apiKey?: string;
    model?: string;
    timeoutMs?: number;
    reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
    client?: OpenAI;
}
declare class ProviderError extends Error {
    readonly code: string;
    readonly status: number;
    readonly retryable: boolean;
    constructor(code: string, status: number, retryable: boolean, message: string);
}
declare class OpenAIResponsesProvider implements ToolProvider {
    private readonly client;
    private readonly model;
    private readonly timeoutMs;
    private readonly reasoningEffort;
    constructor(config?: OpenAIProviderConfig);
    generate(input: ToolInput, options?: ProviderOptions): Promise<ProviderResult>;
}

interface StoredRun {
    id: string;
    toolId: string;
    userId: string;
    createdAt: string;
    inputHash: string;
    input?: ToolInput;
    output?: ToolOutput;
}
interface RunQuery {
    toolId: string;
    userId: string;
    limit?: number;
    before?: string;
}
interface StorageAdapter {
    save(run: StoredRun): Promise<void>;
    list(query: RunQuery): Promise<StoredRun[]>;
    remove(id: string, toolId: string, userId: string): Promise<boolean>;
}
declare function hashInput(input: ToolInput): string;
declare function createStoredRun(toolId: string, input: ToolInput, output: ToolOutput, userId: string, persistPayloads?: boolean): StoredRun;
declare class InMemoryStorage implements StorageAdapter {
    readonly runs: StoredRun[];
    save(run: StoredRun): Promise<void>;
    list(query: RunQuery): Promise<StoredRun[]>;
    remove(id: string, toolId: string, userId: string): Promise<boolean>;
}

interface RunContext {
    requestId?: string;
    userId?: string;
    timeoutMs?: number;
    maxSchemaRetries?: number;
    maxOutputTokens?: number;
    provider?: ToolProvider;
    storage?: StorageAdapter;
    persistPayloads?: boolean;
    rateLimit?: (toolId: string, userId?: string) => Promise<void>;
    audit?: (event: {
        toolId: string;
        requestId: string;
        ok: boolean;
        durationMs: number;
        errorCode?: string;
        usage?: ProviderUsage;
    }) => void | Promise<void>;
}
interface ToolRunResult<T> {
    output: T;
    metadata: {
        toolId: string;
        requestId: string;
        durationMs: number;
        model?: string;
        responseId?: string;
        usage?: ProviderUsage;
        safetyWarnings: string[];
    };
}
interface ToolDefinition<I, O> {
    id: string;
    name: string;
    validateInput(input: unknown): ReturnType<typeof inputSchema.safeParse>;
    run(input: I, context?: RunContext): Promise<ToolRunResult<O>>;
}
declare class ToolError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(code: string, status: number, message: string, options?: ErrorOptions);
}
declare const tool: ToolDefinition<ToolInput, ToolOutput>;
declare const run: (input: {
    stage: string;
    userInput: string;
    conversationHistory: {
        role: "learner" | "prospect";
        content: string;
    }[];
    scenario?: {
        scenarioSetup: string;
        prospectProfile: {
            name: string;
            role: string;
            personality: string;
            priorities: string[];
            concerns: string[];
        };
        successMetrics: string[];
    } | undefined;
    speechAnalysis?: {
        pace?: number | undefined;
        clarity?: number | undefined;
        fillerWordCount?: number | undefined;
    } | undefined;
}, context?: RunContext) => Promise<ToolRunResult<{
    prospectResponse: string;
    coachingTip: string;
    emotionalTone: "open" | "neutral" | "skeptical" | "concerned" | "frustrated" | "reassured";
    difficultyAdjustment: "easier" | "same" | "harder";
    evaluation: {
        score: number;
        empathy: number;
        discovery: number;
        clarity: number;
        evidence: string[];
        nextMove: string;
    };
    sessionComplete: boolean;
}>>;
declare const validateInput: (input: unknown) => ReturnType<typeof inputSchema.safeParse>;

export { InMemoryStorage, type OpenAIProviderConfig, OpenAIResponsesProvider, ProviderError, type ProviderOptions, type ProviderResult, type ProviderUsage, type RunContext, type RunQuery, type StorageAdapter, type StoredRun, type ToolDefinition, ToolError, type ToolInput, type ToolOutput, type ToolProvider, type ToolRunResult, createStoredRun, hashInput, inputSchema, outputSchema, roleplayMessageSchema, run, tool, validateInput };
