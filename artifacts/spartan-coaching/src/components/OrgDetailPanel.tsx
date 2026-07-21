import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { ArrowLeft, Copy, Loader2, Mail } from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import {
  ORG_NOTE_TEMPLATES,
  copyText,
  followUpPreset,
  loginUrl,
} from "@/lib/accessDeskTemplates";

const PIPELINE = [
  { value: "prospect", label: "Prospect" },
  { value: "trial", label: "In trial" },
  { value: "follow_up", label: "Follow-up" },
  { value: "won", label: "Won (active client)" },
  { value: "lost", label: "Lost" },
  { value: "churned", label: "Churned" },
] as const;

type Props = {
  orgId: number;
  onBack: () => void;
};

export function OrgDetailPanel({ orgId, onBack }: Props) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [pipeline, setPipeline] = useState("trial");
  const [followUp, setFollowUp] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [extendHours, setExtendHours] = useState("24");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/organizations", orgId],
    queryFn: () => adminFetch(`/api/admin/organizations/${orgId}`),
  });

  useEffect(() => {
    if (data?.organization) {
      setPipeline(data.organization.pipelineStatus || "trial");
      setLostReason(data.organization.lostReason || "");
      if (data.organization.nextFollowUpAt) {
        const d = new Date(data.organization.nextFollowUpAt);
        const pad = (n: number) => String(n).padStart(2, "0");
        setFollowUp(
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
        );
      } else {
        setFollowUp("");
      }
    }
  }, [data?.organization]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/access-metrics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/access-requests"] });
    refetch();
  };

  const copy = async (label: string, text: string) => {
    const ok = await copyText(text);
    toast({
      title: ok ? "Copied" : "Copy failed",
      description: ok ? label : "Clipboard unavailable",
      variant: ok ? undefined : "destructive",
    });
  };

  const pipelineMut = useMutation({
    mutationFn: () =>
      adminFetch(`/api/admin/organizations/${orgId}/pipeline`, {
        method: "PATCH",
        body: JSON.stringify({
          pipelineStatus: pipeline,
          nextFollowUpAt: followUp ? new Date(followUp).toISOString() : null,
          lostReason: pipeline === "lost" || pipeline === "churned" ? lostReason || null : null,
        }),
      }),
    onSuccess: () => {
      toast({ title: "Pipeline updated" });
      invalidateAll();
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const noteMut = useMutation({
    mutationFn: (body: string) =>
      adminFetch(`/api/admin/organizations/${orgId}/notes`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      toast({ title: "Note added" });
      setNote("");
      invalidateAll();
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const statusMut = useMutation({
    mutationFn: (status: string) =>
      adminFetch(`/api/admin/organizations/${orgId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_data, status) => {
      if (status === "active") {
        toast({
          title: "Client activated · emails sent",
          description: "Membership-active email sent to org members.",
        });
      } else {
        toast({ title: "Access updated", description: `Status → ${status}` });
      }
      invalidateAll();
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const extendMut = useMutation({
    mutationFn: (hours: number) =>
      adminFetch(`/api/admin/organizations/${orgId}/extend-trial`, {
        method: "POST",
        body: JSON.stringify({ hours }),
      }),
    onSuccess: (_data, hours) => {
      toast({
        title: "Trial extended · emails sent",
        description: `+${hours}h. Members notified by email.`,
      });
      invalidateAll();
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const org = data.organization;
  const members = data.members || [];
  const timeline = data.timeline || [];
  const requests = data.requests || [];
  const primaryEmail = members.find((m: any) => m.status !== "disabled")?.email as string | undefined;

  return (
    <div className="space-y-6" data-testid="org-detail-panel">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </Button>
        <h2 className="text-xl font-black font-display">{org.name}</h2>
        <Badge variant="secondary">{org.status}</Badge>
        <Badge>{org.pipelineStatus || "—"}</Badge>
        <Badge variant="outline">{org.type}</Badge>
        {primaryEmail && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onClick={() => copy("Primary email", primaryEmail)}
            >
              <Copy className="w-3.5 h-3.5" />
              Email
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1" asChild>
              <a href={`mailto:${primaryEmail}`}>
                <Mail className="w-3.5 h-3.5" />
                Mail
              </a>
            </Button>
          </>
        )}
        <Button size="sm" variant="ghost" className="h-8" onClick={() => copy("Login URL", loginUrl())}>
          Copy /login
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 border border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <span className="text-muted-foreground">Seats:</span>{" "}
              {members.filter((m: any) => m.status !== "disabled").length}/{org.seatLimit}
            </p>
            <p>
              <span className="text-muted-foreground">Tool uses (7d):</span> {data.usageLast7Days ?? 0}
            </p>
            <p>
              <span className="text-muted-foreground">Onboarding activated:</span>{" "}
              {data.activated ? (
                <span className="text-green-500 font-semibold">
                  Yes ({data.activatedCount}/{members.length} members)
                </span>
              ) : (
                <span className="text-amber-400 font-semibold">Not yet</span>
              )}
            </p>
            {org.trialEndsAt && (
              <p>
                <span className="text-muted-foreground">Trial ends:</span>{" "}
                {new Date(org.trialEndsAt).toLocaleString()}
              </p>
            )}
            {org.activatedAt && (
              <p>
                <span className="text-muted-foreground">Activated:</span>{" "}
                {new Date(org.activatedAt).toLocaleString()}
              </p>
            )}
            <div className="pt-3 space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground">Quick access</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="font-bold"
                  disabled={statusMut.isPending}
                  onClick={() => statusMut.mutate("active")}
                >
                  Activate client
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={statusMut.isPending}
                  onClick={() => statusMut.mutate("expired")}
                >
                  End access
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={statusMut.isPending}
                  onClick={() => statusMut.mutate("suspended")}
                >
                  Suspend
                </Button>
              </div>
              <p className="text-xs font-bold uppercase text-muted-foreground pt-2">Extend trial</p>
              <div className="flex flex-wrap items-end gap-2">
                {[24, 48, 72].map((h) => (
                  <Button
                    key={h}
                    size="sm"
                    variant="secondary"
                    disabled={extendMut.isPending}
                    onClick={() => extendMut.mutate(h)}
                  >
                    +{h}h
                  </Button>
                ))}
              </div>
              <div className="flex items-end gap-2 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs">Custom hours</Label>
                  <Input
                    className="w-24 h-9"
                    value={extendHours}
                    onChange={(e) => setExtendHours(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={extendMut.isPending}
                  onClick={() => extendMut.mutate(Number(extendHours) || 24)}
                >
                  Extend custom
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pipeline & follow-up</CardTitle>
            <CardDescription>
              Won activates access. Churned suspends. Lost keeps access as-is for now.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Pipeline status</Label>
                <Select value={pipeline} onValueChange={setPipeline}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Next follow-up</Label>
                <Input
                  type="datetime-local"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { d: 1, label: "Tomorrow" },
                    { d: 3, label: "+3d" },
                    { d: 7, label: "+7d" },
                    { d: 14, label: "+14d" },
                  ].map((p) => (
                    <Button
                      key={p.d}
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs"
                      onClick={() => setFollowUp(followUpPreset(p.d))}
                    >
                      {p.label}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setFollowUp("")}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
            {(pipeline === "lost" || pipeline === "churned") && (
              <div className="space-y-1">
                <Label>Reason</Label>
                <Input
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  placeholder="Budget, timing, went with competitor…"
                />
              </div>
            )}
            <Button
              className="font-bold"
              disabled={pipelineMut.isPending}
              onClick={() => pipelineMut.mutate()}
            >
              Save pipeline
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              {members.map((m: any) => (
                <li key={m.id} className="flex flex-wrap justify-between gap-2 border-b border-border/40 pb-2">
                  <span>
                    <span className="font-medium">{m.name}</span>
                    <span className="text-muted-foreground"> · {m.email}</span>
                    <button
                      type="button"
                      className="ml-1 inline-flex text-primary hover:underline"
                      onClick={() => copy("Email", m.email)}
                      aria-label={`Copy ${m.email}`}
                    >
                      <Copy className="w-3 h-3 inline" />
                    </button>
                    {m.activated && (
                      <Badge className="ml-2 bg-green-600/20 text-green-400 border-green-600/30 text-[10px]">
                        Activated
                      </Badge>
                    )}
                    {m.jobRole && (
                      <span className="text-muted-foreground text-xs"> · {m.jobRole}</span>
                    )}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {m.role} · {m.status}
                    {typeof m.checklistDone === "number" ? ` · ${m.checklistDone} checklist` : ""}
                    {m.lastLoginAt ? ` · ${new Date(m.lastLoginAt).toLocaleDateString()}` : ""}
                  </span>
                </li>
              ))}
              {members.length === 0 && (
                <p className="text-muted-foreground text-sm">No members</p>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="border border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Add note</CardTitle>
            <CardDescription>Templates speed common CRM updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {ORG_NOTE_TEMPLATES.map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  onClick={() => setNote(t.body)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
            <Textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Call notes, next steps, pricing discussed…"
            />
            <Button
              className="font-bold"
              disabled={!note.trim() || noteMut.isPending}
              onClick={() => noteMut.mutate(note.trim())}
            >
              Save note
            </Button>
            {org.notes && (
              <div className="pt-2">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Sticky notes</p>
                <pre className="text-xs whitespace-pre-wrap text-muted-foreground bg-muted/30 p-3 rounded-md max-h-40 overflow-y-auto">
                  {org.notes}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {timeline.map((t: any) => (
              <li key={t.id} className="border-l-2 border-primary/40 pl-3">
                <p className="text-xs text-muted-foreground">
                  {new Date(t.createdAt).toLocaleString()} · {t.type} · {t.createdBy || "system"}
                </p>
                <p className="text-foreground whitespace-pre-wrap">{t.body}</p>
              </li>
            ))}
            {timeline.length === 0 && (
              <p className="text-muted-foreground">No timeline events yet</p>
            )}
          </ul>
        </CardContent>
      </Card>

      {requests.length > 0 && (
        <Card className="border border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Related access requests</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              {requests.map((r: any) => (
                <li key={r.id} className="flex flex-wrap justify-between gap-2 border-b border-border/40 pb-2">
                  <span>
                    {r.name} · {r.email} · {r.type}
                    <button
                      type="button"
                      className="ml-1 text-primary"
                      onClick={() => copy("Email", r.email)}
                    >
                      <Copy className="w-3 h-3 inline" />
                    </button>
                  </span>
                  <Badge variant="secondary">{r.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
