import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BrainCircuit,
  ChevronRight,
  ShieldCheck,
  Wrench,
  ArrowLeft,
  Sparkles,
  Lock,
} from "lucide-react";
import { SPARTAN_AI_TOOLS } from "@workspace/spartan-ai-tools";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { SEO } from "@/components/SEO";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

/** Left accent rail by tool category — instrument feel, not rainbow noise */
const CATEGORY_RAIL: Record<string, string> = {
  Content: "bg-sky-500",
  Learning: "bg-violet-500",
  Sales: "bg-primary",
  Clinical: "bg-amber-600",
  Compliance: "bg-emerald-600",
};

/**
 * Advanced library under Field Kit — not a second competing product.
 * Field AI vs Clinical vault are visually distinct surfaces.
 */
export default function AiToolsHub() {
  const { isAuthenticated, canUseFieldKit } = useAuth();
  const [availability, setAvailability] = useState<
    Map<string, { enabled: boolean }> | null
  >(null);
  const [catalogError, setCatalogError] = useState("");
  const loadCatalog = useCallback(async () => {
    setCatalogError("");
    try {
      const response = await fetch("/api/ai-tools", {
        credentials: "include",
      });
      if (response.status === 401 || response.status === 403) {
        setAvailability(
          new Map(
            SPARTAN_AI_TOOLS.map((tool) => [
              tool.id,
              { enabled: false },
            ]),
          ),
        );
        return;
      }
      if (!response.ok) throw new Error("Catalog unavailable");
      const body = (await response.json()) as {
        tools: Array<{ id: string; availability: { enabled: boolean } }>;
      };
      setAvailability(
        new Map(body.tools.map((tool) => [tool.id, tool.availability])),
      );
    } catch {
      setAvailability(new Map());
      setCatalogError(
        "The authorized tool catalog could not be loaded. Tools remain locked.",
      );
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const authorizedTools = useMemo(
    () =>
      availability
        ? SPARTAN_AI_TOOLS.filter((tool) => availability.has(tool.id))
        : [],
    [availability],
  );
  const fieldFacing = authorizedTools.filter((t) => !t.containsPhi);
  const clinical = authorizedTools.filter((t) => t.containsPhi);

  const toolCard = (
    tool: (typeof SPARTAN_AI_TOOLS)[number],
    variant: "field" | "vault",
  ) => {
    const enabled = availability?.get(tool.id)?.enabled === true;
    const previewAvailable = !isAuthenticated || !canUseFieldKit;
    const canOpen = enabled || previewAvailable;
    const rail = CATEGORY_RAIL[tool.category] ?? "bg-muted-foreground";
    const card = (
      <Card
        className={cn(
          "relative h-full overflow-hidden border-border p-5 pl-6 transition-colors duration-200",
          variant === "vault" && "border-amber-500/25 bg-card/90",
          canOpen
            ? "group-hover:border-primary/50 group-hover:bg-muted/25"
            : "opacity-70",
        )}
      >
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-1 rounded-l-2xl",
            rail,
          )}
          aria-hidden
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="outline">{tool.category}</Badge>
              {tool.containsPhi && (
                <Badge
                  variant="secondary"
                  className="gap-1 border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Clinical vault
                </Badge>
              )}
              {!enabled && (
                <Badge variant="secondary" className="gap-1">
                  {previewAvailable ? (
                    <>Preview · sign in to run</>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      Not enabled
                    </>
                  )}
                </Badge>
              )}
              {enabled && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                >
                  Ready
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-display font-bold tracking-tight text-foreground">
              {tool.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {tool.description}
            </p>
          </div>
          {canOpen && (
            <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          )}
        </div>
      </Card>
    );
    return canOpen ? (
      <Link key={tool.id} href={tool.webPath} className="group">
        {card}
      </Link>
    ) : (
      <div key={tool.id} aria-disabled="true">
        {card}
      </div>
    );
  };

  return (
    <FieldKitToolLayout title="Advanced library" showHowTo={false}>
      <SEO
        title="Advanced Field Kit Library | Spartan Coaching"
        description="Advanced Field Kit tools plus permission-controlled clinical workflows. Primary daily tools live in the main Field Kit catalog."
      />
      <div className="mb-8 max-w-3xl space-y-4">
        <Button asChild variant="ghost" size="sm" className="font-semibold -ml-2">
          <Link href="/tools">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Field Kit tools
          </Link>
        </Button>
        <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BrainCircuit className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-display font-black tracking-tight sm:text-4xl text-foreground">
          Advanced library
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          Specialized workflows with typed inputs. Your{" "}
          <strong className="text-foreground">daily kit</strong> (
          {FIELD_KIT_TOOLS.filter((t) => t.id !== "brand-video").length} tools —
          Command Center, objections, plans, calculators) lives on the main Tools
          page. Clinical tools sit in a separate vault surface below.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="font-bold">
            <Link href="/tools">
              <Wrench className="mr-2 h-4 w-4" />
              Open primary Field Kit tools
            </Link>
          </Button>
          {clinical.length > 0 && (
            <Button asChild variant="outline" className="font-bold">
              <a href="#clinical-vault">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Jump to clinical vault
              </a>
            </Button>
          )}
        </div>
      </div>

      {availability === null && (
        <div
          role="status"
          className="mb-8 space-y-3 animate-pulse"
          aria-label="Loading catalog"
        >
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 rounded-2xl border border-border bg-muted/40" />
            ))}
          </div>
        </div>
      )}
      {catalogError && (
        <div role="alert" className="mb-8 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm text-destructive font-medium">{catalogError}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check your connection, then retry. If this persists, contact support.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadCatalog()}>
              Retry
            </Button>
            <Button asChild variant="ghost">
              <Link href="/contact">Contact support</Link>
            </Button>
          </div>
        </div>
      )}

      {fieldFacing.length > 0 && (
        <section className="mb-14" data-testid="section-ai-field-tools">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground tracking-tight">
                Field AI
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                Content, learning, and sales enablement — no PHI. Same ethics as the
                main Field Kit. Use these between coaching sessions for specialized runs.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {fieldFacing.map((tool) => toolCard(tool, "field"))}
          </div>
        </section>
      )}

      {clinical.length > 0 && (
        <section
          id="clinical-vault"
          data-testid="section-ai-clinical-vault"
          className="scroll-mt-24"
        >
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-card to-card p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/25">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-2">
                <h2 className="text-xl font-display font-bold text-foreground tracking-tight">
                  Clinical access vault
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  These workflows may process clinical content under authorized access
                  only. They are <strong className="text-foreground">not</strong> the
                  consumer Field Kit tools marketed as no-PHI field execution. Runs are
                  ephemeral when live — use only when your role and organization permit.
                </p>
                <ul className="flex flex-wrap gap-2 pt-1">
                  {[
                    "Authorized roles only",
                    "Ephemeral by design",
                    "BAA-gated PHI mode",
                    "No sales chrome inside tools",
                  ].map((chip) => (
                    <li
                      key={chip}
                      className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md border border-amber-500/25 bg-background/60 text-foreground"
                    >
                      {chip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clinical.map((tool) => toolCard(tool, "vault"))}
          </div>
        </section>
      )}
    </FieldKitToolLayout>
  );
}
