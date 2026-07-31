import app from "./app";
import { logger } from "./lib/logger";
import { startBackgroundJobScheduler } from "./auth/opsJobs";
import { checkWebhookSecretOnStartup } from "./billing/webhookSecretCheck";
import { hydrateBillingEmailMetrics } from "./billing/billingEmailMetrics";
import { clinicalRuntimeReadiness } from "./clinical/runtimeReadiness";
import { ensureBaselineCoverageSnapshot } from "./clinical/coverageBootstrap";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  startBackgroundJobScheduler();

  const clinical = clinicalRuntimeReadiness();
  logger.info(
    {
      operationMode: clinical.operationMode,
      ready: clinical.ready,
      baasConfirmed: clinical.baasConfirmed,
      missingControls: clinical.missingControls,
    },
    "[clinical] Runtime readiness",
  );
  if (clinical.operationMode === "phi") {
    ensureBaselineCoverageSnapshot()
      .then((snapshotId) => {
        logger.info(
          { snapshotId: snapshotId ?? null },
          "[clinical] Coverage snapshot ready",
        );
      })
      .catch((e) => {
        logger.warn(
          { err: (e as Error)?.message || String(e) },
          "[clinical] Coverage baseline bootstrap failed",
        );
      });
  }

  // Non-blocking startup guard: verify webhook secret looks consistent with
  // the endpoint registered in Stripe. Logs a warning if stale; never crashes.
  checkWebhookSecretOnStartup().catch((e) => {
    logger.warn({ err: e?.message || String(e) }, "[stripe] Webhook secret check failed unexpectedly");
  });

  // Backfill in-memory billing-email failure counter from the last 24 h of
  // persisted events so counts survive a redeploy during an active outage.
  hydrateBillingEmailMetrics().catch((e) => {
    logger.warn({ err: (e as Error)?.message || String(e) }, "[billingEmailMetrics] Hydration failed unexpectedly");
  });
});
