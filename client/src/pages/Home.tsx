import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LightbulbIcon, DisciplineIcon, EmpathyIcon, StrategyIcon, SpinnerIcon } from "@/components/icons";
import { LS } from "@/lib/utils";

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
      // Will be connected to AI in integration phase
      const placeholder = "**Discipline Drill:** Review your territory map. Identify the top 3 referral sources you haven't touched in 30 days. Before the day ends, send each one a personalized value message—no ask, just value.";
      setTimeout(() => {
        setDrill(placeholder);
        LS.set("daily_drill", { date: today, drill: placeholder });
        setIsLoading(false);
      }, 500);
    }
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-background via-background to-muted/20">
        <div className="w-full max-w-7xl mx-auto px-6 py-20 md:py-32 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60 leading-tight" data-testid="text-hero-title">
            Patient Outcomes First. <br /> Elite Reps Always.
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed" data-testid="text-hero-subtitle">
            This is the 'why' of Spartan Coaching. We exist to transform hospice sales from a transaction into a mission: ensuring every eligible patient receives the compassionate care they deserve. We build expert sales leaders who serve with integrity and lead with empathy.
          </p>
          <div className="mt-10 flex justify-center gap-4 flex-wrap">
            <Button asChild size="lg" className="font-bold">
              <Link href="/method" data-testid="button-master-method">
                Master The Spartan Method
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold">
              <Link href="/tools" data-testid="button-explore-tools">
                Explore Your AI Field Kit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Daily Drill Card */}
      <div className="w-full max-w-7xl mx-auto px-6 py-12">
        <Card className="bg-gradient-to-br from-primary to-destructive text-primary-foreground shadow-lg" data-testid="card-daily-drill">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <LightbulbIcon />
            Today's Spartan Drill
          </h3>
          <div className="mt-4 min-h-[6rem] flex items-center">
            {isLoading ? (
              <div className="w-full flex justify-center">
                <SpinnerIcon className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <p className="text-lg font-medium" data-testid="text-daily-drill">{drill}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Philosophy Section */}
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

          {/* Three Pillars */}
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
