import { AccentText } from "@/components/AccentText";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw, Play } from "lucide-react";
import { SEO } from "@/components/SEO";
import { ProofStrip } from "@/components/ProofStrip";
import { AppHandoffPanel } from "@/components/AppHandoffPanel";
import { SITE_ORIGIN } from "@/lib/seo-config";
import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "@/lib/publicFunnel";
import { useEffect, useRef, useState } from "react";
import founderPhoto from "@assets/nick-photo.jpg";

export function HeroSystemPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [videoState, setVideoState] = useState<"loading" | "playing" | "blocked" | "paused" | "error">("loading");
  const [playbackSeconds, setPlaybackSeconds] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
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
    <figure className="hero-intro-figure absolute inset-0 z-0 w-full" data-testid="section-hero-panel">
      <div
        className="hero-video-frame hero-intro-frame relative h-full min-h-[34rem] overflow-hidden bg-black"
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

        <div className="hero-film-grade absolute inset-0 z-10 pointer-events-none" />
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
                name: "Spartan Coaching",
                description: "Practical coaching for hospice growth professionals.",
                url: SITE_ORIGIN,
              }
            ],
          })}
        </script>
      </Helmet>

      <section className="spartan-hero relative overflow-hidden bg-black" data-testid="section-hero">
        <HeroSystemPanel />
        <div className="relative z-20 max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-12 min-h-[calc(100svh-5.5rem)] flex items-end lg:items-center py-12 sm:py-16 lg:py-20">
            <div className="max-w-[58rem] text-left">
              <p className="spartan-hero-kicker mb-6 lg:mb-8">
                Private performance advisory · Hospice growth
              </p>

              <h1 className="spartan-hero-title leading-[1.08] mb-7" data-testid="text-home-hero-title">
                Make the next hospice conversation <span>Count.</span>
              </h1>

              <p className="spartan-hero-summary text-base sm:text-lg leading-[1.7] max-w-[39rem] mb-9">
                <strong>Spartan Consulting</strong> gives hospice growth leaders direct strategy and coaching. <strong>Hospice Sales Pro</strong> gives individuals a digital workspace for daily execution.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-7">
                <Button size="lg" asChild className="spartan-primary-action w-full sm:w-auto">
                  <Link href="/contact" onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_hero_consulting")}>
                    Book a strategy call
                  </Link>
                </Button>

                <Link
                  href="/hospice-sales-pro"
                  onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_hero_hospice_sales_pro")}
                  className="spartan-quiet-link group w-full sm:w-auto justify-center sm:justify-start"
                >
                  Explore Hospice Sales Pro <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
        </div>
      </section>

      {/* ── 2. ASYMMETRIC PATHWAYS ── */}
      <section className="py-20 lg:py-32 bg-surface px-4 sm:px-6 lg:px-8 border-b border-border" data-testid="section-pathways">
        <div className="max-w-[90rem] mx-auto">
          <div className="max-w-2xl mb-16 lg:mb-24">
            <h2 className="spartan-section-title mb-4">
              Two ways to engage the work
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Start with the responsibility closest to yours. Choose expert-led consulting for strategy, or the digital field system for daily execution.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6 lg:pr-12">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Expert-led Service</p>
              <h3 className="text-3xl lg:text-5xl font-display uppercase text-foreground">Spartan Consulting</h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Direct strategy and coaching for hospice growth leaders and teams. We diagnose the market reality, install a unified sales process, and build leadership rhythms that sustain performance long after the workshop ends.
              </p>
              <ul className="space-y-3 my-4">
                {["1:1 and leadership coaching", "Team execution workshops", "Territory system design"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors w-fit border-b border-primary/30 pb-0.5 mt-2">
                Explore consulting services <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="hidden lg:block lg:col-span-1 border-l border-border h-full"></div>

            <div className="lg:col-span-4 flex flex-col gap-6 pt-12 lg:pt-0 border-t border-border lg:border-t-0">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Digital Workspace</p>
              <h3 className="text-3xl lg:text-5xl font-display uppercase text-foreground">Hospice Sales Pro</h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                A web and iPhone workspace for individuals and teams, featuring a daily Command Center, practice tools, and role-play modules.
              </p>
              <Link href="/hospice-sales-pro" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors mt-2">
                Explore the platform <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FOUNDER AUTHORITY (Editorial) ── */}
      <section className="py-20 lg:py-32 bg-background border-b border-border" data-testid="section-founder-authority">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-24 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-6">
                Field-built authority
              </p>
               <h2 className="spartan-section-title font-serif font-light text-foreground mb-6">
                Built by someone who has actually carried the number.
              </h2>
              <p className="text-base text-muted-foreground leading-[1.7] mb-8">
                Nick Lynch built Spartan Coaching from the field. Our hospice-specific sales, leadership, and execution systems are shaped by the exact conversations teams must lead every day.
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors border-b border-primary/30 pb-0.5">
                Read the founder story <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-[4/3] bg-muted relative overflow-hidden border border-border shadow-sm">
                <img
                  src={founderPhoto}
                  alt="Nick Lynch, founder of Spartan Coaching"
                  width={416}
                  height={520}
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover grayscale opacity-90 mix-blend-multiply"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. PROOF ── */}
      <section className="py-20 lg:py-32 bg-surface border-b border-border" data-testid="section-results">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <ProofStrip kicker="Field standards" title="What disciplined teams work toward" />
        </div>
      </section>

      {/* ── 5. FINAL CTA (Single focus) ── */}
      <section className="py-24 lg:py-40 text-center px-4 bg-background" data-testid="section-closing">
        <div className="max-w-2xl mx-auto">
           <h2 className="spartan-section-title mb-6">
            Stop winging it.
          </h2>
          <p className="text-base text-muted-foreground mb-10 max-w-lg mx-auto">
            Start with the next move that fits your work. We will keep the path clear from there.
          </p>
          <Button size="lg" asChild className="rounded-none bg-foreground text-background hover:bg-primary hover:text-white border-none min-h-[3.25rem] px-8 text-sm font-semibold tracking-wide w-full sm:w-auto shadow-sm">
            <Link href="/services">
              Explore Consulting
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}