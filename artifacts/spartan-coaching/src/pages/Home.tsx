import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DisciplineIcon, EmpathyIcon, StrategyIcon } from "@/components/icons";
import { Shield, Heart, Zap, Target, Users, BookOpen, ArrowRight, Sparkles, Lightbulb, MessageCircle, Search, Mail, Flame, Stethoscope, Brain, Briefcase, CheckCircle, AlertCircle, Mic, TrendingUp, Building2, Clock, MonitorSmartphone, X } from "lucide-react";
import { Linkedin as SiLinkedin } from "lucide-react";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { SEO } from "@/components/SEO";
import { apiRequest } from "@/lib/queryClient";
import { MarkdownContent } from "@/components/MarkdownContent";
import { FadeIn, StaggerContainer, StaggerItem, AnimatedCounter } from "@/components/animations";
import { lazy, Suspense } from "react";
const SpartanHeroAnimation = lazy(() => import("@/components/SpartanHeroAnimation").then(m => ({ default: m.SpartanHeroAnimation })));
import { useReminderHistory } from "@/hooks/use-reminder-history";

function formatScheduledTime(ts: number): string {
  const now = Date.now();
  const diffMs = ts - now;
  if (diffMs <= 0) return "soon";
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 60) return `in ${diffMin}m`;
  const diffHr = Math.round(diffMs / 3_600_000);
  if (diffHr < 24) return `in ${diffHr}h`;
  const diffDays = Math.round(diffMs / 86_400_000);
  return `in ${diffDays}d`;
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const coachingVideoRef = useRef<HTMLVideoElement>(null);
  const [coachingPlaying, setCoachingPlaying] = useState(false);
  const [askQuery, setAskQuery] = useState("");
  const [askResponse, setAskResponse] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const { reminders, removeReminder } = useReminderHistory();

  const { data: siteSettingsData } = useQuery<{ settings: Record<string, string> }>({
    queryKey: ["/api/site-settings"],
  });
  const siteSettings = siteSettingsData?.settings || {};
  const linkedinPosts = [siteSettings["linkedin_post_1"], siteSettings["linkedin_post_2"], siteSettings["linkedin_post_3"]].filter(Boolean);
  const hasLinkedin = !!(siteSettings["linkedin_followers"] || siteSettings["linkedin_headline"] || siteSettings["linkedin_profile_url"] || linkedinPosts.length > 0);

  const suggestionQuestions = [
    "What are hospice eligibility criteria for heart failure?",
    "How do I handle the 'not ready' objection?",
    "What is the Medicare hospice benefit?",
    "Best strategies for building physician referrals?",
  ];

  const handleAskSubmit = async (prompt: string) => {
    if (!prompt.trim()) return;
    setAskLoading(true);
    setAskResponse("");
    setAskError(null);
    try {
      const res = await apiRequest("POST", "/api/chat", { prompt, conversationHistory: [] });
      const data = await res.json();
      setAskResponse(data.response);
    } catch (error) {
      setAskError("Something went wrong. Please try again.");
    } finally {
      setAskLoading(false);
    }
  };

  const handleAskReset = () => {
    setAskQuery("");
    setAskResponse("");
    setAskError(null);
  };

  useEffect(() => {
    let attemptPlayHandler: (() => Promise<void>) | null = null;

    const playVideo = async () => {
      if (videoRef.current) {
        try {
          videoRef.current.muted = true;
          videoRef.current.volume = 0;
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (error) {
          attemptPlayHandler = async () => {
            try {
              if (videoRef.current) {
                videoRef.current.muted = true;
                await videoRef.current.play();
                if (attemptPlayHandler) {
                  document.removeEventListener('click', attemptPlayHandler);
                  document.removeEventListener('touchstart', attemptPlayHandler);
                  document.removeEventListener('scroll', attemptPlayHandler);
                }
              }
            } catch (err) {
            }
          };
          document.addEventListener('click', attemptPlayHandler, { once: true });
          document.addEventListener('touchstart', attemptPlayHandler, { once: true });
          document.addEventListener('scroll', attemptPlayHandler, { once: true });
        }
      }
    };

    playVideo();
    const timeoutId = setTimeout(playVideo, 100);

    return () => {
      clearTimeout(timeoutId);
      if (attemptPlayHandler) {
        document.removeEventListener('click', attemptPlayHandler);
        document.removeEventListener('touchstart', attemptPlayHandler);
        document.removeEventListener('scroll', attemptPlayHandler);
      }
    };
  }, []);

  return (
    <div className="flex flex-col">
      <SEO />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "name": "Spartan Coaching",
            "description": "Practical coaching for hospice growth professionals. Build consistent referral relationships and execute territory strategy with discipline, ethical messaging, and measurable weekly accountability.",
            "url": typeof window !== 'undefined' ? window.location.origin : '',
            "serviceType": ["Hospice Growth Coaching", "Sales Training", "Strategic Consulting", "Leadership Coaching"],
            "areaServed": "US",
            "knowsAbout": ["Hospice Sales", "Healthcare Sales Training", "Medicare Hospice Benefits", "Referral Development", "Territory Management"],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Consulting Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Virtual Coaching Sessions",
                    "description": "Targeted coaching for specific hospice sales challenges"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Team Training Workshops",
                    "description": "Customized training for hospice sales teams"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Growth Strategy Consulting",
                    "description": "Strategic planning for hospice organization growth"
                  }
                }
              ]
            }
          })}
        </script>
      </Helmet>

      {/* 1. Hero Section — Logo reveal animation as living background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080808]" data-testid="section-hero">
        {/* Animation background — lazy loaded, non-blocking */}
        <Suspense fallback={<div className="absolute inset-0 bg-[#080808]" />}>
          <SpartanHeroAnimation />
        </Suspense>

        {/* Gradient overlay so copy is readable over animation */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/80 via-transparent to-[#080808]/40 z-[5] pointer-events-none" />

        {/* Hero copy layered over animation */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center pointer-events-none">
          <motion.p
            className="text-white/50 text-xs sm:text-sm font-semibold tracking-[0.4em] uppercase mb-6"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            Hospice Sales Excellence
          </motion.p>
          <motion.h1
            className="font-display font-black text-white leading-[1.0] mb-6"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            Hospice sales teams<br /><span className="text-[#e8291e]">that consistently close.</span>
          </motion.h1>
          <motion.p
            className="text-white/65 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            Eligible patients aren't getting hospice care because the right conversations aren't happening. Spartan Coaching exists to close that gap.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pointer-events-auto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button size="lg" asChild className="font-bold px-10 text-base" data-testid="button-hero-contact">
              <Link href="/contact">Book a Strategy Call</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild className="text-white/70 hover:text-white text-base gap-2" data-testid="button-hero-method">
              <Link href="/manifesto">See our method <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </motion.div>
        </div>

        {/* Scroll cue — fades in after 2s */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.6 }}
          aria-label="Scroll down"
        >
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
            <div className="w-5 h-8 rounded-full border border-white/25 flex items-start justify-center p-1.5">
              <div className="w-0.5 h-2 rounded-full bg-white/40" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 1a. Authority Proof Strip */}
      <section className="relative bg-[#040404] border-b border-red-900/20 py-7 sm:py-10 overflow-hidden" data-testid="section-proof-strip">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-15 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-red-900/25">
            {[
              { target: 18, suffix: " Days", label: "Avg. hospice length of stay", detail: "vs. 6-month Medicare benefit" },
              { target: 500, suffix: "K+", label: "Americans annually", detail: "who die without hospice they qualified for" },
              { target: 4, suffix: " Hours", label: "Target response window", detail: "referral-to-first-contact" },
              { target: 6, suffix: " Months", label: "Medicare benefit", detail: "the gap that trained reps exist to close" },
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

      {/* 1b. Pending Reminders */}
      {reminders.length > 0 && (
        <section className="bg-background border-b border-border" data-testid="section-pending-reminders">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-primary">
                  Pending Reminders
                </h2>
              </div>
              <ul className="space-y-2">
                {reminders.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3"
                    data-testid={`reminder-item-${r.id}`}
                  >
                    <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug truncate">
                        {r.title}
                      </p>
                      {r.contact ? (
                        <p className="text-sm font-medium text-foreground/80 truncate">
                          {r.contact}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.presetLabel} · {formatScheduledTime(r.scheduledFor)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeReminder(r.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                      aria-label="Dismiss reminder"
                      data-testid={`button-dismiss-reminder-${r.id}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 2. Ask Spartan AI Section */}
      <section id="ask-spartan" className="relative bg-gradient-to-br from-background via-background to-accent/5 spacing-section" data-testid="section-ask-spartan">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.08),transparent_50%)] pointer-events-none"></div>

        <div className="relative max-w-4xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                <h2 className="text-h2 text-gradient-elegant">Ask a Hospice Expert</h2>
              </div>
              <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
                Get instant expert answers on any hospice topic, sales strategies, clinical eligibility, regulations, territory planning, and more
              </p>
            </div>
          </FadeIn>

          <div className="mb-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskSubmit(askQuery);
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="flex-1 flex items-center gap-2 rounded-lg border-2 border-border bg-card p-2 shadow-lg focus-within:border-primary transition-colors">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground ml-1 flex-shrink-0" />
                <Input
                  type="text"
                  value={askQuery}
                  onChange={(e) => setAskQuery(e.target.value)}
                  placeholder="Ask any hospice question..."
                  className="flex-1 border-0 bg-transparent text-base sm:text-lg px-2 focus-visible:ring-0 focus-visible:border-0"
                  data-testid="input-ask-spartan"
                />
              </div>
              <Button
                type="submit"
                disabled={askLoading || !askQuery.trim()}
                className="font-bold px-6 w-full sm:w-auto"
                data-testid="button-ask-submit"
                aria-label="Submit question"
              >
                Ask
              </Button>
            </form>
          </div>

          {!askResponse && !askLoading && (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
              {suggestionQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm font-medium"
                  data-testid={`button-suggestion-${index}`}
                  onClick={() => {
                    setAskQuery(question);
                    handleAskSubmit(question);
                  }}
                >
                  {question}
                </Button>
              ))}
            </div>
          )}

          {askLoading && (
            <Card className="spacing-card shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3" data-testid="text-loading-indicator">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  <span className="text-muted-foreground font-medium">Finding the best answer...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {askError && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800" data-testid="text-ask-error">
              <p className="text-red-700 dark:text-red-300 font-medium">{askError}</p>
            </div>
          )}

          {askResponse && !askLoading && (
            <Card className="spacing-card shadow-lg">
              <CardContent className="pt-6">
                <div data-testid="text-ai-response">
                  <MarkdownContent content={askResponse} />
                </div>
                <div className="mt-6 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={handleAskReset}
                    className="font-bold"
                    data-testid="button-ask-reset"
                  >
                    Ask another question
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>


      {/* 3. Trust Stack Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950 spacing-section" data-testid="section-trust-stack">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.03),transparent_70%)]"></div>

        <div className="relative max-w-7xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-h2 text-gradient-elegant mb-6" data-testid="text-trust-stack-title">
                Built for Hospice Growth
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-cards mb-16">
            {[
              "Hospice-specific coaching, not generic sales training",
              "Compliance-aware messaging that respects clinical workflow",
              "Practical systems that work on Tuesday afternoon, not just in a conference room",
              "Weekly accountability rhythm that keeps execution consistent",
              "Field-tested frameworks used by real hospice growth teams",
            ].map((bullet, index) => (
              <StaggerItem key={index}>
                <Card className="border-2 spacing-card shadow-lg h-full" data-testid={`card-trust-${index}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-body text-foreground font-medium leading-relaxed">{bullet}</p>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>


      {/* 3b. The Stakes */}
      <section className="relative bg-gray-950 py-20 sm:py-28" data-testid="section-stakes">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-sm font-bold tracking-widest text-red-400 uppercase mb-6">The Real Problem</p>
            <h2 className="text-h2 font-bold text-white mb-8 font-display" data-testid="text-stakes-title">
              The Gap Is Not Clinical. It Is Conversational.
            </h2>
            <div className="space-y-6 text-body-lg text-white/75 leading-relaxed max-w-3xl mx-auto text-left">
              <p>
                Hundreds of thousands of Americans die each year without hospice care who would have qualified for it. The average hospice length of stay is around eighteen days. The Medicare benefit allows up to six months. That gap does not exist because of bad clinical decisions.
              </p>
              <p className="text-white/90 font-semibold">
                It exists because the right conversations did not happen. A referral that did not get made. A physician who said "not yet" to a rep who did not know how to respond. An eligible patient who never got asked.
              </p>
              <p>
                When a rep does the work well, that changes. A patient stops managing their own pain alone. A family gets a care team instead of a crisis. A daughter gets to be a daughter again instead of a medical coordinator trying to figure out what to do next.
              </p>
              <p>
                That is what good sales execution produces. Not a quota hit. Not a commission. A human being who gets comfort care they needed and deserved, earlier in their journey.
              </p>
            </div>
            <div className="mt-12">
              <Button
                size="lg"
                variant="outline"
                asChild
                className="font-bold glass border-white/30 touch-manipulation group px-10"
                data-testid="button-stakes-manifesto"
              >
                <Link href="/manifesto">
                  <span>Read the Spartan Ethos</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 3c. Coaching Video Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950 py-20 sm:py-28" data-testid="section-coaching-video">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.04),transparent_70%)] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <p className="text-sm font-bold tracking-widest text-red-600 dark:text-red-400 uppercase mb-4">What the Work Looks Like</p>
              <h2 className="text-h2 text-foreground mb-4" data-testid="text-coaching-video-title">
                Real Coaching. Real Conversations.
              </h2>
              <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
                Spartan Coaching happens in the field and in the room, not on a slide deck. This is what building elite hospice sales execution actually looks like.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-950 group" data-testid="container-coaching-video">
              <video
                ref={coachingVideoRef}
                className="w-full aspect-video object-cover"
                playsInline
                preload="metadata"
                onPlay={() => setCoachingPlaying(true)}
                onPause={() => setCoachingPlaying(false)}
                onEnded={() => setCoachingPlaying(false)}
                data-testid="video-coaching"
                aria-label="Spartan Coaching - coaching session video"
              >
                <source src="/spartan-coaching-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Play / Pause overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                style={{ visibility: coachingPlaying ? 'hidden' : 'visible' }}
                onClick={() => {
                  if (coachingVideoRef.current) {
                    coachingVideoRef.current.play();
                  }
                }}
                data-testid="button-play-coaching-video"
                aria-label="Play coaching video"
              >
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-200">
                  <div className="w-0 h-0 border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent border-l-[24px] border-l-red-600 ml-2" />
                </div>
              </div>

              {/* Pause button when playing */}
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                style={{ visibility: coachingPlaying ? 'visible' : 'hidden' }}
                onClick={() => {
                  if (coachingVideoRef.current) {
                    coachingVideoRef.current.pause();
                  }
                }}
                data-testid="button-pause-coaching-video"
                aria-label="Pause coaching video"
              >
                <div className="absolute inset-0 bg-transparent" />
              </div>

              {/* Brand badge */}
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" style={{ animation: 'pulse 2s infinite' }} />
                <span className="text-white text-xs font-bold tracking-wide uppercase">Spartan Coaching</span>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.25}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="font-bold px-10 group" data-testid="button-coaching-video-contact">
                <Link href="/contact">
                  <span>Start the Conversation</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-bold px-10" data-testid="button-coaching-video-services">
                <Link href="/services">See All Programs</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>


      {/* 4. The Problem and The Promise */}
      <section className="relative bg-gradient-to-br from-background via-background to-accent/5 spacing-section" data-testid="section-problem-promise">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.06),transparent_50%)] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto spacing-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-sections">
            <FadeIn>
              <div>
                <h2 className="text-h2 text-foreground mb-8" data-testid="text-problem-title">
                  Why Hospice Growth Feels Chaotic
                </h2>
                <div className="space-y-4">
                  {[
                    "Your calendar is full but your pipeline is flat",
                    "Follow up falls through the cracks every week",
                    "Objections stall conversations you should be winning",
                    "Territory planning is a spreadsheet nobody updates",
                    "New reps take months to produce and experienced reps plateau",
                  ].map((problem, index) => (
                    <div key={index} className="flex items-start gap-3" data-testid={`text-problem-${index}`}>
                      <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-body text-muted-foreground">{problem}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div>
                <h2 className="text-h2 text-gradient-elegant mb-8" data-testid="text-promise-title">
                  What Spartan Fixes
                </h2>
                <div className="space-y-4">
                  {[
                    "A repeatable weekly system that tells you where to go, who to see, and what to say",
                    "Messaging frameworks that earn trust with clinical staff",
                    "Scorecard accountability so progress is visible, not assumed",
                    "Coaching that happens in the work, not in a lecture hall",
                  ].map((fix, index) => (
                    <div key={index} className="flex items-start gap-3" data-testid={`text-fix-${index}`}>
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-body text-foreground font-medium">{fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>


      {/* 5. What You Get */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950 spacing-section" data-testid="section-what-you-get">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.03),transparent_70%)]"></div>

        <div className="relative max-w-5xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-h2 text-gradient-elegant mb-6" data-testid="text-what-you-get-title">
                What You Get
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-cards">
            {[
              { title: "Territory and account planning system", desc: "Organize your territory with clarity so every week has a purpose.", icon: Target },
              { title: "Referral source segmentation framework", desc: "Structured approach for hospitals, SNFs, home health, physicians, senior living, and community partners.", icon: Users },
              { title: "Weekly scorecard and accountability rhythm", desc: "Track the behaviors that drive results, not just the results themselves.", icon: Zap },
              { title: "Messaging library and education based outreach scripts", desc: "Scripts organized by referral source type so your outreach is relevant and respectful.", icon: BookOpen },
              { title: "Objection handling scripts", desc: "Patient-centered and accurate responses that keep conversations moving forward.", icon: MessageCircle },
              { title: "Follow up sequences and cadence templates", desc: "Never let a warm relationship go cold because of inconsistent follow up.", icon: Mail },
              { title: "Weekly coaching agenda and pre-work", desc: "Sessions are structured and repeatable so coaching time is never wasted.", icon: Briefcase },
              { title: "Optional AI enabled planning tools", desc: "For organizing messaging and territory workflow. Do not enter patient identifiers or PHI into any tool.", icon: Brain },
            ].map((item, index) => {
              const IconComponent = item.icon;
              return (
                <StaggerItem key={index}>
                  <Card className="border-2 spacing-card h-full" data-testid={`text-deliverable-${index}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-body font-bold text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>


      {/* 6. Hospice Realities We Train For */}
      <section className="relative bg-gradient-to-br from-accent/40 via-accent/20 to-accent/40 spacing-section" data-testid="section-hospice-realities">
        <div className="max-w-5xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-h2 text-foreground mb-6" data-testid="text-realities-title">
                Hospice Realities We Train For
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Physicians who say 'not yet' when the patient clearly qualifies",
              "Discharge planners who have three other agencies calling",
              "Families who confuse hospice with giving up",
              "SNF administrators focused on census, not transitions",
              "Community partners who refer inconsistently",
              "New reps who freeze during tough clinical conversations",
              "Territories that feel like dead zones",
              "Leaders who manage by numbers instead of coaching the person",
            ].map((reality, index) => (
              <StaggerItem key={index}>
                <div className="flex items-start gap-3 p-3" data-testid={`text-reality-${index}`}>
                  <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-body text-foreground">{reality}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>


      {/* 7. How It Works */}
      <section className="relative bg-gradient-to-br from-background via-background to-accent/5 spacing-section" data-testid="section-how-it-works">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.06),transparent_50%)] pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-h2 text-gradient-elegant mb-6" data-testid="text-how-it-works-title">
                How It Works
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="space-y-6">
            {[
              { step: 1, title: "Intake and Baseline", desc: "We assess your current territory, pipeline, and habits. No judgment, just a clear starting point." },
              { step: 2, title: "Week One Territory Plan", desc: "You walk away with a plan, success metrics, and a clear weekly rhythm. Time commitment: 2 to 3 hours per week including prep." },
              { step: 3, title: "Weekly Coaching and Execution Debrief", desc: "Each week we review what happened, what worked, what did not, and what you will do next." },
              { step: 4, title: "Scorecard Accountability", desc: "Progress is measured through behaviors and activities, not just outcomes." },
              { step: 5, title: "Refinement and Scaling", desc: "As you build consistency, we refine your approach and expand what is working." },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <Card className="border-2 spacing-card shadow-lg" data-testid={`card-step-${item.step}`}>
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 bg-spartan-gradient rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-white font-black text-lg">{item.step}</span>
                    </div>
                    <div>
                      <h3 className="text-h3 text-foreground mb-2">{item.title}</h3>
                      <p className="text-body text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>


      {/* 7b. Services Preview */}
      <section className="relative bg-gray-950 py-20 sm:py-28" data-testid="section-services-preview">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <p className="text-sm font-bold tracking-widest text-red-400 uppercase mb-4">Services & Pricing</p>
              <h2 className="text-h2 font-bold text-white mb-4 font-display" data-testid="text-services-preview-title">
                Built for Every Level of the Organization
              </h2>
              <p className="text-body-lg text-white/65 max-w-2xl mx-auto">
                Whether you are an individual rep, a sales director, a multi-market operator, or a hospice provider who needs purpose-built technology — there is an engagement built for your situation.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                icon: Users,
                label: "Individual Sales Reps",
                price: "From $40/session",
                desc: "Virtual coaching sessions, field ridealongs, and territory management coaching. Targeted help on exactly what is stalling your results.",
                href: "/services#individual",
              },
              {
                icon: Briefcase,
                label: "Sales Leadership",
                price: "Custom pricing",
                desc: "Team workshops, leadership coaching, and growth strategy consulting. Build teams that execute the same playbook and hold each other accountable.",
                href: "/services#leadership",
              },
              {
                icon: Building2,
                label: "Corporate Providers",
                price: "Custom pricing",
                desc: "Market analysis, system implementation, and executive consulting. Scale execution across markets and make growth predictable and repeatable.",
                href: "/services#corporate",
              },
              {
                icon: MonitorSmartphone,
                label: "Technology Solutions",
                price: "Custom pricing",
                desc: "Custom CRMs, iOS apps, and websites built specifically for hospice providers. Purpose-built tools that fit how your organization actually works.",
                href: "/services#technology",
              },
            ].map((tier, index) => {
              const IconComponent = tier.icon;
              return (
                <StaggerItem key={index}>
                  <Link href={tier.href} className="block h-full" data-testid={`link-service-tier-${index}`}>
                    <Card className="bg-white/5 border border-white/10 spacing-card h-full hover-elevate cursor-pointer">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-xl flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-6 h-6 text-red-400" />
                          </div>
                          <span className="text-sm font-bold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-3 py-1">{tier.price}</span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white mb-2">{tier.label}</h3>
                          <p className="text-sm text-white/60 leading-relaxed">{tier.desc}</p>
                        </div>
                        <div className="flex items-center gap-1 text-red-400 text-sm font-semibold mt-auto pt-2">
                          <span>View services</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

          <FadeIn>
            <div className="text-center">
              <Button
                size="lg"
                asChild
                className="font-bold touch-manipulation group px-10"
                data-testid="button-services-preview-cta"
              >
                <Link href="/services">
                  <span>See All Services & Pricing</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>


      {/* 8. Results and Proof */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950 spacing-section" data-testid="section-results">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.03),transparent_70%)]"></div>

        <div className="relative max-w-7xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-h2 text-gradient-elegant mb-6" data-testid="text-results-title">
                What Changes Look Like
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-cards mb-12">
            <StaggerItem>
              <Card className="border-2 spacing-card shadow-lg h-full" data-testid="card-case-study-1">
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-h3 text-foreground">Clarity and follow through</h3>
                  <div className="divide-y divide-border">
                    <p className="text-sm text-muted-foreground leading-relaxed pb-3">
                      <span className="font-semibold text-foreground">Starting point:</span> Priority accounts were unclear and follow up was inconsistent.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed py-3">
                      <span className="font-semibold text-foreground">What changed:</span> Weekly focus became clear and follow up stopped slipping.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-3">
                      <span className="font-semibold text-foreground">Actions that drove it:</span> Territory priorities, next step tracking, simple follow through standard.
                    </p>
                  </div>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-2 spacing-card shadow-lg h-full" data-testid="card-case-study-2">
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-xl flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-h3 text-foreground">Better next steps</h3>
                  <div className="divide-y divide-border">
                    <p className="text-sm text-muted-foreground leading-relaxed pb-3">
                      <span className="font-semibold text-foreground">Starting point:</span> Good relationships, but conversations did not consistently move to a next step.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed py-3">
                      <span className="font-semibold text-foreground">What changed:</span> Stronger control of next steps and cleaner follow up.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-3">
                      <span className="font-semibold text-foreground">Actions that drove it:</span> Conversation structure, post visit follow up plan, weekly review.
                    </p>
                  </div>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-2 spacing-card shadow-lg h-full" data-testid="card-case-study-3">
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-h3 text-foreground">Real market read</h3>
                  <div className="divide-y divide-border">
                    <p className="text-sm text-muted-foreground leading-relaxed pb-3">
                      <span className="font-semibold text-foreground">Starting point:</span> The market felt confusing and the team was guessing what was happening.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed py-3">
                      <span className="font-semibold text-foreground">What changed:</span> Clear read on territory temperature and where to focus now.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-3">
                      <span className="font-semibold text-foreground">Actions that drove it:</span> Segment accounts, track education touches, validate assumptions with data when needed.
                    </p>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>


      {/* LinkedIn Social Proof */}
      {hasLinkedin && (
        <section className="relative bg-gradient-to-br from-background via-background to-accent/5 spacing-section" data-testid="section-linkedin">
          <div className="relative max-w-5xl mx-auto spacing-container">
            <FadeIn>
              <div className="text-center mb-12 sm:mb-16">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <SiLinkedin className="w-7 h-7 sm:w-8 sm:h-8 text-[#0A66C2]" />
                  <h2 className="text-h2 text-gradient-elegant" data-testid="text-linkedin-title">Follow Along on LinkedIn</h2>
                </div>
                {siteSettings["linkedin_headline"] && (
                  <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">{siteSettings["linkedin_headline"]}</p>
                )}
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                {siteSettings["linkedin_followers"] && (
                  <div className="flex items-center gap-2 bg-[#0A66C2]/10 border border-[#0A66C2]/20 rounded-md px-4 py-2">
                    <SiLinkedin className="w-5 h-5 text-[#0A66C2]" />
                    <span className="text-sm font-bold text-foreground" data-testid="text-linkedin-followers">{siteSettings["linkedin_followers"]} Followers</span>
                  </div>
                )}
                {siteSettings["linkedin_profile_url"] && (
                  <Button variant="outline" asChild className="font-bold" data-testid="link-linkedin-profile">
                    <a href={siteSettings["linkedin_profile_url"]} target="_blank" rel="noopener noreferrer">
                      <SiLinkedin className="w-4 h-4 mr-2 text-[#0A66C2]" />
                      View LinkedIn Profile
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            </FadeIn>

            {linkedinPosts.length > 0 && (
              <FadeIn delay={0.2}>
                <div className={`grid gap-6 ${linkedinPosts.length === 1 ? "grid-cols-1 max-w-lg mx-auto" : linkedinPosts.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                  {linkedinPosts.map((postUrl, index) => (
                    <Card key={index} className="overflow-hidden" data-testid={`card-linkedin-post-${index}`}>
                      <div className="w-full" style={{ minHeight: "400px" }}>
                        <iframe
                          src={postUrl}
                          width="100%"
                          height="400"
                          frameBorder="0"
                          allowFullScreen
                          title={`LinkedIn post ${index + 1}`}
                          className="w-full"
                          loading="lazy"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </FadeIn>
            )}
          </div>
        </section>
      )}

      {/* Before and After Comparison */}
      <section className="relative bg-gradient-to-br from-accent/40 via-accent/20 to-accent/40 spacing-section" data-testid="section-before-after">
        <div className="max-w-5xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-h2 text-foreground mb-6" data-testid="text-before-after-title">
                The Difference in Practice
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FadeIn>
              <Card className="border-2 spacing-card h-full" data-testid="card-before">
                <h3 className="text-h3 text-muted-foreground mb-6 font-bold">What Most Teams Do</h3>
                <div className="space-y-4">
                  {[
                    "Visit accounts without a written plan for why or what to accomplish",
                    "React to objections with improvised answers that don't move the conversation",
                    "Review results once a month and hope next month is better",
                    "Onboard new reps with a ride along and a binder, then wait",
                    "Run team meetings that recap numbers without coaching behavior",
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3" data-testid={`text-before-${index}`}>
                      <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>

            <FadeIn delay={0.2}>
              <Card className="border-2 spacing-card h-full bg-gradient-to-br from-primary/5 to-destructive/5" data-testid="card-after">
                <h3 className="text-h3 text-foreground mb-6 font-bold">What Spartan Teams Do</h3>
                <div className="space-y-4">
                  {[
                    "Walk into every visit with a clear objective and a next step to close on",
                    "Handle objections with practiced, patient centered responses that keep the conversation moving",
                    "Review weekly behaviors that lead to results and adjust before outcomes suffer",
                    "Onboard new reps with week by week milestones and structured field coaching",
                    "Run short huddles that coach one skill at a time and drive accountability",
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3" data-testid={`text-after-${index}`}>
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground font-medium leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>


      {/* 9. Compliance and Ethics Block */}
      <section className="relative bg-gradient-to-br from-background via-background to-accent/5 spacing-section" data-testid="section-compliance">
        <div className="relative max-w-4xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-12 sm:mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                <h2 className="text-h2 text-foreground" data-testid="text-compliance-title">Our Compliance Posture</h2>
              </div>
            </div>
          </FadeIn>

          <FadeIn>
            <Card className="border-2 spacing-card shadow-lg" data-testid="card-compliance">
              <div className="space-y-5">
                {[
                  "Coaching focuses on ethical relationship building and education, not inducements",
                  "Do not enter patient identifiers or PHI into any tools",
                  "Tools are for planning and messaging workflows, not documentation",
                  "Client data is not used to train public models",
                  "No guarantees of admissions, referrals, or census growth",
                ].map((point, index) => (
                  <div key={index} className="flex items-start gap-4" data-testid={`text-compliance-${index}`}>
                    <span className="w-7 h-7 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-red-600 dark:text-red-400">
                      {index + 1}
                    </span>
                    <p className="text-body text-foreground">{point}</p>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        </div>
      </section>


      {/* 10. Who This Is For and Who It Is Not For */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950 spacing-section" data-testid="section-who-for">
        <div className="relative max-w-7xl mx-auto spacing-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-sections">
            <FadeIn>
              <div>
                <h2 className="text-h2 text-gradient-elegant mb-8" data-testid="text-for-you-title">
                  This Is for You If
                </h2>
                <div className="space-y-4">
                  {[
                    "You are a hospice liaison tired of winging it",
                    "You are a BDR who wants a system, not just a territory",
                    "You are a director who needs the team executing the same playbook",
                    "You are a growth leader who wants accountability without micromanaging",
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3" data-testid={`text-for-you-${index}`}>
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-body text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div>
                <h2 className="text-h2 text-foreground mb-8" data-testid="text-not-for-you-title">
                  This Is Not for You If
                </h2>
                <div className="space-y-4">
                  {[
                    "You want a shortcut or silver bullet",
                    "You are not willing to do the prep work",
                    "You expect guaranteed results without consistent effort",
                    "You want motivational speeches instead of practical systems",
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3" data-testid={`text-not-for-you-${index}`}>
                      <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-body text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>


      {/* 11. Spartan Coaching Tools Showcase */}
      <section className="relative bg-gradient-to-br from-background via-background to-accent/5 spacing-section" data-testid="section-ai-tools">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.05),transparent_60%)] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-h2 text-gradient-elegant mb-6" data-testid="text-ai-tools-title">
                Spartan Coaching Tools
              </h2>
              <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
                Built on real hospice field experience. Use these tools to plan your week, sharpen your messaging, and prepare for tough conversations.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 gap-cards">
            <StaggerItem>
              <Card className="border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-playbooks">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <Lightbulb className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Sales Playbook Generator</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Build the playbook before the visit so you walk in prepared, not improvising. Custom to your scenario and referral source type.
                  </p>
                  <Button size="sm" variant="outline" asChild className="w-full font-bold touch-manipulation group mt-auto" data-testid="button-try-playbooks">
                    <Link href="/tools/playbooks">
                      <span>Try it now</span>
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-objections">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Objection Handler</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Practice your response before the conversation, not after it stalled. Patient-centered answers to the objections that stop most reps cold.
                  </p>
                  <Button size="sm" variant="outline" asChild className="w-full font-bold touch-manipulation group mt-auto" data-testid="button-try-objections">
                    <Link href="/tools/objections">
                      <span>Try it now</span>
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-research">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <Search className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Territory Research</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Strategy is only as good as your market read. Know the data behind your territory before you decide where to spend your week.
                  </p>
                  <Button size="sm" variant="outline" asChild className="w-full font-bold touch-manipulation group mt-auto" data-testid="button-try-research">
                    <Link href="/tools/research">
                      <span>Try it now</span>
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-email-templates">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Email Templates</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Follow up that feels like a partner checking in, not a vendor chasing a referral. Templates built for clinical relationships.
                  </p>
                  <Button size="sm" variant="outline" asChild className="w-full font-bold touch-manipulation group mt-auto" data-testid="button-try-email-templates">
                    <Link href="/tools/email-templates">
                      <span>Try it now</span>
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-role-play">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Role Play Practice</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Practice the hard conversation before it is real. Physician objections, family hesitation, competitive situations. Scored and coached.
                  </p>
                  <Button size="sm" variant="outline" asChild className="w-full font-bold touch-manipulation group mt-auto" data-testid="button-try-role-play">
                    <Link href="/tools/role-play">
                      <span>Try it now</span>
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-drills">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Daily Coaching Drills</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Repetitions build the skill. Ten minutes a day on objection handling, clinical knowledge, and territory planning so you are not winging it.
                  </p>
                  <Button size="sm" variant="outline" asChild className="w-full font-bold touch-manipulation group mt-auto" data-testid="button-try-drills">
                    <Link href="/drills">
                      <span>Try it now</span>
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-transcribe">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Call Transcriber</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Transcribe and analyze sales calls and coaching sessions. Identify what landed, what stalled, and what to adjust before your next visit.
                  </p>
                  <Button size="sm" variant="outline" asChild className="w-full font-bold touch-manipulation group mt-auto" data-testid="button-try-transcribe">
                    <Link href="/tools/transcribe">
                      <span>Try it now</span>
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-roi-calculator">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">ROI Calculator</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Turn your admissions goal into a revenue case. See the financial impact of closing the gap between your current and potential performance.
                  </p>
                  <Button size="sm" variant="outline" asChild className="w-full font-bold touch-manipulation group mt-auto" data-testid="button-try-roi-calculator">
                    <Link href="/tools/roi-calculator">
                      <span>Try it now</span>
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-quiz">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Knowledge Quiz</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Test your knowledge across eligibility, objection handling, territory strategy, and compliance. Immediate feedback on every answer with full explanations.
                  </p>
                  <Button size="sm" variant="outline" asChild className="w-full font-bold touch-manipulation group mt-auto" data-testid="button-try-quiz">
                    <Link href="/quiz">
                      <span>Take the quiz</span>
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>


      {/* 12. Why Spartan Credibility Section */}
      <section className="relative bg-gradient-to-br from-background via-background to-accent/5 spacing-section" data-testid="section-why-spartan">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.06),transparent_50%)] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-20">
              <p className="text-lg font-semibold text-primary mb-3" data-testid="text-why-spartan-label">Why Spartan</p>
              <h2 className="text-h2 text-foreground mb-6" data-testid="text-why-spartan-title">
                What Makes This Different
              </h2>
              <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto mb-4">
                Most sales training is generic. Spartan is built for hospice growth professionals who need practical systems, not motivational speeches.
              </p>
              <p className="text-body text-muted-foreground max-w-3xl mx-auto">
                The name is not about being aggressive. It is about being disciplined, prepared, and willing to do the hard work consistently. We strip away what does not work, focus on what does, and build habits that hold up under pressure. Not flash. Not hype. Just the work.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-cards max-w-5xl mx-auto">
            <StaggerItem>
              <Card className="border-2 spacing-card shadow-lg h-full" data-testid="card-expertise-sales">
                <div className="flex flex-col">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-2xl flex items-center justify-center mb-5">
                    <Target className="w-7 h-7 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-h3 mb-3">Field Experience, Not Theory</CardTitle>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    Every framework we teach has been used in real hospice markets, with real referral sources, in real conversations. Nothing here was built in a classroom.
                  </p>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-2 spacing-card shadow-lg h-full" data-testid="card-expertise-clinical">
                <div className="flex flex-col">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-2xl flex items-center justify-center mb-5">
                    <Stethoscope className="w-7 h-7 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-h3 mb-3">Clinical Fluency</CardTitle>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    We understand eligibility criteria, clinical indicators, and Medicare guidelines well enough to coach your team to speak credibly with physicians and clinical staff.
                  </p>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-2 spacing-card shadow-lg h-full" data-testid="card-expertise-consulting">
                <div className="flex flex-col">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-2xl flex items-center justify-center mb-5">
                    <Briefcase className="w-7 h-7 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-h3 mb-3">Execution Focus</CardTitle>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    Strategy without execution is a waste of time. Every engagement is built around weekly behaviors, visible accountability, and measurable follow through.
                  </p>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-2 spacing-card shadow-lg h-full" data-testid="card-expertise-ai">
                <div className="flex flex-col">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-2xl flex items-center justify-center mb-5">
                    <Brain className="w-7 h-7 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-h3 mb-3">Practical Tools</CardTitle>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    Our tools are designed to support your weekly workflow. Territory planning, messaging prep, objection handling, and follow up tracking, all built for the field.
                  </p>
                </div>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>


      {/* Lead Magnet Section */}
      <section className="relative bg-gradient-to-br from-background via-background to-accent/5 spacing-section" data-testid="section-lead-magnet">
        <div className="relative max-w-4xl mx-auto spacing-container">
          <FadeIn>
            <Card className="border-2 spacing-card shadow-lg" data-testid="card-lead-magnet">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-sm font-semibold text-primary mb-3">Free Resource</p>
                  <h2 className="text-h2 text-foreground mb-4">
                    Territory Planning Starter Kit
                  </h2>
                  <p className="text-body text-muted-foreground leading-relaxed mb-4">
                    Get the same territory planning framework we use with coaching clients. Includes account prioritization worksheet, weekly routing template, and follow up cadence guide.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {[
                      "A/B/C account classification template",
                      "Weekly territory routing planner",
                      "Follow up cadence tracker",
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-2xl flex items-center justify-center mb-6">
                    <BookOpen className="w-10 h-10 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter your email to get instant access to the free kit.
                  </p>
                  <NewsletterSignup />
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>
      </section>


      {/* 13. Closing Section */}
      <section className="relative bg-gray-950 py-24 sm:py-32" data-testid="section-closing">
        <div className="absolute inset-0 bg-spartan-gradient-radial opacity-20 pointer-events-none" />
        <FadeIn>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm font-bold tracking-widest text-red-400 uppercase mb-6">Ready to close the gap?</p>
            <h2 className="text-h2 font-bold text-white mb-6" data-testid="text-closing-title">
              Stop Winging It.
            </h2>
            <p className="text-body-lg text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
              If you are ready to build a system that holds when the week is hard, reach out. No obligation, no pressure. Just an honest conversation about where your team is and what it would take to get it working the way it should.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Button size="lg" asChild className="font-bold shadow-lg touch-manipulation group px-10" data-testid="button-closing-contact">
                <Link href="/contact">
                  <span>Contact Spartan Coaching</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-bold glass border-white/30 touch-manipulation group px-10" data-testid="button-closing-services">
                <Link href="/services">
                  <span>See Services & Pricing</span>
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-bold glass border-white/30 touch-manipulation group px-10" data-testid="button-closing-manifesto">
                <Link href="/manifesto">
                  <span>Read the Spartan Ethos</span>
                </Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
