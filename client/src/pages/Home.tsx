import { Link } from "wouter";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DisciplineIcon, EmpathyIcon, StrategyIcon } from "@/components/icons";
import { Shield, Heart, Zap, Target, Users, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { NewsletterSignup } from "@/components/NewsletterSignup";

export default function Home() {

  return (
    <div className="flex flex-col">
      {/* Hero Section - Enhanced with video background */}
      <section className="relative min-h-[40vh] sm:min-h-[55vh] md:h-[92vh] flex items-center justify-center overflow-hidden bg-gray-950">
        {/* Enhanced gradient background with radial accents */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black"></div>
          <div className="absolute inset-0 bg-spartan-gradient-radial opacity-40"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-red-950/20 via-transparent to-transparent blur-3xl"></div>
        </div>

        {/* Hero Video Background - Optimized for mobile */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover hero-video-mobile z-[1]"
          data-testid="hero-video"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Overlay for text readability - slightly darker on mobile for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/35 to-black/50 md:from-black/40 md:via-black/30 md:to-black/40 z-[2]"></div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span>AI-Enhanced Hospice Sales Training</span>
          </div>

          <h1 className="text-hero mb-4 sm:mb-6 md:mb-8 animate-fade-in-up px-4">
            <span className="block bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent font-black tracking-tighter drop-shadow-2xl">
              Patient Outcomes First.
            </span>
            <span className="block bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent mt-2 font-black tracking-tighter drop-shadow-2xl">
              Elite Reps Always.
            </span>
          </h1>

          <p className="text-body-lg mb-6 sm:mb-10 md:mb-14 max-w-4xl mx-auto animate-fade-in-up px-6" style={{ animationDelay: '0.1s' }}>
            <span className="text-white/90">This is the 'why' of Spartan Coaching. We exist to transform hospice sales from a transaction into a mission: ensuring every eligible patient receives the compassionate care they deserve.</span>
            <span className="block mt-3 sm:mt-4 bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-transparent font-bold">We build expert sales leaders who serve with integrity and lead with empathy.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center animate-fade-in-up px-6 max-w-2xl mx-auto" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="lg" 
              asChild 
              className="text-base sm:text-lg px-8 sm:px-10 md:px-12 py-6 sm:py-7 md:py-8 font-bold shadow-xl glow-primary-hover transition-elegant min-h-[56px] sm:min-h-[60px] touch-manipulation group"
              data-testid="button-view-services"
            >
              <Link href="/services">
                <span>View Services</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="text-base sm:text-lg px-8 sm:px-10 md:px-12 py-6 sm:py-7 md:py-8 font-bold glass border-white/30 hover:bg-white/20 hover:border-white/40 transition-elegant min-h-[56px] sm:min-h-[60px] touch-manipulation group"
              data-testid="button-why-spartan"
            >
              <Link href="/about">
                <span>Why Spartan Exists</span>
                <Heart className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>
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

      {/* Value Pillars - Enhanced with better visuals */}
      <section className="max-w-7xl mx-auto spacing-container spacing-section">
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-h2 text-gradient-elegant mb-6">
            The Three Pillars
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
            The foundation of the Spartan Method—where philosophy meets practice
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-cards">
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
        </div>
      </section>

      {/* Services Preview - Enhanced engagement */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950 spacing-section">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.03),transparent_70%)]"></div>

        <div className="relative max-w-7xl mx-auto spacing-container">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-h2 text-gradient-elegant mb-6">
              Transform Your Career
            </h2>
            <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
              Choose the path that fits your goals—from one-on-one coaching to comprehensive training
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-cards max-w-5xl mx-auto">
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
                <Button size="lg" asChild className="w-full font-bold shadow-lg min-h-[52px] touch-manipulation group mt-auto" data-testid="button-view-services-preview">
                  <Link href="/services">
                    <span>View Services</span>
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </Card>

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
                <Button size="lg" asChild className="w-full font-bold shadow-lg min-h-[52px] touch-manipulation group mt-auto" data-testid="button-explore-programs-preview">
                  <Link href="/programs">
                    <span>Explore Programs</span>
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Philosophy Section - Enhanced */}
      <section className="relative bg-gradient-to-br from-accent/40 via-accent/20 to-accent/40 spacing-section">
        <div className="w-full max-w-7xl mx-auto spacing-container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-lg font-semibold text-primary mb-3" data-testid="text-philosophy-label">Our Philosophy</p>
            <h2 className="text-h2 text-foreground mb-6">
              The Path to Mastery in Hospice Sales
            </h2>
            <p className="text-body-lg text-muted-foreground">
              Success isn't about closing deals. It's about opening doors to comfort, dignity, and peace. This requires more than sales tactics; it demands a disciplined mindset.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-sections">
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
          </div>

          <div className="mt-16 text-center px-4">
            <Button asChild variant="outline" size="lg" className="font-bold text-base sm:text-lg px-6 sm:px-8 py-6 group whitespace-normal sm:whitespace-nowrap min-h-[52px] touch-manipulation">
              <Link href="/method" data-testid="button-learn-more-method">
                <span>Learn More About The Spartan Method</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section - Enhanced */}
      <section className="relative bg-spartan-gradient text-white spacing-section overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.05),transparent_50%)]"></div>

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
      </section>
    </div>
  );
}