import rateLimit from "express-rate-limit";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { aiUsageDaily, emailUsageDaily } from "@workspace/db";

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
