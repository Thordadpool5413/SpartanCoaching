import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Account() {
  const { member, organization, fieldKit, isAuthenticated, isLoading, logout, canUseFieldKit, refresh } =
    useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [seatLimit, setSeatLimit] = useState<number | null>(null);
  const [invitePending, setInvitePending] = useState(false);
  const [usage, setUsage] = useState<{
    total: number;
    days: number;
    byTool: { toolName: string; count: number }[];
    byMember: { email: string; count: number }[];
  } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwPending, setPwPending] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (member?.role === "org_admin" && canUseFieldKit) {
      fetch("/api/org/members", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          setMembers(data.members || []);
          setInvites(data.invites || []);
          setSeatLimit(data.seatLimit ?? null);
        })
        .catch(() => {});
      fetch("/api/org/usage", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setUsage(data);
        })
        .catch(() => {});
    }
  }, [member, canUseFieldKit]);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvitePending(true);
    try {
      const res = await fetch("/api/org/invites", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), name: inviteName.trim(), role: "member" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Invite failed");
      toast({ title: "Invite sent", description: `Invitation emailed to ${inviteEmail}` });
      setInviteEmail("");
      setInviteName("");
      await refresh();
      const m = await fetch("/api/org/members", { credentials: "include" }).then((r) => r.json());
      setMembers(m.members || []);
      setInvites(m.invites || []);
      setSeatLimit(m.seatLimit ?? null);
    } catch (err: any) {
      toast({ title: "Invite failed", description: err?.message, variant: "destructive" });
    } finally {
      setInvitePending(false);
    }
  };

  if (isLoading || !member) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const statusLabel =
    organization?.status === "trial"
      ? "Evaluation"
      : organization?.status === "active"
        ? "Active client"
        : organization?.status === "expired"
          ? "Evaluation ended"
          : organization?.status || "—";

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12 space-y-8" data-testid="page-account">
      <SEO />
      <div>
        <p className="text-xs font-bold tracking-widest text-red-400 uppercase mb-2">Account</p>
        <h1 className="text-h1 font-display font-black">Your access</h1>
      </div>

      <Card className="border border-white/10 dark:bg-[#0c0c0c] p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{statusLabel}</Badge>
          {canUseFieldKit ? (
            <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Field Kit unlocked</Badge>
          ) : (
            <Badge variant="destructive">Field Kit locked</Badge>
          )}
        </div>
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-semibold">{member.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-semibold">{member.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Organization</dt>
            <dd className="font-semibold">{organization?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-semibold">{member.role === "org_admin" ? "Organization admin" : "Member"}</dd>
          </div>
          {organization?.status === "trial" && fieldKit?.trialEndsAt && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Evaluation ends</dt>
              <dd className="font-semibold">{new Date(fieldKit.trialEndsAt).toLocaleString()}</dd>
            </div>
          )}
        </dl>
        <div className="flex flex-wrap gap-3 pt-2">
          {canUseFieldKit && (
            <Button asChild className="font-bold">
              <Link href="/portal">Open Field Kit home</Link>
            </Button>
          )}
          {!canUseFieldKit && organization?.status === "expired" && (
            <>
              <Button asChild className="font-bold">
                <Link href="/contact?service=Field+Kit+Membership">Continue as a client</Link>
              </Button>
              <Button asChild variant="outline" className="font-bold">
                <Link href="/field-kit-membership">Membership options</Link>
              </Button>
            </>
          )}
          <Button asChild variant="outline" className="font-bold">
            <Link href="/contact">Book a strategy call</Link>
          </Button>
          <Button variant="ghost" onClick={handleLogout} data-testid="button-logout">
            Sign out
          </Button>
        </div>
      </Card>

      {member.role === "org_admin" && organization?.type === "company" && (
        <Card className="border border-white/10 dark:bg-[#0c0c0c] p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold">Team seats</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {members.filter((m) => m.status !== "disabled").length}
              {seatLimit != null ? ` / ${seatLimit}` : ""} seats in use
            </p>
          </div>

          <ul className="space-y-2 text-sm">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-2 border-b border-white/5 pb-2 items-center">
                <span>
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted-foreground"> · {m.email}</span>
                  <span className="text-muted-foreground"> · {m.status}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground capitalize">{m.role.replace("_", " ")}</span>
                  {m.id !== member.id && m.status !== "disabled" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive"
                      onClick={async () => {
                        if (!confirm(`Disable access for ${m.email}?`)) return;
                        try {
                          const res = await fetch(`/api/org/members/${m.id}/disable`, {
                            method: "POST",
                            credentials: "include",
                          });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) throw new Error(data.error || "Failed");
                          toast({ title: "Member disabled" });
                          setMembers((prev) =>
                            prev.map((x) => (x.id === m.id ? { ...x, status: "disabled" } : x)),
                          );
                        } catch (err: any) {
                          toast({ title: "Failed", description: err?.message, variant: "destructive" });
                        }
                      }}
                    >
                      Disable
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {invites.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Pending invites</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {invites.map((i) => (
                  <li key={i.id}>{i.email}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={sendInvite} className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="font-bold" disabled={invitePending}>
                {invitePending ? "Sending…" : "Invite team member"}
              </Button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground">
            Need more seats or a BAA?{" "}
            <Link href="/contact?service=HIPAA+BAA+Request" className="text-primary hover:underline">
              Contact us
            </Link>
          </p>
        </Card>
      )}

      <Card className="border border-white/10 dark:bg-[#0c0c0c] p-6 space-y-4">
        <h2 className="text-lg font-bold">Sessions &amp; security</h2>
        <p className="text-sm text-muted-foreground">
          Sessions last up to 14 days. Changing your password signs out other devices automatically.
        </p>
        <Button
          type="button"
          variant="outline"
          className="font-bold w-full sm:w-auto"
          data-testid="button-logout-others"
          onClick={async () => {
            try {
              const res = await fetch("/api/auth/logout-others", {
                method: "POST",
                credentials: "include",
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(data.error || "Failed");
              toast({ title: "Other sessions ended", description: "You stay signed in on this device." });
            } catch (err: any) {
              toast({ title: "Could not end sessions", description: err?.message, variant: "destructive" });
            }
          }}
        >
          Sign out other devices
        </Button>
      </Card>

      <Card className="border border-white/10 dark:bg-[#0c0c0c] p-6 space-y-4">
        <h2 className="text-lg font-bold">Change password</h2>
        <form
          className="grid sm:grid-cols-2 gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setPwPending(true);
            try {
              const res = await fetch("/api/auth/change-password", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(data.error || "Failed");
              toast({ title: "Password updated" });
              setCurrentPassword("");
              setNewPassword("");
            } catch (err: any) {
              toast({ title: "Could not update password", description: err?.message, variant: "destructive" });
            } finally {
              setPwPending(false);
            }
          }}
        >
          <div className="space-y-1">
            <Label>Current password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>New password (min 8)</Label>
            <Input
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="font-bold" disabled={pwPending}>
              {pwPending ? "Saving…" : "Update password"}
            </Button>
          </div>
        </form>
      </Card>

      {member.role === "org_admin" && usage && (
        <Card className="border border-white/10 dark:bg-[#0c0c0c] p-6 space-y-4" data-testid="org-usage">
          <div>
            <h2 className="text-lg font-bold">Team usage (last {usage.days} days)</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {usage.total} tool action{usage.total === 1 ? "" : "s"} across your seats
            </p>
          </div>
          {usage.byTool.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tool activity yet this week.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="font-semibold mb-2">By tool</p>
                <ul className="space-y-1">
                  {usage.byTool.slice(0, 8).map((t) => (
                    <li key={t.toolName} className="flex justify-between gap-2 border-b border-white/5 pb-1">
                      <span className="text-muted-foreground truncate">{t.toolName}</span>
                      <span className="font-semibold">{t.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">By member</p>
                <ul className="space-y-1">
                  {usage.byMember.slice(0, 8).map((m) => (
                    <li key={m.email} className="flex justify-between gap-2 border-b border-white/5 pb-1">
                      <span className="text-muted-foreground truncate">{m.email}</span>
                      <span className="font-semibold">{m.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
