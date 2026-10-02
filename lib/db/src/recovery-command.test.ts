import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { libDbPackageRoot } from "./migrate-manifest";

describe("synthetic recovery command boundary", () => {
  for (const [label, mode, url] of [
    [
      "missing explicit environment",
      "",
      "postgres://synthetic:synthetic@localhost/ci",
    ],
    [
      "remote target",
      "synthetic",
      "postgres://synthetic:synthetic@remote.invalid/ci",
    ],
    [
      "libpq routing query",
      "synthetic",
      "postgres://synthetic:synthetic@localhost/ci?host=remote.invalid",
    ],
  ]) {
    it(`refuses ${label} before database access without leaking diagnostics`, () => {
      const result = spawnSync(
        process.execPath,
        ["--import", "tsx", "scripts/backup-restore-drill.ts"],
        {
          cwd: libDbPackageRoot(),
          encoding: "utf8",
          timeout: 15000,
          env: {
            ...process.env,
            RECOVERY_ENVIRONMENT: mode,
            RECOVERY_TEST_DATABASE_URL: url,
          },
        },
      );
      expect(result.status).toBe(2);
      expect(result.stderr).toContain(
        "SYNTHETIC_RECOVERY_CONFIGURATION_FAILED",
      );
      expect(result.stderr + result.stdout).not.toContain(url);
      expect(result.stderr + result.stdout).not.toContain(
        "P03_SYNTHETIC_RECOVERY_SENTINEL",
      );
    }, 20000);
  }
});
