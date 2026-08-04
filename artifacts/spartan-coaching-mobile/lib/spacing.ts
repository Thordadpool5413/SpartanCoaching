/**
 * Re-export design-token spacing for mobile screens.
 * Prefer these over magic numbers.
 */
export { spacing, radius } from "@workspace/design-tokens";

/** Common layout paddings */
export const layout = {
  screenX: 16,
  sectionY: 16,
  tabBarClearance: 90,
  stickyCtaHeight: 48,
  touchMin: 44,
} as const;
