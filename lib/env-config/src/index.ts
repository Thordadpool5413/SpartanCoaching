export {
  type AppEnvironment,
  type ConfigHome,
  type ConfigSensitivity,
  type EnvVarDefinition,
  CLIENT_PUBLIC_ENV_NAMES,
  ENV_CATALOG,
  FORBIDDEN_CLIENT_VALUE_PATTERNS,
  SECRET_NAME_HINTS,
  catalogByName,
  clientPublicCatalogEntries,
  secretCatalogEntries,
} from "./catalog";

export {
  type ConfigIssue,
  type ConfigIssueSeverity,
  type ValidationResult,
  assertCrossEnvDatabaseSafety,
  findClientBundleSecretLeaks,
  formatIssuesForLog,
  isPresent,
  resolveAppEnv,
  runProductionPreflight,
  validateRequiredForEnv,
  validateServerStartupConfig,
} from "./validate";

export {
  ENV_ARCHITECTURE_SUMMARY,
  homesForEnvironment,
} from "./architecture";
