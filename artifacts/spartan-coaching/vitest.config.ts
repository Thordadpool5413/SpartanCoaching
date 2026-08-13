import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "src/shared"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      // Dual-schema elimination: same resolution as vite.config.ts
      "@workspace/db/schema": path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "lib",
        "db",
        "src",
        "schema",
        "index.ts",
      ),
      "@workspace/db": path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "lib",
        "db",
        "src",
        "index.ts",
      ),
      "@workspace/field-kit-catalog": path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "lib",
        "field-kit-catalog",
        "src",
        "index.ts",
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.tsx", "src/**/*.test.ts"],
  },
});
