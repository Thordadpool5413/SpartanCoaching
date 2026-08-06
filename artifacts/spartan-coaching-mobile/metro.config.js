const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

/**
 * GitHub Actions CI: last-known-green monorepo Metro (watch workspace root so
 * Expo serverRoot-relative entry URLs resolve during static build).
 *
 * Replit / local: never watch monorepo root — pnpm deletes
 * `.local/share/pnpm/_tmp_*` while Metro watches → ENOENT crash.
 */
const isCi =
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.GITHUB_ACTIONS === "true";

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
      // ignore races
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

if (isCi) {
  // Exact green monorepo pattern (CI run #177 and earlier).
  config.watchFolders = [
    ...new Set([...(config.watchFolders ?? []), workspaceRoot]),
  ];
} else {
  // Replit/local: app + shared lib packages only (never monorepo root).
  const safeLocalFolders = [projectRoot, ...collectLibPackages()].filter(
    (dir) => fs.existsSync(dir) && !isUnsafeWatchRoot(dir),
  );
  config.watchFolders = safeLocalFolders;

  const blockPatterns = [
    /[/\\]\.local[/\\]/,
    /[/\\]\.git[/\\]/,
    /[/\\]\.metro-cache[/\\]/,
    /[/\\]pnpm[/\\]_tmp_/,
    /[/\\]\.pnpm-store[/\\]/,
    /[/\\]attached_assets[/\\]/,
    /[/\\]coverage[/\\]/,
  ];

  const existing = config.resolver?.blockList;
  const parts = [];
  if (Array.isArray(existing)) {
    for (const item of existing) {
      if (item instanceof RegExp) parts.push(item.source);
      else if (typeof item === "string" && item) parts.push(item);
    }
  } else if (existing instanceof RegExp) {
    parts.push(existing.source);
  } else if (typeof existing === "string" && existing) {
    parts.push(existing);
  }
  for (const re of blockPatterns) parts.push(re.source);

  config.resolver = {
    ...config.resolver,
    blockList: new RegExp(parts.map((p) => `(?:${p})`).join("|")),
  };

  config.watcher = {
    ...config.watcher,
    healthCheck: {
      enabled: true,
      interval: 30_000,
      timeout: 5_000,
    },
  };

  // Never re-introduce unsafe watch roots.
  config.watchFolders = (config.watchFolders || []).filter(
    (d) => !isUnsafeWatchRoot(d),
  );
}

// Monorepo package resolution (needed in both CI and Replit).
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ],
  unstable_enablePackageExports: true,
};

module.exports = config;
