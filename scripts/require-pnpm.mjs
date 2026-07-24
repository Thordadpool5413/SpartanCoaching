import { rmSync } from "node:fs";
import { resolve } from "node:path";

const workspaceRoot = resolve(import.meta.dirname, "..");

for (const filename of ["package-lock.json", "yarn.lock"]) {
  rmSync(resolve(workspaceRoot, filename), { force: true });
}

const userAgent = process.env.npm_config_user_agent ?? "";
const npmExecPath = process.env.npm_execpath ?? "";
const packageManagerIsKnown = userAgent.length > 0 || npmExecPath.length > 0;
const runningPnpm =
  userAgent.startsWith("pnpm/") ||
  npmExecPath.toLowerCase().includes("pnpm");

if (packageManagerIsKnown && !runningPnpm) {
  console.error("Use pnpm instead");
  process.exit(1);
}
