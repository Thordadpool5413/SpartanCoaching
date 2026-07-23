import { z } from 'zod';
import OpenAI from 'openai';

declare const planningModeSchema: z.ZodEnum<{
    single: "single";
    daily: "daily";
    weekly: "weekly";
}>;
declare const visitSchema: z.ZodObject<{
    accountName: z.ZodString;
    accountType: z.ZodString;
    contactName: z.ZodOptional<z.ZodString>;
    contactNames: z.ZodOptional<z.ZodArray<z.ZodString>>;
    contactTitle: z.ZodString;
    diseaseFocus: z.ZodString;
    visitObjective: z.ZodString;
    scheduledAt: z.ZodOptional<z.ZodString>;
    durationMinutes: z.ZodOptional<z.ZodNumber>;
    timezone: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    remindersMinutes: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
declare const inputSchema: z.ZodObject<{
    planningMode: z.ZodDefault<z.ZodEnum<{
        single: "single";
        daily: "daily";
        weekly: "weekly";
    }>>;
    accountName: z.ZodOptional<z.ZodString>;
    contactNames: z.ZodOptional<z.ZodArray<z.ZodString>>;
    accountType: z.ZodOptional<z.ZodString>;
    contactTitle: z.ZodOptional<z.ZodString>;
    diseaseFocus: z.ZodOptional<z.ZodString>;
    visitObjective: z.ZodOptional<z.ZodString>;
    scheduledAt: z.ZodOptional<z.ZodString>;
    durationMinutes: z.ZodOptional<z.ZodNumber>;
    timezone: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    remindersMinutes: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    accountContext: z.ZodOptional<z.ZodString>;
    planningPeriod: z.ZodOptional<z.ZodString>;
    visits: z.ZodOptional<z.ZodArray<z.ZodObject<{
        accountName: z.ZodString;
        accountType: z.ZodString;
        contactName: z.ZodOptional<z.ZodString>;
        contactNames: z.ZodOptional<z.ZodArray<z.ZodString>>;
        contactTitle: z.ZodString;
        diseaseFocus: z.ZodString;
        visitObjective: z.ZodString;
        scheduledAt: z.ZodOptional<z.ZodString>;
        durationMinutes: z.ZodOptional<z.ZodNumber>;
        timezone: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        remindersMinutes: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
declare const objectionSchema: z.ZodObject<{
    objection: z.ZodString;
    tellMeMoreProbes: z.ZodArray<z.ZodString>;
    feel: z.ZodString;
    felt: z.ZodString;
    found: z.ZodString;
}, z.core.$strict>;
declare const visitPlanSchema: z.ZodObject<{
    accountName: z.ZodString;
    refinedObjective: z.ZodString;
    discoveryQuestions: z.ZodArray<z.ZodString>;
    likelyObjections: z.ZodArray<z.ZodObject<{
        objection: z.ZodString;
        tellMeMoreProbes: z.ZodArray<z.ZodString>;
        feel: z.ZodString;
        felt: z.ZodString;
        found: z.ZodString;
    }, z.core.$strict>>;
    nextStepPlan: z.ZodString;
    preparationChecklist: z.ZodArray<z.ZodString>;
    qualityScore: z.ZodNumber;
}, z.core.$strict>;
declare const outputSchema: z.ZodObject<{
    refinedObjective: z.ZodString;
    discoveryQuestions: z.ZodArray<z.ZodString>;
    likelyObjections: z.ZodArray<z.ZodObject<{
        objection: z.ZodString;
        tellMeMoreProbes: z.ZodArray<z.ZodString>;
        feel: z.ZodString;
        felt: z.ZodString;
        found: z.ZodString;
    }, z.core.$strict>>;
    nextStepPlan: z.ZodString;
    preparationChecklist: z.ZodArray<z.ZodString>;
    qualityScore: z.ZodNumber;
    visitPlans: z.ZodArray<z.ZodObject<{
        accountName: z.ZodString;
        refinedObjective: z.ZodString;
        discoveryQuestions: z.ZodArray<z.ZodString>;
        likelyObjections: z.ZodArray<z.ZodObject<{
            objection: z.ZodString;
            tellMeMoreProbes: z.ZodArray<z.ZodString>;
            feel: z.ZodString;
            felt: z.ZodString;
            found: z.ZodString;
        }, z.core.$strict>>;
        nextStepPlan: z.ZodString;
        preparationChecklist: z.ZodArray<z.ZodString>;
        qualityScore: z.ZodNumber;
    }, z.core.$strict>>;
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
    planningMode: "single" | "daily" | "weekly";
    accountName?: string | undefined;
    contactNames?: string[] | undefined;
    accountType?: string | undefined;
    contactTitle?: string | undefined;
    diseaseFocus?: string | undefined;
    visitObjective?: string | undefined;
    scheduledAt?: string | undefined;
    durationMinutes?: number | undefined;
    timezone?: string | undefined;
    location?: string | undefined;
    remindersMinutes?: number[] | undefined;
    accountContext?: string | undefined;
    planningPeriod?: string | undefined;
    visits?: {
        accountName: string;
        accountType: string;
        contactTitle: string;
        diseaseFocus: string;
        visitObjective: string;
        contactName?: string | undefined;
        contactNames?: string[] | undefined;
        scheduledAt?: string | undefined;
        durationMinutes?: number | undefined;
        timezone?: string | undefined;
        location?: string | undefined;
        remindersMinutes?: number[] | undefined;
        notes?: string | undefined;
    }[] | undefined;
}, context?: RunContext) => Promise<ToolRunResult<{
    refinedObjective: string;
    discoveryQuestions: string[];
    likelyObjections: {
        objection: string;
        tellMeMoreProbes: string[];
        feel: string;
        felt: string;
        found: string;
    }[];
    nextStepPlan: string;
    preparationChecklist: string[];
    qualityScore: number;
    visitPlans: {
        accountName: string;
        refinedObjective: string;
        discoveryQuestions: string[];
        likelyObjections: {
            objection: string;
            tellMeMoreProbes: string[];
            feel: string;
            felt: string;
            found: string;
        }[];
        nextStepPlan: string;
        preparationChecklist: string[];
        qualityScore: number;
    }[];
}>>;
declare const validateInput: (input: unknown) => ReturnType<typeof inputSchema.safeParse>;

export { InMemoryStorage, type OpenAIProviderConfig, OpenAIResponsesProvider, ProviderError, type ProviderOptions, type ProviderResult, type ProviderUsage, type RunContext, type RunQuery, type StorageAdapter, type StoredRun, type ToolDefinition, ToolError, type ToolInput, type ToolOutput, type ToolProvider, type ToolRunResult, createStoredRun, hashInput, inputSchema, objectionSchema, outputSchema, planningModeSchema, run, tool, validateInput, visitPlanSchema, visitSchema };
