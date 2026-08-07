import * as React from "react";

/**
 * Aligns with Tailwind defaults:
 * sm 640 | md 768 | lg 1024 | xl 1280 | 2xl 1536
 */
export type Breakpoint = "mobile" | "tablet" | "laptop" | "desktop";

function resolveBreakpoint(width: number): Breakpoint {
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  if (width < 1280) return "laptop";
  return "desktop";
}

/**
 * Multi-band breakpoint for intentional responsive composition.
 * Prefer CSS Tailwind classes for layout; use this when JS branching is required.
 */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = React.useState<Breakpoint>(() =>
    typeof window === "undefined" ? "laptop" : resolveBreakpoint(window.innerWidth),
  );

  React.useEffect(() => {
    const onResize = () => setBp(resolveBreakpoint(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return bp;
}

/** True below Tailwind `md` (768px). Drop-in for existing useIsMobile callers. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
