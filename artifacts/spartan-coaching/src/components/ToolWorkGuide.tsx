import { Link } from "wouter";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { FieldKitTool } from "@/lib/fieldKitCatalog";
import { getToolById, getToolWorkGuide } from "@/lib/fieldKitCatalog";

/**
 * The catalog-backed bridge between a tool's form and the work that follows.
 * It is intentionally informational: no generated text or account context is
 * copied into a URL, local storage, or another tool.
 */
export function ToolWorkGuide({ tool }: { tool: FieldKitTool }) {
  const guide = getToolWorkGuide(tool);
  const nextTool = guide.nextToolId ? getToolById(guide.nextToolId) : undefined;

  return (
    <section
      className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-5"
      aria-labelledby="tool-work-guide-heading"
      data-testid="tool-work-guide"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Make the result useful
          </p>
          <h2 id="tool-work-guide-heading" className="mt-1 text-base font-bold text-foreground">
            From input to next field action
          </h2>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
          No PHI in Hospice Sales Pro tools
        </div>
      </div>

      <div className="grid gap-4 text-sm md:grid-cols-3">
        <div>
          <p className="font-bold text-foreground">Enter safely</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">{guide.inputHint}</p>
        </div>
        <div>
          <p className="font-bold text-foreground">What you will get</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">{guide.outputPreview}</p>
        </div>
        <div>
          <p className="font-bold text-foreground">Keep the work straight</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">{guide.persistence}</p>
        </div>
      </div>

      {nextTool ? (
        <div className="mt-4 border-t border-border/60 pt-4">
          <Link
            href={nextTool.path}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline"
            data-testid="tool-work-guide-next"
          >
            Next: {nextTool.title}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            Open the next tool when you are ready; this page never transfers your entered text automatically.
          </p>
        </div>
      ) : null}
    </section>
  );
}