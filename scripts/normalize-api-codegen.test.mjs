import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import ts from "typescript";

const files = [
  "lib/api-zod/src/generated/api.ts",
  "lib/api-zod/src/index.ts",
  "lib/api-zod/src/generated/types/index.ts",
  "lib/api-client-react/src/index.ts",
  "lib/api-client-react/src/generated/api.schemas.ts",
  "lib/api-zod/src/generated/types/knowledgeMetadataQuery.ts",
];
const before = files.map((file) => readFileSync(file, "utf8"));
execFileSync("node", ["scripts/normalize-api-codegen.mjs"], { stdio: "ignore" });
const after = files.map((file) => readFileSync(file, "utf8"));
assert.deepEqual(after, before, "API codegen normalization is not idempotent");

const generated = after[0];
assert.doesNotMatch(generated, /zod\.(uuid|email|url|looseObject|strictObject)\(/, "Zod 4-only API emitted");
const zodExports = after[1].split("\n").filter(Boolean);
assert.equal(new Set(zodExports).size, zodExports.length, "duplicate API barrel exports");
assert.doesNotMatch(after[0], /\n\n\n+/, "blank accumulation in generated API");
for (const output of after.slice(4)) assert.match(output, /export type KnowledgeMetadataQuery = \{\n  versionId\?: never;/);

// Compile real generated types. Both ordinary object literals and predeclared
// invalid variants must fail, while all four valid kinds remain constructible.
const fixture = resolve("knowledge-query-type-regression.ts");
const source = `import type { GetKnowledgeMetadataParams } from "./lib/api-client-react/src/generated/api.schemas";
const sources: GetKnowledgeMetadataParams = {filter:{kind:"sources",domain:"MAC_COVERAGE"}};
const versions: GetKnowledgeMetadataParams = {filter:{kind:"versions",domain:"MAC_COVERAGE"}};
const assignments: GetKnowledgeMetadataParams = {filter:{kind:"assignments",domain:"MAC_COVERAGE"}};
const approvals: GetKnowledgeMetadataParams = {filter:{kind:"approvals",domain:"MAC_COVERAGE",versionId:"synthetic-version"}};
const missing: GetKnowledgeMetadataParams = {filter:{kind:"approvals",domain:"MAC_COVERAGE"}};
const foreignVersion = {kind:"sources" as const,domain:"MAC_COVERAGE" as const,versionId:"synthetic-version"};
const extra: GetKnowledgeMetadataParams = {filter:foreignVersion};`;
const options = {noEmit:true, strict:true, skipLibCheck:true, types:[], target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.ESNext, moduleResolution:ts.ModuleResolutionKind.Bundler};
const host = ts.createCompilerHost(options);
const getSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (file, language, ...rest) => file === fixture ? ts.createSourceFile(file, source, language, true) : getSourceFile(file, language, ...rest);
const errors = ts.getPreEmitDiagnostics(ts.createProgram([fixture], options, host));
assert.equal(errors.length, 2, ts.formatDiagnosticsWithColorAndContext(errors, host));
assert.deepEqual(errors.map(error => [error.file?.fileName, error.code, error.file.getLineAndCharacterOfPosition(error.start).line+1]), [[fixture,2322,6],[fixture,2322,8]]);
