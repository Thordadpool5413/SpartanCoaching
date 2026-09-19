import { useQuery } from "@tanstack/react-query";
import { BackButton } from "@/components/BackButton";
import { Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { ProofStrip } from "@/components/ProofStrip";
import type { SelectTestimonial, SelectCaseStudy } from "@shared/schema";

export default function Testimonials() {
  const { data: testimonialsData, isLoading: testimonialsLoading } = useQuery<{ testimonials: SelectTestimonial[] }>({
    queryKey: ["/api/testimonials"],
  });

  const { data: caseStudiesData, isLoading: caseStudiesLoading } = useQuery<{ caseStudies: SelectCaseStudy[] }>({
    queryKey: ["/api/case-studies"],
  });

  const testimonials = testimonialsData?.testimonials ?? [];
  const caseStudies = caseStudiesData?.caseStudies ?? [];
  const isLoading = testimonialsLoading || caseStudiesLoading;

  return (
    <div className="bg-background min-h-screen">
      <SEO title="Proof & Stories | Spartan Coaching" />
      <BackButton />

      {/* EDITORIAL HERO */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-[56rem] mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-6">Evidence</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-foreground leading-[1.1] mb-6" data-testid="text-testimonials-title">
            The impact of discipline.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-[1.7] max-w-2xl mx-auto">
            Published client stories appear here only after written approval. Until then, we show the operating standards Spartan helps teams build—without invented names, logos, or metrics.
          </p>
        </div>
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {testimonials.length === 0 && caseStudies.length === 0 && (
            <div className="py-24 border-b border-border" data-testid="section-proof-fallback">
              <div className="max-w-[64rem] mx-auto px-4">
                <ProofStrip showLink={false} title="Operating standards for the field" />
              </div>
            </div>
          )}

          {testimonials.length > 0 && (
            <section className="py-20 md:py-32 border-b border-border px-4 sm:px-6 lg:px-8 bg-surface">
              <div className="max-w-[64rem] mx-auto">
                <h2 className="text-2xl font-medium text-foreground mb-12">Direct feedback</h2>
                <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="flex flex-col" data-testid={`card-testimonial-${testimonial.id}`}>
                      <p className="text-base text-foreground leading-[1.7] mb-6 flex-1">
                        "{testimonial.quote}"
                      </p>
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm font-medium text-foreground">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{testimonial.title} · {testimonial.company}</p>
                        {testimonial.outcome && (
                          <div className="mt-4">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Result</p>
                            <p className="text-sm font-medium text-foreground">{testimonial.outcome}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {caseStudies.length > 0 && (
            <section className="py-20 md:py-32 border-b border-border px-4 sm:px-6 lg:px-8">
              <div className="max-w-[64rem] mx-auto">
                <h2 className="text-2xl font-medium text-foreground mb-16">Case studies</h2>
                <div className="space-y-24">
                  {caseStudies.map((study) => (
                    <div key={study.id} className="grid md:grid-cols-[1.5fr_1fr] gap-12 lg:gap-20" data-testid={`card-case-study-${study.id}`}>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">{study.clientLabel}</p>
                        <h3 className="text-2xl font-serif text-foreground mb-8">{study.title}</h3>
                        <div className="space-y-6">
                          <div>
                            <p className="text-xs font-bold text-foreground uppercase tracking-widest mb-2">The Challenge</p>
                            <p className="text-sm text-muted-foreground leading-[1.7]">{study.challenge}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground uppercase tracking-widest mb-2">The Solution</p>
                            <p className="text-sm text-muted-foreground leading-[1.7]">{study.solution}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-surface p-8 border border-border">
                        <p className="text-sm font-medium text-foreground mb-6 border-b border-border pb-3">Measurable Results</p>
                        <ul className="space-y-4">
                          {study.results.map((result, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-3">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                              <span className="text-sm text-muted-foreground leading-relaxed">{result}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

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
