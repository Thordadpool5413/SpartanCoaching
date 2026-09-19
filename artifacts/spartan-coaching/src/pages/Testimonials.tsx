import { useQuery } from "@tanstack/react-query";
import { BackButton } from "@/components/BackButton";
import { Loader2, RefreshCw, ShieldAlert, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { ProofStrip } from "@/components/ProofStrip";
import type { SelectTestimonial, SelectCaseStudy } from "@shared/schema";

const verificationLabels: Record<string, string> = {
  client_reported: "Client reported",
  document_reviewed: "Supporting document reviewed",
  spartan_measured: "Measured by Spartan",
};

function EvidenceProvenance({
  record,
}: {
  record: Pick<
    SelectTestimonial,
    "timeframe" | "evidenceSource" | "measurementContext" | "verificationStatus" | "attributionLimitations"
  >;
}) {
  return (
    <div className="mt-8 border-t border-border pt-5" data-testid="evidence-provenance">
      <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {record.timeframe && <span>Window: {record.timeframe}</span>}
        {record.evidenceSource && <span>Source: {record.evidenceSource}</span>}
        <span>Verification: {verificationLabels[record.verificationStatus] ?? record.verificationStatus}</span>
      </div>
      {record.measurementContext && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Measurement context:</span> {record.measurementContext}
        </p>
      )}
      {record.attributionLimitations && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Attribution note:</span> {record.attributionLimitations}
        </p>
      )}
    </div>
  );
}

export default function Testimonials() {
  const testimonialsQuery = useQuery<{ testimonials: SelectTestimonial[] }>({
    queryKey: ["/api/testimonials"],
  });

  const caseStudiesQuery = useQuery<{ caseStudies: SelectCaseStudy[] }>({
    queryKey: ["/api/case-studies"],
  });

  const testimonials = testimonialsQuery.data?.testimonials ?? [];
  const caseStudies = caseStudiesQuery.data?.caseStudies ?? [];
  const isLoading = testimonialsQuery.isLoading || caseStudiesQuery.isLoading;
  const isError = testimonialsQuery.isError || caseStudiesQuery.isError;
  const retry = () => { void testimonialsQuery.refetch(); void caseStudiesQuery.refetch(); };

  return (
    <div className="bg-background min-h-screen">
      <SEO title="Proof Dossier | Spartan Coaching" />
      <BackButton />

      {/* Dossier Header */}
      <header className="px-4 pt-20 pb-16 sm:px-6 lg:px-8 max-w-[84rem] mx-auto border-b border-border">
        <div className="max-w-4xl">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-3">
            <span className="w-4 h-px bg-primary"></span>
            Ledger of Evidence
          </p>
          <h1
            className="font-display text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.9] tracking-[-0.02em] text-foreground uppercase text-balance mb-8"
            data-testid="text-testimonials-title"
          >
            The impact of discipline.
          </h1>
          <p className="text-lg leading-[1.6] text-muted-foreground max-w-2xl">
            Published client stories appear here only after explicit written approval. This strict boundary separates verified, accountable client impact from general operating standards.
          </p>
        </div>
      </header>

      {/* Primary Evidence Section */}
      <section className="px-4 py-16 sm:px-6 md:py-24 lg:px-8 max-w-[84rem] mx-auto" aria-labelledby="approved-evidence-title">
        
        <div className="mb-12">
          <h2 id="approved-evidence-title" className="font-display text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-4">
            I. Approved Documentations
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">Named stories, quotes, and measurable outcomes. Never substituted with anonymous praise.</p>
        </div>

        {isLoading && (
          <div className="border border-border p-12 bg-muted/10 shadow-sm" data-testid="proof-loading">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Checking Evidence Ledger</p>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Retrieving approved records...</p>
              </div>
            </div>
          </div>
        )}

        {isError && (
          <div className="border border-destructive/30 bg-destructive/5 p-8 shadow-sm" role="alert" data-testid="proof-error">
            <div className="flex items-start gap-4">
              <ShieldAlert className="h-6 w-6 text-destructive shrink-0 mt-1" />
              <div>
                <p className="text-base font-medium text-foreground mb-2">Verification Failed</p>
                <p className="text-sm text-muted-foreground mb-6">Approved stories could not be loaded from the secure ledger. Retry the request when ready.</p>
                <Button size="sm" variant="outline" onClick={retry} className="font-mono text-[10px] font-bold uppercase tracking-widest rounded-none border-destructive/30 hover:bg-destructive/10">
                  <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry Connection
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !isError && testimonials.length === 0 && caseStudies.length === 0 && (
          <div className="border border-border p-12 bg-muted/5 shadow-sm" data-testid="proof-empty">
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto gap-4">
              <div className="w-12 h-12 bg-muted flex items-center justify-center rounded-full mb-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground">Ledger Empty</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No client stories are currently approved for public distribution. We maintain a strict policy of never substituting unverified or anonymous results for real evidence.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-20">
            {/* Case Studies (Deep Dives) */}
            {caseStudies.length > 0 && (
              <div className="space-y-12">
                {caseStudies.map((study, idx) => (
                  <article key={study.id} className="border border-border bg-card shadow-sm" data-testid={`card-case-study-${study.id}`}>
                    <div className="grid md:grid-cols-[1fr_320px] divide-y md:divide-y-0 md:divide-x divide-border">
                      <div className="p-8 md:p-12">
                        <div className="flex items-center gap-4 mb-6">
                           <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1">Case 0{idx + 1}</span>
                           <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{study.clientLabel}</span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-display uppercase tracking-tight text-foreground mb-10 leading-none">{study.title}</h3>
                        
                        <div className="grid sm:grid-cols-2 gap-8 md:gap-12">
                          <div>
                            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground mb-3 pb-2 border-b border-border">The Challenge</p>
                            <p className="text-sm text-muted-foreground leading-[1.7]">{study.challenge}</p>
                          </div>
                          <div>
                            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground mb-3 pb-2 border-b border-border">The Solution</p>
                            <p className="text-sm text-muted-foreground leading-[1.7]">{study.solution}</p>
                          </div>
                        </div>
                         <EvidenceProvenance record={study} />
                      </div>
                      
                      <div className="p-8 md:p-12 bg-muted/10 flex flex-col">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary mb-6">Measurable Impact</p>
                        <ul className="space-y-6 flex-1">
                          {study.results.map((result, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-4 text-sm text-foreground font-medium leading-snug">
                              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <span>{result}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Testimonials (Citations) */}
            {testimonials.length > 0 && (
              <div>
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-6">Direct Citations</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="border border-border bg-card p-8 flex flex-col shadow-sm relative overflow-hidden" data-testid={`card-testimonial-${testimonial.id}`}>
                      <div className="absolute top-0 left-0 w-[3px] h-full bg-border"></div>
                      <p className="text-lg md:text-xl font-medium text-foreground leading-[1.6] mb-8 flex-1">"{testimonial.quote}"</p>
                      
                      <div className="pt-6 border-t border-border mt-auto">
                        <p className="text-sm font-bold text-foreground">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{testimonial.title} · {testimonial.company}</p>
                        {testimonial.outcome && (
                          <div className="mt-4 inline-flex items-center gap-2 bg-primary/5 border border-primary/20 px-3 py-1.5">
                             <span className="font-mono text-[9px] uppercase tracking-widest text-primary font-bold">Result</span>
                             <span className="text-xs font-medium text-foreground">{testimonial.outcome}</span>
                          </div>
                        )}
                        <EvidenceProvenance record={testimonial} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Operating Standards (Secondary) */}
      <section className="border-t border-border bg-muted/20 px-4 py-20 sm:px-6 lg:px-8" data-testid="section-proof-fallback">
        <div className="mx-auto max-w-[84rem]">
          <div className="mb-16 max-w-3xl">
            <h2 className="font-display text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-4">II. Operating Standards For The Field</h2>
            <p className="text-sm text-muted-foreground leading-[1.6]">
              Baseline targets for trained teams. These are the field realities we coach toward, representing healthy operation, not explicit client claims. They show the structural discipline expected from a high-performing unit.
            </p>
          </div>

          <div className="border border-border bg-card p-6 md:p-10 shadow-sm">
            <ProofStrip showLink={false} />
          </div>
        </div>
      </section>

      <PublicConversionPanel
        source="testimonials"
        audience="Leaders and reps looking for relevant examples before they start a conversation."
        promise="A grounded way to compare your challenge with the operating standards Spartan helps teams build."
        evidence="Named stories, logos, and measurable claims appear only after written publication approval."
        primary={{ label: "Discuss Your Situation", href: "/contact", token: "strategy_call" }}
        secondary={{ label: "Review The Method", href: "/method", token: "method" }}
      />
    </div>
  );
}
