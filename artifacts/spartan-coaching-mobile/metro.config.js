const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

/**
 * Replit crash (ENOENT watch .../workspace/.local/share/pnpm/_tmp_*):
 * Expo monorepo detection watches the monorepo ROOT. On Replit, HOME/workspace
 * often contains `.local/share/pnpm/_tmp_*` which pnpm deletes while Metro is
 * still watching → FallbackWatcher throws and Expo exits 7.
 *
 * Fix: never watch the monorepo root or any path under .local / pnpm temps.
 * Watch only this app + concrete shared packages under lib/*.
 * Resolve monorepo deps via nodeModulesPaths without watching those trees.
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
      // ignore races
    }
  }
  // Nested workspace packages e.g. lib/integrations/*
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
  // Never watch monorepo root (siblings include .local on Replit)
  if (path.normalize(dir) === path.normalize(workspaceRoot)) return true;
  return false;
}

const safeWatchFolders = [projectRoot, ...collectLibPackages()].filter(
  (dir) => fs.existsSync(dir) && !isUnsafeWatchRoot(dir),
);

// Hard replace — do not spread prior monorepo roots from getDefaultConfig.
config.projectRoot = projectRoot;
config.watchFolders = safeWatchFolders;

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
  // Resolve workspace packages without adding monorepo root to watchFolders
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ],
  disableHierarchicalLookup: false,
  blockList: mergeBlockList(config.resolver?.blockList, blockPatterns),
  unstable_enablePackageExports: true,
};

// Metro crawler ignore (resolver blockList alone does not stop FS watchers)
const priorIgnore = config.watcher?.additionalExts;
config.watcher = {
  ...config.watcher,
  healthCheck: {
    enabled: true,
    interval: 30_000,
    timeout: 5_000,
  },
};

// Guard: if anything re-introduced monorepo root, strip it at export time
const exported = new Proxy(config, {
  get(target, prop, receiver) {
    if (prop === "watchFolders") {
      const folders = Reflect.get(target, prop, receiver) || [];
      return folders.filter((d) => !isUnsafeWatchRoot(d));
    }
    return Reflect.get(target, prop, receiver);
  },
  set(target, prop, value, receiver) {
    if (prop === "watchFolders" && Array.isArray(value)) {
      return Reflect.set(
        target,
        prop,
        value.filter((d) => !isUnsafeWatchRoot(d)),
        receiver,
      );
    }
    return Reflect.set(target, prop, value, receiver);
  },
});

module.exports = exported;
