import { Link } from "wouter";
import { ArrowRight, Check, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROOF_PACK, type ProofItem } from "@/lib/proof";
import { cn } from "@/lib/utils";

export function ProofStrip({
  className,
  title = "What changes look like",
  kicker = "Outcomes clients describe",
  showLink = true,
  items = PROOF_PACK,
}: {
  className?: string;
  title?: string;
  kicker?: string;
  showLink?: boolean;
  items?: ProofItem[];
}) {
  return (
    <section
      className={cn("w-full", className)}
      data-testid="section-proof-strip"
      aria-label="Client outcomes and proof"
    >
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <p className="text-kicker justify-center">{kicker}</p>
        <h2 className="text-h2 text-foreground font-display">{title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A proof ledger, not a highlight reel. These are representative client-described outcomes,
          kept role-based until named permission is available.
        </p>
      </div>

      <div className="proof-ledger">
        {items.map((item) => (
          <article
            key={item.id}
            className="proof-ledger-entry"
            data-testid={`proof-card-${item.id}`}
          >
            <div className="proof-ledger-meta">
              <span className="proof-ledger-index">{String(items.indexOf(item) + 1).padStart(2, "0")}</span>
              <span>Field signal</span>
              <Check className="ml-auto h-4 w-4 text-primary" aria-hidden />
            </div>
            <div className="proof-ledger-quote">
              <Quote className="h-6 w-6 shrink-0 text-primary/45" aria-hidden />
              <p className="text-sm leading-relaxed text-foreground sm:text-base">“{item.quote}”</p>
            </div>
            <div className="proof-ledger-context">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Observed in</p>
                <p className="mt-1 text-sm font-bold text-foreground">{item.role}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.context}</p>
              </div>
              <div className="proof-ledger-outcome">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">The shift</p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground">{item.outcome}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {showLink && (
        <div className="text-center mt-10">
          <Button asChild variant="outline" className="font-bold">
            <Link href="/testimonials">
              Read more outcomes
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
