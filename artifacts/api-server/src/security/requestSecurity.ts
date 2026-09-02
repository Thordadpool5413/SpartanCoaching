import type { NextFunction, Request, Response } from "express";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const SESSION_COOKIE_NAME = "spartan_session";

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function configuredOrigins(env: NodeJS.ProcessEnv = process.env): Set<string> {
  const values = [
    env.SITE_URL,
    env.APP_URL,
    env.REPLIT_DEPLOYMENT_URL ? `https://${env.REPLIT_DEPLOYMENT_URL}` : undefined,
    env.REPLIT_DEV_DOMAIN ? `https://${env.REPLIT_DEV_DOMAIN}` : undefined,
  ];
  const origins = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    const normalized = normalizeOrigin(value);
    if (normalized) origins.add(normalized);
  }
  if (env.NODE_ENV !== "production") {
    origins.add("http://localhost:5173");
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:5173");
    origins.add("http://127.0.0.1:3000");
  }
  return origins;
}

export function isAllowedOrigin(origin: string | undefined, env = process.env): boolean {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  if (configuredOrigins(env).has(normalized)) return true;
  if (env.NODE_ENV !== "production") {
    try {
      const url = new URL(normalized);
      return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Cookie-authenticated unsafe requests are ambient-authority requests and must
 * originate from this application. Bearer tokens and verified provider/cron
 * webhooks are not cookie-authenticated and use their own authentication.
 */
export function requireTrustedMutationOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (SAFE_METHODS.has(req.method.toUpperCase()) || !req.path.startsWith("/api")) {
    return next();
  }

  const hasSessionCookie = Boolean(req.cookies?.[SESSION_COOKIE_NAME]);
  const hasBearer = req.headers.authorization?.startsWith("Bearer ");
  if (!hasSessionCookie || hasBearer) return next();

  const origin = req.headers.origin;
  if (!origin || !isAllowedOrigin(origin)) {
    return res.status(403).json({
      error: "Request origin is not allowed",
      code: "CSRF_ORIGIN_REJECTED",
    });
  }
  return next();
}

export function applySecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com; media-src 'self' blob:; worker-src 'self' blob:; manifest-src 'self'",
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}
