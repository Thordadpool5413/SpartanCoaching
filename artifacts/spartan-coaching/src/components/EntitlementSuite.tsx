import { Link } from "wouter";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  entitlementShellCopy,
  formatHoursRemainingLabel,
  resolveEntitlementShell,
  type EntitlementShellInput,
} from "@/lib/fieldKitCatalog";
import { cn } from "@/lib/utils";

type Props = {
  input: EntitlementShellInput;
  /** Primary button action (subscribe / portal / login) */
  onPrimary?: () => void;
  primaryPending?: boolean;
  onSecondary?: () => void;
  secondaryPending?: boolean;
  className?: string;
  testID?: string;
};

/**
 * Shared subscription theater card for web Account / gates (craft Phase 4).
 */
export function EntitlementSuite({
  input,
  onPrimary,
  primaryPending,
  onSecondary,
  secondaryPending,
  className,
  testID = "entitlement-suite",
}: Props) {
  const id = resolveEntitlementShell(input);
  const hoursLabel = formatHoursRemainingLabel(input.hoursRemaining);
  const copy = entitlementShellCopy(id, { hoursLabel });

  return (
    <Card
      className={cn("border-2 border-primary/35 bg-card p-6 space-y-4", className)}
      data-testid={testID}
      data-shell={id}
    >
      <Badge variant="secondary" data-testid="entitlement-chip">
        {copy.chip}
      </Badge>
      <div>
        <h2 className="text-xl font-display font-black text-foreground tracking-tight">{copy.title}</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{copy.body}</p>
      </div>
      <ul className="grid sm:grid-cols-2 gap-2">
        {copy.benefits.map((b) => (
          <li key={b} className="flex gap-2 text-xs text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" aria-hidden />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
        {copy.restoreNote}
      </p>
      <div className="flex flex-wrap gap-2">
        {onPrimary ? (
          <Button className="font-bold" onClick={onPrimary} disabled={primaryPending} data-testid="entitlement-primary">
            {primaryPending ? "Working…" : copy.primaryCta}
          </Button>
        ) : null}
        {copy.secondaryCta && onSecondary ? (
          <Button
            variant="outline"
            className="font-bold"
            onClick={onSecondary}
            disabled={secondaryPending}
            data-testid="entitlement-secondary"
          >
            {copy.secondaryCta}
          </Button>
        ) : copy.secondaryCta === "View pricing" ? (
          <Button asChild variant="outline" className="font-bold">
            <Link href="/hospice-sales-pro">{copy.secondaryCta}</Link>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
