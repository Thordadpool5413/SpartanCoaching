import { Link } from "wouter";
import { BrainCircuit, ChevronRight, ShieldCheck, Wrench, ArrowLeft } from "lucide-react";
import { SPARTAN_AI_TOOLS } from "@workspace/spartan-ai-tools";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { SEO } from "@/components/SEO";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";

/**
 * Advanced library under Field Kit — not a second competing product.
 * Field Kit catalog remains the primary 13-tool kit for daily field work.
 * PHI tools are clearly vaulted as clinical access.
 */
export default function AiToolsHub() {
  const fieldFacing = SPARTAN_AI_TOOLS.filter((t) => !t.containsPhi);
  const clinical = SPARTAN_AI_TOOLS.filter((t) => t.containsPhi);

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
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
          Advanced Field Kit library
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          Extra specialized workflows with saved runs and typed inputs. Your{" "}
          <strong className="text-foreground">daily kit</strong> (
          {FIELD_KIT_TOOLS.filter((t) => t.id !== "brand-video").length} tools — Command Center, objections,
          plans, calculators) lives on the main Tools page.
        </p>
        <Button asChild className="font-bold">
          <Link href="/tools">
            <Wrench className="mr-2 h-4 w-4" />
            Open primary Field Kit tools
          </Link>
        </Button>
      </div>

      {fieldFacing.length > 0 && (
        <section className="mb-12" data-testid="section-ai-field-tools">
          <h2 className="text-lg font-bold text-foreground mb-1">Field & enablement</h2>
          <p className="text-sm text-muted-foreground mb-4">
            No PHI. Same ethics as the main Field Kit.
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {fieldFacing.map((tool) => (
              <Link key={tool.id} href={tool.webPath} className="group">
                <Card className="h-full border-border p-5 transition-colors hover:border-primary/60 hover:bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline" className="mb-3">
                        {tool.category}
                      </Badge>
                      <h3 className="text-lg font-semibold text-foreground">{tool.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.description}</p>
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {clinical.length > 0 && (
        <section data-testid="section-ai-clinical-vault">
          <div className="mb-4 rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-foreground">Clinical access vault</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  These workflows may process clinical content under authorized access only. They are{" "}
                  <strong className="text-foreground">not</strong> the consumer Field Kit tools marketed as no-PHI
                  field execution. Use only when your role and organization permit.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clinical.map((tool) => (
              <Link key={tool.id} href={tool.webPath} className="group">
                <Card className="h-full border-border p-5 transition-colors hover:border-primary/60 hover:bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Badge variant="outline">{tool.category}</Badge>
                        <Badge variant="secondary" className="gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Clinical
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{tool.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.description}</p>
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </FieldKitToolLayout>
  );
}
