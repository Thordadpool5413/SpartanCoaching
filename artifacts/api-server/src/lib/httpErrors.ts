/**
 * Safe client-facing error helpers — never echo raw driver/OpenAI stacks in production.
 */
export function clientErrorMessage(
  error: unknown,
  fallback: string,
  opts?: { allowMessageInDev?: boolean },
): string {
  const allowDev = opts?.allowMessageInDev !== false;
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.REPLIT_DEPLOYMENT === "1" ||
    process.env.REPLIT_DEPLOYMENT === "true";
  if (!isProd && allowDev && error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
