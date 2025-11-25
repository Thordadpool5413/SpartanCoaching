import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, deferredInit } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";

const app = express();

// Health check endpoint - MUST be first and respond immediately
// This ensures deployment health checks pass before any other initialization
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Root health check fallback for deployments that check /
app.get("/", (_req, res, next) => {
  // Only respond to health checks (no accept header or json accept)
  const acceptHeader = _req.headers.accept || "";
  if (acceptHeader.includes("text/html")) {
    // Let it fall through to the static file handler
    next();
  } else {
    // Respond immediately for health checks
    res.status(200).json({ status: "ok" });
  }
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Synchronous route registration - no async operations that would delay startup
const server = registerRoutes(app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
});

// ALWAYS serve the app on the port specified in the environment variable PORT
// Other ports are firewalled. Default to 5000 if not specified.
// this serves both the API and the client.
// It is the only port that is not firewalled.
const port = parseInt(process.env.PORT || '5000', 10);

// Start listening IMMEDIATELY - health checks need fast response
server.listen({
  port,
  host: "0.0.0.0",
  reusePort: true,
}, () => {
  log(`serving on port ${port}`);
  
  // ALL async initialization happens AFTER server is listening
  // This ensures health checks pass immediately
  setImmediate(async () => {
    try {
      // Setup Vite or static serving (deferred)
      if (app.get("env") === "development") {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }
      
      // Initialize auth (deferred)
      log("Starting deferred initialization...");
      await deferredInit(app);
      
      // Seed database (deferred)
      log("Starting database seed...");
      await seedDatabase();
      log("All deferred initialization completed successfully");
    } catch (error: any) {
      log(`Warning: Deferred initialization failed - ${error?.message || 'Unknown error'}`);
      console.error("Full initialization error:", error);
    }
  });
});
