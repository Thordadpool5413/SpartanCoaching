import { useMemo } from "react";
import { Link } from "wouter";
import {
  type Actor,
} from "@workspace/hospice-sales-runtime/sales-workflow";
import { createWorkflowHttpClient } from "@workspace/hospice-sales-runtime/sales-workflow/http-client";
import { SalesWorkflowPanel } from "@workspace/hospice-sales-runtime/sales-workflow/react";
import "@workspace/hospice-sales-runtime/sales-workflow/styles.css";
import { useAuth } from "@/context/AuthContext";
import { SEO } from "@/components/SEO";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { NpiLookupPanel } from "@/components/NpiLookupPanel";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function workflowUuid(kind: "organization" | "member", value: number): string {
  const suffix = value.toString(16).padStart(12, "0").slice(-12);
  return `00000000-0000-5000-${kind === "organization" ? "8" : "9"}000-${suffix}`;
}

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
              Membership · Daily spine
            </p>
            <h1 className="text-2xl font-black text-foreground">Sales Command Center</h1>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              Plan calls, practice objections, complete visits, review coaching, and schedule the next
              step — one continuous account workflow.
            </p>
          </div>
          <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
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
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">NPI lookup</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pull facility context before the visit — available when Command Center is unlocked.
              </p>
              <div className="h-9 rounded-md border border-border bg-background/80" />
              <div className="h-9 rounded-md border border-border bg-background/50 w-2/3" />
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
    organizationId: workflowUuid("organization", member.organizationId),
    userId: workflowUuid("member", member.id),
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
          Membership · Daily spine
        </p>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Run every account through this workflow. Satellite tools (objections, role-play, email, weekly plan)
          support the next call—they do not replace it.
        </p>
      </div>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <SalesWorkflowPanel
          api={api}
          actor={actor}
          theme={{
            "--hsw-accent": "hsl(var(--primary))",
            "--hsw-ink": "hsl(var(--foreground))",
            "--hsw-muted": "hsl(var(--muted-foreground))",
            "--hsw-surface": "hsl(var(--card))",
            "--hsw-border": "hsl(var(--border))",
          }}
        />
        <div className="lg:sticky lg:top-4 space-y-4">
          <NpiLookupPanel />
        </div>
      </div>
    </FieldKitToolLayout>
  );
}
