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
import { LogOut, Loader2 } from "lucide-react";
import {
  adminFetch,
  adminGet,
  markAdminSession,
  clearAdminSessionFlag,
  hasAdminSessionFlag,
} from "@/lib/adminApi";

type Props = {
  children: ReactNode;
  /** Page title shown after unlock */
  title?: string;
  /** Extra header actions (e.g. link to full admin) */
  headerExtra?: ReactNode;
};

/**
 * Shared platform-admin gate for /admin and lighter admin surfaces.
 * Auth = platform_admin session cookie (legacy unlock password creates that session).
 */
export function AdminAuthGate({
  children,
  title = "Admin",
  headerExtra,
}: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [bootEmail, setBootEmail] = useState("");
  const [bootName, setBootName] = useState("Nick Lynch");
  const [bootPassword, setBootPassword] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const [checking, setChecking] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await fetch("/api/admin/bootstrap-status", {
          credentials: "include",
        }).then((r) => r.json());
        if (!cancelled) setNeedsBootstrap(!!status.needsBootstrap);
      } catch {
        /* ignore */
      }

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
      if (needsBootstrap) {
        await adminFetch("/api/admin/bootstrap", {
          method: "POST",
          body: JSON.stringify({
            adminPassword: passwordInput,
            email: bootEmail.trim(),
            name: bootName.trim() || "Platform Admin",
            password: bootPassword,
          }),
        });
        markAdminSession();
        setIsAuthenticated(true);
        setShowPasswordDialog(false);
        setNeedsBootstrap(false);
        toast({
          title: "Platform admin created",
          description:
            "You are signed in. Use your admin email/password at Client Login next time.",
        });
        return;
      }

      await adminFetch("/api/admin/legacy-login", {
        method: "POST",
        body: JSON.stringify({ password: passwordInput }),
      });
      markAdminSession();
      setIsAuthenticated(true);
      setShowPasswordDialog(false);
      toast({
        title: "Access granted",
        description: "Welcome to the admin area",
      });
      setPasswordInput("");
    } catch (err: any) {
      const msg = err?.message || "Please try again.";
      if (
        msg.includes("bootstrap") ||
        msg.includes("NEEDS_BOOTSTRAP") ||
        msg.includes("No platform admin")
      ) {
        setNeedsBootstrap(true);
      }
      toast({
        title: "Access denied",
        description: msg,
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
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{needsBootstrap ? "Create platform admin" : "Admin unlock"}</DialogTitle>
              <DialogDescription>
                {needsBootstrap
                  ? "One-time setup: enter the server ADMIN_PASSWORD, then create your admin email/password."
                  : "Enter the server admin password to open a platform admin session."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-pass">Admin password</Label>
                <Input
                  id="admin-pass"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  data-testid="input-admin-password"
                />
              </div>
              {needsBootstrap && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="boot-email">Your email</Label>
                    <Input
                      id="boot-email"
                      type="email"
                      value={bootEmail}
                      onChange={(e) => setBootEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boot-name">Name</Label>
                    <Input
                      id="boot-name"
                      value={bootName}
                      onChange={(e) => setBootName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boot-pw">New login password</Label>
                    <Input
                      id="boot-pw"
                      type="password"
                      value={bootPassword}
                      onChange={(e) => setBootPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                </>
              )}
              <Button type="submit" className="w-full font-bold" disabled={authPending}>
                {authPending ? "Checking…" : needsBootstrap ? "Create admin" : "Unlock"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Prefer email login?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Client Login
                </Link>{" "}
                as platform admin.
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
          <p className="text-xs font-bold tracking-widest text-red-400 uppercase mb-1">Admin</p>
          <h1 className="text-2xl font-display font-black text-foreground">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {headerExtra}
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5" data-testid="button-admin-logout">
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
