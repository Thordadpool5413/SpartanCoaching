import { z } from 'zod';
import OpenAI from 'openai';

declare const inputSchema: z.ZodObject<{
    prospectType: z.ZodString;
    situation: z.ZodString;
    objective: z.ZodString;
    tone: z.ZodEnum<{
        warm: "warm";
        concise: "concise";
        educational: "educational";
        consultative: "consultative";
        direct: "direct";
    }>;
    previousInteraction: z.ZodOptional<z.ZodString>;
    accountHistory: z.ZodOptional<z.ZodArray<z.ZodString>>;
    includeSequence: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
declare const emailTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    subject: z.ZodString;
    previewText: z.ZodString;
    body: z.ZodString;
    rationale: z.ZodString;
    callToAction: z.ZodString;
}, z.core.$strict>;
declare const sequenceStepSchema: z.ZodObject<{
    day: z.ZodNumber;
    purpose: z.ZodString;
    subject: z.ZodString;
    body: z.ZodString;
}, z.core.$strict>;
declare const outputSchema: z.ZodObject<{
    templates: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        subject: z.ZodString;
        previewText: z.ZodString;
        body: z.ZodString;
        rationale: z.ZodString;
        callToAction: z.ZodString;
    }, z.core.$strict>>;
    sequence: z.ZodArray<z.ZodObject<{
        day: z.ZodNumber;
        purpose: z.ZodString;
        subject: z.ZodString;
        body: z.ZodString;
    }, z.core.$strict>>;
    personalizationElements: z.ZodArray<z.ZodString>;
    simulatedMetrics: z.ZodObject<{
        disclaimer: z.ZodString;
        relativeRanking: z.ZodArray<z.ZodObject<{
            templateId: z.ZodString;
            rank: z.ZodNumber;
            rationale: z.ZodString;
        }, z.core.$strict>>;
    }, z.core.$strict>;
    simulationNotice: z.ZodString;
    complianceReview: z.ZodArray<z.ZodString>;
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
    prospectType: string;
    situation: string;
    objective: string;
    tone: "warm" | "concise" | "educational" | "consultative" | "direct";
    includeSequence: boolean;
    previousInteraction?: string | undefined;
    accountHistory?: string[] | undefined;
}, context?: RunContext) => Promise<ToolRunResult<{
    templates: {
        id: string;
        label: string;
        subject: string;
        previewText: string;
        body: string;
        rationale: string;
        callToAction: string;
    }[];
    sequence: {
        day: number;
        purpose: string;
        subject: string;
        body: string;
    }[];
    personalizationElements: string[];
    simulatedMetrics: {
        disclaimer: string;
        relativeRanking: {
            templateId: string;
            rank: number;
            rationale: string;
        }[];
    };
    simulationNotice: string;
    complianceReview: string[];
}>>;
declare const validateInput: (input: unknown) => ReturnType<typeof inputSchema.safeParse>;

export { InMemoryStorage, type OpenAIProviderConfig, OpenAIResponsesProvider, ProviderError, type ProviderOptions, type ProviderResult, type ProviderUsage, type RunContext, type RunQuery, type StorageAdapter, type StoredRun, type ToolDefinition, ToolError, type ToolInput, type ToolOutput, type ToolProvider, type ToolRunResult, createStoredRun, emailTemplateSchema, hashInput, inputSchema, outputSchema, run, sequenceStepSchema, tool, validateInput };
