import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBillingActions } from "@/hooks/useBillingActions";
import {
  fetchBillingStatus,
  type BillingStatusResponse,
} from "@/lib/billingClient";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { FIELD_KIT_TOOLS, FIELD_KIT_CATEGORIES } from "@workspace/field-kit-catalog";

function queryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

export default function Account() {
  const { member, organization, fieldKit, isAuthenticated, isLoading, logout, canUseFieldKit, refresh } =
    useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { startCheckout, openPortal, checkoutPending, portalPending } = useBillingActions();
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
  const [billing, setBilling] = useState<BillingStatusResponse | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Post-checkout / portal return banners
  useEffect(() => {
    const billingQ = queryParam("billing");
    if (!billingQ) return;
    if (billingQ === "success") {
      toast({
        title: "Payment received",
        description: "Refreshing your membership — Field Kit unlocks when the subscription is active.",
      });
      void refresh();
    } else if (billingQ === "canceled") {
      toast({
        title: "Checkout canceled",
        description: "No charge was made. You can subscribe anytime from this page.",
      });
    } else if (billingQ === "portal") {
      void refresh();
    }
    // Clean query string without full reload
    const url = new URL(window.location.href);
    url.searchParams.delete("billing");
    url.searchParams.delete("session_id");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [toast, refresh]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setBillingLoading(true);
    fetchBillingStatus()
      .then((data) => setBilling(data))
      .catch(() => setBilling(null))
      .finally(() => setBillingLoading(false));
  }, [isAuthenticated, organization?.status, organization?.billingStatus]);

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

  const org = organization;
  const billingOrg = billing?.organization;
  const isPersonal = org?.type === "personal";
  const isCompany = org?.type === "company";
  const isPlatform = org?.type === "platform" || member.role === "platform_admin";
  const isComp = billingOrg?.billingPlan === "comp" || org?.billingPlan === "comp";
  const hasPaidSub =
    Boolean(billingOrg?.hasStripeSubscription || org?.hasStripeSubscription) &&
    (billingOrg?.billingStatus === "active" ||
      billingOrg?.billingStatus === "trialing" ||
      org?.billingStatus === "active" ||
      org?.billingStatus === "trialing" ||
      (org?.status === "active" && (billingOrg?.hasStripeSubscription || org?.hasStripeSubscription)));
  const cancelAtPeriodEnd = Boolean(
    billingOrg?.cancelAtPeriodEnd ?? org?.cancelAtPeriodEnd,
  );
  const periodEnd = billingOrg?.currentPeriodEnd || org?.currentPeriodEnd;
  // Show Subscribe for personal accounts even if billing/status is still loading —
  // checkout API will return a clear error if Stripe secrets are missing.
  const canCheckout =
    isPersonal &&
    !isPlatform &&
    !isComp &&
    !hasPaidSub &&
    (org?.status === "trial" ||
      org?.status === "expired" ||
      org?.status === "suspended" ||
      org?.status === "active" ||
      !org?.status);
  const canPortal =
    Boolean(billing?.canOpenPortal) ||
    Boolean(billingOrg?.hasStripeCustomer || org?.hasStripeCustomer);

  const statusLabel =
    org?.status === "trial"
      ? "Evaluation"
      : org?.status === "active"
        ? cancelAtPeriodEnd
          ? "Active · canceling"
          : hasPaidSub
            ? "Active · weekly"
            : isComp
              ? "Active · complimentary"
              : "Active client"
        : org?.status === "expired"
          ? "Ended"
          : org?.status === "suspended"
            ? "Suspended"
            : org?.status || "—";

  const membershipBlurb =
    org?.status === "trial"
      ? "You are on a timed evaluation. Tools stay unlocked until the window ends. Individuals can continue for $14.99/week — cancel anytime from Manage billing."
      : org?.status === "active" && hasPaidSub
        ? cancelAtPeriodEnd
          ? "Your subscription is set to cancel at the end of the current period. You keep Field Kit access until then. You can reverse cancel in Manage billing."
          : "Your weekly Field Kit subscription is active. Use Manage billing to update payment method or cancel (access continues until the period ends)."
        : org?.status === "active" && isComp
          ? "Complimentary access is active. No self-serve charge. Contact Nick if you need changes."
        : org?.status === "active" && isCompany
          ? "Team access is active under your provider contract (per-seat weekly). Seat changes go through your org admin or Nick."
        : org?.status === "active"
          ? "Continuing client access is active."
        : org?.status === "expired"
          ? "Access has ended. Individuals can re-subscribe for $14.99/week. Teams: contact us to renew under contract."
        : org?.status === "suspended"
          ? "Access is suspended (often a failed payment). Update your card in Manage billing or contact support."
          : "Your membership status will appear here once access is assigned.";

  const hoursLeft = fieldKit?.hoursRemaining;
  const hoursLabel =
    hoursLeft == null
      ? null
      : hoursLeft < 1
        ? `${Math.max(1, Math.round(hoursLeft * 60))} minutes left`
        : hoursLeft < 48
          ? `${Math.round(hoursLeft)} hours left`
          : `${Math.round(hoursLeft / 24)} days left`;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12 space-y-8" data-testid="page-account">
      <SEO />
      <div>
        <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">Account</p>
        <h1 className="text-h1 font-display font-black">Your access</h1>
      </div>

      <Card className="border border-border bg-card p-6 space-y-4" data-testid="card-membership-status">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{statusLabel}</Badge>
          {canUseFieldKit ? (
            <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Field Kit unlocked</Badge>
          ) : (
            <Badge variant="destructive">Field Kit locked</Badge>
          )}
          {isCompany && <Badge variant="outline">Team / company</Badge>}
          {isPersonal && <Badge variant="outline">Individual</Badge>}
          {hasPaidSub && <Badge variant="outline">$14.99/wk</Badge>}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-3">
          {membershipBlurb}
        </p>
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
            <dd className="font-semibold">{org?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-semibold">
              {member.role === "platform_admin"
                ? "Platform admin"
                : member.role === "org_admin"
                  ? "Organization admin"
                  : "Member"}
            </dd>
          </div>
          {org?.status === "trial" && fieldKit?.trialEndsAt && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Evaluation ends</dt>
              <dd className="font-semibold">
                {new Date(fieldKit.trialEndsAt).toLocaleString()}
                {hoursLabel ? ` · ${hoursLabel}` : ""}
              </dd>
            </div>
          )}
          {(periodEnd || billingOrg?.billingStatus || org?.billingStatus) && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Billing</dt>
              <dd className="font-semibold">
                {isComp
                  ? "Complimentary (no card on file)"
                  : hasPaidSub
                    ? cancelAtPeriodEnd
                      ? `Cancels ${periodEnd ? new Date(periodEnd).toLocaleDateString() : "at period end"}`
                      : `Weekly · renews ${periodEnd ? new Date(periodEnd).toLocaleDateString() : "automatically"}`
                    : isCompany
                      ? org?.contractRef
                        ? `Contract ${org.contractRef}`
                        : "Contract / team seats"
                      : billing?.configured === false
                        ? "Billing not configured on server yet"
                        : "No active subscription"}
                {(billingOrg?.billingStatus || org?.billingStatus) && !isComp && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    · status: {billingOrg?.billingStatus || org?.billingStatus}
                  </span>
                )}
              </dd>
            </div>
          )}
        </dl>

        {/* Billing actions */}
        <div
          className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4 space-y-3"
          data-testid="card-billing-actions"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CreditCard className="w-4 h-4 text-primary" />
            Membership &amp; billing
          </div>
          {isPersonal && !isPlatform && (
            <div>
              <p className="text-3xl font-black text-primary tracking-tight">
                $14.99
                <span className="text-sm font-semibold text-muted-foreground"> / week</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Individual Field Kit · auto-renew · cancel anytime from Manage billing
              </p>
            </div>
          )}
          {billingLoading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading billing…
            </p>
          ) : (
            <>
              {isPersonal && !isPlatform && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Subscribe securely with Stripe. Cancel anytime — you keep access until the paid period ends. Failed
                  payments may lock tools until the card is updated.
                </p>
              )}
              {isCompany && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Team seats are billed under your provider contract (weekly per seat). For seat or rate changes,{" "}
                  <Link href="/contact?service=Field+Kit+Membership" className="text-primary hover:underline">
                    contact Nick
                  </Link>
                  . Past-due invoices may suspend access for the whole org.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {canCheckout && (
                  <Button
                    className="font-bold"
                    onClick={startCheckout}
                    disabled={checkoutPending}
                    data-testid="button-subscribe"
                  >
                    {checkoutPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…
                      </>
                    ) : (
                      <>Subscribe · $14.99/week</>
                    )}
                  </Button>
                )}
                {canPortal && (
                  <Button
                    variant={canCheckout ? "outline" : "default"}
                    className="font-bold"
                    onClick={openPortal}
                    disabled={portalPending}
                    data-testid="button-manage-billing"
                  >
                    {portalPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening…
                      </>
                    ) : (
                      <>
                        Manage billing / cancel
                        <ExternalLink className="w-3.5 h-3.5 ml-2" />
                      </>
                    )}
                  </Button>
                )}
                {!canCheckout && !canPortal && isPersonal && !isPlatform && (
                  <p className="text-sm text-muted-foreground">
                    {billing?.configured === false || !billing?.individualWeeklyPriceConfigured
                      ? "Self-serve billing is not fully configured yet. Contact Nick to continue as a client."
                      : "Billing actions will appear when your account is eligible."}
                  </p>
                )}
                {isPlatform && (
                  <p className="text-sm text-muted-foreground">Platform admin accounts are not billed.</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          {canUseFieldKit && (
            <Button asChild className="font-bold">
              <Link href="/portal">Open Field Kit home</Link>
            </Button>
          )}
          {!canUseFieldKit && org?.status === "expired" && !canCheckout && (
            <>
              <Button asChild className="font-bold">
                <Link href="/contact?service=Field+Kit+Membership">Continue as a client</Link>
              </Button>
              <Button asChild variant="outline" className="font-bold">
                <Link href="/field-kit-membership">Membership options</Link>
              </Button>
            </>
          )}
          {org?.status === "trial" && (
            <Button asChild variant="outline" className="font-bold">
              <Link href="/contact?service=Field+Kit+Debrief">Book a debrief</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="font-bold">
            <Link href="/field-kit-membership">View plans</Link>
          </Button>
          <Button asChild variant="ghost" className="font-bold">
            <Link href="/contact">Book a strategy call</Link>
          </Button>
          <Button variant="ghost" onClick={handleLogout} data-testid="button-logout">
            Sign out
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t border-border/60">
          Auto-renew and cancel: individuals cancel anytime via Manage billing (access through period end). Corporate
          terms follow your contract. See{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms
          </Link>
          {" · "}
          <Link href="/field-kit-membership" className="text-primary hover:underline">
            Membership
          </Link>
          .
        </p>
      </Card>

      {/* ── Your Field Kit — active subscriber confirmation card ── */}
      {canUseFieldKit && hasPaidSub && (
        <Card className="border border-border bg-card p-6 space-y-4" data-testid="card-your-field-kit">
          <div>
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1">Your Field Kit</p>
            <h2 className="text-lg font-bold text-foreground">13 private tools — all unlocked</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Access everything below from the{" "}
              <Link href="/portal" className="text-primary hover:underline font-semibold">
                Field Kit home
              </Link>{" "}
              or directly via the links.
            </p>
          </div>
          <div className="space-y-4">
            {FIELD_KIT_CATEGORIES.filter((cat) =>
              FIELD_KIT_TOOLS.some((t) => !t.public && t.category === cat),
            ).map((cat) => {
              const tools = FIELD_KIT_TOOLS.filter((t) => !t.public && t.category === cat);
              return (
                <div key={cat}>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{cat}</p>
                  <div className="grid sm:grid-cols-2 gap-1.5">
                    {tools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={tool.path}
                        className="flex items-start gap-2 p-2.5 rounded-md border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        data-testid={`field-kit-tool-${tool.id}`}
                      >
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-foreground leading-tight">{tool.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{tool.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-2 border-t border-border/60">
            <Button asChild className="font-bold">
              <Link href="/portal">Open Field Kit home</Link>
            </Button>
          </div>
        </Card>
      )}

      {member.role === "org_admin" && organization?.type === "company" && (
        <Card className="border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold">Team seats</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {members.filter((m) => m.status !== "disabled").length}
              {seatLimit != null ? ` / ${seatLimit}` : ""} seats in use
              {billingOrg?.billableSeats != null ? ` · ${billingOrg.billableSeats} billed` : ""}
            </p>
          </div>

          <ul className="space-y-2 text-sm">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-2 border-b border-border/60 pb-2 items-center">
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

      <Card className="border border-border bg-card p-6 space-y-4">
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

      <Card className="border border-border bg-card p-6 space-y-4">
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
        <Card className="border border-border bg-card p-6 space-y-4" data-testid="org-usage">
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
                    <li key={t.toolName} className="flex justify-between gap-2 border-b border-border/60 pb-1">
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
                    <li key={m.email} className="flex justify-between gap-2 border-b border-border/60 pb-1">
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
