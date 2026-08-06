const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const workspaceRoot = path.resolve(__dirname, "../..");
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

/**
 * Do NOT watch the entire monorepo root.
 * On Replit, pnpm writes ephemeral dirs under:
 *   <workspace>/.local/share/pnpm/_tmp_*
 * Metro FallbackWatcher crashes with ENOENT when those dirs are deleted mid-watch
 * (Error: ENOENT: no such file or directory, watch '.../pnpm/_tmp_...').
 *
 * Only watch project sources + shared lib packages + workspace node_modules.
 */
config.watchFolders = [
  projectRoot,
  path.resolve(workspaceRoot, "lib"),
  path.resolve(workspaceRoot, "node_modules"),
];

/** Paths Metro must never crawl or watch */
const blockPatterns = [
  /[/\\]\.local[/\\]/,
  /[/\\]\.git[/\\]/,
  /[/\\]\.metro-cache[/\\]/,
  /[/\\]pnpm[/\\]_tmp_/,
  /[/\\]\.pnpm-store[/\\]/,
  /[/\\]dist[/\\]/,
  /[/\\]coverage[/\\]/,
  /[/\\]attached_assets[/\\]/,
];

function mergeBlockList(existing, extras) {
  const parts = [];
  if (existing) {
    if (existing instanceof RegExp) parts.push(existing.source);
    else if (typeof existing === "string") parts.push(existing);
  }
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

// Prefer more resilient watching on cloud FS (Replit / containers).
config.watcher = {
  ...config.watcher,
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000,
  },
};

module.exports = config;
