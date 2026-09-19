import { useQuery } from "@tanstack/react-query";
import { BackButton } from "@/components/BackButton";
import { Loader2, RefreshCw, ShieldAlert, Check } from "lucide-react";
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
    <div className="mt-8 border-t border-[var(--fi-line)] pt-6" data-testid="evidence-provenance">
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 text-[10px] font-bold uppercase tracking-[.15em] text-[rgba(19,32,31,.6)]">
        {record.timeframe && <span className="border border-[var(--fi-line)] px-2.5 py-1">Window: {record.timeframe}</span>}
        {record.evidenceSource && <span className="border border-[var(--fi-line)] px-2.5 py-1">Source: {record.evidenceSource}</span>}
        <span className="flex items-center gap-1.5 border border-[var(--fi-rust)] bg-[rgba(184,93,63,.08)] px-2.5 py-1 text-[var(--fi-rust)]">
          <Check className="w-3 h-3" /> {verificationLabels[record.verificationStatus] ?? record.verificationStatus}
        </span>
      </div>
      {(record.measurementContext || record.attributionLimitations) && (
        <div className="space-y-3 bg-[var(--fi-paper)] p-5 text-[13px] leading-[1.6] text-[rgba(19,32,31,.75)]">
          {record.measurementContext && (
            <p>
              <strong className="text-[var(--fi-ink)]">Context:</strong> {record.measurementContext}
            </p>
          )}
          {record.attributionLimitations && (
            <p>
              <strong className="text-[var(--fi-ink)]">Note:</strong> {record.attributionLimitations}
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
    <div className="page-persuasion font-sans">
      <SEO title="Client Impact & Proof | Spartan Coaching" />
      <BackButton />

      {/* Header */}
      <header className="fi-dark bg-[var(--fi-field)] text-[var(--fi-cream)]">
        <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <div>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[.2em] text-[#e8a183]">Proof, published responsibly</p>
              <h1 className="fi-serif max-w-[800px] text-[clamp(3.5rem,7vw,7rem)] leading-[.84]" data-testid="text-testimonials-title">
                The impact of<br /><em>discipline.</em>
              </h1>
            </div>
            <p className="max-w-[340px] text-[15px] leading-[1.7] text-[rgba(244,240,232,.72)]">
              Published client stories appear here only after explicit written approval. This strict boundary separates verified, accountable client impact from general operating standards.
            </p>
          </div>
        </div>
      </header>

      {/* Primary Evidence Section */}
      <section className="bg-[var(--fi-paper)] px-5 py-16 md:px-10 md:py-24" aria-labelledby="approved-evidence-title">
        <h2 id="approved-evidence-title" className="sr-only">Approved client evidence</h2>
        
        {isLoading && (
          <div className="mx-auto max-w-4xl border border-[var(--fi-line)] bg-[var(--fi-cream)] p-16 text-center" data-testid="proof-loading">
            <Loader2 className="mx-auto mb-6 w-8 h-8 text-[var(--fi-rust)] animate-spin" />
            <p className="text-lg font-bold">Checking approved evidence</p>
            <p className="mt-2 text-sm text-[rgba(19,32,31,.6)]">Retrieving approved records...</p>
          </div>
        )}

        {isError && (
          <div className="mx-auto max-w-4xl border border-red-200 bg-red-50 p-10 flex flex-col items-center text-center sm:flex-row sm:text-left gap-8" role="alert" data-testid="proof-error">
            <div className="flex h-16 w-16 items-center justify-center border border-red-200 bg-white text-red-600 shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-900 mb-2">Verification Failed</p>
              <p className="text-[15px] leading-[1.6] text-red-800 mb-6">Approved stories could not be loaded from the secure ledger. Retry the request when ready.</p>
              <button onClick={retry} className="fi-btn-outline !border-red-600 !text-red-700 hover:!bg-red-600 hover:!text-white">
                <RefreshCw className="w-4 h-4" /> Retry Connection
              </button>
            </div>
          </div>
        )}

        {!isLoading && !isError && testimonials.length === 0 && caseStudies.length === 0 && (
          <div className="mx-auto max-w-4xl border border-[var(--fi-line)] bg-[var(--fi-cream)] p-12 md:p-20 text-center" data-testid="proof-empty">
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center border border-[var(--fi-line)] bg-[var(--fi-paper)]">
              <ShieldAlert className="w-6 h-6 text-[rgba(19,32,31,.4)]" />
            </div>
            <h2 className="fi-serif text-4xl mb-6">A strict standard for evidence</h2>
            <p className="mx-auto max-w-2xl text-[16px] leading-[1.7] text-[rgba(19,32,31,.75)] mb-10">
              No client stories are currently approved for public distribution. We maintain a strict policy of never substituting unverified or anonymous results for real evidence. Until a record has clear provenance and publication approval, it stays private. You can review the operating standards below.
            </p>
            <a href="#standards" className="fi-btn-outline">
              View Operating Standards
            </a>
          </div>
        )}

        {!isLoading && !isError && (testimonials.length > 0 || caseStudies.length > 0) && (
          <div className="mb-16 border-b border-[var(--fi-line)] pb-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--fi-rust)]">
              Approved client evidence
            </h2>
            <p className="mt-2 text-sm text-[rgba(19,32,31,.6)]">Named stories, quotes, and measurable outcomes.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-24">
            {/* Case Studies */}
            {caseStudies.length > 0 && (
              <div className="space-y-16">
                {caseStudies.map((study, idx) => (
                  <article key={study.id} className="border border-[var(--fi-line)] bg-[var(--fi-cream)]" data-testid={`card-case-study-${study.id}`}>
                    <div className="grid lg:grid-cols-[1fr_.8fr]">
                      <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-[var(--fi-line)]">
                        <div className="mb-8 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[.2em]">
                           <span className="text-[var(--fi-rust)]">Case 0{idx + 1}</span>
                           <span className="h-1 w-1 bg-[var(--fi-line)]" />
                           <span className="text-[rgba(19,32,31,.5)]">{study.clientLabel}</span>
                        </div>
                        <h3 className="fi-serif text-[clamp(2rem,4vw,3.2rem)] leading-[1] mb-10">{study.title}</h3>
                        
                        <div className="space-y-8">
                          <div>
                            <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[rgba(19,32,31,.5)]">The Challenge</p>
                            <p className="text-[15px] leading-[1.65] text-[rgba(19,32,31,.8)]">{study.challenge}</p>
                          </div>
                          <div>
                            <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[rgba(19,32,31,.5)]">The Solution</p>
                            <p className="text-[15px] leading-[1.65] text-[rgba(19,32,31,.8)]">{study.solution}</p>
                          </div>
                        </div>
                        <EvidenceProvenance record={study} />
                      </div>
                      
                      <div className="p-8 md:p-12 bg-[var(--fi-paper)]">
                        <p className="mb-8 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--fi-ink)]">Measurable Impact</p>
                        <ul className="space-y-6">
                          {study.results.map((result, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-4 text-[15px] font-medium leading-[1.6]">
                              <Check className="mt-1 w-4 h-4 text-[var(--fi-rust)] shrink-0" />
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

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <div>
                <h3 className="mb-10 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--fi-ink)] border-b border-[var(--fi-line)] pb-4">Direct Citations</h3>
                <div className="grid gap-8 md:grid-cols-2">
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="flex flex-col border border-[var(--fi-line)] bg-[var(--fi-cream)] p-8 md:p-10" data-testid={`card-testimonial-${testimonial.id}`}>
                      <p className="mb-10 flex-1 text-[20px] font-medium leading-[1.6]">"{testimonial.quote}"</p>
                      
                      <div className="border-t border-[var(--fi-line)] pt-8">
                        <p className="text-[16px] font-bold">{testimonial.name}</p>
                        <p className="mt-1 text-[13px] text-[rgba(19,32,31,.6)]">{testimonial.title}, {testimonial.company}</p>
                        {testimonial.outcome && (
                          <div className="mt-6 border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 flex gap-4 items-start">
                             <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--fi-rust)]">Result</span>
                             <span className="text-[14px] font-medium leading-[1.5]">{testimonial.outcome}</span>
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
      <section id="standards" className="border-t border-[var(--fi-line)] bg-[var(--fi-cream)] px-5 py-20 md:px-10 md:py-32" data-testid="section-proof-fallback">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-16 max-w-3xl">
            <h2 className="fi-serif text-[clamp(2.8rem,5vw,4.5rem)] leading-[.9] mb-6">Operating Standards For The Field</h2>
            <p className="text-[17px] leading-[1.7] text-[rgba(19,32,31,.72)]">
              Baseline targets for trained teams. These are the field realities we coach toward, representing healthy operation, not explicit client claims. They show the structural discipline expected from a high-performing unit.
            </p>
          </div>

          <div className="border border-[var(--fi-line)] bg-[var(--fi-paper)] p-8 md:p-14">
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
