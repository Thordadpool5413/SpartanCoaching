import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LightbulbIcon, DisciplineIcon, EmpathyIcon, StrategyIcon, SpinnerIcon } from "@/components/icons";
import { Shield, Heart, Zap, Target, Users, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { LS } from "@/lib/utils";
import { NewsletterSignup } from "@/components/NewsletterSignup";

// DailyDrill component displays the daily coaching drill
const DailyDrill = ({ drill, isLoading }: { drill: string; isLoading: boolean }) => {
  if (isLoading) {
    return <div className="w-full flex justify-center py-8"><SpinnerIcon className="w-10 h-10 animate-spin text-white/80" /></div>;
  }
  return <p className="text-lg sm:text-xl font-medium leading-relaxed" data-testid="text-daily-drill">{drill}</p>;
};


export default function Home() {
  const [drill, setDrill] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const cached = LS.get<{ date: string; drill: string } | null>("daily_drill", null);

    if (cached && cached.date === today) {
      setDrill(cached.drill);
    } else {
      setIsLoading(true);

      fetch("/api/daily-drill")
        .then((res) => res.json())
        .then((data) => {
          setDrill(data.drill);
          LS.set("daily_drill", { date: today, drill: data.drill });
        })
        .catch((error) => {
          console.error("Daily drill error:", error);
          const fallback = "**Discipline Drill:** Review your territory map and identify opportunities to add value today.";
          setDrill(fallback);
          LS.set("daily_drill", { date: today, drill: fallback });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section - Enhanced with dramatic visuals */}
      <section className="relative min-h-[100vh] md:min-h-[92vh] flex items-center justify-center overflow-hidden mobile-full-height">
        {/* Background with animated gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(239,68,68,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(239,68,68,0.1),transparent_50%)]"></div>
        
        {/* Optional hero image with overlay */}
        <div className="absolute inset-0 bg-[url('/spartan-hero.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24 md:py-28 text-center">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span>AI-Enhanced Hospice Sales Training</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-6 sm:mb-8 leading-[0.95] tracking-tight animate-fade-in-up">
            <span className="block bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              Spartan Coaching
            </span>
          </h1>
          
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 sm:mb-6 max-w-5xl mx-auto font-bold leading-tight text-white/95 animate-fade-in-up px-4" style={{ animationDelay: '0.1s' }}>
            Hospice sales systems that work on Tuesday afternoon.
          </p>
          
          <p className="text-lg sm:text-xl md:text-2xl mb-12 sm:mb-14 max-w-3xl mx-auto leading-relaxed text-gray-300 animate-fade-in-up px-4" style={{ animationDelay: '0.2s' }}>
            No motivational speeches. No vague goals. Just practical execution frameworks that close the gap between good intentions and consistent results—so more eligible patients receive care earlier in their journey.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center animate-fade-in-up px-4 max-w-2xl mx-auto" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg" 
              asChild 
              className="text-base sm:text-lg px-10 sm:px-12 py-7 sm:py-8 font-bold shadow-2xl glow-primary-hover transition-elegant min-h-[56px] sm:min-h-auto touch-manipulation group"
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
              className="text-base sm:text-lg px-10 sm:px-12 py-7 sm:py-8 font-semibold glass border-white/30 hover:bg-white/20 hover:border-white/40 transition-elegant min-h-[56px] sm:min-h-auto touch-manipulation group"
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

      {/* Daily Drill Card - Enhanced design */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 -mt-20 sm:-mt-28 relative z-20">
        <Card className="relative bg-gradient-to-br from-red-600 via-red-600 to-red-700 text-white shadow-2xl border-0 overflow-hidden transition-elegant hover:scale-[1.02] hover:shadow-red-500/30 glow-primary">
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl"></div>
          
          <CardHeader className="relative pb-4 sm:pb-6">
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-white/20 rounded-xl backdrop-blur-sm shrink-0 shadow-lg">
                <LightbulbIcon className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div>
                <span className="leading-tight block">Today's Spartan Drill</span>
                <p className="text-red-100 text-sm sm:text-base mt-1 font-normal">Your daily dose of disciplined execution</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <DailyDrill drill={drill} isLoading={isLoading} />
          </CardContent>
        </Card>
      </section>

      {/* Value Pillars - Enhanced with better visuals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24 md:py-32">
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black mb-4 sm:mb-6 text-gradient-elegant px-4">
            The Three Pillars
          </h2>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed">
            The foundation of the Spartan Method—where philosophy meets practice
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <Card className="text-center hover:shadow-2xl transition-elegant border-2 group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="relative pb-6 sm:pb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl group-hover:shadow-red-500/50 group-hover:scale-110 transition-elegant">
                <DisciplineIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <CardTitle className="text-3xl sm:text-4xl font-black">Discipline</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                Build unwavering commitment to your craft through consistent action and accountability.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-2xl transition-elegant border-2 group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="relative pb-6 sm:pb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl group-hover:shadow-red-500/50 group-hover:scale-110 transition-elegant">
                <EmpathyIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <CardTitle className="text-3xl sm:text-4xl font-black">Empathy</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                Connect authentically with healthcare providers and truly understand their needs.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-2xl transition-elegant border-2 group cursor-pointer relative overflow-hidden sm:col-span-2 md:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="relative pb-6 sm:pb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl group-hover:shadow-red-500/50 group-hover:scale-110 transition-elegant">
                <StrategyIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <CardTitle className="text-3xl sm:text-4xl font-black">Strategy</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                Execute with precision using proven frameworks that drive measurable results.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Services Preview - Enhanced engagement */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950 py-20 sm:py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.03),transparent_70%)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-black mb-4 sm:mb-6 text-gradient-elegant px-4">
              Transform Your Career
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed">
              Choose the path that fits your goals—from one-on-one coaching to comprehensive training
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 max-w-5xl mx-auto">
            <Card className="hover:shadow-2xl transition-elegant border-2 overflow-hidden group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-red-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl"></div>
              
              <CardHeader className="relative pb-6 sm:pb-8">
                <div className="flex flex-col items-center gap-4 mb-4 justify-center">
                  <div className="p-4 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-2xl shadow-lg">
                    <Users className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-3xl sm:text-4xl font-black text-center">Coaching Services</CardTitle>
                </div>
                <p className="text-center text-muted-foreground text-lg">
                  One-on-one coaching tailored to your unique challenges in healthcare sales.
                </p>
              </CardHeader>
              <CardContent className="relative px-6 sm:px-8">
                <Button size="lg" asChild className="w-full font-bold shadow-lg min-h-[52px] touch-manipulation group">
                  <Link href="/services">
                    <span>View Services</span>
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-2xl transition-elegant border-2 overflow-hidden group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-red-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl"></div>
              
              <CardHeader className="relative pb-6 sm:pb-8">
                <div className="flex flex-col items-center gap-4 mb-4 justify-center">
                  <div className="p-4 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-2xl shadow-lg">
                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-3xl sm:text-4xl font-black text-center">Training Programs</CardTitle>
                </div>
                <p className="text-center text-muted-foreground text-lg">
                  Structured programs designed to build lasting skills and habits.
                </p>
              </CardHeader>
              <CardContent className="relative px-6 sm:px-8">
                <Button size="lg" asChild className="w-full font-bold shadow-lg min-h-[52px] touch-manipulation group">
                  <Link href="/programs">
                    <span>Explore Programs</span>
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Philosophy Section - Enhanced */}
      <section className="relative bg-gradient-to-br from-accent/40 via-accent/20 to-accent/40 py-24 sm:py-32">
        <div className="w-full max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3" data-testid="text-philosophy-label">Our Philosophy</h2>
            <h3 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-6">
              The Path to Mastery in Hospice Sales
            </h3>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Success isn't about closing deals. It's about opening doors to comfort, dignity, and peace. This requires more than sales tactics; it demands a disciplined mindset.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-12">
            <div className="text-center group">
              <div className="flex justify-center mb-6" data-testid="icon-discipline">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  <DisciplineIcon className="w-14 h-14 sm:w-16 sm:h-16 text-primary" />
                </div>
              </div>
              <h4 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Discipline</h4>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Mastery demands structure. We provide a proven framework for everything from territory planning to handling complex objections, enabling consistent, high-impact performance.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="flex justify-center mb-6" data-testid="icon-empathy">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  <EmpathyIcon className="w-14 h-14 sm:w-16 sm:h-16 text-primary" />
                </div>
              </div>
              <h4 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Empathy</h4>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Connect on a human level. We teach you to listen with intent, understand the unspoken needs of providers and families, and build trust that transcends the sale.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="flex justify-center mb-6" data-testid="icon-strategy">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  <StrategyIcon className="w-14 h-14 sm:w-16 sm:h-16 text-primary" />
                </div>
              </div>
              <h4 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Strategy</h4>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Act with purpose. Leverage data, market insights, and AI-powered tools to identify the right partners and focus your energy where it matters most: on the patients who need you.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center px-4">
            <Button asChild variant="outline" size="lg" className="font-bold text-sm sm:text-base md:text-lg px-6 sm:px-8 py-6 group whitespace-normal sm:whitespace-nowrap">
              <Link href="/method" data-testid="button-learn-more-method">
                <span>Learn More About The Spartan Method</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section - Enhanced */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-600 to-red-700 dark:from-red-800 dark:to-red-900 text-white py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.05),transparent_50%)]"></div>
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6">
            Weekly Coaching Tips
          </h2>
          <p className="text-xl sm:text-2xl mb-10 text-red-100 max-w-2xl mx-auto leading-relaxed">
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
