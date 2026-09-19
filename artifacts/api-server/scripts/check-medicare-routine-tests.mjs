import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const packageRoot = process.cwd();
const packageJsonPath = resolve(packageRoot, "package.json");

// Add deliberately non-routine Medicare suites here with a clear reason.
// Paths are relative to the API package root.
const intentionalExclusions = new Map([
  // ["src/medicare-intelligence/example.integration.test.ts", "Requires a live CMS service"],
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }));
  return files.flat();
}

const normalize = (path) => path.replaceAll("\\", "/");
const isTestFile = (path) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path);

function isQualifyingMedicareTest(path) {
  if (!isTestFile(path)) return false;
  if (path.startsWith("src/medicare-intelligence/")) return true;
  return path.startsWith("src/routes/") && /medicare[-_.]?intelligence/i.test(path);
}

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const routineCommand = packageJson.scripts?.test;

if (typeof routineCommand !== "string") {
  console.error('Cannot verify Medicare test coverage: package.json has no "test" script.');
  process.exit(1);
}

const sourceFiles = await walk(resolve(packageRoot, "src"));
const qualifyingTests = sourceFiles
  .map((path) => normalize(relative(packageRoot, path)))
  .filter(isQualifyingMedicareTest)
  .sort();

const staleExclusions = [...intentionalExclusions.keys()]
  .filter((path) => !qualifyingTests.includes(path));
const missingTests = qualifyingTests.filter((path) =>
  !intentionalExclusions.has(path) && !routineCommand.includes(path)
);

if (staleExclusions.length > 0 || missingTests.length > 0) {
  console.error("Medicare routine test coverage is out of date.");
  if (missingTests.length > 0) {
    console.error("\nAdd these qualifying suites to the package test script, or add a documented intentional exclusion:");
    for (const path of missingTests) console.error(`  - ${path}`);
  }
  if (staleExclusions.length > 0) {
    console.error("\nRemove these stale intentional exclusions:");
    for (const path of staleExclusions) console.error(`  - ${path}`);
  }
  process.exit(1);
}

console.log(`Verified ${qualifyingTests.length} Medicare unit/contract suites are covered by the routine test command.`);