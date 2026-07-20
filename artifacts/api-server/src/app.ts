import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { registerRoutes } from "./routes/routes";
import { registerAuthRoutes } from "./routes/authRoutes";
import { loadSession } from "./auth/middleware";
import { logger } from "./lib/logger";

const app: Express = express();

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
    origin: true,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Load Field Kit session (cookie or Bearer) for every request before route handlers
app.use(loadSession);

// Health + scaffold routes
app.use("/api", router);

// Field Kit auth (request-access, login, Access Desk)
registerAuthRoutes(app);

// Legacy app routes (AI tools gated with requireFieldKit)
registerRoutes(app);

export default app;
