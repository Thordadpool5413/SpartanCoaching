import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { markIntroSeen } from "@/lib/intro";
import { ArrowRight, LogIn, KeyRound } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Welcome() {
  const [, setLocation] = useLocation();

  const enter = () => {
    markIntroSeen();
    setLocation("/");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-[#050505] px-6 relative overflow-hidden"
      data-testid="page-welcome"
    >
      <SEO />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(185,28,28,0.12),transparent_55%)] pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full text-center space-y-10">
        <div className="space-y-4">
          <p className="text-xs font-bold tracking-[0.3em] text-red-400 uppercase">
            Spartan Coaching
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Discipline. Empathy.
            <br />
            <span className="text-primary">Strategy.</span>
          </h1>
          <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-md mx-auto">
            Practical coaching and a private Field Kit for hospice growth professionals who execute in the field — not just in meetings.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            className="font-bold px-10"
            onClick={enter}
            data-testid="button-enter-site"
          >
            Enter the site
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="font-bold border-white/25 text-white hover:bg-white/5"
            asChild
            data-testid="button-welcome-login"
          >
            <Link href="/login" onClick={() => markIntroSeen()}>
              <LogIn className="mr-2 w-4 h-4" />
              Client login
            </Link>
          </Button>
        </div>

        <div className="pt-2">
          <Link
            href="/request-access"
            onClick={() => markIntroSeen()}
            className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-red-400 transition-colors"
            data-testid="link-welcome-request"
          >
            <KeyRound className="w-4 h-4" />
            Request Field Kit evaluation access
          </Link>
        </div>

        <p className="text-xs text-white/35 tracking-wide uppercase">
          Hospice-specific · Ethics-first · Built for field execution
        </p>
      </div>
    </div>
  );
}
