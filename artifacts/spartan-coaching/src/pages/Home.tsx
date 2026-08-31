import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Wrench, CheckCircle, Sparkles, ShieldCheck, MapPinned } from "lucide-react";
import { SEO } from "@/components/SEO";
import { TrustStrip } from "@/components/TrustStrip";
import { ProofStrip } from "@/components/ProofStrip";
import { AppHandoffPanel } from "@/components/AppHandoffPanel";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import { lazy, Suspense, Component } from "react";
import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import nickPhoto from "@assets/nick-photo.jpg";
import { SITE_ORIGIN } from "@/lib/seo-config";
import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "@/lib/publicFunnel";
import { PublicConversionPanel } from "@/components/PublicConversionPanel";
import { PRICING_FACTS } from "@/lib/complianceCopy";

const CANONICAL_ORIGIN = SITE_ORIGIN;

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
      <div className="absolute inset-0 bg-background" />
    ) : (
      this.props.children
    );
  }
}

export default function Home() {
  const prefersReducedMotion = useReducedMotion();

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

      {/* ── 1. HERO — the film leads, with the offer kept in a dedicated column ── */}
      <section
        className="relative overflow-hidden bg-background"
        data-testid="section-hero"
        aria-labelledby="home-hero-title"
      >
        <img
          src="/hero-poster.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid items-center gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12 xl:gap-16">
            <div className="max-w-2xl text-left">
            <p className="text-kicker mb-5">Hospice sales consulting + Hospice Sales Pro</p>
            <h1
              id="home-hero-title"
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-foreground leading-[1.02]"
              data-testid="text-home-hero-title"
            >
              Make the next hospice conversation count.
            </h1>
            <p className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Practical consulting for growth leaders. A focused field system for the people who
              carry the work forward every day.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="font-bold min-h-12" data-testid="button-hero-consulting">
                <Link
                  href="/services"
                  onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_hero_consulting")}
                >
                  Explore consulting
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-bold min-h-12 bg-background/70" data-testid="button-hero-product">
                <Link
                  href="/hospice-sales-pro"
                  onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_hero_hospice_sales_pro")}
                >
                  See Hospice Sales Pro
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-xs font-medium text-muted-foreground">
              Consulting for teams. Hospice Sales Pro for daily execution.
            </p>
            </div>
            <div className="w-full min-w-0">
              <div
                className="relative aspect-[4/3] sm:aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl ring-1 ring-primary/20 [container-type:size]"
                data-testid="hero-video-frame"
                aria-label="Spartan Coaching hero film"
              >
                <img
                  src="/hero-poster.jpg"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                {!prefersReducedMotion && (
                  <AnimationErrorBoundary>
                    <Suspense fallback={null}>
                      <SpartanHeroAnimation />
                    </Suspense>
                  </AnimationErrorBoundary>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                <p className="pointer-events-none absolute bottom-4 left-5 z-[51] text-[10px] font-bold uppercase tracking-[0.22em] text-white/75">
                  Spartan Coaching · Hospice sales is not a mystery
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-amber-500/25 bg-card py-14 sm:py-18" data-testid="section-spartan-intelligence-public">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-kicker mb-3">New in Elite</p>
                <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-foreground">
                  Spartan Intelligence
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                  Verified public data turned into practical preparation for the next provider conversation.
                  Know the account, understand the policy, and enter with a clear objective.
                </p>
                <Button asChild size="lg" className="mt-7 min-h-11 w-full font-bold sm:w-auto">
                  <Link href="/spartan-intelligence" data-testid="button-home-spartan-intelligence">
                    Explore Spartan Intelligence
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: ShieldCheck, title: "Referral Intelligence", body: "Verify providers and prepare focused account conversations." },
                  { icon: Sparkles, title: "CMS Policy Navigator", body: "Translate complex Medicare topics into clear field language." },
                  { icon: MapPinned, title: "Market Explorer", body: "Search official CMS hospice enrollment data by location." },
                ].map(({ icon: Icon, title, body }) => (
                  <Card key={title} className="border border-border/80 bg-background/70 p-5">
                    <Icon className="h-5 w-5 text-amber-500" />
                    <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </Card>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 2. AUTHORITY STRIP (photo + credentials — hire confidence) ── */}
      <section
        className="relative border-y border-border bg-card text-card-foreground surface-noise"
        data-testid="section-authority"
      >
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-30 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] gap-8 md:gap-12 lg:gap-14 items-center">
              <div className="relative mx-auto md:mx-0 w-40 sm:w-48 md:w-full aspect-[4/5] overflow-hidden rounded-2xl border border-primary/30 shadow-elite-red ring-1 ring-primary/20">
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
                  <Button size="lg" asChild className="font-bold min-h-11 w-full sm:w-auto" data-testid="button-authority-contact">
                    <Link
                      href="/contact"
                      onClick={() =>
                        trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_authority_contact")
                      }
                    >
                      Book a strategy call
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="font-bold min-h-11 w-full sm:w-auto" data-testid="button-authority-about">
                    <Link
                      href="/about"
                      onClick={() =>
                        trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_authority_about")
                      }
                    >
                      About Nick Lynch
                    </Link>
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

      {/* ── 4. TWO DOORS — Consulting vs Hospice Sales Pro ── */}
      <section className="relative page-persuasion py-12 sm:py-16 lg:py-24" data-testid="section-pillars">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-8 sm:mb-12 lg:mb-14">
              <p className="text-kicker justify-center mb-4">How Spartan helps</p>
              <h2 className="text-h2 text-foreground font-display">Two clear offers. One firm.</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
              Choose human coaching for the team or a field system for the work between conversations.
            </p>
            </div>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                icon: Briefcase,
                kicker: "Offer A · Consulting",
                title: "Human coaching & programs",
                desc: "Strategy calls, individual coaching, ridealongs, team workshops, and leadership systems for hospice growth teams.",
                features: ["1:1 & leadership coaching", "Team workshops", "Territory systems"],
                href: "/services",
                cta: "View consulting services",
                primary: true,
                testId: "card-door-consulting",
              },
              {
                icon: Wrench,
                kicker: "Offer B · Hospice Sales Pro",
                title: "The tools product — web + iPhone",
                desc: "What you actually get: daily Command Center, practice tools, plans, calculators, and field resources.",
                features: [
                  "Sales Command Center",
                  "Objections · role-play · email · playbooks",
                  "Weekly plan · activity · ROI · branch math",
                  `Elite recommended · ${PRICING_FACTS.eliteWeeklyShort} · Standard ${PRICING_FACTS.individualWeeklyShort}`,
                ],
                href: "/hospice-sales-pro",
                cta: "Explore Hospice Sales Pro",
                primary: false,
                testId: "card-door-hospice-sales-pro",
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
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.desc}</p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2 text-sm text-foreground">
                          <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="font-bold w-full min-h-11" variant={p.primary ? "default" : "outline"}>
                      <Link
                        href={p.href}
                        onClick={() =>
                          trackPublicFunnelEvent(
                            PUBLIC_FUNNEL_EVENT.ctaClick,
                            p.primary ? "home_consulting" : "home_hospice_sales_pro",
                          )
                        }
                      >
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

      {/* ── 4b. WEB ↔ IPHONE — same product, clear handoff ── */}
      <section className="relative bg-background py-12 sm:py-16 lg:py-20" data-testid="section-app-handoff">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <AppHandoffPanel
              destination="command"
              title="The field system does not stay at your desk."
              description="Hospice Sales Pro is the same product on web and iPhone. Open Command Center before a visit, then return to the browser when you want the full workspace."
            />
          </FadeIn>
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

      <PublicConversionPanel
        source="home"
        audience="Hospice growth leaders, sales professionals, and provider teams choosing between human consulting and daily field tools."
        promise="A practical path from the next conversation to a repeatable operating rhythm."
        evidence="Field-tested coaching, role-based proof, and clear no-PHI product boundaries."
        primary={{ label: "Book a strategy call", href: "/contact", token: "strategy_call" }}
        secondary={{ label: "Explore Hospice Sales Pro", href: "/hospice-sales-pro", token: "hospice_sales_pro" }}
      />
    </div>
  );
}
