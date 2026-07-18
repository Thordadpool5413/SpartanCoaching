import rateLimit from "express-rate-limit";

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

const GLOBAL_DAILY_CAP = 300;

let globalUsage = {
  date: new Date().toISOString().slice(0, 10),
  count: 0,
};

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function resetIfNewDay() {
  const today = getTodayStr();
  if (globalUsage.date !== today) {
    globalUsage = { date: today, count: 0 };
  }
}

export function getAiUsageToday() {
  resetIfNewDay();
  return { count: globalUsage.count, cap: GLOBAL_DAILY_CAP, date: globalUsage.date };
}

export function globalDailyAiCap(_req: any, res: any, next: any) {
  resetIfNewDay();
  if (globalUsage.count >= GLOBAL_DAILY_CAP) {
    return res.status(429).json({ error: "Daily AI limit reached. Please try again tomorrow." });
  }
  globalUsage.count++;
  next();
}
