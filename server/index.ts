import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

const app = express();
app.set("trust proxy", 1);
const server = createServer(app);

// CRITICAL: Health check endpoint for deployment - must be registered first
app.get("/healthz", (_req, res) => {
  res.status(200).send("OK");
});

async function main() {
  const { setupVite, serveStatic, log } = await import("./vite");
  const { registerRoutes, deferredInit } = await import("./routes");

  // STEP 1: Add body parsing middleware FIRST
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: false }));

  // STEP 2: Add request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (reqPath.startsWith("/api")) {
        let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
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

  // STEP 3: Register API routes BEFORE Vite/static (critical for /api/* to work)
  registerRoutes(app);
  log("API routes registered");

  // STEP 4: Error handler for API routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // STEP 5: Force a cache-bust redirect so browsers with stale HTML re-fetch fresh markup.
  // Deployments may set BUILD_VERSION to a commit SHA or release identifier.
  // Since browsers have never cached that versioned URL, they fetch fresh HTML, get the
  // no-cache headers below, and will always revalidate on future visits.
  const BUILD_VERSION = process.env.BUILD_VERSION || "dev";
  app.get("/", (req, res, next) => {
    if (!req.query.v) {
      return res.redirect(302, `/?v=${BUILD_VERSION}`);
    }
    next();
  });

  // No-cache headers for all HTML routes so browsers always revalidate
  app.use((req, _res, next) => {
    if (
      !req.path.startsWith("/api") &&
      !req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|mp3|mp4|pdf|json|txt|xml|webmanifest)$/)
    ) {
      _res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      _res.setHeader("Pragma", "no-cache");
      _res.setHeader("Expires", "0");
    }
    next();
  });

  // STEP 6 (was 5): Setup Vite/static serving LAST (catch-all for frontend routes)
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  log("Frontend serving ready");

  // STEP 6: Start listening AFTER everything is initialized
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
  });

  // Graceful shutdown: release the port before the process exits so restarts don't hit EADDRINUSE
  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // STEP 7: Background initialization (non-blocking)
  setImmediate(async () => {
    try {
      log("Starting background initialization...");
      await deferredInit(app);

      try {
        const { checkResendHealth } = await import("./resend");
        await checkResendHealth();
      } catch (resendErr: any) {
        console.error("Resend health check error:", resendErr?.message || resendErr);
      }

      try {
        const { seedDatabase } = await import("./seed");
        log("Starting database seed...");
        await seedDatabase();
      } catch (seedError: any) {
        console.error("Database seed error (non-fatal):", seedError?.message || seedError);
      }
      log("Background initialization completed");
    } catch (error: any) {
      console.error("Background initialization error:", error?.message || error);
    }
  });
}

process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled promise rejection (non-fatal):', reason?.message || reason);
});

main().catch((error) => {
  console.error("Initialization error:", error?.message || error);
  process.exit(1);
});
