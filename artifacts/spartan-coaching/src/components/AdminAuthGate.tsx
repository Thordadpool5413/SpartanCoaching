import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Loader2, Shield } from "lucide-react";
import {
  adminFetch,
  adminGet,
  markAdminSession,
  clearAdminSessionFlag,
  hasAdminSessionFlag,
} from "@/lib/adminApi";

type Props = {
  children: ReactNode;
  title?: string;
  headerExtra?: ReactNode;
};

/**
 * Full admin unlock with passcode (default server-side: 5413).
 * Creates platform admin session automatically — Access Desk + full CMS.
 */
export function AdminAuthGate({
  children,
  title = "Admin",
  headerExtra,
}: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  const [authPending, setAuthPending] = useState(false);
  const [checking, setChecking] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { credentials: "include" }).then(
          async (r) => (r.ok ? r.json() : null),
        );
        if (me?.member?.role === "platform_admin") {
          if (!cancelled) {
            setIsAuthenticated(true);
            setShowPasswordDialog(false);
            setChecking(false);
          }
          return;
        }
      } catch {
        /* ignore */
      }

      if (hasAdminSessionFlag() && !cancelled) {
        try {
          await adminGet("/api/admin/access-metrics");
          if (!cancelled) {
            setIsAuthenticated(true);
            setShowPasswordDialog(false);
          }
        } catch {
          clearAdminSessionFlag();
        }
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthPending(true);
    try {
      // Single passcode unlock — server auto-creates platform admin if needed
      const data = await adminFetch<{
        loginHint?: { email?: string; note?: string };
        created?: boolean;
      }>("/api/admin/legacy-login", {
        method: "POST",
        body: JSON.stringify({ password: passwordInput }),
      });
      markAdminSession();
      setIsAuthenticated(true);
      setShowPasswordDialog(false);
      const email = data?.loginHint?.email || "nick@spartanhospicecoaching.com";
      toast({
        title: "Full admin access unlocked",
        description: `You are in. For Client Login later use ${email} + the same passcode.`,
      });
      setPasswordInput("");
    } catch (err: any) {
      toast({
        title: "Access denied",
        description: err?.message || "Incorrect passcode.",
        variant: "destructive",
      });
      setPasswordInput("");
    } finally {
      setAuthPending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    setIsAuthenticated(false);
    setShowPasswordDialog(true);
    clearAdminSessionFlag();
    toast({ title: "Logged out", description: "Admin session ended." });
  };

  if (checking) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4" data-testid="admin-auth-gate">
        <Dialog open={showPasswordDialog} onOpenChange={() => {}}>
          <DialogContent
            className="sm:max-w-md"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Admin unlock
              </DialogTitle>
              <DialogDescription>
                Enter your admin passcode for full Access Desk and CMS access.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-pass">Passcode</Label>
                <Input
                  id="admin-pass"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  placeholder="Admin passcode"
                  data-testid="input-admin-password"
                />
              </div>
              <Button type="submit" className="w-full font-bold" disabled={authPending || !passwordInput}>
                {authPending ? "Unlocking…" : "Unlock full admin"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Or{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Client Login
                </Link>{" "}
                with your platform admin email (same passcode after first unlock).
              </p>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 sm:py-10" data-testid="admin-authenticated-shell">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1">Admin</p>
          <h1 className="text-2xl font-display font-black text-foreground">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {headerExtra}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5"
            data-testid="button-admin-logout"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
