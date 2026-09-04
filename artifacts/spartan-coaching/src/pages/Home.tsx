import { AccentText } from "@/components/AccentText";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Wrench, CheckCircle, ShieldCheck, MapPinned, UserCheck, Check } from "lucide-react";
import { SEO } from "@/components/SEO";
import { TrustStrip } from "@/components/TrustStrip";
import { ProofStrip } from "@/components/ProofStrip";
import { AppHandoffPanel } from "@/components/AppHandoffPanel";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import { SITE_ORIGIN } from "@/lib/seo-config";
import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "@/lib/publicFunnel";
import { PRICING_FACTS } from "@/lib/complianceCopy";
import { FieldBriefExperience } from "@/components/FieldBriefExperience";
import { FIELD_KIT_TOOLS } from "@/lib/fieldKitCatalog";
import founderPhoto from "@assets/nick-photo.jpg";

const CANONICAL_ORIGIN = SITE_ORIGIN;
function HeroSystemPanel() {
  return (
    <figure className="hero-intro-figure absolute inset-x-0 top-[12%] z-10">
      <div
        className="hero-intro-frame relative aspect-video overflow-hidden border-2 border-foreground bg-background shadow-[10px_10px_0_hsl(var(--primary))]"
        data-testid="hero-video-frame"
      >
        <div className="absolute inset-0 grid grid-cols-[1fr_0.75fr]">
          <div className="flex flex-col justify-between p-4 sm:p-6">
            <p className="font-mono text-sm font-bold uppercase tracking-[0.1em] text-primary">
              The field operating system
            </p>
            <div className="space-y-0.5 font-display text-3xl uppercase leading-[0.9] text-foreground sm:text-4xl">
              <p>Prepare.</p>
              <p>Practice.</p>
              <p className="text-primary">Execute.</p>
              <p>Review.</p>
            </div>
            <p className="hidden max-w-xs text-sm font-semibold leading-snug text-foreground xl:block">
              One disciplined rhythm for the conversations that move hospice growth forward.
            </p>
          </div>
          <div className="relative border-l border-border bg-muted">
            <img
              src="/spartan-logo-stamp.png"
              alt=""
              aria-hidden
              width={512}
              height={512}
              className="absolute inset-0 h-full w-full object-contain p-5 opacity-20"
            />
            <div className="absolute inset-x-0 bottom-0 border-t border-border bg-background p-4 text-center">
              <p className="font-display text-2xl uppercase leading-none text-primary">Hospice Sales Pro</p>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        The Spartan field operating system: prepare, practice, execute, and review.
      </figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <div className="page-persuasion public-home flex flex-col bg-background text-foreground font-sans">
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
                description: "Practical coaching for hospice growth professionals. Build consistent referral relationships and execute territory strategy with discipline, ethical messaging, and measurable weekly accountability.",
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
                description: "Hospice sales consulting and growth coaching for liaisons, directors, and multi-market teams.",
              },
            ],
          })}
        </script>
      </Helmet>

      {/* ── 1. HERO — SPLIT LAYOUT ── */}
      <section className="relative overflow-hidden border-b border-border bg-background" data-testid="section-hero" aria-labelledby="home-hero-title">
        <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] xl:gap-16">
            <div className="max-w-2xl text-left">
              <p className="text-sm font-bold tracking-[0.1em] uppercase text-primary mb-6 flex items-center gap-2">
                <span className="w-8 h-px bg-primary"></span>
                Hospice Sales Consulting + Hospice Sales Pro
              </p>
              <h1
                id="home-hero-title"
                className="text-6xl sm:text-7xl lg:text-8xl font-display font-black tracking-tighter text-foreground uppercase leading-[0.9]"
                data-testid="text-home-hero-title"
              >
                Make the next<br/>
                hospice<br/>
                <span className="text-primary">conversation</span><br/>
                count.
              </h1>
               <p className="mt-8 max-w-xl text-xl text-foreground font-medium leading-relaxed">
                Practical consulting for growth leaders. A focused field system for the people who carry the work forward every day.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild className="font-display uppercase tracking-widest min-h-14 rounded-none bg-primary hover:bg-foreground text-primary-foreground border-none text-sm" data-testid="button-hero-consulting">
                  <Link href="/services" onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_hero_consulting")}>
                    Explore consulting
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="font-display uppercase tracking-widest min-h-14 rounded-none border-2 border-foreground text-foreground hover:bg-foreground hover:text-background text-sm" data-testid="button-hero-product">
                  <Link href="/hospice-sales-pro" onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_hero_hospice_sales_pro")}>
                    See Hospice Sales Pro
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm font-bold uppercase tracking-[0.06em] text-foreground">
                <span className="text-foreground">Built for <span className="text-spartan-red">leaders.</span></span>
                <span className="text-foreground">Driven by <span className="text-spartan-red">experience.</span></span>
                <span className="text-foreground">Focused on <span className="text-spartan-red">results.</span></span>
              </div>
            </div>

            <div className="w-full min-w-0 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[34rem] min-h-[24rem] sm:min-h-[30rem] lg:min-h-[32rem] overflow-hidden">
                <div
                  className="absolute right-0 top-[9%] h-px w-[78%] bg-foreground"
                  aria-hidden="true"
                />
                <div
                  className="absolute right-0 top-[calc(9%+8px)] h-px w-[38%] bg-primary"
                  aria-hidden="true"
                />
                <HeroSystemPanel />
                <div className="absolute bottom-1 left-0 z-20 border-l-4 border-primary bg-background/95 px-4 py-3">
                  <p className="font-mono text-sm font-bold uppercase tracking-[0.1em] text-primary">
                    Field standard 01
                  </p>
                  <p className="mt-1 font-display text-2xl uppercase leading-none text-foreground">
                    Prepared beats <span className="text-spartan-red">improvised.</span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CAPABILITY STRIP */}
      <section className="border-b border-border bg-card">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-7">
          <div className="flex gap-4">
            <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
            <div>
              <p className="font-bold text-sm uppercase tracking-wide"><AccentText>Private & Secure</AccentText></p>
              <p className="text-xs text-muted-foreground mt-1">Your data. Your practice. Always protected.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-4xl font-display font-black text-primary leading-none">
              {FIELD_KIT_TOOLS.length}
            </span>
            <div>
              <p className="font-bold text-sm uppercase tracking-wide"><AccentText>Field Tools</AccentText></p>
              <p className="text-xs text-muted-foreground mt-1">Built for the moments that matter most.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Briefcase className="w-8 h-8 text-primary shrink-0" />
            <div>
              <p className="font-bold text-sm uppercase tracking-wide"><AccentText>Spartan Coach</AccentText></p>
              <p className="text-xs text-muted-foreground mt-1">Direct feedback. Real improvement.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <CheckCircle className="w-8 h-8 text-primary shrink-0" />
            <div>
              <p className="font-bold text-sm uppercase tracking-wide"><AccentText>Saved Work</AccentText></p>
              <p className="text-xs text-muted-foreground mt-1">Pick up where you left off. Stay ready.</p>
            </div>
          </div>
        </div>
        <div className="bg-muted py-4 border-t border-border flex items-center justify-center gap-6 px-4 text-center">
           <p className="font-display font-black text-sm sm:text-base uppercase tracking-[0.2em] text-foreground">
             <span className="sr-only">One Platform. Every Advantage.</span>
             <span aria-hidden="true"><AccentText accent="Every Advantage.">One Platform. Every Advantage.</AccentText></span>
           </p>
           <p className="font-mono text-xs tracking-wider text-muted-foreground hidden sm:block">
             www.spartanhospicecoaching.com
           </p>
        </div>
      </section>

      <FieldBriefExperience />

      <section className="relative border-y border-border bg-card py-16 sm:py-24" data-testid="section-stakes">
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-foreground text-background mb-8 rounded-none">
              <span className="font-display font-black text-2xl">!</span>
            </div>
            <p className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-4">The real problem</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 font-display uppercase tracking-tight" data-testid="text-stakes-title">
              The gap is not clinical.<br/>It is <span className="text-primary">conversational.</span>
            </h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-8 max-w-2xl mx-auto">
              Eligible patients miss hospice because the right conversations never happen — a stalled referral, a “not yet” without a response, a family who was never asked. Spartan exists to close that gap with structure and heart in the same room.
            </p>
            <Link href="/manifesto" className="inline-flex items-center gap-2 text-sm font-display uppercase tracking-widest font-bold text-foreground hover:text-primary transition-colors border-b-2 border-primary pb-1">
              Read the Spartan Ethos
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </FadeIn>
        </div>
      </section>

      <section className="relative py-16 sm:py-24" data-testid="section-pillars">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-4">How Spartan helps</p>
              <h2 className="text-4xl sm:text-5xl font-display font-black uppercase text-foreground">
                <span className="text-primary">Two ways</span> to put it to work.
              </h2>
            </div>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {[
              {
                icon: Briefcase,
                kicker: "Offer A \u00B7 Consulting",
                title: "HUMAN COACHING",
                desc: "Strategy calls, individual coaching, ridealongs, team workshops, and leadership systems for hospice growth teams.",
                features: ["1:1 & leadership coaching", "Team workshops", "Territory systems"],
                href: "/services",
                cta: "View consulting services",
                primary: true,
                testId: "card-door-consulting",
              },
              {
                icon: Wrench,
                kicker: "Offer B \u00B7 Hospice Sales Pro",
                title: "THE TOOLS PRODUCT",
                desc: "What you actually get: daily Command Center, practice tools, plans, calculators, and field resources.",
                features: [
                  "Sales Command Center",
                  "Objections \u00B7 role-play \u00B7 email",
                  "Weekly plan \u00B7 activity \u00B7 ROI",
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
                    className={`h-full p-8 sm:p-10 flex flex-col rounded-none shadow-none border-2 ${p.primary ? "border-foreground" : "border-border"}`}
                    data-testid={p.testId}
                  >
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-4">{p.kicker}</p>
                    <h3 className="text-3xl sm:text-4xl font-display font-black text-foreground mb-4 tracking-tight uppercase">
                      {p.primary ? (
                        <>Human <span className="text-primary">coaching</span></>
                      ) : (
                        <>The tools <span className="text-primary">product</span></>
                      )}
                    </h3>
                    <p className="text-base font-medium text-muted-foreground leading-relaxed mb-6">{p.desc}</p>
                    <ul className="space-y-3 mb-8 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm font-semibold text-foreground">
                          <Check className="w-5 h-5 text-primary shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="font-display uppercase tracking-widest w-full min-h-14 rounded-none border-2" variant={p.primary ? "default" : "outline"}>
                      <Link href={p.href} onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, p.primary ? "home_consulting" : "home_hospice_sales_pro")}>
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

      <section className="border-t border-border bg-foreground text-background" data-testid="section-founder-authority">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[26rem_1fr]">
          <div className="relative min-h-[26rem] overflow-hidden border-b border-background/20 lg:border-b-0 lg:border-r">
            <img
              src={founderPhoto}
              alt="Nick Lynch, founder"
              width={416}
              height={520}
              className="absolute inset-0 h-full w-full object-cover grayscale contrast-110"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-x-0 bottom-0 h-2 bg-primary" aria-hidden="true" />
          </div>
          <div className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Field-built authority
            </p>
            <h2 className="mt-5 max-w-3xl font-display text-5xl uppercase leading-[0.92] text-background sm:text-6xl">
              Built by someone who has <span className="text-primary">carried the number.</span>
            </h2>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-background/75">
              Nick Lynch built Spartan Coaching from the field: hospice-specific sales, leadership,
              and execution systems shaped by the conversations teams actually have to lead.
            </p>
            <Link
              href="/about"
              className="mt-8 inline-flex min-h-11 w-fit items-center gap-2 border-b-2 border-primary font-mono text-xs font-bold uppercase tracking-[0.16em] text-background transition-colors hover:text-primary"
              data-testid="link-founder-story"
            >
              Read the founder story
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="relative bg-muted py-16 sm:py-24 border-t border-border" data-testid="section-results">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <ProofStrip />
          </FadeIn>
        </div>
      </section>

      <section className="relative bg-background py-16 sm:py-24 border-t border-border" data-testid="section-app-handoff">
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

      <section className="relative bg-background py-16 sm:py-24 border-t border-border" data-testid="section-trust">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <TrustStrip className="border-2 border-border shadow-none rounded-none" />
          </FadeIn>
        </div>
      </section>

      <section className="relative bg-foreground text-background py-20 sm:py-32" data-testid="section-closing">
        <FadeIn>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-6">Ready to close the gap?</p>
            <h2 className="text-5xl sm:text-7xl font-black text-background mb-8 font-display uppercase tracking-tight" data-testid="text-closing-title">
              Stop <span className="text-primary">winging it.</span>
            </h2>
            <p className="text-lg text-background/75 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
              Start with the next move that fits your work. We will keep the path clear from there.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="font-display uppercase tracking-widest px-10 min-h-14 rounded-none bg-primary text-primary-foreground hover:bg-background hover:text-foreground" data-testid="button-closing-contact">
                <Link href="/contact" onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_closing_contact")}>
                  Book a strategy call
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-display uppercase tracking-widest px-10 min-h-14 rounded-none border-2 border-background text-background hover:bg-background hover:text-foreground" data-testid="button-closing-hospice-sales-pro">
                <Link href="/hospice-sales-pro" onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_closing_hospice_sales_pro")}>
                  Explore Hospice Sales Pro
                </Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
