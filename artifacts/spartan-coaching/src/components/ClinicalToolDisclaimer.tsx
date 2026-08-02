import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";
import { CLINICAL_VAULT } from "@/lib/complianceCopy";

export function ClinicalToolDisclaimer() {
  return (
    <div className="border-t border-amber-500/30 bg-amber-500/5 py-4 px-4 text-center">
      <p className="mx-auto max-w-4xl text-xs text-muted-foreground inline-flex items-start justify-center gap-2 leading-relaxed">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <span>
          {CLINICAL_VAULT.banner}{" "}
          <Link href="/compliance" className="text-primary hover:underline">
            Compliance controls
          </Link>
        </span>
      </p>
    </div>
  );
}
