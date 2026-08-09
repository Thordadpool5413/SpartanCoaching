/**
 * Production / release preflight — prints issue codes and subjects only.
 *
 *   pnpm --filter @workspace/env-config run preflight
 *   APP_ENV=staging pnpm --filter @workspace/env-config run preflight
 */
import {
  formatIssuesForLog,
  resolveAppEnv,
  runProductionPreflight,
  validateServerStartupConfig,
} from "./validate";
import { ENV_CATALOG, secretCatalogEntries } from "./catalog";
import { ENV_ARCHITECTURE_SUMMARY } from "./architecture";

const mode = process.argv.includes("--server") ? "server" : "production";
const result =
  mode === "server"
    ? validateServerStartupConfig(process.env)
    : runProductionPreflight(process.env);

const report = {
  mode,
  appEnv: result.appEnv,
  ok: result.ok,
  fatal: result.fatal,
  issueCount: result.issues.length,
  issues: result.issues.map((i) => ({
    severity: i.severity,
    code: i.code,
    subject: i.subject,
    message: i.message,
  })),
  architecture: ENV_ARCHITECTURE_SUMMARY[result.appEnv],
  catalogStats: {
    total: ENV_CATALOG.length,
    secrets: secretCatalogEntries().length,
  },
  resolvedAppEnvHint: resolveAppEnv(process.env),
};

console.log(JSON.stringify(report, null, 2));
console.log(`Issues: ${formatIssuesForLog(result.issues)}`);

if (result.fatal || !result.ok) {
  process.exit(result.fatal ? 2 : 1);
}
process.exit(0);
