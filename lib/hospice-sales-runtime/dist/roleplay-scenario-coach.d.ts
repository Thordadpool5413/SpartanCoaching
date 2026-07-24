import { z } from 'zod';
import OpenAI from 'openai';

declare const inputSchema: z.ZodObject<{
    scenario: z.ZodString;
    personality: z.ZodEnum<{
        analytical: "analytical";
        skeptical: "skeptical";
        busy: "busy";
        "relationship-focused": "relationship-focused";
        guarded: "guarded";
    }>;
    difficulty: z.ZodEnum<{
        foundational: "foundational";
        intermediate: "intermediate";
        advanced: "advanced";
    }>;
    accountType: z.ZodOptional<z.ZodString>;
    contactRole: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
declare const stageSchema: z.ZodObject<{
    stage: z.ZodString;
    prospectOpening: z.ZodString;
    objective: z.ZodString;
    likelyChallenge: z.ZodString;
    coachingTip: z.ZodString;
}, z.core.$strict>;
declare const outputSchema: z.ZodObject<{
    scenarioSetup: z.ZodString;
    prospectProfile: z.ZodObject<{
        name: z.ZodString;
        role: z.ZodString;
        personality: z.ZodString;
        priorities: z.ZodArray<z.ZodString>;
        concerns: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    conversationFlow: z.ZodArray<z.ZodObject<{
        stage: z.ZodString;
        prospectOpening: z.ZodString;
        objective: z.ZodString;
        likelyChallenge: z.ZodString;
        coachingTip: z.ZodString;
    }, z.core.$strict>>;
    successMetrics: z.ZodArray<z.ZodString>;
    openingLine: z.ZodString;
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
    scenario: string;
    personality: "analytical" | "skeptical" | "busy" | "relationship-focused" | "guarded";
    difficulty: "foundational" | "intermediate" | "advanced";
    accountType?: string | undefined;
    contactRole?: string | undefined;
}, context?: RunContext) => Promise<ToolRunResult<{
    scenarioSetup: string;
    prospectProfile: {
        name: string;
        role: string;
        personality: string;
        priorities: string[];
        concerns: string[];
    };
    conversationFlow: {
        stage: string;
        prospectOpening: string;
        objective: string;
        likelyChallenge: string;
        coachingTip: string;
    }[];
    successMetrics: string[];
    openingLine: string;
}>>;
declare const validateInput: (input: unknown) => ReturnType<typeof inputSchema.safeParse>;

export { InMemoryStorage, type OpenAIProviderConfig, OpenAIResponsesProvider, ProviderError, type ProviderOptions, type ProviderResult, type ProviderUsage, type RunContext, type RunQuery, type StorageAdapter, type StoredRun, type ToolDefinition, ToolError, type ToolInput, type ToolOutput, type ToolProvider, type ToolRunResult, createStoredRun, hashInput, inputSchema, outputSchema, run, stageSchema, tool, validateInput };
