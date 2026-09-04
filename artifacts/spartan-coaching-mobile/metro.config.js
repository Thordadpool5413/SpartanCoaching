const { getDefaultConfig } = require("expo/metro-config");

// Expo SDK 57 detects pnpm workspaces and configures monorepo resolution.
// Keep this intentionally minimal so EAS, CI, and local development all load
// the same Expo transformer and dependency graph.
module.exports = getDefaultConfig(__dirname);
