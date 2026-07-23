// ../sales-workflow/src/schema.ts
import { z } from "zod";
var roleSchema = z.enum(["rep", "manager", "integration_admin"]);
var planStatusSchema = z.enum(["draft", "ready", "scheduled", "superseded", "archived"]);
var callStatusSchema = z.enum(["scheduled", "confirmed", "in_progress", "completed", "canceled", "no_show"]);
var nextActionStatusSchema = z.enum(["proposed", "accepted", "scheduled", "completed", "dismissed"]);
var syncStatusSchema = z.enum(["queued", "running", "succeeded", "retryable", "conflicted", "dead_lettered"]);
var artifactStatusSchema = z.enum(["draft", "rep_approved", "manager_reviewed", "superseded"]);
var calendarProviderSchema = z.enum(["google", "outlook"]);
var integrationProviderSchema = z.enum(["google", "outlook", "csv", "reference_crm"]);
var actorSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  role: roleSchema,
  teamIds: z.array(z.string().uuid()).default([]),
  territoryIds: z.array(z.string().uuid()).default([])
}).strict();
var contactInputSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).default(""),
  title: z.string().trim().max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().max(40).optional(),
  isPrimary: z.boolean().default(false),
  externalId: z.string().max(200).optional()
}).strict();
var accountInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  accountType: z.string().trim().max(100).optional(),
  address: z.string().trim().max(500).optional(),
  territoryId: z.string().uuid().optional(),
  ownerUserId: z.string().uuid(),
  externalId: z.string().max(200).optional(),
  contacts: z.array(contactInputSchema).max(100).default([])
}).strict();
var scheduleSchema = z.object({
  startsAt: z.string().datetime(),
  durationMinutes: z.number().int().min(5).max(480),
  timezone: z.string().trim().min(1).max(80),
  location: z.string().trim().max(500).optional(),
  recurrenceRule: z.string().trim().max(500).optional(),
  remindersMinutes: z.array(z.number().int().min(0).max(40320)).max(5).default([30]),
  calendarProvider: calendarProviderSchema.optional()
}).strict();
var startCycleInputSchema = z.object({
  account: accountInputSchema,
  contactIds: z.array(z.string().uuid()).max(25).default([]),
  purpose: z.string().trim().min(1).max(1e3),
  diseaseFocus: z.string().trim().max(160).optional(),
  schedule: scheduleSchema
}).strict();
var completeCallInputSchema = z.object({
  callId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  outcome: z.enum(["advanced", "follow_up", "not_interested", "reschedule", "no_show", "canceled"]),
  notes: z.string().trim().max(1e4).optional(),
  summary: z.string().trim().max(1e4).optional(),
  transcript: z.string().max(1e5).optional(),
  consentConfirmed: z.boolean(),
  commitments: z.array(z.string().trim().min(1).max(500)).max(25).default([]),
  referralSignals: z.array(z.string().trim().min(1).max(500)).max(25).default([])
}).strict().superRefine((value, context) => {
  if (value.transcript && !value.consentConfirmed) context.addIssue({ code: "custom", path: ["consentConfirmed"], message: "Consent is required before transcript analysis" });
});
var nextCallInputSchema = z.object({
  cycleId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  nextActionId: z.string().uuid().optional(),
  schedule: scheduleSchema,
  purpose: z.string().trim().min(1).max(1e3),
  contactIds: z.array(z.string().uuid()).max(25).default([])
}).strict();

// ../sales-workflow/src/security.ts
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
var WorkflowError = class extends Error {
  constructor(code, status, message, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
  code;
  status;
  details;
};
var DefaultAuthorization = class {
  assert(actor, action, resource) {
    if (resource?.organizationId && resource.organizationId !== actor.organizationId) throw new WorkflowError("FORBIDDEN", 403, "Resource is outside your organization");
    const integrationAction = action.startsWith("integration:");
    if (integrationAction && actor.role !== "integration_admin") throw new WorkflowError("FORBIDDEN", 403, "Integration administrator access is required");
    if (action.startsWith("manager:") && actor.role !== "manager") throw new WorkflowError("FORBIDDEN", 403, "Manager access is required");
    if (resource?.ownerUserId && actor.role === "rep" && resource.ownerUserId !== actor.userId) throw new WorkflowError("FORBIDDEN", 403, "You do not own this workflow");
  }
};
var AesGcmEncryption = class {
  key;
  constructor(key) {
    const raw = typeof key === "string" ? Buffer.from(key, "base64") : key;
    if (raw.length !== 32) throw new Error("Encryption key must be 32 bytes");
    this.key = raw;
  }
  async encrypt(plaintext, purpose) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    cipher.setAAD(Buffer.from(purpose));
    const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
  }
  async decrypt(ciphertext, purpose) {
    const [version, iv, tag, data] = ciphertext.split(".");
    if (version !== "v1" || !iv || !tag || !data) throw new WorkflowError("INVALID_CIPHERTEXT", 400, "Encrypted value is invalid");
    const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(iv, "base64url"));
    decipher.setAAD(Buffer.from(purpose));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  }
};
function sanitizeExternalText(value, max = 1e4) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ").replace(/(?:system|assistant|developer)\s*:/gi, "[external label removed]:").slice(0, max).trim();
}
function safeLogMetadata(value) {
  return {
    operation: value.operation,
    requestId: value.requestId,
    durationMs: value.durationMs,
    errorCode: value.errorCode,
    organizationHash: value.organizationId ? createHash("sha256").update(value.organizationId).digest("hex").slice(0, 16) : void 0,
    userHash: value.userId ? createHash("sha256").update(value.userId).digest("hex").slice(0, 16) : void 0
  };
}
function csvSafe(value) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

// ../sales-workflow/src/storage.ts
import { randomUUID } from "crypto";
var kinds = ["account", "contact", "cycle", "call", "plan", "outcome", "activity", "coaching", "nextAction", "emailDraft", "roleplaySession", "importJob", "calendarEvent", "syncJob", "syncCursor", "syncConflict"];
var clone = (value) => structuredClone(value);
var InMemoryWorkflowStorage = class {
  tables = Object.fromEntries(kinds.map((kind) => [kind, /* @__PURE__ */ new Map()]));
  transactionTail = Promise.resolve();
  events = [];
  audits = [];
  async transact(organizationId, operation) {
    let release;
    const previous = this.transactionTail;
    this.transactionTail = new Promise((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      const staged = Object.fromEntries(kinds.map((kind) => [kind, new Map(this.tables[kind])]));
      const stagedEvents = [...this.events];
      const stagedAudits = [...this.audits];
      const tx = {
        get: async (kind, id) => {
          const value = staged[kind].get(id);
          return value?.organizationId === organizationId && !value.deletedAt ? clone(value) : void 0;
        },
        list: async (kind, predicate) => [...staged[kind].values()].map((value) => clone(value)).filter((value) => value.organizationId === organizationId && !value.deletedAt && (!predicate || predicate(value))),
        insert: async (kind, value) => {
          if (value.organizationId !== organizationId) throw new WorkflowError("TENANT_MISMATCH", 403, "Organization mismatch");
          if (staged[kind].has(value.id)) throw new WorkflowError("DUPLICATE", 409, "Record already exists");
          staged[kind].set(value.id, clone(value));
        },
        update: async (kind, value, expectedVersion) => {
          const current = staged[kind].get(value.id);
          if (!current || current.organizationId !== organizationId) throw new WorkflowError("NOT_FOUND", 404, "Record not found");
          if (current.version !== expectedVersion) throw new WorkflowError("VERSION_CONFLICT", 409, "Record changed; refresh and try again", { currentVersion: current.version });
          staged[kind].set(value.id, clone({ ...value, version: expectedVersion + 1 }));
        },
        appendEvent: async (event) => {
          if (event.organizationId !== organizationId) throw new WorkflowError("TENANT_MISMATCH", 403, "Organization mismatch");
          stagedEvents.push(clone(event));
        },
        appendAudit: async (event) => {
          if (event.organizationId !== organizationId) throw new WorkflowError("TENANT_MISMATCH", 403, "Organization mismatch");
          stagedAudits.push(clone(event));
        }
      };
      const result = await operation(tx);
      for (const kind of kinds) this.tables[kind] = staged[kind];
      this.events.splice(0, this.events.length, ...stagedEvents);
      this.audits.splice(0, this.audits.length, ...stagedAudits);
      return result;
    } finally {
      release();
    }
  }
  async snapshot(accountId, actor, activityLimit = 20) {
    return this.transact(actor.organizationId, async (tx) => {
      const account = await tx.get("account", accountId);
      if (!account) throw new WorkflowError("NOT_FOUND", 404, "Account not found");
      if (actor.role === "rep" && account.ownerUserId !== actor.userId) throw new WorkflowError("FORBIDDEN", 403, "You do not own this account");
      const contacts = await tx.list("contact", (item) => item.accountId === accountId);
      const recentActivities = (await tx.list("activity", (item) => item.accountId === accountId)).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, activityLimit);
      return { account, contacts, recentActivities, capturedAt: (/* @__PURE__ */ new Date()).toISOString(), sourceIds: [account.id, ...contacts.map((item) => item.id), ...recentActivities.map((item) => item.id)] };
    });
  }
  async today(actor, from, to) {
    return this.transact(actor.organizationId, async (tx) => {
      const ownedCalls = actor.role === "rep" ? await tx.list("call", (item) => item.ownerUserId === actor.userId) : await tx.list("call");
      const ownedCallIds = new Set(ownedCalls.map((call) => call.id));
      const ownedCycles = new Set(ownedCalls.map((call) => call.cycleId));
      const calls = ownedCalls.filter((item) => item.schedule.startsAt >= from && item.schedule.startsAt < to).sort((a, b) => a.schedule.startsAt.localeCompare(b.schedule.startsAt));
      return {
        calls,
        plans: await tx.list("plan", (item) => calls.some((call) => call.id === item.callId)),
        actions: await tx.list("nextAction", (item) => !["completed", "dismissed"].includes(item.status) && (actor.role !== "rep" || ownedCycles.has(item.cycleId))),
        syncJobs: await tx.list("syncJob", (item) => item.status !== "succeeded" && (actor.role !== "rep" || ownedCallIds.has(item.aggregateId)))
      };
    });
  }
};
var PostgresWorkflowStorage = class {
  constructor(pool) {
    this.pool = pool;
  }
  pool;
  async transact(organizationId, operation) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.organization_id', $1, true)", [organizationId]);
      const tx = {
        get: async (kind, id) => (await client.query("SELECT data FROM sales_workflow_entities WHERE organization_id=$1 AND kind=$2 AND id=$3 AND deleted_at IS NULL", [organizationId, kind, id])).rows[0]?.data,
        list: async (kind, predicate) => {
          const values = (await client.query("SELECT data FROM sales_workflow_entities WHERE organization_id=$1 AND kind=$2 AND deleted_at IS NULL", [organizationId, kind])).rows.map((row) => row.data);
          return predicate ? values.filter(predicate) : values;
        },
        insert: async (kind, value) => {
          await client.query("INSERT INTO sales_workflow_entities(id,organization_id,kind,version,data) VALUES($1,$2,$3,$4,$5)", [value.id, organizationId, kind, value.version, value]);
        },
        update: async (kind, value, expectedVersion) => {
          const next = { ...value, version: expectedVersion + 1 };
          const result2 = await client.query("UPDATE sales_workflow_entities SET version=version+1,data=$1,deleted_at=$2,updated_at=now() WHERE id=$3 AND organization_id=$4 AND kind=$5 AND version=$6 AND deleted_at IS NULL", [next, next.deletedAt ?? null, value.id, organizationId, kind, expectedVersion]);
          if (result2.rowCount !== 1) throw new WorkflowError("VERSION_CONFLICT", 409, "Record changed; refresh and try again");
        },
        appendEvent: async (event) => {
          await client.query("INSERT INTO sales_workflow_outbox(id,organization_id,event_type,aggregate_id,payload,occurred_at) VALUES($1,$2,$3,$4,$5,$6)", [event.id, organizationId, event.type, event.aggregateId, event.payload, event.occurredAt]);
        },
        appendAudit: async (event) => {
          await client.query("INSERT INTO sales_workflow_audit(id,organization_id,actor_user_id,action,aggregate_id,metadata,occurred_at) VALUES($1,$2,$3,$4,$5,$6,$7)", [event.id, organizationId, event.actorUserId, event.action, event.aggregateId, event.metadata, event.occurredAt]);
        }
      };
      const result = await operation(tx);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async snapshot(accountId, actor, activityLimit = 20) {
    return this.transact(actor.organizationId, async (tx) => {
      const account = await tx.get("account", accountId);
      if (!account) throw new WorkflowError("NOT_FOUND", 404, "Account not found");
      if (actor.role === "rep" && account.ownerUserId !== actor.userId) throw new WorkflowError("FORBIDDEN", 403, "You do not own this account");
      const contacts = await tx.list("contact", (item) => item.accountId === accountId);
      const recentActivities = (await tx.list("activity", (item) => item.accountId === accountId)).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, activityLimit);
      return { account, contacts, recentActivities, capturedAt: (/* @__PURE__ */ new Date()).toISOString(), sourceIds: [account.id, ...contacts.map((x) => x.id), ...recentActivities.map((x) => x.id)] };
    });
  }
  async today(actor, from, to) {
    return this.transact(actor.organizationId, async (tx) => {
      const ownedCalls = actor.role === "rep" ? await tx.list("call", (item) => item.ownerUserId === actor.userId) : await tx.list("call");
      const ownedCallIds = new Set(ownedCalls.map((call) => call.id));
      const ownedCycles = new Set(ownedCalls.map((call) => call.cycleId));
      const calls = ownedCalls.filter((item) => item.schedule.startsAt >= from && item.schedule.startsAt < to);
      return { calls, plans: await tx.list("plan", (item) => calls.some((call) => call.id === item.callId)), actions: await tx.list("nextAction", (item) => !["completed", "dismissed"].includes(item.status) && (actor.role !== "rep" || ownedCycles.has(item.cycleId))), syncJobs: await tx.list("syncJob", (item) => item.status !== "succeeded" && (actor.role !== "rep" || ownedCallIds.has(item.aggregateId))) };
    });
  }
};
var newId = () => randomUUID();

// ../sales-workflow/src/orchestrator.ts
import { createHash as createHash2, randomUUID as randomUUID2 } from "crypto";

// ../sales-workflow/src/tool-contracts.ts
import { z as z2 } from "zod";
var plannerBoundarySchema = z2.object({ planningMode: z2.literal("single"), accountName: z2.string().max(120), contactNames: z2.array(z2.string().min(1).max(120)).max(25), accountType: z2.string().min(1).max(80), contactTitle: z2.string().min(1).max(100), diseaseFocus: z2.string().min(1).max(120), visitObjective: z2.string().min(1).max(500), scheduledAt: z2.string().datetime(), durationMinutes: z2.number().int().min(5).max(480), timezone: z2.string().min(1).max(80), location: z2.string().max(500).optional(), remindersMinutes: z2.array(z2.number().int().min(0).max(40320)).max(5), accountContext: z2.string().max(2e4).optional() }).strict();
var discoveryBoundarySchema = z2.object({ accountType: z2.string().min(1).max(100), diseaseFocus: z2.string().min(1).max(120), contactRole: z2.string().min(1).max(100), methodology: z2.enum(["consultative", "spin", "challenger", "patient-access"]) }).strict();
var objectionBoundarySchema = z2.object({ objectionCategory: z2.enum(["timing", "cost", "eligibility", "service", "relationship", "competition", "other"]), objection: z2.string().max(1e3).optional(), accountType: z2.string().min(1).max(100), diseaseFocus: z2.string().min(1).max(120), difficulty: z2.enum(["foundational", "intermediate", "advanced"]) }).strict();
var performanceBoundarySchema = z2.object({ transcript: z2.string().min(20).max(6e4), context: z2.string().min(1).max(2e3), callType: z2.enum(["first-call", "follow-up", "service-recovery", "education", "referral-development"]), prospectType: z2.string().max(100).optional(), consentConfirmed: z2.boolean() }).strict();
var criterion = z2.object({ id: z2.string().min(1), name: z2.string().min(1), description: z2.string().min(1), weight: z2.number().positive().max(100) }).strict();
var coachingBoundarySchema = z2.object({ prompt: z2.string().min(1).max(4e3), response: z2.string().min(1).max(8e3), rubric: z2.object({ name: z2.string().min(1), criteria: z2.array(criterion).min(1).max(12) }).strict() }).strict();
var emailBoundarySchema = z2.object({ prospectType: z2.string().min(1).max(100), situation: z2.string().min(1).max(2e3), objective: z2.string().min(1).max(500), tone: z2.enum(["warm", "concise", "educational", "consultative", "direct"]), previousInteraction: z2.string().max(2e3).optional(), accountHistory: z2.array(z2.string().min(1).max(500)).max(20).optional(), includeSequence: z2.boolean() }).strict();
var roleplayScenarioBoundarySchema = z2.object({ scenario: z2.string().min(1).max(1e3), personality: z2.enum(["analytical", "skeptical", "busy", "relationship-focused", "guarded"]), difficulty: z2.enum(["foundational", "intermediate", "advanced"]), accountType: z2.string().max(100).optional(), contactRole: z2.string().max(100).optional() }).strict();
var roleplayScenarioOutputBoundarySchema = z2.object({ scenarioSetup: z2.string().min(1), prospectProfile: z2.object({ name: z2.string().min(1), role: z2.string().min(1), personality: z2.string().min(1), priorities: z2.array(z2.string()), concerns: z2.array(z2.string()) }).strict(), conversationFlow: z2.array(z2.object({ stage: z2.string().min(1), prospectOpening: z2.string().min(1), objective: z2.string().min(1), likelyChallenge: z2.string().min(1), coachingTip: z2.string().min(1) }).strict()).min(1), successMetrics: z2.array(z2.string()).min(1), openingLine: z2.string().min(1) }).strict();
var adaptiveRoleplayBoundarySchema = z2.object({ stage: z2.string().min(1).max(120), userInput: z2.string().min(1).max(4e3), conversationHistory: z2.array(z2.object({ role: z2.enum(["learner", "prospect"]), content: z2.string().min(1).max(4e3) }).strict()).max(40), scenario: z2.object({ scenarioSetup: z2.string().min(1), prospectProfile: z2.object({ name: z2.string(), role: z2.string(), personality: z2.string(), priorities: z2.array(z2.string()), concerns: z2.array(z2.string()) }).strict(), successMetrics: z2.array(z2.string()) }).strict() }).strict();
var adaptiveRoleplayOutputBoundarySchema = z2.object({ prospectResponse: z2.string().min(1), coachingTip: z2.string().min(1), emotionalTone: z2.enum(["open", "neutral", "skeptical", "concerned", "frustrated", "reassured"]), difficultyAdjustment: z2.enum(["easier", "same", "harder"]), evaluation: z2.object({ score: z2.number(), empathy: z2.number(), discovery: z2.number(), clarity: z2.number(), evidence: z2.array(z2.string()), nextMove: z2.string() }).strict(), sessionComplete: z2.boolean() }).strict();
var text = (value, fallback, max) => sanitizeExternalText(value?.trim() || fallback, max);
function buildPlannerInput(snapshot, call, cycle, context) {
  const contacts = snapshot.contacts.filter((item) => call.contactIds.includes(item.id));
  return plannerBoundarySchema.parse({ planningMode: "single", accountName: snapshot.account.name, contactNames: contacts.map((item) => `${item.firstName} ${item.lastName}`.trim()), accountType: text(snapshot.account.accountType, "healthcare", 80), contactTitle: text(contacts.map((item) => item.title).filter(Boolean).join(", "), "healthcare contact", 100), diseaseFocus: text(cycle.diseaseFocus, "hospice education", 120), visitObjective: text(call.purpose, "Plan the next conversation", 500), scheduledAt: call.schedule.startsAt, durationMinutes: call.schedule.durationMinutes, timezone: call.schedule.timezone, location: call.schedule.location, remindersMinutes: call.schedule.remindersMinutes, accountContext: context });
}
function buildDiscoveryInput(snapshot, call, cycle) {
  const contacts = snapshot.contacts.filter((item) => call.contactIds.includes(item.id));
  return discoveryBoundarySchema.parse({ accountType: text(snapshot.account.accountType, "healthcare", 100), diseaseFocus: text(cycle.diseaseFocus, "hospice education", 120), contactRole: text(contacts[0]?.title, "healthcare contact", 100), methodology: "patient-access" });
}
function buildObjectionInput(snapshot, cycle, plannerOutput) {
  const likely = plannerOutput?.likelyObjections?.[0]?.objection;
  return objectionBoundarySchema.parse({ objectionCategory: "other", objection: likely ? text(likely, "", 1e3) : void 0, accountType: text(snapshot.account.accountType, "healthcare", 100), diseaseFocus: text(cycle.diseaseFocus, "hospice education", 120), difficulty: "intermediate" });
}
function buildPerformanceInput(call, raw, consentConfirmed, hasPriorCall) {
  const transcript = text(`Call outcome context. ${raw}`, "Call completed without a detailed transcript.", 6e4);
  return performanceBoundarySchema.parse({ transcript: transcript.length >= 20 ? transcript : transcript.padEnd(20, "."), context: text(call.purpose, "Hospice referral development", 2e3), callType: hasPriorCall ? "follow-up" : "first-call", prospectType: void 0, consentConfirmed });
}
function buildCoachingInput(call, performance) {
  return coachingBoundarySchema.parse({ prompt: text(`Coach this hospice sales call toward: ${call.purpose}`, "Coach this hospice sales call", 4e3), response: text(JSON.stringify(performance), "No performance details were returned", 8e3), rubric: { name: "Hospice sales call", criteria: [{ id: "discovery", name: "Discovery", description: "Uncovers useful needs", weight: 35 }, { id: "empathy", name: "Empathy", description: "Responds with empathy", weight: 35 }, { id: "next-step", name: "Next step", description: "Secures a clear next step", weight: 30 }] } });
}
function buildEmailInput(snapshot, call, objective) {
  return emailBoundarySchema.parse({ prospectType: text(snapshot.contacts.find((item) => call.contactIds.includes(item.id))?.title, "healthcare contact", 100), situation: text(`Follow-up after: ${call.purpose}`, "Hospice referral-development follow-up", 2e3), objective: text(objective, "Confirm the next step", 500), tone: "consultative", previousInteraction: text(snapshot.recentActivities[0]?.summary, "Previous hospice sales conversation", 2e3), accountHistory: snapshot.recentActivities.slice(0, 20).map((item) => text(item.summary, "Account activity", 500)), includeSequence: true });
}
function buildRoleplayScenarioInput(snapshot, call, planContent) {
  const contact = snapshot.contacts.find((item) => call.contactIds.includes(item.id));
  return roleplayScenarioBoundarySchema.parse({ scenario: text(`Practice the planned conversation: ${call.purpose}. Preparation: ${JSON.stringify(planContent)}`, call.purpose, 1e3), personality: "guarded", difficulty: "intermediate", accountType: text(snapshot.account.accountType, "healthcare", 100), contactRole: text(contact?.title, "healthcare contact", 100) });
}
function buildAdaptiveRoleplayInput(session, userInput) {
  const scenario = roleplayScenarioOutputBoundarySchema.parse(session.scenario);
  const stage = scenario.conversationFlow[Math.min(session.turn, scenario.conversationFlow.length - 1)]?.stage ?? "conversation";
  return adaptiveRoleplayBoundarySchema.parse({ stage, userInput: text(userInput, "Continue the conversation", 4e3), conversationHistory: [...session.messages, { role: "learner", content: text(userInput, "Continue the conversation", 4e3) }].slice(-40), scenario: { scenarioSetup: scenario.scenarioSetup, prospectProfile: scenario.prospectProfile, successMetrics: scenario.successMetrics } });
}

// ../sales-workflow/src/orchestrator.ts
var unwrap = (value) => typeof value === "object" && value !== null && "output" in value ? value : { output: value };
var hash = (value) => createHash2("sha256").update(JSON.stringify(value)).digest("hex");
var SalesWorkflowOrchestrator = class {
  constructor(deps) {
    this.deps = deps;
    this.auth = deps.authorization ?? new DefaultAuthorization();
    this.clock = deps.clock ?? { now: () => /* @__PURE__ */ new Date() };
  }
  deps;
  auth;
  clock;
  now() {
    return this.clock.now().toISOString();
  }
  base(actor) {
    const now = this.now();
    return { id: randomUUID2(), organizationId: actor.organizationId, createdAt: now, updatedAt: now, version: 1 };
  }
  event(actor, type, aggregateId, payload = {}) {
    return { id: randomUUID2(), organizationId: actor.organizationId, type, aggregateId, occurredAt: this.now(), payload };
  }
  audit(actor, action, aggregateId, metadata = {}) {
    return { id: randomUUID2(), organizationId: actor.organizationId, actorUserId: actor.userId, action, aggregateId, occurredAt: this.now(), metadata };
  }
  syncJob(actor, kind, aggregateId, key) {
    return { ...this.base(actor), kind, aggregateId, status: "queued", attempts: 0, availableAt: this.now(), idempotencyKey: key };
  }
  artifact(toolId, result, capturedAt, sources, warnings = []) {
    return { status: "draft", toolId, promptVersion: this.deps.promptVersion ?? "workflow-v1", schemaVersion: this.deps.schemaVersion ?? "1", model: result.metadata?.model, responseId: result.metadata?.responseId, usage: result.metadata?.usage, contextCapturedAt: capturedAt, sources, warnings, output: result.output };
  }
  async startCycle(raw, actor) {
    const input = startCycleInputSchema.parse(raw);
    await this.auth.assert(actor, "cycle:create", { organizationId: actor.organizationId, ownerUserId: input.account.ownerUserId });
    const result = await this.deps.storage.transact(actor.organizationId, async (tx) => {
      const named = input.account.id ? [] : await tx.list("account", (item) => item.name.toLocaleLowerCase() === input.account.name.toLocaleLowerCase() && !item.deletedAt);
      const existing = input.account.id ? await tx.get("account", input.account.id) : named[0];
      if (input.account.id && !existing) throw new WorkflowError("NOT_FOUND", 404, "Selected account was not found");
      if (existing) await this.auth.assert(actor, "account:use", existing);
      const account = existing ?? { ...this.base(actor), name: input.account.name, accountType: input.account.accountType, address: input.account.address, territoryId: input.account.territoryId, ownerUserId: input.account.ownerUserId, externalId: input.account.externalId };
      if (!existing) await tx.insert("account", account);
      const contacts = [];
      const existingContacts = await tx.list("contact", (item) => item.accountId === account.id);
      for (const item of input.account.contacts) {
        const duplicate = existingContacts.find((current) => item.externalId && current.externalId === item.externalId || item.email && current.email?.toLocaleLowerCase() === item.email.toLocaleLowerCase() || current.firstName.toLocaleLowerCase() === item.firstName.toLocaleLowerCase() && current.lastName.toLocaleLowerCase() === item.lastName.toLocaleLowerCase());
        if (duplicate) {
          contacts.push(duplicate);
          continue;
        }
        const contact = { ...this.base(actor), ...item.id ? { id: item.id } : {}, accountId: account.id, firstName: item.firstName, lastName: item.lastName, title: item.title, email: item.email, phone: item.phone, isPrimary: item.isPrimary, externalId: item.externalId };
        await tx.insert("contact", contact);
        contacts.push(contact);
        existingContacts.push(contact);
      }
      if (input.contactIds.length) {
        const selected = await Promise.all(input.contactIds.map((id) => tx.get("contact", id)));
        if (selected.some((item) => !item || item.accountId !== account.id)) throw new WorkflowError("INVALID_CONTACT", 400, "Every selected contact must belong to the selected account");
      }
      const cycle = { ...this.base(actor), accountId: account.id, ownerUserId: input.account.ownerUserId, purpose: input.purpose, diseaseFocus: input.diseaseFocus, status: "active" };
      const call = { ...this.base(actor), cycleId: cycle.id, accountId: account.id, ownerUserId: input.account.ownerUserId, contactIds: input.contactIds.length ? input.contactIds : contacts.filter((item) => item.isPrimary).map((item) => item.id), purpose: input.purpose, schedule: input.schedule, status: "scheduled" };
      const plan = { ...this.base(actor), cycleId: cycle.id, callId: call.id, status: "draft" };
      await tx.insert("cycle", cycle);
      await tx.insert("call", call);
      await tx.insert("plan", plan);
      const calendarJob = call.schedule.calendarProvider ? this.syncJob(actor, "calendar", call.id, `calendar:schedule:${call.id}:1`) : void 0;
      const crmJob = this.deps.crmSyncEnabled ? this.syncJob(actor, "crm", call.id, `crm:schedule:${call.id}:1`) : void 0;
      if (calendarJob) await tx.insert("syncJob", calendarJob);
      if (crmJob) await tx.insert("syncJob", crmJob);
      await tx.appendEvent(this.event(actor, "call.plan.created", plan.id, { cycleId: cycle.id, callId: call.id }));
      if (calendarJob) await tx.appendEvent(this.event(actor, "calendar.sync.requested", call.id, { syncJobId: calendarJob.id }));
      if (crmJob) await tx.appendEvent(this.event(actor, "crm.sync.requested", call.id, { syncJobId: crmJob.id }));
      await tx.appendAudit(this.audit(actor, "cycle.created", cycle.id));
      return { cycle, call, plan };
    });
    return result;
  }
  async buildPlan(planId, expectedVersion, actor) {
    await this.deps.rateLimit?.consume(actor.organizationId, actor.userId, "workflow:build-plan");
    const context = await this.deps.storage.transact(actor.organizationId, async (tx) => {
      const plan = await tx.get("plan", planId);
      if (!plan) throw new WorkflowError("NOT_FOUND", 404, "Plan not found");
      const call = await tx.get("call", plan.callId);
      const cycle = await tx.get("cycle", plan.cycleId);
      if (!call || !cycle) throw new WorkflowError("BROKEN_WORKFLOW", 500, "Plan workflow is incomplete");
      await this.auth.assert(actor, "plan:build", call);
      return { plan, call, cycle };
    });
    if (context.plan.version !== expectedVersion) throw new WorkflowError("VERSION_CONFLICT", 409, "Plan changed; refresh and try again");
    const snapshot = await this.deps.storage.snapshot(context.call.accountId, actor);
    const externalContext = sanitizeExternalText(JSON.stringify({ account: snapshot.account, contacts: snapshot.contacts.filter((item) => context.call.contactIds.includes(item.id)), activities: snapshot.recentActivities }), 2e4);
    const planner = unwrap(await this.deps.tools.planner.run(buildPlannerInput(snapshot, context.call, context.cycle, externalContext), { userId: actor.userId }));
    const discovery = unwrap(await this.deps.tools.discovery.run(buildDiscoveryInput(snapshot, context.call, context.cycle), { userId: actor.userId }));
    const objection = unwrap(await this.deps.tools.objection.run(buildObjectionInput(snapshot, context.cycle, planner.output), { userId: actor.userId }));
    const output = { planner: planner.output, discovery: discovery.output, objection: objection.output };
    return this.deps.storage.transact(actor.organizationId, async (tx) => {
      const current = await tx.get("plan", planId);
      if (!current) throw new WorkflowError("NOT_FOUND", 404, "Plan not found");
      const updated = { ...current, status: "ready", updatedAt: this.now(), content: output, artifact: this.artifact("pre-call-workflow", { output, metadata: planner.metadata }, snapshot.capturedAt, snapshot.sourceIds) };
      await tx.update("plan", updated, expectedVersion);
      await tx.appendEvent(this.event(actor, "call.plan.ready", planId, { callId: current.callId }));
      await tx.appendAudit(this.audit(actor, "plan.generated", planId, { contextHash: hash(snapshot.sourceIds) }));
      return { ...updated, version: expectedVersion + 1 };
    });
  }
  async startCall(callId, expectedVersion, actor) {
    return this.deps.storage.transact(actor.organizationId, async (tx) => {
      const call = await tx.get("call", callId);
      if (!call) throw new WorkflowError("NOT_FOUND", 404, "Call not found");
      await this.auth.assert(actor, "call:start", call);
      if (!["scheduled", "confirmed"].includes(call.status)) throw new WorkflowError("INVALID_STATE", 409, "Only a scheduled or confirmed call can start");
      const updated = { ...call, status: "in_progress", updatedAt: this.now() };
      await tx.update("call", updated, expectedVersion);
      await tx.appendAudit(this.audit(actor, "call.started", callId));
      return { ...updated, version: expectedVersion + 1 };
    });
  }
  async startRoleplay(planId, expectedVersion, actor) {
    if (!this.deps.tools.roleplayScenario || !this.deps.tools.adaptiveRoleplay) throw new WorkflowError("ROLEPLAY_DISABLED", 404, "Roleplay tools are not configured");
    const context = await this.deps.storage.transact(actor.organizationId, async (tx) => {
      const plan = await tx.get("plan", planId);
      if (!plan) throw new WorkflowError("NOT_FOUND", 404, "Plan not found");
      if (plan.version !== expectedVersion) throw new WorkflowError("VERSION_CONFLICT", 409, "Plan changed; refresh and try again");
      if (plan.status !== "ready") throw new WorkflowError("PLAN_NOT_READY", 409, "Build the pre-call plan before starting roleplay");
      const call = await tx.get("call", plan.callId);
      if (!call) throw new WorkflowError("BROKEN_WORKFLOW", 500, "Call is missing");
      await this.auth.assert(actor, "roleplay:start", call);
      return { plan, call };
    });
    const snapshot = await this.deps.storage.snapshot(context.call.accountId, actor);
    const result = unwrap(await this.deps.tools.roleplayScenario.run(buildRoleplayScenarioInput(snapshot, context.call, context.plan.content), { userId: actor.userId }));
    const scenario = roleplayScenarioOutputBoundarySchema.parse(result.output);
    return this.deps.storage.transact(actor.organizationId, async (tx) => {
      const session = { ...this.base(actor), cycleId: context.call.cycleId, planId: context.plan.id, ownerUserId: context.call.ownerUserId, scenario, messages: [{ role: "prospect", content: scenario.openingLine }], turn: 0, complete: false };
      await tx.insert("roleplaySession", session);
      await tx.appendAudit(this.audit(actor, "roleplay.started", session.id, { planId }));
      return session;
    });
  }
  async continueRoleplay(sessionId, expectedVersion, userInput, actor) {
    if (!this.deps.tools.adaptiveRoleplay) throw new WorkflowError("ROLEPLAY_DISABLED", 404, "Adaptive roleplay is not configured");
    const session = await this.deps.storage.transact(actor.organizationId, async (tx) => {
      const value = await tx.get("roleplaySession", sessionId);
      if (!value) throw new WorkflowError("NOT_FOUND", 404, "Roleplay session not found");
      await this.auth.assert(actor, "roleplay:continue", value);
      if (value.version !== expectedVersion) throw new WorkflowError("VERSION_CONFLICT", 409, "Roleplay changed; refresh and try again");
      if (value.complete) throw new WorkflowError("ROLEPLAY_COMPLETE", 409, "This roleplay is complete");
      return value;
    });
    const input = buildAdaptiveRoleplayInput(session, userInput);
    const result = unwrap(await this.deps.tools.adaptiveRoleplay.run(input, { userId: actor.userId }));
    const coaching = adaptiveRoleplayOutputBoundarySchema.parse(result.output);
    return this.deps.storage.transact(actor.organizationId, async (tx) => {
      const current = await tx.get("roleplaySession", sessionId);
      if (!current) throw new WorkflowError("NOT_FOUND", 404, "Roleplay session not found");
      const updated = { ...current, messages: [...input.conversationHistory, { role: "prospect", content: coaching.prospectResponse }], turn: current.turn + 1, latestCoaching: coaching, complete: coaching.sessionComplete, updatedAt: this.now() };
      await tx.update("roleplaySession", updated, expectedVersion);
      await tx.appendAudit(this.audit(actor, "roleplay.turn.completed", sessionId, { turn: updated.turn, complete: updated.complete }));
      return { ...updated, version: expectedVersion + 1 };
    });
  }
  async completeCall(raw, actor) {
    const input = completeCallInputSchema.parse(raw);
    const existing = await this.deps.storage.transact(actor.organizationId, async (tx) => {
      const call = await tx.get("call", input.callId);
      if (!call) throw new WorkflowError("NOT_FOUND", 404, "Call not found");
      await this.auth.assert(actor, "call:complete", call);
      return call;
    });
    const terminal = input.outcome === "no_show" ? "no_show" : input.outcome === "canceled" ? "canceled" : "completed";
    const encryptedTranscript = input.transcript ? this.deps.encryption ? await this.deps.encryption.encrypt(input.transcript, `transcript:${input.callId}`) : void 0 : void 0;
    if (input.transcript && !this.deps.encryption) throw new WorkflowError("ENCRYPTION_REQUIRED", 503, "Transcript storage requires encryption");
    const committed = await this.deps.storage.transact(actor.organizationId, async (tx) => {
      const call = await tx.get("call", input.callId);
      if (!call) throw new WorkflowError("NOT_FOUND", 404, "Call not found");
      if (!["scheduled", "confirmed", "in_progress"].includes(call.status)) throw new WorkflowError("INVALID_STATE", 409, "Call is already closed");
      const updated = { ...call, status: terminal, updatedAt: this.now() };
      await tx.update("call", updated, input.expectedVersion);
      const outcome = { ...this.base(actor), callId: call.id, outcome: input.outcome, notes: input.notes, summary: input.summary, encryptedTranscript, consentConfirmed: input.consentConfirmed, commitments: input.commitments, referralSignals: input.referralSignals };
      await tx.insert("outcome", outcome);
      await tx.insert("activity", { ...this.base(actor), accountId: call.accountId, cycleId: call.cycleId, type: "call_completed", summary: input.summary ?? `Call marked ${terminal}`, occurredAt: this.now(), actorUserId: actor.userId });
      const calendarJob = call.schedule.calendarProvider ? this.syncJob(actor, "calendar", call.id, `calendar:complete:${call.id}:${input.expectedVersion}`) : void 0;
      const crmJob = this.deps.crmSyncEnabled ? this.syncJob(actor, "crm", call.id, `crm:complete:${call.id}:${input.expectedVersion}`) : void 0;
      if (calendarJob) await tx.insert("syncJob", calendarJob);
      if (crmJob) await tx.insert("syncJob", crmJob);
      await tx.appendEvent(this.event(actor, "call.completed", call.id, { outcomeId: outcome.id, status: terminal }));
      if (calendarJob) await tx.appendEvent(this.event(actor, "calendar.sync.requested", call.id, { syncJobId: calendarJob.id }));
      if (crmJob) await tx.appendEvent(this.event(actor, "crm.sync.requested", call.id, { syncJobId: crmJob.id }));
      await tx.appendAudit(this.audit(actor, "call.completed", call.id, { consentConfirmed: input.consentConfirmed, transcriptPresent: Boolean(input.transcript) }));
      return { call: { ...updated, version: input.expectedVersion + 1 }, outcome };
    });
    const analysisText = input.transcript ?? input.summary ?? input.notes ?? `Call outcome: ${input.outcome}`;
    const beforeSnapshot = await this.deps.storage.snapshot(existing.accountId, actor);
    const hasPriorCall = beforeSnapshot.recentActivities.filter((item) => item.type === "call_completed").length > 1;
    let performance;
    let coachingResult;
    let aiWarnings = [];
    if (["no_show", "canceled"].includes(input.outcome)) {
      performance = { output: { analysisSkipped: true, reason: input.outcome } };
      coachingResult = { output: { improvements: [input.outcome === "no_show" ? "Reschedule the missed conversation" : "Confirm whether a new conversation is appropriate"] } };
      aiWarnings = ["AI analysis was skipped because no completed conversation occurred"];
    } else {
      try {
        performance = unwrap(await this.deps.tools.callPerformance.run(buildPerformanceInput(existing, analysisText, input.consentConfirmed, hasPriorCall), { userId: actor.userId }));
        coachingResult = unwrap(await this.deps.tools.coaching.run(buildCoachingInput(existing, performance.output), { userId: actor.userId }));
      } catch {
        performance = { output: { analysisUnavailable: true } };
        coachingResult = { output: { improvements: ["Review the call manually and confirm the next step"] } };
        aiWarnings = ["AI coaching was unavailable; the completed call remains saved and requires manual review"];
      }
    }
    const snapshot = await this.deps.storage.snapshot(existing.accountId, actor);
    const final = await this.deps.storage.transact(actor.organizationId, async (tx) => {
      const coaching = { ...this.base(actor), callId: existing.id, status: "draft", performance: this.artifact("call-performance-coach", performance, snapshot.capturedAt, snapshot.sourceIds, aiWarnings), coaching: this.artifact("coaching-feedback", coachingResult, snapshot.capturedAt, snapshot.sourceIds, aiWarnings) };
      await tx.insert("coaching", coaching);
      const cycle = await tx.get("cycle", existing.cycleId);
      if (!cycle) throw new WorkflowError("BROKEN_WORKFLOW", 500, "Sales cycle is missing");
      const output = coachingResult.output;
      const suggestions = Array.isArray(output.improvements) ? output.improvements.slice(0, 3).map(String) : ["Review coaching and choose the next step"];
      const nextActions = suggestions.map((title, index) => ({ ...this.base(actor), cycleId: existing.cycleId, cycleVersion: cycle.version, callId: existing.id, type: index === 0 ? "next_call" : index === 1 ? "email" : "task", status: "proposed", title, sourceCoachingId: coaching.id }));
      for (const action of nextActions) await tx.insert("nextAction", action);
      await tx.appendEvent(this.event(actor, "coaching.generated", coaching.id, { callId: existing.id, nextActionIds: nextActions.map((item) => item.id) }));
      await tx.appendAudit(this.audit(actor, "coaching.generated", coaching.id));
      return { coaching, nextActions };
    });
    return { call: committed.call, ...final };
  }
  async approveCoaching(coachingId, expectedVersion, acceptedActionIds, actor) {
    return this.deps.storage.transact(actor.organizationId, async (tx) => {
      const coaching = await tx.get("coaching", coachingId);
      if (!coaching) throw new WorkflowError("NOT_FOUND", 404, "Coaching not found");
      const call = await tx.get("call", coaching.callId);
      if (!call) throw new WorkflowError("NOT_FOUND", 404, "Call not found");
      await this.auth.assert(actor, "coaching:approve", call);
      const updated = { ...coaching, status: "rep_approved", approvedBy: actor.userId, approvedAt: this.now(), updatedAt: this.now() };
      await tx.update("coaching", updated, expectedVersion);
      const actions = await tx.list("nextAction", (item) => item.sourceCoachingId === coachingId);
      const accepted = [];
      for (const action of actions) {
        const status = acceptedActionIds.includes(action.id) ? "accepted" : "dismissed";
        const next = { ...action, status, updatedAt: this.now() };
        await tx.update("nextAction", next, action.version);
        if (status === "accepted") accepted.push({ ...next, version: action.version + 1 });
      }
      await tx.appendEvent(this.event(actor, "coaching.approved", coachingId, { acceptedActionIds }));
      await tx.appendAudit(this.audit(actor, "coaching.approved", coachingId));
      return { coaching: { ...updated, version: expectedVersion + 1 }, actions: accepted };
    });
  }
  async scheduleNextCall(raw, actor) {
    const input = nextCallInputSchema.parse(raw);
    const result = await this.deps.storage.transact(actor.organizationId, async (tx) => {
      const cycle = await tx.get("cycle", input.cycleId);
      if (!cycle) throw new WorkflowError("NOT_FOUND", 404, "Sales cycle not found");
      await this.auth.assert(actor, "call:schedule-next", cycle);
      if (cycle.version !== input.expectedVersion) throw new WorkflowError("VERSION_CONFLICT", 409, "Sales cycle changed; refresh and try again");
      const account = await tx.get("account", cycle.accountId);
      if (!account) throw new WorkflowError("NOT_FOUND", 404, "Account not found");
      const call = { ...this.base(actor), cycleId: cycle.id, accountId: account.id, ownerUserId: cycle.ownerUserId, contactIds: input.contactIds, purpose: input.purpose, schedule: input.schedule, status: "scheduled" };
      const plan = { ...this.base(actor), cycleId: cycle.id, callId: call.id, status: "draft" };
      await tx.insert("call", call);
      await tx.insert("plan", plan);
      if (input.nextActionId) {
        const action = await tx.get("nextAction", input.nextActionId);
        if (!action || action.cycleId !== cycle.id) throw new WorkflowError("NOT_FOUND", 404, "Next action not found");
        await tx.update("nextAction", { ...action, status: "scheduled", dueAt: input.schedule.startsAt, updatedAt: this.now() }, action.version);
      }
      const calendarJob = call.schedule.calendarProvider ? this.syncJob(actor, "calendar", call.id, `calendar:schedule:${call.id}:1`) : void 0;
      const crmJob = this.deps.crmSyncEnabled ? this.syncJob(actor, "crm", call.id, `crm:schedule:${call.id}:1`) : void 0;
      if (calendarJob) await tx.insert("syncJob", calendarJob);
      if (crmJob) await tx.insert("syncJob", crmJob);
      await tx.appendEvent(this.event(actor, "next_call.scheduled", call.id, { cycleId: cycle.id, planId: plan.id }));
      if (calendarJob) await tx.appendEvent(this.event(actor, "calendar.sync.requested", call.id, { syncJobId: calendarJob.id }));
      if (crmJob) await tx.appendEvent(this.event(actor, "crm.sync.requested", call.id, { syncJobId: crmJob.id }));
      await tx.appendAudit(this.audit(actor, "next_call.scheduled", call.id));
      return { call, plan };
    });
    await this.deps.notifications?.notify(result.call.ownerUserId, { title: "Next call scheduled", body: result.call.purpose, href: `/calls/${result.call.id}` });
    return result;
  }
  async generateEmailDraft(nextActionId, expectedVersion, actor) {
    if (!this.deps.tools.email) throw new WorkflowError("EMAIL_TOOL_DISABLED", 404, "Email drafting is not configured");
    const context = await this.deps.storage.transact(actor.organizationId, async (tx) => {
      const action = await tx.get("nextAction", nextActionId);
      if (!action || action.type !== "email") throw new WorkflowError("NOT_FOUND", 404, "Email action not found");
      const call = await tx.get("call", action.callId);
      if (!call) throw new WorkflowError("NOT_FOUND", 404, "Call not found");
      await this.auth.assert(actor, "email:draft", call);
      if (action.version !== expectedVersion) throw new WorkflowError("VERSION_CONFLICT", 409, "Next action changed; refresh and try again");
      return { action, call };
    });
    const snapshot = await this.deps.storage.snapshot(context.call.accountId, actor);
    const result = unwrap(await this.deps.tools.email.run(buildEmailInput(snapshot, context.call, context.action.title), { userId: actor.userId }));
    return this.deps.storage.transact(actor.organizationId, async (tx) => {
      const output = result.output;
      const primary = output.templates?.[0];
      const draft = { ...this.base(actor), cycleId: context.action.cycleId, callId: context.call.id, nextActionId: context.action.id, status: "draft", toContactIds: context.call.contactIds, subject: primary?.subject, body: primary?.body, artifact: this.artifact("email-optimizer", result, snapshot.capturedAt, snapshot.sourceIds, ["A/B result is simulated until connected to a real experiment"]), simulatedAbResult: true };
      await tx.insert("emailDraft", draft);
      await tx.appendAudit(this.audit(actor, "email.draft.generated", draft.id, { simulatedAbResult: true }));
      return draft;
    });
  }
  async getToday(actor, from, to) {
    await this.auth.assert(actor, "today:view", { organizationId: actor.organizationId });
    return this.deps.storage.today(actor, from, to);
  }
};

// ../sales-workflow/src/calendar.ts
import { createHash as createHash3 } from "crypto";
var fetchTransport = { async request(url, init) {
  const response = await fetch(url, init);
  const data = response.status === 204 ? void 0 : await response.json();
  return { status: response.status, headers: response.headers, data };
} };
var checked = (result, allowed = [200, 201]) => {
  if (!allowed.includes(result.status)) throw new WorkflowError(result.status === 412 ? "SYNC_CONFLICT" : "CALENDAR_PROVIDER_ERROR", result.status === 412 ? 409 : 502, "Calendar provider rejected the request");
  return result.data;
};
var endAt = (event) => new Date(new Date(event.startsAt).getTime() + event.durationMinutes * 6e4).toISOString();
var GoogleCalendarAdapter = class {
  constructor(clientId, tokens, transport = fetchTransport) {
    this.clientId = clientId;
    this.tokens = tokens;
    this.transport = transport;
  }
  clientId;
  tokens;
  transport;
  async connect(input) {
    const query = new URLSearchParams({ client_id: this.clientId, redirect_uri: input.redirectUri, response_type: "code", access_type: "offline", prompt: "consent", state: input.state, scope: (input.scopes ?? ["https://www.googleapis.com/auth/calendar.events"]).join(" ") });
    return { authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${query}`, state: input.state };
  }
  async auth(connectionId) {
    return (await this.tokens.get(connectionId)).accessToken;
  }
  async listChanges(input) {
    const token = await this.auth(input.connectionId);
    const changes = [];
    let pageToken;
    let syncToken;
    do {
      const query = new URLSearchParams({ singleEvents: "false", showDeleted: "true", maxResults: "250" });
      if (input.cursor) query.set("syncToken", input.cursor);
      if (pageToken) query.set("pageToken", pageToken);
      const response = await this.transport.request(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${query}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 410) throw new WorkflowError("SYNC_CURSOR_EXPIRED", 409, "Google Calendar sync cursor expired; run a full resync");
      const data = checked(response);
      changes.push(...(data.items ?? []).map((item) => {
        const startsAt = item.start?.dateTime;
        const endsAt = item.end?.dateTime;
        const durationMinutes = startsAt && endsAt ? Math.max(5, Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 6e4)) : void 0;
        const originId = item.extendedProperties?.private?.hospiceWorkflowOriginId ?? `external:${String(item.id)}`;
        return { externalId: String(item.id), etag: typeof item.etag === "string" ? item.etag : void 0, deleted: item.status === "cancelled", updatedAt: String(item.updated ?? (/* @__PURE__ */ new Date()).toISOString()), payload: startsAt && durationMinutes ? { title: String(item.summary ?? "Calendar event"), description: typeof item.description === "string" ? item.description : void 0, startsAt, durationMinutes, timezone: String(item.start?.timeZone ?? "UTC"), location: typeof item.location === "string" ? item.location : void 0, remindersMinutes: Array.isArray(item.reminders?.overrides) ? item.reminders.overrides.map((entry) => Number(entry.minutes)).filter(Number.isFinite) : [], recurrenceRule: Array.isArray(item.recurrence) ? item.recurrence[0] : void 0, originId, syncRevision: Number(item.extendedProperties?.private?.syncRevision ?? 0) } : void 0 };
      }));
      pageToken = data.nextPageToken;
      syncToken = data.nextSyncToken;
    } while (pageToken);
    return { changes, cursor: syncToken };
  }
  async upsertEvent(input) {
    const token = await this.auth(input.connectionId);
    const body = { summary: input.event.title, description: input.event.description, location: input.event.location, start: { dateTime: input.event.startsAt, timeZone: input.event.timezone }, end: { dateTime: endAt(input.event), timeZone: input.event.timezone }, recurrence: input.event.recurrenceRule ? [input.event.recurrenceRule] : void 0, reminders: { useDefault: false, overrides: input.event.remindersMinutes.map((minutes) => ({ method: "popup", minutes })) }, extendedProperties: { private: { hospiceWorkflowOriginId: input.event.originId, syncRevision: String(input.event.syncRevision) } } };
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events${input.externalId ? `/${encodeURIComponent(input.externalId)}` : ""}`;
    const response = await this.transport.request(url, { method: input.externalId ? "PUT" : "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...input.expectedEtag ? { "If-Match": input.expectedEtag } : {} }, body: JSON.stringify(body) });
    const data = checked(response);
    return { externalId: data.id, etag: data.etag };
  }
  async deleteEvent(input) {
    const token = await this.auth(input.connectionId);
    checked(await this.transport.request(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(input.externalId)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}`, ...input.expectedEtag ? { "If-Match": input.expectedEtag } : {} } }), [204]);
  }
  async renewSubscription(input) {
    const token = await this.auth(input.connectionId);
    const id = createHash3("sha256").update(`${input.connectionId}:${Date.now()}`).digest("hex").slice(0, 32);
    const expiration = Date.now() + 6 * 24 * 60 * 6e4;
    checked(await this.transport.request("https://www.googleapis.com/calendar/v3/calendars/primary/events/watch", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ id, type: "web_hook", address: input.callbackUrl, expiration: String(expiration) }) }));
    return { expiresAt: new Date(expiration).toISOString() };
  }
  async disconnect(connectionId) {
    await this.tokens.revoke(connectionId);
  }
};
var OutlookCalendarAdapter = class {
  constructor(clientId, tokens, transport = fetchTransport) {
    this.clientId = clientId;
    this.tokens = tokens;
    this.transport = transport;
  }
  clientId;
  tokens;
  transport;
  async connect(input) {
    const query = new URLSearchParams({ client_id: this.clientId, redirect_uri: input.redirectUri, response_type: "code", response_mode: "query", state: input.state, scope: (input.scopes ?? ["offline_access", "Calendars.ReadWrite"]).join(" ") });
    return { authorizationUrl: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${query}`, state: input.state };
  }
  async auth(connectionId) {
    return (await this.tokens.get(connectionId)).accessToken;
  }
  async listChanges(input) {
    const token = await this.auth(input.connectionId);
    const start = input.windowStart ?? new Date(Date.now() - 90 * 864e5).toISOString();
    const end = input.windowEnd ?? new Date(Date.now() + 365 * 864e5).toISOString();
    const url = input.cursor ?? `https://graph.microsoft.com/v1.0/me/calendarView/delta?${new URLSearchParams({ startDateTime: start, endDateTime: end })}`;
    const response = await this.transport.request(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 410) throw new WorkflowError("SYNC_CURSOR_EXPIRED", 409, "Outlook sync cursor expired; run a full resync");
    const data = checked(response);
    const changes = (data.value ?? []).map((item) => {
      const startsAt = item.start?.dateTime;
      const endsAt = item.end?.dateTime;
      const durationMinutes = startsAt && endsAt ? Math.max(5, Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 6e4)) : void 0;
      return { externalId: String(item.id), etag: typeof item["@odata.etag"] === "string" ? String(item["@odata.etag"]) : void 0, deleted: "@removed" in item, updatedAt: String(item.lastModifiedDateTime ?? (/* @__PURE__ */ new Date()).toISOString()), payload: startsAt && durationMinutes ? { title: String(item.subject ?? "Calendar event"), description: typeof item.bodyPreview === "string" ? item.bodyPreview : void 0, startsAt, durationMinutes, timezone: String(item.start?.timeZone ?? "UTC"), location: typeof item.location?.displayName === "string" ? item.location.displayName : void 0, remindersMinutes: item.isReminderOn ? [Number(item.reminderMinutesBeforeStart ?? 30)] : [], originId: typeof item.transactionId === "string" ? item.transactionId : `external:${String(item.id)}`, syncRevision: 0 } : void 0 };
    });
    return { changes, cursor: data["@odata.deltaLink"] ?? data["@odata.nextLink"] };
  }
  async upsertEvent(input) {
    const token = await this.auth(input.connectionId);
    const body = { subject: input.event.title, body: { contentType: "text", content: `${input.event.description ?? ""}
[workflow:${input.event.originId}:${input.event.syncRevision}]` }, start: { dateTime: input.event.startsAt.replace(/Z$/, ""), timeZone: input.event.timezone }, end: { dateTime: endAt(input.event).replace(/Z$/, ""), timeZone: input.event.timezone }, location: input.event.location ? { displayName: input.event.location } : void 0, reminderMinutesBeforeStart: input.event.remindersMinutes[0] ?? 30, isReminderOn: input.event.remindersMinutes.length > 0, transactionId: input.event.originId };
    const url = `https://graph.microsoft.com/v1.0/me/events${input.externalId ? `/${encodeURIComponent(input.externalId)}` : ""}`;
    const response = await this.transport.request(url, { method: input.externalId ? "PATCH" : "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...input.expectedEtag ? { "If-Match": input.expectedEtag } : {} }, body: JSON.stringify(body) });
    const data = checked(response);
    return { externalId: data.id, etag: data["@odata.etag"] };
  }
  async deleteEvent(input) {
    const token = await this.auth(input.connectionId);
    checked(await this.transport.request(`https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(input.externalId)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}`, ...input.expectedEtag ? { "If-Match": input.expectedEtag } : {} } }), [204]);
  }
  async renewSubscription(input) {
    const token = await this.auth(input.connectionId);
    const expiration = Date.now() + 2 * 24 * 60 * 6e4;
    checked(await this.transport.request("https://graph.microsoft.com/v1.0/subscriptions", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ changeType: "created,updated,deleted", notificationUrl: input.callbackUrl, resource: "/me/events", expirationDateTime: new Date(expiration).toISOString(), clientState: createHash3("sha256").update(input.connectionId).digest("hex") }) }));
    return { expiresAt: new Date(expiration).toISOString() };
  }
  async disconnect(connectionId) {
    await this.tokens.revoke(connectionId);
  }
};

// ../sales-workflow/src/crm.ts
import { createHash as createHash4, randomUUID as randomUUID3 } from "crypto";
import { parse } from "csv-parse/sync";
var CsvAccountImportAdapter = class {
  constructor(storage, maxBytes = 5e6, maxRows = 25e3) {
    this.storage = storage;
    this.maxBytes = maxBytes;
    this.maxRows = maxRows;
  }
  storage;
  maxBytes;
  maxRows;
  async preview(content) {
    if (Buffer.byteLength(content) > this.maxBytes) throw new WorkflowError("PAYLOAD_TOO_LARGE", 413, "CSV file is too large");
    const rows = parse(content.replace(/^\uFEFF/, ""), { columns: true, skip_empty_lines: true, relax_column_count: false, trim: true, bom: true, to: this.maxRows + 1 });
    if (rows.length > this.maxRows) throw new WorkflowError("TOO_MANY_ROWS", 413, "CSV row limit exceeded");
    const headers = rows[0] ? Object.keys(rows[0]) : [];
    const formulaCells = [];
    rows.forEach((row, index) => Object.entries(row).forEach(([column, value]) => {
      if (/^[=+\-@\t\r]/.test(value)) formulaCells.push({ row: index + 2, column });
    }));
    return { headers, rows, warnings: rows.length ? [] : ["The CSV contains no data rows"], formulaCells };
  }
  securePreview(preview) {
    if (!preview || !Array.isArray(preview.headers) || !Array.isArray(preview.rows)) throw new WorkflowError("INVALID_IMPORT", 400, "Import preview is malformed");
    if (preview.rows.length > this.maxRows || Buffer.byteLength(JSON.stringify(preview)) > this.maxBytes * 2) throw new WorkflowError("PAYLOAD_TOO_LARGE", 413, "Import preview exceeds configured limits");
    const headers = preview.headers.map(String);
    if (new Set(headers).size !== headers.length) throw new WorkflowError("INVALID_IMPORT", 400, "Import preview has duplicate headers");
    const formulaCells = [];
    const rows = preview.rows.map((row, index) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) throw new WorkflowError("INVALID_IMPORT", 400, `Row ${index + 2} is malformed`);
      const clean = {};
      for (const header of headers) {
        const value = row[header];
        if (typeof value !== "string") throw new WorkflowError("INVALID_IMPORT", 400, `Row ${index + 2} contains a non-text value`);
        if (value.length > 2e3) throw new WorkflowError("INVALID_IMPORT", 400, `Row ${index + 2} contains an overlong value`);
        clean[header] = value;
        if (/^[=+\-@\t\r]/.test(value)) formulaCells.push({ row: index + 2, column: header });
      }
      return clean;
    });
    return { headers, rows, warnings: Array.isArray(preview.warnings) ? preview.warnings.map(String) : [], formulaCells };
  }
  async validate(preview, mapping) {
    const safe = this.securePreview(preview);
    const errors = [];
    const allowed = /* @__PURE__ */ new Set(["accountName", "accountType", "address", "externalId"]);
    if (!Object.values(mapping).includes("accountName")) errors.push("Map one column to accountName");
    for (const [source, target] of Object.entries(mapping)) {
      if (!safe.headers.includes(source)) errors.push(`Mapped column does not exist: ${source}`);
      if (!allowed.has(target)) errors.push(`Unsupported destination field: ${target}`);
    }
    if (new Set(Object.values(mapping)).size !== Object.values(mapping).length) errors.push("Each destination field can be mapped only once");
    if (safe.formulaCells.length) errors.push(`${safe.formulaCells.length} formula-like cells require review`);
    return { valid: errors.length === 0, errors };
  }
  async commit(preview, mapping, actor, dryRun = false) {
    const safe = this.securePreview(preview);
    const validated = await this.validate(safe, mapping);
    if (!validated.valid) throw new WorkflowError("INVALID_IMPORT", 400, validated.errors.join("; "));
    let imported = 0, merged = 0, rejected = 0;
    const rollbackToken = randomUUID3();
    const rollbackTokenHash = createHash4("sha256").update(rollbackToken).digest("hex");
    if (!dryRun) await this.storage.transact(actor.organizationId, async (tx) => {
      const insertedAccountIds = [];
      for (const row of safe.rows) {
        const mapped = Object.fromEntries(Object.entries(mapping).map(([source, target]) => [target, row[source]?.trim()]));
        const name = String(mapped.accountName ?? "");
        if (!name || name.length > 300) {
          rejected++;
          continue;
        }
        const existing = (await tx.list("account", (item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase()))[0];
        if (existing) {
          merged++;
          continue;
        }
        const now2 = (/* @__PURE__ */ new Date()).toISOString();
        const id = randomUUID3();
        await tx.insert("account", { id, organizationId: actor.organizationId, createdAt: now2, updatedAt: now2, version: 1, name, accountType: mapped.accountType ? String(mapped.accountType) : void 0, address: mapped.address ? String(mapped.address) : void 0, externalId: mapped.externalId ? String(mapped.externalId) : void 0, ownerUserId: actor.userId });
        insertedAccountIds.push(id);
        imported++;
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await tx.insert("importJob", { id: randomUUID3(), organizationId: actor.organizationId, createdAt: now, updatedAt: now, version: 1, actorUserId: actor.userId, status: "committed", insertedAccountIds, imported, merged, rejected, rollbackTokenHash, rollbackExpiresAt: new Date(Date.now() + 24 * 60 * 6e4).toISOString() });
      await tx.appendAudit({ id: randomUUID3(), organizationId: actor.organizationId, actorUserId: actor.userId, action: "csv.import.committed", occurredAt: now, metadata: { imported, merged, rejected } });
    });
    return { imported: dryRun ? safe.rows.length : imported, merged, rejected, rollbackToken: dryRun ? void 0 : rollbackToken };
  }
  async rollback(rollbackToken, actor) {
    const tokenHash = createHash4("sha256").update(rollbackToken).digest("hex");
    return this.storage.transact(actor.organizationId, async (tx) => {
      const job = (await tx.list("importJob", (item) => item.rollbackTokenHash === tokenHash))[0];
      if (!job || job.actorUserId !== actor.userId) throw new WorkflowError("ROLLBACK_NOT_FOUND", 404, "Import rollback token was not found");
      if (job.status !== "committed") throw new WorkflowError("ALREADY_ROLLED_BACK", 409, "Import was already rolled back");
      if (job.rollbackExpiresAt <= (/* @__PURE__ */ new Date()).toISOString()) throw new WorkflowError("ROLLBACK_EXPIRED", 410, "Import rollback window expired");
      let rolledBack = 0;
      for (const id of job.insertedAccountIds) {
        const account = await tx.get("account", id);
        if (account && !account.deletedAt) {
          await tx.update("account", { ...account, deletedAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() }, account.version);
          rolledBack++;
        }
      }
      await tx.update("importJob", { ...job, status: "rolled_back", updatedAt: (/* @__PURE__ */ new Date()).toISOString() }, job.version);
      await tx.appendAudit({ id: randomUUID3(), organizationId: actor.organizationId, actorUserId: actor.userId, action: "csv.import.rolled_back", aggregateId: job.id, occurredAt: (/* @__PURE__ */ new Date()).toISOString(), metadata: { rolledBack } });
      return { rolledBack };
    });
  }
  async exportErrors(errors) {
    return ["error", ...errors.map((item) => `"${csvSafe(item).replaceAll('"', '""')}"`)].join("\r\n");
  }
};
var ReferenceCrmAdapter = class {
  records = /* @__PURE__ */ new Map();
  seenKeys = /* @__PURE__ */ new Set();
  async testConnection() {
    return { ok: true, message: "Reference CRM is available" };
  }
  async getCapabilities() {
    return { pull: true, push: true, webhooks: false, objects: ["account", "contact", "activity"] };
  }
  async pullChanges(cursor) {
    const records = [...this.records.values()].filter((record) => !cursor || (record.version ?? "") > cursor);
    return { records: structuredClone(records), cursor: (/* @__PURE__ */ new Date()).toISOString() };
  }
  async pushChanges(records, idempotencyKey) {
    if (this.seenKeys.has(idempotencyKey)) return { accepted: records.map((item) => item.externalId), conflicts: [] };
    this.seenKeys.add(idempotencyKey);
    const accepted = [], conflicts = [];
    for (const record of records) {
      const current = this.records.get(record.externalId);
      if (current?.version && record.version && current.version !== record.version) {
        conflicts.push({ externalId: record.externalId, reason: "version_mismatch" });
        continue;
      }
      this.records.set(record.externalId, { ...structuredClone(record), version: (/* @__PURE__ */ new Date()).toISOString() });
      accepted.push(record.externalId);
    }
    return { accepted, conflicts };
  }
  async resolveExternalRecord(_object, externalId) {
    const record = this.records.get(externalId);
    return record ? structuredClone(record) : void 0;
  }
};
function applyWebsiteWins(local, external, fieldMapping) {
  const result = { ...external };
  for (const [localField, externalField] of Object.entries(fieldMapping)) if (localField in local) result[externalField] = local[localField];
  return result;
}

// ../sales-workflow/src/http-client.ts
function createWorkflowHttpClient(options = {}) {
  const base = (options.baseUrl ?? "/api/v1/sales-workflow").replace(/\/$/, "");
  const transport = options.fetch ?? globalThis.fetch;
  const request = async (path, init = {}) => {
    const headers = await options.headers?.() ?? {};
    const response = await transport(`${base}${path}`, { ...init, headers: { Accept: "application/json", ...init.body ? { "Content-Type": "application/json" } : {}, ...headers, ...init.headers } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message ?? `Request failed (${response.status})`);
    return data;
  };
  const post = (path, body) => request(path, { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) });
  return { today: (from, to) => request(`/today?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`), accounts: () => request("/accounts"), startCycle: (input) => post("/cycles", input), buildPlan: (planId, input) => post(`/plans/${planId}/build`, input), startRoleplay: (planId, input) => post(`/plans/${planId}/roleplay`, input), continueRoleplay: (sessionId, input) => post(`/roleplay/${sessionId}/continue`, input), completeCall: (callId, input) => post(`/calls/${callId}/complete`, input), approveCoaching: (coachingId, input) => post(`/coaching/${coachingId}/approve`, input), scheduleNext: (cycleId, input) => post(`/cycles/${cycleId}/next-call`, input), generateEmailDraft: (actionId, input) => post(`/next-actions/${actionId}/email-draft`, input), previewCsv: (content) => post("/imports/csv/preview", { content }), commitCsv: (preview, mapping, dryRun = false) => post("/imports/csv/commit", { preview, mapping, dryRun }), connectCalendar: (provider, redirectUri) => post(`/integrations/calendar/${provider}/connect`, { redirectUri }) };
}

// ../sales-workflow/src/idempotency.ts
import { createHash as createHash5 } from "crypto";
var requestFingerprint = (method, path, body) => createHash5("sha256").update(JSON.stringify({ method, path, body })).digest("hex");
var InMemoryIdempotencyStore = class {
  constructor(maxEntries = 1e4) {
    this.maxEntries = maxEntries;
  }
  maxEntries;
  records = /* @__PURE__ */ new Map();
  scoped(organizationId, key) {
    return `${organizationId}:${key}`;
  }
  async claim(organizationId, key, fingerprint, expiresAt) {
    const scoped = this.scoped(organizationId, key);
    const current = this.records.get(scoped);
    if (current && current.expiresAt <= (/* @__PURE__ */ new Date()).toISOString()) this.records.delete(scoped);
    const active = this.records.get(scoped);
    if (active) {
      if (active.fingerprint !== fingerprint) return { result: "conflict" };
      if (active.state === "processing") return { result: "processing" };
      return { result: "replay", record: structuredClone(active) };
    }
    if (this.records.size >= this.maxEntries) {
      const oldest = this.records.keys().next().value;
      if (oldest) this.records.delete(oldest);
    }
    this.records.set(scoped, { fingerprint, state: "processing", expiresAt });
    return { result: "claimed" };
  }
  async finish(organizationId, key, record) {
    const scoped = this.scoped(organizationId, key);
    const current = this.records.get(scoped);
    if (!current || current.fingerprint !== record.fingerprint) throw new Error("Idempotency claim was lost");
    this.records.set(scoped, { ...structuredClone(record), expiresAt: current.expiresAt });
  }
};
var PostgresIdempotencyStore = class {
  constructor(pool) {
    this.pool = pool;
  }
  pool;
  async claim(organizationId, key, fingerprint, expiresAt) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.organization_id', $1, true)", [organizationId]);
      await client.query("DELETE FROM sales_workflow_idempotency WHERE organization_id=$1 AND key_hash=$2 AND expires_at<=now()", [organizationId, key]);
      const inserted = await client.query(
        "INSERT INTO sales_workflow_idempotency(organization_id,key_hash,fingerprint,state,expires_at) VALUES($1,$2,$3,'processing',$4) ON CONFLICT(organization_id,key_hash) DO NOTHING RETURNING key_hash",
        [organizationId, key, fingerprint, expiresAt]
      );
      if (inserted.rowCount === 1) {
        await client.query("COMMIT");
        return { result: "claimed" };
      }
      const selected = await client.query("SELECT fingerprint,state,status,body,expires_at FROM sales_workflow_idempotency WHERE organization_id=$1 AND key_hash=$2 FOR UPDATE", [organizationId, key]);
      const row = selected.rows[0];
      await client.query("COMMIT");
      if (!row || row.fingerprint !== fingerprint) return { result: "conflict" };
      if (row.state === "processing") return { result: "processing" };
      return { result: "replay", record: { fingerprint: row.fingerprint, state: row.state, status: row.status, body: row.body, expiresAt: new Date(row.expires_at).toISOString() } };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async finish(organizationId, key, record) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.organization_id', $1, true)", [organizationId]);
      const result = await client.query(
        "UPDATE sales_workflow_idempotency SET state=$1,status=$2,body=$3 WHERE organization_id=$4 AND key_hash=$5 AND fingerprint=$6 AND state='processing'",
        [record.state, record.status ?? null, record.body ?? null, organizationId, key, record.fingerprint]
      );
      if (result.rowCount !== 1) throw new Error("Idempotency claim was lost");
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
};

// ../sales-workflow/src/outbox.ts
var InMemoryOutboxPublisher = class {
  constructor(storage, queue) {
    this.storage = storage;
    this.queue = queue;
  }
  storage;
  queue;
  async publishAvailable(organizationId, limit = 100) {
    const events = this.storage.events.filter((event) => event.organizationId === organizationId && !event.publishedAt).slice(0, limit);
    let published = 0;
    for (const event of events) {
      await this.queue.enqueue(structuredClone(event));
      event.publishedAt = (/* @__PURE__ */ new Date()).toISOString();
      published += 1;
    }
    return { processed: events.length, published, retryable: 0, deadLettered: 0 };
  }
};
var PostgresOutboxPublisher = class {
  constructor(pool, queue, options = {}) {
    this.pool = pool;
    this.queue = queue;
    this.maxAttempts = options.maxAttempts ?? 10;
    this.baseBackoffMs = options.baseBackoffMs ?? 5e3;
    this.now = options.now ?? (() => /* @__PURE__ */ new Date());
  }
  pool;
  queue;
  maxAttempts;
  baseBackoffMs;
  now;
  async publishAvailable(organizationId, limit = 100) {
    const client = await this.pool.connect();
    let published = 0, retryable = 0, deadLettered = 0, processed = 0;
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.organization_id', $1, true)", [organizationId]);
      const selected = await client.query(
        "SELECT id,event_type,aggregate_id,payload,occurred_at,attempts FROM sales_workflow_outbox WHERE organization_id=$1 AND published_at IS NULL AND dead_lettered_at IS NULL AND available_at<=now() ORDER BY occurred_at FOR UPDATE SKIP LOCKED LIMIT $2",
        [organizationId, Math.max(1, Math.min(limit, 500))]
      );
      for (const row of selected.rows) {
        processed += 1;
        const event = { id: row.id, organizationId, type: row.event_type, aggregateId: row.aggregate_id, payload: row.payload, occurredAt: new Date(row.occurred_at).toISOString() };
        try {
          await this.queue.enqueue(event);
          await client.query("UPDATE sales_workflow_outbox SET published_at=$1,attempts=attempts+1,last_error_code=NULL WHERE id=$2 AND organization_id=$3", [this.now().toISOString(), row.id, organizationId]);
          published += 1;
        } catch (error) {
          const attempts = Number(row.attempts) + 1;
          const terminal = attempts >= this.maxAttempts;
          const availableAt = new Date(this.now().getTime() + this.baseBackoffMs * 2 ** Math.min(attempts - 1, 8)).toISOString();
          const errorCode = error instanceof Error ? error.name.slice(0, 100) : "PUBLISH_ERROR";
          await client.query("UPDATE sales_workflow_outbox SET attempts=$1,available_at=$2,last_error_code=$3,dead_lettered_at=$4 WHERE id=$5 AND organization_id=$6", [attempts, availableAt, errorCode, terminal ? this.now().toISOString() : null, row.id, organizationId]);
          if (terminal) deadLettered += 1;
          else retryable += 1;
        }
      }
      await client.query("COMMIT");
      return { processed, published, retryable, deadLettered };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
};

// ../sales-workflow/src/sync-worker.ts
import { createHash as createHash6, randomUUID as randomUUID4 } from "crypto";
var digest = (value) => createHash6("sha256").update(JSON.stringify(value)).digest("hex");
var SalesWorkflowSyncWorker = class {
  constructor(deps) {
    this.deps = deps;
    this.now = deps.now ?? (() => /* @__PURE__ */ new Date());
    this.maxAttempts = deps.maxAttempts ?? 5;
    this.baseBackoffMs = deps.baseBackoffMs ?? 3e4;
  }
  deps;
  now;
  maxAttempts;
  baseBackoffMs;
  async processAvailable(organizationId, limit = 25) {
    const now = this.now().toISOString();
    const jobs = await this.deps.storage.transact(organizationId, (tx) => tx.list("syncJob", (job) => ["queued", "retryable"].includes(job.status) && job.availableAt <= now));
    const results = await Promise.all(jobs.slice(0, Math.max(1, Math.min(limit, 100))).map((job) => this.processJob(organizationId, job.id)));
    return { processed: results.length, succeeded: results.filter((x) => x === "succeeded").length, conflicted: results.filter((x) => x === "conflicted").length, failed: results.filter((x) => x === "retryable" || x === "dead_lettered").length };
  }
  async processJob(organizationId, jobId) {
    const claimed = await this.deps.storage.transact(organizationId, async (tx) => {
      const job = await tx.get("syncJob", jobId);
      if (!job) throw new WorkflowError("NOT_FOUND", 404, "Sync job not found");
      if (!["queued", "retryable"].includes(job.status) || job.availableAt > this.now().toISOString()) return void 0;
      const running = { ...job, status: "running", attempts: job.attempts + 1, updatedAt: this.now().toISOString(), errorCode: void 0 };
      await tx.update("syncJob", running, job.version);
      return { ...running, version: job.version + 1 };
    });
    if (!claimed) return "running";
    try {
      if (claimed.kind === "calendar") await this.syncCalendar(organizationId, claimed);
      else await this.syncCrm(organizationId, claimed);
      return this.finish(organizationId, claimed.id, "succeeded");
    } catch (error) {
      const conflict = error instanceof WorkflowError && error.status === 409;
      const terminal = claimed.attempts >= this.maxAttempts;
      return this.finish(organizationId, claimed.id, conflict ? "conflicted" : terminal ? "dead_lettered" : "retryable", error instanceof WorkflowError ? error.code : "PROVIDER_ERROR");
    }
  }
  async syncCalendar(organizationId, job) {
    const data = await this.deps.storage.transact(organizationId, async (tx) => {
      const call = await tx.get("call", job.aggregateId);
      if (!call) throw new WorkflowError("NOT_FOUND", 404, "Call for calendar sync not found");
      const account = await tx.get("account", call.accountId);
      const event = (await tx.list("calendarEvent", (item) => item.callId === call.id))[0];
      return { call, account, event };
    });
    const provider = data.call.schedule.calendarProvider;
    if (!provider) throw new WorkflowError("CALENDAR_NOT_SELECTED", 503, "No calendar provider is selected for this call");
    const connection = await this.deps.resolveCalendar(organizationId, provider);
    if (!connection || connection.enabled === false) throw new WorkflowError("CALENDAR_DISCONNECTED", 503, "Calendar connection is unavailable");
    const payload = { title: `${data.account?.name ?? "Account"}: ${data.call.purpose}`, description: "Hospice sales follow-up. Do not add patient-identifying information.", startsAt: data.call.schedule.startsAt, durationMinutes: data.call.schedule.durationMinutes, timezone: data.call.schedule.timezone, location: data.call.schedule.location, remindersMinutes: data.call.schedule.remindersMinutes, recurrenceRule: data.call.schedule.recurrenceRule, originId: data.call.id, syncRevision: data.call.version };
    const result = await connection.adapter.upsertEvent({ connectionId: connection.connectionId, event: payload, externalId: data.event?.externalId, expectedEtag: data.event?.etag });
    await this.deps.storage.transact(organizationId, async (tx) => {
      const current = (await tx.list("calendarEvent", (item) => item.callId === data.call.id))[0];
      const now = this.now().toISOString();
      if (current) await tx.update("calendarEvent", { ...current, provider, externalId: result.externalId, etag: result.etag, syncRevision: data.call.version, contentHash: digest(payload), updatedAt: now }, current.version);
      else {
        const event = { id: randomUUID4(), organizationId, createdAt: now, updatedAt: now, version: 1, callId: data.call.id, provider, externalId: result.externalId, etag: result.etag, syncRevision: data.call.version, contentHash: digest(payload) };
        await tx.insert("calendarEvent", event);
      }
    });
  }
  async syncCrm(organizationId, job) {
    const crm = await this.deps.resolveCrm(organizationId);
    if (!crm) throw new WorkflowError("CRM_DISCONNECTED", 503, "CRM connection is unavailable");
    const data = await this.deps.storage.transact(organizationId, async (tx) => {
      const call = await tx.get("call", job.aggregateId);
      if (!call) throw new WorkflowError("NOT_FOUND", 404, "Call for CRM sync not found");
      const account = await tx.get("account", call.accountId);
      if (!account) throw new WorkflowError("NOT_FOUND", 404, "Account for CRM sync not found");
      const outcome = (await tx.list("outcome", (item) => item.callId === call.id))[0];
      return { call, account, outcome };
    });
    const records = [
      { object: "account", externalId: data.account.externalId ?? data.account.id, fields: { name: data.account.name, accountType: data.account.accountType } },
      { object: "activity", externalId: data.call.id, fields: { accountExternalId: data.account.externalId ?? data.account.id, purpose: data.call.purpose, startsAt: data.call.schedule.startsAt, durationMinutes: data.call.schedule.durationMinutes, status: data.call.status, outcome: data.outcome?.outcome } }
    ];
    const result = await crm.pushChanges(records, job.idempotencyKey);
    if (result.conflicts.length) throw new WorkflowError("SYNC_CONFLICT", 409, "CRM record changed outside the website", { conflicts: result.conflicts });
  }
  async finish(organizationId, jobId, status, errorCode) {
    return this.deps.storage.transact(organizationId, async (tx) => {
      const job = await tx.get("syncJob", jobId);
      if (!job) throw new WorkflowError("NOT_FOUND", 404, "Sync job not found");
      const availableAt = status === "retryable" ? new Date(this.now().getTime() + this.baseBackoffMs * 2 ** Math.max(0, job.attempts - 1)).toISOString() : job.availableAt;
      await tx.update("syncJob", { ...job, status, errorCode, availableAt, updatedAt: this.now().toISOString() }, job.version);
      if (status === "conflicted") await tx.appendEvent({ id: randomUUID4(), organizationId, type: "sync.conflict.detected", aggregateId: job.aggregateId, occurredAt: this.now().toISOString(), payload: { syncJobId: job.id, kind: job.kind, errorCode } });
      await tx.appendAudit({ id: randomUUID4(), organizationId, actorUserId: "00000000-0000-4000-8000-000000000000", action: `sync.${status}`, aggregateId: job.aggregateId, occurredAt: this.now().toISOString(), metadata: { syncJobId: job.id, kind: job.kind, attempts: job.attempts, errorCode } });
      return status;
    });
  }
};

// ../sales-workflow/src/inbound-sync.ts
import { createHash as createHash7, randomUUID as randomUUID5 } from "crypto";
var hash2 = (value) => createHash7("sha256").update(JSON.stringify(value)).digest("hex");
var InboundSyncService = class {
  constructor(storage, now = () => /* @__PURE__ */ new Date()) {
    this.storage = storage;
    this.now = now;
  }
  storage;
  now;
  async pullCalendar(input) {
    const cursorRecord = await this.getCursor(input.organizationId, input.provider, input.connectionId);
    const pulled = await input.adapter.listChanges({ connectionId: input.connectionId, cursor: cursorRecord?.cursor, windowStart: input.windowStart, windowEnd: input.windowEnd });
    let ignored = 0;
    let conflicts = 0;
    for (const change of pulled.changes) {
      const result = await this.stageCalendarChange(input.organizationId, input.provider, change);
      if (result === "ignored") ignored += 1;
      else conflicts += 1;
    }
    await this.saveCursor(input.organizationId, input.provider, input.connectionId, pulled.cursor);
    return { ignored, conflicts, cursor: pulled.cursor };
  }
  async pullCrm(input) {
    const cursorRecord = await this.getCursor(input.organizationId, input.provider, input.connectionId);
    const pulled = await input.adapter.pullChanges(cursorRecord?.cursor);
    let ignored = 0;
    let conflicts = 0;
    for (const record of pulled.records) {
      const result = await this.stageCrmRecord(input.organizationId, input.provider, record);
      if (result === "ignored") ignored += 1;
      else conflicts += 1;
    }
    await this.saveCursor(input.organizationId, input.provider, input.connectionId, pulled.cursor);
    return { ignored, conflicts, cursor: pulled.cursor };
  }
  async stageCalendarChange(organizationId, provider, change) {
    return this.storage.transact(organizationId, async (tx) => {
      const link = (await tx.list("calendarEvent", (item) => item.provider === provider && item.externalId === change.externalId))[0];
      if (!link) {
        await this.createConflict(tx, organizationId, { kind: "calendar", provider, externalId: change.externalId, reason: "unlinked_external", externalVersion: change.etag, externalPayload: change.payload });
        return "conflict";
      }
      const call = await tx.get("call", link.callId);
      if (!call) {
        await this.createConflict(tx, organizationId, { kind: "calendar", provider, aggregateId: link.callId, externalId: change.externalId, reason: "version_mismatch", externalVersion: change.etag, externalPayload: change.payload });
        return "conflict";
      }
      if (change.deleted) {
        await tx.update("calendarEvent", { ...link, deletedExternallyAt: this.now().toISOString(), updatedAt: this.now().toISOString() }, link.version);
        await this.createConflict(tx, organizationId, { kind: "calendar", provider, aggregateId: call.id, externalId: change.externalId, reason: "external_deleted", localVersion: call.version, externalVersion: change.etag, localPayload: this.localCalendarPayload(call), externalPayload: change.payload });
        return "conflict";
      }
      const sameRevision = change.payload?.originId === call.id && change.payload.syncRevision === link.syncRevision;
      const samePayload = change.payload ? hash2(change.payload) === link.contentHash : false;
      if (change.etag === link.etag || sameRevision && samePayload) return "ignored";
      await this.createConflict(tx, organizationId, { kind: "calendar", provider, aggregateId: call.id, externalId: change.externalId, reason: "external_changed", localVersion: call.version, externalVersion: change.etag, localPayload: this.localCalendarPayload(call), externalPayload: change.payload });
      return "conflict";
    });
  }
  localCalendarPayload(call) {
    return { purpose: call.purpose, ...call.schedule, originId: call.id, syncRevision: call.version };
  }
  async stageCrmRecord(organizationId, provider, record) {
    return this.storage.transact(organizationId, async (tx) => {
      const local = record.object === "account" ? (await tx.list("account", (item) => item.externalId === record.externalId))[0] : record.object === "contact" ? (await tx.list("contact", (item) => item.externalId === record.externalId))[0] : void 0;
      if (local && !record.deleted && hash2(this.crmComparable(local, record)) === hash2(record.fields)) return "ignored";
      await this.createConflict(tx, organizationId, {
        kind: "crm",
        provider,
        aggregateId: local?.id,
        externalId: record.externalId,
        reason: record.deleted ? "external_deleted" : local ? "external_changed" : "unlinked_external",
        localVersion: local?.version,
        externalVersion: record.version,
        localPayload: local ? this.crmComparable(local, record) : void 0,
        externalPayload: record.fields
      });
      return "conflict";
    });
  }
  crmComparable(local, record) {
    const values = local;
    return Object.fromEntries(Object.keys(record.fields).filter((key) => key in values).map((key) => [key, values[key]]));
  }
  async createConflict(tx, organizationId, input) {
    const duplicate = (await tx.list("syncConflict", (item) => item.status === "pending" && item.provider === input.provider && item.externalId === input.externalId && item.externalVersion === input.externalVersion && item.reason === input.reason))[0];
    if (duplicate) return;
    const timestamp = this.now().toISOString();
    const conflict = { id: randomUUID5(), organizationId, createdAt: timestamp, updatedAt: timestamp, version: 1, status: "pending", detectedAt: timestamp, ...input };
    await tx.insert("syncConflict", conflict);
    await tx.appendEvent({ id: randomUUID5(), organizationId, type: "sync.conflict.detected", aggregateId: conflict.aggregateId ?? conflict.id, occurredAt: timestamp, payload: { conflictId: conflict.id, kind: conflict.kind, provider: conflict.provider, reason: conflict.reason } });
  }
  async getCursor(organizationId, provider, connectionId) {
    return this.storage.transact(organizationId, async (tx) => (await tx.list("syncCursor", (item) => item.provider === provider && item.connectionId === connectionId))[0]);
  }
  async saveCursor(organizationId, provider, connectionId, cursor) {
    await this.storage.transact(organizationId, async (tx) => {
      const current = (await tx.list("syncCursor", (item) => item.provider === provider && item.connectionId === connectionId))[0];
      const timestamp = this.now().toISOString();
      if (current) await tx.update("syncCursor", { ...current, cursor, lastPulledAt: timestamp, lastErrorCode: void 0, updatedAt: timestamp }, current.version);
      else {
        const value = { id: randomUUID5(), organizationId, createdAt: timestamp, updatedAt: timestamp, version: 1, provider, connectionId, cursor, lastPulledAt: timestamp };
        await tx.insert("syncCursor", value);
      }
    });
  }
};
export {
  AesGcmEncryption,
  CsvAccountImportAdapter,
  DefaultAuthorization,
  GoogleCalendarAdapter,
  InMemoryIdempotencyStore,
  InMemoryOutboxPublisher,
  InMemoryWorkflowStorage,
  InboundSyncService,
  OutlookCalendarAdapter,
  PostgresIdempotencyStore,
  PostgresOutboxPublisher,
  PostgresWorkflowStorage,
  ReferenceCrmAdapter,
  SalesWorkflowOrchestrator,
  SalesWorkflowSyncWorker,
  WorkflowError,
  accountInputSchema,
  actorSchema,
  adaptiveRoleplayBoundarySchema,
  adaptiveRoleplayOutputBoundarySchema,
  applyWebsiteWins,
  artifactStatusSchema,
  buildAdaptiveRoleplayInput,
  buildCoachingInput,
  buildDiscoveryInput,
  buildEmailInput,
  buildObjectionInput,
  buildPerformanceInput,
  buildPlannerInput,
  buildRoleplayScenarioInput,
  calendarProviderSchema,
  callStatusSchema,
  coachingBoundarySchema,
  completeCallInputSchema,
  contactInputSchema,
  createWorkflowHttpClient,
  csvSafe,
  discoveryBoundarySchema,
  emailBoundarySchema,
  fetchTransport,
  integrationProviderSchema,
  newId,
  nextActionStatusSchema,
  nextCallInputSchema,
  objectionBoundarySchema,
  performanceBoundarySchema,
  planStatusSchema,
  plannerBoundarySchema,
  requestFingerprint,
  roleSchema,
  roleplayScenarioBoundarySchema,
  roleplayScenarioOutputBoundarySchema,
  safeLogMetadata,
  sanitizeExternalText,
  scheduleSchema,
  startCycleInputSchema,
  syncStatusSchema
};
//# sourceMappingURL=sales-workflow.js.map