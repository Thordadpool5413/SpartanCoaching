import { Link } from "wouter";
import { BrainCircuit, ChevronRight, ShieldCheck } from "lucide-react";
import { SPARTAN_AI_TOOLS } from "@workspace/spartan-ai-tools";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { SEO } from "@/components/SEO";

export default function AiToolsHub() {
  return (
    <FieldKitToolLayout title="AI Tool Library" showHowTo={false}>
      <SEO
        title="AI Tool Library | Spartan Coaching"
        description="Native web and mobile tools for hospice sales, learning, content, and authorized clinical workflows."
      />
      <div className="mb-10 max-w-3xl">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BrainCircuit className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">AI Tool Library</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Fourteen purpose-built tools with typed inputs, saved run history, safe errors,
          and the same workflows on the website and native mobile app.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SPARTAN_AI_TOOLS.map((tool) => (
          <Link key={tool.id} href={tool.webPath} className="group">
            <Card className="h-full border-border/70 p-5 transition-colors hover:border-primary/60 hover:bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge variant="outline">{tool.category}</Badge>
                    {tool.containsPhi && (
                      <Badge className="gap-1 bg-amber-600 text-white">
                        <ShieldCheck className="h-3 w-3" />
                        Clinical access
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold">{tool.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </FieldKitToolLayout>
  );
}
