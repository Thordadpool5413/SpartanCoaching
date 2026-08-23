import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trackProductOutcome } from "@/lib/analytics";
import type { ProductOutcome } from "@workspace/field-kit-catalog";

export type ToolResultAction = {
  id: string;
  label: string;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost";
  analyticsOutcome?: ProductOutcome;
  testId?: string;
};

/**
 * A consistent handoff from generated output to the next piece of field work.
 * Only the tool and action identifiers are sent to analytics; result content never is.
 */
export function ToolResultActions({
  toolId,
  actions,
  title = "Next field action",
  description,
  persistenceNote,
  testId = "tool-result-actions",
}: {
  toolId: string;
  actions: ToolResultAction[];
  title?: string;
  description?: string;
  persistenceNote?: string;
  testId?: string;
}) {
  if (actions.length === 0) return null;

  const activate = (action: ToolResultAction) => {
    trackProductOutcome(action.analyticsOutcome ?? "next_action_confirmation", {
      toolId,
      platform: "web",
      stepId: action.id,
    });
    action.onClick?.();
  };

  return (
    <div
      className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 space-y-3"
      data-testid={testId}
    >
      <div>
        <p className="text-[10px] font-bold tracking-widest text-primary uppercase mb-1">
          {title}
        </p>
        {description && (
          <p className="text-sm text-foreground leading-relaxed">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon ?? (index === 0 ? ArrowRight : undefined);
          const buttonProps = {
            type: "button" as const,
            variant: action.variant ?? (index === 0 ? "default" : "outline"),
            size: "sm" as const,
            disabled: action.disabled,
            onClick: () => activate(action),
            "data-testid": action.testId ?? `${testId}-${action.id}`,
          };

          return action.href && !action.disabled ? (
            <Button key={action.id} asChild {...buttonProps}>
              <Link href={action.href}>
                {Icon && <Icon aria-hidden />}
                {action.label}
              </Link>
            </Button>
          ) : (
            <Button key={action.id} {...buttonProps}>
              {Icon && <Icon aria-hidden />}
              {action.label}
            </Button>
          );
        })}
      </div>
      {persistenceNote && (
        <p className="text-xs text-muted-foreground leading-relaxed border-t border-primary/10 pt-3">
          {persistenceNote}
        </p>
      )}
    </div>
  );
}