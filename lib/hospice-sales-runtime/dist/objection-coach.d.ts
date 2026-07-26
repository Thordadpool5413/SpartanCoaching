import { z } from 'zod';
import OpenAI from 'openai';

declare const inputSchema: z.ZodObject<{
    objectionCategory: z.ZodEnum<{
        timing: "timing";
        cost: "cost";
        eligibility: "eligibility";
        service: "service";
        relationship: "relationship";
        competition: "competition";
        other: "other";
    }>;
    objection: z.ZodOptional<z.ZodString>;
    accountType: z.ZodString;
    diseaseFocus: z.ZodString;
    userResponse: z.ZodOptional<z.ZodString>;
    difficulty: z.ZodDefault<z.ZodEnum<{
        foundational: "foundational";
        intermediate: "intermediate";
        advanced: "advanced";
    }>>;
}, z.core.$strict>;
declare const outputSchema: z.ZodObject<{
    objection: z.ZodString;
    underlyingConcern: z.ZodString;
    tellMeMoreProbes: z.ZodArray<z.ZodString>;
    feelFeltFound: z.ZodObject<{
        feel: z.ZodString;
        felt: z.ZodString;
        found: z.ZodString;
        combinedResponse: z.ZodString;
    }, z.core.$strict>;
    nextStep: z.ZodString;
    avoidSaying: z.ZodArray<z.ZodString>;
    analysis: z.ZodNullable<z.ZodObject<{
        scores: z.ZodObject<{
            empathy: z.ZodNumber;
            curiosity: z.ZodNumber;
            clarity: z.ZodNumber;
            nextStep: z.ZodNumber;
            overall: z.ZodNumber;
        }, z.core.$strict>;
        evidence: z.ZodArray<z.ZodString>;
        strengths: z.ZodArray<z.ZodString>;
        improvements: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>;
    insights: z.ZodArray<z.ZodString>;
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
    objectionCategory: "timing" | "cost" | "eligibility" | "service" | "relationship" | "competition" | "other";
    accountType: string;
    diseaseFocus: string;
    difficulty: "foundational" | "intermediate" | "advanced";
    objection?: string | undefined;
    userResponse?: string | undefined;
}, context?: RunContext) => Promise<ToolRunResult<{
    objection: string;
    underlyingConcern: string;
    tellMeMoreProbes: string[];
    feelFeltFound: {
        feel: string;
        felt: string;
        found: string;
        combinedResponse: string;
    };
    nextStep: string;
    avoidSaying: string[];
    analysis: {
        scores: {
            empathy: number;
            curiosity: number;
            clarity: number;
            nextStep: number;
            overall: number;
        };
        evidence: string[];
        strengths: string[];
        improvements: string[];
    } | null;
    insights: string[];
}>>;
declare const validateInput: (input: unknown) => ReturnType<typeof inputSchema.safeParse>;

export { InMemoryStorage, type OpenAIProviderConfig, OpenAIResponsesProvider, ProviderError, type ProviderOptions, type ProviderResult, type ProviderUsage, type RunContext, type RunQuery, type StorageAdapter, type StoredRun, type ToolDefinition, ToolError, type ToolInput, type ToolOutput, type ToolProvider, type ToolRunResult, createStoredRun, hashInput, inputSchema, outputSchema, run, tool, validateInput };
