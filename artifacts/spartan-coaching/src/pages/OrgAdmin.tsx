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
  branchId?: number | null;
  teamId?: number | null;
  managerMemberId?: number | null;
};

type OrgBranch = { id: number; name: string; code: string | null; status: string };
type OrgTeam = { id: number; name: string; branchId: number | null; status: string };

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

type OrgUsage = {
  total: number;
  days: number;
  byTool: { toolName: string; count: number }[];
  byMember: { email: string; count: number }[];
};

export default function OrgAdmin() {
  const { member, organization, canUseFieldKit } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [usage, setUsage] = useState<OrgUsage | null>(null);
  const [orgName, setOrgName] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "org_admin">("member");
  const [busy, setBusy] = useState(false);
  const [branches, setBranches] = useState<OrgBranch[]>([]);
  const [teams, setTeams] = useState<OrgTeam[]>([]);
  const [branchName, setBranchName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamBranchId, setTeamBranchId] = useState<string>("");

  const isOrgAdmin =
    member?.role === "org_admin" || member?.role === "platform_admin";
  const isCompany = organization?.type === "company" || organization?.type === "platform";

  const load = useCallback(async () => {
    if (!isOrgAdmin || !canUseFieldKit) return;
    try {
      const [p, m, a, u, s] = await Promise.all([
        fetch("/api/org/profile", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/org/members", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/org/audit", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/org/usage", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/org/structure", { credentials: "include" }).then((r) => r.json()),
      ]);
      if (p.organization) {
        setProfile(p.organization);
        setOrgName(p.organization.name || "");
      }
      setMembers(m.members || []);
      setInvites(m.invites || []);
      setAudit(a.events || []);
      if (u && typeof u.total === "number") {
        setUsage({
          total: u.total,
          days: u.days ?? 7,
          byTool: u.byTool || [],
          byMember: u.byMember || [],
        });
      }
      setBranches(s.branches || []);
      setTeams(s.teams || []);
      if (Array.isArray(s.members) && s.members.length) {
        // Structure payload includes assignment fields
        setMembers(s.members);
      }
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

  const requestJson = async (url: string, method: "POST" | "PATCH", body?: unknown) => {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
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

  const post = async (url: string, body?: unknown) => requestJson(url, "POST", body);
  const patch = async (url: string, body?: unknown) => requestJson(url, "PATCH", body);

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

      <Card className="p-6 space-y-4" data-testid="org-admin-usage">
        <h2 className="text-lg font-bold">Team usage (last {usage?.days ?? 7} days)</h2>
        <p className="text-xs text-muted-foreground">
          Aggregate tool activity only — no individual tool content or free-text payloads.
        </p>
        {!usage ? (
          <p className="text-sm text-muted-foreground">Loading usage…</p>
        ) : usage.total === 0 ? (
          <p className="text-sm text-muted-foreground">No tool usage recorded for this period.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-2">
                Total events: <span className="text-primary">{usage.total}</span>
              </p>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">By tool</h3>
              <ul className="space-y-1">
                {usage.byTool.slice(0, 8).map((row) => (
                  <li key={row.toolName} className="flex justify-between gap-2">
                    <span className="truncate">{row.toolName}</span>
                    <span className="font-mono text-muted-foreground">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">By member</h3>
              <ul className="space-y-1">
                {usage.byMember.slice(0, 8).map((row) => (
                  <li key={row.email} className="flex justify-between gap-2">
                    <span className="truncate">{row.email}</span>
                    <span className="font-mono text-muted-foreground">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4" data-testid="org-admin-structure">
        <h2 className="text-lg font-bold">Branches &amp; teams</h2>
        <p className="text-xs text-muted-foreground">
          Multi-site structure for your provider org. Assign members below after creating branches
          or teams.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold">Branches</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {branches.length === 0 ? (
                <li>No branches yet.</li>
              ) : (
                branches.map((b) => (
                  <li key={b.id}>
                    <span className="text-foreground font-medium">{b.name}</span>
                    {b.code ? ` · ${b.code}` : ""}
                  </li>
                ))
              )}
            </ul>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="branch-name">New branch</Label>
                <Input
                  id="branch-name"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  disabled={busy}
                />
              </div>
              <Button
                disabled={busy || branchName.trim().length < 2}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const res = await fetch("/api/org/branches", {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: branchName.trim() }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(data.error || "Failed");
                    setBranchName("");
                    toast({ title: "Branch created" });
                    await load();
                  } catch (e: any) {
                    toast({
                      title: "Failed",
                      description: e?.message,
                      variant: "destructive",
                    });
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold">Teams</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {teams.length === 0 ? (
                <li>No teams yet.</li>
              ) : (
                teams.map((t) => (
                  <li key={t.id}>
                    <span className="text-foreground font-medium">{t.name}</span>
                    {t.branchId
                      ? ` · branch ${branches.find((b) => b.id === t.branchId)?.name || t.branchId}`
                      : ""}
                  </li>
                ))
              )}
            </ul>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="team-name">New team</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="team-branch">Branch (optional)</Label>
                <select
                  id="team-branch"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={teamBranchId}
                  onChange={(e) => setTeamBranchId(e.target.value)}
                  disabled={busy}
                >
                  <option value="">None</option>
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                disabled={busy || teamName.trim().length < 2}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const res = await fetch("/api/org/teams", {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: teamName.trim(),
                        branchId: teamBranchId ? Number(teamBranchId) : null,
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(data.error || "Failed");
                    setTeamName("");
                    setTeamBranchId("");
                    toast({ title: "Team created" });
                    await load();
                  } catch (e: any) {
                    toast({
                      title: "Failed",
                      description: e?.message,
                      variant: "destructive",
                    });
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Add team
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4" data-testid="org-admin-members">
        <h2 className="text-lg font-bold">Members</h2>
        <ul className="space-y-3 text-sm">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-2 border-b border-border/60 pb-3"
            >
              <div className="flex flex-wrap gap-2 justify-between items-center">
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
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                <label className="text-xs space-y-1">
                  <span className="text-muted-foreground">Branch</span>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={m.branchId != null ? String(m.branchId) : ""}
                    disabled={busy}
                    onChange={(e) =>
                      void patch(`/api/org/members/${m.id}/assignment`, {
                        branchId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">Unassigned</option>
                    {branches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs space-y-1">
                  <span className="text-muted-foreground">Team</span>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={m.teamId != null ? String(m.teamId) : ""}
                    disabled={busy}
                    onChange={(e) =>
                      void patch(`/api/org/members/${m.id}/assignment`, {
                        teamId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">Unassigned</option>
                    {teams.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs space-y-1">
                  <span className="text-muted-foreground">Manager</span>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={m.managerMemberId != null ? String(m.managerMemberId) : ""}
                    disabled={busy}
                    onChange={(e) =>
                      void patch(`/api/org/members/${m.id}/assignment`, {
                        managerMemberId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">None</option>
                    {members
                      .filter((other) => other.id !== m.id)
                      .map((other) => (
                        <option key={other.id} value={String(other.id)}>
                          {other.name}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
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
              role: inviteRole,
            });
            setInviteName("");
            setInviteEmail("");
            setInviteRole("member");
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
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value === "org_admin" ? "org_admin" : "member")
              }
              disabled={busy}
            >
              <option value="member">Member</option>
              <option value="org_admin">Org admin</option>
            </select>
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
