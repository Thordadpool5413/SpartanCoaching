/**
 * Semantic sections for Trusted AI Result envelopes (HSP-21).
 * Composes inside tool-specific shells (e.g. FieldTalkTrack) without forcing
 * identical visuals across every tool.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TrustedSourceBasis = {
  id: string;
  title: string;
  authority: string;
  kind?: string;
  disclaimer?: string;
};

export type TrustedAiResult = {
  schemaVersion: string;
  toolId: string;
  recommendation?: string;
  suggestedWording?: string;
  whyThisFits?: string;
  nextMove?: string;
  professionalBoundary?: string;
  sourceBasis?: TrustedSourceBasis[];
  spartanMethodologyBasis?: string[];
  providerGuidance?: string;
  uncertainty?: string;
  relatedToolIds?: string[];
  relatedResourceIds?: string[];
  feedback?: { enabled: boolean; hint?: string };
  actions?: { canSave: boolean; canCopy: boolean; canShare: boolean };
  trustNotice?: string;
  plainText?: string;
};

function Section({
  label,
  children,
  tone = "default",
}: {
  label: string;
  children: ReactNode;
  tone?: "default" | "primary" | "muted" | "warn";
}) {
  const border =
    tone === "primary"
      ? "border-primary/25 bg-primary/[0.04]"
      : tone === "warn"
        ? "border-amber-500/30 bg-amber-500/[0.06]"
        : tone === "muted"
          ? "border-border/80 bg-muted/30"
          : "border-border/80 bg-background/40";
  return (
    <section
      className={cn("rounded-xl border px-3.5 py-3 space-y-1.5", border)}
      aria-label={label}
    >
      <h4 className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
        {label}
      </h4>
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </section>
  );
}

const AUTHORITY_LABEL: Record<string, string> = {
  spartan_methodology: "Spartan methodology",
  provider_approved: "Provider-approved",
  cms_policy_snapshot: "Policy snapshot",
  user_supplied_context: "Your context",
  model_generated: "Model-generated",
  unknown: "Unverified",
};

/**
 * Renders semantic trusted-result sections. Pass `omitWording` when the parent
 * already shows the primary talk track to avoid duplication.
 */
export function TrustedAiResultSections({
  result,
  omitWording = false,
  className,
}: {
  result?: TrustedAiResult | null;
  omitWording?: boolean;
  className?: string;
}) {
  if (!result) return null;

  const sources = result.sourceBasis ?? [];
  const method = result.spartanMethodologyBasis ?? [];
  const related = [
    ...(result.relatedToolIds ?? []).map((id) => ({ kind: "tool" as const, id })),
    ...(result.relatedResourceIds ?? []).map((id) => ({
      kind: "resource" as const,
      id,
    })),
  ];

  return (
    <div
      className={cn("space-y-3", className)}
      data-testid="trusted-ai-result-sections"
      role="region"
      aria-label="Trusted AI result details"
    >
      {result.recommendation ? (
        <Section label="Recommendation" tone="primary">
          <p className="whitespace-pre-wrap">{result.recommendation}</p>
        </Section>
      ) : null}

      {!omitWording && result.suggestedWording ? (
        <Section label="Suggested wording" tone="primary">
          <p className="whitespace-pre-wrap max-h-[28rem] overflow-y-auto">
            {result.suggestedWording}
          </p>
        </Section>
      ) : null}

      {result.whyThisFits ? (
        <Section label="Why this approach fits">
          <p className="whitespace-pre-wrap">{result.whyThisFits}</p>
        </Section>
      ) : null}

      {result.nextMove ? (
        <Section label="Next move">
          <p className="whitespace-pre-wrap">{result.nextMove}</p>
        </Section>
      ) : null}

      {result.providerGuidance ? (
        <Section label="Provider guidance">
          <p className="whitespace-pre-wrap">{result.providerGuidance}</p>
        </Section>
      ) : null}

      {method.length > 0 ? (
        <Section label="Spartan methodology basis" tone="muted">
          <ul className="list-disc pl-4 space-y-0.5">
            {method.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {sources.length > 0 ? (
        <Section label="Source basis" tone="muted">
          <ul className="space-y-2">
            {sources.map((s) => (
              <li key={s.id} className="text-xs leading-relaxed">
                <span className="font-semibold text-foreground">{s.title}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {AUTHORITY_LABEL[s.authority] ?? s.authority}
                </span>
                {s.disclaimer ? (
                  <p className="text-muted-foreground mt-0.5">{s.disclaimer}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {result.uncertainty ? (
        <Section label="Uncertainty" tone="warn">
          <p className="whitespace-pre-wrap">{result.uncertainty}</p>
        </Section>
      ) : null}

      {result.professionalBoundary ? (
        <Section label="Professional boundary" tone="muted">
          <p className="whitespace-pre-wrap text-xs">
            {result.professionalBoundary}
          </p>
        </Section>
      ) : null}

      {related.length > 0 ? (
        <Section label="Related">
          <ul className="flex flex-wrap gap-2">
            {related.map((r) => (
              <li
                key={`${r.kind}-${r.id}`}
                className="text-xs rounded-md border border-border px-2 py-1 text-muted-foreground"
              >
                {r.kind === "tool" ? "Tool" : "Resource"}: {r.id}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {result.feedback?.enabled && result.feedback.hint ? (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Feedback: {result.feedback.hint}
        </p>
      ) : null}

      {result.trustNotice ? (
        <p className="text-xs text-muted-foreground border-t border-border/60 pt-2 leading-relaxed">
          {result.trustNotice}
        </p>
      ) : null}
    </div>
  );
}
