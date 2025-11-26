import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";

// Type declaration must be at top level
declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

const app = express();
const server = createServer(app);

// CRITICAL: Health check endpoint for deployment - must be registered first
// Use /healthz (not "/" which needs to serve frontend HTML)
app.get("/healthz", (_req, res) => {
  res.status(200).send("OK");
});

// Start server IMMEDIATELY - before importing anything else
const port = parseInt(process.env.PORT || '5000', 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
  
  // ALL other initialization happens AFTER server is listening
  setImmediate(async () => {
    try {
      // Dynamic imports to avoid any module-level initialization blocking startup
      const { registerRoutes, deferredInit } = await import("./routes");
      const { setupVite, serveStatic, log } = await import("./vite");
      const { seedDatabase } = await import("./seed");

      // Add middleware
      app.use(express.json({
        verify: (req: any, _res, buf) => {
          req.rawBody = buf;
        }
      }));
      app.use(express.urlencoded({ extended: false }));

      // Request logging middleware
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

      // Register API routes
      registerRoutes(app);

      // Error handler
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
      });

      // Setup Vite or static serving
      if (process.env.NODE_ENV === "development") {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }

      // Initialize auth
      log("Starting deferred initialization...");
      await deferredInit(app);

      // Seed database
      log("Starting database seed...");
      await seedDatabase();
      log("All initialization completed successfully");
    } catch (error: any) {
      console.error("Initialization error:", error?.message || error);
    }
  });
});
