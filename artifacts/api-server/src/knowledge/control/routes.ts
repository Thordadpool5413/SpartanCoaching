import express from "express";
import type { Pool } from "pg";
import { extractSessionToken } from "../../auth/middleware";
import { strictJson } from "./contracts";
import { executeCommand } from "../persistence/commands";
import { readKnowledge } from "./reads";
import { CommandDeadline, KnowledgeUnavailable } from "../persistence/deadline";
export function sanitizedKnowledgePath(path: string): string {
  const folded = path.toLowerCase();
  return folded === "/api/knowledge-control" ||
    folded.startsWith("/api/knowledge-control/")
    ? "/api/knowledge-control/:scopeKind/:surface"
    : path;
}
const statuses: Record<string, number> = {
  UNAUTHENTICATED: 401,
  CSRF_ORIGIN_REJECTED: 403,
  KNOWLEDGE_SCOPE_DENIED: 403,
  KNOWLEDGE_PERMISSION_DENIED: 403,
  KNOWLEDGE_DELEGATION_DENIED: 403,
  QUALIFIED_REVIEW_REQUIRED: 403,
  KNOWLEDGE_CONTRACT_INVALID: 400,
  IDEMPOTENCY_CONFLICT: 409,
  COMMAND_IN_PROGRESS: 409,
  COMMAND_UNAVAILABLE: 503,
  COMMAND_OUTCOME_UNKNOWN: 503,
};
const conflictCodes = new Set([
  "KNOWLEDGE_REVISION_CONFLICT",
  "KNOWLEDGE_REFERENCE_INVALID",
  "KNOWLEDGE_IDENTITY_CONFLICT",
  "KNOWLEDGE_CAPACITY_EXCEEDED",
  "KNOWLEDGE_PUBLICATION_CHRONOLOGY_INVALID",
  "KNOWLEDGE_REGISTRATION_INVALID",
  "KNOWLEDGE_REVOKED",
  "KNOWLEDGE_HEALTH_INVALID",
  "KNOWLEDGE_STAGE_INVALID",
  "ACTIVATION_REVIEW_REQUIRED",
  "ACTIVATION_HEALTH_REQUIRED",
  "KNOWLEDGE_REVIEW_REQUIRED",
  "KNOWLEDGE_LICENSE_DENIED",
  "KNOWLEDGE_PIPELINE_REQUIRED",
  "ACTIVATION_RIGHTS_OR_INTERVAL_REQUIRED",
  "KNOWLEDGE_LKG_INVALID",
  "KNOWLEDGE_ACTIVATION_INVALID",
  "KNOWLEDGE_REPLACEMENT_INVALID",
  "KNOWLEDGE_SUBMISSION_INVALID",
  "KNOWLEDGE_DUTY_CONFLICT",
  "KNOWLEDGE_REVIEW_TRANSITION_INVALID",
  "KNOWLEDGE_REVIEW_WINDOW_INVALID",
]);
export const knowledgeErrorHandler: express.ErrorRequestHandler = (
  e: unknown,
  _req,
  res,
  _next,
) => {
  const message = e instanceof Error ? e.message : "";
  let code =
    Object.hasOwn(statuses, message) || conflictCodes.has(message)
      ? message
      : "KNOWLEDGE_INTERNAL_ERROR";
  const tooLarge =
    !!e &&
    typeof e === "object" &&
    "type" in e &&
    e.type === "entity.too.large";
  if (tooLarge) code = "KNOWLEDGE_CONTRACT_INVALID";
  const status = tooLarge
    ? 413
    : (statuses[code] ?? (conflictCodes.has(code) ? 409 : 500));
  if (
    code === "COMMAND_IN_PROGRESS" ||
    code === "COMMAND_UNAVAILABLE" ||
    code === "COMMAND_OUTCOME_UNKNOWN"
  )
    res.set("Retry-After", "1");
  res.status(status).json({
    code,
    ...(e instanceof KnowledgeUnavailable &&
    e.code === "COMMAND_OUTCOME_UNKNOWN"
      ? { retry: "SAME_KEY_AND_PAYLOAD" }
      : {}),
  });
};
export function knowledgeRouter(
  pool: Pool,
  options: { enabled?: boolean; synthetic?: boolean } = {},
) {
  const router = express.Router();
  router.use((_req, res, next) => {
    res.set("Cache-Control", "no-store, private");
    res.set("Pragma", "no-cache");
    if (!(
      options.enabled ?? process.env.KNOWLEDGE_CONTROL_ENABLED === "true"
    )) {
      res.status(404).json({ code: "NOT_FOUND" });
      return;
    }
    next();
  });
  router.post(
    "/:scopeKind/commands",
    (req, res, next) => {
      if (!["global", "tenant"].includes(String(req.params.scopeKind))) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
      }
      const deadline = new CommandDeadline();
      res.locals.knowledgeDeadline = deadline;
      if (!req.is("application/json")) {
        res.status(400).json({ code: "KNOWLEDGE_CONTRACT_INVALID" });
        return;
      }
      next();
    },
    express.text({ type: "application/json", limit: "1mb" }),
    async (req, res, next) => {
      try {
        const result = await executeCommand(
          pool,
          extractSessionToken(req),
          req.params.scopeKind as "global" | "tenant",
          strictJson(req.body),
          req.headers["idempotency-key"],
          {
            deadline: res.locals.knowledgeDeadline,
            synthetic: options.synthetic === true,
          },
        );
        res.status(200).json(result);
      } catch (e) {
        next(e);
      }
    },
  );
  for (const surface of ["scope", "metadata"] as const)
    router.get(`/:scopeKind/${surface}`, async (req, res, next) => {
      if (!["global", "tenant"].includes(String(req.params.scopeKind))) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
      }
      const deadline = new CommandDeadline();
      try {
        if (surface === "scope" && Object.keys(req.query).length)
          throw new Error("KNOWLEDGE_CONTRACT_INVALID");
        res.json(
          await readKnowledge(
            pool,
            extractSessionToken(req),
            req.params.scopeKind as "global" | "tenant",
            surface === "scope" ? null : req.query,
            { deadline, synthetic: options.synthetic === true },
          ),
        );
      } catch (e) {
        next(e);
      }
    });
  router.use((_req, res) => {
    res.status(404).json({ code: "NOT_FOUND" });
  });
  router.use(knowledgeErrorHandler);
  return router;
}
