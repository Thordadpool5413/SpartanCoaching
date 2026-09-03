import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PageShellWidth = "sm" | "md" | "lg" | "xl" | "full" | "prose";

const WIDTH: Record<PageShellWidth, string> = {
  /** Auth cards, narrow forms */
  sm: "max-w-md",
  /** Marketing prose / FAQ */
  prose: "max-w-3xl",
  /** Default product pages */
  md: "max-w-5xl",
  /** Portal / tools dashboards */
  lg: "max-w-6xl",
  /** Wide tool workspaces */
  xl: "max-w-7xl",
  full: "max-w-none",
};

type PageShellProps = {
  children: ReactNode;
  /** Content max-width band */
  width?: PageShellWidth;
  className?: string;
  /** data-testid for pages */
  testId?: string;
  /** Skip vertical padding (hero full-bleed sections) */
  flushY?: boolean;
  /** Skip horizontal padding */
  flushX?: boolean;
  as?: "div" | "main" | "section";
};

/**
 * Consistent page rail: intentional padding + max-width by surface type.
 * Mobile: tighter horizontal padding; tablet+: roomier; large screens: capped measure.
 */
export function PageShell({
  children,
  width = "md",
  className,
  testId,
  flushY = false,
  flushX = false,
  as: Tag = "div",
}: PageShellProps) {
  return (
    <Tag
      className={cn(
        "w-full mx-auto surface-page",
        WIDTH[width],
        !flushX && "px-4 sm:px-6 lg:px-8",
        !flushY && "py-6 sm:py-8 lg:py-10",
        className,
      )}
      data-testid={testId}
    >
      {children}
    </Tag>
  );
}

type PageHeaderProps = {
  kicker?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Centered marketing header vs left product header */
  align?: "left" | "center";
};

/** Page-level title block with responsive action placement. */
export function PageHeader({
  kicker,
  title,
  description,
  actions,
  className,
  align = "left",
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 sm:mb-8",
        align === "center" && "text-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4",
          align === "left" && "sm:flex-row sm:items-end sm:justify-between",
          align === "center" && "items-center",
        )}
      >
        <div className={cn("min-w-0 space-y-2", align === "center" && "max-w-2xl")}>
          {kicker && (
            <p
              className={cn(
                "text-kicker",
                align === "center" && "justify-center",
              )}
            >
              {kicker}
            </p>
          )}
          <h1 className="text-h1 font-display font-extrabold text-foreground tracking-tight text-balance">
            {title}
          </h1>
          {description && (
            <div
              className={cn(
                "text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl",
                align === "center" && "mx-auto",
              )}
            >
              {description}
            </div>
          )}
        </div>
        {actions && (
          <div
            className={cn(
              "flex flex-col xs:flex-row flex-wrap gap-2 shrink-0 w-full sm:w-auto",
              align === "center" && "justify-center",
              "[&>a]:w-full sm:[&>a]:w-auto [&>button]:w-full sm:[&>button]:w-auto",
            )}
          >
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
