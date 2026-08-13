/**
 * Guard drizzle-kit push / push-force (pass 3 — migrate is primary).
 *
 * - Refuses production-looking DATABASE_URL unless ALLOW_PROD_PUSH=true
 * - Prints deprecation notice: prefer pnpm db:migrate
 * - Invokes drizzle-kit with remaining args
 *
 * Usage (via package scripts):
 *   pnpm --filter @workspace/db run push
 *   pnpm --filter @workspace/db run push-force
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { looksProductionDatabaseUrl } from "../src/migrate-manifest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.join(__dirname, "..");

const args = process.argv.slice(2);
const force = args.includes("--force");
const drizzleArgs = ["push", "--config", "./drizzle.config.ts", ...args.filter((a) => a !== "--force")];
if (force) {
  drizzleArgs.splice(1, 0, "--force");
}

console.warn(
  "[push-guard] DEPRECATED for production/deploy. Prefer: pnpm db:migrate\n" +
    "[push-guard] push remains for local/dev schema experiments only.",
);

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
if (databaseUrl && looksProductionDatabaseUrl(databaseUrl) && process.env.ALLOW_PROD_PUSH !== "true") {
  console.error(
    "[push-guard] Refusing drizzle push against production-looking DATABASE_URL.\n" +
      "  Use: ALLOW_PROD_MIGRATE=true REQUIRE_BACKUP_DRILL=true pnpm db:migrate\n" +
      "  Override only with ALLOW_PROD_PUSH=true (not recommended).",
  );
  process.exit(2);
}

const result = spawnSync(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["exec", "drizzle-kit", ...drizzleArgs],
  { stdio: "inherit", env: process.env, cwd: packageRoot },
);

process.exit(result.status ?? 1);
