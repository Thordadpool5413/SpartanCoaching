import rateLimit from "express-rate-limit";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { aiUsageDaily, emailUsageDaily } from "@workspace/db";
import type { AuthedRequest } from "./auth/middleware";

const rateLimitHandler = (_req: any, res: any) => {
  res.status(429).json({ error: "Too many requests. Please wait and try again." });
};

/** Prefer member id for authenticated AI routes so one IP shared NAT doesn't starve teams. */
function memberOrIpKey(req: any): string {
  const memberId = (req as AuthedRequest).clientMemberId;
  if (memberId) return `m:${memberId}`;
  // express-rate-limit uses req.ip when behind trust proxy
  return `ip:${req.ip || req.socket?.remoteAddress || "unknown"}`;
}

const common = {
  standardHeaders: true as const,
  legacyHeaders: false as const,
  handler: rateLimitHandler,
  // trust proxy is set on the app; member-keyed generators are intentional
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
};

/** Broad API abuse guard (per IP) */
export const globalApiLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  ...common,
  message: { error: "Too many requests. Please slow down." },
});

/** Login / password / magic-link — tighter than general auth */
export const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  ...common,
  message: { error: "Too many sign-in attempts. Please try again in a few minutes." },
});

/** General auth mutations (set password, change password, etc.) */
export const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  ...common,
  message: { error: "Too many attempts. Please try again later." },
});

/** Self-serve registration — tighter than general API but more generous than login */
export const registerLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  ...common,
  message: { error: "Too many registration attempts from this network. Please try again later." },
});

/** Access request intake */
export const requestAccessLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 6,
  ...common,
  message: { error: "Too many access requests from this network. Please try again later." },
});

/** Contact / inquiry forms */
export const publicFormLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  ...common,
  message: { error: "Too many form submissions. Please try again later." },
});

/** Newsletter */
export const newsletterLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  ...common,
  message: { error: "Too many subscription attempts. Please try again later." },
});

/** Lightweight analytics pings */
export const analyticsLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: memberOrIpKey,
  ...common,
});

export const heavyAiLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  keyGenerator: memberOrIpKey,
  ...common,
});

export const standardAiLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: memberOrIpKey,
  ...common,
});

export const roleplayLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: memberOrIpKey,
  ...common,
});

export const roleplayMessageLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  keyGenerator: memberOrIpKey,
  ...common,
});

export const lightAiLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  keyGenerator: memberOrIpKey,
  ...common,
});

// Sending email from the Spartan domain is more sensitive than generating text.
export const outboundEmailLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: memberOrIpKey,
  ...common,
});

const GLOBAL_DAILY_CAP = 400;
const GLOBAL_DAILY_EMAIL_CAP = 100;

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function getAiUsageToday() {
  const date = getTodayStr();
  const [usage] = await db.select().from(aiUsageDaily).where(sql`${aiUsageDaily.date} = ${date}`);
  return { count: usage?.count ?? 0, cap: GLOBAL_DAILY_CAP, date };
}

export async function globalDailyAiCap(_req: any, res: any, next: any) {
  try {
    const usage = await getAiUsageToday();
    if (usage.count >= GLOBAL_DAILY_CAP) {
      return res.status(429).json({ error: "Daily AI limit reached. Please try again tomorrow." });
    }
    res.once("finish", () => {
      if (res.statusCode < 400) {
        incrementAiUsage().catch((error) => console.error("AI usage accounting failed:", error));
      }
    });
    next();
  } catch (error) {
    console.error("AI daily cap check failed:", error);
    res.status(503).json({ error: "AI tools are temporarily unavailable." });
  }
}

export async function globalDailyEmailCap(_req: any, res: any, next: any) {
  try {
    const date = getTodayStr();
    const [usage] = await db.select().from(emailUsageDaily).where(sql`${emailUsageDaily.date} = ${date}`);
    if ((usage?.count ?? 0) >= GLOBAL_DAILY_EMAIL_CAP) {
      return res.status(429).json({ error: "Daily email limit reached. Please try again tomorrow." });
    }
    res.once("finish", () => {
      if (res.statusCode < 400) {
        incrementEmailUsage().catch((error) => console.error("Email usage accounting failed:", error));
      }
    });
    next();
  } catch (error) {
    console.error("Email daily cap check failed:", error);
    res.status(503).json({ error: "Email tools are temporarily unavailable." });
  }
}

async function incrementAiUsage() {
  const date = getTodayStr();
  await db
    .insert(aiUsageDaily)
    .values({ date, count: 1 })
    .onConflictDoUpdate({ target: aiUsageDaily.date, set: { count: sql`${aiUsageDaily.count} + 1` } });
}

async function incrementEmailUsage() {
  const date = getTodayStr();
  await db
    .insert(emailUsageDaily)
    .values({ date, count: 1 })
    .onConflictDoUpdate({ target: emailUsageDaily.date, set: { count: sql`${emailUsageDaily.count} + 1` } });
}
