import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LightbulbIcon, DisciplineIcon, EmpathyIcon, StrategyIcon, SpinnerIcon } from "@/components/icons";
import { Shield, Heart, Zap, Target, Users, BookOpen } from "lucide-react";
import { LS } from "@/lib/utils";
import { NewsletterSignup } from "@/components/NewsletterSignup";

// DailyDrill component displays the daily coaching drill
const DailyDrill = ({ drill, isLoading }: { drill: string; isLoading: boolean }) => {
  if (isLoading) {
    return <div className="w-full flex justify-center"><SpinnerIcon className="w-8 h-8 animate-spin" /></div>;
  }
  return <p className="text-lg font-medium" data-testid="text-daily-drill">{drill}</p>;
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
          // Fallback to placeholder if API fails
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
      {/* Hero Section */}
      <section className="relative min-h-[100vh] md:min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-red-950 text-white overflow-hidden mobile-full-height">
        <div className="absolute inset-0 bg-[url('/spartan-hero.jpg')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24 text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 sm:mb-8 leading-[0.95] tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 text-transparent bg-clip-text animate-fade-in">
            Spartan Coaching
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-4 sm:mb-6 max-w-4xl mx-auto font-bold leading-tight text-white animate-fade-in px-4">
            Hospice sales systems that work on Tuesday afternoon.
          </p>
          <p className="text-base sm:text-lg md:text-xl mb-10 sm:mb-12 max-w-3xl mx-auto font-light leading-relaxed text-gray-200 animate-fade-in px-4">
            No motivational speeches. No vague goals. Just practical execution frameworks that close the gap between good intentions and consistent results—so more eligible patients receive care earlier in their journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center animate-fade-in px-4 max-w-2xl mx-auto">
            <Button 
              size="lg" 
              asChild 
              className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 font-bold shadow-2xl hover:shadow-red-500/50 transition-all duration-300 min-h-[56px] sm:min-h-auto touch-manipulation"
              data-testid="button-view-services"
            >
              <Link href="/services">View Services</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 font-semibold bg-white/5 border-white/40 hover:bg-white/15 backdrop-blur-sm transition-all duration-300 min-h-[56px] sm:min-h-auto touch-manipulation"
              data-testid="button-why-spartan"
            >
              <Link href="/about">Why Spartan Exists</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Daily Drill Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 -mt-16 sm:-mt-24 relative z-20">
        <Card className="bg-gradient-to-br from-red-600 via-red-600 to-red-700 text-white shadow-2xl border-0 overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10"></div>
          <CardHeader className="relative pb-4 sm:pb-6">
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                <LightbulbIcon className="w-7 h-7 sm:w-9 sm:h-9" />
              </div>
              <span className="leading-tight">Today's Spartan Drill</span>
            </CardTitle>
            <p className="text-red-100 text-base sm:text-lg mt-2 font-medium">Your daily dose of Spartan discipline</p>
          </CardHeader>
          <CardContent className="relative">
            <DailyDrill drill={drill} isLoading={isLoading} />
          </CardContent>
        </Card>
      </section>

      {/* Value Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-3 sm:mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 text-transparent bg-clip-text px-4">
            The Three Pillars
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            The foundation of the Spartan Method
          </p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <Card className="text-center hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 group cursor-pointer">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:shadow-red-500/50 transition-shadow">
                <DisciplineIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold">Discipline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                Build unwavering commitment to your craft through consistent action and accountability.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 group cursor-pointer">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:shadow-red-500/50 transition-shadow">
                <EmpathyIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold">Empathy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                Connect authentically with healthcare providers and truly understand their needs.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 group cursor-pointer sm:col-span-2 md:col-span-1">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:shadow-red-500/50 transition-shadow">
                <StrategyIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold">Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                Execute with precision using proven frameworks that drive measurable results.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Services Preview */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-3 sm:mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 text-transparent bg-clip-text px-4">
              Transform Your Career
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Choose the path that fits your goals
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <Card className="text-center hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 border-2 overflow-hidden group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-3 sm:mb-4 justify-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold">Coaching Services</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative px-4 sm:px-6">
                <p className="mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed text-muted-foreground">
                  One-on-one coaching tailored to your unique challenges in healthcare sales.
                </p>
                <Button size="lg" asChild className="w-full font-bold shadow-lg min-h-[48px] touch-manipulation">
                  <Link href="/services">View Services</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 border-2 overflow-hidden group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-3 sm:mb-4 justify-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold">Training Programs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative px-4 sm:px-6">
                <p className="mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed text-muted-foreground">
                  Structured programs designed to build lasting skills and habits.
                </p>
                <Button size="lg" asChild className="w-full font-bold shadow-lg min-h-[48px] touch-manipulation">
                  <Link href="/programs">Explore Programs</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Philosophy Section - Remains unchanged from original structure, only visual tweaks if any */}
      <div className="bg-accent/50 py-24">
        <div className="w-full max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-primary" data-testid="text-philosophy-label">Our Philosophy</h2>
            <h3 className="mt-2 text-4xl font-black text-foreground">
              The Path to Mastery in Hospice Sales
            </h3>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Success isn't about closing deals. It's about opening doors to comfort, dignity, and peace. This requires more than sales tactics; it demands a disciplined mindset.
            </p>
          </div>

          {/* Three Pillars - This section is visually similar to the Value Pillars above but with different icons */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center" data-testid="icon-discipline">
                <DisciplineIcon className="w-12 h-12 text-primary" />
              </div>
              <h4 className="mt-4 text-2xl font-bold text-foreground">Discipline</h4>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Mastery demands structure. We provide a proven framework for everything from territory planning to handling complex objections, enabling consistent, high-impact performance.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center" data-testid="icon-empathy">
                <EmpathyIcon className="w-12 h-12 text-primary" />
              </div>
              <h4 className="mt-4 text-2xl font-bold text-foreground">Empathy</h4>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Connect on a human level. We teach you to listen with intent, understand the unspoken needs of providers and families, and build trust that transcends the sale.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center" data-testid="icon-strategy">
                <StrategyIcon className="w-12 h-12 text-primary" />
              </div>
              <h4 className="mt-4 text-2xl font-bold text-foreground">Strategy</h4>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Act with purpose. Leverage data, market insights, and AI-powered tools to identify the right partners and focus your energy where it matters most: on the patients who need you.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Button asChild variant="outline" size="lg" className="font-bold">
              <Link href="/method" data-testid="button-learn-more-method">
                Learn More About The Spartan Method
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <section className="bg-gradient-to-br from-red-600 to-red-700 dark:from-red-800 dark:to-red-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Weekly Coaching Tips
          </h2>
          <p className="text-xl mb-8 text-red-100 max-w-2xl mx-auto">
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