import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function SetPassword() {
  const token =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token") || ""
      : "";
  const { setSessionFromResponse } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (!acceptTerms) {
      toast({ title: "Please accept the terms", variant: "destructive" });
      return;
    }
    if (!token) {
      toast({ title: "Missing token", description: "Open the link from your email.", variant: "destructive" });
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, acceptTerms: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to set password");
      setSessionFromResponse({
        member: data.member,
        organization: data.organization,
        fieldKit: data.fieldKit,
      });
      toast({
        title: "Welcome to the Portal",
        description: "Next: pick your role, run one real tool, then book a debrief.",
      });
      setLocation("/portal");
    } catch (err: any) {
      toast({ title: "Could not set password", description: err?.message, variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16" data-testid="page-set-password">
      <SEO />
      <Card className="w-full max-w-md border border-border bg-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Secure setup</p>
          <h1 className="text-2xl font-display font-black">Set your password</h1>
          <p className="text-sm text-muted-foreground">
            Create a password to enter your membership portal. After this you will land on a short first-session
            path: role → one real tool → debrief.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password (min 8 characters)</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-set-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              data-testid="input-set-password-confirm"
            />
          </div>
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(v === true)} />
            <span>
              I agree to the <Link href="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, and will not enter PHI into tools.
            </span>
          </label>
          <Button type="submit" className="w-full font-bold" disabled={pending || !token} data-testid="button-set-password">
            {pending ? "Saving…" : "Set password & enter"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
