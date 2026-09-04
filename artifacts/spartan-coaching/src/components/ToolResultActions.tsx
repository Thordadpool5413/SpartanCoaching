import type { LucideIcon } from "lucide-react";
import { ArrowRight, Save } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trackProductOutcome } from "@/lib/analytics";
import type { ProductOutcome } from "@workspace/field-kit-catalog";
import { saveMemberWork, type SaveMemberWork } from "@/lib/memberWorkClient";
import { useToast } from "@/hooks/use-toast";

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
  saveResult,
  testId = "tool-result-actions",
}: {
  toolId: string;
  actions: ToolResultAction[];
  title?: string;
  description?: string;
  persistenceNote?: string;
  saveResult?: SaveMemberWork;
  testId?: string;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState("");
  if (actions.length === 0 && !saveResult) return null;

  const save = async () => {
    if (!saveResult || saving || savedId) return;
    setSaving(true);
    try {
      const saved = await saveMemberWork(saveResult);
      setSavedId(saved.id);
      toast({ title: "Saved to My Work", description: "The inputs, result, and next action are available across devices." });
    } catch (error) {
      toast({ title: "Could not save", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" });
    } finally { setSaving(false); }
  };

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
        <p className="mb-1 text-xs font-bold uppercase leading-relaxed tracking-[0.12em] text-primary">
          {title}
        </p>
        {description && (
          <p className="text-sm text-foreground leading-relaxed">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {saveResult && (
          <Button type="button" size="sm" variant={actions.length ? "outline" : "default"} disabled={saving || Boolean(savedId)} onClick={() => void save()} data-testid={`${testId}-save`}>
            <Save aria-hidden />
            {savedId ? "Saved" : saving ? "Saving…" : "Save to My Work"}
          </Button>
        )}
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

          const href = action.href && savedId ? `${action.href}${action.href.includes("?") ? "&" : "?"}work=${savedId}` : action.href;
          return href && !action.disabled ? (
            <Button key={action.id} asChild {...buttonProps}>
              <Link href={href}>
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
