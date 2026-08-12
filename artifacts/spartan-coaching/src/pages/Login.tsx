import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isWorkspacePath, normalizePath } from "@/lib/workspaceShell";

function safeNextPath(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const path = normalizePath(decoded.split("?")[0] || decoded);
    // Only allow same-origin relative workspace/account deep links
    if (!path.startsWith("/") || path.startsWith("//")) return null;
    if (path.startsWith("/login")) return null;
    if (isWorkspacePath(path) || path === "/account" || path.startsWith("/account/")) {
      return path;
    }
    return null;
  } catch {
    return null;
  }
}

export default function Login() {
  const { login, isAuthenticated, canUseFieldKit, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const nextPath = useMemo(() => {
    if (typeof window === "undefined") return null;
    return safeNextPath(new URLSearchParams(window.location.search).get("next"));
  }, []);

  const postLoginPath = (allowed: boolean) =>
    nextPath || (allowed ? "/portal" : "/account");

  useEffect(() => {
    if (!isLoading && isAuthenticated && !pending) {
      setLocation(postLoginPath(canUseFieldKit));
    }
  }, [isLoading, isAuthenticated, canUseFieldKit, setLocation, pending, nextPath]);

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
      setLocation(postLoginPath(!!session.fieldKit?.allowed));
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
    <div className="min-h-[70vh] sm:min-h-[75vh] flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16 surface-page" data-testid="page-login">
      <SEO />
      <Card className="w-full max-w-md border border-border bg-card p-6 sm:p-8 lg:p-10 space-y-6 shadow-elite">
        <div className="text-center space-y-3">
          <img
            src="/spartan-logo-stamp.png"
            alt=""
            className="h-12 w-12 mx-auto object-contain"
            width={48}
            height={48}
          />
          <p className="text-kicker justify-center">Client access</p>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tight">
            Sign in
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Members: use the email and password from your set-password email.
            Need an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              Create one
            </Link>
            {" · "}
            <Link href="/request-access" className="font-semibold text-primary hover:underline">
              Team access
            </Link>
          </p>
        </div>

        <div className="flex gap-1 p-1 rounded-lg bg-muted/40" role="tablist" aria-label="Sign-in method">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "password"}
            className={`flex-1 min-h-11 py-2.5 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === "password" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setMode("password")}
          >
            Password
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "magic"}
            className={`flex-1 min-h-11 py-2.5 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === "magic" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
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
            <Button type="submit" className="w-full font-bold min-h-11" disabled={pending} data-testid="button-login-submit">
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
            New individual subscriber?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline" data-testid="link-login-register">
              Create account
            </Link>
          </p>
          <p>
            Team or company seats?{" "}
            <Link href="/request-access" className="text-primary font-semibold hover:underline" data-testid="link-login-request">
              Request team access
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
