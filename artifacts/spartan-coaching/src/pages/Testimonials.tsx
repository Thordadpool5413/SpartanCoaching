import { useQuery } from "@tanstack/react-query";
import { BackButton } from "@/components/BackButton";
import { Loader2, RefreshCw, ShieldAlert, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { ProofStrip } from "@/components/ProofStrip";
import type { SelectTestimonial, SelectCaseStudy } from "@shared/schema";

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
      <SEO title="Proof & Stories | Spartan Coaching" />
      <BackButton />

      {/* Refined Header */}
      <section className="px-4 py-12 sm:px-6 md:py-20 lg:px-8 border-b border-border">
        <div className="mx-auto max-w-[64rem]">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary mb-6">Evidence & Operating Standards</p>
          <h1
            className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground leading-[1.1] tracking-tight mb-8"
            data-testid="text-testimonials-title"
          >
            The impact of discipline.
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground max-w-3xl">
            Published client stories appear here only after written approval. Until then, we show the operating standards Spartan helps teams build—without invented names, logos, or metrics.
          </p>
        </div>
      </section>

      {/* Methodology / Taxonomy */}
      <section className="border-b border-border bg-surface px-4 py-16 sm:px-6 lg:px-8" data-testid="section-proof-fallback">
        <div className="mx-auto max-w-[64rem]">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="font-serif text-2xl text-foreground mb-4">Operating Standards For The Field</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Baseline targets for trained teams. These are the field realities we coach toward, representing healthy operation, not explicit client claims.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-2xl text-foreground mb-4">Approved Client Evidence</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Named stories, quotes, and measurable outcomes. These require strict written publication approval and are never substituted with anonymous praise.
              </p>
            </div>
          </div>

          <div className="pt-12 border-t border-border">
            <ProofStrip showLink={false} />
          </div>
        </div>
      </section>

      {/* Dynamic Evidence Section */}
      <section className="px-4 py-16 sm:px-6 md:py-24 lg:px-8 bg-background" aria-labelledby="approved-evidence-title">
        <div className="mx-auto max-w-[64rem]">
          <h2 id="approved-evidence-title" className="font-serif text-3xl md:text-4xl text-foreground mb-12">
            Approved client evidence
          </h2>

          {isLoading && (
            <div className="border border-border p-8 bg-muted/20" data-testid="proof-loading">
              <div className="flex items-center gap-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Checking evidence ledger for approved stories...</p>
              </div>
            </div>
          )}

          {isError && (
            <div className="border border-destructive/30 bg-destructive/5 p-8" role="alert" data-testid="proof-error">
              <div className="flex items-start gap-4">
                <ShieldAlert className="h-6 w-6 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Verification Failed</p>
                  <p className="text-sm text-muted-foreground mb-4">Approved stories could not be loaded from the server. Retry the request when ready.</p>
                  <Button size="sm" variant="outline" onClick={retry} className="font-mono text-xs uppercase tracking-widest">
                    <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !isError && testimonials.length === 0 && caseStudies.length === 0 && (
            <div className="border border-border p-8 bg-muted/20" data-testid="proof-empty">
              <div className="flex items-start gap-4">
                <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Ledger Empty</p>
                  <p className="text-sm text-muted-foreground">No client stories are currently approved for public distribution. We do not substitute unverified results.</p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="space-y-16">
              {testimonials.length > 0 && (
                <div className="grid md:grid-cols-2 gap-12">
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="relative pl-6 border-l border-border" data-testid={`card-testimonial-${testimonial.id}`}>
                      <p className="text-lg font-serif text-foreground leading-relaxed mb-6">"{testimonial.quote}"</p>
                      <div>
                        <p className="text-sm font-medium text-foreground">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{testimonial.title} · {testimonial.company}</p>
                        {testimonial.outcome && (
                          <p className="text-xs text-primary mt-3 font-medium">Result: {testimonial.outcome}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {caseStudies.length > 0 && (
                <div className="space-y-12">
                  {caseStudies.map((study) => (
                    <div key={study.id} className="border border-border bg-surface p-8 md:p-12" data-testid={`card-case-study-${study.id}`}>
                      <div className="flex flex-col md:flex-row gap-12">
                        <div className="flex-1">
                          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary mb-4">{study.clientLabel}</p>
                          <h3 className="text-2xl md:text-3xl font-serif text-foreground mb-8">{study.title}</h3>
                          <div className="space-y-6">
                            <div>
                              <p className="text-xs font-medium text-foreground mb-2">The Challenge</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{study.challenge}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground mb-2">The Solution</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{study.solution}</p>
                            </div>
                          </div>
                        </div>
                        <div className="md:w-1/3 pt-6 md:pt-0 md:pl-8 border-t md:border-t-0 md:border-l border-border">
                          <p className="text-xs font-medium text-foreground mb-4">Measurable Impact</p>
                          <ul className="space-y-4">
                            {study.results.map((result, rIdx) => (
                              <li key={rIdx} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                                <span className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                                <span>{result}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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