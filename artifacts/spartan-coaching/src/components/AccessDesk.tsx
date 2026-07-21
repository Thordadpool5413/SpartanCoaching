import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  User,
  Loader2,
  Copy,
  Mail,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { OrgDetailPanel } from "@/components/OrgDetailPanel";
import { adminFetch } from "@/lib/adminApi";
import {
  REJECT_NOTE_TEMPLATES,
  defaultHoursForType,
  copyText,
  loginUrl,
} from "@/lib/accessDeskTemplates";

export function AccessDesk() {
  const { toast } = useToast();
  const [trialHours, setTrialHours] = useState<Record<number, string>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({});
  const [rejectOpen, setRejectOpen] = useState<number | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<number | null>(null);

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
    mutationFn: ({ id, hours, adminNote }: { id: number; hours: number; adminNote?: string }) =>
      adminFetch(`/api/admin/access-requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ trialHours: hours, adminNote: adminNote || undefined }),
      }),
    onSuccess: (data: any, vars) => {
      toast({
        title: "Approved · email sent",
        description: `${vars.hours}h evaluation started. Set-password email sent to the requester.`,
      });
      invalidate();
      if (data?.organization?.id) setSelectedOrgId(data.organization.id);
    },
    onError: (e: Error) =>
      toast({ title: "Approve failed", description: e.message, variant: "destructive" }),
    onSettled: () => setBusyId(null),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, adminNote }: { id: number; adminNote?: string }) =>
      adminFetch(`/api/admin/access-requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ adminNote: adminNote || undefined }),
      }),
    onSuccess: (_data, vars) => {
      toast({
        title: "Rejected · email sent",
        description: vars.adminNote
          ? "Requester notified with your note."
          : "Requester notified by email.",
      });
      setRejectOpen(null);
      invalidate();
    },
    onError: (e: Error) =>
      toast({ title: "Reject failed", description: e.message, variant: "destructive" }),
    onSettled: () => setBusyId(null),
  });

  const requests = (requestsData?.requests || []) as any[];
  const pending = requests.filter((r) => r.status === "pending");
  const orgs = ((orgsData?.organizations || []) as any[]).filter((o) => o.type !== "platform");

  const followUpsDue = useMemo(
    () =>
      orgs
        .filter(
          (o) =>
            o.nextFollowUpAt &&
            new Date(o.nextFollowUpAt).getTime() <= Date.now() &&
            !["won", "lost", "churned"].includes(o.pipelineStatus),
        )
        .sort(
          (a, b) =>
            new Date(a.nextFollowUpAt).getTime() - new Date(b.nextFollowUpAt).getTime(),
        ),
    [orgs],
  );

  const filteredOrgs =
    orgFilter === "all"
      ? orgs
      : orgFilter === "follow_ups"
        ? followUpsDue
        : orgs.filter((o) => o.pipelineStatus === orgFilter || o.status === orgFilter);

  const m = metrics as any;

  const hoursFor = (r: any) => {
    const custom = trialHours[r.id];
    if (custom && Number.isFinite(Number(custom))) return Number(custom);
    return defaultHoursForType(r.type);
  };

  const doApprove = (r: any, hours?: number) => {
    setBusyId(r.id);
    approveMut.mutate({ id: r.id, hours: hours ?? hoursFor(r) });
  };

  const doReject = (r: any) => {
    setBusyId(r.id);
    rejectMut.mutate({ id: r.id, adminNote: rejectNotes[r.id]?.trim() || undefined });
  };

  const copy = async (label: string, text: string) => {
    const ok = await copyText(text);
    toast({
      title: ok ? "Copied" : "Copy failed",
      description: ok ? label : "Clipboard unavailable",
      variant: ok ? undefined : "destructive",
    });
  };

  if (selectedOrgId != null) {
    return <OrgDetailPanel orgId={selectedOrgId} onBack={() => setSelectedOrgId(null)} />;
  }

  return (
    <div className="space-y-8" data-testid="access-desk">
      {m && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="access-metrics">
          {[
            {
              label: "Pending requests",
              value: m.requests?.pending ?? pending.length,
              hot: (m.requests?.pending ?? pending.length) > 0,
              onClick: () => {
                document.getElementById("pending-requests")?.scrollIntoView({ behavior: "smooth" });
              },
            },
            {
              label: "Follow-ups due",
              value: m.pipeline?.followUpsDue ?? followUpsDue.length,
              hot: (m.pipeline?.followUpsDue ?? followUpsDue.length) > 0,
              onClick: () => setOrgFilter("follow_ups"),
            },
            { label: "In trial", value: m.organizations?.trial ?? 0 },
            { label: "Won clients", value: m.pipeline?.won ?? 0 },
            { label: "Follow-up pipeline", value: m.pipeline?.follow_up ?? 0 },
            { label: "Expired access", value: m.organizations?.expired ?? 0 },
            { label: "Lost", value: m.pipeline?.lost ?? 0 },
            { label: "Tool uses (7d)", value: m.toolUsesLast7Days ?? 0 },
          ].map((stat) => (
            <Card
              key={stat.label}
              className={`border ${stat.hot ? "border-amber-500/40 bg-amber-500/5" : "border-white/10"} ${
                stat.onClick ? "cursor-pointer hover:border-primary/40 transition-colors" : ""
              }`}
              onClick={stat.onClick}
            >
              <CardContent className="p-4">
                <p className="text-2xl font-black text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {stat.hot && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Follow-ups due — top priority ops queue */}
      {followUpsDue.length > 0 && (
        <Card
          className="border border-amber-500/35 bg-amber-500/5"
          data-testid="section-follow-ups-due"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Follow-ups due ({followUpsDue.length})
            </CardTitle>
            <CardDescription>
              Pipeline dates at or past due. Open the org, log a note, set the next follow-up.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {followUpsDue.slice(0, 8).map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => setSelectedOrgId(org.id)}
                className="w-full text-left border border-amber-500/20 rounded-lg p-3 hover:border-amber-400/50 transition-colors bg-background/40"
                data-testid={`follow-up-row-${org.id}`}
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm">
                      {org.name}{" "}
                      <Badge variant="outline">{org.pipelineStatus}</Badge>{" "}
                      <Badge variant="secondary">{org.status}</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due {new Date(org.nextFollowUpAt).toLocaleString()}
                      {org.trialEndsAt && org.status === "trial" && (
                        <> · trial ends {new Date(org.trialEndsAt).toLocaleString()}</>
                      )}
                    </p>
                  </div>
                  <span className="text-sm text-primary font-semibold self-center">Open →</span>
                </div>
              </button>
            ))}
            {followUpsDue.length > 8 && (
              <Button size="sm" variant="outline" onClick={() => setOrgFilter("follow_ups")}>
                View all {followUpsDue.length} in pipeline filter
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card id="pending-requests">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Pending access requests ({pending.length})
          </CardTitle>
          <CardDescription>
            One-click approve uses defaults: <strong>24h individual</strong> · <strong>72h company</strong>.
            Approve sends set-password email and opens the org for notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reqLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending requests</p>
          ) : (
            pending.map((r) => {
              const defH = defaultHoursForType(r.type);
              const busy = busyId === r.id;
              return (
                <div
                  key={r.id}
                  className="border border-border rounded-lg p-4 space-y-3"
                  data-testid={`access-request-${r.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold flex flex-wrap items-center gap-2">
                        {r.type === "company" ? (
                          <Building2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <User className="w-4 h-4 shrink-0" />
                        )}
                        {r.name}
                        <Badge variant="secondary">{r.type}</Badge>
                        {String(r.adminNote || "").includes("extension") && (
                          <Badge className="bg-amber-500/20 text-amber-200">Extension</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                        {r.email}
                        <button
                          type="button"
                          className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                          onClick={() => copy("Email", r.email)}
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                        <a
                          href={`mailto:${r.email}`}
                          className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                        >
                          <Mail className="w-3 h-3" /> Mail
                        </a>
                      </p>
                      {r.companyName && <p className="text-sm">Org: {r.companyName}</p>}
                      {r.role && <p className="text-sm">Role: {r.role}</p>}
                      {r.primaryGoal && <p className="text-sm">Goal: {r.primaryGoal}</p>}
                      {r.market && <p className="text-sm">Market: {r.market}</p>}
                      {r.seatsRequested && r.type === "company" && (
                        <p className="text-sm">Seats: {r.seatsRequested}</p>
                      )}
                      {r.message && (
                        <p className="text-sm mt-2 bg-muted/40 p-2 rounded whitespace-pre-wrap">
                          {r.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>

                  {/* Primary speed actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="font-bold gap-1"
                      disabled={busy}
                      onClick={() => doApprove(r, defH)}
                      data-testid={`button-approve-default-${r.id}`}
                    >
                      {busy && approveMut.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve {defH}h
                    </Button>
                    {r.type === "company" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="font-bold"
                        disabled={busy}
                        onClick={() => doApprove(r, 48)}
                      >
                        Approve 48h
                      </Button>
                    )}
                    {r.type === "individual" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="font-bold"
                        disabled={busy}
                        onClick={() => doApprove(r, 48)}
                      >
                        Approve 48h
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setRejectOpen(rejectOpen === r.id ? null : r.id)}
                      data-testid={`button-reject-toggle-${r.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject…
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        adminFetch(`/api/admin/access-requests/${r.id}/to-inquiry`, {
                          method: "POST",
                          body: "{}",
                        })
                          .then(() => toast({ title: "Inquiry created" }))
                          .catch((e: Error) =>
                            toast({
                              title: "Failed",
                              description: e.message,
                              variant: "destructive",
                            }),
                          );
                      }}
                    >
                      → Inquiries
                    </Button>
                  </div>

                  {/* Optional custom hours */}
                  <div className="flex flex-wrap items-end gap-2 pt-1 border-t border-border/40">
                    <div className="space-y-1">
                      <Label className="text-xs">Custom hours</Label>
                      <Input
                        className="w-24 h-8 text-sm"
                        placeholder={String(defH)}
                        value={trialHours[r.id] ?? ""}
                        onChange={(e) =>
                          setTrialHours((h) => ({ ...h, [r.id]: e.target.value }))
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={busy || !trialHours[r.id]}
                      onClick={() => doApprove(r)}
                    >
                      Approve custom
                    </Button>
                  </div>

                  {/* Reject panel with templates */}
                  {rejectOpen === r.id && (
                    <div
                      className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-3"
                      data-testid={`reject-panel-${r.id}`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Reject & notify by email
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {REJECT_NOTE_TEMPLATES.map((t) => (
                          <Button
                            key={t.id}
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs"
                            onClick={() =>
                              setRejectNotes((n) => ({ ...n, [r.id]: t.body }))
                            }
                          >
                            {t.label}
                          </Button>
                        ))}
                      </div>
                      <Textarea
                        rows={3}
                        placeholder="Optional note included in the rejection email…"
                        value={rejectNotes[r.id] ?? ""}
                        onChange={(e) =>
                          setRejectNotes((n) => ({ ...n, [r.id]: e.target.value }))
                        }
                        data-testid={`reject-note-${r.id}`}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="font-bold"
                          disabled={busy}
                          onClick={() => doReject(r)}
                          data-testid={`button-reject-confirm-${r.id}`}
                        >
                          {busy && rejectMut.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-1" />
                          )}
                          Confirm reject & send email
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRejectOpen(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Clients & pipeline</CardTitle>
              <CardDescription>
                Open a record for notes, timeline, won/lost, extend trial, and follow-ups.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                {
                  id: "follow_ups",
                  label: `Follow-ups due${followUpsDue.length ? ` (${followUpsDue.length})` : ""}`,
                },
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
            filteredOrgs.map((org) => {
              const due =
                org.nextFollowUpAt &&
                new Date(org.nextFollowUpAt).getTime() <= Date.now() &&
                !["won", "lost", "churned"].includes(org.pipelineStatus);
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => setSelectedOrgId(org.id)}
                  className={`w-full text-left border rounded-lg p-4 hover:border-primary/50 transition-colors ${
                    due ? "border-amber-500/40 bg-amber-500/5" : "border-border"
                  }`}
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
                        {due && (
                          <Badge className="ml-1 bg-amber-500/20 text-amber-200">Follow-up due</Badge>
                        )}
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
              );
            })
          )}
        </CardContent>
      </Card>

      {requests.filter((r) => r.status !== "pending").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent decisions</CardTitle>
            <CardDescription>
              Resend invite emails or jump to the org. Login link:{" "}
              <button
                type="button"
                className="text-primary underline font-medium"
                onClick={() => copy("Login URL", loginUrl())}
              >
                copy /login
              </button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              {requests
                .filter((r) => r.status !== "pending")
                .slice(0, 20)
                .map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2"
                  >
                    <span>
                      {r.name} · {r.email}
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge variant={r.status === "approved" ? "default" : "secondary"}>
                        {r.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => copy("Email", r.email)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Email
                      </Button>
                      {r.status === "approved" && r.resultingOrgId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setSelectedOrgId(r.resultingOrgId)}
                        >
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
                              .then(() =>
                                toast({
                                  title: "Invite resent · email sent",
                                  description: "New set-password link emailed.",
                                }),
                              )
                              .catch((e: Error) =>
                                toast({
                                  title: "Resend failed",
                                  description: e.message,
                                  variant: "destructive",
                                }),
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
