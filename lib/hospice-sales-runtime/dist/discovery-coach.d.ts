import { z } from 'zod';
import OpenAI from 'openai';

declare const conversationMessageSchema: z.ZodObject<{
    role: z.ZodEnum<{
        coach: "coach";
        learner: "learner";
        prospect: "prospect";
    }>;
    content: z.ZodString;
    createdAt: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
declare const inputSchema: z.ZodObject<{
    accountType: z.ZodString;
    diseaseFocus: z.ZodString;
    contactRole: z.ZodString;
    methodology: z.ZodDefault<z.ZodEnum<{
        consultative: "consultative";
        spin: "spin";
        challenger: "challenger";
        "patient-access": "patient-access";
    }>>;
    conversationHistory: z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            coach: "coach";
            learner: "learner";
            prospect: "prospect";
        }>;
        content: z.ZodString;
        createdAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    response: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
declare const questionSchema: z.ZodObject<{
    id: z.ZodString;
    question: z.ZodString;
    purpose: z.ZodString;
    coachingTip: z.ZodString;
    competency: z.ZodEnum<{
        rapport: "rapport";
        needs: "needs";
        impact: "impact";
        process: "process";
        "next-step": "next-step";
    }>;
}, z.core.$strict>;
declare const assessmentSchema: z.ZodObject<{
    overallScore: z.ZodNumber;
    listening: z.ZodNumber;
    empathy: z.ZodNumber;
    relevance: z.ZodNumber;
    nextStepClarity: z.ZodNumber;
    evidence: z.ZodArray<z.ZodString>;
    strengths: z.ZodArray<z.ZodString>;
    improvements: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
declare const outputSchema: z.ZodObject<{
    questions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        question: z.ZodString;
        purpose: z.ZodString;
        coachingTip: z.ZodString;
        competency: z.ZodEnum<{
            rapport: "rapport";
            needs: "needs";
            impact: "impact";
            process: "process";
            "next-step": "next-step";
        }>;
    }, z.core.$strict>>;
    followUpQuestion: z.ZodNullable<z.ZodString>;
    assessment: z.ZodNullable<z.ZodObject<{
        overallScore: z.ZodNumber;
        listening: z.ZodNumber;
        empathy: z.ZodNumber;
        relevance: z.ZodNumber;
        nextStepClarity: z.ZodNumber;
        evidence: z.ZodArray<z.ZodString>;
        strengths: z.ZodArray<z.ZodString>;
        improvements: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>;
    feedback: z.ZodNullable<z.ZodString>;
    suggestedNextMove: z.ZodNullable<z.ZodString>;
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
    accountType: string;
    diseaseFocus: string;
    contactRole: string;
    methodology: "consultative" | "spin" | "challenger" | "patient-access";
    conversationHistory?: {
        role: "coach" | "learner" | "prospect";
        content: string;
        createdAt?: string | undefined;
    }[] | undefined;
    response?: string | undefined;
}, context?: RunContext) => Promise<ToolRunResult<{
    questions: {
        id: string;
        question: string;
        purpose: string;
        coachingTip: string;
        competency: "rapport" | "needs" | "impact" | "process" | "next-step";
    }[];
    followUpQuestion: string | null;
    assessment: {
        overallScore: number;
        listening: number;
        empathy: number;
        relevance: number;
        nextStepClarity: number;
        evidence: string[];
        strengths: string[];
        improvements: string[];
    } | null;
    feedback: string | null;
    suggestedNextMove: string | null;
}>>;
declare const validateInput: (input: unknown) => ReturnType<typeof inputSchema.safeParse>;

export { InMemoryStorage, type OpenAIProviderConfig, OpenAIResponsesProvider, ProviderError, type ProviderOptions, type ProviderResult, type ProviderUsage, type RunContext, type RunQuery, type StorageAdapter, type StoredRun, type ToolDefinition, ToolError, type ToolInput, type ToolOutput, type ToolProvider, type ToolRunResult, assessmentSchema, conversationMessageSchema, createStoredRun, hashInput, inputSchema, outputSchema, questionSchema, run, tool, validateInput };
