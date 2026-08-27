import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PublicPageShellProps = {
  children: ReactNode;
  className?: string;
  /** Use a readable measure for forms, FAQ answers, and long-form persuasion copy. */
  narrow?: boolean;
  testId?: string;
};

/**
 * Shared public-page rail. It intentionally preserves the paper-band treatment
 * while standardizing the content width and responsive rhythm used by marketing pages.
 */
export function PublicPageShell({
  children,
  className,
  narrow = false,
  testId = "page-public-shell",
}: PublicPageShellProps) {
  return (
    <div className={cn("page-persuasion w-full", className)} data-testid={testId}>
      <div
        className={cn(
          "w-full mx-auto spacing-container spacing-section",
          narrow ? "max-w-3xl" : "max-w-7xl",
        )}
      >
        {children}
      </div>
    </div>
  );
}