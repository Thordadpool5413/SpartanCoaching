import { router, type Href } from "expo-router";

/**
 * Return through real navigation history when it exists.
 * Deep links, reloads, and route replacements may not have history, so every
 * custom back action must also name its logical parent.
 */
export function goBackOrReplace(fallback: Href) {
  const canGoBack = typeof router.canGoBack === "function" && router.canGoBack();
  if (canGoBack) {
    router.back();
    return;
  }
  router.replace(fallback);
}
