import { useMemo } from "react";
import { Link } from "wouter";
import {
  type Actor,
} from "@workspace/hospice-sales-runtime/sales-workflow";
import { createWorkflowHttpClient } from "@workspace/hospice-sales-runtime/sales-workflow/http-client";
import { SalesWorkflowPanel } from "@workspace/hospice-sales-runtime/sales-workflow/react";
import "@workspace/hospice-sales-runtime/sales-workflow/styles.css";
import { toWorkflowUuid } from "@workspace/tenant-ids";
import { useAuth } from "@/context/AuthContext";
import { SEO } from "@/components/SEO";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bell, CheckCircle2, Clock3, Gauge, Loader2, Wrench } from "lucide-react";
import { ToolAnatomyRelated } from "@/components/ToolAnatomy";
import {
  getToolById,
  recommendRelated,
  relatedToAnatomyItems,
} from "@/lib/fieldKitCatalog";
import { UX_WORKSPACE_IMPROVEMENTS } from "@/lib/workspaceUxFlag";

export default function SalesWorkflow() {
  const { member, isLoading, isAuthenticated } = useAuth();
  const api = useMemo(
    () =>
      createWorkflowHttpClient({
        baseUrl: "/api/v1/sales-workflow",
        fetch: (input, init) => fetch(input, { ...init, credentials: "include" }),
      }),
    [],
  );

  const relatedItems = useMemo(
    () =>
      relatedToAnatomyItems(
        recommendRelated(
          "sales-workflow",
          {
            platform: "web",
            contextTags: ["prepare", "follow_up", "account"],
            limit: 4,
            canUseFieldKit: !!member,
          },
          getToolById,
        ),
      ),
    [member],
  );

  if (isLoading) {
    return (
      <FieldKitToolLayout toolPath="/tools/sales-workflow">
        <SEO title="Sales Command Center | Spartan Coaching" />
        <div className="flex flex-col items-center justify-center py-24 gap-3" data-testid="command-loading">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Command Center…</p>
        </div>
      </FieldKitToolLayout>
    );
  }

  if (!member) {
    // View-only shell so non-subscribers still see what Command Center looks like
    // (RequireFieldKit preview lock blocks real use when gated).
    return (
      <FieldKitToolLayout toolPath="/tools/sales-workflow">
        <SEO title="Sales Command Center | Spartan Coaching" />
        <div className="space-y-6" data-testid="command-preview-shell">
          <div className="mb-2 space-y-1">
            <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
              Hospice Sales Pro · Daily spine
            </p>
            <h1 className="text-2xl font-black text-foreground">Sales Command Center</h1>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              Plan calls, practice objections, complete visits, review coaching, and schedule the next
              step — one continuous account workflow.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="border-b border-border px-4 py-3 flex flex-wrap gap-2 bg-muted/40">
                {["Queue", "Pre-call", "Practice", "Visit", "Debrief", "Next step"].map((tab, i) => (
                  <span
                    key={tab}
                    className={
                      i === 0
                        ? "text-xs font-bold px-2.5 py-1 rounded-md bg-primary/15 text-primary"
                        : "text-xs font-semibold px-2.5 py-1 rounded-md text-muted-foreground"
                    }
                  >
                    {tab}
                  </span>
                ))}
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      Today&apos;s queue
                    </p>
                    <p className="text-sm font-bold text-foreground mt-0.5">3 accounts · 1 high priority</p>
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground border border-border rounded-md px-2 py-1">
                    Sample data
                  </span>
                </div>
                {[
                  { name: "St. Mary's SNF", meta: "Follow-up · Objection: preferred hospice", tag: "High" },
                  { name: "Riverside Home Health", meta: "First visit · Cold opener ready", tag: "Warm" },
                  { name: "Dr. Chen clinic", meta: "Debrief pending · Next step open", tag: "Open" },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">{row.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{row.meta}</p>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary/80 shrink-0">
                      {row.tag}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
                  Live queue, prep, practice, and outcome capture unlock with membership.
                </p>
              </div>
          </div>
          {!isAuthenticated && (
            <div className="flex justify-center">
              <Button asChild className="font-bold" variant="outline">
                <Link href="/login">Sign in to run live Command Center</Link>
              </Button>
            </div>
          )}
        </div>
      </FieldKitToolLayout>
    );
  }

  const administrator = member.role === "org_admin" || member.role === "platform_admin";
  const actor: Actor = {
    organizationId: toWorkflowUuid("organization", member.organizationId),
    userId: toWorkflowUuid("member", member.id),
    role: administrator ? "manager" : "rep",
    teamIds: [],
    territoryIds: [],
  };

  return (
    <FieldKitToolLayout toolPath="/tools/sales-workflow">
      <SEO
        title="Sales Command Center | Spartan Coaching"
        description="Plan calls, practice objections, complete visits, review coaching, and schedule the next step."
      />
      <div className="command-intro mb-5">
        <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
          Hospice Sales Pro · Daily spine
        </p>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Your daily account workflow. Start by scheduling a call, prepare the conversation, then record what happened and the next commitment.
        </p>
      </div>
      {UX_WORKSPACE_IMPROVEMENTS ? (
        <section className="mb-6 rounded-xl border border-primary/20 bg-primary/[0.04] p-4" aria-labelledby="command-how-it-works" data-testid="command-how-it-works">
          <p className="text-xs font-black uppercase tracking-widest text-primary">How it works</p>
          <h2 id="command-how-it-works" className="mt-1 text-lg font-black text-foreground">Schedule → prepare → close the loop</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Example: prepare for tomorrow’s referral-source visit, choose the intended outcome, then record one clear next commitment.</p>
        </section>
      ) : null}
      {!UX_WORKSPACE_IMPROVEMENTS ? <section className="command-dashboard-grid mb-6" aria-label="Command Center overview">
        <article className="command-dashboard-card command-dashboard-overview">
          <div className="command-dashboard-icon"><Gauge /></div>
          <div><p className="command-dashboard-label">Overview</p><h2>Run today with one clear next move.</h2><p>Schedule the conversation, prepare deliberately, then capture the outcome before the context disappears.</p></div>
        </article>
        <article className="command-dashboard-card">
          <div className="command-dashboard-icon"><Wrench /></div>
          <div><p className="command-dashboard-label">Quick actions</p><h2>Prepare before you walk in</h2><div className="command-dashboard-actions"><Button asChild size="sm"><Link href="/tools">Open Tools</Link></Button><Button asChild size="sm" variant="outline"><Link href="/portal/coach">Ask Coach</Link></Button></div></div>
        </article>
        <article className="command-dashboard-card">
          <div className="command-dashboard-icon"><Bell /></div>
          <div><p className="command-dashboard-label">Notifications</p><h2>You are caught up</h2><p>New reminders and sync warnings will appear here.</p></div>
        </article>
        <article className="command-dashboard-card">
          <div className="command-dashboard-icon"><Clock3 /></div>
          <div><p className="command-dashboard-label">Recent activity</p><h2>Continue your latest work</h2><Button asChild variant="ghost" className="mt-2 h-auto p-0"><Link href="/my-work">Open My Work <ArrowRight /></Link></Button></div>
        </article>
      </section> : (
        <section className="command-focus-bar mb-6" aria-label="Command Center next action">
          <div>
            <p className="command-dashboard-label">Start here</p>
            <h2>Schedule the next conversation.</h2>
            <p>Everything below supports one loop: schedule, prepare, record the outcome, and protect the next commitment.</p>
          </div>
          <div className="command-focus-actions">
            <Button asChild><a href="#hsw-main">Open today</a></Button>
            <Button asChild variant="outline"><Link href="/portal/coach">Ask Coach</Link></Button>
          </div>
        </section>
      )}
      <section className="command-flight-plan mb-6 grid gap-3 sm:grid-cols-3" aria-label="How to use Sales Command Center" data-testid="command-getting-started">
        {[
          ["1. Schedule", "Add the facility or professional you plan to contact. Never enter patient information."],
          ["2. Prepare", "Set the purpose, talk track, and one clear outcome before the conversation."],
          ["3. Close the loop", "Capture the result and schedule the next step while it is still fresh."],
        ].map(([title, body]) => (
          <div key={title} className="command-flight-step flex gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div><p className="text-sm font-bold text-foreground">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p></div>
          </div>
        ))}
      </section>
      <div className="command-surface space-y-5">
        <SalesWorkflowPanel
          api={api}
          actor={actor}
          theme={{
            "--hsw-accent": "hsl(var(--primary))",
            "--hsw-ink": "hsl(var(--foreground))",
            "--hsw-muted": "hsl(var(--muted-foreground))",
            "--hsw-surface": "hsl(var(--card))",
            "--hsw-border": "hsl(var(--border))",
            "--hsw-paper": "hsl(var(--background))",
            "--hsw-card": "hsl(var(--card))",
            "--hsw-line": "hsl(var(--border))",
            "--hsw-moss": "hsl(var(--foreground))",
            "--hsw-coral": "hsl(var(--primary))",
            "--hsw-gold": "hsl(var(--primary))",
            "--hsw-font-display": "var(--font-display)",
            "--hsw-font-body": "var(--font-sans)",
          }}
        />
        <ToolAnatomyRelated items={relatedItems} />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/50 p-4">
          <p className="text-sm text-muted-foreground">Need a script, objection response, or rehearsal before the call?</p>
          <Button asChild variant="outline" size="sm"><Link href="/tools">Open supporting tools <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </div>
    </FieldKitToolLayout>
  );
}
