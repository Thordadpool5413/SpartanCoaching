import type { Request, Router } from "express";
import type {
  Actor,
  AuthorizationAdapter,
  CalendarAdapter,
  IdempotencyStore,
  ImportAdapter,
  SalesWorkflowOrchestrator,
  WorkflowStorage,
} from "../dist/sales-workflow.js";

export interface WorkflowRouterOptions {
  orchestrator: SalesWorkflowOrchestrator;
  storage: WorkflowStorage;
  resolveActor(request: Request): Promise<Actor> | Actor;
  importAdapter?: ImportAdapter;
  calendars?: Partial<Record<"google" | "outlook", CalendarAdapter>>;
  maxBodyBytes?: number;
  idempotencyStore?: IdempotencyStore;
  idempotencyTtlMs?: number;
  authorization?: AuthorizationAdapter;
}

export function createWorkflowRouter(options: WorkflowRouterOptions): Router;
