import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { login, isAuthenticated, canUseFieldKit, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !pending) {
      setLocation(canUseFieldKit ? "/portal" : "/account");
    }
  }, [isLoading, isAuthenticated, canUseFieldKit, setLocation, pending]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      if (mode === "magic") {
        const res = await fetch("/api/auth/magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Unable to send link");
        setMagicSent(true);
        toast({
          title: "Check your email",
          description: "If an account exists, a sign-in link is on the way.",
        });
        return;
      }

      const session = await login(email.trim(), password);
      toast({ title: "Welcome back", description: "You are signed in." });
      setLocation(session.fieldKit?.allowed ? "/portal" : "/account");
    } catch (err: any) {
      toast({
        title: "Sign in failed",
        description: err?.message || "Check your email and password.",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#060606]" data-testid="page-login">
      <SEO />
      <Card className="w-full max-w-md border border-white/10 dark:bg-[#0c0c0c] p-8 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold tracking-widest text-red-400 uppercase">Client access</p>
          <h1 className="text-2xl font-display font-black text-foreground">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Field Kit clients: use the email and password from your approval / set-password email.
          </p>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-left space-y-1">
          <p className="font-bold text-foreground">Site owner / admin?</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Do <strong className="text-foreground">not</strong> use this Client Login screen first.
            Go to{" "}
            <Link href="/admin/access-desk" className="text-primary font-semibold hover:underline">
              Admin unlock
            </Link>{" "}
            and enter passcode <strong className="text-foreground">5413</strong> only (no username).
          </p>
        </div>

        <div className="flex gap-2 p-1 rounded-lg bg-muted/40">
          <button
            type="button"
            className={`flex-1 py-2 rounded-md text-sm font-semibold ${mode === "password" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => setMode("password")}
          >
            Password
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-md text-sm font-semibold ${mode === "magic" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => setMode("magic")}
          >
            Email link
          </button>
        </div>

        {magicSent && mode === "magic" ? (
          <div className="text-center space-y-3 text-sm text-muted-foreground">
            <p>If an account exists for <strong className="text-foreground">{email}</strong>, open the link in that email within one hour.</p>
            <Button variant="outline" className="font-bold" onClick={() => setMagicSent(false)}>
              Send another link
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-login-email"
              />
            </div>
            {mode === "password" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline" data-testid="link-forgot-password">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-login-password"
                />
              </div>
            )}
            <Button type="submit" className="w-full font-bold" disabled={pending} data-testid="button-login-submit">
              {pending
                ? mode === "magic"
                  ? "Sending…"
                  : "Signing in…"
                : mode === "magic"
                  ? "Email me a sign-in link"
                  : "Sign in"}
            </Button>
          </form>
        )}

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            <Link href="/admin/access-desk" className="text-primary font-semibold hover:underline">
              Admin unlock (passcode)
            </Link>
          </p>
          <p>
            Need access?{" "}
            <Link href="/request-access" className="text-primary font-semibold hover:underline" data-testid="link-login-request">
              Request evaluation access
            </Link>
          </p>
          <p>
            Prefer a conversation?{" "}
            <Link href="/contact" className="text-primary font-semibold hover:underline">
              Book a strategy call
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
