export {
  API_ERROR_STATUS,
  API_ERROR_MESSAGE,
  CLIENT_CRITICAL_ERROR_CODES,
  buildApiErrorBody,
  adminRequiredStatus,
  statusForApiErrorCode,
  type ApiErrorCode,
  type ApiErrorBody,
} from "./errors";

export {
  API_DEPRECATION_WINDOW_MONTHS,
  MIN_SUPPORTED_IOS_BUILD,
  API_CONTRACT_VERSION,
  API_VERSION_HEADER,
  API_DEPRECATION_HEADER,
  COMPATIBILITY_RULES,
  earliestRemovalDate,
  isPastRemovalDate,
  type DeprecationNotice,
} from "./compatibility";

export {
  SHARED_API_PATHS,
  fieldKitOrSessionGatedPaths,
  type SharedApiPath,
} from "./shared-paths";
