import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import {
  getBillingEmailMetrics,
  isHydrationComplete,
} from "../billing/billingEmailMetrics";
import { clinicalRuntimeReadiness } from "../clinical/runtimeReadiness";
import { coverageUsesEducationalBaseline } from "../clinical/coverageBootstrap";

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
router.get("/healthz", (_req, res) => {
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
});

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

export default router;
