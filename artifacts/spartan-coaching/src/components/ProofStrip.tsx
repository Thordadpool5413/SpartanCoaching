import { Link } from "wouter";
import { Quote, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
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
          Representative client-described outcomes. Named logos ship only with
          permission — the work is real; the privacy of operators is too.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {items.map((item) => (
          <Card
            key={item.id}
            className="p-6 h-full flex flex-col border-border/80"
            data-testid={`proof-card-${item.id}`}
          >
            <Quote className="w-7 h-7 text-primary/30 mb-3" aria-hidden />
            <p className="text-sm sm:text-base text-foreground leading-relaxed flex-1">
              “{item.quote}”
            </p>
            <div className="mt-5 pt-4 border-t border-border/60 space-y-1">
              <p className="text-sm font-bold text-foreground">{item.role}</p>
              <p className="text-xs text-muted-foreground">{item.context}</p>
              <p className="text-xs font-semibold text-primary pt-1">
                {item.outcome}
              </p>
            </div>
          </Card>
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
