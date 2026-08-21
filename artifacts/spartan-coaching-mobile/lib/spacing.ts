/**
 * Re-export design-token spacing for mobile screens.
 * Prefer these over magic numbers.
 */
export { spacing, radius } from "@workspace/design-tokens";

/** Common layout paddings */
export const layout = {
  screenX: 22,
  sectionY: 28,
  sectionGap: 24,
  cardGap: 14,
  cardPadding: 20,
  tabBarClearance: 90,
  stickyCtaHeight: 48,
  touchMin: 44,
} as const;
