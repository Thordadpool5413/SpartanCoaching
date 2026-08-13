import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import {
  getBillingEmailMetrics,
  isHydrationComplete,
} from "../billing/billingEmailMetrics";
import { clinicalRuntimeReadiness } from "../clinical/runtimeReadiness";
import { coverageUsesEducationalBaseline } from "../clinical/coverageBootstrap";
import { getRequestMetricsSnapshot } from "../observability/requestMetrics";
import {
  RELIABILITY_TARGETS,
  evaluateAgainstTarget,
} from "../observability/reliabilityTargets";
import { buildClientConfig } from "../delivery/clientConfig";

const router: IRouter = Router();

/**
 * GET /healthz
 *
 * Returns server health status including billing-email failure metrics.
 *
 * Note: there is a short window after startup (typically < 1 s) where
 * `billingEmail.hydrated` is `false`.  During that window `failures1h` and
 * `failures24h` reflect only failures recorded in-memory since the process
 * started, not the full 24-hour history from the database.  Callers should
 * treat `hydrated: false` as "data not yet available" rather than "all clear".
 */
function sendHealthz(_req: import("express").Request, res: import("express").Response) {
  const metrics = getBillingEmailMetrics();
  const data = HealthCheckResponse.parse({
    status: "ok",
    billingEmail: {
      hydrated: isHydrationComplete(),
      ok: metrics.ok,
      failures1h: metrics.failures1h,
      failures24h: metrics.failures24h,
    },
  });
  res.json(data);
}

router.get("/healthz", sendHealthz);
/** Alias used by some deploy smokes and external monitors */
router.get("/health", sendHealthz);

/**
 * GET /healthz/clinical
 * GET /admin/clinical-runtime-health (alias for smoke scripts)
 *
 * Production env verification for clinical / PHI runtime.
 * Never returns secret values — only control names and readiness flags.
 *
 * - operationMode deidentified → ok:true (education mode is intentional)
 * - operationMode phi + ready → ok:true (BAAs + infrastructure configured)
 * - operationMode phi + !ready → HTTP 503 + ok:false + missingControls
 */
async function clinicalRuntimeHealthResponse() {
  const readiness = clinicalRuntimeReadiness();
  const optionalPresent = {
    CMS_COVERAGE_API_TOKEN: Boolean(
      process.env.CMS_COVERAGE_API_TOKEN?.trim(),
    ),
    CLINICAL_GCS_BUCKET: Boolean(process.env.CLINICAL_GCS_BUCKET?.trim()),
    CLINICAL_FILE_SCANNER_TOKEN: Boolean(
      process.env.CLINICAL_FILE_SCANNER_TOKEN?.trim(),
    ),
    OPENAI_MODEL: Boolean(process.env.OPENAI_MODEL?.trim()),
  };
  const usingEducationalBaseline =
    readiness.operationMode === "phi" && readiness.ready
      ? await coverageUsesEducationalBaseline()
      : false;

  if (readiness.operationMode === "deidentified") {
    return {
      ok: true as const,
      status: "ok" as const,
      operationMode: readiness.operationMode,
      ready: true,
      baasConfirmed: readiness.baasConfirmed,
      missingControls: [] as string[],
      usingEducationalBaseline: false,
      optionalPresent,
      hint: readiness.baasConfirmed
        ? "BAAs are confirmed but CLINICAL_OPERATION_MODE=deidentified forces education mode."
        : "De-identified clinical education mode. Set all five BAA confirmation envs to true for PHI mode.",
    };
  }

  if (readiness.ready) {
    return {
      ok: true as const,
      status: "ok" as const,
      operationMode: readiness.operationMode,
      ready: true,
      baasConfirmed: readiness.baasConfirmed,
      missingControls: [] as string[],
      usingEducationalBaseline,
      optionalPresent,
      hint: usingEducationalBaseline
        ? "PHI clinical runtime is operational, but coverage is still the educational baseline. Sync a live CMS MCD snapshot for policy fidelity."
        : "PHI clinical runtime is operational. MFA + ephemeral workflows apply.",
    };
  }

  return {
    ok: false as const,
    status: "degraded" as const,
    operationMode: readiness.operationMode,
    ready: false,
    baasConfirmed: readiness.baasConfirmed,
    missingControls: readiness.missingControls,
    usingEducationalBaseline: false,
    optionalPresent,
    hint: "PHI mode is selected but required production controls are missing. Set every name in missingControls.",
  };
}

async function sendClinicalRuntimeHealth(
  _req: import("express").Request,
  res: import("express").Response,
) {
  const body = await clinicalRuntimeHealthResponse();
  res.status(body.ok ? 200 : 503).json(body);
}

router.get("/healthz/clinical", sendClinicalRuntimeHealth);
router.get("/admin/clinical-runtime-health", sendClinicalRuntimeHealth);

/**
 * GET /healthz/reliability
 *
 * Live API latency/error snapshot + code-defined SLO targets for web/iOS/API.
 * No secrets, no PHI, no request bodies. Safe for ops dashboards / smoke scripts.
 */
/**
 * GET /api/client-config
 * Public delivery contract: environment, feature flags, min client versions, rollback steps.
 * Optional headers: X-Client-Platform, X-Client-Version, X-Client-Api-Contract
 */
router.get("/client-config", (req, res) => {
  const platform = String(req.get("x-client-platform") || "").toLowerCase();
  const version = req.get("x-client-version") || undefined;
  const contractRaw = req.get("x-client-api-contract");
  const clientApiContract = contractRaw ? Number(contractRaw) : null;
  const cfg = buildClientConfig(process.env, {
    iosAppVersion: platform === "ios" ? version : undefined,
    clientApiContract:
      clientApiContract != null && !Number.isNaN(clientApiContract)
        ? clientApiContract
        : null,
  });
  res.json(cfg);
});

router.get("/healthz/reliability", (_req, res) => {
  const metrics = getRequestMetricsSnapshot();
  const evaluations = [
    metrics.p95NonAiMs != null
      ? evaluateAgainstTarget("api.request_p95", metrics.p95NonAiMs)
      : null,
    metrics.p95AiMs != null ? evaluateAgainstTarget("api.ai_p95", metrics.p95AiMs) : null,
    metrics.errorRate != null
      ? evaluateAgainstTarget("api.error_rate", metrics.errorRate)
      : null,
  ].filter(Boolean);

  const anyAlert = evaluations.some((e) => e && e.status === "alert");
  const anyWatch = evaluations.some((e) => e && e.status === "watch");

  res.status(200).json({
    ok: !anyAlert,
    status: anyAlert ? "degraded" : anyWatch ? "watch" : "ok",
    ownership: {
      platform_ops: "Platform / deploy owner — health, 5xx, billing email, Stripe webhook",
      api: "API maintainers — latency, AI timeouts",
      web: "Web maintainers — Core Web Vitals, bundle budgets (measure in Lighthouse/CI)",
      ios: "iOS maintainers — cold start, memory (measure in TestFlight/Instruments)",
    },
    live: metrics,
    evaluations,
    targets: RELIABILITY_TARGETS.map((t) => ({
      id: t.id,
      surface: t.surface,
      metric: t.metric,
      target: t.target,
      alert: t.alert,
      unit: t.unit,
      owner: t.owner,
      notes: t.notes,
    })),
    notes: [
      "Client (web/iOS) targets are contracts for measurement — not live samples from this process.",
      "Fix proven bottlenecks with before/after measurements; do not optimize without data.",
      "Logs omit bodies and redact auth secrets (see logger + safeLog).",
    ],
  });
});

export default router;
