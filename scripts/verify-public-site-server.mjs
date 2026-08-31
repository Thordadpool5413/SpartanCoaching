#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = path.join(root, "artifacts", "spartan-coaching", "scripts", "serve-public.mjs");
const auditPath = path.join(root, "scripts", "public-site-audit.mjs");
const port = 24173;
const origin = `http://127.0.0.1:${port}`;

const server = spawn(process.execPath, [serverPath], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

let startupOutput = "";
server.stdout.on("data", (chunk) => { startupOutput += chunk; });
server.stderr.on("data", (chunk) => { startupOutput += chunk; });

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Production server exited: ${startupOutput}`);
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(500) });
      if (response.ok) return;
    } catch {
      // Allow the process a moment to bind.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Production server did not become ready: ${startupOutput}`);
}

async function verifyMalformedPathHandling() {
  const malformed = await fetch(`${origin}/%`, { signal: AbortSignal.timeout(1_000) });
  if (malformed.status !== 400) {
    throw new Error(`Malformed path returned ${malformed.status}, expected 400`);
  }
  const healthy = await fetch(origin, { signal: AbortSignal.timeout(1_000) });
  if (!healthy.ok) {
    throw new Error(`Production server did not remain healthy after malformed path: ${healthy.status}`);
  }
}

try {
  await waitForServer();
  await verifyMalformedPathHandling();
  const audit = spawn(process.execPath, [auditPath], {
    cwd: root,
    env: { ...process.env, PUBLIC_SITE_URL: origin },
    stdio: "inherit",
  });
  const exitCode = await new Promise((resolve) => audit.once("exit", (code) => resolve(code ?? 1)));
  process.exitCode = exitCode;
} finally {
  server.kill("SIGTERM");
}