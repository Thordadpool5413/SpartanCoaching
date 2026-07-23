import { useMemo } from "react";
import {
  type Actor,
} from "@workspace/hospice-sales-runtime/sales-workflow";
import { createWorkflowHttpClient } from "@workspace/hospice-sales-runtime/sales-workflow/http-client";
import { SalesWorkflowPanel } from "@workspace/hospice-sales-runtime/sales-workflow/react";
import "@workspace/hospice-sales-runtime/sales-workflow/styles.css";
import { useAuth } from "@/context/AuthContext";
import { SEO } from "@/components/SEO";

function workflowUuid(kind: "organization" | "member", value: number): string {
  const suffix = value.toString(16).padStart(12, "0").slice(-12);
  return `00000000-0000-5000-${kind === "organization" ? "8" : "9"}000-${suffix}`;
}

export default function SalesWorkflow() {
  const { member } = useAuth();
  const api = useMemo(
    () =>
      createWorkflowHttpClient({
        baseUrl: "/api/v1/sales-workflow",
        fetch: (input, init) => fetch(input, { ...init, credentials: "include" }),
      }),
    [],
  );

  if (!member) return null;

  const administrator = member.role === "org_admin" || member.role === "platform_admin";
  const actor: Actor = {
    organizationId: workflowUuid("organization", member.organizationId),
    userId: workflowUuid("member", member.id),
    role: administrator ? "manager" : "rep",
    teamIds: [],
    territoryIds: [],
  };

  return (
    <>
      <SEO
        title="Sales Command Center | Spartan Coaching"
        description="Plan calls, practice objections, complete visits, review coaching, and schedule the next step."
      />
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
    </>
  );
}
