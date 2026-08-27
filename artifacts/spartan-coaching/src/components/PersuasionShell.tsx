import { PublicPageShell } from "@/components/PublicPageShell";

/**
 * Soft conversion surface for public hire / long-read pages
 * (Services, About, Request Access, FAQ, Contact).
 *
 * Uses a light paper band in dark mode so persuasion copy stays
 * high-contrast and easy to scan, while hero/Method/portal stay dark.
 * Respects user background preference when they pick a non-default bg
 * by staying on semantic tokens instead of hard-coded black.
 */
export function PersuasionShell({
  children,
  className,
  narrow = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Constrain inner content width (default true-ish via max-w-7xl) */
  narrow?: boolean;
}) {
  return (
    <PublicPageShell
      className={className}
      narrow={narrow}
      testId="page-persuasion"
    >
      {children}
    </PublicPageShell>
  );
}
