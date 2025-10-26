import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LightbulbIcon, DisciplineIcon, EmpathyIcon, StrategyIcon, SpinnerIcon } from "@/components/icons";
import { Shield, Heart, Zap, Target, Users, BookOpen } from "lucide-react";
import { LS } from "@/lib/utils";

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
      <section className="relative min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-red-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/spartan-hero.jpg')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="mb-12 animate-fade-in">
            <img
              src="/spartan-logo.png"
              alt="Spartan Coaching Logo"
              className="w-40 h-40 mx-auto mb-8 drop-shadow-2xl"
            />
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 text-transparent bg-clip-text animate-fade-in">
            Spartan Coaching
          </h1>
          <p className="text-xl md:text-3xl mb-12 max-w-4xl mx-auto font-light leading-relaxed text-gray-200 animate-fade-in">
            Elite coaching for healthcare sales professionals. Master discipline, empathy, and strategy to transform your career.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in">
            <Button size="lg" asChild className="text-lg px-10 py-7 font-bold shadow-2xl hover:shadow-red-500/50 transition-all">
              <Link href="/services">Explore Coaching Services</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-10 py-7 font-semibold bg-white/5 border-white/40 hover:bg-white/15 backdrop-blur-sm transition-all">
              <Link href="/method">Learn The Method</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Daily Drill Card */}
      <section className="max-w-7xl mx-auto px-6 py-16 -mt-24 relative z-20">
        <Card className="bg-gradient-to-br from-red-600 via-red-600 to-red-700 text-white shadow-2xl border-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10"></div>
          <CardHeader className="relative pb-6">
            <CardTitle className="text-4xl font-black flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <LightbulbIcon className="w-9 h-9" />
              </div>
              Today's Spartan Drill
            </CardTitle>
            <p className="text-red-100 text-lg mt-2 font-medium">Your daily dose of Spartan discipline</p>
          </CardHeader>
          <CardContent className="relative">
            <DailyDrill drill={drill} isLoading={isLoading} />
          </CardContent>
        </Card>
      </section>

      {/* Value Pillars */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 text-transparent bg-clip-text">
            The Three Pillars
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The foundation of the Spartan Method
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-xl hover:scale-105 transition-all duration-300 border-2">
            <CardHeader className="pb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <DisciplineIcon className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold">Discipline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Build unwavering commitment to your craft through consistent action and accountability.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-xl hover:scale-105 transition-all duration-300 border-2">
            <CardHeader className="pb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <EmpathyIcon className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold">Empathy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Connect authentically with healthcare providers and truly understand their needs.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-xl hover:scale-105 transition-all duration-300 border-2">
            <CardHeader className="pb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <StrategyIcon className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold">Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Execute with precision using proven frameworks that drive measurable results.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Services Preview */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 text-transparent bg-clip-text">
              Transform Your Career
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the path that fits your goals
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 overflow-hidden group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative pb-6">
                <div className="flex items-center gap-4 mb-4 justify-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <Users className="w-7 h-7 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-3xl font-bold">Coaching Services</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                  One-on-one coaching tailored to your unique challenges in healthcare sales.
                </p>
                <Button size="lg" asChild className="w-full font-bold shadow-lg">
                  <Link href="/services">View Services</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 overflow-hidden group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative pb-6">
                <div className="flex items-center gap-4 mb-4 justify-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <BookOpen className="w-7 h-7 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-3xl font-bold">Training Programs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                  Structured programs designed to build lasting skills and habits.
                </p>
                <Button size="lg" asChild className="w-full font-bold shadow-lg">
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
    </div>
  );
}