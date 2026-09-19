import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const files = [
  "lib/api-zod/src/generated/api.ts",
  "lib/api-zod/src/index.ts",
  "lib/api-zod/src/generated/types/index.ts",
  "lib/api-client-react/src/index.ts",
];
const before = files.map((file) => readFileSync(file, "utf8"));
execFileSync("node", ["scripts/normalize-api-codegen.mjs"], { stdio: "ignore" });
const after = files.map((file) => readFileSync(file, "utf8"));
assert.deepEqual(after, before, "API codegen normalization is not idempotent");

const generated = after[0];
assert.doesNotMatch(generated, /zod\.(uuid|email|looseObject)\(/, "Zod 4-only API emitted");
const zodExports = after[1].split("\n").filter(Boolean);
assert.equal(new Set(zodExports).size, zodExports.length, "duplicate API barrel exports");
assert.doesNotMatch(after[0], /\n\n\n+/, "blank accumulation in generated API");