import { spawn } from "node:child_process";

const port = String(18_000 + Math.floor(Math.random() * 1_000));
const child = spawn(
  process.execPath,
  ["--enable-source-maps", "artifacts/api-server/dist/index.mjs"],
  {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      PORT: port,
      SITE_URL: `http://127.0.0.1:${port}`,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://postgres:postgres@127.0.0.1:59999/spartan",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let stderr = "";
child.stderr.on("data", (chunk) => {
  stderr = `${stderr}${chunk}`.slice(-4_000);
});

try {
  let response;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      response = await fetch(`http://127.0.0.1:${port}/api/healthz`);
      if (response.ok) break;
    } catch {
      // The server is still starting.
    }
  }
  if (!response?.ok) {
    throw new Error(`Built API did not become healthy.\n${stderr}`);
  }
  const body = await response.json();
  if (body.status !== "ok") {
    throw new Error(`Unexpected health response: ${JSON.stringify(body)}`);
  }
  console.log(`Built API health smoke passed on port ${port}`);
} finally {
  child.kill("SIGTERM");
}
