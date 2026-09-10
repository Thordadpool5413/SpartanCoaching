import { AccentText } from "@/components/AccentText";
import type { ReactNode } from "react";
import { AlertCircle, Inbox, Loader2, CheckCircle2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StateBlockProps = {
  variant: "loading" | "empty" | "error" | "warning" | "success";
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
  children?: ReactNode;
};

const ICONS = {
  loading: Loader2,
  empty: Inbox,
  error: AlertCircle,
  warning: TriangleAlert,
  success: CheckCircle2,
};

/**
 * Shared loading / empty / error / success panel for portal + tools.
 */
export function StateBlock({
  variant,
  title,
  description,
  action,
  className,
  children,
}: StateBlockProps) {
  const Icon = ICONS[variant];
  return (
    <div
      role={
        variant === "error"
          ? "alert"
          : variant === "loading" || variant === "warning" || variant === "success"
            ? "status"
            : undefined
      }
      aria-live={
        variant === "error"
          ? "assertive"
          : variant === "loading" || variant === "warning" || variant === "success"
            ? "polite"
            : undefined
      }
      aria-busy={variant === "loading" || undefined}
      className={cn(
        "rounded-xl border border-border bg-card/80 px-5 py-10 sm:px-8 sm:py-12 text-center",
        variant === "error" && "border-destructive/40 bg-destructive/5",
        variant === "warning" && "border-amber-500/35 bg-amber-500/[0.07]",
        variant === "success" && "border-primary/30 bg-primary/5",
        className,
      )}
      data-testid={`state-${variant}`}
    >
      <Icon
        className={cn(
          "w-8 h-8 mx-auto mb-3 text-muted-foreground",
          variant === "loading" && "animate-spin text-primary",
          variant === "error" && "text-destructive",
          variant === "warning" && "text-amber-600 dark:text-amber-400",
          variant === "success" && "text-primary",
        )}
        aria-hidden
      />
      <h2 className="text-base sm:text-lg font-display font-bold text-foreground mb-1.5">
        <AccentText>{title}</AccentText>
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-5">
          {description}
        </p>
      )}
      {children}
      {action && (
        <div className="mt-4 flex justify-center">
          {action.href ? (
            <Button asChild className="min-h-11">
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button type="button" onClick={action.onClick} className="min-h-11">
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** Lightweight skeleton for list/card placeholders */
export function SkeletonBlock({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("space-y-3 animate-pulse", className)}
      aria-hidden
      data-testid="skeleton-block"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-xl bg-muted/60 border border-border/40"
        />
      ))}
    </div>
  );
}
