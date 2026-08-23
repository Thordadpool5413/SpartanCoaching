/**
 * Accept a client return URL only when it resolves to the configured site
 * origin. String-prefix checks are unsafe: `https://trusted.example.evil` has
 * the trusted prefix but is an attacker-controlled origin.
 */
export function trustedReturnUrl(
  siteUrl: string,
  requestedUrl: unknown,
  fallbackPath: string,
): string {
  const fallback = new URL(fallbackPath, siteUrl).toString();
  if (typeof requestedUrl !== "string" || !requestedUrl.trim()) return fallback;

  try {
    const expectedOrigin = new URL(siteUrl).origin;
    const candidate = new URL(requestedUrl);
    return candidate.origin === expectedOrigin ? candidate.toString() : fallback;
  } catch {
    return fallback;
  }
}