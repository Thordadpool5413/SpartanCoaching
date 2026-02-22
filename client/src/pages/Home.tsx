import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DisciplineIcon, EmpathyIcon, StrategyIcon } from "@/components/icons";
import { Shield, Heart, Zap, Target, Users, BookOpen, ArrowRight, Sparkles, Lightbulb, MessageCircle, Search, Mail, Flame, Stethoscope, Brain, Briefcase, Phone, CheckCircle, AlertCircle, Quote } from "lucide-react";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { SEO } from "@/components/SEO";
import { apiRequest } from "@/lib/queryClient";
import { MarkdownContent } from "@/components/MarkdownContent";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import { ContactForm } from "@/components/ContactForm";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [askQuery, setAskQuery] = useState("");
  const [askResponse, setAskResponse] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [contactFormOpen, setContactFormOpen] = useState(false);

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

      {/* 1. Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] md:h-[92vh] flex items-center justify-center overflow-hidden bg-gray-950">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black"></div>
          <div className="absolute inset-0 bg-spartan-gradient-radial opacity-40"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-red-950/20 via-transparent to-transparent blur-3xl"></div>
        </div>

        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover hero-video-mobile z-[1]"
          data-testid="hero-video"
          aria-label="Spartan Coaching hero video background"
          style={{ pointerEvents: 'none' }}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/35 to-black/50 md:from-black/40 md:via-black/30 md:to-black/40 z-[2]"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-24 text-center">
          <h1 className="text-hero mb-4 sm:mb-6 md:mb-8 animate-fade-in-up px-4">
            <span className="block bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent font-black tracking-tighter drop-shadow-2xl">
              Practical Coaching for
            </span>
            <span className="block bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent mt-2 font-black tracking-tighter drop-shadow-2xl">
              Hospice Growth Professionals
            </span>
          </h1>

          <p className="text-body-lg mb-6 sm:mb-10 md:mb-14 max-w-4xl mx-auto animate-fade-in-up px-6" style={{ animationDelay: '0.1s' }}>
            <span className="text-white/90">Build consistent referral relationships and execute territory strategy with discipline, ethical messaging, and measurable weekly accountability.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center animate-fade-in-up px-6 max-w-2xl mx-auto" style={{ animationDelay: '0.4s' }}>
            <Button
              size="lg"
              onClick={() => setContactFormOpen(true)}
              className="text-base sm:text-lg font-bold shadow-xl transition-elegant touch-manipulation group px-10 py-4"
              data-testid="button-apply-now-hero"
            >
              <span>Apply Now</span>
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setContactFormOpen(true)}
              className="text-base sm:text-lg font-bold glass border-white/30 transition-elegant touch-manipulation group px-10 py-4"
              data-testid="button-book-consult-hero"
            >
              <span>Book a Consult</span>
              <Phone className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
          </div>

          <div className="mt-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <p className="text-white/70 text-sm font-semibold tracking-wide">
              Hospice-specific. Compliance-aware. Field-tested.
            </p>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-label="Scroll down">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-3 rounded-full bg-white/50"></div>
          </div>
        </div>
      </section>


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

          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-cards max-w-4xl mx-auto">
              <Card className="border-2 spacing-card shadow-lg" data-testid="card-testimonial-1">
                <div className="flex flex-col gap-4">
                  <Quote className="w-8 h-8 text-primary/40" />
                  <p className="text-body text-muted-foreground italic leading-relaxed">
                    "[Testimonial from hospice liaison describing behavior change]"
                  </p>
                </div>
              </Card>
              <Card className="border-2 spacing-card shadow-lg" data-testid="card-testimonial-2">
                <div className="flex flex-col gap-4">
                  <Quote className="w-8 h-8 text-primary/40" />
                  <p className="text-body text-muted-foreground italic leading-relaxed">
                    "[Testimonial from director of business development describing team improvement]"
                  </p>
                </div>
              </Card>
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
                    "Follow-up falls through the cracks every week",
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

          <StaggerContainer className="space-y-4">
            {[
              { title: "Territory and account planning system", desc: "Organize your territory with clarity so every week has a purpose." },
              { title: "Referral source segmentation framework", desc: "Structured approach for hospitals, SNFs, home health, physicians, senior living, and community partners." },
              { title: "Weekly scorecard and accountability rhythm", desc: "Track the behaviors that drive results, not just the results themselves." },
              { title: "Messaging library and education-based outreach scripts", desc: "Scripts organized by referral source type so your outreach is relevant and respectful." },
              { title: "Objection handling scripts", desc: "Patient-centered and accurate responses that keep conversations moving forward." },
              { title: "Follow-up sequences and cadence templates", desc: "Never let a warm relationship go cold because of inconsistent follow-up." },
              { title: "Weekly coaching agenda and pre-work", desc: "Sessions are structured and repeatable so coaching time is never wasted." },
              { title: "Optional AI-enabled planning tools", desc: "For organizing messaging and territory workflow. Do not enter patient identifiers or PHI into any tool." },
            ].map((item, index) => (
              <StaggerItem key={index}>
                <div className="flex items-start gap-4 p-4 rounded-lg" data-testid={`text-deliverable-${index}`}>
                  <CheckCircle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-body font-bold text-foreground">{item.title}</p>
                    <p className="text-body text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn>
            <div className="mt-12 text-center">
              <Button
                size="lg"
                onClick={() => setContactFormOpen(true)}
                className="font-bold shadow-lg touch-manipulation group px-10"
                data-testid="button-apply-now-deliverables"
              >
                <span>Apply Now</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </FadeIn>
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

          <FadeIn>
            <div className="mt-12 text-center">
              <Button
                size="lg"
                onClick={() => setContactFormOpen(true)}
                className="font-bold shadow-lg touch-manipulation group px-10"
                data-testid="button-apply-now-steps"
              >
                <span>Apply Now</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
            {[1, 2, 3].map((num) => (
              <StaggerItem key={num}>
                <Card className="border-2 spacing-card shadow-lg h-full" data-testid={`card-case-study-${num}`}>
                  <div className="flex flex-col gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-body text-muted-foreground italic leading-relaxed">
                      "[Starting point, what changed, and what actions drove improvement]"
                    </p>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-cards max-w-4xl mx-auto mb-12">
              {[1, 2].map((num) => (
                <Card key={num} className="border-2 spacing-card shadow-lg" data-testid={`card-verified-testimonial-${num}`}>
                  <div className="flex flex-col gap-4">
                    <Quote className="w-8 h-8 text-primary/40" />
                    <p className="text-body text-muted-foreground italic leading-relaxed">
                      "[Verified testimonial describing measurable behavior change]"
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </FadeIn>

          <FadeIn>
            <div className="text-center">
              <Button
                size="lg"
                onClick={() => setContactFormOpen(true)}
                className="font-bold shadow-lg touch-manipulation group px-10"
                data-testid="button-apply-now-results"
              >
                <span>Apply Now</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </FadeIn>
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
                Every tool a hospice professional needs, built on 15+ years of real-world hospice expertise
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
                    Expert-crafted responses to the toughest hospice objections with empathy and clinical precision
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
                    Practice real sales conversations in simulated scenarios with physicians, nurses, and administrators
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


      {/* 12. Why Spartan Credibility Section */}
      <section className="relative bg-gradient-to-br from-background via-background to-accent/5 spacing-section" data-testid="section-why-spartan">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.06),transparent_50%)] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto spacing-container">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-20">
              <p className="text-lg font-semibold text-primary mb-3" data-testid="text-why-spartan-label">The Spartan Difference</p>
              <h2 className="text-h2 text-foreground mb-6" data-testid="text-why-spartan-title">
                Why Hospice Organizations Choose Spartan
              </h2>
              <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
                No other consulting firm combines deep hospice industry knowledge with hands-on coaching, clinical sales training, and strategic growth planning
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
                    Organizational strategy for hospice providers, from market analysis and competitive positioning to team structure and growth planning.
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
                  <CardTitle className="text-h3 mb-3">Technology and Innovation</CardTitle>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    Proprietary tools and resources built on hospice-specific knowledge, helping your team access expert guidance on regulations, clinical scenarios, and sales dynamics anytime.
                  </p>
                </div>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>


      {/* 13. Final CTA Section */}
      <section className="relative bg-spartan-gradient text-white spacing-section overflow-hidden" data-testid="section-final-cta">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.05),transparent_50%)]"></div>

        <FadeIn>
          <div className="relative max-w-4xl mx-auto spacing-container text-center">
            <h2 className="text-h2 mb-6" data-testid="text-final-cta-title">
              Stop Guessing. Start Executing.
            </h2>
            <p className="text-body-lg mb-10 text-red-100 max-w-2xl mx-auto">
              If you are ready to build a repeatable system for hospice growth, apply now. No obligation, no pressure. Just an honest conversation about what is not working and what to do about it.
            </p>
            <div className="flex justify-center">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setContactFormOpen(true)}
                className="text-base sm:text-lg font-bold glass border-white/30 transition-elegant touch-manipulation group px-10 py-4"
                data-testid="button-apply-now-final"
              >
                <span>Apply Now</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>

      <ContactForm open={contactFormOpen} onOpenChange={setContactFormOpen} />
    </div>
  );
}
