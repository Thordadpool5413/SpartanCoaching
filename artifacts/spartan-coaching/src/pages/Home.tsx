import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  ClipboardCheck,
  Crosshair,
  MapPin,
  MessageSquareText,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { SITE_ORIGIN } from "@/lib/seo-config";
import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "@/lib/publicFunnel";
import { useEffect, useRef, useState } from "react";
import founderPhoto from "@assets/nick-photo-cropped.jpg";

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
    <figure className="relative z-0 h-full w-full bg-black" data-testid="section-hero-panel">
      <div
        className="relative w-full h-full overflow-hidden bg-black"
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
            className="ml-1 inline-flex min-h-8 items-center gap-1.5 rounded border border-white px-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors hover:bg-white hover:text-black"
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

const problems = [
  {
    icon: TrendingUp,
    title: "Stalled referrals",
    body: "Your market has opportunity, but the right accounts are not moving with enough urgency.",
  },
  {
    icon: BarChart3,
    title: "Activity without conversion",
    body: "The team stays busy while admits, commitments, and account movement remain inconsistent.",
  },
  {
    icon: Users,
    title: "Managers chasing numbers",
    body: "Leaders spend the week reacting instead of coaching the behaviors that create growth.",
  },
  {
    icon: MessageSquareText,
    title: "Inconsistent execution",
    body: "Strong intentions break down in the field because the team lacks a shared operating standard.",
  },
];

const audiences = [
  {
    icon: UserRound,
    label: "Hospice sales teams",
    body: "For liaisons who need sharper conversations, stronger account plans, and confidence in the field.",
  },
  {
    icon: MapPin,
    label: "Directors and regional leaders",
    body: "For leaders who need a practical coaching rhythm that turns standards into daily execution.",
  },
  {
    icon: Building2,
    label: "Organizations ready to scale",
    body: "For hospices that want repeatable growth across territories, branches, and markets.",
  },
];

const engagementPaths = [
  {
    number: "01",
    title: "Field coaching & ride-alongs",
    body: "Observe the work where it happens, coach the next move, and build skill through real account conversations.",
  },
  {
    number: "02",
    title: "Team workshops & sales training",
    body: "Focused, hospice-specific sessions that give your team language and tools they can use immediately.",
  },
  {
    number: "03",
    title: "Leadership coaching & performance systems",
    body: "Equip managers with a clear cadence for expectations, accountability, and productive coaching.",
  },
  {
    number: "04",
    title: "Growth strategy & multi-market execution",
    body: "Align priorities, territory strategy, and leadership routines so growth can travel across the organization.",
  },
];

const outcomes = [
  {
    quote: "We finally had a shared language for hard conversations — not another binder no one opens.",
    role: "Hospice sales leader",
  },
  {
    quote: "Tuesday stopped being chaos. I know who to call first and what to say when they push back.",
    role: "Hospice liaison",
  },
  {
    quote: "I needed a system my directors could coach from — not generic sales training dressed up for hospice.",
    role: "Executive leader",
  },
];

export default function Home() {
  const consultingClick = (label: string) => {
    trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, label);
  };

  const servicesClick = (label: string) => {
    trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.ctaClick, label);
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        name: "Spartan Coaching",
        url: SITE_ORIGIN,
        description:
          "Hospice growth consulting, field coaching, sales training, and leadership systems built for measurable execution.",
        serviceType: [
          "Hospice growth consulting",
          "Hospice sales coaching",
          "Hospice leadership development",
          "Hospice team workshops",
        ],
      },
      {
        "@type": "WebSite",
        name: "Spartan Coaching",
        url: SITE_ORIGIN,
      },
    ],
  };

  return (
    <>
      <SEO
        title="Hospice Sales Consulting & Coaching | Spartan Coaching"
        description="Hospice-specific consulting, field coaching, sales training, and leadership systems that turn growth strategy into consistent execution."
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="home-photo-one overflow-x-hidden bg-white text-black" data-testid="page-home">
        <section
          data-testid="section-hero"
          className="bg-white pt-6 pb-20"
        >
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 xl:px-8">
            <div className="w-full aspect-video bg-black relative mb-16 shadow-2xl border border-black/5 ring-1 ring-black/5">
               <HeroSystemPanel />
            </div>

            <div className="max-w-6xl" data-testid="section-home-intro">
              <p className="home-photo-kicker mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-[#d61f26]" aria-hidden="true" />
                Hospice growth consulting
              </p>
              <h1
                data-testid="text-home-hero-title"
                className="font-display text-[clamp(2.55rem,8vw,8rem)] font-black uppercase leading-[.98] tracking-[-0.05em] text-[#11131d] [overflow-wrap:normal]"
              >
                Make the next hospice <span className="text-[#d61f26]">conversation</span> count.
              </h1>

              <div className="mt-10 grid lg:grid-cols-[1fr_auto] gap-10 items-end">
                <p className="max-w-2xl text-[1.1rem] leading-relaxed text-black/70">
                  Spartan Coaching helps hospice teams convert strategy into disciplined field execution — with
                  sharper conversations, stronger managers, and a growth system your people can actually run.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/contact"
                    onClick={() => consultingClick("Hero: Request a strategy call")}
                    className="home-photo-button home-photo-button-primary"
                  >
                    Request a strategy call
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/services"
                    onClick={() => servicesClick("Hero: Explore consulting")}
                    className="home-photo-button home-photo-button-outline"
                  >
                    Explore consulting
                  </Link>
                </div>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-black/10 pt-8 text-xs font-bold uppercase tracking-widest text-black/60">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#d61f26]" aria-hidden="true" />
                  Hospice specific
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#d61f26]" aria-hidden="true" />
                  Built for the field
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#d61f26]" aria-hidden="true" />
                  Designed to stick
                </span>
              </div>
            </div>
          </div>
        </section>

        <section data-testid="section-problems" className="home-photo-section bg-[#f5f3ef]">
          <div className="home-photo-frame">
            <div className="home-photo-split">
              <div>
                <p className="home-photo-kicker">
                  Where growth gets stuck
                </p>
                <h2 className="home-photo-section-title mt-5 font-display font-black uppercase">
                  The problems we <span>solve.</span>
                </h2>
              </div>

              <div className="home-photo-card-grid home-photo-card-grid-two bg-white shadow-xl">
                {problems.map((problem) => {
                  const Icon = problem.icon;
                  return (
                    <article key={problem.title} className="home-photo-card hover:bg-neutral-50 transition-colors">
                      <Icon className="h-6 w-6 text-[#d61f26]" strokeWidth={1.8} aria-hidden="true" />
                      <h3 className="tracking-tight">{problem.title}</h3>
                      <p>{problem.body}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section data-testid="section-audiences" className="home-photo-section home-photo-section-lined bg-white text-black">
          <div className="home-photo-frame">
            <div className="home-photo-audience-head">
              <div>
                <p className="home-photo-kicker">Who this is for</p>
                <h2 className="home-photo-section-title mt-5 font-display font-black uppercase">Who we work with.</h2>
              </div>
              <p>Coaching and consulting shaped around the people responsible for hospice growth — from one territory to the entire organization.</p>
            </div>

            <div className="home-photo-audience-grid">
              {audiences.map((audience) => {
                const Icon = audience.icon;
                return (
                  <article key={audience.label}>
                    <Icon className="h-8 w-8 text-[#d61f26]" strokeWidth={1.7} aria-hidden="true" />
                    <h3 className="tracking-tight text-xl">{audience.label}</h3>
                    <p className="text-base">{audience.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="spartan-method" data-testid="section-method" className="public-dark-surface home-photo-section bg-black text-white">
          <div className="home-photo-frame">
            <div className="home-photo-method-head">
              <p className="home-photo-kicker text-[#d61f26]">The Spartan method · operating doctrine</p>
              <div>
                <h2
                  aria-label="Diagnose. Install. Sustain."
                  className="home-photo-section-title mt-5 font-display font-black uppercase text-white"
                >
                  Diagnose. Install. <span className="text-[#d61f26]">Sustain.</span>
                </h2>
              </div>
              <div className="border-l border-[#d61f26] pl-6">
                <p className="text-white/70">We find the real constraint, build the operating standard around it, and coach until the new behavior holds without us in the room.</p>
                <p className="mt-5 font-mono text-[0.64rem] font-bold uppercase tracking-[0.16em] text-white/45">
                  Built for field execution · Coachable by leaders · Measured in behavior
                </p>
              </div>
            </div>

              <div className="home-photo-method-grid border-t-white/15">
                {[
                  {
                    number: "01",
                    title: "Diagnose the constraint",
                    body: "Separate symptoms from the real breakdown across market strategy, field behavior, and leadership cadence.",
                    icon: Crosshair,
                  },
                  {
                    number: "02",
                    title: "Install the standard",
                    body: "Create the language, routines, tools, and expectations your team needs to execute consistently.",
                    icon: ClipboardCheck,
                  },
                  {
                    number: "03",
                    title: "Sustain the behavior",
                    body: "Coach leaders and field teams until the system becomes the way the organization works.",
                    icon: ShieldCheck,
                  },
                ].map((step) => {
                  const Icon = step.icon;
                  return (
                    <article key={step.number} className="group border-l-white/10 transition-colors hover:bg-white/[0.035]">
                      <span className="home-photo-step-number" aria-hidden="true">{step.number}</span>
                      <div className="relative z-10">
                        <p className="home-photo-phase-label font-mono text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#d61f26]">
                          Phase {step.number}
                        </p>
                        <h3 className="tracking-tight text-white">{step.title}</h3>
                        <p className="text-white/65">{step.body}</p>
                      </div>
                      <Icon className="absolute right-8 top-8 z-10 h-8 w-8 text-[#d61f26]" strokeWidth={1.5} aria-hidden="true" />
                    </article>
                  );
                })}
              </div>
          </div>
        </section>

        <section data-testid="section-pathways" className="home-photo-section bg-[#f5f3ef]">
          <div className="home-photo-frame">
            <div className="home-photo-path-head">
              <div>
                <p className="home-photo-kicker">
                  Consulting engagements
                </p>
                <h2 className="home-photo-section-title mt-5 max-w-4xl font-display font-black uppercase">
                  Consulting engagement <span>paths.</span>
                </h2>
              </div>
              <Link
                href="/services"
                onClick={() => servicesClick("Engagements: View consulting services")}
                className="home-photo-text-link"
              >
                View consulting services
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="home-photo-path-grid bg-white shadow-xl">
              {engagementPaths.map((path) => (
                <article key={path.number} className="group hover:bg-neutral-50 transition-colors">
                  <span className="text-[#d61f26]">{path.number}</span>
                  <h3 className="tracking-tight text-[1.25rem]">
                    {path.title}
                  </h3>
                  <p>{path.body}</p>
                  <Link
                    href="/contact"
                    onClick={() => consultingClick(`Engagement: ${path.title}`)}
                    className="home-photo-text-link mt-8"
                  >
                    Start the conversation
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section data-testid="section-founder-authority" className="public-dark-surface home-photo-section bg-black text-white">
          <div className="home-photo-frame home-photo-founder-grid">
            <div className="home-photo-founder-image relative">
              <div className="absolute -bottom-6 -right-6 h-full w-full bg-[#d61f26]" aria-hidden="true" />
              <img
                src={founderPhoto}
                alt="Nick Lynch, founder of Spartan Coaching"
                width={416}
                height={520}
                decoding="async"
                className="relative h-full w-full object-cover grayscale"
              />
            </div>

            <div className="lg:pl-10">
              <p className="home-photo-kicker text-[#d61f26] border-[#d61f26]">Meet your coach</p>
              <h2 className="fi-serif mt-6 max-w-4xl text-[clamp(4rem,7vw,6.5rem)] leading-[.96] tracking-[-0.03em] text-white">
                Built by someone who has carried the number.
              </h2>
              <p className="mt-8 max-w-2xl text-[1.2rem] leading-relaxed text-white/80">
                Nick Lynch built Spartan Coaching around a simple belief: hospice sales support should
                sound like the field, work in the field, and make leaders better at coaching the field.
              </p>
              <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-white/60">
                The work combines frontline experience, executive perspective, and a practical operating
                system for teams that are accountable for growth every week.
              </p>
              <Link
                href="/about"
                className="home-photo-text-link mt-10 text-white hover:text-[#d61f26]"
              >
                Read the founder story
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section data-testid="section-results" className="home-photo-section bg-[#f5f3ef]">
          <div className="home-photo-frame">
            <div className="home-photo-results-head">
              <div>
                <p className="home-photo-kicker">What changes</p>
                <h2 className="home-photo-section-title mt-5 font-display font-black uppercase">
                  A stronger tomorrow is <span>possible.</span>
                </h2>
              </div>
              <p>The goal is not a motivational week. It is clarity, confidence, and a standard leaders can coach long after the engagement ends.</p>
            </div>

              <div className="home-photo-results-grid bg-white shadow-xl">
                  {outcomes.map((outcome) => (
                    <figure key={outcome.role} className="flex flex-col">
                      <blockquote className="flex-1 text-[1.15rem] leading-[1.6]">“{outcome.quote}”</blockquote>
                      <figcaption className="mt-8 pt-6 border-t border-black/10">
                        {outcome.role}
                      </figcaption>
                    </figure>
                  ))}
                <div className="home-photo-outcome bg-[#d61f26] text-white flex-col items-start gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[.2em] text-white/80">The outcome</p>
                    <p className="mt-4 text-4xl font-display font-black uppercase tracking-tight">Repeatable execution.</p>
                  </div>
                  <p className="max-w-xl leading-relaxed text-white/90 text-lg">
                    One disciplined approach leaders can coach across territories, branches, and markets.
                  </p>
                </div>
              </div>
          </div>
        </section>

        <section data-testid="section-process" className="home-photo-section bg-white border-y border-black/10">
          <div className="home-photo-frame">
            <div className="max-w-4xl">
              <p className="home-photo-kicker">How we work</p>
              <h2 className="home-photo-section-title mt-5 font-display font-black uppercase">
                Clear from first call to lasting change.
              </h2>
            </div>

            <div className="home-photo-process-grid">
              {[
                ["01", "Discovery call", "Get clear on the pressure, the goal, and what is getting in the way."],
                ["02", "Customized plan", "Build the engagement around your team, market, and operating reality."],
                ["03", "Get to work", "Coach in the moments where skill, leadership, and execution are tested."],
                ["04", "Lasting results", "Leave behind standards and rhythms the organization can sustain."],
              ].map(([number, title, body]) => (
                <article key={number}>
                  <span className="text-[#d61f26]">{number}</span>
                  <h3 className="tracking-tight text-xl">{title}</h3>
                  <p className="text-base">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section data-testid="section-closing" className="bg-[#f5f3ef] py-20">
          <div className="home-photo-frame">
            <div className="public-dark-surface home-photo-closing relative z-10 bg-black text-white shadow-2xl">
              <div>
                <p className="home-photo-kicker text-[#d61f26] border-[#d61f26]">The next move</p>
                <h2 className="mt-5 font-display text-[clamp(4.5rem,10vw,9rem)] font-black uppercase leading-[0.85] tracking-[-0.04em]">
                  Stop winging it.
                </h2>
                <p className="mt-10 max-w-2xl text-[1.25rem] leading-[1.6] text-white/70">
                  Build a hospice growth system your team can execute and your leaders can coach.
                </p>
              </div>
              <Link
                href="/contact"
                onClick={() => consultingClick("Closing: Request a strategy call")}
                className="home-photo-button home-photo-button-primary bg-[#d61f26] border-[#d61f26]"
              >
                Request a strategy call
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
