import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Wrench, CheckCircle } from "lucide-react";
import { SEO } from "@/components/SEO";
import { TrustStrip } from "@/components/TrustStrip";
import { ProofStrip } from "@/components/ProofStrip";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import { lazy, Suspense, Component } from "react";
import type { ReactNode } from "react";
import nickPhoto from "@assets/nick-photo.jpg";

const CANONICAL_ORIGIN = "https://spartanhospicecoaching.com";

/** Kinetic brand hero (SpartanHeroAnimation) — full-bleed, no HTML text overlay. */
const SpartanHeroAnimation = lazy(() =>
  import("@/components/SpartanHeroAnimation").then((m) => ({
    default: m.SpartanHeroAnimation,
  })),
);

class AnimationErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  componentDidCatch() {
    this.setState({ failed: true });
  }
  render() {
    return this.state.failed ? (
      <div className="absolute inset-0 bg-black" />
    ) : (
      this.props.children
    );
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
            "@graph": [
              {
                "@type": "ProfessionalService",
                "@id": `${CANONICAL_ORIGIN}/#organization`,
                name: "Spartan Coaching",
                description:
                  "Practical coaching for hospice growth professionals. Build consistent referral relationships and execute territory strategy with discipline, ethical messaging, and measurable weekly accountability.",
                url: CANONICAL_ORIGIN,
                email: "nick@spartanhospicecoaching.com",
                founder: {
                  "@type": "Person",
                  name: "Nick Lynch",
                  jobTitle: "Founder",
                  url: "https://www.linkedin.com/in/nicholas-lynch-coaching",
                },
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
              },
              {
                "@type": "WebSite",
                name: "Spartan Coaching",
                url: CANONICAL_ORIGIN,
                description:
                  "Hospice sales consulting and growth coaching for liaisons, directors, and multi-market teams.",
              },
            ],
          })}
        </script>
      </Helmet>

      {/* ── 1. HERO — SpartanHeroAnimation only (no HTML text overlay) ── */}
      <section
        className="relative min-h-[85vh] sm:min-h-screen flex items-center justify-center overflow-hidden bg-background"
        data-testid="section-hero"
      >
        <AnimationErrorBoundary>
          <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
            <SpartanHeroAnimation />
          </Suspense>
        </AnimationErrorBoundary>
        {/* SEO/a11y only — not painted over the animation */}
        <h1 className="sr-only" data-testid="text-home-hero-title">
          Close the conversational gap. Get eligible patients into care earlier.
        </h1>
      </section>

      {/* ── 2. AUTHORITY STRIP (photo + credentials — hire confidence) ── */}
      <section
        className="relative border-y border-border bg-card text-card-foreground surface-noise"
        data-testid="section-authority"
      >
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-30 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <FadeIn>
            <div className="grid md:grid-cols-[240px_1fr] gap-10 md:gap-14 items-center">
              <div className="relative mx-auto md:mx-0 w-44 sm:w-52 md:w-full aspect-[4/5] overflow-hidden rounded-2xl border border-primary/30 shadow-elite-red ring-1 ring-primary/20">
                <img
                  src={nickPhoto}
                  alt="Nick Lynch, founder of Spartan Coaching"
                  className="w-full h-full object-cover object-top"
                  width={416}
                  height={520}
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-primary shadow-[0_0_20px_hsl(var(--primary))]" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-kicker mb-3">
                  Hospice growth coaching
                </p>
                <h2 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-foreground mb-4 leading-[1.08]">
                  Built by someone who has run the territory — not a generic sales trainer.
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                  Nick Lynch coaches hospice liaisons, directors, and multi-market teams on the
                  conversations and weekly systems that move eligible patients into care — with ethics
                  and accountability in the same room.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Button size="lg" asChild className="font-bold" data-testid="button-authority-contact">
                    <Link href="/contact">
                      Book a strategy call
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="font-bold" data-testid="button-authority-about">
                    <Link href="/about">About Nick Lynch</Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 3. PROBLEM (short) ── */}
      <section className="relative surface-band py-16 sm:py-20" data-testid="section-stakes">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-sm font-bold tracking-widest text-primary uppercase mb-4">The real problem</p>
            <h2 className="text-h2 font-bold text-foreground mb-6 font-display" data-testid="text-stakes-title">
              The gap is not clinical. It is conversational.
            </h2>
            <p className="text-body-lg text-muted-foreground leading-relaxed mb-8">
              Eligible patients miss hospice because the right conversations never happen — a stalled referral, a “not yet” without a response, a family who was never asked. Spartan exists to close that gap with structure and heart in the same room.
            </p>
            <Button size="lg" variant="outline" asChild className="font-bold border-2" data-testid="button-stakes-manifesto">
              <Link href="/manifesto">
                Read the Spartan Ethos
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* ── 4. TWO DOORS — Consulting vs Membership ── */}
      <section className="relative page-persuasion py-16 sm:py-24" data-testid="section-pillars">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-kicker justify-center mb-4">How Spartan helps</p>
              <h2 className="text-h2 text-foreground font-display">Two clear offers. One firm.</h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed">
                Hire Spartan Coaching for human consulting — or start a membership for tools and resources on web and iPhone.
              </p>
            </div>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Briefcase,
                kicker: "Offer A · Consulting",
                title: "Human coaching & programs",
                desc: "Strategy calls, individual coaching, ridealongs, team workshops, and leadership systems for hospice growth teams.",
                href: "/services",
                cta: "Book a strategy call",
                primary: true,
                testId: "card-door-consulting",
              },
              {
                icon: Wrench,
                kicker: "Offer B · Membership",
                title: "Tools & resources subscription",
                desc: "Command Center, practice tools, plans, calculators, and learn resources. Preview free. Live use $14.99/week — cancel anytime.",
                href: "/membership",
                cta: "Start membership",
                primary: false,
                testId: "card-door-membership",
              },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <StaggerItem key={p.title}>
                  <Card
                    className={`h-full p-6 sm:p-8 flex flex-col ${p.primary ? "border-primary/40 elite-emphasis" : "border-border"}`}
                    data-testid={p.testId}
                  >
                    <p className="text-[10px] font-bold tracking-widest uppercase text-primary mb-3">{p.kicker}</p>
                    <div className="w-12 h-12 rounded-xl bg-primary/12 text-primary flex items-center justify-center mb-5 ring-1 ring-primary/20">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2 tracking-tight">
                      {p.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">{p.desc}</p>
                    <Button asChild className="font-bold w-full sm:w-auto" variant={p.primary ? "default" : "outline"}>
                      <Link href={p.href}>
                        {p.cta}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ── 5. PROOF (trust, not hollow claims) ── */}
      <section className="relative bg-background py-16 sm:py-24" data-testid="section-results">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <ProofStrip />
          </FadeIn>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mt-10">
            {[
              "Hospice-specific, not generic sales training",
              "Compliance-aware messaging",
              "Field-tested frameworks",
            ].map((b) => (
              <div
                key={b}
                className="flex items-center gap-2 text-sm text-foreground/90 border border-border rounded-full px-4 py-2"
              >
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. TRUST ── */}
      <section className="relative bg-background py-14 sm:py-18" data-testid="section-trust">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <TrustStrip />
          </FadeIn>
        </div>
      </section>

      {/* ── 7. CLOSING — two clear CTAs only ── */}
      <section className="relative surface-band py-20 sm:py-32" data-testid="section-closing">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-40 pointer-events-none" />
        <FadeIn>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center elite-panel p-8 sm:p-12">
            <p className="text-kicker mb-6 justify-center">Ready to close the gap?</p>
            <h2 className="text-h1 font-bold text-foreground mb-6 font-display" data-testid="text-closing-title">
              Stop winging it.
            </h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              If you are ready to build a system that holds when the week is hard, reach out. Honest conversation — no pressure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="font-bold px-10 shadow-lg" data-testid="button-closing-contact">
                <Link href="/contact">
                  Book a strategy call
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-bold border-2" data-testid="button-closing-field-kit">
                <Link href="/membership">Start membership</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Prefer detail first?{" "}
              <Link href="/services" className="font-semibold text-primary hover:underline" data-testid="button-closing-services">
                View consulting services
              </Link>
              {" · "}
              <Link href="/membership" className="font-semibold text-primary hover:underline" data-testid="button-closing-method">
                Membership tools &amp; resources
              </Link>
            </p>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
