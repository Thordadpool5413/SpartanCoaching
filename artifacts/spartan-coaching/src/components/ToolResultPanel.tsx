import type { ReactNode } from "react";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared elite result shell for Membership tool outputs.
 * Title → body → optional actions → disclaimer.
 */
export function ToolResultPanel({
  title = "Result",
  children,
  copyText,
  disclaimer,
  footer,
  className,
  empty,
  loading,
  copyTestId,
}: {
  title?: string;
  children?: ReactNode;
  /** When set, shows a Copy control for this string */
  copyText?: string;
  disclaimer?: string;
  footer?: ReactNode;
  className?: string;
  empty?: boolean;
  loading?: boolean;
  copyTestId?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard failures
    }
  };

  return (
    <Card
      className={cn(
        "border border-border bg-card p-5 sm:p-6 space-y-4 shadow-elite",
        className,
      )}
      data-testid="tool-result-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase mb-1">
            Field output
          </p>
          <h3 className="text-lg font-display font-bold text-foreground tracking-tight">
            {title}
          </h3>
        </div>
        {copyText && !empty && !loading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 font-semibold"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy result"}
            data-testid={copyTestId}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy
              </>
            )}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Generating result">
          <div className="h-4 rounded bg-muted w-3/4" />
          <div className="h-4 rounded bg-muted w-full" />
          <div className="h-4 rounded bg-muted w-5/6" />
          <div className="h-20 rounded bg-muted w-full" />
        </div>
      ) : empty ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Complete the form and run the tool to generate a field-ready result.
          </p>
        </div>
      ) : (
        <div className="text-sm text-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none">
          {children}
        </div>
      )}

      {footer}

      {disclaimer && (
        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
          {disclaimer}
        </p>
      )}
    </Card>
  );
}
