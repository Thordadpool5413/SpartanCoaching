/**
 * One-time post-subscribe / unlock ceremony (AsyncStorage).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const seenKey = (memberId: number | string) => `hsp_activation_seen_v1_${memberId}`;
const CHECKOUT_PENDING_KEY = "hsp_checkout_pending_v1";
const STRIPE_OPENED_KEY = "hsp_stripe_opened_v1";

export async function hasSeenActivation(memberId: number): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(seenKey(memberId))) === "1";
  } catch {
    return true; // fail closed — don't loop modals
  }
}

export async function markActivationSeen(memberId: number): Promise<void> {
  try {
    await AsyncStorage.setItem(seenKey(memberId), "1");
  } catch {
    // ignore
  }
}

/** Set when user leaves app for Stripe Checkout */
export async function markCheckoutPending(): Promise<void> {
  try {
    await AsyncStorage.setItem(CHECKOUT_PENDING_KEY, "1");
    await AsyncStorage.setItem(STRIPE_OPENED_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export async function clearCheckoutPending(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHECKOUT_PENDING_KEY);
    await AsyncStorage.removeItem(STRIPE_OPENED_KEY);
  } catch {
    // ignore
  }
}

export async function isCheckoutPending(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CHECKOUT_PENDING_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function wasStripeOpenedRecently(maxAgeMs = 1000 * 60 * 30): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STRIPE_OPENED_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < maxAgeMs;
  } catch {
    return false;
  }
}
