import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

const app = express();
const server = createServer(app);

// CRITICAL: Health check endpoint for deployment - must be registered first
app.get("/healthz", (_req, res) => {
  res.status(200).send("OK");
});

// Start server IMMEDIATELY
const port = parseInt(process.env.PORT || '5000', 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
  
  // Initialize in priority order - frontend serving FIRST
  setImmediate(async () => {
    try {
      const { setupVite, serveStatic, log } = await import("./vite");
      
      // PRIORITY 1: Setup Vite/static serving IMMEDIATELY so "/" responds
      if (process.env.NODE_ENV === "development") {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }
      log("Frontend serving ready");

      // PRIORITY 2: Add middleware and routes (doesn't block frontend)
      const { registerRoutes, deferredInit } = await import("./routes");
      
      app.use(express.json({
        verify: (req: any, _res, buf) => {
          req.rawBody = buf;
        }
      }));
      app.use(express.urlencoded({ extended: false }));

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

      registerRoutes(app);

      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
      });

      // PRIORITY 3: Background initialization (non-blocking)
      // These run in background and don't block request handling
      setImmediate(async () => {
        try {
          log("Starting background initialization...");
          await deferredInit(app);
          
          // Only seed in development, skip in production for faster startup
          if (process.env.NODE_ENV !== "production") {
            const { seedDatabase } = await import("./seed");
            log("Starting database seed...");
            await seedDatabase();
          }
          log("Background initialization completed");
        } catch (error: any) {
          console.error("Background initialization error:", error?.message || error);
        }
      });

    } catch (error: any) {
      console.error("Initialization error:", error?.message || error);
    }
  });
});
