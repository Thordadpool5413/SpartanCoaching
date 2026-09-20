import { AccentText } from "@/components/AccentText";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";
import { Quote, TrendingUp, Users, Award, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FadeIn } from "@/components/animations";
import { ProofStrip } from "@/components/ProofStrip";
import type { SelectTestimonial, SelectCaseStudy } from "@shared/schema";

export default function Testimonials() {
  const { data: testimonialsData, isLoading: testimonialsLoading } = useQuery<{ testimonials: SelectTestimonial[] }>({
    queryKey: ["/api/testimonials"],
  });

  const { data: caseStudiesData, isLoading: caseStudiesLoading } = useQuery<{ caseStudies: SelectCaseStudy[] }>({
    queryKey: ["/api/case-studies"],
  });

  const testimonials = testimonialsData?.testimonials || [];
  const caseStudies = caseStudiesData?.caseStudies || [];
  const isLoading = testimonialsLoading || caseStudiesLoading;

  return (
    <div className="page-persuasion w-full max-w-7xl mx-auto spacing-container spacing-section">
      <SEO />
      <BackButton />
      <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-16">
        <h1 className="text-h1 text-foreground mb-6" data-testid="text-testimonials-title">
          Success <span className="text-primary">Stories</span>
        </h1>
        <p className="text-body-lg text-muted-foreground leading-relaxed">
          Real results from reps, leaders, and organizations who chose the Spartan way: fewer buzzwords, more practice. Clear standards, straight talk, measurable outcomes. Behind every number is a family that got the conversation they needed.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Never show a hollow Success Stories page */}
          {testimonials.length === 0 && caseStudies.length === 0 && (
            <div className="mb-16" data-testid="section-proof-fallback">
              <ProofStrip showLink={false} title="Outcomes operators describe" />
            </div>
          )}

          {/* Testimonials Section */}
          {testimonials.length > 0 && (
            <div className="space-y-8 md:space-y-12 lg:space-y-16">
              <div className="flex items-center gap-3 mb-8">
                <Quote className="w-8 h-8 text-primary" />
                <h2 className="text-h2 text-foreground">What People Are <span className="text-primary">Saying</span></h2>
              </div>

              <div className="grid md:grid-cols-3 gap-cards">
                {testimonials.map((testimonial) => (
                  <Card key={testimonial.id} className="flex flex-col hover-elevate transition-elegant border-2 group relative spacing-card" data-testid={`card-testimonial-${testimonial.id}`}>
                    <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex-1 relative">
                      <div className="mb-4">
                        <Quote className="w-8 h-8 text-primary/20" />
                      </div>
                      <p className="text-base text-muted-foreground italic leading-relaxed mb-6">
                        "{testimonial.quote}"
                      </p>
                      <div className="border-t pt-4">
                        <p className="font-bold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                        <p className="text-sm text-muted-foreground mb-3">{testimonial.company}</p>
                        <div className="bg-primary/10 rounded-lg p-3">
                          <p className="text-sm font-semibold text-primary mb-1">Result:</p>
                          <p className="text-sm text-foreground">{testimonial.outcome}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Case Studies Section */}
          {caseStudies.length > 0 && (
            <div className="space-y-8 md:space-y-12 lg:space-y-16">
              <div className="flex items-center gap-3 mt-12 mb-8">
                <Award className="w-8 h-8 text-primary" />
                <h2 className="text-h2 text-foreground">Case <span className="text-primary">Studies</span></h2>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {caseStudies.map((study) => (
                  <Card key={study.id} className="hover-elevate transition-elegant border-2 group relative spacing-card" data-testid={`card-case-study-${study.id}`}>
                    <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                          <h3 className="text-h3 font-bold text-foreground mb-3"><AccentText>{study.title}</AccentText></h3>
                          <p className="text-sm text-muted-foreground mb-6">{study.clientLabel}</p>

                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold text-foreground mb-2">The Challenge:</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{study.challenge}</p>
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-foreground mb-2">The Solution:</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{study.solution}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-primary/10 to-destructive/10 rounded-lg p-6 border border-primary/20">
                          <p className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Measurable Results
                          </p>
                          <ul className="space-y-4">
                            {study.results.map((result, rIdx) => (
                              <li key={rIdx} className="flex items-start gap-3">
                                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-sm font-medium text-foreground leading-relaxed">{result}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Categories Explanation */}
      <div className="grid md:grid-cols-3 gap-cards mb-12">
        <Card className="text-center hover-elevate transition-elegant border-2 group relative spacing-card">
          <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-spartan-gradient flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-h3 font-bold text-foreground mb-2"><AccentText>Individual Reps</AccentText></h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sales professionals improving their territory performance, conversion rates, and execution consistency.
            </p>
          </div>
        </Card>

        <Card className="text-center hover-elevate transition-elegant border-2 group relative spacing-card">
          <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-spartan-gradient flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-h3 font-bold text-foreground mb-2"><AccentText>Sales Leadership</AccentText></h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Managers and directors building consistent team performance and scalable coaching systems.
            </p>
          </div>
        </Card>

        <Card className="text-center hover-elevate transition-elegant border-2 group relative spacing-card">
          <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-spartan-gradient flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-h3 font-bold text-foreground mb-2"><AccentText>Corporate Providers</AccentText></h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Multi-market organizations standardizing execution and making growth predictable across regions.
            </p>
          </div>
        </Card>
      </div>
      <FadeIn delay={0.2}>
        <div className="surface-band rounded-3xl p-10 md:p-16 text-center mt-16 border border-border">
          <h2 className="text-h2 font-black text-foreground mb-6"><AccentText>Ready to See Results Like These?</AccentText></h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Whether you are a rep looking to sharpen your skills, a leader building a team, or an executive scaling across markets, let's talk about what is not working and build a plan that fixes it.
          </p>
          <Button size="lg" asChild className="font-bold shadow-lg touch-manipulation group px-10" data-testid="button-testimonials-contact">
            <Link href="/contact">
              <span>Contact Us</span>
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </FadeIn>
      <PublicConversionPanel
        source="testimonials"
        audience="Leaders and reps looking for relevant examples before they start a conversation."
        promise="A grounded way to compare your challenge with outcomes operators describe."
        evidence="Proof is anonymized and role-based; named logos and claims are used only with permission."
        primary={{ label: "Discuss your situation", href: "/contact", token: "strategy_call" }}
        secondary={{ label: "Review the method", href: "/method", token: "method" }}
      />
    </div>
  );
}
