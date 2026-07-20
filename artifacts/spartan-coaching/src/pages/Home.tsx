import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Briefcase, Wrench, CheckCircle } from "lucide-react";
import { SEO } from "@/components/SEO";
import { FadeIn, StaggerContainer, StaggerItem, AnimatedCounter } from "@/components/animations";
import { lazy, Suspense, Component } from "react";
import type { ReactNode } from "react";

const SpartanHeroAnimation = lazy(() =>
  import("@/components/SpartanHeroAnimation").then((m) => ({ default: m.SpartanHeroAnimation })),
);

class AnimationErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  componentDidCatch() {
    this.setState({ failed: true });
  }
  render() {
    return this.state.failed ? <div className="absolute inset-0 bg-[#080808]" /> : this.props.children;
  }
}

export default function Home() {
  return (
    <div className="flex flex-col">
      <SEO />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            name: "Spartan Coaching",
            description:
              "Practical coaching for hospice growth professionals. Build consistent referral relationships and execute territory strategy with discipline, ethical messaging, and measurable weekly accountability.",
            url: typeof window !== "undefined" ? window.location.origin : "",
            serviceType: [
              "Hospice Growth Coaching",
              "Sales Training",
              "Strategic Consulting",
              "Leadership Coaching",
            ],
            areaServed: "US",
            knowsAbout: [
              "Hospice Sales",
              "Healthcare Sales Training",
              "Medicare Hospice Benefits",
              "Referral Development",
              "Territory Management",
            ],
          })}
        </script>
      </Helmet>

      {/* ── 1. HERO ── */}
      <section
        className="relative min-h-[85vh] sm:min-h-screen flex items-center justify-center overflow-hidden bg-[#080808]"
        data-testid="section-hero"
      >
        <AnimationErrorBoundary>
          <Suspense fallback={<div className="absolute inset-0 bg-[#080808]" />}>
            <SpartanHeroAnimation />
          </Suspense>
        </AnimationErrorBoundary>
        <div className="absolute inset-x-0 bottom-0 z-10 pb-12 sm:pb-16 pt-24 bg-gradient-to-t from-[#080808] via-[#080808]/85 to-transparent">
          <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Close the gap between eligibility and care
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              Expert hospice growth coaching and a private Field Kit — discipline, empathy, and strategy that hold up on a Tuesday afternoon.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
              <Button size="lg" asChild className="font-bold px-8" data-testid="button-hero-contact">
                <Link href="/contact">
                  Book a strategy call
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="font-bold border-white/30 text-white hover:bg-white/5 px-8"
                data-testid="button-hero-method"
              >
                <Link href="/method">Explore the method</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="font-bold border-white/30 text-white hover:bg-white/5 px-8"
                data-testid="button-hero-fieldkit"
              >
                <Link href="/tools">Field Kit access</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. PROOF STRIP ── */}
      <section
        className="relative bg-[#040404] border-b border-red-900/20 py-7 sm:py-10 overflow-hidden"
        data-testid="section-proof-strip"
      >
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-15 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-red-900/25">
            {[
              { target: 18, suffix: " Days", label: "Avg. hospice LOS", detail: "vs. 6-month Medicare benefit" },
              { target: 500, suffix: "K+", label: "Miss hospice annually", detail: "who would have qualified" },
              { target: 12, suffix: "+", label: "Years in the work", detail: "hospice sales & leadership" },
              { target: 500, suffix: "+", label: "Reps & leaders coached", detail: "measurable field performance" },
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

      {/* ── 3. PROBLEM (short) ── */}
      <section className="relative bg-gray-950 py-16 sm:py-20" data-testid="section-stakes">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-sm font-bold tracking-widest text-red-400 uppercase mb-4">The real problem</p>
            <h2 className="text-h2 font-bold text-white mb-6 font-display" data-testid="text-stakes-title">
              The gap is not clinical. It is conversational.
            </h2>
            <p className="text-body-lg text-white/75 leading-relaxed mb-8">
              Eligible patients miss hospice because the right conversations never happen — a stalled referral, a “not yet” without a response, a family who was never asked. Spartan exists to close that gap with structure and heart in the same room.
            </p>
            <Button size="lg" variant="outline" asChild className="font-bold border-white/30" data-testid="button-stakes-manifesto">
              <Link href="/manifesto">
                Read the Spartan Ethos
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* ── 4. THREE PILLARS ── */}
      <section className="relative bg-[#070707] py-16 sm:py-24" data-testid="section-pillars">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-sm font-bold tracking-widest text-red-400 uppercase mb-4">How Spartan helps</p>
              <h2 className="text-h2 text-foreground font-display">Coaching. Systems. Field execution.</h2>
            </div>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Individual & leadership coaching",
                desc: "Virtual sessions, field ridealongs, and leadership rhythms that change Tuesday behavior — not just slide decks.",
                href: "/services",
                cta: "View services",
              },
              {
                icon: Briefcase,
                title: "Team systems & programs",
                desc: "Workshops, growth strategy, and programs built for hospice providers who need one playbook the whole team runs.",
                href: "/programs",
                cta: "View programs",
              },
              {
                icon: Wrench,
                title: "Private Field Kit",
                desc: "AI tools for objections, plans, role-play, and calculators — reserved for clients and approved evaluators.",
                href: "/tools",
                cta: "Explore Field Kit",
              },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <StaggerItem key={p.title}>
                  <Card className="h-full border border-white/10 dark:bg-[#0f0f0f] p-6 flex flex-col" data-testid={`card-pillar-${p.title}`}>
                    <div className="w-12 h-12 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{p.desc}</p>
                    <Link href={p.href} className="text-sm font-bold text-primary inline-flex items-center gap-1 hover:underline">
                      {p.cta} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
          <FadeIn>
            <div className="text-center mt-10">
              <Button asChild variant="outline" className="font-bold">
                <Link href="/method">
                  See the Spartan Method
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 5. OUTCOMES (compact) ── */}
      <section className="relative bg-[#060606] py-16 sm:py-20" data-testid="section-results">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-sm font-bold tracking-widest text-red-400 uppercase mb-4">Outcomes</p>
              <h2 className="text-h2 text-gradient-elegant font-display" data-testid="text-results-title">
                What changes look like
              </h2>
            </div>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
            {[
              {
                title: "Clarity and follow-through",
                text: "Priority accounts become clear. Follow-up stops slipping. Weekly focus holds when the week is hard.",
              },
              {
                title: "Better next steps",
                text: "Conversations move. Post-visit plans stick. Leaders coach one skill at a time instead of firefighting.",
              },
            ].map((c) => (
              <StaggerItem key={c.title}>
                <Card className="border border-white/8 dark:bg-[#0f0f0f] border-l-4 border-l-primary p-6 h-full">
                  <h3 className="text-lg font-bold text-foreground mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.text}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <FadeIn>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mb-8">
              {[
                "Hospice-specific, not generic sales training",
                "Compliance-aware messaging",
                "Field-tested frameworks",
              ].map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 text-sm text-foreground/90 border border-white/8 rounded-full px-4 py-2"
                >
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  {b}
                </div>
              ))}
            </div>
            <div className="text-center">
              <Button asChild variant="outline" className="font-bold">
                <Link href="/testimonials">
                  Read outcomes & testimonials
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 6. CLOSING ── */}
      <section className="relative bg-gray-950 py-20 sm:py-28" data-testid="section-closing">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <FadeIn>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm font-bold tracking-widest text-red-400 uppercase mb-6">Ready to close the gap?</p>
            <h2 className="text-h2 font-bold text-white mb-6 font-display" data-testid="text-closing-title">
              Stop winging it.
            </h2>
            <p className="text-body-lg text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
              If you are ready to build a system that holds when the week is hard, reach out. Honest conversation — no pressure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Button size="lg" asChild className="font-bold px-10" data-testid="button-closing-contact">
                <Link href="/contact">
                  Book a strategy call
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-bold border-white/30" data-testid="button-closing-request">
                <Link href="/request-access">Request Field Kit access</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-bold border-white/30" data-testid="button-closing-about">
                <Link href="/about">About Nick Lynch</Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
