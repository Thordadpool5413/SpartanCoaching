const INTRO_KEY = "spartan_intro_seen";

export function hasSeenIntro(): boolean {
  try {
    return localStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return true;
  }
}

export function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_KEY, "1");
  } catch {
    // ignore
  }
}

/** Paths that should never show the first-visit intro gate */
export function shouldSkipIntro(path: string): boolean {
  const skipPrefixes = [
    "/login",
    "/request-access",
    "/set-password",
    "/forgot-password",
    "/reset-password",
    "/magic-login",
    "/admin",
    "/sign/",
    "/assess/",
    "/assessment",
    "/welcome",
    "/portal",
    "/account",
  ];
  return skipPrefixes.some((p) => path === p || path.startsWith(p));
}
