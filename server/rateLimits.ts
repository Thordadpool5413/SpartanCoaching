import rateLimit from "express-rate-limit";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { aiUsageDaily } from "@shared/schema";

const rateLimitHandler = (_req: any, res: any) => {
  res.status(429).json({ error: "Too many requests. Please wait and try again." });
};

export const heavyAiLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const standardAiLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const roleplayLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const roleplayMessageLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const lightAiLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Sending email from the Spartan domain is more sensitive than generating text.
// Keep this deliberately tight while preserving the intended email-template flow.
export const outboundEmailLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const GLOBAL_DAILY_CAP = 300;

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
    const date = getTodayStr();
    const [usage] = await db
      .insert(aiUsageDaily)
      .values({ date, count: 1 })
      .onConflictDoUpdate({ target: aiUsageDaily.date, set: { count: sql`${aiUsageDaily.count} + 1` } })
      .returning({ count: aiUsageDaily.count });
    if (usage.count > GLOBAL_DAILY_CAP) {
      return res.status(429).json({ error: "Daily AI limit reached. Please try again tomorrow." });
    }
    next();
  } catch (error) {
    console.error("AI daily cap check failed:", error);
    res.status(503).json({ error: "AI tools are temporarily unavailable." });
  }
}
