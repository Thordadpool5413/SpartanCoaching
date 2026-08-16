import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeSingleton) {
    // Use account-default API version from the Stripe SDK package
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

/** Fixed individual weekly price id from Stripe Dashboard / Secrets */
export function getIndividualWeeklyPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_INDIVIDUAL_WEEKLY?.trim();
  if (!priceId) {
    throw new Error("STRIPE_PRICE_INDIVIDUAL_WEEKLY is not configured");
  }
  return priceId;
}

export function getIndividualWeeklyElitePriceId(): string {
  const priceId = process.env.STRIPE_PRICE_INDIVIDUAL_WEEKLY_ELITE?.trim();
  if (!priceId) {
    throw new Error("STRIPE_PRICE_INDIVIDUAL_WEEKLY_ELITE is not configured");
  }
  return priceId;
}

export function getSiteUrl(): string {
  return (
    process.env.SITE_URL ||
    (process.env.REPLIT_DEPLOYMENT_URL ? `https://${process.env.REPLIT_DEPLOYMENT_URL}` : "") ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "") ||
    "https://spartanhospicecoaching.com"
  ).replace(/\/$/, "");
}
