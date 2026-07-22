import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";

export default function MagicLogin() {
  const { setSessionFromResponse } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("token") || ""
        : "";
    if (!token) {
      setError("Missing sign-in token. Request a new magic link from the login page.");
      setPending(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/magic-login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Sign-in failed");
        setSessionFromResponse({
          member: data.member,
          organization: data.organization,
          fieldKit: data.fieldKit,
        });
        setLocation(data.fieldKit?.allowed ? "/portal" : "/account");
      } catch (err: any) {
        setError(err?.message || "This link is invalid or expired.");
        setPending(false);
      }
    })();
  }, [setLocation, setSessionFromResponse]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <SEO />
      <Card className="w-full max-w-md border border-border bg-card p-8 text-center space-y-4">
        <h1 className="text-2xl font-display font-black">Signing you in…</h1>
        {pending && !error && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
        {error && (
          <>
            <p className="text-sm text-destructive">{error}</p>
            <Button asChild className="font-bold">
              <Link href="/login">Back to login</Link>
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
