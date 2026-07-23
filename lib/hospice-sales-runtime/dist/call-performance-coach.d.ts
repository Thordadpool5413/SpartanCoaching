import { z } from 'zod';
import OpenAI from 'openai';

declare const inputSchema: z.ZodObject<{
    transcript: z.ZodString;
    context: z.ZodString;
    callType: z.ZodEnum<{
        "first-call": "first-call";
        "follow-up": "follow-up";
        "service-recovery": "service-recovery";
        education: "education";
        "referral-development": "referral-development";
    }>;
    prospectType: z.ZodOptional<z.ZodString>;
    consentConfirmed: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
declare const outputSchema: z.ZodObject<{
    overallScore: z.ZodNumber;
    analysis: z.ZodObject<{
        tone: z.ZodObject<{
            score: z.ZodNumber;
            evidence: z.ZodArray<z.ZodString>;
            coaching: z.ZodString;
        }, z.core.$strict>;
        clarity: z.ZodObject<{
            score: z.ZodNumber;
            evidence: z.ZodArray<z.ZodString>;
            coaching: z.ZodString;
        }, z.core.$strict>;
        discovery: z.ZodObject<{
            score: z.ZodNumber;
            evidence: z.ZodArray<z.ZodString>;
            coaching: z.ZodString;
        }, z.core.$strict>;
        empathy: z.ZodObject<{
            score: z.ZodNumber;
            evidence: z.ZodArray<z.ZodString>;
            coaching: z.ZodString;
        }, z.core.$strict>;
        nextStep: z.ZodObject<{
            score: z.ZodNumber;
            evidence: z.ZodArray<z.ZodString>;
            coaching: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strict>;
    improvements: z.ZodArray<z.ZodString>;
    suggestedResponse: z.ZodString;
    practiceScript: z.ZodString;
    callSummary: z.ZodString;
    complianceFlags: z.ZodArray<z.ZodString>;
    coachingRecommendations: z.ZodArray<z.ZodString>;
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
    transcript: string;
    context: string;
    callType: "first-call" | "follow-up" | "service-recovery" | "education" | "referral-development";
    consentConfirmed: boolean;
    prospectType?: string | undefined;
}, context?: RunContext) => Promise<ToolRunResult<{
    overallScore: number;
    analysis: {
        tone: {
            score: number;
            evidence: string[];
            coaching: string;
        };
        clarity: {
            score: number;
            evidence: string[];
            coaching: string;
        };
        discovery: {
            score: number;
            evidence: string[];
            coaching: string;
        };
        empathy: {
            score: number;
            evidence: string[];
            coaching: string;
        };
        nextStep: {
            score: number;
            evidence: string[];
            coaching: string;
        };
    };
    improvements: string[];
    suggestedResponse: string;
    practiceScript: string;
    callSummary: string;
    complianceFlags: string[];
    coachingRecommendations: string[];
}>>;
declare const validateInput: (input: unknown) => ReturnType<typeof inputSchema.safeParse>;

export { InMemoryStorage, type OpenAIProviderConfig, OpenAIResponsesProvider, ProviderError, type ProviderOptions, type ProviderResult, type ProviderUsage, type RunContext, type RunQuery, type StorageAdapter, type StoredRun, type ToolDefinition, ToolError, type ToolInput, type ToolOutput, type ToolProvider, type ToolRunResult, createStoredRun, hashInput, inputSchema, outputSchema, run, tool, validateInput };
