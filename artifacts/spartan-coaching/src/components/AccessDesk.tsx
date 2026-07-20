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
  const [extendHours, setExtendHours] = useState<Record<number, string>>({});

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
    onSuccess: () => {
      toast({ title: "Approved", description: "Evaluation access started. Set-password email sent." });
      invalidate();
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

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminFetch(`/api/admin/organizations/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast({ title: "Organization updated" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const extendMut = useMutation({
    mutationFn: ({ id, hours }: { id: number; hours: number }) =>
      adminFetch(`/api/admin/organizations/${id}/extend-trial`, {
        method: "POST",
        body: JSON.stringify({ hours }),
      }),
    onSuccess: () => {
      toast({ title: "Trial extended" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Extend failed", description: e.message, variant: "destructive" }),
  });

  const requests = (requestsData?.requests || []) as any[];
  const pending = requests.filter((r) => r.status === "pending");
  const orgs = (orgsData?.organizations || []) as any[];

  const m = metrics as any;

  return (
    <div className="space-y-8" data-testid="access-desk">
      {m && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="access-metrics">
          {[
            { label: "Pending requests", value: m.requests?.pending ?? 0 },
            { label: "Active clients", value: m.organizations?.active ?? 0 },
            { label: "In trial", value: m.organizations?.trial ?? 0 },
            { label: "Tool uses (7d)", value: m.toolUsesLast7Days ?? 0 },
            { label: "Approved total", value: m.requests?.approved ?? 0 },
            { label: "Expired orgs", value: m.organizations?.expired ?? 0 },
            { label: "Members active", value: m.members?.active ?? 0 },
            { label: "Logins (7d)", value: m.members?.loggedIn7d ?? 0 },
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
            Approve to create org + member and email a set-password link. Default trial: 24h individual / 72h company.
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
                      // Prefer notify path
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
                        .then(() => toast({ title: "Inquiry created", description: "Also visible under Inquiries tab." }))
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
          <CardTitle>Organizations & clients</CardTitle>
          <CardDescription>Activate paid clients, extend evaluations, or suspend access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orgsLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : orgs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No organizations yet</p>
          ) : (
            orgs.map((org) => (
              <div key={org.id} className="border border-border rounded-lg p-4 space-y-3" data-testid={`org-${org.id}`}>
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
                      </Badge>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {org.type} · {org.memberCount}/{org.seatLimit} seats
                      {org.trialEndsAt && org.status === "trial" && (
                        <> · trial ends {new Date(org.trialEndsAt).toLocaleString()}</>
                      )}
                    </p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      {(org.members || []).map((m: any) => (
                        <li key={m.id}>
                          {m.name} &lt;{m.email}&gt; · {m.status}
                          {m.lastLoginAt ? ` · last login ${new Date(m.lastLoginAt).toLocaleDateString()}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-end">
                  <Button
                    size="sm"
                    className="font-bold"
                    onClick={() => statusMut.mutate({ id: org.id, status: "active" })}
                    disabled={statusMut.isPending || org.status === "active"}
                  >
                    Activate client
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => statusMut.mutate({ id: org.id, status: "expired" })}
                    disabled={statusMut.isPending}
                  >
                    End access
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => statusMut.mutate({ id: org.id, status: "suspended" })}
                    disabled={statusMut.isPending}
                  >
                    Suspend
                  </Button>
                  <div className="flex items-end gap-1">
                    <div className="space-y-1">
                      <Label className="text-xs">Extend hours</Label>
                      <Input
                        className="w-24 h-9"
                        placeholder="24"
                        value={extendHours[org.id] ?? ""}
                        onChange={(e) => setExtendHours((h) => ({ ...h, [org.id]: e.target.value }))}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const h = Number(extendHours[org.id] || 24);
                        extendMut.mutate({ id: org.id, hours: h });
                      }}
                    >
                      Extend trial
                    </Button>
                  </div>
                </div>
              </div>
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
