import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, Building2, User, Loader2 } from "lucide-react";
import { OrgDetailPanel } from "@/components/OrgDetailPanel";

const ADMIN_CODE = import.meta.env.VITE_ADMIN_PASSWORD || "5413";

const adminFetch = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Auth": ADMIN_CODE,
      ...(options.headers || {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
};

export function AccessDesk() {
  const { toast } = useToast();
  const [trialHours, setTrialHours] = useState<Record<number, string>>({});
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [orgFilter, setOrgFilter] = useState<string>("all");

  const { data: requestsData, isLoading: reqLoading } = useQuery({
    queryKey: ["/api/admin/access-requests"],
    queryFn: () => adminFetch("/api/admin/access-requests"),
  });

  const { data: orgsData, isLoading: orgsLoading } = useQuery({
    queryKey: ["/api/admin/organizations"],
    queryFn: () => adminFetch("/api/admin/organizations"),
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/admin/access-metrics"],
    queryFn: () => adminFetch("/api/admin/access-metrics"),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/access-requests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/access-metrics"] });
  };

  const approveMut = useMutation({
    mutationFn: ({ id, hours }: { id: number; hours?: number }) =>
      adminFetch(`/api/admin/access-requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify(hours ? { trialHours: hours } : {}),
      }),
    onSuccess: (data: any) => {
      toast({ title: "Approved", description: "Evaluation access started. Set-password email sent." });
      invalidate();
      if (data?.organization?.id) setSelectedOrgId(data.organization.id);
    },
    onError: (e: Error) => toast({ title: "Approve failed", description: e.message, variant: "destructive" }),
  });

  const rejectMut = useMutation({
    mutationFn: (id: number) =>
      adminFetch(`/api/admin/access-requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      toast({ title: "Rejected" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Reject failed", description: e.message, variant: "destructive" }),
  });

  if (selectedOrgId != null) {
    return (
      <OrgDetailPanel orgId={selectedOrgId} onBack={() => setSelectedOrgId(null)} />
    );
  }

  const requests = (requestsData?.requests || []) as any[];
  const pending = requests.filter((r) => r.status === "pending");
  const orgs = ((orgsData?.organizations || []) as any[]).filter((o) => o.type !== "platform");
  const filteredOrgs =
    orgFilter === "all"
      ? orgs
      : orgFilter === "follow_ups"
        ? orgs.filter(
            (o) =>
              o.nextFollowUpAt &&
              new Date(o.nextFollowUpAt).getTime() <= Date.now() &&
              !["won", "lost", "churned"].includes(o.pipelineStatus),
          )
        : orgs.filter((o) => o.pipelineStatus === orgFilter || o.status === orgFilter);

  const m = metrics as any;

  return (
    <div className="space-y-8" data-testid="access-desk">
      {m && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="access-metrics">
          {[
            { label: "Pending requests", value: m.requests?.pending ?? 0 },
            { label: "Follow-ups due", value: m.pipeline?.followUpsDue ?? 0 },
            { label: "In trial", value: m.organizations?.trial ?? 0 },
            { label: "Won clients", value: m.pipeline?.won ?? 0 },
            { label: "Follow-up pipeline", value: m.pipeline?.follow_up ?? 0 },
            { label: "Expired access", value: m.organizations?.expired ?? 0 },
            { label: "Lost", value: m.pipeline?.lost ?? 0 },
            { label: "Tool uses (7d)", value: m.toolUsesLast7Days ?? 0 },
          ].map((stat) => (
            <Card key={stat.label} className="border border-white/10">
              <CardContent className="p-4">
                <p className="text-2xl font-black text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Pending access requests ({pending.length})
          </CardTitle>
          <CardDescription>
            Approve to start evaluation. Opens the org detail so you can add notes and set follow-up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reqLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending requests</p>
          ) : (
            pending.map((r) => (
              <div
                key={r.id}
                className="border border-border rounded-lg p-4 space-y-3"
                data-testid={`access-request-${r.id}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold flex items-center gap-2">
                      {r.type === "company" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      {r.name}
                      <Badge variant="secondary">{r.type}</Badge>
                      {String(r.adminNote || "").includes("extension") && (
                        <Badge className="bg-amber-500/20 text-amber-200">Extension</Badge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{r.email}</p>
                    {r.companyName && <p className="text-sm">Org: {r.companyName}</p>}
                    {r.role && <p className="text-sm">Role: {r.role}</p>}
                    {r.primaryGoal && <p className="text-sm">Goal: {r.primaryGoal}</p>}
                    {r.seatsRequested && r.type === "company" && (
                      <p className="text-sm">Seats: {r.seatsRequested}</p>
                    )}
                    {r.message && (
                      <p className="text-sm mt-2 bg-muted/40 p-2 rounded whitespace-pre-wrap">{r.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Trial hours (optional)</Label>
                    <Input
                      className="w-28 h-9"
                      placeholder={r.type === "company" ? "72" : "24"}
                      value={trialHours[r.id] ?? ""}
                      onChange={(e) => setTrialHours((h) => ({ ...h, [r.id]: e.target.value }))}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="font-bold gap-1"
                    disabled={approveMut.isPending}
                    onClick={() => {
                      const h = trialHours[r.id] ? Number(trialHours[r.id]) : undefined;
                      approveMut.mutate({ id: r.id, hours: h && Number.isFinite(h) ? h : undefined });
                    }}
                    data-testid={`button-approve-${r.id}`}
                  >
                    {approveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={rejectMut.isPending}
                    onClick={() => {
                      adminFetch(`/api/admin/access-requests/${r.id}/reject-and-notify`, {
                        method: "POST",
                        body: JSON.stringify({}),
                      })
                        .then(() => {
                          toast({ title: "Rejected", description: "Requester notified by email." });
                          invalidate();
                        })
                        .catch(() => rejectMut.mutate(r.id));
                    }}
                    data-testid={`button-reject-${r.id}`}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject & notify
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      adminFetch(`/api/admin/access-requests/${r.id}/to-inquiry`, { method: "POST", body: "{}" })
                        .then(() => toast({ title: "Inquiry created" }))
                        .catch((e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }));
                    }}
                  >
                    Copy to inquiries
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Clients & pipeline</CardTitle>
              <CardDescription>Open a record for notes, timeline, won/lost, and follow-ups.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                { id: "follow_ups", label: "Follow-ups due" },
                { id: "trial", label: "Trial" },
                { id: "follow_up", label: "Follow-up" },
                { id: "won", label: "Won" },
                { id: "expired", label: "Expired access" },
                { id: "lost", label: "Lost" },
              ].map((f) => (
                <Button
                  key={f.id}
                  size="sm"
                  variant={orgFilter === f.id ? "default" : "outline"}
                  onClick={() => setOrgFilter(f.id)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {orgsLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : filteredOrgs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No organizations in this filter</p>
          ) : (
            filteredOrgs.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => setSelectedOrgId(org.id)}
                className="w-full text-left border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                data-testid={`org-row-${org.id}`}
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-bold">
                      {org.name}{" "}
                      <Badge
                        variant={
                          org.status === "active"
                            ? "default"
                            : org.status === "trial"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {org.status}
                      </Badge>{" "}
                      <Badge variant="outline">{org.pipelineStatus || "—"}</Badge>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {org.type} · {org.memberCount}/{org.seatLimit} seats
                      {org.activated ? (
                        <span className="text-green-500"> · activated</span>
                      ) : (
                        <span className="text-amber-400/90"> · not activated</span>
                      )}
                      {org.trialEndsAt && org.status === "trial" && (
                        <> · trial ends {new Date(org.trialEndsAt).toLocaleString()}</>
                      )}
                      {org.nextFollowUpAt && (
                        <> · follow-up {new Date(org.nextFollowUpAt).toLocaleString()}</>
                      )}
                    </p>
                  </div>
                  <span className="text-sm text-primary font-semibold self-center">Open →</span>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {requests.filter((r) => r.status !== "pending").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              {requests
                .filter((r) => r.status !== "pending")
                .slice(0, 20)
                .map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                    <span>
                      {r.name} · {r.email}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant={r.status === "approved" ? "default" : "secondary"}>{r.status}</Badge>
                      {r.status === "approved" && r.resultingOrgId && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedOrgId(r.resultingOrgId)}>
                          Open org
                        </Button>
                      )}
                      {r.status === "approved" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => {
                            adminFetch(`/api/admin/access-requests/${r.id}/resend-invite`, {
                              method: "POST",
                              body: "{}",
                            })
                              .then(() => toast({ title: "Invite resent" }))
                              .catch((e: Error) =>
                                toast({ title: "Resend failed", description: e.message, variant: "destructive" }),
                              );
                          }}
                        >
                          Resend invite
                        </Button>
                      )}
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
