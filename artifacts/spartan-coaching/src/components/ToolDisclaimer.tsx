import { Link } from "wouter";
import { Shield } from "lucide-react";
import { FIELD_KIT_PHI } from "@/lib/complianceCopy";

/** Persistent compliance chrome for Field Kit surfaces */
export function ToolDisclaimer({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "border-t border-border/60 bg-background/80 py-3 px-4 text-center"
      }
      data-testid="tool-disclaimer"
    >
      <p className="text-[11px] sm:text-xs text-muted-foreground inline-flex items-center justify-center gap-1.5 flex-wrap leading-relaxed">
        <Shield className="w-3 h-3 text-primary shrink-0" />
        <span>
          <strong className="text-foreground/80">{FIELD_KIT_PHI.short}.</strong> Coaching aid only — not
          clinical, legal, or billing advice.{" "}
          <Link href="/compliance" className="text-primary hover:underline">
            Compliance
          </Link>
          {" · "}
          <Link href="/disclaimer" className="text-primary hover:underline">
            Disclaimer
          </Link>
        </span>
      </p>
    </div>
  );
}
