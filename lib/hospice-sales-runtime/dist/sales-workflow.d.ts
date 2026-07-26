import { z } from 'zod';
import { Pool } from 'pg';

declare const roleSchema: z.ZodEnum<{
    rep: "rep";
    manager: "manager";
    integration_admin: "integration_admin";
}>;
declare const planStatusSchema: z.ZodEnum<{
    draft: "draft";
    ready: "ready";
    scheduled: "scheduled";
    superseded: "superseded";
    archived: "archived";
}>;
declare const callStatusSchema: z.ZodEnum<{
    scheduled: "scheduled";
    confirmed: "confirmed";
    in_progress: "in_progress";
    completed: "completed";
    canceled: "canceled";
    no_show: "no_show";
}>;
declare const nextActionStatusSchema: z.ZodEnum<{
    scheduled: "scheduled";
    completed: "completed";
    proposed: "proposed";
    accepted: "accepted";
    dismissed: "dismissed";
}>;
declare const syncStatusSchema: z.ZodEnum<{
    queued: "queued";
    running: "running";
    succeeded: "succeeded";
    retryable: "retryable";
    conflicted: "conflicted";
    dead_lettered: "dead_lettered";
}>;
declare const artifactStatusSchema: z.ZodEnum<{
    draft: "draft";
    superseded: "superseded";
    rep_approved: "rep_approved";
    manager_reviewed: "manager_reviewed";
}>;
declare const calendarProviderSchema: z.ZodEnum<{
    google: "google";
    outlook: "outlook";
}>;
declare const integrationProviderSchema: z.ZodEnum<{
    google: "google";
    outlook: "outlook";
    csv: "csv";
    reference_crm: "reference_crm";
}>;
declare const actorSchema: z.ZodObject<{
    organizationId: z.ZodString;
    userId: z.ZodString;
    role: z.ZodEnum<{
        rep: "rep";
        manager: "manager";
        integration_admin: "integration_admin";
    }>;
    teamIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    territoryIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
declare const contactInputSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    firstName: z.ZodString;
    lastName: z.ZodDefault<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    isPrimary: z.ZodDefault<z.ZodBoolean>;
    externalId: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
declare const accountInputSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    accountType: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    territoryId: z.ZodOptional<z.ZodString>;
    ownerUserId: z.ZodString;
    externalId: z.ZodOptional<z.ZodString>;
    contacts: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        firstName: z.ZodString;
        lastName: z.ZodDefault<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        isPrimary: z.ZodDefault<z.ZodBoolean>;
        externalId: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
declare const scheduleSchema: z.ZodObject<{
    startsAt: z.ZodString;
    durationMinutes: z.ZodNumber;
    timezone: z.ZodString;
    location: z.ZodOptional<z.ZodString>;
    recurrenceRule: z.ZodOptional<z.ZodString>;
    remindersMinutes: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    calendarProvider: z.ZodOptional<z.ZodEnum<{
        google: "google";
        outlook: "outlook";
    }>>;
}, z.core.$strict>;
declare const startCycleInputSchema: z.ZodObject<{
    account: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        accountType: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        territoryId: z.ZodOptional<z.ZodString>;
        ownerUserId: z.ZodString;
        externalId: z.ZodOptional<z.ZodString>;
        contacts: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            firstName: z.ZodString;
            lastName: z.ZodDefault<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            isPrimary: z.ZodDefault<z.ZodBoolean>;
            externalId: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
    contactIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    purpose: z.ZodString;
    diseaseFocus: z.ZodOptional<z.ZodString>;
    schedule: z.ZodObject<{
        startsAt: z.ZodString;
        durationMinutes: z.ZodNumber;
        timezone: z.ZodString;
        location: z.ZodOptional<z.ZodString>;
        recurrenceRule: z.ZodOptional<z.ZodString>;
        remindersMinutes: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
        calendarProvider: z.ZodOptional<z.ZodEnum<{
            google: "google";
            outlook: "outlook";
        }>>;
    }, z.core.$strict>;
}, z.core.$strict>;
declare const completeCallInputSchema: z.ZodObject<{
    callId: z.ZodString;
    expectedVersion: z.ZodNumber;
    outcome: z.ZodEnum<{
        canceled: "canceled";
        no_show: "no_show";
        advanced: "advanced";
        follow_up: "follow_up";
        not_interested: "not_interested";
        reschedule: "reschedule";
    }>;
    notes: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    transcript: z.ZodOptional<z.ZodString>;
    consentConfirmed: z.ZodBoolean;
    commitments: z.ZodDefault<z.ZodArray<z.ZodString>>;
    referralSignals: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
declare const nextCallInputSchema: z.ZodObject<{
    cycleId: z.ZodString;
    expectedVersion: z.ZodNumber;
    nextActionId: z.ZodOptional<z.ZodString>;
    schedule: z.ZodObject<{
        startsAt: z.ZodString;
        durationMinutes: z.ZodNumber;
        timezone: z.ZodString;
        location: z.ZodOptional<z.ZodString>;
        recurrenceRule: z.ZodOptional<z.ZodString>;
        remindersMinutes: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
        calendarProvider: z.ZodOptional<z.ZodEnum<{
            google: "google";
            outlook: "outlook";
        }>>;
    }, z.core.$strict>;
    purpose: z.ZodString;
    contactIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
interface VersionedEntity {
    id: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
    version: number;
    deletedAt?: string;
}
interface Account extends VersionedEntity {
    name: string;
    accountType?: string;
    address?: string;
    territoryId?: string;
    ownerUserId: string;
    externalId?: string;
}
interface Contact extends VersionedEntity {
    accountId: string;
    firstName: string;
    lastName: string;
    title?: string;
    email?: string;
    phone?: string;
    isPrimary: boolean;
    externalId?: string;
}
interface AccountSnapshot {
    account: Account;
    contacts: Contact[];
    recentActivities: Activity[];
    capturedAt: string;
    sourceIds: string[];
}
interface SalesCycle extends VersionedEntity {
    accountId: string;
    ownerUserId: string;
    purpose: string;
    diseaseFocus?: string;
    status: "active" | "completed" | "archived";
}
interface CallPlan extends VersionedEntity {
    cycleId: string;
    callId: string;
    status: z.infer<typeof planStatusSchema>;
    content?: unknown;
    artifact?: AiArtifact;
}
interface SalesCall extends VersionedEntity {
    cycleId: string;
    accountId: string;
    ownerUserId: string;
    contactIds: string[];
    purpose: string;
    schedule: z.infer<typeof scheduleSchema>;
    status: z.infer<typeof callStatusSchema>;
    calendarEventId?: string;
}
interface CallOutcome extends VersionedEntity {
    callId: string;
    outcome: z.infer<typeof completeCallInputSchema>["outcome"];
    notes?: string;
    summary?: string;
    encryptedTranscript?: string;
    consentConfirmed: boolean;
    commitments: string[];
    referralSignals: string[];
}
interface Activity extends VersionedEntity {
    accountId: string;
    cycleId?: string;
    type: string;
    summary: string;
    occurredAt: string;
    actorUserId: string;
}
interface AiArtifact {
    status: z.infer<typeof artifactStatusSchema>;
    toolId: string;
    promptVersion: string;
    schemaVersion: string;
    model?: string;
    responseId?: string;
    contextCapturedAt: string;
    sources: string[];
    warnings: string[];
    usage?: {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
    };
    output: unknown;
}
interface CoachingSession extends VersionedEntity {
    callId: string;
    status: z.infer<typeof artifactStatusSchema>;
    performance?: AiArtifact;
    coaching?: AiArtifact;
    approvedBy?: string;
    approvedAt?: string;
}
interface NextAction extends VersionedEntity {
    cycleId: string;
    cycleVersion: number;
    callId: string;
    type: "task" | "email" | "next_call";
    status: z.infer<typeof nextActionStatusSchema>;
    title: string;
    dueAt?: string;
    sourceCoachingId?: string;
}
interface EmailDraft extends VersionedEntity {
    cycleId: string;
    callId: string;
    nextActionId: string;
    status: z.infer<typeof artifactStatusSchema>;
    toContactIds: string[];
    subject?: string;
    body?: string;
    artifact: AiArtifact;
    simulatedAbResult: true;
}
interface RoleplaySession extends VersionedEntity {
    cycleId: string;
    planId: string;
    ownerUserId: string;
    scenario: unknown;
    messages: Array<{
        role: "learner" | "prospect";
        content: string;
    }>;
    turn: number;
    latestCoaching?: unknown;
    complete: boolean;
}
interface ImportJob extends VersionedEntity {
    actorUserId: string;
    status: "committed" | "rolled_back";
    insertedAccountIds: string[];
    imported: number;
    merged: number;
    rejected: number;
    rollbackTokenHash: string;
    rollbackExpiresAt: string;
}
interface CalendarEvent extends VersionedEntity {
    callId: string;
    provider?: z.infer<typeof calendarProviderSchema>;
    externalId?: string;
    etag?: string;
    syncRevision: number;
    contentHash?: string;
    deletedExternallyAt?: string;
}
interface SyncJob extends VersionedEntity {
    kind: "calendar" | "crm";
    aggregateId: string;
    status: z.infer<typeof syncStatusSchema>;
    attempts: number;
    availableAt: string;
    idempotencyKey: string;
    errorCode?: string;
}
interface SyncCursor extends VersionedEntity {
    provider: string;
    connectionId: string;
    cursor?: string;
    lastPulledAt?: string;
    lastErrorCode?: string;
}
interface SyncConflict extends VersionedEntity {
    kind: "calendar" | "crm";
    provider: string;
    aggregateId?: string;
    externalId: string;
    status: "pending" | "keep_local" | "accept_external" | "merged" | "dismissed";
    reason: "external_changed" | "external_deleted" | "unlinked_external" | "version_mismatch";
    localVersion?: number;
    externalVersion?: string;
    detectedAt: string;
    localPayload?: Record<string, unknown>;
    externalPayload?: Record<string, unknown>;
}
interface DomainEvent {
    id: string;
    organizationId: string;
    type: string;
    aggregateId: string;
    occurredAt: string;
    payload: Record<string, unknown>;
    publishedAt?: string;
}
interface AuditEvent {
    id: string;
    organizationId: string;
    actorUserId: string;
    action: string;
    aggregateId?: string;
    occurredAt: string;
    metadata: Record<string, unknown>;
}
type Actor = z.infer<typeof actorSchema>;
type StartCycleInput = z.infer<typeof startCycleInputSchema>;
type CompleteCallInput = z.infer<typeof completeCallInputSchema>;
type NextCallInput = z.infer<typeof nextCallInputSchema>;

interface ToolResult<T> {
    output: T;
    metadata?: {
        model?: string;
        responseId?: string;
        usage?: {
            inputTokens?: number;
            outputTokens?: number;
            totalTokens?: number;
        };
    };
}
interface ToolRunner<I = unknown, O = unknown> {
    run(input: I, context?: {
        userId?: string;
        requestId?: string;
    }): Promise<ToolResult<O> | O>;
}
interface WorkflowTools {
    planner: ToolRunner;
    discovery: ToolRunner;
    objection: ToolRunner;
    callPerformance: ToolRunner;
    coaching: ToolRunner;
    roleplayScenario?: ToolRunner;
    adaptiveRoleplay?: ToolRunner;
    email?: ToolRunner;
}
interface EntityTable {
    account: Account;
    contact: Contact;
    cycle: SalesCycle;
    call: SalesCall;
    plan: CallPlan;
    outcome: CallOutcome;
    activity: Activity;
    coaching: CoachingSession;
    nextAction: NextAction;
    emailDraft: EmailDraft;
    roleplaySession: RoleplaySession;
    importJob: ImportJob;
    calendarEvent: CalendarEvent;
    syncJob: SyncJob;
    syncCursor: SyncCursor;
    syncConflict: SyncConflict;
}
type EntityKind = keyof EntityTable;
interface WorkflowTransaction {
    get<K extends EntityKind>(kind: K, id: string): Promise<EntityTable[K] | undefined>;
    list<K extends EntityKind>(kind: K, predicate?: (value: EntityTable[K]) => boolean): Promise<EntityTable[K][]>;
    insert<K extends EntityKind>(kind: K, value: EntityTable[K]): Promise<void>;
    update<K extends EntityKind>(kind: K, value: EntityTable[K], expectedVersion: number): Promise<void>;
    appendEvent(event: DomainEvent): Promise<void>;
    appendAudit(event: AuditEvent): Promise<void>;
}
interface WorkflowStorage {
    transact<T>(organizationId: string, operation: (tx: WorkflowTransaction) => Promise<T>): Promise<T>;
    snapshot(accountId: string, actor: Actor, activityLimit?: number): Promise<AccountSnapshot>;
    today(actor: Actor, from: string, to: string): Promise<{
        calls: SalesCall[];
        plans: CallPlan[];
        actions: NextAction[];
        syncJobs: SyncJob[];
    }>;
}
interface QueueAdapter {
    enqueue(event: DomainEvent): Promise<void>;
}
interface Clock {
    now(): Date;
}
interface EncryptionAdapter {
    encrypt(plaintext: string, purpose: string): Promise<string>;
    decrypt(ciphertext: string, purpose: string): Promise<string>;
}
interface NotificationAdapter {
    notify(userId: string, message: {
        title: string;
        body: string;
        href?: string;
    }): Promise<void>;
}
interface AuthorizationAdapter {
    assert(actor: Actor, action: string, resource?: {
        organizationId: string;
        ownerUserId?: string;
    }): Promise<void> | void;
}
interface RateLimitAdapter {
    consume(organizationId: string, userId: string, operation: string): Promise<void>;
}
interface CalendarConnection {
    authorizationUrl: string;
    state: string;
}
interface CalendarChange {
    externalId: string;
    etag?: string;
    deleted: boolean;
    updatedAt: string;
    payload?: CalendarUpsert;
}
interface CalendarUpsert {
    title: string;
    description?: string;
    startsAt: string;
    durationMinutes: number;
    timezone: string;
    location?: string;
    remindersMinutes: number[];
    recurrenceRule?: string;
    originId: string;
    syncRevision: number;
}
interface CalendarAdapter {
    connect(input: {
        redirectUri: string;
        state: string;
        scopes?: string[];
    }): Promise<CalendarConnection>;
    listChanges(input: {
        connectionId: string;
        cursor?: string;
        windowStart?: string;
        windowEnd?: string;
    }): Promise<{
        changes: CalendarChange[];
        cursor?: string;
    }>;
    upsertEvent(input: {
        connectionId: string;
        event: CalendarUpsert;
        externalId?: string;
        expectedEtag?: string;
    }): Promise<{
        externalId: string;
        etag?: string;
    }>;
    deleteEvent(input: {
        connectionId: string;
        externalId: string;
        expectedEtag?: string;
    }): Promise<void>;
    renewSubscription(input: {
        connectionId: string;
        callbackUrl: string;
    }): Promise<{
        expiresAt: string;
    }>;
    disconnect(connectionId: string): Promise<void>;
}
interface CrmRecord {
    object: "account" | "contact" | "activity";
    externalId: string;
    version?: string;
    fields: Record<string, unknown>;
    deleted?: boolean;
}
interface CrmAdapter {
    testConnection(): Promise<{
        ok: boolean;
        message?: string;
    }>;
    getCapabilities(): Promise<{
        pull: boolean;
        push: boolean;
        webhooks: boolean;
        objects: string[];
    }>;
    pullChanges(cursor?: string): Promise<{
        records: CrmRecord[];
        cursor?: string;
    }>;
    pushChanges(records: CrmRecord[], idempotencyKey: string): Promise<{
        accepted: string[];
        conflicts: Array<{
            externalId: string;
            reason: string;
        }>;
    }>;
    resolveExternalRecord(object: CrmRecord["object"], externalId: string): Promise<CrmRecord | undefined>;
}
interface ImportPreview {
    headers: string[];
    rows: Record<string, string>[];
    warnings: string[];
    formulaCells: Array<{
        row: number;
        column: string;
    }>;
}
interface ImportAdapter {
    preview(content: string): Promise<ImportPreview>;
    validate(preview: ImportPreview, mapping: Record<string, string>): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    commit(preview: ImportPreview, mapping: Record<string, string>, actor: Actor, dryRun?: boolean): Promise<{
        imported: number;
        merged: number;
        rejected: number;
        rollbackToken?: string;
    }>;
    rollback(rollbackToken: string, actor: Actor): Promise<{
        rolledBack: number;
    }>;
    exportErrors(errors: string[]): Promise<string>;
}

declare class WorkflowError extends Error {
    readonly code: string;
    readonly status: number;
    readonly details?: Record<string, unknown> | undefined;
    constructor(code: string, status: number, message: string, details?: Record<string, unknown> | undefined);
}
declare class DefaultAuthorization implements AuthorizationAdapter {
    assert(actor: Actor, action: string, resource?: {
        organizationId: string;
        ownerUserId?: string;
    }): void;
}
declare class AesGcmEncryption implements EncryptionAdapter {
    private readonly key;
    constructor(key: Buffer | string);
    encrypt(plaintext: string, purpose: string): Promise<string>;
    decrypt(ciphertext: string, purpose: string): Promise<string>;
}
declare function sanitizeExternalText(value: string, max?: number): string;
declare function safeLogMetadata(value: {
    organizationId?: string;
    userId?: string;
    requestId?: string;
    operation: string;
    durationMs?: number;
    errorCode?: string;
}): Record<string, unknown>;
declare function csvSafe(value: string): string;

declare class InMemoryWorkflowStorage implements WorkflowStorage {
    private readonly tables;
    private transactionTail;
    readonly events: DomainEvent[];
    readonly audits: AuditEvent[];
    transact<T>(organizationId: string, operation: (tx: WorkflowTransaction) => Promise<T>): Promise<T>;
    snapshot(accountId: string, actor: Actor, activityLimit?: number): Promise<AccountSnapshot>;
    today(actor: Actor, from: string, to: string): Promise<{
        calls: SalesCall[];
        plans: CallPlan[];
        actions: NextAction[];
        syncJobs: SyncJob[];
    }>;
}
declare class PostgresWorkflowStorage implements WorkflowStorage {
    private readonly pool;
    constructor(pool: Pool);
    transact<T>(organizationId: string, operation: (tx: WorkflowTransaction) => Promise<T>): Promise<T>;
    snapshot(accountId: string, actor: Actor, activityLimit?: number): Promise<AccountSnapshot>;
    today(actor: Actor, from: string, to: string): Promise<{
        calls: SalesCall[];
        plans: CallPlan[];
        actions: NextAction[];
        syncJobs: SyncJob[];
    }>;
}
declare const newId: () => string;

interface WorkflowDependencies {
    storage: WorkflowStorage;
    tools: WorkflowTools;
    queue?: QueueAdapter;
    encryption?: EncryptionAdapter;
    authorization?: AuthorizationAdapter;
    rateLimit?: RateLimitAdapter;
    notifications?: NotificationAdapter;
    clock?: Clock;
    promptVersion?: string;
    schemaVersion?: string;
    crmSyncEnabled?: boolean;
}
declare class SalesWorkflowOrchestrator {
    private readonly deps;
    private readonly auth;
    private readonly clock;
    constructor(deps: WorkflowDependencies);
    private now;
    private base;
    private event;
    private audit;
    private syncJob;
    private artifact;
    startCycle(raw: StartCycleInput, actor: Actor): Promise<{
        cycle: SalesCycle;
        call: SalesCall;
        plan: CallPlan;
    }>;
    buildPlan(planId: string, expectedVersion: number, actor: Actor): Promise<CallPlan>;
    startCall(callId: string, expectedVersion: number, actor: Actor): Promise<SalesCall>;
    startRoleplay(planId: string, expectedVersion: number, actor: Actor): Promise<RoleplaySession>;
    continueRoleplay(sessionId: string, expectedVersion: number, userInput: string, actor: Actor): Promise<RoleplaySession>;
    completeCall(raw: CompleteCallInput, actor: Actor): Promise<{
        call: SalesCall;
        coaching: CoachingSession;
        nextActions: NextAction[];
    }>;
    approveCoaching(coachingId: string, expectedVersion: number, acceptedActionIds: string[], actor: Actor): Promise<{
        coaching: CoachingSession;
        actions: NextAction[];
    }>;
    scheduleNextCall(raw: NextCallInput, actor: Actor): Promise<{
        call: SalesCall;
        plan: CallPlan;
    }>;
    generateEmailDraft(nextActionId: string, expectedVersion: number, actor: Actor): Promise<EmailDraft>;
    getToday(actor: Actor, from: string, to: string): Promise<{
        calls: SalesCall[];
        plans: CallPlan[];
        actions: NextAction[];
        syncJobs: SyncJob[];
    }>;
}

interface CalendarToken {
    accessToken: string;
    accountId: string;
}
interface CalendarTokenStore {
    get(connectionId: string): Promise<CalendarToken>;
    revoke(connectionId: string): Promise<void>;
}
interface HttpTransport {
    request<T>(url: string, init: RequestInit): Promise<{
        status: number;
        headers: Headers;
        data: T;
    }>;
}
declare const fetchTransport: HttpTransport;
declare class GoogleCalendarAdapter implements CalendarAdapter {
    private readonly clientId;
    private readonly tokens;
    private readonly transport;
    constructor(clientId: string, tokens: CalendarTokenStore, transport?: HttpTransport);
    connect(input: {
        redirectUri: string;
        state: string;
        scopes?: string[];
    }): Promise<CalendarConnection>;
    private auth;
    listChanges(input: {
        connectionId: string;
        cursor?: string;
    }): Promise<{
        changes: CalendarChange[];
        cursor: string | undefined;
    }>;
    upsertEvent(input: {
        connectionId: string;
        event: CalendarUpsert;
        externalId?: string;
        expectedEtag?: string;
    }): Promise<{
        externalId: string;
        etag: string | undefined;
    }>;
    deleteEvent(input: {
        connectionId: string;
        externalId: string;
        expectedEtag?: string;
    }): Promise<void>;
    renewSubscription(input: {
        connectionId: string;
        callbackUrl: string;
    }): Promise<{
        expiresAt: string;
    }>;
    disconnect(connectionId: string): Promise<void>;
}
declare class OutlookCalendarAdapter implements CalendarAdapter {
    private readonly clientId;
    private readonly tokens;
    private readonly transport;
    constructor(clientId: string, tokens: CalendarTokenStore, transport?: HttpTransport);
    connect(input: {
        redirectUri: string;
        state: string;
        scopes?: string[];
    }): Promise<CalendarConnection>;
    private auth;
    listChanges(input: {
        connectionId: string;
        cursor?: string;
        windowStart?: string;
        windowEnd?: string;
    }): Promise<{
        changes: CalendarChange[];
        cursor: string | undefined;
    }>;
    upsertEvent(input: {
        connectionId: string;
        event: CalendarUpsert;
        externalId?: string;
        expectedEtag?: string;
    }): Promise<{
        externalId: string;
        etag: string | undefined;
    }>;
    deleteEvent(input: {
        connectionId: string;
        externalId: string;
        expectedEtag?: string;
    }): Promise<void>;
    renewSubscription(input: {
        connectionId: string;
        callbackUrl: string;
    }): Promise<{
        expiresAt: string;
    }>;
    disconnect(connectionId: string): Promise<void>;
}

declare class CsvAccountImportAdapter implements ImportAdapter {
    private readonly storage;
    private readonly maxBytes;
    private readonly maxRows;
    constructor(storage: WorkflowStorage, maxBytes?: number, maxRows?: number);
    preview(content: string): Promise<ImportPreview>;
    private securePreview;
    validate(preview: ImportPreview, mapping: Record<string, string>): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    commit(preview: ImportPreview, mapping: Record<string, string>, actor: Actor, dryRun?: boolean): Promise<{
        imported: number;
        merged: number;
        rejected: number;
        rollbackToken: `${string}-${string}-${string}-${string}-${string}` | undefined;
    }>;
    rollback(rollbackToken: string, actor: Actor): Promise<{
        rolledBack: number;
    }>;
    exportErrors(errors: string[]): Promise<string>;
}
declare class ReferenceCrmAdapter implements CrmAdapter {
    private readonly records;
    private readonly seenKeys;
    testConnection(): Promise<{
        ok: boolean;
        message: string;
    }>;
    getCapabilities(): Promise<{
        pull: boolean;
        push: boolean;
        webhooks: boolean;
        objects: string[];
    }>;
    pullChanges(cursor?: string): Promise<{
        records: CrmRecord[];
        cursor: string;
    }>;
    pushChanges(records: CrmRecord[], idempotencyKey: string): Promise<{
        accepted: string[];
        conflicts: {
            externalId: string;
            reason: string;
        }[];
    }>;
    resolveExternalRecord(_object: CrmRecord["object"], externalId: string): Promise<CrmRecord | undefined>;
}
declare function applyWebsiteWins(local: Record<string, unknown>, external: Record<string, unknown>, fieldMapping: Record<string, string>): Record<string, unknown>;

interface WorkflowApi {
    today(from: string, to: string): Promise<{
        calls: SalesCall[];
        plans: CallPlan[];
        actions: NextAction[];
        syncJobs: SyncJob[];
    }>;
    accounts(): Promise<{
        accounts: Account[];
    }>;
    startCycle(input: unknown): Promise<unknown>;
    buildPlan(planId: string, input: unknown): Promise<CallPlan>;
    startRoleplay(planId: string, input: unknown): Promise<RoleplaySession>;
    continueRoleplay(sessionId: string, input: unknown): Promise<RoleplaySession>;
    completeCall(callId: string, input: unknown): Promise<{
        coaching: {
            id: string;
            version: number;
            coaching?: {
                output?: unknown;
            };
        };
        nextActions: NextAction[];
    }>;
    approveCoaching(coachingId: string, input: unknown): Promise<unknown>;
    scheduleNext(cycleId: string, input: unknown): Promise<unknown>;
    generateEmailDraft(actionId: string, input: unknown): Promise<EmailDraft>;
    previewCsv(content: string): Promise<{
        headers: string[];
        rows: Record<string, string>[];
        warnings: string[];
        formulaCells: Array<{
            row: number;
            column: string;
        }>;
    }>;
    commitCsv(preview: unknown, mapping: Record<string, string>, dryRun?: boolean): Promise<{
        imported: number;
        merged: number;
        rejected: number;
        rollbackToken?: string;
    }>;
    connectCalendar(provider: "google" | "outlook", redirectUri: string): Promise<{
        authorizationUrl: string;
    }>;
}

interface WorkflowHttpClientOptions {
    baseUrl?: string;
    fetch?: typeof globalThis.fetch;
    headers?: () => Record<string, string> | Promise<Record<string, string>>;
}
declare function createWorkflowHttpClient(options?: WorkflowHttpClientOptions): WorkflowApi;

declare const plannerBoundarySchema: z.ZodObject<{
    planningMode: z.ZodLiteral<"single">;
    accountName: z.ZodString;
    contactNames: z.ZodArray<z.ZodString>;
    accountType: z.ZodString;
    contactTitle: z.ZodString;
    diseaseFocus: z.ZodString;
    visitObjective: z.ZodString;
    scheduledAt: z.ZodString;
    durationMinutes: z.ZodNumber;
    timezone: z.ZodString;
    location: z.ZodOptional<z.ZodString>;
    remindersMinutes: z.ZodArray<z.ZodNumber>;
    accountContext: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
declare const discoveryBoundarySchema: z.ZodObject<{
    accountType: z.ZodString;
    diseaseFocus: z.ZodString;
    contactRole: z.ZodString;
    methodology: z.ZodEnum<{
        consultative: "consultative";
        spin: "spin";
        challenger: "challenger";
        "patient-access": "patient-access";
    }>;
}, z.core.$strict>;
declare const objectionBoundarySchema: z.ZodObject<{
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
    difficulty: z.ZodEnum<{
        advanced: "advanced";
        foundational: "foundational";
        intermediate: "intermediate";
    }>;
}, z.core.$strict>;
declare const performanceBoundarySchema: z.ZodObject<{
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
    consentConfirmed: z.ZodBoolean;
}, z.core.$strict>;
declare const coachingBoundarySchema: z.ZodObject<{
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
}, z.core.$strict>;
declare const emailBoundarySchema: z.ZodObject<{
    prospectType: z.ZodString;
    situation: z.ZodString;
    objective: z.ZodString;
    tone: z.ZodEnum<{
        consultative: "consultative";
        warm: "warm";
        concise: "concise";
        educational: "educational";
        direct: "direct";
    }>;
    previousInteraction: z.ZodOptional<z.ZodString>;
    accountHistory: z.ZodOptional<z.ZodArray<z.ZodString>>;
    includeSequence: z.ZodBoolean;
}, z.core.$strict>;
declare const roleplayScenarioBoundarySchema: z.ZodObject<{
    scenario: z.ZodString;
    personality: z.ZodEnum<{
        analytical: "analytical";
        skeptical: "skeptical";
        busy: "busy";
        "relationship-focused": "relationship-focused";
        guarded: "guarded";
    }>;
    difficulty: z.ZodEnum<{
        advanced: "advanced";
        foundational: "foundational";
        intermediate: "intermediate";
    }>;
    accountType: z.ZodOptional<z.ZodString>;
    contactRole: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
declare const roleplayScenarioOutputBoundarySchema: z.ZodObject<{
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
declare const adaptiveRoleplayBoundarySchema: z.ZodObject<{
    stage: z.ZodString;
    userInput: z.ZodString;
    conversationHistory: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            learner: "learner";
            prospect: "prospect";
        }>;
        content: z.ZodString;
    }, z.core.$strict>>;
    scenario: z.ZodObject<{
        scenarioSetup: z.ZodString;
        prospectProfile: z.ZodObject<{
            name: z.ZodString;
            role: z.ZodString;
            personality: z.ZodString;
            priorities: z.ZodArray<z.ZodString>;
            concerns: z.ZodArray<z.ZodString>;
        }, z.core.$strict>;
        successMetrics: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>;
declare const adaptiveRoleplayOutputBoundarySchema: z.ZodObject<{
    prospectResponse: z.ZodString;
    coachingTip: z.ZodString;
    emotionalTone: z.ZodEnum<{
        skeptical: "skeptical";
        open: "open";
        neutral: "neutral";
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
declare function buildPlannerInput(snapshot: AccountSnapshot, call: SalesCall, cycle: SalesCycle, context: string): {
    planningMode: "single";
    accountName: string;
    contactNames: string[];
    accountType: string;
    contactTitle: string;
    diseaseFocus: string;
    visitObjective: string;
    scheduledAt: string;
    durationMinutes: number;
    timezone: string;
    remindersMinutes: number[];
    location?: string | undefined;
    accountContext?: string | undefined;
};
declare function buildDiscoveryInput(snapshot: AccountSnapshot, call: SalesCall, cycle: SalesCycle): {
    accountType: string;
    diseaseFocus: string;
    contactRole: string;
    methodology: "consultative" | "spin" | "challenger" | "patient-access";
};
declare function buildObjectionInput(snapshot: AccountSnapshot, cycle: SalesCycle, plannerOutput: unknown): {
    objectionCategory: "timing" | "cost" | "eligibility" | "service" | "relationship" | "competition" | "other";
    accountType: string;
    diseaseFocus: string;
    difficulty: "advanced" | "foundational" | "intermediate";
    objection?: string | undefined;
};
declare function buildPerformanceInput(call: SalesCall, raw: string, consentConfirmed: boolean, hasPriorCall: boolean): {
    transcript: string;
    context: string;
    callType: "first-call" | "follow-up" | "service-recovery" | "education" | "referral-development";
    consentConfirmed: boolean;
    prospectType?: string | undefined;
};
declare function buildCoachingInput(call: SalesCall, performance: unknown): {
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
};
declare function buildEmailInput(snapshot: AccountSnapshot, call: SalesCall, objective: string): {
    prospectType: string;
    situation: string;
    objective: string;
    tone: "consultative" | "warm" | "concise" | "educational" | "direct";
    includeSequence: boolean;
    previousInteraction?: string | undefined;
    accountHistory?: string[] | undefined;
};
declare function buildRoleplayScenarioInput(snapshot: AccountSnapshot, call: SalesCall, planContent: unknown): {
    scenario: string;
    personality: "analytical" | "skeptical" | "busy" | "relationship-focused" | "guarded";
    difficulty: "advanced" | "foundational" | "intermediate";
    accountType?: string | undefined;
    contactRole?: string | undefined;
};
declare function buildAdaptiveRoleplayInput(session: {
    scenario: unknown;
    messages: Array<{
        role: "learner" | "prospect";
        content: string;
    }>;
    turn: number;
}, userInput: string): {
    stage: string;
    userInput: string;
    conversationHistory: {
        role: "learner" | "prospect";
        content: string;
    }[];
    scenario: {
        scenarioSetup: string;
        prospectProfile: {
            name: string;
            role: string;
            personality: string;
            priorities: string[];
            concerns: string[];
        };
        successMetrics: string[];
    };
};

type IdempotencyStatus = "processing" | "completed" | "failed";
interface IdempotencyRecord {
    fingerprint: string;
    state: IdempotencyStatus;
    status?: number;
    body?: unknown;
    expiresAt: string;
}
type IdempotencyClaim = {
    result: "claimed";
} | {
    result: "processing";
} | {
    result: "conflict";
} | {
    result: "replay";
    record: IdempotencyRecord;
};
interface IdempotencyStore {
    claim(organizationId: string, key: string, fingerprint: string, expiresAt: string): Promise<IdempotencyClaim>;
    finish(organizationId: string, key: string, record: Omit<IdempotencyRecord, "expiresAt">): Promise<void>;
}
declare const requestFingerprint: (method: string, path: string, body: unknown) => string;
declare class InMemoryIdempotencyStore implements IdempotencyStore {
    private readonly maxEntries;
    private readonly records;
    constructor(maxEntries?: number);
    private scoped;
    claim(organizationId: string, key: string, fingerprint: string, expiresAt: string): Promise<IdempotencyClaim>;
    finish(organizationId: string, key: string, record: Omit<IdempotencyRecord, "expiresAt">): Promise<void>;
}
declare class PostgresIdempotencyStore implements IdempotencyStore {
    private readonly pool;
    constructor(pool: Pool);
    claim(organizationId: string, key: string, fingerprint: string, expiresAt: string): Promise<IdempotencyClaim>;
    finish(organizationId: string, key: string, record: Omit<IdempotencyRecord, "expiresAt">): Promise<void>;
}

interface OutboxPublishResult {
    processed: number;
    published: number;
    retryable: number;
    deadLettered: number;
}
interface OutboxPublisherOptions {
    maxAttempts?: number;
    baseBackoffMs?: number;
    now?: () => Date;
}
declare class InMemoryOutboxPublisher {
    private readonly storage;
    private readonly queue;
    constructor(storage: InMemoryWorkflowStorage, queue: QueueAdapter);
    publishAvailable(organizationId: string, limit?: number): Promise<OutboxPublishResult>;
}
/**
 * Publishes transactionally-created outbox rows. Consumers must deduplicate by
 * event id because a process can stop after provider acceptance and before the
 * published marker commits.
 */
declare class PostgresOutboxPublisher {
    private readonly pool;
    private readonly queue;
    private readonly maxAttempts;
    private readonly baseBackoffMs;
    private readonly now;
    constructor(pool: Pool, queue: QueueAdapter, options?: OutboxPublisherOptions);
    publishAvailable(organizationId: string, limit?: number): Promise<OutboxPublishResult>;
}

interface ResolvedCalendarConnection {
    adapter: CalendarAdapter;
    connectionId: string;
    enabled?: boolean;
}
interface SyncWorkerDependencies {
    storage: WorkflowStorage;
    resolveCalendar(organizationId: string, provider: "google" | "outlook"): Promise<ResolvedCalendarConnection | undefined> | ResolvedCalendarConnection | undefined;
    resolveCrm(organizationId: string): Promise<CrmAdapter | undefined> | CrmAdapter | undefined;
    now?: () => Date;
    maxAttempts?: number;
    baseBackoffMs?: number;
}
declare class SalesWorkflowSyncWorker {
    private readonly deps;
    private readonly now;
    private readonly maxAttempts;
    private readonly baseBackoffMs;
    constructor(deps: SyncWorkerDependencies);
    processAvailable(organizationId: string, limit?: number): Promise<{
        processed: number;
        succeeded: number;
        conflicted: number;
        failed: number;
    }>;
    processJob(organizationId: string, jobId: string): Promise<SyncJob["status"]>;
    private syncCalendar;
    private syncCrm;
    private finish;
}

interface InboundSyncResult {
    ignored: number;
    conflicts: number;
    cursor?: string;
}
declare class InboundSyncService {
    private readonly storage;
    private readonly now;
    constructor(storage: WorkflowStorage, now?: () => Date);
    pullCalendar(input: {
        organizationId: string;
        provider: "google" | "outlook";
        connectionId: string;
        adapter: CalendarAdapter;
        windowStart?: string;
        windowEnd?: string;
    }): Promise<InboundSyncResult>;
    pullCrm(input: {
        organizationId: string;
        provider: string;
        connectionId: string;
        adapter: CrmAdapter;
    }): Promise<InboundSyncResult>;
    private stageCalendarChange;
    private localCalendarPayload;
    private stageCrmRecord;
    private crmComparable;
    private createConflict;
    private getCursor;
    private saveCursor;
}

export { type Account, type AccountSnapshot, type Activity, type Actor, AesGcmEncryption, type AiArtifact, type AuditEvent, type AuthorizationAdapter, type CalendarAdapter, type CalendarChange, type CalendarConnection, type CalendarEvent, type CalendarToken, type CalendarTokenStore, type CalendarUpsert, type CallOutcome, type CallPlan, type Clock, type CoachingSession, type CompleteCallInput, type Contact, type CrmAdapter, type CrmRecord, CsvAccountImportAdapter, DefaultAuthorization, type DomainEvent, type EmailDraft, type EncryptionAdapter, type EntityKind, type EntityTable, GoogleCalendarAdapter, type HttpTransport, type IdempotencyClaim, type IdempotencyRecord, type IdempotencyStatus, type IdempotencyStore, type ImportAdapter, type ImportJob, type ImportPreview, InMemoryIdempotencyStore, InMemoryOutboxPublisher, InMemoryWorkflowStorage, type InboundSyncResult, InboundSyncService, type NextAction, type NextCallInput, type NotificationAdapter, type OutboxPublishResult, type OutboxPublisherOptions, OutlookCalendarAdapter, PostgresIdempotencyStore, PostgresOutboxPublisher, PostgresWorkflowStorage, type QueueAdapter, type RateLimitAdapter, ReferenceCrmAdapter, type ResolvedCalendarConnection, type RoleplaySession, type SalesCall, type SalesCycle, SalesWorkflowOrchestrator, SalesWorkflowSyncWorker, type StartCycleInput, type SyncConflict, type SyncCursor, type SyncJob, type SyncWorkerDependencies, type ToolResult, type ToolRunner, type VersionedEntity, type WorkflowDependencies, WorkflowError, type WorkflowHttpClientOptions, type WorkflowStorage, type WorkflowTools, type WorkflowTransaction, accountInputSchema, actorSchema, adaptiveRoleplayBoundarySchema, adaptiveRoleplayOutputBoundarySchema, applyWebsiteWins, artifactStatusSchema, buildAdaptiveRoleplayInput, buildCoachingInput, buildDiscoveryInput, buildEmailInput, buildObjectionInput, buildPerformanceInput, buildPlannerInput, buildRoleplayScenarioInput, calendarProviderSchema, callStatusSchema, coachingBoundarySchema, completeCallInputSchema, contactInputSchema, createWorkflowHttpClient, csvSafe, discoveryBoundarySchema, emailBoundarySchema, fetchTransport, integrationProviderSchema, newId, nextActionStatusSchema, nextCallInputSchema, objectionBoundarySchema, performanceBoundarySchema, planStatusSchema, plannerBoundarySchema, requestFingerprint, roleSchema, roleplayScenarioBoundarySchema, roleplayScenarioOutputBoundarySchema, safeLogMetadata, sanitizeExternalText, scheduleSchema, startCycleInputSchema, syncStatusSchema };
