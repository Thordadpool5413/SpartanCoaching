import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import type { FieldKitTool } from "@/lib/fieldKitCatalog";
import { getToolByPath } from "@/lib/fieldKitCatalog";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "spartan.toolHowTo.open";

/**
 * When / how / why block for individual Membership tools.
 * Collapsible after first visit so power users keep an instrument layout.
 */
export function ToolHowTo({
  path,
  tool: toolProp,
  className,
  defaultOpen,
}: {
  /** Current tool path, e.g. /tools/objections */
  path?: string;
  tool?: FieldKitTool;
  className?: string;
  /** Override collapsed default (otherwise remembers last choice) */
  defaultOpen?: boolean;
}) {
  const tool = toolProp ?? (path ? getToolByPath(path) : undefined);
  const [open, setOpen] = useState(defaultOpen ?? true);

  useEffect(() => {
    if (defaultOpen != null) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "0") setOpen(false);
      if (stored === "1") setOpen(true);
    } catch {
      // ignore
    }
  }, [defaultOpen]);

  if (!tool) return null;

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div
      className={cn(
        "mb-6 rounded-xl border border-border bg-muted/40 p-4 sm:p-5 space-y-3",
        className,
      )}
      data-testid="tool-how-to"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={toggle}
          className="text-[10px] font-bold tracking-widest text-primary uppercase inline-flex items-center gap-1.5 hover:text-primary/90 cursor-pointer"
          aria-expanded={open}
        >
          How to use · {tool.category}
          {open ? (
            <ChevronUp className="w-3.5 h-3.5" aria-hidden />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" aria-hidden />
          )}
        </button>
        <Link
          href="/portal"
          className="text-xs font-semibold text-muted-foreground hover:text-primary inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Portal
        </Link>
      </div>

      {open && (
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
      )}
    </div>
  );
}
