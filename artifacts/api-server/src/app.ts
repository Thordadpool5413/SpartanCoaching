import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { registerRoutes } from "./routes/routes";
import { registerAuthRoutes } from "./routes/authRoutes";
import { registerSalesWorkflowRoutes } from "./routes/salesWorkflowRoutes";
import { registerAiToolRoutes } from "./routes/aiToolRoutes";
import { registerResourceWorkRoutes } from "./routes/resourceWorkRoutes";
import { registerResourceLifecycleRoutes } from "./routes/resourceLifecycleRoutes";
import { registerProviderResourceRoutes } from "./routes/providerResourceRoutes";
import { registerUniversalSearchRoutes } from "./routes/universalSearchRoutes";
import { registerPersonalizationRoutes } from "./routes/personalizationRoutes";
import { registerNotificationRoutes } from "./routes/notificationRoutes";
import { registerBillingRoutes, handleStripeWebhook } from "./billing/billingRoutes";
import { loadSession } from "./auth/middleware";
import { globalApiLimit } from "./rateLimits";
import { logger } from "./lib/logger";
import {
  applySecurityHeaders,
  isAllowedOrigin,
  requireTrustedMutationOrigin,
} from "./security/requestSecurity";
import { recordHttpRequest } from "./observability/requestMetrics";
import { evaluateAgainstTarget } from "./observability/reliabilityTargets";
import {
  API_CONTRACT_VERSION,
  MIN_IOS_APP_VERSION,
  checkIosCompatibility,
} from "@workspace/field-kit-catalog";

const app: Express = express();

// Correct client IPs behind Replit / reverse proxies (needed for rate limits)
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    // Do not log request/response bodies — serializers keep method + path only.
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
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

/** In-process latency / error metrics for /api/healthz/reliability (HSP-43). */
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const pathOnly = (req.originalUrl || req.url || "/").split("?")[0] || "/";
    recordHttpRequest({
      path: pathOnly,
      method: req.method,
      statusCode: res.statusCode,
      durationMs,
    });
    // Slow non-AI request watch — log path + ms only (no body).
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
app.use(requireTrustedMutationOrigin);

// Stripe webhooks need the raw body for signature verification — mount BEFORE json parser
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
  (req, res) => {
    void handleStripeWebhook(req, res);
  },
);

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.FORM_BODY_LIMIT || "256kb" }));

// Load client session (cookie or Bearer) for every request before route handlers
app.use(loadSession);

/**
 * Optional iOS min-version gate (HSP-44).
 * Only when ENFORCE_MIN_IOS_VERSION=true and client sends X-Client-Platform: ios
 * + X-Client-Version. Prevents a breaking API from silently serving obsolete App Store builds.
 * Exempt: health, client-config, stripe webhook path is mounted earlier.
 */
app.use("/api", (req, res, next) => {
  if (process.env.ENFORCE_MIN_IOS_VERSION !== "true" && process.env.ENFORCE_MIN_IOS_VERSION !== "1") {
    return next();
  }
  const pathOnly = (req.originalUrl || req.url || "").split("?")[0] || "";
  if (
    pathOnly.startsWith("/api/health") ||
    pathOnly.startsWith("/api/healthz") ||
    pathOnly === "/api/client-config" ||
    pathOnly.startsWith("/api/billing/webhook")
  ) {
    return next();
  }
  const platform = String(req.get("x-client-platform") || "").toLowerCase();
  if (platform !== "ios") return next();
  const version = req.get("x-client-version") || "";
  const minIos = process.env.MIN_IOS_APP_VERSION?.trim() || MIN_IOS_APP_VERSION;
  const contractRaw = req.get("x-client-api-contract");
  const clientApiContract = contractRaw ? Number(contractRaw) : undefined;
  const check = checkIosCompatibility(version, {
    minIosAppVersion: minIos,
    apiContractVersion: API_CONTRACT_VERSION,
    clientApiContract:
      clientApiContract != null && !Number.isNaN(clientApiContract)
        ? clientApiContract
        : undefined,
  });
  if (check.ok) return next();
  return res.status(426).json({
    error: "Client upgrade required",
    code: "CLIENT_UPGRADE_REQUIRED",
    reason: check.reason,
    minIosAppVersion: check.minIosAppVersion,
    apiContractVersion: check.apiContractVersion,
  });
});

// Global API abuse guard (auth + tools + public forms)
app.use("/api", globalApiLimit);

// Health + scaffold routes
app.use("/api", router);

// Auth (request-access, login, Access Desk)
registerAuthRoutes(app);

// Stripe billing (checkout, portal, status) — Phase 1
registerBillingRoutes(app);

// Continuous rep workflow (Sales Command Center)
registerSalesWorkflowRoutes(app);

// Shared Spartan AI tools and clinical case workspace.
registerAiToolRoutes(app);

// Executable resource saved work (HSP-26)
registerResourceWorkRoutes(app);

// Resource versioning / publishing / retirement (HSP-27)
registerResourceLifecycleRoutes(app);

// Provider-owned private resource libraries (HSP-28)
registerProviderResourceRoutes(app);

// Universal multi-type search (HSP-36)
registerUniversalSearchRoutes(app);

// Favorites, recents, continue, recommended today (HSP-37)
registerPersonalizationRoutes(app);

// Notifications, preferences, secure deep links (HSP-38)
registerNotificationRoutes(app);

// Legacy app routes (AI tools gated with requireFieldKit)
registerRoutes(app);

export default app;
