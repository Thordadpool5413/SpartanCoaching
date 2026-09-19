import { useQuery } from "@tanstack/react-query";
import { BackButton } from "@/components/BackButton";
import { Loader2, RefreshCw, ShieldAlert, CheckCircle2, ChevronRight } from "lucide-react";
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
    <div className="mt-8 pt-6 border-t border-slate-100" data-testid="evidence-provenance">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500 mb-4">
        {record.timeframe && <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-200">Window: {record.timeframe}</span>}
        {record.evidenceSource && <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-200">Source: {record.evidenceSource}</span>}
        <span className="bg-primary/5 text-primary px-2 py-1 rounded-md border border-primary/20 flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3" /> {verificationLabels[record.verificationStatus] ?? record.verificationStatus}
        </span>
      </div>
      {(record.measurementContext || record.attributionLimitations) && (
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl text-sm text-slate-600">
          {record.measurementContext && (
            <p>
              <strong className="text-slate-900">Context:</strong> {record.measurementContext}
            </p>
          )}
          {record.attributionLimitations && (
            <p>
              <strong className="text-slate-900">Note:</strong> {record.attributionLimitations}
            </p>
          )}
        </div>
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
    <div className="bg-slate-50 min-h-screen text-slate-900 selection:bg-primary/20">
      <SEO title="Client Impact & Proof | Spartan Coaching" />
      <BackButton />

      {/* Header */}
      <header className="px-4 pt-32 pb-20 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-sm border border-slate-200 text-slate-600 text-xs font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Proof, published responsibly
        </div>
        <h1
          className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 text-balance mx-auto mb-8"
          data-testid="text-testimonials-title"
        >
          The impact of discipline.
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
          Published client stories appear here only after explicit written approval. This strict boundary separates verified, accountable client impact from general operating standards.
        </p>
      </header>

      {/* Primary Evidence Section */}
      <section className="px-4 py-16 sm:px-6 md:py-24 lg:px-8 max-w-7xl mx-auto" aria-labelledby="approved-evidence-title">
        <h2 id="approved-evidence-title" className="sr-only">Approved client evidence</h2>
        
        {isLoading && (
          <div className="bg-white rounded-3xl p-16 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-6" data-testid="proof-loading">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div>
              <p className="text-lg font-bold text-slate-900 mb-1">Checking approved evidence</p>
              <p className="text-sm text-slate-500">Retrieving approved records...</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="bg-red-50 rounded-3xl p-10 border border-red-100 flex items-start gap-6" role="alert" data-testid="proof-error">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 mb-2">Verification Failed</p>
              <p className="text-base text-slate-600 mb-6 max-w-2xl">Approved stories could not be loaded from the secure ledger. Retry the request when ready.</p>
              <Button size="lg" variant="outline" onClick={retry} className="rounded-full border-red-200 hover:bg-red-100 text-red-700">
                <RefreshCw className="mr-2 h-4 w-4" /> Retry Connection
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !isError && testimonials.length === 0 && caseStudies.length === 0 && (
          <div className="bg-white rounded-3xl p-12 md:p-20 border border-slate-200 shadow-sm text-center max-w-4xl mx-auto mb-24" data-testid="proof-empty">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">A strict standard for evidence</h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto">
              No client stories are currently approved for public distribution. We maintain a strict policy of never substituting unverified or anonymous results for real evidence. Until a record has clear provenance and publication approval, it stays private. You can review the operating standards below.
            </p>
            <Button variant="outline" className="rounded-full font-medium" asChild>
              <a href="#standards">View Operating Standards <ChevronRight className="w-4 h-4 ml-1" /></a>
            </Button>
          </div>
        )}

        {!isLoading && !isError && (testimonials.length > 0 || caseStudies.length > 0) && (
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold text-slate-900 mb-4">
              Approved client evidence
            </h2>
            <p className="text-lg text-slate-600">Named stories, quotes, and measurable outcomes.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-24">
            {/* Case Studies */}
            {caseStudies.length > 0 && (
              <div className="space-y-12">
                {caseStudies.map((study, idx) => (
                  <article key={study.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" data-testid={`card-case-study-${study.id}`}>
                    <div className="grid lg:grid-cols-[1.5fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                      <div className="p-8 md:p-12 relative">
                        <div className="flex items-center gap-3 mb-8">
                           <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/5 px-3 py-1 rounded-md">Case 0{idx + 1}</span>
                           <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-3 py-1 rounded-md border border-slate-200">{study.clientLabel}</span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-10 leading-tight">{study.title}</h3>
                        
                        <div className="grid sm:grid-cols-2 gap-8 md:gap-12">
                          <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">The Challenge</p>
                            <p className="text-slate-700 leading-relaxed">{study.challenge}</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">The Solution</p>
                            <p className="text-slate-700 leading-relaxed">{study.solution}</p>
                          </div>
                        </div>
                        <EvidenceProvenance record={study} />
                      </div>
                      
                      <div className="p-8 md:p-12 bg-slate-50 flex flex-col justify-center">
                        <p className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-8">Measurable Impact</p>
                        <ul className="space-y-6">
                          {study.results.map((result, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-4">
                              <div className="mt-1 bg-primary/10 text-primary p-1.5 rounded-md"><CheckCircle2 className="w-4 h-4" /></div>
                              <span className="text-slate-700 font-medium leading-relaxed">{result}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900 mb-8 text-center">Direct Citations</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="bg-white rounded-3xl border border-slate-200 p-8 md:p-10 flex flex-col shadow-sm hover:shadow-md transition-shadow" data-testid={`card-testimonial-${testimonial.id}`}>
                      <p className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed mb-10 flex-1">"{testimonial.quote}"</p>
                      
                      <div className="pt-8 border-t border-slate-100">
                        <p className="text-lg font-bold text-slate-900">{testimonial.name}</p>
                        <p className="text-sm text-slate-500 mt-1">{testimonial.title}, {testimonial.company}</p>
                        {testimonial.outcome && (
                          <div className="mt-6 flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <span className="text-[10px] uppercase tracking-wider text-primary font-bold mt-0.5">Result</span>
                             <span className="text-sm font-semibold text-slate-700">{testimonial.outcome}</span>
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
      <section id="standards" className="border-t border-slate-200 bg-white px-4 py-24 sm:px-6 lg:px-8" data-testid="section-proof-fallback">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">Operating Standards For The Field</h2>
            <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
              Baseline targets for trained teams. These are the field realities we coach toward, representing healthy operation, not explicit client claims. They show the structural discipline expected from a high-performing unit.
            </p>
          </div>

          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm">
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
