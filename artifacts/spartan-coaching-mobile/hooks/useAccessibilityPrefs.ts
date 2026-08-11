import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import {
  DEFAULT_ACCESSIBILITY_PREFS,
  readAccessibilityPrefs,
  type AccessibilityPrefs,
} from "@/lib/iosProductQuality";

/**
 * Live system accessibility preferences (Reduce Motion, Transparency, etc.).
 */
export function useAccessibilityPrefs(): AccessibilityPrefs {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULT_ACCESSIBILITY_PREFS);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let mounted = true;
    void readAccessibilityPrefs().then((p) => {
      if (mounted) setPrefs(p);
    });

    const subs = [
      AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => {
        setPrefs((prev) => ({ ...prev, reduceMotion: v }));
      }),
      AccessibilityInfo.addEventListener("reduceTransparencyChanged", (v) => {
        setPrefs((prev) => ({ ...prev, reduceTransparency: v }));
      }),
      AccessibilityInfo.addEventListener("boldTextChanged", (v) => {
        setPrefs((prev) => ({ ...prev, boldText: v }));
      }),
      AccessibilityInfo.addEventListener("screenReaderChanged", (v) => {
        setPrefs((prev) => ({ ...prev, screenReaderEnabled: v }));
      }),
    ];

    return () => {
      mounted = false;
      for (const s of subs) {
        if (s && typeof (s as { remove?: () => void }).remove === "function") {
          (s as { remove: () => void }).remove();
        }
      }
    };
  }, []);

  return prefs;
}
