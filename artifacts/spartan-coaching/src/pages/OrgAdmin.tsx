/**
 * Provider organization administration workspace (program foundation).
 * Company org_admin only — seats, roles, invites, audit.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/PageShell";

type OrgMember = {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
};

type OrgInvite = {
  id: number;
  email: string;
  role: string;
  status: string;
  expiresAt?: string;
};

type OrgProfile = {
  id: number;
  name: string;
  type: string;
  status: string;
  seatLimit: number;
  billableSeats: number | null;
  billingPlan: string | null;
  billingStatus: string | null;
  activeMembers: number;
};

type AuditEvent = {
  id: number;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
};

export default function OrgAdmin() {
  const { member, organization, canUseFieldKit } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [orgName, setOrgName] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const isOrgAdmin =
    member?.role === "org_admin" || member?.role === "platform_admin";
  const isCompany = organization?.type === "company" || organization?.type === "platform";

  const load = useCallback(async () => {
    if (!isOrgAdmin || !canUseFieldKit) return;
    try {
      const [p, m, a] = await Promise.all([
        fetch("/api/org/profile", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/org/members", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/org/audit", { credentials: "include" }).then((r) => r.json()),
      ]);
      if (p.organization) {
        setProfile(p.organization);
        setOrgName(p.organization.name || "");
      }
      setMembers(m.members || []);
      setInvites(m.invites || []);
      setAudit(a.events || []);
    } catch {
      toast({ title: "Could not load organization", variant: "destructive" });
    }
  }, [isOrgAdmin, canUseFieldKit, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canUseFieldKit || !isOrgAdmin || !isCompany) {
    return (
      <PageShell width="md" className="py-12">
        <SEO title="Organization admin | Hospice Sales Pro" noIndex />
        <Card className="p-6 space-y-3">
          <h1 className="text-xl font-bold">Organization admin</h1>
          <p className="text-sm text-muted-foreground">
            Available to organization administrators on company accounts with active Hospice Sales Pro
            access.
          </p>
          <Button asChild variant="outline">
            <Link href="/account">Back to Account</Link>
          </Button>
        </Card>
      </PageShell>
    );
  }

  const seatCap = profile?.billableSeats || profile?.seatLimit || 0;

  const post = async (url: string, body?: unknown) => {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      toast({ title: "Updated" });
      await load();
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell width="lg" className="py-10 space-y-8" testId="page-org-admin">
      <SEO title="Organization admin | Hospice Sales Pro" noIndex />
      <header className="space-y-2">
        <p className="text-kicker">Provider administration</p>
        <h1 className="text-h1 font-display font-black">Organization admin</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Manage seats, roles, invitations, and review audit history for your tenant. Individual tool
          results stay private to each member.
        </p>
      </header>

      <Card className="p-6 space-y-4" data-testid="org-admin-profile">
        <h2 className="text-lg font-bold">Organization profile</h2>
        {profile && (
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>
              Status: <strong className="text-foreground">{profile.status}</strong>
            </li>
            <li>
              Seats in use:{" "}
              <strong className="text-foreground">
                {profile.activeMembers}
                {seatCap ? ` / ${seatCap}` : ""}
              </strong>
            </li>
            {profile.billingStatus && (
              <li>
                Billing: <strong className="text-foreground">{profile.billingStatus}</strong>
                {profile.billingPlan ? ` · ${profile.billingPlan}` : ""}
              </li>
            )}
          </ul>
        )}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 space-y-1 w-full">
            <Label htmlFor="org-name">Display name</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={busy}
            />
          </div>
          <Button
            disabled={busy || orgName.trim().length < 2}
            onClick={async () => {
              setBusy(true);
              try {
                const res = await fetch("/api/org/profile", {
                  method: "PATCH",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: orgName.trim() }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || "Failed");
                toast({ title: "Name updated" });
                await load();
              } catch (e: any) {
                toast({ title: "Failed", description: e?.message, variant: "destructive" });
              } finally {
                setBusy(false);
              }
            }}
          >
            Save name
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-4" data-testid="org-admin-members">
        <h2 className="text-lg font-bold">Members</h2>
        <ul className="space-y-3 text-sm">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap gap-2 justify-between items-center border-b border-border/60 pb-2"
            >
              <span>
                <span className="font-medium">{m.name}</span>
                <span className="text-muted-foreground"> · {m.email}</span>
                <span className="text-muted-foreground"> · {m.status}</span>
                <span className="text-muted-foreground"> · {m.role.replace("_", " ")}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                {m.id !== member?.id && m.status !== "disabled" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void post(`/api/org/members/${m.id}/role`, {
                          role: m.role === "org_admin" ? "member" : "org_admin",
                        })
                      }
                    >
                      {m.role === "org_admin" ? "Make member" : "Make admin"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      disabled={busy}
                      onClick={() => {
                        if (confirm(`Disable access for ${m.email}?`)) {
                          void post(`/api/org/members/${m.id}/disable`);
                        }
                      }}
                    >
                      Disable
                    </Button>
                  </>
                )}
                {m.status === "disabled" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void post(`/api/org/members/${m.id}/enable`)}
                  >
                    Re-enable
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6 space-y-4" data-testid="org-admin-invites">
        <h2 className="text-lg font-bold">Invitations</h2>
        {invites.length > 0 && (
          <ul className="text-sm space-y-2 mb-4">
            {invites.map((i) => (
              <li key={i.id} className="flex justify-between gap-2 items-center">
                <span className="text-muted-foreground">
                  {i.email} · {i.role}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void post(`/api/org/invites/${i.id}/revoke`)}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="grid sm:grid-cols-2 gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await post("/api/org/invites", {
              name: inviteName.trim(),
              email: inviteEmail.trim(),
              role: "member",
            });
            setInviteName("");
            setInviteEmail("");
          }}
        >
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy} className="font-bold">
              Invite team member
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 space-y-3" data-testid="org-admin-audit">
        <h2 className="text-lg font-bold">Audit history</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">No admin actions recorded yet.</p>
        ) : (
          <ul className="text-xs space-y-2 font-mono text-muted-foreground">
            {audit.slice(0, 40).map((ev) => (
              <li key={ev.id}>
                {new Date(ev.createdAt).toISOString()} · {ev.action}
                {ev.targetType ? ` · ${ev.targetType}:${ev.targetId}` : ""}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageShell>
  );
}
