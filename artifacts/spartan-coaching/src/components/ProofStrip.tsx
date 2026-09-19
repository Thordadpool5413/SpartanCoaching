import { AccentText } from "@/components/AccentText";
import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROOF_PACK, PROOF_STATS, type ProofItem } from "@/lib/proof";
import { cn } from "@/lib/utils";

export function ProofStrip({
  className,
  title = "What disciplined teams work toward",
  kicker = "Field standards",
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
      aria-label="Spartan field operating standards"
    >
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <p className="text-kicker justify-center">{kicker}</p>
        <h2 className="text-h2 font-display uppercase tracking-tight text-foreground"><AccentText>{title}</AccentText></h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          These are operating standards, not testimonials or measured claims. Approved client
          stories appear only after written publication permission.
        </p>
        <details className="proof-ledger-disclosure text-left">
          <summary>Evidence standard</summary>
          <p>
            No client name, quote, metric, logo, or clinical story is implied by these examples.
            Client proof is published only through an explicit approval boundary.
          </p>
        </details>
      </div>

      <div className="proof-ledger">
        {items[0] ? (
          <article
            className="proof-ledger-entry proof-ledger-featured"
            data-testid={`proof-card-${items[0].id}`}
          >
            <div className="proof-ledger-meta">
              <span className="proof-ledger-index">01</span>
              <span>Featured field standard</span>
              <Check className="ml-auto h-4 w-4 text-primary" aria-hidden />
            </div>
            <div className="proof-ledger-quote">
              <p className="text-sm leading-relaxed text-foreground sm:text-xl">{items[0].quote}</p>
            </div>
            <div className="proof-ledger-context">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Applied as</p>
                <p className="mt-1 text-sm font-bold text-foreground">{items[0].role}</p>
                <p className="mt-1 text-xs text-muted-foreground">{items[0].context}</p>
              </div>
              <div className="proof-ledger-outcome">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">The shift</p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground">{items[0].outcome}</p>
              </div>
            </div>
          </article>
        ) : null}

        <div className="proof-ledger-supporting" aria-label="Supporting evidence">
          {items.slice(1).map((item, index) => (
            <article
              key={item.id}
              className="proof-ledger-entry proof-ledger-support"
              data-testid={`proof-card-${item.id}`}
            >
              <div className="proof-ledger-meta">
                <span className="proof-ledger-index">{String(index + 2).padStart(2, "0")}</span>
                <span>Supporting standard</span>
                <Check className="ml-auto h-4 w-4 text-primary" aria-hidden />
              </div>
              <div className="proof-ledger-quote">
                <p className="text-sm leading-relaxed text-foreground sm:text-base">{item.quote}</p>
              </div>
              <div className="proof-ledger-context">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Applied as</p>
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
      </div>

      <div className="proof-ledger-signals" data-testid="proof-supporting-signals">
        {PROOF_STATS.map((stat) => (
          <div key={stat.label} className="proof-ledger-signal">
            <span>{stat.value}</span>
            <p>{stat.label}</p>
          </div>
        ))}
      </div>

      {showLink && (
        <div className="text-center mt-10">
          <Button asChild variant="outline" className="font-bold">
            <Link href="/testimonials">
              Review field standards
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
