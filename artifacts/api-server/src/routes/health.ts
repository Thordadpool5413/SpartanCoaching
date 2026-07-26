import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import {
  getBillingEmailMetrics,
  isHydrationComplete,
} from "../billing/billingEmailMetrics";

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

export default router;
