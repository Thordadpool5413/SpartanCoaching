import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { registerRoutes } from "./routes/routes";
import { registerAuthRoutes } from "./routes/authRoutes";
import { registerSalesWorkflowRoutes } from "./routes/salesWorkflowRoutes";
import { registerAiToolRoutes } from "./routes/aiToolRoutes";
import { registerBillingRoutes, handleStripeWebhook } from "./billing/billingRoutes";
import { loadSession } from "./auth/middleware";
import { globalApiLimit } from "./rateLimits";
import { logger } from "./lib/logger";
import {
  applySecurityHeaders,
  isAllowedOrigin,
  requireTrustedMutationOrigin,
} from "./security/requestSecurity";

const app: Express = express();

// Correct client IPs behind Replit / reverse proxies (needed for rate limits)
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
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

// Legacy app routes (AI tools gated with requireFieldKit)
registerRoutes(app);

export default app;
