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
              <li key={m.id} className="flex justify-between gap-2 border-b border-white/5 pb-2">
                <span>
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted-foreground"> · {m.email}</span>
                </span>
                <span className="text-muted-foreground capitalize">{m.role.replace("_", " ")}</span>
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
    </div>
  );
}
