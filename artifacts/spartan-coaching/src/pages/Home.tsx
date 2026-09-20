import { AccentText } from "@/components/AccentText";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Wrench, CheckCircle, ShieldCheck, MapPinned, UserCheck, Check, Play, RefreshCw } from "lucide-react";
import { SEO } from "@/components/SEO";
import { TrustStrip } from "@/components/TrustStrip";
import { ProofStrip } from "@/components/ProofStrip";
import { AppHandoffPanel } from "@/components/AppHandoffPanel";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import { SITE_ORIGIN } from "@/lib/seo-config";
import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "@/lib/publicFunnel";
import { PRICING_FACTS } from "@/lib/complianceCopy";
import { FieldBriefExperience, Pathfinder } from "@/components/FieldBriefExperience";
import { FIELD_KIT_TOOLS } from "@/lib/fieldKitCatalog";
import founderPhoto from "@assets/nick-photo.jpg";
import { useEffect, useRef, useState } from "react";

const CANONICAL_ORIGIN = SITE_ORIGIN;

export function HeroSystemPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [videoState, setVideoState] = useState<"loading" | "playing" | "blocked" | "paused" | "error">("loading");
  const [playbackSeconds, setPlaybackSeconds] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    setReducedMotion(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoState === "error") return;

    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "true");
    video.playsInline = true;

    if (reducedMotion) {
      video.pause();
      setVideoState("paused");
      return;
    }

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        setVideoState("blocked");
      }
    };

    void tryPlay();
    const blockedTimer = window.setTimeout(() => {
      if (video.paused || video.currentTime === 0) setVideoState("blocked");
    }, 2500);

    return () => {
      window.clearTimeout(blockedTimer);
    };
  }, [reducedMotion, videoState === "error"]);

  const startPlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (videoState === "error") {
      setVideoState("loading");
      video.load();
    }
    try {
      await video.play();
    } catch {
      setVideoState("blocked");
    }
  };

  return (
    <figure className="hero-intro-figure absolute inset-x-0 top-[12%] z-10">
      <div
        className="hero-video-frame hero-intro-frame relative aspect-video overflow-hidden border-2 border-foreground bg-black shadow-[10px_10px_0_hsl(var(--primary))]"
        data-testid="hero-video-frame"
      >
        {videoState === "error" && (
          <img
            src="/hero-poster.jpg"
            alt="Spartan Coaching field operating system"
            className="absolute inset-0 z-10 h-full w-full object-cover"
          />
        )}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/hero-poster.jpg"
          className="hero-video-mobile absolute inset-0 z-10 h-full w-full object-cover"
          data-testid="hero-video"
          data-playback-state={videoState}
          data-playback-seconds={playbackSeconds.toFixed(1)}
          aria-label="Spartan Coaching field system in motion"
          style={{ pointerEvents: "none", visibility: videoState === "error" ? "hidden" : "visible" }}
          onLoadStart={() => setVideoState("loading")}
          onPlaying={() => setVideoState("playing")}
          onPause={() => {
            if (!reducedMotion && videoRef.current?.currentTime) setVideoState("paused");
          }}
          onTimeUpdate={(event) => setPlaybackSeconds(event.currentTarget.currentTime)}
          onError={() => setVideoState("error")}
        >
          <source src="/hero-video-mobile.webm" media="(max-width: 767px)" type="video/webm" />
          <source src="/hero-video.webm" type="video/webm" />
          <source src="/hero-video-mobile.mp4" media="(max-width: 767px)" type="video/mp4" />
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 grid grid-cols-[1fr_0.75fr] pointer-events-none">
          <div className="flex flex-col justify-between p-4 sm:p-6">
            <p className="font-mono text-sm font-bold uppercase tracking-[0.1em] text-primary">
              The field operating system
            </p>
            <div className="space-y-1 font-display text-3xl uppercase leading-none tracking-[-0.015em] text-foreground sm:text-4xl">
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
              <p className="font-display text-2xl uppercase leading-tight text-primary">Hospice Sales Pro</p>
            </div>
          </div>
        </div>
        <div
          className="absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-md border border-white/25 bg-black/70 px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-md"
          data-testid="hero-video-status"
          data-state={videoState}
          aria-live="polite"
        >
          <span className={videoState === "playing" ? "h-1.5 w-1.5 rounded-full bg-green-400" : "h-1.5 w-1.5 rounded-full bg-amber-300"} />
          {videoState === "playing" && "Field film playing"}
          {videoState === "loading" && "Loading field film"}
          {videoState === "paused" && (reducedMotion ? "Motion paused by preference" : "Field film paused")}
          {videoState === "blocked" && "Playback needs permission"}
          {videoState === "error" && "Field film unavailable"}
          {videoState !== "playing" && (
            <button
              type="button"
              onClick={() => void startPlayback()}
              className="ml-1 inline-flex min-h-8 items-center gap-1.5 rounded border border-white/30 bg-white/10 px-2 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              data-testid="button-hero-video-play"
            >
              {videoState === "error" ? <RefreshCw className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {videoState === "error" ? "Retry" : "Play"}
            </button>
          )}
        </div>
      </div>
      <figcaption className="sr-only">
        The Spartan field operating system: prepare, practice, execute, and review.
      </figcaption>
    </figure>
  );
}

function HomePathfinder() {
  return (
    <section
      id="homepage-pathfinder"
      className="border-b border-border bg-muted py-12 sm:py-16"
      aria-labelledby="homepage-pathfinder-title"
      data-testid="section-homepage-pathfinder"
    >
      <div className="mx-auto grid max-w-7xl items-start gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:px-8">
        <div className="max-w-xl">
          <p className="text-kicker">Not sure which path fits?</p>
          <h2
            id="homepage-pathfinder-title"
            className="mt-4 text-3xl font-display font-black tracking-[-0.01em] leading-[1.15] text-foreground sm:text-5xl"
          >
            Start with the work in front of <span className="text-primary">you.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Choose the responsibility closest to yours and see whether Spartan Consulting, Hospice Sales Pro,
            or a combination is the best next move—no account required.
          </p>
          <div className="mt-8 grid gap-3 border-t border-border pt-5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground sm:grid-cols-3 lg:grid-cols-1">
            <span><span className="text-primary">01</span> Identify the work</span>
            <span><span className="text-primary">02</span> See the fit</span>
            <span><span className="text-primary">03</span> Take the next step</span>
          </div>
        </div>
        <Pathfinder />
      </div>
    </section>
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
                description: "Practical coaching for hospice growth professionals. Build consistent referral relationships and execute territory strategy with discipline, ethical messaging, and more.",
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
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-primary mb-8 flex items-center gap-3">
                <span className="w-10 h-[2px] bg-primary"></span>
                Expert-led consulting · Digital field workspace
              </p>
              <h1
                id="home-hero-title"
                className="text-5xl sm:text-6xl lg:text-[5.5rem] font-display font-black uppercase tracking-[-0.015em] text-foreground leading-[1.08] text-balance"
                data-testid="text-home-hero-title"
              >
                Make the next<br/>
                hospice <span className="text-primary">conversation</span><br/>
                count.
              </h1>
               <p className="mt-8 max-w-xl text-base sm:text-lg text-muted-foreground font-medium leading-[1.65]">
                 <strong className="text-foreground">Spartan Consulting</strong> gives hospice growth leaders and teams direct strategy and coaching.{" "}
                 <strong className="text-foreground">Hospice Sales Pro</strong> gives individuals and teams a digital workspace for planning, practice, and daily execution.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="font-display font-bold text-base min-h-[3.5rem] px-8 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground border-none">
                   <Link href="/contact" onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_hero_consulting")}>
                     Book a strategy call
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="mamba-gold-action font-display font-bold text-base min-h-[3.5rem] px-8 rounded-none border-2 border-border text-foreground hover:bg-muted">
                  <Link href="/hospice-sales-pro" onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_hero_hospice_sales_pro")}>
                    Explore Hospice Sales Pro
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
               <div className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                 <p>Choose either path—or combine expert guidance with the daily field system.</p>
                 <Link
                   href="#homepage-pathfinder"
                   onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_hero_pathfinder")}
                   className="mt-2 inline-flex min-h-11 items-center gap-2 font-bold text-foreground underline decoration-primary decoration-2 underline-offset-4 transition-colors hover:text-primary"
                 >
                   Not sure which fits? Find your Spartan path
                   <ArrowRight className="h-4 w-4" aria-hidden />
                 </Link>
               </div>

              <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center gap-6 text-[13px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Built for <span className="text-foreground">leaders</span></span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Driven by <span className="text-foreground">experience</span></span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Focused on <span className="text-foreground">results</span></span>
              </div>
            </div>

            <div className="w-full min-w-0 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[40rem] min-h-[27rem] sm:min-h-[34rem] lg:min-h-[38rem] xl:max-w-[44rem] overflow-hidden">
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
                  <p className="mt-1 font-display text-2xl uppercase leading-tight text-foreground">
                    Prepared beats <span className="text-spartan-red">improvised.</span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <HomePathfinder />

      {/* CAPABILITY STRIP */}
      <section className="mamba-gold-section border-b border-border bg-card">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 lg:gap-12">
          <div className="flex gap-4 items-start">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm tracking-wide text-foreground"><AccentText>Private & Secure</AccentText></p>
              <p className="text-[13px] leading-relaxed text-muted-foreground mt-1.5">Your data. Your practice. Always protected.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="text-3xl font-display font-black text-primary leading-none mt-[-4px]">
              {FIELD_KIT_TOOLS.length}
            </span>
            <div>
              <p className="font-bold text-sm tracking-wide text-foreground"><AccentText>Field Tools</AccentText></p>
              <p className="text-[13px] leading-relaxed text-muted-foreground mt-1.5">Built for the moments that matter most.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <Briefcase className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm tracking-wide text-foreground"><AccentText>Spartan Coach</AccentText></p>
              <p className="text-[13px] leading-relaxed text-muted-foreground mt-1.5">Direct feedback. Real improvement.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <CheckCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm tracking-wide text-foreground"><AccentText>Saved Work</AccentText></p>
              <p className="text-[13px] leading-relaxed text-muted-foreground mt-1.5">Pick up where you left off. Stay ready.</p>
            </div>
          </div>
        </div>
        <div className="bg-muted py-6 border-t border-border flex items-center justify-center gap-6 px-4 text-center">
           <p className="font-display font-bold text-sm sm:text-base tracking-[0.1em] text-foreground">
             <span className="sr-only">One Platform. Every Advantage.</span>
             <span aria-hidden="true"><AccentText accent="Every Advantage.">One Platform. Every Advantage.</AccentText></span>
           </p>
           <p className="font-mono text-xs tracking-widest text-muted-foreground hidden sm:block">
             www.spartanhospicecoaching.com
           </p>
        </div>
      </section>

      <FieldBriefExperience includePathfinder={false} />

      <section className="relative border-y border-border bg-card py-24 sm:py-32" data-testid="section-stakes">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-foreground text-background mb-8 rounded-full">
              <span className="font-display font-black text-xl">!</span>
            </div>
            <p className="text-[13px] font-bold tracking-[0.2em] text-primary uppercase mb-6">The real problem</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-foreground mb-8 tracking-[-0.01em] leading-[1.1]" data-testid="text-stakes-title">
              The gap is not clinical.<br/>It is <span className="text-primary">conversational.</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground font-medium leading-[1.7] mb-12 max-w-2xl mx-auto text-balance">
              Eligible patients miss hospice because the right conversations never happen — a stalled referral, a "not yet" without a response, a family who was never asked. Spartan exists to close that gap.
            </p>
            <Link href="/manifesto" className="inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors border-b-2 border-primary pb-1">
              Read the Spartan Ethos
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </FadeIn>
        </div>
      </section>

      <section className="relative py-24 sm:py-32" data-testid="section-pillars">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-24">
              <p className="text-[13px] font-bold tracking-[0.2em] text-primary uppercase mb-6">How Spartan helps</p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-foreground tracking-[-0.01em] leading-[1.1]">
                <span className="text-primary">Two ways</span> to put it to work.
              </h2>
            </div>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {[
              {
                icon: Briefcase,
                kicker: "Spartan Consulting · Expert-led service",
                title: "SPARTAN CONSULTING",
                desc: "Direct strategy and coaching for hospice growth leaders and teams through individual coaching, ridealongs, workshops, and leadership systems.",
                features: ["1:1 & leadership coaching", "Team workshops", "Territory systems"],
                href: "/services",
                cta: "Explore Spartan Consulting",
                primary: true,
                testId: "card-door-consulting",
              },
              {
                icon: Wrench,
                kicker: "Hospice Sales Pro · Digital field workspace",
                title: "HOSPICE SALES PRO",
                desc: "A web and iPhone workspace for individuals and teams, with a daily Command Center, practice tools, plans, calculators, and field resources.",
                features: [
                  "Sales Command Center",
                  "Objections · role-play · email",
                  "Weekly plan · activity · ROI",
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
                    className={`h-full p-8 sm:p-12 flex flex-col rounded-none shadow-none border-2 ${p.primary ? "border-foreground" : "border-border hover:border-primary/50 transition-colors"}`}
                    data-testid={p.testId}
                  >
                    <p className="text-[13px] font-bold tracking-[0.2em] uppercase text-primary mb-4">{p.kicker}</p>
                    <h3 className="text-3xl sm:text-4xl font-display font-black text-foreground mb-4 tracking-[-0.01em] leading-[1.15]">
                      {p.primary ? (
                        <>Spartan <span className="text-primary">Consulting</span></>
                      ) : (
                        <>Hospice Sales <span className="text-primary">Pro</span></>
                      )}
                    </h3>
                    <p className="text-base font-medium text-muted-foreground leading-[1.6] mb-8">{p.desc}</p>
                    <ul className="space-y-4 mb-10 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-[15px] font-semibold text-foreground">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className={`${!p.primary ? "mamba-gold-action " : ""}font-display font-bold text-[15px] w-full min-h-[3.5rem] rounded-none border-2 hover:bg-primary hover:text-white transition-colors`} variant={p.primary ? "default" : "outline"}>
                      <Link href={p.href} onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, p.primary ? "home_consulting" : "home_hospice_sales_pro")}>
                        {p.cta}
                        <ArrowRight className="ml-2 w-5 h-5" />
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
          <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
            <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-primary">
              Field-built authority
            </p>
            <h2 className="mt-6 max-w-3xl font-display font-black text-4xl sm:text-5xl lg:text-[4rem] tracking-[-0.01em] leading-[1.1] text-background">
              Built by someone who has <span className="text-primary">carried the number.</span>
            </h2>
            <p className="mt-8 max-w-2xl text-lg sm:text-xl font-medium leading-[1.6] text-background/80">
              Nick Lynch built Spartan Coaching from the field: hospice-specific sales, leadership,
              and execution systems shaped by the conversations teams actually have to lead.
            </p>
            <Link
              href="/about"
              className="mt-10 inline-flex min-h-11 w-fit items-center gap-2 border-b-2 border-primary text-sm font-bold text-background transition-colors hover:text-primary"
              data-testid="link-founder-story"
            >
              Read the founder story
              <ArrowRight className="h-5 w-5" aria-hidden />
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
            <h2 className="text-5xl sm:text-7xl font-black text-background mb-8 font-display uppercase tracking-[-0.01em] leading-[1.1]" data-testid="text-closing-title">
              Stop <span className="text-primary">winging it.</span>
            </h2>
            <p className="text-lg text-background/75 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
              Start with the next move that fits your work. We will keep the path clear from there.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="font-display uppercase tracking-widest px-10 min-h-14 rounded-none bg-primary text-primary-foreground hover:bg-background hover:text-foreground">
                 <Link href="/services" onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_closing_consulting")}>
                   Explore Spartan Consulting
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-display uppercase tracking-widest px-10 min-h-14 rounded-none border-2 border-background text-background hover:bg-background/10">
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
