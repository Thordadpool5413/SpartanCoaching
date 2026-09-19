import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const zodApi = resolve(root, "lib/api-zod/src/generated/api.ts");
let source = readFileSync(zodApi, "utf8")
  .replaceAll("zod.uuid()", "zod.string().uuid()")
  .replaceAll("zod.email()", "zod.string().email()")
  .replaceAll("zod.looseObject(", "looseObject(")
  .replace(/\n{3,}/g, "\n\n")
  .trimEnd();
source = source.replace(
  /const looseObject = <T extends zod\.ZodRawShape>\(shape: T\) => zod\.object\(shape\)\.passthrough\(\);\s*/g,
  "",
);
source = source.replace(
  "import * as zod from 'zod';",
  "import * as zod from 'zod';\n\nconst looseObject = <T extends zod.ZodRawShape>(shape: T) => zod.object(shape).passthrough();",
);
source += "\n";
writeFileSync(zodApi, source);

// These package entry points are intentionally hand-owned. Rewrite them from
// canonical content so repeated codegen runs remain byte-for-byte idempotent.
writeFileSync(
  resolve(root, "lib/api-zod/src/index.ts"),
  'export * from "./generated/api";\nexport type * from "./generated/types";\n',
);
writeFileSync(
  resolve(root, "lib/api-client-react/src/index.ts"),
  'export * from "./generated/api";\n' +
    'export * from "./generated/api.schemas";\n' +
    'export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";\n' +
    'export type { AuthTokenGetter } from "./custom-fetch";\n',
);

// Orval emits runtime schemas and TypeScript aliases with the same names for
// request bodies. Re-export the aliases under a deterministic Type suffix.
const typesIndex = resolve(root, "lib/api-zod/src/generated/types/index.ts");
const apiNames = new Set(
  [...source.matchAll(/export const (\w+)/g)].map((match) => match[1]),
);
const typeLines = readFileSync(typesIndex, "utf8").split(/\r?\n/);
const rewrittenTypes = typeLines.map((line) => {
  const match = line.match(/^export \* from '(.+)';$/);
  if (!match) return line;
  const modulePath = resolve(resolve(typesIndex, ".."), `${match[1].slice(2)}.ts`);
  const moduleText = readFileSync(modulePath, "utf8");
  const name = moduleText.match(/export (?:type|interface) (\w+)/)?.[1];
  return name && apiNames.has(name)
    ? `export type { ${name} as ${name}Type } from '${match[1]}';`
    : line;
});
writeFileSync(typesIndex, `${rewrittenTypes.join("\n").trimEnd()}\n`);

for (const relative of [
  "lib/api-client-react/src/generated/api.ts",
  "lib/api-client-react/src/generated/api.schemas.ts",
]) {
  const file = resolve(root, relative);
  writeFileSync(file, `${readFileSync(file, "utf8").trimEnd()}\n`);
}