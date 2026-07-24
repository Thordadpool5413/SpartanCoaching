import { z } from 'zod';
import OpenAI from 'openai';

declare const criterionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    weight: z.ZodNumber;
}, z.core.$strict>;
declare const inputSchema: z.ZodObject<{
    prompt: z.ZodString;
    response: z.ZodString;
    rubric: z.ZodObject<{
        name: z.ZodString;
        criteria: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodString;
            weight: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>;
    history: z.ZodOptional<z.ZodArray<z.ZodObject<{
        score: z.ZodNumber;
        completedAt: z.ZodString;
        focus: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
declare const outputSchema: z.ZodObject<{
    score: z.ZodNumber;
    criterionScores: z.ZodArray<z.ZodObject<{
        criterionId: z.ZodString;
        score: z.ZodNumber;
        evidence: z.ZodArray<z.ZodString>;
        feedback: z.ZodString;
    }, z.core.$strict>>;
    strengths: z.ZodArray<z.ZodString>;
    improvements: z.ZodArray<z.ZodString>;
    followUpQuestion: z.ZodString;
    personalizedFeedback: z.ZodString;
    practiceAssignment: z.ZodString;
    trend: z.ZodEnum<{
        improving: "improving";
        steady: "steady";
        declining: "declining";
        "insufficient-data": "insufficient-data";
    }>;
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
    prompt: string;
    response: string;
    rubric: {
        name: string;
        criteria: {
            id: string;
            name: string;
            description: string;
            weight: number;
        }[];
    };
    history?: {
        score: number;
        completedAt: string;
        focus?: string | undefined;
    }[] | undefined;
}, context?: RunContext) => Promise<ToolRunResult<{
    score: number;
    criterionScores: {
        criterionId: string;
        score: number;
        evidence: string[];
        feedback: string;
    }[];
    strengths: string[];
    improvements: string[];
    followUpQuestion: string;
    personalizedFeedback: string;
    practiceAssignment: string;
    trend: "improving" | "steady" | "declining" | "insufficient-data";
}>>;
declare const validateInput: (input: unknown) => ReturnType<typeof inputSchema.safeParse>;

export { InMemoryStorage, type OpenAIProviderConfig, OpenAIResponsesProvider, ProviderError, type ProviderOptions, type ProviderResult, type ProviderUsage, type RunContext, type RunQuery, type StorageAdapter, type StoredRun, type ToolDefinition, ToolError, type ToolInput, type ToolOutput, type ToolProvider, type ToolRunResult, createStoredRun, criterionSchema, hashInput, inputSchema, outputSchema, run, tool, validateInput };
