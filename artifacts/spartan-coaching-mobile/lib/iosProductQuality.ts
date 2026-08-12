/**
 * Native iOS product quality helpers (HSP-33).
 *
 * Platform conventions for motion, haptics, Dynamic Type caps, and a shared
 * quality checklist. UI primitives consume these — do not invent per-screen
 * accessibility one-offs when a shared helper exists.
 */

import { AccessibilityInfo, Platform } from "react-native";
import * as Haptics from "expo-haptics";

export const IOS_PRODUCT_QUALITY_VERSION = "ios-product-quality-v1";

/** Cap Dynamic Type so dense field tools stay usable without clipping. */
export const MAX_FONT_SIZE_MULTIPLIER = 1.45;

/** Minimum touch target (Apple HIG). */
export const MIN_TOUCH_TARGET = 44;

/**
 * Product quality dimensions for this vertical slice.
 * Runtime verification still needs device/TestFlight; this is the code contract.
 */
export const IOS_QUALITY_CHECKLIST = [
  "tabs_native_or_classic",
  "safe_areas",
  "keyboard_avoidance",
  "haptics_respect_reduce_motion",
  "loading_error_empty_success",
  "share_and_copy",
  "deep_links",
  "dark_light_mode",
  "voiceover_labels",
  "dynamic_type_caps",
  "reduce_motion",
  "reduce_transparency_tab_bar",
  // HSP-35 accessibility extensions
  "voiceover_traits_and_values",
  "touch_target_min_44",
  "result_panel_status_announcements",
] as const;

export type IosQualityCheckId = (typeof IOS_QUALITY_CHECKLIST)[number];

export type AccessibilityPrefs = {
  reduceMotion: boolean;
  reduceTransparency: boolean;
  boldText: boolean;
  screenReaderEnabled: boolean;
};

export const DEFAULT_ACCESSIBILITY_PREFS: AccessibilityPrefs = {
  reduceMotion: false,
  reduceTransparency: false,
  boldText: false,
  screenReaderEnabled: false,
};

/** Read current AccessibilityInfo flags (async). */
export async function readAccessibilityPrefs(): Promise<AccessibilityPrefs> {
  if (Platform.OS === "web") {
    return { ...DEFAULT_ACCESSIBILITY_PREFS };
  }
  const [reduceMotion, reduceTransparency, boldText, screenReaderEnabled] =
    await Promise.all([
      AccessibilityInfo.isReduceMotionEnabled().catch(() => false),
      AccessibilityInfo.isReduceTransparencyEnabled().catch(() => false),
      AccessibilityInfo.isBoldTextEnabled().catch(() => false),
      AccessibilityInfo.isScreenReaderEnabled().catch(() => false),
    ]);
  return {
    reduceMotion: !!reduceMotion,
    reduceTransparency: !!reduceTransparency,
    boldText: !!boldText,
    screenReaderEnabled: !!screenReaderEnabled,
  };
}

/**
 * Light haptic for list/nav presses — no-op when Reduce Motion is on or non-iOS
 * simulation is fine (Android still gets haptics unless reduced).
 */
export async function impactLight(reduceMotion?: boolean): Promise<void> {
  if (reduceMotion) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Simulator / unsupported
  }
}

export async function impactMedium(reduceMotion?: boolean): Promise<void> {
  if (reduceMotion) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // ignore
  }
}

export async function notifySuccess(reduceMotion?: boolean): Promise<void> {
  if (reduceMotion) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // ignore
  }
}

export async function notifyError(reduceMotion?: boolean): Promise<void> {
  if (reduceMotion) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // ignore
  }
}

/** Press scale for buttons/rows — identity when Reduce Motion. */
export function pressScale(
  pressed: boolean,
  reduceMotion: boolean,
  amount = 0.97,
): { scale: number } {
  if (reduceMotion || !pressed) return { scale: 1 };
  return { scale: amount };
}

/**
 * Tab bar blur intensity — lower when Reduce Transparency is on.
 */
export function tabBarBlurIntensity(
  reduceTransparency: boolean,
  base = 80,
): number {
  return reduceTransparency ? Math.min(24, base * 0.3) : base;
}

/** Blur tint follows system appearance (not hard-coded dark). */
export function tabBarBlurTint(
  colorScheme: "light" | "dark" | null | undefined,
): "light" | "dark" | "default" {
  if (colorScheme === "light") return "light";
  if (colorScheme === "dark") return "dark";
  return "default";
}

export function assertQualityChecklistComplete(
  implemented: readonly IosQualityCheckId[],
): boolean {
  return IOS_QUALITY_CHECKLIST.every((id) => implemented.includes(id));
}
