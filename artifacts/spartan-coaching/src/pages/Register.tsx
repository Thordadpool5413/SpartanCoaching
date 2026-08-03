import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2 } from "lucide-react";

export default function Register() {
  const { login, isAuthenticated, canUseFieldKit, isLoading, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [noPhi, setNoPhi] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !pending) {
      setLocation(canUseFieldKit ? "/portal" : "/account");
    }
  }, [isLoading, isAuthenticated, canUseFieldKit, setLocation, pending]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms || !noPhi) {
      toast({
        title: "Please confirm",
        description: "Accept the terms and the no-PHI commitment to continue.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Use at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          acceptTerms: true,
          noPhi: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "ACCOUNT_EXISTS") {
          toast({
            title: "Email already in use",
            description: "Sign in with that email, or use Forgot password to reset it.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error || "Registration failed");
      }

      // Account created + session cookie set — Day Zero ceremony on Account
      await refresh();
      toast({
        title: "Account created",
        description: "Next: subscribe to unlock live tools — $14.99/week, cancel anytime.",
      });
      setLocation("/account?welcome=1");
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="min-h-[70vh] flex items-center justify-center px-4 py-16 surface-page"
      data-testid="page-register"
    >
      <SEO />
      <Card className="w-full max-w-md border border-border bg-card p-8 sm:p-10 space-y-6 shadow-elite">
        <div className="text-center space-y-3">
          <img
            src="/spartan-logo-stamp.png"
            alt=""
            className="h-12 w-12 mx-auto object-contain"
            width={48}
            height={48}
          />
          <p className="text-kicker justify-center">Path A · Individual membership</p>
          <h1 className="text-2xl font-display font-black text-foreground tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Then subscribe for{" "}
            <strong className="text-foreground">$14.99/week</strong> to unlock live tools. Cancel
            anytime.{" "}
            <Link href="/request-access" className="font-semibold text-primary hover:underline">
              Need team access instead?
            </Link>
          </p>
        </div>

        {/* Quick value reminder */}
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 space-y-1.5">
          {[
            "Objection Handler, Playbook Generator, Role-Play Practice",
            "Weekly Plan Builder & Sales Command Center",
            "Activity, ROI & Rep Cost Calculators — 13 tools total",
          ].map((line) => (
            <div key={line} className="flex gap-2 items-start">
              <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{line}</p>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-name">Full name</Label>
            <Input
              id="reg-name"
              autoComplete="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              data-testid="input-register-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@hospice.com"
              data-testid="input-register-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Password</Label>
            <Input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ characters"
              data-testid="input-register-password"
            />
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <Checkbox
                checked={acceptTerms}
                onCheckedChange={(v) => setAcceptTerms(v === true)}
                data-testid="check-register-terms"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <Checkbox
                checked={noPhi}
                onCheckedChange={(v) => setNoPhi(v === true)}
                data-testid="check-register-nophi"
              />
              <span>
                I will not enter protected health information (PHI) into membership tools.
              </span>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full font-bold"
            size="lg"
            disabled={pending}
            data-testid="button-register-submit"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline"
              data-testid="link-register-login"
            >
              Sign in
            </Link>
          </p>
          <p className="text-xs leading-relaxed">
            Setting up{" "}
            <strong className="text-foreground">team or company seats</strong>?{" "}
            <Link href="/request-access" className="text-primary hover:underline">
              Request team access
            </Link>{" "}
            — contracts and multi-seat pricing are handled separately.
          </p>
        </div>
      </Card>
    </div>
  );
}
