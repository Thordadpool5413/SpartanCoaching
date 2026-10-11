import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  clinicalBaasConfirmed,
  clinicalRuntimeReadiness,
  resolveClinicalOperationMode,
} from "./runtimeReadiness";
import { syntheticPhiEnvironment } from "../../../../lib/spartan-ai-tools/src/clinical-runtime.test-fixtures";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
function verify(environment: NodeJS.ProcessEnv, requirePhi = true) {
  const result = spawnSync(
    process.execPath,
    [
      "scripts/verify-clinical-production-env.mjs",
      ...(requirePhi ? ["--require-phi"] : []),
    ],
    {
      cwd: root,
      env: environment,
      encoding: "utf8",
      timeout: 5_000,
    },
  );
  expect(result.error).toBeUndefined();
  const report = JSON.parse(
    result.stdout.slice(0, result.stdout.lastIndexOf("}") + 1),
  );
  return { result, report };
}

describe("canonical clinical runtime and offline verifier", () => {
  it("keeps unrequested deidentified education ready", () => {
    expect(clinicalRuntimeReadiness({})).toEqual({
      operationMode: "deidentified",
      ready: true,
      missingControls: [],
      baasConfirmed: false,
    });
    expect(verify({}, false).result.status).toBe(0);
    expect(verify({}).result.status).toBe(1);
  });

  it("requires explicit activation even with confirmed vendor controls", () => {
    const {
      HIPAA_PHI_ENABLED,
      CLINICAL_OPERATION_MODE,
      CLINICAL_PATIENT_REVIEW_ENABLED,
      ...vendors
    } = syntheticPhiEnvironment;
    expect(clinicalBaasConfirmed(vendors)).toBe(true);
    expect(resolveClinicalOperationMode(vendors)).toBe("deidentified");
    expect(clinicalRuntimeReadiness(vendors).ready).toBe(true);
    expect(verify(vendors).result.status).toBe(1);
  });

  it("honors an explicit deidentified override without accepting patient records", () => {
    const env = {
      ...syntheticPhiEnvironment,
      CLINICAL_OPERATION_MODE: "deidentified",
    };
    expect(clinicalRuntimeReadiness(env)).toMatchObject({
      operationMode: "deidentified",
      ready: true,
      missingControls: [],
    });
    expect(verify(env, false).result.status).toBe(0);
    expect(verify(env).result.status).toBe(1);
  });

  it("reports fully configured ZDR PHI readiness without leaking values", () => {
    const runtime = clinicalRuntimeReadiness(syntheticPhiEnvironment);
    expect(runtime).toEqual({
      operationMode: "phi",
      ready: true,
      missingControls: [],
      baasConfirmed: true,
    });
    const { result, report } = verify(syntheticPhiEnvironment);
    expect(result.status).toBe(0);
    expect(report).toMatchObject(runtime);
    for (const value of [
      syntheticPhiEnvironment.OPENAI_API_KEY,
      syntheticPhiEnvironment.CLINICAL_FILE_SCANNER_TOKEN,
      syntheticPhiEnvironment.DATABASE_URL,
      syntheticPhiEnvironment.AI_TOOL_ENCRYPTION_KEY,
    ]) {
      expect(result.stdout + result.stderr).not.toContain(value);
    }
  });

  it.each(Object.keys(syntheticPhiEnvironment))(
    "fails closed and agrees with the verifier when %s is absent",
    (name) => {
      const env: NodeJS.ProcessEnv = { ...syntheticPhiEnvironment };
      delete env[name];
      const runtime = clinicalRuntimeReadiness(env);
      expect(runtime.operationMode).toBe("deidentified");
      expect(runtime.ready).toBe(false);
      expect(runtime.missingControls).toContain(name);
      const { result, report } = verify(env);
      expect(result.status).toBe(1);
      expect(report).toMatchObject(runtime);
      // A requested but incomplete PHI configuration also fails without the CLI flag.
      expect(verify(env, false).result.status).toBe(1);
    },
  );

  it.each(["modified", "unknown", "", "ZDR"])(
    "does not treat retention mode %s as confirmed ZDR",
    (mode) => {
      const env = {
        ...syntheticPhiEnvironment,
        OPENAI_RETENTION_MODE: mode,
        OPENAI_MODIFIED_RETENTION_CONFIRMED: "true",
      };
      const runtime = clinicalRuntimeReadiness(env);
      expect(runtime.ready).toBe(false);
      expect(runtime.missingControls).toContain("OPENAI_RETENTION_MODE");
      expect(verify(env).report).toMatchObject(runtime);
    },
  );

  it("never lets the deprecated Modified Retention flag prove ZDR", () => {
    const env = {
      ...syntheticPhiEnvironment,
      OPENAI_RETENTION_MODE: undefined,
      OPENAI_HIPAA_RETENTION_CONFIRMED: undefined,
      OPENAI_MODIFIED_RETENTION_CONFIRMED: "true",
    };
    expect(clinicalRuntimeReadiness(env).ready).toBe(false);
    expect(verify(env).result.status).toBe(1);
  });

  it.each([
    "OPENAI_BAA_CONFIRMED",
    "OPENAI_HIPAA_RETENTION_CONFIRMED",
    "GOOGLE_CLOUD_BAA_CONFIRMED",
    "PHI_STORAGE_BAA_CONFIRMED",
    "CLINICAL_SCANNER_BAA_CONFIRMED",
    "HIPAA_PHI_ENABLED",
    "CLINICAL_PATIENT_REVIEW_ENABLED",
  ])("requires exact true for %s", (name) => {
    const env = { ...syntheticPhiEnvironment, [name]: "false" };
    expect(clinicalRuntimeReadiness(env).missingControls).toContain(name);
    expect(verify(env).result.status).toBe(1);
  });

  it.each(["ci-placeholder-no-network-calls", "your-api-key", "dummy", "   "])(
    "rejects unusable OpenAI keys (%s) consistently",
    (key) => {
      const env = { ...syntheticPhiEnvironment, OPENAI_API_KEY: key };
      expect(clinicalRuntimeReadiness(env).missingControls).toContain(
        "OPENAI_API_KEY",
      );
      expect(verify(env).result.status).toBe(1);
    },
  );
});
