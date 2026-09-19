import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Play, RefreshCw } from "lucide-react";
import { SEO } from "@/components/SEO";
import { ProofStrip } from "@/components/ProofStrip";
import { SITE_ORIGIN } from "@/lib/seo-config";
import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "@/lib/publicFunnel";
import { useEffect, useRef, useState } from "react";
import founderPhoto from "@assets/nick-photo.jpg";
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

  return (
    <figure className="relative z-0 h-full w-full" data-testid="section-hero-panel">
      <div
        className="relative h-full w-full overflow-hidden bg-[var(--fi-field)]"
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
          className="absolute bottom-7 left-6 z-20 flex items-center gap-2 px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--fi-cream)] md:bottom-10 md:left-10"
          data-testid="hero-video-status"
          data-state={videoState}
          aria-live="polite"
        >
          <span className={videoState === "playing" ? "h-1.5 w-1.5 rounded-full bg-green-400" : "h-1.5 w-1.5 rounded-full bg-[var(--fi-rust)]"} />
          {videoState === "playing" && "Field film playing"}
          {videoState === "loading" && "Loading field film"}
          {videoState === "paused" && (reducedMotion ? "Motion paused by preference" : "Field film paused")}
          {videoState === "blocked" && "Playback needs permission"}
          {videoState === "error" && "Field film unavailable"}
          {videoState !== "playing" && (
            <button
              type="button"
              onClick={() => void startPlayback()}
              className="ml-1 inline-flex min-h-8 items-center gap-1.5 rounded border border-[var(--fi-cream)] px-2 text-[var(--fi-cream)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fi-cream)]"
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
      <section className="mx-auto grid max-w-[1440px] lg:min-h-[690px] lg:grid-cols-[.86fr_1.14fr]" data-testid="section-hero">
        <div className="flex flex-col justify-between px-5 py-16 md:px-10 md:py-20 lg:py-24">
          <div className="fi-reveal" data-testid="section-home-intro">
            <div className="mb-10 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--fi-rust)]">
              <span className="h-2 w-2 rounded-full bg-[var(--fi-rust)]" style={{animation:"fiPulse 2s infinite"}} /> Private performance advisory · Hospice growth
            </div>
            <h1 className="fi-serif max-w-[650px] text-[clamp(3.5rem,7vw,7.5rem)] leading-[.98] tracking-[-.045em]" data-testid="text-home-hero-title">
              Make the next hospice conversation<br /><span className="text-[var(--fi-rust)]">count.</span>
            </h1>
            <p className="mt-9 max-w-[470px] text-[16px] leading-[1.7] text-[rgba(19,32,31,.72)]">
              <strong className="text-foreground">Spartan Consulting</strong> gives hospice growth leaders direct strategy and coaching. <strong className="text-foreground">Hospice Sales Pro</strong> gives individuals a digital workspace for daily execution, with web and iPhone continuity and a separate team access path.
            </p>
          </div>
          <div className="mt-14 flex flex-wrap items-center gap-6">
            <Link 
              href="/contact" 
              onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_hero_consulting")}
              className="fi-btn-primary group"
            >
              Book a strategy call <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link 
              href="/hospice-sales-pro" 
              onClick={() => trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, "home_hero_hospice_sales_pro")}
              className="group inline-flex items-center gap-3 text-[12px] font-bold uppercase tracking-[.12em]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--fi-ink)] transition-colors group-hover:bg-[var(--fi-ink)] group-hover:text-[var(--fi-cream)]">
                <ArrowRight size={14} fill="currentColor" />
              </span> 
              Explore Hospice Sales Pro
            </Link>
          </div>
        </div>
        <div className="relative min-h-[470px] overflow-hidden bg-[var(--fi-field)] lg:min-h-0">
          <HeroSystemPanel />
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[rgba(11,35,33,.72)] via-transparent to-[rgba(11,35,33,.1)]" />
          <div className="pointer-events-none absolute bottom-7 right-6 z-20 flex items-end justify-between text-[var(--fi-cream)] md:bottom-10 md:right-10">
            <span className="hidden text-right text-[10px] uppercase tracking-[.15em] opacity-75 sm:block">01 / 04<br />Prepare</span>
          </div>
        </div>
      </section>

      {/* The Work / Standards */}
      <section className="border-y border-[var(--fi-line)] bg-[var(--fi-cream)]" data-testid="section-pathways">
        <div className="mx-auto grid max-w-[1440px] md:grid-cols-[.7fr_1.3fr]">
          <div className="border-b border-[var(--fi-line)] px-5 py-14 md:border-b-0 md:border-r md:px-10 md:py-20">
            <p className="mb-20 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--fi-rust)]">Two ways to engage the work</p>
            <h2 className="fi-serif text-[clamp(2.8rem,5vw,5.3rem)] leading-[.93]">Good activity is not the same as good work.</h2>
          </div>
          <div className="px-5 py-14 md:px-14 md:py-20">
            <p className="max-w-[650px] text-[20px] leading-[1.45] md:text-[27px]">Start with the responsibility closest to yours. Choose expert-led consulting for strategy, or the digital field system for daily execution.</p>
            <div className="mt-14 grid gap-0 border-t border-[var(--fi-line)] sm:grid-cols-2">
              <div className="border-b border-[var(--fi-line)] py-7 sm:border-b-0 sm:border-r sm:pr-6">
                <span className="text-[11px] font-bold text-[var(--fi-rust)]">01</span>
                <h3 className="mt-8 text-lg font-semibold uppercase tracking-wider" data-testid="pathway-coaching">Spartan Consulting</h3>
                <p className="mt-3 text-sm leading-[1.6] text-[rgba(19,32,31,.65)]">Direct strategy and coaching for hospice growth leaders and teams. We diagnose the market reality, install a unified sales process, and build leadership rhythms that sustain performance.</p>
                <ul className="mt-4 space-y-2 text-sm text-[rgba(19,32,31,.8)] font-medium">
                  {["1:1 and leadership coaching", "Team execution workshops", "Territory system design"].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="h-1 w-1 bg-[var(--fi-rust)]" /> {f}</li>
                  ))}
                </ul>
                <Link href="/services" className="mt-6 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[.12em] text-[var(--fi-rust)]">
                  Explore consulting services <ArrowRight size={14} />
                </Link>
              </div>
              <div className="py-7 sm:pl-6">
                <span className="text-[11px] font-bold text-[var(--fi-rust)]">02</span>
                <h3 className="mt-8 text-lg font-semibold uppercase tracking-wider" data-testid="pathway-technology">Hospice Sales Pro</h3>
                <p className="mt-3 text-sm leading-[1.6] text-[rgba(19,32,31,.65)]">A web and iPhone workspace for individuals and teams, featuring a daily Command Center, practice tools, and role-play modules.</p>
                <div className="mt-5 border border-[var(--fi-line)] p-2">
                  <img src={commandCenter} alt="Hospice Sales Pro" className="w-full object-cover grayscale-[.2]" />
                </div>
                <Link href="/hospice-sales-pro" className="mt-6 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[.12em]">
                  Explore the platform <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Authority */}
      <section className="bg-[var(--fi-paper)]" data-testid="section-founder-authority">
        <div className="mx-auto grid max-w-[1440px] md:grid-cols-[1fr_1fr]">
          <div className="relative min-h-[440px] overflow-hidden md:min-h-[560px]">
            <img src={founderPhoto} alt="Nick Lynch, founder of Spartan Coaching" width={416} height={520} decoding="async" className="fi-fade-image absolute inset-0 h-full w-full object-cover object-center grayscale-[.35] mix-blend-multiply opacity-90" />
          </div>
          <div className="flex flex-col justify-center px-5 py-16 md:px-16 md:py-24">
            <p className="mb-7 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--fi-rust)]">Field-built authority</p>
            <h2 className="fi-serif font-serif font-light text-foreground text-[clamp(3rem,5vw,5.5rem)] leading-[.88]">Built by someone<br />who has actually<br /><em>carried the number.</em></h2>
            <p className="mt-8 text-muted-foreground max-w-[490px] text-[16px] leading-[1.75] text-[rgba(19,32,31,.72)]">Nick Lynch built Spartan Coaching from the field. Our hospice-specific sales, leadership, and execution systems are shaped by the exact conversations teams must lead every day.</p>
            <Link href="/about" className="mt-9 inline-flex w-fit items-center gap-3 text-[12px] font-bold uppercase tracking-[.13em] text-[var(--fi-ink)] fi-link">
              Read the founder story
            </Link>
          </div>
        </div>
      </section>

      {/* Proof Strip */}
      <section className="border-y border-[var(--fi-line)] bg-[var(--fi-cream)] px-5 py-20 lg:py-32" data-testid="section-results">
        <div className="mx-auto max-w-[1440px]">
          <ProofStrip kicker="Field standards" title="What disciplined teams work toward" />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="fi-dark bg-[var(--fi-field)] px-5 py-20 text-[var(--fi-cream)] md:px-10 md:py-28" data-testid="section-closing">
        <div className="mx-auto max-w-[1100px] text-center">
          <p className="mb-6 text-[10px] font-bold uppercase tracking-[.2em] text-[#e8a183]">The next conversation</p>
          <h2 className="fi-serif text-[clamp(3.5rem,8vw,8rem)] leading-[.82]">Stop<br /><em>winging it.</em></h2>
          <p className="mx-auto mt-8 max-w-[500px] text-[16px] leading-[1.7] text-[rgba(251,248,241,.82)]">Start with the next move that fits your work. We will keep the path clear from there.</p>
          <Link href="/services" className="mt-9 inline-flex items-center gap-3 bg-[var(--fi-rust)] px-6 py-4 text-[12px] font-bold uppercase tracking-[.13em] text-[var(--fi-cream)] transition-transform hover:-translate-y-1">
            Explore Consulting <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
