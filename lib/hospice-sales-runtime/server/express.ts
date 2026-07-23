import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import {
  DefaultAuthorization,
  InMemoryIdempotencyStore,
  SalesWorkflowOrchestrator,
  WorkflowError,
  requestFingerprint,
  type Actor,
  type AuthorizationAdapter,
  type CalendarAdapter,
  type IdempotencyStore,
  type ImportAdapter,
  type WorkflowStorage,
} from "../dist/sales-workflow.js";

export interface WorkflowRouterOptions {
  orchestrator: SalesWorkflowOrchestrator; storage: WorkflowStorage; resolveActor(request: Request): Promise<Actor> | Actor;
  importAdapter?: ImportAdapter; calendars?: Partial<Record<"google" | "outlook", CalendarAdapter>>; maxBodyBytes?: number;idempotencyStore?:IdempotencyStore;idempotencyTtlMs?:number;authorization?:AuthorizationAdapter;
}
const safeErrorBody = (error: unknown, requestId: string) => { const safe = error instanceof WorkflowError ? error : new WorkflowError("INTERNAL_ERROR", 500, "Unexpected server error"); return { status: safe.status, body: { error: { code: safe.code, message: safe.message, requestId, details: safe.details } } }; };
const sendError = (response: Response, error: unknown, requestId: string) => { const safe=safeErrorBody(error,requestId);response.setHeader("X-Request-Id",requestId).status(safe.status).json(safe.body); };

export function createWorkflowRouter(options: WorkflowRouterOptions): Router {
  const router = Router(); const max = options.maxBodyBytes ?? 1_000_000;const idempotency=options.idempotencyStore??new InMemoryIdempotencyStore();const authorization=options.authorization??new DefaultAuthorization();
  const context = async (request: Request) => { const length = Number(request.headers["content-length"] ?? 0); if (length > max) throw new WorkflowError("PAYLOAD_TOO_LARGE", 413, "Request is too large"); return options.resolveActor(request); };
  const mutation = (handler: (request: Request, actor: Actor) => Promise<unknown>, requireVersion = true) => async (request: Request, response: Response) => {
    const requestId = String(request.headers["x-request-id"] ?? randomUUID());
    let claim: { organizationId: string; cacheKey: string; fingerprint: string } | undefined;
    try {
      const actor = await context(request);
      const key = request.header("Idempotency-Key");
      if (!key) throw new WorkflowError("IDEMPOTENCY_KEY_REQUIRED", 400, "Idempotency-Key header is required");
      if(!/^[\x21-\x7e]{8,200}$/.test(key))throw new WorkflowError("INVALID_IDEMPOTENCY_KEY",400,"Idempotency-Key must contain 8 to 200 printable characters");
      const cacheScope = `${actor.userId}:${request.method}:${request.path}:${key}`;
      const cacheKey=requestFingerprint("IDEMPOTENCY",cacheScope,null);
      const fingerprint=requestFingerprint(request.method,request.path,request.body);
      const expiresAt=new Date(Date.now()+(options.idempotencyTtlMs??86_400_000)).toISOString();
      const claimed=await idempotency.claim(actor.organizationId,cacheKey,fingerprint,expiresAt);
      if(claimed.result==="conflict")throw new WorkflowError("IDEMPOTENCY_KEY_REUSED",409,"Idempotency key was already used with a different request");
      if(claimed.result==="processing")throw new WorkflowError("IDEMPOTENCY_IN_PROGRESS",409,"An identical request is still processing");
      if(claimed.result==="replay"){response.setHeader("X-Idempotent-Replay","true").setHeader("X-Request-Id",requestId).status(claimed.record.status??200).json(claimed.record.body);return;}
      claim={organizationId:actor.organizationId,cacheKey,fingerprint};
      if (requireVersion && (!Number.isInteger(request.body?.expectedVersion) || request.body.expectedVersion < 1)) throw new WorkflowError("EXPECTED_VERSION_REQUIRED", 400, "A positive expectedVersion is required");
      const body = await handler(request, actor);
      await idempotency.finish(actor.organizationId,cacheKey,{fingerprint,state:"completed",status:200,body});
      response.setHeader("X-Request-Id", requestId).json(body);
    } catch (error) {
      const safe=safeErrorBody(error,requestId);
      if(claim)await idempotency.finish(claim.organizationId,claim.cacheKey,{fingerprint:claim.fingerprint,state:"failed",status:safe.status,body:safe.body}).catch(()=>{});
      response.setHeader("X-Request-Id",requestId).status(safe.status).json(safe.body);
    }
  };
  router.get("/health", (_request, response) => response.json({ ok: true, service: "hospice-sales-workflow", version: "v1" }));
  router.get("/today", async (request, response) => { const requestId = randomUUID(); try { const actor = await context(request); const now = new Date(); const localStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());const localEnd=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1); const from = typeof request.query.from === "string" ? request.query.from : localStart.toISOString(); const to = typeof request.query.to === "string" ? request.query.to : localEnd.toISOString(); response.json(await options.orchestrator.getToday(actor, from, to)); } catch (error) { sendError(response, error, requestId); } });
  router.get("/accounts", async (request, response) => { const requestId = randomUUID(); try { const actor = await context(request); const accounts = await options.storage.transact(actor.organizationId, (tx) => tx.list("account", (item) => actor.role !== "rep" || item.ownerUserId === actor.userId)); response.json({ accounts }); } catch (error) { sendError(response, error, requestId); } });
  router.get("/accounts/:id", async (request, response) => { const requestId = randomUUID(); try { const actor = await context(request); response.json(await options.storage.snapshot(String(request.params.id), actor)); } catch (error) { sendError(response, error, requestId); } });
  router.post("/cycles", mutation((request, actor) => options.orchestrator.startCycle(request.body, actor), false));
  router.post("/plans/:id/build", mutation((request, actor) => options.orchestrator.buildPlan(String(request.params.id), request.body.expectedVersion, actor)));
  router.post("/plans/:id/roleplay",mutation((request,actor)=>options.orchestrator.startRoleplay(String(request.params.id),request.body.expectedVersion,actor)));
  router.post("/roleplay/:id/continue",mutation((request,actor)=>options.orchestrator.continueRoleplay(String(request.params.id),request.body.expectedVersion,String(request.body.userInput??""),actor)));
  router.post("/calls/:id/start", mutation((request, actor) => options.orchestrator.startCall(String(request.params.id), request.body.expectedVersion, actor)));
  router.post("/calls/:id/complete", mutation((request, actor) => options.orchestrator.completeCall({ ...request.body, callId: String(request.params.id) }, actor)));
  router.post("/coaching/:id/approve", mutation((request, actor) => options.orchestrator.approveCoaching(String(request.params.id), request.body.expectedVersion, request.body.acceptedActionIds ?? [], actor)));
  router.post("/cycles/:id/next-call", mutation((request, actor) => options.orchestrator.scheduleNextCall({ ...request.body, cycleId: String(request.params.id) }, actor)));
  router.post("/next-actions/:id/email-draft", mutation((request, actor) => options.orchestrator.generateEmailDraft(String(request.params.id), request.body.expectedVersion, actor)));
  router.post("/imports/csv/preview", mutation(async (request,actor) => { await authorization.assert(actor,"integration:import",{organizationId:actor.organizationId});if (!options.importAdapter) throw new WorkflowError("IMPORT_DISABLED", 404, "CSV import is not configured"); return options.importAdapter.preview(String(request.body.content ?? "")); }, false));
  router.post("/imports/csv/commit", mutation(async (request, actor) => { await authorization.assert(actor,"integration:import",{organizationId:actor.organizationId});if (!options.importAdapter) throw new WorkflowError("IMPORT_DISABLED", 404, "CSV import is not configured"); return options.importAdapter.commit(request.body.preview, request.body.mapping ?? {}, actor, Boolean(request.body.dryRun)); }, false));
  router.post("/imports/csv/rollback",mutation(async(request,actor)=>{await authorization.assert(actor,"integration:import",{organizationId:actor.organizationId});if(!options.importAdapter)throw new WorkflowError("IMPORT_DISABLED",404,"CSV import is not configured");return options.importAdapter.rollback(String(request.body.rollbackToken??""),actor)},false));
  router.get("/sync/status", async (request, response) => { const requestId = randomUUID(); try { const actor = await context(request);await authorization.assert(actor,"integration:status",{organizationId:actor.organizationId}); const jobs = await options.storage.transact(actor.organizationId, (tx) => tx.list("syncJob")); response.setHeader("X-Request-Id",requestId).json({ jobs }); } catch (error) { sendError(response, error, requestId); } });
  router.post("/integrations/calendar/:provider/connect", mutation(async (request,actor) => { await authorization.assert(actor,"integration:connect",{organizationId:actor.organizationId});const provider = request.params.provider as "google" | "outlook"; const adapter = options.calendars?.[provider]; if (!adapter) throw new WorkflowError("INTEGRATION_DISABLED", 404, "Calendar provider is not configured"); return adapter.connect({ redirectUri: request.body.redirectUri, state: request.body.state ?? randomUUID() }); }, false));
  router.post("/integrations/calendar/:provider/disconnect", mutation(async (request,actor) => { await authorization.assert(actor,"integration:disconnect",{organizationId:actor.organizationId});const provider = request.params.provider as "google" | "outlook"; const adapter = options.calendars?.[provider]; if (!adapter) throw new WorkflowError("INTEGRATION_DISABLED", 404, "Calendar provider is not configured"); await adapter.disconnect(request.body.connectionId); return { disconnected: true }; }, false));
  router.get("/manager/overview", async (request, response) => { const requestId = randomUUID(); try { const actor = await context(request); if (actor.role !== "manager") throw new WorkflowError("FORBIDDEN", 403, "Manager access is required"); const from = String(request.query.from ?? new Date(Date.now() - 7 * 86_400_000).toISOString()); const to = String(request.query.to ?? new Date(Date.now() + 86_400_000).toISOString()); const data = await options.orchestrator.getToday(actor, from, to); response.json({ ...data, transcriptAccess: false }); } catch (error) { sendError(response, error, requestId); } });
  return router;
}
