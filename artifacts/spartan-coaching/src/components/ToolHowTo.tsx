import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import type { FieldKitTool } from "@/lib/fieldKitCatalog";
import { getToolByPath } from "@/lib/fieldKitCatalog";
import { cn } from "@/lib/utils";

/**
 * When / how / why block for individual Field Kit tools.
 */
export function ToolHowTo({
  path,
  tool: toolProp,
  className,
}: {
  /** Current tool path, e.g. /tools/objections */
  path?: string;
  tool?: FieldKitTool;
  className?: string;
}) {
  const tool = toolProp ?? (path ? getToolByPath(path) : undefined);
  if (!tool) return null;

  return (
    <div
      className={cn(
        "mb-6 rounded-xl border border-border bg-muted/40 p-4 sm:p-5 space-y-3",
        className,
      )}
      data-testid="tool-how-to"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
          How to use · {tool.category}
        </p>
        <Link
          href="/portal"
          className="text-xs font-semibold text-muted-foreground hover:text-primary inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Field Kit home
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="font-bold text-foreground mb-1">When</p>
          <p className="text-muted-foreground leading-relaxed">{tool.whenToUse}</p>
        </div>
        <div>
          <p className="font-bold text-foreground mb-1">How</p>
          <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground leading-relaxed">
            {tool.howSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div>
          <p className="font-bold text-foreground mb-1">Why</p>
          <p className="text-muted-foreground leading-relaxed">{tool.why}</p>
        </div>
      </div>
    </div>
  );
}
