import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DisciplineIcon, EmpathyIcon, StrategyIcon } from "@/components/icons";
import { Shield, Heart, Zap, Target, Users, BookOpen, ArrowRight, Sparkles, TrendingUp, Award, Clock, Lightbulb, MessageCircle, Search, Mail, Flame, Stethoscope, Brain, Briefcase } from "lucide-react";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { SEO } from "@/components/SEO";
import { apiRequest } from "@/lib/queryClient";
import { MarkdownContent } from "@/components/MarkdownContent";
import { AnimatedCounter, FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@/components/animations";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [askQuery, setAskQuery] = useState("");
  const [askResponse, setAskResponse] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

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
          // Ensure video is muted
          videoRef.current.muted = true;
          videoRef.current.volume = 0;
          
          // Attempt to play
          const playPromise = videoRef.current.play();
          
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (error) {
          // If autoplay fails, try again on user interaction
          attemptPlayHandler = async () => {
            try {
              if (videoRef.current) {
                videoRef.current.muted = true;
                await videoRef.current.play();
                // Remove listeners after successful play
                if (attemptPlayHandler) {
                  document.removeEventListener('click', attemptPlayHandler);
                  document.removeEventListener('touchstart', attemptPlayHandler);
                  document.removeEventListener('scroll', attemptPlayHandler);
                }
              }
            } catch (err) {
              // Silently fail
            }
          };

          // Try to play on any user interaction
          document.addEventListener('click', attemptPlayHandler, { once: true });
          document.addEventListener('touchstart', attemptPlayHandler, { once: true });
          document.addEventListener('scroll', attemptPlayHandler, { once: true });
        }
      }
    };

    // Try to play immediately
    playVideo();

    // Also try after a short delay (sometimes helps with browser policies)
    const timeoutId = setTimeout(playVideo, 100);

    return () => {
      clearTimeout(timeoutId);
      // Clean up interaction listeners if component unmounts
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
      {/* Hero Section - Enhanced with video background */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] md:h-[92vh] flex items-center justify-center overflow-hidden bg-gray-950">
        {/* Enhanced gradient background with radial accents */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black"></div>
          <div className="absolute inset-0 bg-spartan-gradient-radial opacity-40"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-red-950/20 via-transparent to-transparent blur-3xl"></div>
        </div>

        {/* Hero Video Background - Optimized for mobile */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover hero-video-mobile z-[1]"
          data-testid="hero-video"
          style={{ pointerEvents: 'none' }}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Overlay for text readability - slightly darker on mobile for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/35 to-black/50 md:from-black/40 md:via-black/30 md:to-black/40 z-[2]"></div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-24 text-center">
          <h1 className="text-hero mb-4 sm:mb-6 md:mb-8 animate-fade-in-up px-4">
            <span className="block bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent font-black tracking-tighter drop-shadow-2xl">
              The Authority in Hospice Excellence.
            </span>
            <span className="block bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent mt-2 font-black tracking-tighter drop-shadow-2xl">
              AI-Powered. Expert-Driven.
            </span>
          </h1>

          <p className="text-body-lg mb-6 sm:mb-10 md:mb-14 max-w-4xl mx-auto animate-fade-in-up px-6" style={{ animationDelay: '0.1s' }}>
            <span className="text-white/90">Spartan Coaching is the definitive platform for hospice expertise — from clinical sales mastery and strategic consulting to AI-powered intelligence tools. We equip hospice professionals with everything they need to get eligible patients into care earlier.</span>
            <span className="block mt-3 sm:mt-4 bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-transparent font-bold">Sales. Clinical. Consulting. AI Intelligence — All in one platform.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center animate-fade-in-up px-6 max-w-2xl mx-auto" style={{ animationDelay: '0.4s' }}>
            <Button
              size="lg"
              asChild
              className="text-base sm:text-lg font-bold shadow-xl transition-elegant touch-manipulation group px-10 py-4"
              data-testid="button-explore-platform"
            >
              <Link href="/tools">
                <span>Explore Our Platform</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('ask-spartan')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-base sm:text-lg font-bold glass border-white/30 transition-elegant touch-manipulation group px-10 py-4"
              data-testid="button-ask-spartan-hero"
            >
              <span>Ask Spartan AI</span>
              <Sparkles className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-3 rounded-full bg-white/50"></div>
          </div>
        </div>
      </section>

      {/* Ask Spartan AI Section */}
      <section id="ask-spartan" className="relative bg-gradient-to-br from-background via-background to-accent/5 spacing-section" data-testid="section-ask-spartan">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.08),transparent_50%)] pointer-events-none"></div>

        <div className="relative max-w-4xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                <h2 className="text-h2 text-gradient-elegant">Ask Spartan AI</h2>
              </div>
              <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
                Get instant expert answers on any hospice topic — sales strategies, clinical eligibility, regulations, territory planning, and more
              </p>
            </div>
          </FadeIn>

          <div className="mb-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskSubmit(askQuery);
              }}
              className="flex items-center gap-2"
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
                className="font-bold px-6"
                data-testid="button-ask-submit"
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
                  <span className="text-muted-foreground font-medium">Spartan AI is thinking...</span>
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

      {/* Social Proof Section - Key Statistics and Testimonial */}
      <section className="relative bg-gradient-to-br from-background via-background to-accent/5 spacing-section" data-testid="section-social-proof">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.08),transparent_50%)] pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto spacing-container">
          {/* Statistics Grid */}
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-16 sm:mb-20">
            <StaggerItem>
              <div 
                data-testid="stat-referral-increase"
                className="text-center p-6 sm:p-8 rounded-lg"
              >
                <div className="flex justify-center mb-4 sm:mb-5">
                  <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent mb-2">
                  <AnimatedCounter target={300} suffix="%" />
                </div>
                <div className="text-sm sm:text-base text-muted-foreground font-medium">
                  Referral Increase
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div 
                data-testid="stat-discharge-rate"
                className="text-center p-6 sm:p-8 rounded-lg"
              >
                <div className="flex justify-center mb-4 sm:mb-5">
                  <Award className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent mb-2">
                  <AnimatedCounter target={84} suffix="%" />
                </div>
                <div className="text-sm sm:text-base text-muted-foreground font-medium">
                  On-Time Discharge Rate
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div 
                data-testid="stat-reps-trained"
                className="text-center p-6 sm:p-8 rounded-lg"
              >
                <div className="flex justify-center mb-4 sm:mb-5">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent mb-2">
                  <AnimatedCounter target={500} suffix="+" />
                </div>
                <div className="text-sm sm:text-base text-muted-foreground font-medium">
                  Reps Trained
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div 
                data-testid="stat-years-experience"
                className="text-center p-6 sm:p-8 rounded-lg"
              >
                <div className="flex justify-center mb-4 sm:mb-5">
                  <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent mb-2">
                  <AnimatedCounter target={15} suffix="+" />
                </div>
                <div className="text-sm sm:text-base text-muted-foreground font-medium">
                  Years Experience
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* Testimonial Quote */}
          <SlideUp className="max-w-3xl mx-auto">
            <Card className="border-2 spacing-card shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="relative pt-8 sm:pt-10 px-6 sm:px-8 pb-8 sm:pb-10">
                <div className="text-center">
                  <div className="inline-flex mb-6 text-red-600/30">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-4.716-5-7-5-1.657 0-3 1.343-3 3v13c0 1.657 1.343 3 3 3z" />
                      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-4.716-5-7-5-1.657 0-3 1.343-3 3v13c0 1.657 1.343 3 3 3z" />
                    </svg>
                  </div>
                  <p className="text-body-lg text-foreground leading-relaxed mb-6 italic" data-testid="text-testimonial-quote">
                    "Spartan Coaching transformed how our team approaches hospice sales. The results speak for themselves — we saw a 300% increase in referrals within the first quarter."
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground font-medium">
                    — Director of Business Development, Regional Hospice Provider
                  </p>
                </div>
              </CardContent>
            </Card>
          </SlideUp>
        </div>
      </section>

      {/* AI-Powered Hospice Intelligence Showcase */}
      <section className="relative bg-gradient-to-br from-background via-background to-accent/5 spacing-section" data-testid="section-ai-tools">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.05),transparent_60%)] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-h2 text-gradient-elegant mb-6" data-testid="text-ai-tools-title">
                AI-Powered Hospice Intelligence
              </h2>
              <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
                Every tool a hospice professional needs — powered by advanced AI trained on real-world hospice expertise
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 gap-cards">
            <StaggerItem>
              <Card className="card-lift border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-playbooks">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <Lightbulb className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Sales Playbook Generator</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Generate custom sales playbooks for any scenario, facility type, or objection pattern
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
              <Card className="card-lift border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-objections">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Objection Handler</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    AI-crafted responses to the toughest hospice objections with empathy and clinical precision
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
              <Card className="card-lift border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-research">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <Search className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Territory Research</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Deep-dive research on facilities, demographics, and market opportunities in your territory
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
              <Card className="card-lift border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-email-templates">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Email Templates</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Professional follow-up emails, thank you notes, and value-add messages that build referral relationships
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
              <Card className="card-lift border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-role-play">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Role-Play Practice</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Practice real sales conversations with AI playing the role of physicians, nurses, and administrators
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
              <Card className="card-lift border-2 group relative spacing-card shadow-lg flex flex-col h-full" data-testid="card-tool-drills">
                <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-all duration-500">
                    <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-h3 text-center mb-3">Daily Coaching Drills</CardTitle>
                  <p className="text-body text-muted-foreground text-center leading-relaxed mb-6 flex-1">
                    Daily exercises to sharpen objection handling, territory planning, and clinical knowledge
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
          </StaggerContainer>
        </div>
      </section>

      {/* Value Pillars - Enhanced with better visuals */}
      <section className="max-w-7xl mx-auto spacing-container spacing-section">
        <FadeIn>
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-h2 text-gradient-elegant mb-6">
              The Three Pillars
            </h2>
            <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
              The foundation of the Spartan Method—where philosophy meets practice
            </p>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-cards">
          <StaggerItem>
          <Card className="text-center card-lift border-2 group cursor-pointer relative spacing-card shadow-lg" data-testid="card-pillar-discipline">
            <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="absolute inset-0 bg-spartan-gradient-radial opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-spartan-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-xl group-hover:glow-primary group-hover:scale-110 transition-all duration-500">
                <DisciplineIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <CardTitle className="text-h3 mb-4">Discipline</CardTitle>
              <p className="text-body text-muted-foreground leading-relaxed">
                Build unwavering commitment to your craft through consistent action and accountability.
              </p>
            </div>
          </Card>
          </StaggerItem>

          <StaggerItem>
          <Card className="text-center card-lift border-2 group cursor-pointer relative spacing-card shadow-lg sm:col-span-2 md:col-span-1" data-testid="card-pillar-empathy">
            <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="absolute inset-0 bg-spartan-gradient-radial opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-spartan-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-xl group-hover:glow-primary group-hover:scale-110 transition-all duration-500">
                <EmpathyIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <CardTitle className="text-h3 mb-4">Empathy</CardTitle>
              <p className="text-body text-muted-foreground leading-relaxed">
                Connect authentically with healthcare providers and truly understand their needs.
              </p>
            </div>
          </Card>
          </StaggerItem>

          <StaggerItem>
          <Card className="text-center card-lift border-2 group cursor-pointer relative spacing-card shadow-lg sm:col-span-2 md:col-span-1" data-testid="card-pillar-strategy">
            <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="absolute inset-0 bg-spartan-gradient-radial opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-spartan-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-xl group-hover:glow-primary group-hover:scale-110 transition-all duration-500">
                <StrategyIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <CardTitle className="text-h3 mb-4">Strategy</CardTitle>
              <p className="text-body text-muted-foreground leading-relaxed">
                Execute with precision using proven frameworks that drive measurable results.
              </p>
            </div>
          </Card>
          </StaggerItem>
        </StaggerContainer>
      </section>
      {/* Services Preview - Enhanced engagement */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950 spacing-section">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.03),transparent_70%)]"></div>

        <div className="relative max-w-7xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-h2 text-gradient-elegant mb-6">
                Transform Your Career
              </h2>
              <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
                Choose the path that fits your goals—from one-on-one coaching to comprehensive training
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-cards max-w-5xl mx-auto">
            <StaggerItem>
            <Card className="card-lift border-2 group relative spacing-card shadow-lg flex flex-col" data-testid="card-services-preview">
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl"></div>

              <div className="relative flex-1 flex flex-col">
                <div className="flex flex-col items-center gap-4 mb-6 justify-center">
                  <div className="p-4 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Users className="w-10 h-10 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-h2 text-center">Coaching Services</CardTitle>
                </div>
                <p className="text-center text-muted-foreground text-body mb-8 leading-relaxed">
                  One-on-one coaching tailored to your unique challenges in healthcare sales.
                </p>
                <Button size="lg" asChild className="w-full font-bold shadow-lg touch-manipulation group mt-auto" data-testid="button-view-services-preview">
                  <Link href="/services">
                    <span>View Services</span>
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </Card>
            </StaggerItem>

            <StaggerItem>
            <Card className="card-lift border-2 group relative spacing-card shadow-lg flex flex-col" data-testid="card-programs-preview">
              <div className="absolute inset-0 bg-spartan-gradient-subtle opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl"></div>

              <div className="relative flex-1 flex flex-col">
                <div className="flex flex-col items-center gap-4 mb-6 justify-center">
                  <div className="p-4 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <BookOpen className="w-10 h-10 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-h2 text-center">Training Programs</CardTitle>
                </div>
                <p className="text-center text-muted-foreground text-body mb-8 leading-relaxed">
                  Structured programs designed to build lasting skills and habits.
                </p>
                <Button size="lg" asChild className="w-full font-bold shadow-lg touch-manipulation group mt-auto" data-testid="button-explore-programs-preview">
                  <Link href="/programs">
                    <span>Explore Programs</span>
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>
      {/* Philosophy Section - Enhanced */}
      <section className="relative bg-gradient-to-br from-accent/40 via-accent/20 to-accent/40 spacing-section">
        <div className="w-full max-w-7xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-lg font-semibold text-primary mb-3" data-testid="text-philosophy-label">Our Philosophy</p>
              <h2 className="text-h2 text-foreground mb-6">
                The Path to Mastery in Hospice Sales
              </h2>
              <p className="text-body-lg text-muted-foreground">Success isn't measured in total referrals. It's about opening doors to comfort, dignity, and peace. This requires more than sales tactics; it demands a disciplined mindset.</p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-sections">
            <StaggerItem>
            <div className="text-center group">
              <div className="flex justify-center mb-6" data-testid="icon-discipline">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  <DisciplineIcon className="w-16 h-16 text-primary" />
                </div>
              </div>
              <h4 className="text-h3 text-foreground mb-3">Discipline</h4>
              <p className="text-body text-muted-foreground">
                Mastery demands structure. We provide a proven framework for everything from territory planning to handling complex objections, enabling consistent, high-impact performance.
              </p>
            </div>
            </StaggerItem>

            <StaggerItem>
            <div className="text-center group">
              <div className="flex justify-center mb-6" data-testid="icon-empathy">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  <EmpathyIcon className="w-16 h-16 text-primary" />
                </div>
              </div>
              <h4 className="text-h3 text-foreground mb-3">Empathy</h4>
              <p className="text-body text-muted-foreground">
                Connect on a human level. We teach you to listen with intent, understand the unspoken needs of providers and families, and build trust that transcends the sale.
              </p>
            </div>
            </StaggerItem>

            <StaggerItem>
            <div className="text-center group">
              <div className="flex justify-center mb-6" data-testid="icon-strategy">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  <StrategyIcon className="w-16 h-16 text-primary" />
                </div>
              </div>
              <h4 className="text-h3 text-foreground mb-3">Strategy</h4>
              <p className="text-body text-muted-foreground">
                Act with purpose. Leverage data, market insights, and AI-powered tools to identify the right partners and focus your energy where it matters most: on the patients who need you.
              </p>
            </div>
            </StaggerItem>
          </StaggerContainer>

          <FadeIn>
          <div className="mt-16 text-center px-4">
            <Button asChild variant="outline" size="lg" className="font-bold text-base sm:text-lg px-6 sm:px-8 py-3 group whitespace-normal sm:whitespace-nowrap touch-manipulation">
              <Link href="/method" data-testid="button-learn-more-method">
                <span>Learn More About The Spartan Method</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </Link>
            </Button>
          </div>
          </FadeIn>
        </div>
      </section>
      {/* Why Spartan Credibility Section */}
      <section className="relative bg-gradient-to-br from-background via-background to-accent/5 spacing-section" data-testid="section-why-spartan">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.06),transparent_50%)] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-20">
              <p className="text-lg font-semibold text-primary mb-3" data-testid="text-why-spartan-label">The Spartan Difference</p>
              <h2 className="text-h2 text-foreground mb-6" data-testid="text-why-spartan-title">
                The Most Comprehensive Hospice Expertise Platform
              </h2>
              <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
                No other platform combines deep hospice industry knowledge with AI-powered tools, hands-on coaching, and clinical sales training
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
                  <CardTitle className="text-h3 mb-3">Hospice Sales Mastery</CardTitle>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    15+ years of real-world hospice sales experience distilled into actionable frameworks. Territory management, referral development, and relationship building with physicians, discharge planners, and facility administrators.
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
                  <CardTitle className="text-h3 mb-3">Clinical Knowledge</CardTitle>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    Deep understanding of hospice eligibility criteria, clinical indicators, Medicare guidelines, and the medical terminology that builds credibility with clinical staff.
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
                  <CardTitle className="text-h3 mb-3">Strategic Consulting</CardTitle>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    Organizational strategy for hospice providers — from market analysis and competitive positioning to team structure and growth planning.
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
                  <CardTitle className="text-h3 mb-3">AI Intelligence</CardTitle>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    Cutting-edge AI trained on hospice-specific knowledge. Every tool understands the nuances of hospice regulations, clinical scenarios, and sales dynamics.
                  </p>
                </div>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Newsletter Section - Enhanced */}
      <section className="relative bg-spartan-gradient text-white spacing-section overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.05),transparent_50%)]"></div>

        <FadeIn>
        <div className="relative max-w-4xl mx-auto spacing-container text-center">
          <h2 className="text-h2 mb-6">
            Weekly Coaching Tips
          </h2>
          <p className="text-body-lg mb-10 text-red-100 max-w-2xl mx-auto">
            Get proven hospice sales strategies, objection handlers, and territory planning tips delivered to your inbox every week.
          </p>
          <div className="flex justify-center">
            <NewsletterSignup />
          </div>
        </div>
        </FadeIn>
      </section>
    </div>
  );
}