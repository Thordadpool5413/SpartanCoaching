import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformWithEsbuild } from "vite";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const artifactDir = path.resolve(scriptDir, "..");
const sourceFile = path.join(artifactDir, "src", "lib", "seo-config.ts");
const outputDir = path.join(artifactDir, "dist", "public");

const [configSource, routeManifest] = await Promise.all([
  readFile(sourceFile, "utf8"),
  readFile(path.join(artifactDir, "public", "seo-routes.json"), "utf8"),
]);
const inlinedSource = configSource.replace(
  /import seoRoutes from ["']\.\.\/\.\.\/public\/seo-routes\.json["'];/,
  `const seoRoutes = ${routeManifest};`,
);
const transformed = await transformWithEsbuild(inlinedSource, sourceFile, {
  loader: "ts",
  format: "esm",
  target: "es2022",
});
const moduleSource = transformed.code;

const configModule = await import(
  `data:text/javascript;base64,${Buffer.from(moduleSource).toString("base64")}`,
);
const metadata = Object.fromEntries(
  configModule.PUBLIC_SITEMAP_PATHS.map((pathname) => [
    pathname,
    configModule.getSEOConfig(pathname),
  ]),
);

for (const [pathname, config] of Object.entries(metadata)) {
  if (!config.title || !config.description) {
    throw new Error(`Public route ${pathname} is missing title or description metadata`);
  }
}

await mkdir(outputDir, { recursive: true });
await writeFile(
  path.join(outputDir, "seo-metadata.json"),
  `${JSON.stringify(metadata, null, 2)}\n`,
);