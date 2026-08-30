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
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { ToolAnatomyRelated } from "@/components/ToolAnatomy";
import {
  getToolById,
  recommendRelated,
  relatedToAnatomyItems,
} from "@/lib/fieldKitCatalog";

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
      <div className="mb-4 space-y-1">
        <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
          Hospice Sales Pro · Daily spine
        </p>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Your daily account workflow. Start by scheduling a call, prepare the conversation, then record what happened and the next commitment.
        </p>
      </div>
      <section className="mb-5 grid gap-3 rounded-xl border border-border/80 bg-card/70 p-4 sm:grid-cols-3" aria-label="How to use Sales Command Center" data-testid="command-getting-started">
        {[
          ["1. Schedule", "Add the facility or professional you plan to contact. Never enter patient information."],
          ["2. Prepare", "Set the purpose, talk track, and one clear outcome before the conversation."],
          ["3. Close the loop", "Capture the result and schedule the next step while it is still fresh."],
        ].map(([title, body]) => (
          <div key={title} className="flex gap-3 rounded-lg bg-background/50 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div><p className="text-sm font-bold text-foreground">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p></div>
          </div>
        ))}
      </section>
      <div className="space-y-5">
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
