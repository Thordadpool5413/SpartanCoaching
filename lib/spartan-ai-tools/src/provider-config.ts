/**
 * Whether an OpenAI API key is usable for live calls.
 *
 * Rejects empty values and known CI/docs placeholders so environments that
 * inject non-secret stand-ins (e.g. GitHub Actions OPENAI_API_KEY) fail closed
 * with PROVIDER_NOT_CONFIGURED instead of attempting a doomed auth call.
 */
export function isUsableOpenAiApiKey(
  key: string | undefined | null,
): key is string {
  const value = key?.trim() ?? "";
  if (!value) return false;

  const lower = value.toLowerCase();
  if (
    lower.includes("placeholder") ||
    lower.includes("your-api-key") ||
    lower.includes("your_api_key") ||
    lower.includes("xxx") ||
    lower === "changeme" ||
    lower === "test" ||
    lower === "dummy" ||
    lower === "secret" ||
    lower.startsWith("ci-") ||
    lower.startsWith("example")
  ) {
    return false;
  }

  return true;
}
