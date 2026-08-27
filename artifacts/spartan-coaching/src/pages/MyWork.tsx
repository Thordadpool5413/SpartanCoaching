import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, FileText, RefreshCw } from "lucide-react";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadMemberWork, type MemberWorkItem } from "@/lib/memberWorkClient";

export default function MyWork() {
  const [items, setItems] = useState<MemberWorkItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setItems(await loadMemberWork()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Saved work could not be loaded."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => items.filter((item) => `${item.title} ${item.toolId} ${item.kind}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);
  return <FieldKitToolLayout title="My Work" showHowTo={false}>
    <SEO title="My Work | Spartan Coaching" description="Continue saved tools, reports, coaching, and next actions across web and iPhone." />
    <div className="mx-auto max-w-5xl space-y-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Connected workspace</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Your work should move with you.</h1><p className="mt-3 max-w-2xl text-muted-foreground">Every saved result keeps its inputs, output, and next action so you can continue the work instead of starting over.</p></div>
      <div className="flex gap-3"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved work" aria-label="Search saved work" /><Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>
      {loading ? <Card className="p-8 text-center">Loading your workspace…</Card> : error ? <Card className="p-8 text-center" role="alert"><p className="font-bold">My Work is unavailable</p><p className="mt-2 text-sm text-muted-foreground">{error}</p></Card> : visible.length === 0 ? <Card className="p-8 text-center"><p className="font-bold">{query ? "No matching work" : "Nothing saved yet"}</p><p className="mt-2 text-sm text-muted-foreground">Run a tool, save the result, and it will appear here with its next action.</p><Button asChild className="mt-4"><Link href="/tools">Open tools</Link></Button></Card> : <div className="grid gap-4 md:grid-cols-2">{visible.map((item) => <Card key={item.id} className="p-5"><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span><div className="min-w-0"><p className="font-bold">{item.title}</p><p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{item.kind.replaceAll("_", " ")} · {new Date(item.updatedAt).toLocaleString()}</p></div></div>{item.nextAction?.href ? <Button asChild className="mt-4 w-full"><Link href={`${item.nextAction.href}${item.nextAction.href.includes("?") ? "&" : "?"}work=${item.id}`}>{item.nextAction.title}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : null}</Card>)}</div>}
      <Card className="p-5"><p className="font-bold">Advanced AI output history</p><p className="mt-1 text-sm text-muted-foreground">Review advanced Elite tool runs saved by the existing AI workspace.</p><Button asChild variant="outline" className="mt-3"><Link href="/my-work/elite-outputs">Open Elite outputs</Link></Button></Card>
    </div>
  </FieldKitToolLayout>;
}
