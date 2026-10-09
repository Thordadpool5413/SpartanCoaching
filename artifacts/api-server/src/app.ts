import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { knowledgeRouter, sanitizedKnowledgePath } from "./knowledge/control/routes";
import { pool } from "./db";
import router from "./routes";
import { registerRoutes } from "./routes/routes";
import { registerAuthRoutes } from "./routes/authRoutes";
import { registerCompanySeatTransitionRoutes } from "./routes/companySeatTransitionRoutes";
import { registerSalesWorkflowRoutes } from "./routes/salesWorkflowRoutes";
import { registerAiToolRoutes } from "./routes/aiToolRoutes";
import { registerPatientReviewRoutes } from "./routes/patientReviewRoutes";
import { registerResourceWorkRoutes } from "./routes/resourceWorkRoutes";
import { registerResourceLifecycleRoutes } from "./routes/resourceLifecycleRoutes";
import { registerProviderResourceRoutes } from "./routes/providerResourceRoutes";
import { registerUniversalSearchRoutes } from "./routes/universalSearchRoutes";
import { registerPersonalizationRoutes } from "./routes/personalizationRoutes";
import { registerJurisdictionRoutes } from "./routes/jurisdictionRoutes";
import { registerNotificationRoutes } from "./routes/notificationRoutes";
import { registerCoachRoutes } from "./routes/coachRoutes";
import { registerMemberSyncRoutes } from "./routes/memberSyncRoutes";
import { registerAnalyticsRoutes } from "./routes/analyticsRoutes";
import { registerMemberWorkRoutes } from "./routes/memberWorkRoutes";
import { registerNextMoveRoutes } from "./routes/nextMoveRoutes";
import { registerMedicareIntelligenceRoutes } from "./routes/medicareIntelligenceRoutes";
import { registerBillingRoutes, handleStripeWebhook } from "./billing/billingRoutes";
import { loadSession, type AuthedRequest } from "./auth/middleware";
import { requireClinicalJurisdictionContext } from "./clinical/jurisdictionMiddleware";
import { globalApiLimit } from "./rateLimits";
import { logger } from "./lib/logger";
import {
  applySecurityHeaders,
  isAllowedOrigin,
  requireTrustedMutationOrigin,
} from "./security/requestSecurity";
import { recordHttpRequest } from "./observability/requestMetrics";
import { evaluateAgainstTarget } from "./observability/reliabilityTargets";
import { requireCompatibleApiClient } from "./delivery/clientConfig";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: sanitizedKnowledgePath(req.url?.split("?")[0] ?? "/"),
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const pathOnly = sanitizedKnowledgePath((req.originalUrl || req.url || "/").split("?")[0] || "/");
    recordHttpRequest({
      path: pathOnly,
      method: req.method,
      statusCode: res.statusCode,
      durationMs,
    });
    if (!pathOnly.includes("/api/ai") && durationMs > 2000) {
      const evalResult = evaluateAgainstTarget("api.request_p95", durationMs);
      logger.warn(
        {
          path: pathOnly,
          method: req.method,
          statusCode: res.statusCode,
          durationMs: Math.round(durationMs),
          reliability: evalResult?.status,
        },
        "slow_request",
      );
    }
  });
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(applySecurityHeaders);
app.use("/api/knowledge-control", (_req,res,next)=>{res.setHeader("Cache-Control","no-store");next();});
app.use(requireTrustedMutationOrigin);
app.use("/api/knowledge-control", globalApiLimit, requireCompatibleApiClient, knowledgeRouter(pool));
app.set("apiRouteManifest", [
  "POST /api/knowledge-control/:scopeKind/commands",
  "GET /api/knowledge-control/:scopeKind/scope",
  "GET /api/knowledge-control/:scopeKind/metadata",
]);

app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
  (req, res) => {
    void handleStripeWebhook(req, res);
  },
);

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.FORM_BODY_LIMIT || "256kb" }));

app.use(loadSession);

app.use("/api", requireCompatibleApiClient);

app.use("/api", globalApiLimit);
app.use("/api", router);

registerCompanySeatTransitionRoutes(app);
registerAuthRoutes(app);
registerBillingRoutes(app);
registerSalesWorkflowRoutes(app);
app.use("/api/ai-tools/:toolId/ephemeral-runs", (request, response, next) => {
  void requireClinicalJurisdictionContext(request as AuthedRequest, response, next);
});
registerAiToolRoutes(app);
registerPatientReviewRoutes(app);
registerResourceWorkRoutes(app);
registerResourceLifecycleRoutes(app);
registerProviderResourceRoutes(app);
registerUniversalSearchRoutes(app);
registerPersonalizationRoutes(app);
registerJurisdictionRoutes(app);
registerNotificationRoutes(app);
registerCoachRoutes(app);
registerMemberSyncRoutes(app);
registerAnalyticsRoutes(app);
registerMemberWorkRoutes(app);
registerNextMoveRoutes(app);
registerMedicareIntelligenceRoutes(app);
registerRoutes(app);

export default app;
