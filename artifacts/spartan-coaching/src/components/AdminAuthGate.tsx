import { AccentText } from "@/components/AccentText";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Loader2, Shield } from "lucide-react";
import { adminGet, clearAdminSessionFlag, hasAdminSessionFlag } from "@/lib/adminApi";

type Props = {
  children: ReactNode;
  title?: string;
  headerExtra?: ReactNode;
};

/**
 * Platform administration requires an authenticated platform-admin session.
 */
export function AdminAuthGate({
  children,
  title = "Admin",
  headerExtra,
}: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    setIsAuthenticated(false);
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
        <Dialog open onOpenChange={() => {}}>
          <DialogContent
            className="sm:max-w-md"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Administrator sign-in required
              </DialogTitle>
              <DialogDescription>
                Sign in with an active platform administrator account to access this area.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Button asChild className="w-full font-bold">
                <Link href="/login">Go to secure sign-in</Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Organization administrators cannot access platform administration.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 sm:py-10 surface-page min-h-[70vh]" data-testid="admin-authenticated-shell">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-4 sm:p-5 shadow-elite">
        <div>
          <p className="text-kicker mb-1">Admin</p>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tight"><AccentText>{title}</AccentText></h1>
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
