import { AccentText } from "@/components/AccentText";
import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
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
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
        <p className="fi-kicker justify-center mb-6">{kicker}</p>
        <h2 className="fi-serif text-[clamp(2.5rem,4vw,3.5rem)] leading-[0.9]"><AccentText>{title}</AccentText></h2>
        <p className="text-[1.125rem] text-black/70 font-medium leading-[1.6] max-w-lg mx-auto pt-6">
          These are operating standards, not testimonials or measured claims. Approved client
          stories appear only after written publication permission.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-12">
        {items[0] ? (
          <article
            className="border-t-[4px] border-[var(--fi-red)] bg-white p-8 md:p-12 shadow-[8px_8px_0_var(--fi-red)] flex flex-col md:flex-row gap-8 md:gap-16"
            data-testid={`proof-card-${items[0].id}`}
          >
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4 text-[0.65rem] font-bold uppercase tracking-[.2em] font-mono text-[var(--fi-ink)]">
                <span className="text-[var(--fi-red)]">01</span>
                <span className="h-1 w-1 bg-black/20" />
                <span>Featured field standard</span>
              </div>
              <p className="text-[1.25rem] leading-[1.6] text-black/80 font-medium">"{items[0].quote}"</p>
            </div>
            
            <div className="md:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-[var(--fi-line)] pt-6 md:pt-0 md:pl-10 space-y-8">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-black/50 font-mono mb-2">Applied as</p>
                <p className="text-[1rem] font-bold text-[var(--fi-ink)] mb-1">{items[0].role}</p>
                <p className="text-[0.85rem] text-black/60 font-medium leading-[1.6]">{items[0].context}</p>
              </div>
              <div className="border-t border-[var(--fi-line)] pt-6">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--fi-red)] font-mono mb-2">The shift</p>
                <p className="text-[1rem] font-bold leading-relaxed text-[var(--fi-ink)]">{items[0].outcome}</p>
              </div>
            </div>
          </article>
        ) : null}

        <div className="grid md:grid-cols-2 gap-8 pt-6" aria-label="Supporting evidence">
          {items.slice(1).map((item, index) => (
            <article
              key={item.id}
              className="border border-[var(--fi-line)] bg-white p-8 flex flex-col hover:border-[var(--fi-ink)] transition-colors"
              data-testid={`proof-card-${item.id}`}
            >
              <div className="flex items-center gap-4 text-[0.65rem] font-bold uppercase tracking-[.2em] font-mono text-[var(--fi-ink)] mb-6">
                <span className="text-[var(--fi-red)]">{String(index + 2).padStart(2, "0")}</span>
                <span className="h-1 w-1 bg-black/20" />
                <span>Supporting standard</span>
              </div>
              
              <p className="text-[1rem] leading-[1.6] text-black/80 font-medium mb-10 flex-1">"{item.quote}"</p>
              
              <div className="border-t border-[var(--fi-line)] pt-6 mt-auto space-y-6">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-black/50 font-mono mb-2">Applied as</p>
                  <p className="text-[0.95rem] font-bold text-[var(--fi-ink)] mb-1">{item.role}</p>
                  <p className="text-[0.85rem] text-black/60 font-medium leading-[1.6]">{item.context}</p>
                </div>
                <div className="border-t border-[var(--fi-line)] pt-6">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--fi-red)] font-mono mb-2">The shift</p>
                  <p className="text-[0.95rem] font-bold leading-[1.6] text-[var(--fi-ink)]">{item.outcome}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] max-w-5xl mx-auto mt-12 border border-[var(--fi-line)] bg-[var(--fi-line)]" data-testid="proof-supporting-signals">
        {PROOF_STATS.map((stat) => (
          <div key={stat.label} className="bg-white p-6 text-center flex flex-col justify-center">
            <span className="text-[1.5rem] font-bold text-[var(--fi-red)] mb-2 fi-serif">{stat.value}</span>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-black/60 font-mono">{stat.label}</p>
          </div>
        ))}
      </div>

      {showLink && (
        <div className="text-center mt-16">
          <Link href="/testimonials" className="fi-btn-outline">
            Review field standards
          </Link>
        </div>
      )}
    </section>
  );
}