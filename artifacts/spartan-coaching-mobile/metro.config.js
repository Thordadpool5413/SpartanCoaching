const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

/**
 * GitHub Actions CI: watch monorepo root so Expo serverRoot-relative entry
 * URLs resolve during static build (last-known-green pattern).
 *
 * Replit / local: preserve Expo's package-aware monorepo defaults, then add
 * the app, local libraries, and workspace node_modules. Unsafe transient
 * folders remain excluded so deleted pnpm temporary paths cannot crash Metro.
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

// Always pin project root to this package so Metro serves
// project-relative entry URLs (node_modules/expo-router/entry).
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

function mergeBlockList(existing) {
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
  return new RegExp(parts.map((p) => `(?:${p})`).join("|"));
}

if (isCi) {
  // Exact green monorepo pattern (CI run #177 and earlier).
  config.watchFolders = [
    ...new Set([...(config.watchFolders ?? []), workspaceRoot, projectRoot]),
  ];
} else {
  // Preserve Expo defaults. They contain package roots, not the broad
  // workspace root, and are required for Expo Doctor compatibility.
  const workspaceNodeModules = path.join(workspaceRoot, "node_modules");
  const safeLocalFolders = [
    ...(config.watchFolders ?? []),
    projectRoot,
    ...collectLibPackages(),
    workspaceNodeModules,
  ].filter((dir) => fs.existsSync(dir) && !isUnsafeWatchRoot(dir));

  config.watchFolders = [...new Set(safeLocalFolders)];
}

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ],
  blockList: mergeBlockList(config.resolver?.blockList),
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
config.watchFolders = (config.watchFolders || []).filter(
  (d) => !isUnsafeWatchRoot(d),
);

module.exports = config;
