import { defineConfig, Plugin } from "vite";
import http from "http";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT || "5000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || "/";

function expoMetroProxy(): Plugin {
  const METRO_PORT = 8081;
  return {
    name: "expo-metro-proxy",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        const accept = req.headers.accept ?? "";

        const shouldProxy =
          accept.includes("application/expo+json") ||
          accept.includes("multipart/mixed") ||
          url.includes(".bundle?platform=") ||
          url.includes(".bundle?") ||
          url.startsWith("/_expo") ||
          (url.includes("platform=") && url.includes("/assets")) ||
          (url.includes("platform=") && url.includes("/node_modules"));

        if (!shouldProxy) {
          next();
          return;
        }

        const proxyReq = http.request(
          {
            hostname: "localhost",
            port: METRO_PORT,
            path: url,
            method: req.method ?? "GET",
            headers: { ...req.headers, host: `localhost:${METRO_PORT}` },
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
          },
        );
        proxyReq.on("error", () => {
          if (!res.headersSent) {
            res.writeHead(502);
          }
          res.end();
        });
        req.pipe(proxyReq, { end: true });
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    expoMetroProxy(),
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  css: {
    postcss: {
      plugins: [
        (await import("tailwindcss")).default,
        (await import("autoprefixer")).default,
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "src/shared"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      "@workspace/spartan-ai-tools": path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "lib",
        "spartan-ai-tools",
        "src",
        "index.ts",
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: false,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
