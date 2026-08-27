import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, FileText, RefreshCw } from "lucide-react";
import {
  SPARTAN_AI_TOOLS,
  getAiToolExperience,
  type SpartanAiToolId,
} from "@workspace/spartan-ai-tools";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { ToolResultPanel } from "@/components/ToolResultPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";
import { ToolResultActions } from "@/components/ToolResultActions";

type SavedRun = {
  id: string;
  toolId: SpartanAiToolId;
  status?: string;
  reviewStatus?: string;
  output?: unknown;
  createdAt: string;
  watermark?: string;
};

async function apiJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: "include" });
  if (!response.ok) throw new Error("Saved work could not be loaded.");
  return response.json() as Promise<T>;
}

function humanKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readableResult(value: unknown, depth = 0): string {
  if (value == null) return "Not provided";
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        item != null && typeof item === "object"
          ? readableResult(item, depth + 1)
          : `• ${String(item)}`,
      )
      .join("\n");
  }
  return Object.entries(value as Record<string, unknown>)
    .map(([key, child]) => `${"  ".repeat(depth)}${humanKey(key)}\n${readableResult(child, depth + 1)}`)
    .join("\n\n");
}

export default function SavedAiOutputs() {
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const tools = SPARTAN_AI_TOOLS.filter((tool) => !tool.containsPhi);
      const groups = await Promise.all(
        tools.map(async (tool) => {
          const response = await apiJson<{ runs: SavedRun[] }>(
            `/api/ai-tools/${tool.id}/runs`,
          );
          return (response.runs ?? []).map((run) => ({ ...run, toolId: tool.id }));
        }),
      );
      setRuns(
        groups
          .flat()
          .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Saved work could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const visibleRuns = useMemo(
    () =>
      runs.filter((run) => {
        const tool = SPARTAN_AI_TOOLS.find((item) => item.id === run.toolId);
        const title = tool ? getAiToolExperience(tool.id).title ?? tool.name : run.toolId;
        return title.toLowerCase().includes(query.trim().toLowerCase());
      }),
    [query, runs],
  );

  return (
    <FieldKitToolLayout title="Saved outputs" showHowTo={false}>
      <SEO title="Saved Outputs | Spartan Coaching" description="Review saved advanced tool results across the website and iPhone app." />
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">My Work</p>
          <h1 className="text-3xl font-display font-black tracking-tight sm:text-4xl">Your work, ready when you are.</h1>
          <p className="max-w-2xl text-muted-foreground leading-7">Review completed work from the website or iPhone app without rebuilding your thinking.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by tool" aria-label="Search saved outputs" className="min-h-11" />
          <Button type="button" variant="outline" onClick={() => void loadRuns()} className="min-h-11">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <ToolResultPanel title="Loading saved work" loading />
        ) : error ? (
          <Card className="p-6 text-center space-y-3" role="alert">
            <p className="font-bold">Saved work is unavailable</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" onClick={() => void loadRuns()}>Try again</Button>
          </Card>
        ) : visibleRuns.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <p className="font-bold">{query ? "No matching saved work" : "Your first saved output starts here"}</p>
            <p className="text-sm text-muted-foreground">{query ? "Try another tool name." : "Complete any advanced nonclinical tool and it will appear here automatically."}</p>
            {!query && <Button asChild><Link href="/tools/ai">Open advanced tools</Link></Button>}
          </Card>
        ) : (
          <div className="space-y-4">
            {visibleRuns.map((run) => {
              const tool = SPARTAN_AI_TOOLS.find((item) => item.id === run.toolId)!;
              const experience = getAiToolExperience(tool.id);
              const expanded = expandedId === run.id;
              const readable = readableResult(run.output);
              return (
                <Card key={run.id} className="overflow-hidden">
                  <button type="button" aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : run.id)} className="flex min-h-20 w-full items-center gap-3 p-4 text-left">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{experience.title ?? tool.name}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{new Date(run.createdAt).toLocaleString()} · {run.status ?? "completed"}</span>
                    </span>
                    {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  {expanded && (
                    <div className="border-t border-border p-4 space-y-4">
                      <ToolResultPanel title={experience.resultTitle} copyText={readable} disclaimer={run.watermark ?? "Suggested guidance from Spartan Coaching. Review and adapt before use."}>
                        <p className="whitespace-pre-wrap leading-7">{readable}</p>
                      </ToolResultPanel>
                      <ToolResultActions
                        toolId={run.toolId}
                        description="Review the saved result, then return to the tool when you are ready to turn it into the next field action."
                        actions={[
                          {
                            id: "reopen-tool",
                            label: `Open ${experience.title ?? tool.name}`,
                            href: tool.webPath,
                          },
                        ]}
                        persistenceNote="This nonclinical result is saved in My Work. Opening it again does not copy the result into a new record."
                        testId={`saved-output-next-action-${run.id}`}
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </FieldKitToolLayout>
  );
}
