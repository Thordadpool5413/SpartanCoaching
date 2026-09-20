import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Pause, Play, RefreshCw } from "lucide-react";
import { SEO } from "@/components/SEO";
import { ProofStrip } from "@/components/ProofStrip";
import { SITE_ORIGIN } from "@/lib/seo-config";
import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "@/lib/publicFunnel";
import { useEffect, useRef, useState } from "react";
import founderPhoto from "@assets/nick-photo-cropped.jpg";
import commandCenter from "@assets/hospice-sales-pro-command-center-public.png";

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

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (videoState === "playing") {
      video.pause();
      setVideoState("paused");
      return;
    }
    void startPlayback();
  };

  return (
    <figure className="relative z-0 h-full w-full" data-testid="section-hero-panel">
      <div
        className="relative h-full w-full overflow-hidden bg-black"
        data-testid="hero-video-frame"
      >
        {videoState === "error" && (
          <img
            src="/hero-poster.jpg"
            alt="Spartan Coaching field operating system"
            className="fi-fade-image absolute inset-0 z-10 h-full w-full object-cover object-center opacity-90"
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
          className="fi-fade-image absolute inset-0 z-10 h-full w-full object-cover object-center opacity-90"
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

        <div
          className="absolute right-4 top-4 z-20 flex items-center gap-2 bg-black/45 px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm md:right-8 md:top-8"
          data-testid="hero-video-status"
          data-state={videoState}
          aria-live="polite"
        >
          <span className={videoState === "playing" ? "h-1.5 w-1.5 rounded-full bg-green-400" : "h-1.5 w-1.5 rounded-full bg-[var(--fi-red)]"} />
          {videoState === "playing" && "Field film playing"}
          {videoState === "loading" && "Loading field film"}
          {videoState === "paused" && (reducedMotion ? "Motion paused by preference" : "Field film paused")}
          {videoState === "blocked" && "Playback needs permission"}
          {videoState === "error" && "Field film unavailable"}
          <button
            type="button"
            onClick={togglePlayback}
            className="ml-1 inline-flex min-h-8 items-center gap-1.5 rounded border border-white px-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            data-testid="button-hero-video-play"
            aria-label={videoState === "playing" ? "Pause background film" : videoState === "error" ? "Retry background film" : "Play background film"}
          >
            {videoState === "playing" ? <Pause className="h-3 w-3" /> : videoState === "error" ? <RefreshCw className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {videoState === "playing" ? "Pause" : videoState === "error" ? "Retry" : "Play"}
          </button>
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
    <div className="page-persuasion public-home flex flex-col font-sans" data-testid="page-home">
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

      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100svh-4.75rem)] w-full flex-col justify-end overflow-hidden lg:min-h-[calc(100svh-5.5rem)]" data-testid="section-hero">
        <div className="absolute inset-0 z-0">
          <HeroSystemPanel />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
        </div>
        
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-9 pt-20 sm:pb-12 md:px-10 md:pb-20">
          <div className="fi-reveal max-w-[52rem]" data-testid="section-home-intro">
            <div className="fi-kicker fi-kicker-light mb-5 md:mb-7">
              Private performance advisory · Hospice growth
            </div>
            <h1 className="fi-serif mb-5 max-w-[48rem] text-[clamp(3rem,7vw,6.75rem)] leading-[.98] text-white md:mb-7" data-testid="text-home-hero-title">
              Make the next hospice conversation <span className="text-white">count.</span>
            </h1>
            <p className="mb-7 max-w-[38rem] text-[1rem] font-medium leading-[1.65] text-white/80 md:mb-9 md:text-[1.075rem]">
              <strong className="text-white">Spartan Consulting</strong> gives hospice growth leaders direct strategy and coaching. <strong className="text-white">Hospice Sales Pro</strong> gives individuals a digital workspace for daily execution, with web and iPhone continuity.
            </p>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link 
                href="/contact" 
                onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_hero_consulting")}
                className="fi-btn-primary"
              >
                Book a strategy call
              </Link>
              <Link 
                href="/hospice-sales-pro" 
                onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_hero_hospice_sales_pro")}
                className="fi-btn-outline-light"
              >
                Explore Hospice Sales Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Work / Standards */}
      <section className="fi-section bg-[var(--fi-paper)]" data-testid="section-pathways">
        <div className="mx-auto grid max-w-[1440px] md:grid-cols-[.7fr_1.3fr]">
          <div className="border-b border-[var(--fi-line)] px-5 py-14 md:border-b-0 md:border-r md:px-10 md:py-20">
            <p className="fi-kicker mb-20">Two ways to engage</p>
            <h2 className="fi-serif text-[clamp(2.8rem,5vw,5.3rem)] leading-[.98]">Good activity is not the same as good work.</h2>
          </div>
          <div className="px-5 py-14 md:px-14 md:py-20">
            <p className="max-w-[650px] text-[1.25rem] leading-[1.6] md:text-[1.5rem] font-medium">Start with the responsibility closest to yours. Choose expert-led consulting for strategy, or the digital field system for daily execution.</p>
            <div className="mt-14 grid gap-0 border-t border-[var(--fi-line)] sm:grid-cols-2">
              <div className="border-b border-[var(--fi-line)] py-10 sm:border-b-0 sm:border-r sm:pr-8">
                <span className="text-[0.75rem] font-bold text-[var(--fi-red)] font-mono">01</span>
                <h3 className="mt-6 text-xl font-bold uppercase tracking-wider" data-testid="pathway-coaching">Spartan Consulting</h3>
                <p className="mt-4 text-sm leading-[1.6] text-black/70 font-medium">Direct strategy and coaching for hospice growth leaders and teams. We diagnose the market reality, install a unified sales process, and build leadership rhythms that sustain performance.</p>
                <ul className="mt-6 space-y-3 text-sm text-black/80 font-bold">
                  {["1:1 and leadership coaching", "Team execution workshops", "Territory system design"].map(f => (
                    <li key={f} className="flex items-center gap-3"><span className="h-1.5 w-1.5 bg-[var(--fi-red)]" /> {f}</li>
                  ))}
                </ul>
                <Link href="/services" className="mt-8 inline-flex items-center gap-2 text-[0.75rem] font-bold uppercase tracking-[.12em] text-[var(--fi-red)] hover:text-[var(--fi-red-hover)] font-mono">
                  Explore consulting services <ArrowRight size={14} />
                </Link>
              </div>
              <div className="py-10 sm:pl-8">
                <span className="text-[0.75rem] font-bold text-[var(--fi-red)] font-mono">02</span>
                <h3 className="mt-6 text-xl font-bold uppercase tracking-wider" data-testid="pathway-technology">Hospice Sales Pro</h3>
                <p className="mt-4 text-sm leading-[1.6] text-black/70 font-medium">A web and iPhone workspace for individuals and teams, featuring a daily Command Center, practice tools, and role-play modules.</p>
                <div className="mt-6 border border-[var(--fi-line)] p-3 bg-white">
                  <img src={commandCenter} alt="Hospice Sales Pro" className="w-full object-cover grayscale-[.2]" />
                </div>
                <Link href="/hospice-sales-pro" className="mt-8 inline-flex items-center gap-2 text-[0.75rem] font-bold uppercase tracking-[.12em] hover:text-[var(--fi-red)] font-mono">
                  Explore the platform <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Authority */}
      <section className="fi-section bg-[var(--fi-paper)]" data-testid="section-founder-authority">
        <div className="mx-auto grid max-w-[1440px] md:grid-cols-[1fr_1fr]">
          <div className="relative min-h-[440px] overflow-hidden md:min-h-[560px] border-b md:border-b-0 md:border-r border-[var(--fi-line)]">
            <img src={founderPhoto} alt="Nick Lynch, founder of Spartan Coaching" width={416} height={520} decoding="async" className="fi-fade-image absolute inset-0 h-full w-full object-cover object-center" />
          </div>
          <div className="flex flex-col justify-center px-5 py-16 md:px-16 md:py-24 bg-white">
            <p className="fi-kicker mb-8">Field-built authority</p>
            <h2 className="fi-serif text-[clamp(3rem,5vw,5.5rem)] leading-[.96]">Built by someone<br />who has actually<br /><span className="text-[var(--fi-red)]">carried the number.</span></h2>
            <p className="mt-8 text-black/70 max-w-[490px] text-[1.125rem] leading-[1.6] font-medium">Nick Lynch built Spartan Coaching from the field. Our hospice-specific sales, leadership, and execution systems are shaped by the exact conversations teams must lead every day.</p>
            <Link href="/about" className="mt-10 inline-flex w-fit items-center gap-2 text-[0.75rem] font-bold uppercase tracking-[.12em] hover:text-[var(--fi-red)] font-mono">
              Read the founder story <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Proof Strip */}
      <section className="fi-section bg-[var(--fi-paper)] px-5 py-20 lg:py-32" data-testid="section-results">
        <div className="mx-auto max-w-[1440px]">
          <ProofStrip kicker="Field standards" title="What disciplined teams work toward" />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="fi-dark bg-[var(--fi-ink)] px-5 py-24 md:px-10 md:py-32" data-testid="section-closing">
        <div className="mx-auto max-w-[1100px] text-center flex flex-col items-center">
          <p className="fi-kicker fi-kicker-light mb-8">The next conversation</p>
          <h2 className="fi-serif text-[clamp(3.25rem,7vw,6.5rem)] leading-[.96] text-white">Prepare the conversation <span className="text-[var(--fi-red)]">that matters.</span></h2>
          <p className="mx-auto mt-8 max-w-[500px] text-[1.125rem] leading-[1.6] text-white/80 font-medium">Start with the next move that fits your work. We will keep the path clear from there.</p>
          <Link href="/services" className="mt-12 fi-btn-primary">
            Explore Consulting
          </Link>
        </div>
      </section>
    </div>
  );
}
