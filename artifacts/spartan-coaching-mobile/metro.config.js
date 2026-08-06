const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

/**
 * Replit: workspace root often contains `.local/share/pnpm/_tmp_*` which pnpm
 * deletes while Metro watches → ENOENT crash (FallbackWatcher).
 * GitHub Actions CI: no such path — watching monorepo root is required for
 * correct Expo static bundle resolution during `pnpm run build`.
 */
function collectLibPackages() {
  const libRoot = path.join(workspaceRoot, "lib");
  const folders = [];
  if (!fs.existsSync(libRoot)) return folders;
  for (const name of fs.readdirSync(libRoot)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = path.join(libRoot, name);
    try {
      if (fs.statSync(full).isDirectory()) folders.push(full);
    } catch {
      // ignore
    }
  }
  const integrations = path.join(libRoot, "integrations");
  if (fs.existsSync(integrations)) {
    for (const name of fs.readdirSync(integrations)) {
      if (name.startsWith(".")) continue;
      const full = path.join(integrations, name);
      try {
        if (fs.statSync(full).isDirectory()) folders.push(full);
      } catch {
        // ignore
      }
    }
  }
  return folders;
}

function isUnsafeWatchRoot(dir) {
  const n = path.normalize(dir).replace(/\\/g, "/");
  if (n.includes("/.local/") || n.endsWith("/.local")) return true;
  if (n.includes("/pnpm/_tmp_") || n.includes("/.pnpm-store")) return true;
  return false;
}

const isCi =
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.GITHUB_ACTIONS === "true";

const safeLocalFolders = [projectRoot, ...collectLibPackages()].filter(
  (dir) => fs.existsSync(dir) && !isUnsafeWatchRoot(dir),
);

if (isCi) {
  // Full monorepo watch for correct bundle graph (GitHub runners have no .local temps).
  config.watchFolders = Array.from(
    new Set([projectRoot, workspaceRoot, ...collectLibPackages()].filter(fs.existsSync)),
  );
} else {
  // Replit / local: never watch monorepo root (siblings include .local).
  config.watchFolders = safeLocalFolders;
}

config.projectRoot = projectRoot;

const blockPatterns = [
  /[/\\]\.local[/\\]/,
  /[/\\]\.git[/\\]/,
  /[/\\]\.metro-cache[/\\]/,
  /[/\\]pnpm[/\\]_tmp_/,
  /[/\\]\.pnpm-store[/\\]/,
  /[/\\]attached_assets[/\\]/,
  /[/\\]coverage[/\\]/,
];

function mergeBlockList(existing, extras) {
  const parts = [];
  if (existing instanceof RegExp) parts.push(existing.source);
  else if (typeof existing === "string" && existing) parts.push(existing);
  for (const re of extras) parts.push(re.source);
  return new RegExp(parts.map((p) => `(?:${p})`).join("|"));
}

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ],
  blockList: mergeBlockList(config.resolver?.blockList, blockPatterns),
  unstable_enablePackageExports: true,
};

config.watcher = {
  ...config.watcher,
  healthCheck: {
    enabled: true,
    interval: 30_000,
    timeout: 5_000,
  },
};

// Final sanitize — never allow .local watch roots even if Expo mutates the list.
const rawFolders = config.watchFolders || [];
config.watchFolders = rawFolders.filter((d) => !isUnsafeWatchRoot(d));

module.exports = config;
