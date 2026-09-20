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
  Route,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { SITE_ORIGIN } from "@/lib/seo-config";
import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "@/lib/publicFunnel";
import { useEffect, useRef, useState } from "react";
import founderPhoto from "@assets/nick-photo-cropped.jpg";

function HeroSystemPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStatus, setVideoStatus] = useState<"loading" | "playing" | "paused" | "error">("loading");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener?.("change", updatePreference);
    return () => mediaQuery.removeEventListener?.("change", updatePreference);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (reduceMotion) {
      video.pause();
      setVideoStatus("paused");
      return;
    }

    const playPromise = video.play();
    if (playPromise) {
      void playPromise.catch(() => setVideoStatus("paused"));
    }
  }, [reduceMotion]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => setVideoStatus("error"));
    } else {
      video.pause();
      setVideoStatus("paused");
    }
  };

  const retryVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    setVideoStatus("loading");
    video.load();
    if (!reduceMotion) {
      void video.play().catch(() => setVideoStatus("paused"));
    }
  };

  return (
    <div data-testid="section-hero-panel" className="relative">
      <div className="border border-black/15 bg-black p-2 shadow-[14px_14px_0_rgba(0,0,0,0.08)]">
        <div
          data-testid="hero-video-frame"
          className="relative aspect-video overflow-hidden bg-black"
        >
          <video
            ref={videoRef}
            data-testid="hero-video"
            className="h-full w-full object-cover"
            poster="/hero-poster.jpg"
            playsInline
            muted
            loop
            autoPlay={!reduceMotion}
            preload="metadata"
            onCanPlay={() => setVideoStatus(videoRef.current?.paused ? "paused" : "playing")}
            onPlay={() => setVideoStatus("playing")}
            onPause={() => setVideoStatus("paused")}
            onError={() => setVideoStatus("error")}
            aria-label="Spartan Coaching field leadership film"
          >
            <source src="/hero-video-mobile.webm" type="video/webm" media="(max-width: 767px)" />
            <source src="/hero-video.webm" type="video/webm" />
            <source src="/hero-video-mobile.mp4" type="video/mp4" media="(max-width: 767px)" />
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
            <div className="text-white">
              <p className="text-[10px] font-black uppercase tracking-[.28em] text-white/65">
                Field standard 01
              </p>
              <p className="mt-1 text-sm font-black uppercase tracking-[.08em]">
                Prepared teams win.
              </p>
            </div>

            {videoStatus === "error" ? (
              <button
                type="button"
                onClick={retryVideo}
                className="inline-flex min-h-11 items-center gap-2 border border-white/45 bg-black/65 px-4 text-xs font-black uppercase tracking-[.14em] text-white transition hover:bg-white hover:text-black"
                aria-label="Retry field leadership film"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            ) : (
              <button
                type="button"
                data-testid="button-hero-video-play"
                onClick={togglePlayback}
                className="inline-flex min-h-11 items-center gap-2 border border-white/45 bg-black/65 px-4 text-xs font-black uppercase tracking-[.14em] text-white transition hover:bg-white hover:text-black"
                aria-label={videoStatus === "playing" ? "Pause field leadership film" : "Play field leadership film"}
              >
                {videoStatus === "playing" ? (
                  <Pause className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Play className="h-4 w-4" aria-hidden="true" />
                )}
                {videoStatus === "playing" ? "Pause" : "Play"}
              </button>
            )}
          </div>
        </div>
      </div>
      <p data-testid="hero-video-status" className="sr-only" aria-live="polite">
        {videoStatus === "loading" && "Field leadership film is loading."}
        {videoStatus === "playing" && "Field leadership film is playing."}
        {videoStatus === "paused" && "Field leadership film is paused."}
        {videoStatus === "error" && "Field leadership film could not be loaded."}
      </p>
    </div>
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
    trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.CTA_CLICK, {
      page: "home",
      destination: "/contact",
      label,
      offer: "consulting",
    });
  };

  const servicesClick = (label: string) => {
    trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.CTA_CLICK, {
      page: "home",
      destination: "/services",
      label,
      offer: "consulting",
    });
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
        path="/"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <main className="overflow-hidden bg-white text-black">
        <section
          data-testid="section-hero"
          className="border-b border-black/10 bg-white"
        >
          <div
            data-testid="section-home-intro"
            className="mx-auto grid max-w-[1440px] gap-12 px-6 pb-16 pt-14 sm:px-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-14 lg:pb-24 lg:pt-20"
          >
            <div>
              <p className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-[.24em] text-[#d61f26]">
                <span className="h-px w-10 bg-[#d61f26]" aria-hidden="true" />
                Hospice growth consulting
              </p>
              <h1
                data-testid="text-home-hero-title"
                className="max-w-[780px] font-display text-[clamp(3.6rem,7.5vw,7.5rem)] font-black uppercase leading-[.98] tracking-[-.055em]"
              >
                Make the next hospice <span className="text-[#d61f26]">conversation</span> count.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-black/70 sm:text-xl">
                Spartan Coaching helps hospice teams convert strategy into disciplined field execution — with
                sharper conversations, stronger managers, and a growth system your people can actually run.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  onClick={() => consultingClick("Hero: Book a strategy call")}
                  className="inline-flex min-h-14 items-center justify-center gap-3 bg-[#d61f26] px-7 text-sm font-black uppercase tracking-[.12em] text-white transition hover:bg-black"
                >
                  Book a strategy call
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/services"
                  onClick={() => servicesClick("Hero: Explore consulting")}
                  className="inline-flex min-h-14 items-center justify-center gap-3 border border-black px-7 text-sm font-black uppercase tracking-[.12em] transition hover:bg-black hover:text-white"
                >
                  Explore consulting
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-3 border-t border-black/15 pt-6 text-[11px] font-black uppercase tracking-[.12em] text-black/65 sm:grid-cols-3">
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

            <HeroSystemPanel />
          </div>
        </section>

        <section data-testid="section-problems" className="bg-[#f2f0eb]">
          <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.24em] text-[#d61f26]">
                  Where growth gets stuck
                </p>
                <h2 className="mt-4 font-display text-5xl font-black uppercase leading-[.92] tracking-[-.045em] sm:text-6xl">
                  The problems we solve.
                </h2>
              </div>

              <div className="grid border-l border-t border-black/20 sm:grid-cols-2">
                {problems.map((problem) => {
                  const Icon = problem.icon;
                  return (
                    <article key={problem.title} className="border-b border-r border-black/20 p-7 sm:p-9">
                      <Icon className="h-7 w-7 text-[#d61f26]" strokeWidth={1.8} aria-hidden="true" />
                      <h3 className="mt-8 text-xl font-black uppercase tracking-[-.02em]">{problem.title}</h3>
                      <p className="mt-3 leading-7 text-black/65">{problem.body}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section data-testid="section-audiences" className="bg-black text-white">
          <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[.24em] text-[#ee3439]">Who this is for</p>
              <h2 className="mt-4 font-display text-5xl font-black uppercase leading-[.92] tracking-[-.045em] sm:text-6xl">
                Who we work with.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">
                Coaching and consulting shaped around the people responsible for hospice growth — from one
                territory to the entire organization.
              </p>
            </div>

            <div className="mt-12 grid gap-px bg-white/20 lg:grid-cols-3">
              {audiences.map((audience) => {
                const Icon = audience.icon;
                return (
                  <article key={audience.label} className="bg-black p-8 lg:p-10">
                    <div className="flex h-12 w-12 items-center justify-center border border-[#ee3439] text-[#ee3439]">
                      <Icon className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
                    </div>
                    <h3 className="mt-8 text-2xl font-black uppercase tracking-[-.025em]">{audience.label}</h3>
                    <p className="mt-4 leading-7 text-white/60">{audience.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section data-testid="section-method" className="bg-white">
          <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:gap-24">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.24em] text-[#d61f26]">
                  The Spartan method
                </p>
                <h2 className="mt-4 font-display text-5xl font-black uppercase leading-[.92] tracking-[-.045em] sm:text-6xl">
                  Diagnose.<br />Install.<br />Sustain.
                </h2>
                <p className="mt-6 max-w-md text-lg leading-8 text-black/65">
                  We find the real constraint, build the operating standard around it, and coach until the
                  new behavior holds without us in the room.
                </p>
              </div>

              <div className="border-t border-black">
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
                    <article
                      key={step.number}
                      className="grid gap-5 border-b border-black/20 py-8 sm:grid-cols-[72px_1fr_48px] sm:items-start"
                    >
                      <span className="text-sm font-black tracking-[.18em] text-[#d61f26]">{step.number}</span>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-[-.025em]">{step.title}</h3>
                        <p className="mt-3 max-w-2xl leading-7 text-black/65">{step.body}</p>
                      </div>
                      <Icon className="hidden h-7 w-7 text-black/35 sm:block" strokeWidth={1.5} aria-hidden="true" />
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section data-testid="section-pathways" className="border-y border-black/10 bg-[#f2f0eb]">
          <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.24em] text-[#d61f26]">
                  Consulting engagements
                </p>
                <h2 className="mt-4 max-w-4xl font-display text-5xl font-black uppercase leading-[.92] tracking-[-.045em] sm:text-6xl">
                  Four ways to move the field.
                </h2>
              </div>
              <Link
                href="/services"
                onClick={() => servicesClick("Engagements: View consulting services")}
                className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-[.12em] text-[#d61f26] hover:text-black"
              >
                View consulting services
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-12 grid border-l border-t border-black/20 md:grid-cols-2">
              {engagementPaths.map((path) => (
                <article key={path.number} className="group border-b border-r border-black/20 bg-white p-8 transition hover:bg-black hover:text-white sm:p-10">
                  <span className="text-xs font-black tracking-[.2em] text-[#d61f26]">{path.number}</span>
                  <h3 className="mt-12 max-w-lg text-2xl font-black uppercase leading-tight tracking-[-.025em] sm:text-3xl">
                    {path.title}
                  </h3>
                  <p className="mt-4 max-w-xl leading-7 text-black/65 transition group-hover:text-white/65">{path.body}</p>
                  <Link
                    href="/contact"
                    onClick={() => consultingClick(`Engagement: ${path.title}`)}
                    className="mt-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-[#d61f26]"
                  >
                    Start the conversation
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section data-testid="section-founder-authority" className="bg-white">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:gap-20 lg:px-14 lg:py-28">
            <div className="relative">
              <div className="absolute -bottom-4 -right-4 h-full w-full bg-[#d61f26]" aria-hidden="true" />
              <img
                src={founderPhoto}
                alt="Nick Bonitatibus, founder of Spartan Coaching"
                width={416}
                height={520}
                decoding="async"
                className="relative aspect-[4/5] w-full object-cover grayscale"
              />
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-[.24em] text-[#d61f26]">Meet your coach</p>
              <h2 className="fi-serif mt-4 max-w-4xl text-5xl font-black leading-[.96] tracking-[-.045em] sm:text-6xl">
                Built by someone who has carried the number.
              </h2>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-black/70">
                Nick Bonitatibus built Spartan Coaching around a simple belief: hospice sales support should
                sound like the field, work in the field, and make leaders better at coaching the field.
              </p>
              <p className="mt-5 max-w-2xl leading-8 text-black/65">
                The work combines frontline experience, executive perspective, and a practical operating
                system for teams that are accountable for growth every week.
              </p>
              <Link
                href="/about"
                className="mt-8 inline-flex items-center gap-3 text-sm font-black uppercase tracking-[.12em] text-[#d61f26] hover:text-black"
              >
                Read the founder story
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section data-testid="section-results" className="bg-[#f2f0eb]">
          <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.24em] text-[#d61f26]">
                  What changes
                </p>
                <h2 className="mt-4 font-display text-5xl font-black uppercase leading-[.92] tracking-[-.045em] sm:text-6xl">
                  Work the team can feel.
                </h2>
                <p className="mt-6 max-w-md text-lg leading-8 text-black/65">
                  The goal is not a motivational week. It is clarity, confidence, and a standard leaders can
                  coach long after the engagement ends.
                </p>
              </div>

              <div>
                <div className="grid gap-px bg-black/20 md:grid-cols-3">
                  {outcomes.map((outcome) => (
                    <figure key={outcome.role} className="bg-white p-7 sm:p-8">
                      <blockquote className="text-lg font-bold leading-7">“{outcome.quote}”</blockquote>
                      <figcaption className="mt-8 text-[11px] font-black uppercase tracking-[.16em] text-[#d61f26]">
                        {outcome.role}
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <div className="mt-px flex flex-col justify-between gap-5 bg-black p-8 text-white sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#ee3439]">The outcome</p>
                    <p className="mt-2 text-2xl font-black uppercase">Repeatable execution.</p>
                  </div>
                  <p className="max-w-xl leading-7 text-white/65">
                    One disciplined approach leaders can coach across territories, branches, and markets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section data-testid="section-process" className="bg-white">
          <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[.24em] text-[#d61f26]">How we work</p>
              <h2 className="mt-4 font-display text-5xl font-black uppercase leading-[.92] tracking-[-.045em] sm:text-6xl">
                Clear from first call to lasting change.
              </h2>
            </div>

            <div className="mt-12 grid border-l border-t border-black/20 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["01", "Discovery call", "Get clear on the pressure, the goal, and what is getting in the way."],
                ["02", "Customized plan", "Build the engagement around your team, market, and operating reality."],
                ["03", "Get to work", "Coach in the moments where skill, leadership, and execution are tested."],
                ["04", "Lasting results", "Leave behind standards and rhythms the organization can sustain."],
              ].map(([number, title, body]) => (
                <article key={number} className="border-b border-r border-black/20 p-7 sm:p-8">
                  <span className="text-xs font-black tracking-[.18em] text-[#d61f26]">{number}</span>
                  <h3 className="mt-12 text-xl font-black uppercase tracking-[-.02em]">{title}</h3>
                  <p className="mt-3 leading-7 text-black/65">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section data-testid="section-closing" className="bg-black text-white">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-20 sm:px-10 lg:grid-cols-[1fr_auto] lg:items-end lg:px-14 lg:py-24">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.24em] text-[#ee3439]">The next move</p>
              <h2 className="mt-4 font-display text-[clamp(4rem,9vw,8.5rem)] font-black uppercase leading-[.86] tracking-[-.06em]">
                Stop winging it.
              </h2>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/65">
                Build a hospice growth system your team can execute and your leaders can coach.
              </p>
            </div>
            <Link
              href="/contact"
              onClick={() => consultingClick("Closing: Book a strategy call")}
              className="inline-flex min-h-14 items-center justify-center gap-3 bg-[#d61f26] px-8 text-sm font-black uppercase tracking-[.12em] text-white transition hover:bg-white hover:text-black"
            >
              Book a strategy call
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="border-t border-white/15">
            <div className="mx-auto grid max-w-[1440px] gap-4 px-6 py-6 text-[10px] font-black uppercase tracking-[.16em] text-white/45 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:px-14">
              <span>Hospice-specific strategy</span>
              <span>Field-tested coaching</span>
              <span>Leadership accountability</span>
              <span>Repeatable execution</span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
