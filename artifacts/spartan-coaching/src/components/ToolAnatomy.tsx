/**
 * Reusable Hospice Sales Pro tool anatomy (HSP-30) — web.
 * Compose only the sections that add value; do not force every slot.
 */
import type { ReactNode } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StateBlock } from "@/components/StateBlock";
import { ToolResultPanel } from "@/components/ToolResultPanel";
import {
  TOOL_ANATOMY_META,
  type ToolAnatomySectionId,
} from "@/lib/fieldKitCatalog";

function SectionChrome({
  section,
  children,
  className,
  testId,
}: {
  section: ToolAnatomySectionId;
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  const meta = TOOL_ANATOMY_META[section];
  return (
    <section
      className={cn("space-y-2", className)}
      data-testid={testId ?? `tool-anatomy-${section}`}
      aria-label={meta.label}
    >
      <p className="text-[10px] font-bold tracking-widest uppercase text-primary">
        {meta.label}
      </p>
      {children}
    </section>
  );
}

/** Context — title/kicker row when layout is not FieldKitToolLayout. */
export function ToolAnatomyContext({
  title,
  kicker = "Hospice Sales Pro",
  children,
}: {
  title: string;
  kicker?: string;
  children?: ReactNode;
}) {
  return (
    <SectionChrome section="context">
      <p className="text-kicker mb-1">{kicker}</p>
      <h1 className="text-h2 font-bold text-foreground tracking-tight">{title}</h1>
      {children}
    </SectionChrome>
  );
}

/** Guidance — short when/how block (catalog usually via ToolHowTo). */
export function ToolAnatomyGuidance({
  whenToUse,
  children,
}: {
  whenToUse?: string;
  children?: ReactNode;
}) {
  if (!whenToUse && !children) return null;
  return (
    <SectionChrome section="guidance">
      {whenToUse ? (
        <p className="text-sm text-muted-foreground leading-relaxed">{whenToUse}</p>
      ) : null}
      {children}
    </SectionChrome>
  );
}

/** Input — wraps form fields without restyling controls. */
export function ToolAnatomyInput({ children }: { children: ReactNode }) {
  return (
    <SectionChrome section="input" className="space-y-3">
      {children}
    </SectionChrome>
  );
}

/**
 * Result — standard panel with optional empty/loading via ToolResultPanel.
 */
export function ToolAnatomyResult({
  title = "Result",
  children,
  copyText,
  disclaimer,
  loading,
  empty,
  footer,
}: {
  title?: string;
  children?: ReactNode;
  copyText?: string;
  disclaimer?: string;
  loading?: boolean;
  empty?: boolean;
  footer?: ReactNode;
}) {
  return (
    <SectionChrome section="result">
      <ToolResultPanel
        title={title}
        copyText={copyText}
        disclaimer={disclaimer}
        loading={loading}
        empty={empty}
        footer={footer}
      >
        {children}
      </ToolResultPanel>
    </SectionChrome>
  );
}

export function ToolAnatomyWhy({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <SectionChrome section="why">
      <Card className="border border-border/80 bg-muted/30 p-4 text-sm text-foreground leading-relaxed">
        {children}
      </Card>
    </SectionChrome>
  );
}

export function ToolAnatomyNextMove({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <SectionChrome section="next_move">
      <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm text-foreground leading-relaxed">
        {children}
      </div>
    </SectionChrome>
  );
}

export function ToolAnatomySave({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <SectionChrome section="save">{children}</SectionChrome>;
}

export function ToolAnatomyRelated({
  items,
}: {
  items: { href: string; label: string; kind?: string }[];
}) {
  if (!items.length) return null;
  return (
    <SectionChrome section="related">
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted/50"
            >
              {item.label}
              {item.kind ? (
                <span className="ml-1 text-muted-foreground font-normal">
                  · {item.kind}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </SectionChrome>
  );
}

export function ToolAnatomyEvidence({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <SectionChrome section="evidence">
      <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
        {children}
      </div>
    </SectionChrome>
  );
}

/** Feedback — locked / empty / loading / error / offline / success */
export function ToolAnatomyFeedback({
  variant,
  title,
  description,
  action,
}: {
  variant: "loading" | "empty" | "error" | "success";
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
}) {
  return (
    <SectionChrome section="feedback">
      <StateBlock
        variant={variant}
        title={title}
        description={description}
        action={action}
      />
    </SectionChrome>
  );
}

/** Locked / paywall-adjacent note (does not replace FieldKitGate). */
export function ToolAnatomyLocked({
  title = "Live generation locked",
  description = "Browse the interface free. Subscribe or start evaluation to run live AI.",
  href = "/account",
}: {
  title?: string;
  description?: string;
  href?: string;
}) {
  return (
    <ToolAnatomyFeedback
      variant="empty"
      title={title}
      description={description}
      action={{ label: "Account & access", href }}
    />
  );
}
