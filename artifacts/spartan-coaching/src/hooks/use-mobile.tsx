/**
 * Re-export shared breakpoint helpers so existing imports keep working.
 * Prefer useBreakpoint when you need tablet/laptop/desktop distinction.
 */
export { useIsMobile, useBreakpoint } from "@/hooks/use-breakpoint";
export type { Breakpoint } from "@/hooks/use-breakpoint";
