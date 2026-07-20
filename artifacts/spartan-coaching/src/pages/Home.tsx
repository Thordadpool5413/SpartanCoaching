import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, ArrowRight, Users, Briefcase, Building2, MonitorSmartphone, Target } from "lucide-react";
import { SEO } from "@/components/SEO";
import { FadeIn, StaggerContainer, StaggerItem, AnimatedCounter } from "@/components/animations";
import { lazy, Suspense } from "react";

const SpartanHeroAnimation = lazy(() => import("@/components/SpartanHeroAnimation").then(m => ({ default: m.SpartanHeroAnimation })));

export default function Home() {
  return (
    <div className="flex flex-col">
      <SEO />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "name": "Spartan Coaching",
            "description": "Practical coaching for hospice growth professionals. Build consistent referral relationships and execute territory strategy with discipline, ethical messaging, and measurable weekly accountability.",
            "url": typeof window !== 'undefined' ? window.location.origin : '',
            "serviceType": ["Hospice Growth Coaching", "Sales Training", "Strategic Consulting", "Leadership Coaching"],
            "areaServed": "US",
            "knowsAbout": ["Hospice Sales", "Healthcare Sales Training", "Medicare Hospice Benefits", "Referral Development", "Territory Management"],
          })}
        </script>
      </Helmet>

      {/* ── 1. HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080808]" data-testid="section-hero">
        <Suspense fallback={<div className="absolute inset-0 bg-[#080808]" />}>
          <SpartanHeroAnimation />
        </Suspense>
      </section>

      {/* ── 2. PROOF STRIP ── */}
      <section className="relative bg-[#040404] border-b border-red-900/20 py-7 sm:py-10 overflow-hidden" data-testid="section-proof-strip">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-15 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-red-900/25">
            {[
              { target: 18, suffix: " Days", label: "Avg. hospice length of stay", detail: "vs. 6-month Medicare benefit" },
              { target: 500, suffix: "K+", label: "Americans annually", detail: "who die without hospice they qualified for" },
              { target: 4, suffix: " Hours", label: "Target response window", detail: "referral-to-first-contact" },
              { target: 6, suffix: " Months", label: "Medicare benefit", detail: "the gap that trained reps exist to close" },
            ].map(({ target, suffix, label, detail }, i) => (
              <div key={i} className="text-center md:px-8">
                <p className="font-display text-4xl sm:text-5xl font-black text-primary tracking-tight leading-none mb-2">
                  <AnimatedCounter target={target} suffix={suffix} duration={1.2} />
                </p>
                <p className="text-xs sm:text-sm font-bold text-white/80 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-xs text-white/45 leading-relaxed hidden sm:block">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. PROBLEM ── */}
      <section className="relative bg-gray-950 py-20 sm:py-28" data-testid="section-stakes">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-sm font-bold tracking-widest text-red-400 uppercase mb-6">The Real Problem</p>
            <h2 className="text-h2 font-bold text-white mb-8 font-display" data-testid="text-stakes-title">
              The Gap Is Not Clinical. It Is Conversational.
            </h2>
            <div className="space-y-6 text-body-lg text-white/75 leading-relaxed max-w-3xl mx-auto text-left">
              <p>
                Hundreds of thousands of Americans die each year without hospice care who would have qualified for it. The average hospice length of stay is around eighteen days. The Medicare benefit allows up to six months. That gap does not exist because of bad clinical decisions.
              </p>
              <p className="text-white/90 font-semibold">
                It exists because the right conversations did not happen. A referral that did not get made. A physician who said "not yet" to a rep who did not know how to respond. An eligible patient who never got asked.
              </p>
              <p>
                When a rep does the work well, that changes. A patient stops managing their own pain alone. A family gets a care team instead of a crisis. A daughter gets to be a daughter again instead of a medical coordinator trying to figure out what to do next.
              </p>
            </div>
            <div className="mt-12">
              <Button
                size="lg"
                variant="outline"
                asChild
                className="font-bold glass border-white/30 touch-manipulation group px-10"
                data-testid="button-stakes-manifesto"
              >
                <Link href="/manifesto">
                  <span>Read the Spartan Ethos</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 4. THE SPARTAN METHOD ── */}
      <section className="relative bg-[#070707] spacing-section" data-testid="section-problem-promise">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.06),transparent_50%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-20">
              <p className="text-sm font-bold tracking-widest text-red-400 uppercase mb-4">The Spartan Method</p>
              <h2 className="text-h2 text-foreground" data-testid="text-method-title">
                Why Hospice Growth Feels Chaotic — And What Fixes It
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-sections mb-16">
            <FadeIn>
              <div>
                <h3 className="text-h3 text-foreground mb-8" data-testid="text-problem-title">
                  What's Stalling Your Team
                </h3>
                <div className="space-y-4">
                  {[
                    "Your calendar is full but your pipeline is flat",
                    "Follow up falls through the cracks every week",
                    "Objections stall conversations you should be winning",
                    "Territory planning is a spreadsheet nobody updates",
                    "New reps take months to produce and experienced reps plateau",
                  ].map((problem, index) => (
                    <div key={index} className="flex items-start gap-3" data-testid={`text-problem-${index}`}>
                      <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-body text-muted-foreground">{problem}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div>
                <h3 className="text-h3 text-gradient-elegant mb-8" data-testid="text-promise-title">
                  What Spartan Fixes
                </h3>
                <div className="space-y-4">
                  {[
                    "A repeatable weekly system that tells you where to go, who to see, and what to say",
                    "Messaging frameworks that earn trust with clinical staff",
                    "Scorecard accountability so progress is visible, not assumed",
                    "Coaching that happens in the work, not in a lecture hall",
                  ].map((fix, index) => (
                    <div key={index} className="flex items-start gap-3" data-testid={`text-fix-${index}`}>
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-body text-foreground font-medium">{fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>

          {/* How It Works steps */}
          <FadeIn>
            <h3 className="text-h3 text-foreground text-center mb-10" data-testid="text-how-it-works-title">
              How It Works
            </h3>
          </FadeIn>
          <StaggerContainer className="space-y-4">
            {[
              { step: 1, title: "Intake and Baseline", desc: "We assess your current territory, pipeline, and habits. No judgment, just a clear starting point." },
              { step: 2, title: "Week One Territory Plan", desc: "You walk away with a plan, success metrics, and a clear weekly rhythm. Time commitment: 2 to 3 hours per week including prep." },
              { step: 3, title: "Weekly Coaching and Execution Debrief", desc: "Each week we review what happened, what worked, what did not, and what you will do next." },
              { step: 4, title: "Scorecard Accountability", desc: "Progress is measured through behaviors and activities, not just outcomes." },
              { step: 5, title: "Refinement and Scaling", desc: "As you build consistency, we refine your approach and expand what is working." },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <Card className="border border-white/8 dark:bg-[#0f0f0f] spacing-card" data-testid={`card-step-${item.step}`}>
                  <div className="flex items-start gap-5">
                    <div className="w-10 h-10 bg-spartan-gradient rounded-sm flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-black text-base">{item.step}</span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── 5. SERVICES PREVIEW ── */}
      <section className="relative bg-gray-950 py-20 sm:py-28" data-testid="section-services-preview">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <p className="text-sm font-bold tracking-widest text-red-400 uppercase mb-4">Services & Pricing</p>
              <h2 className="text-h2 font-bold text-white mb-4 font-display" data-testid="text-services-preview-title">
                Built for Every Level of the Organization
              </h2>
              <p className="text-body-lg text-white/65 max-w-2xl mx-auto">
                Whether you are an individual rep, a sales director, a multi-market operator, or a hospice provider who needs purpose-built technology — there is an engagement built for your situation.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                icon: Users,
                label: "Individual Sales Reps",
                price: "From $40/session",
                desc: "Virtual coaching sessions, field ridealongs, and territory management coaching. Targeted help on exactly what is stalling your results.",
                href: "/services#individual",
              },
              {
                icon: Briefcase,
                label: "Sales Leadership",
                price: "Custom pricing",
                desc: "Team workshops, leadership coaching, and growth strategy consulting. Build teams that execute the same playbook and hold each other accountable.",
                href: "/services#leadership",
              },
              {
                icon: Building2,
                label: "Corporate Providers",
                price: "Custom pricing",
                desc: "Market analysis, system implementation, and executive consulting. Scale execution across markets and make growth predictable and repeatable.",
                href: "/services#corporate",
              },
              {
                icon: MonitorSmartphone,
                label: "Technology Solutions",
                price: "Custom pricing",
                desc: "Custom CRMs, iOS apps, and websites built specifically for hospice providers. Purpose-built tools that fit how your organization actually works.",
                href: "/services#technology",
              },
            ].map((tier, index) => {
              const IconComponent = tier.icon;
              return (
                <StaggerItem key={index}>
                  <Link href={tier.href} className="block h-full" data-testid={`link-service-tier-${index}`}>
                    <Card className="bg-white/5 border border-white/10 spacing-card h-full hover-elevate cursor-pointer">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-xl flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-6 h-6 text-red-400" />
                          </div>
                          <span className="text-sm font-bold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-3 py-1">{tier.price}</span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white mb-2">{tier.label}</h3>
                          <p className="text-sm text-white/60 leading-relaxed">{tier.desc}</p>
                        </div>
                        <div className="flex items-center gap-1 text-red-400 text-sm font-semibold mt-auto pt-2">
                          <span>View services</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

          <FadeIn>
            <div className="text-center">
              <Button
                size="lg"
                asChild
                className="font-bold touch-manipulation group px-10"
                data-testid="button-services-preview-cta"
              >
                <Link href="/services">
                  <span>See All Services & Pricing</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 6. SOCIAL PROOF ── */}
      <section className="relative bg-[#060606] spacing-section" data-testid="section-results">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.03),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-20">
              <p className="text-sm font-bold tracking-widest text-red-400 uppercase mb-4">Outcomes</p>
              <h2 className="text-h2 text-gradient-elegant mb-6" data-testid="text-results-title">
                What Changes Look Like
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-cards">
            <StaggerItem>
              <Card className="border border-white/8 dark:bg-[#0f0f0f] border-l-4 border-l-primary spacing-card h-full" data-testid="card-case-study-1">
                <div className="flex flex-col gap-4">
                  <h3 className="text-h3 text-foreground">Clarity and follow through</h3>
                  <div className="divide-y divide-border">
                    <p className="text-sm text-muted-foreground leading-relaxed pb-3">
                      <span className="font-semibold text-foreground">Starting point:</span> Priority accounts were unclear and follow up was inconsistent.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed py-3">
                      <span className="font-semibold text-foreground">What changed:</span> Weekly focus became clear and follow up stopped slipping.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-3">
                      <span className="font-semibold text-foreground">Actions that drove it:</span> Territory priorities, next step tracking, simple follow through standard.
                    </p>
                  </div>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border border-white/8 dark:bg-[#0f0f0f] border-l-4 border-l-primary spacing-card h-full" data-testid="card-case-study-2">
                <div className="flex flex-col gap-4">
                  <h3 className="text-h3 text-foreground">Better next steps</h3>
                  <div className="divide-y divide-border">
                    <p className="text-sm text-muted-foreground leading-relaxed pb-3">
                      <span className="font-semibold text-foreground">Starting point:</span> Good relationships, but conversations did not consistently move to a next step.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed py-3">
                      <span className="font-semibold text-foreground">What changed:</span> Stronger control of next steps and cleaner follow up.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-3">
                      <span className="font-semibold text-foreground">Actions that drove it:</span> Conversation structure, post visit follow up plan, weekly review.
                    </p>
                  </div>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border border-white/8 dark:bg-[#0f0f0f] border-l-4 border-l-primary spacing-card h-full" data-testid="card-case-study-3">
                <div className="flex flex-col gap-4">
                  <h3 className="text-h3 text-foreground">Real market read</h3>
                  <div className="divide-y divide-border">
                    <p className="text-sm text-muted-foreground leading-relaxed pb-3">
                      <span className="font-semibold text-foreground">Starting point:</span> The market felt confusing and the team was guessing what was happening.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed py-3">
                      <span className="font-semibold text-foreground">What changed:</span> Clear read on territory temperature and where to focus now.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-3">
                      <span className="font-semibold text-foreground">Actions that drove it:</span> Segment accounts, track education touches, validate assumptions with data when needed.
                    </p>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          </StaggerContainer>

          {/* Trust bullets */}
          <FadeIn>
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Hospice-specific coaching, not generic sales training",
                "Compliance-aware messaging that respects clinical workflow",
                "Practical systems that work on Tuesday afternoon, not just in a conference room",
                "Weekly accountability rhythm that keeps execution consistent",
                "Field-tested frameworks used by real hospice growth teams",
                "Coaching that happens in the field, not just on slides",
              ].map((bullet, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border border-white/6 rounded-sm dark:bg-[#0d0d0d]" data-testid={`card-trust-${index}`}>
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground font-medium leading-relaxed">{bullet}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 7. FINAL CTA BAND ── */}
      <section className="relative bg-gray-950 py-24 sm:py-32" data-testid="section-closing">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <FadeIn>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm font-bold tracking-widest text-red-400 uppercase mb-6">Ready to close the gap?</p>
            <h2 className="text-h2 font-bold text-white mb-6 font-display" data-testid="text-closing-title">
              Stop Winging It.
            </h2>
            <p className="text-body-lg text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
              If you are ready to build a system that holds when the week is hard, reach out. No obligation, no pressure. Just an honest conversation about where your team is and what it would take to get it working the way it should.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Button size="lg" asChild className="font-bold shadow-lg touch-manipulation group px-10" data-testid="button-closing-contact">
                <Link href="/contact">
                  <span>Contact Spartan Coaching</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-bold glass border-white/30 touch-manipulation group px-10" data-testid="button-closing-services">
                <Link href="/services">
                  <span>See Services & Pricing</span>
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-bold glass border-white/30 touch-manipulation group px-10" data-testid="button-closing-manifesto">
                <Link href="/manifesto">
                  <span>Read the Spartan Ethos</span>
                </Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
