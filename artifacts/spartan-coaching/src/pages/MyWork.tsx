import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, FileText, FolderOpen, RefreshCw, Search } from "lucide-react";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadMemberWork, type MemberWorkItem } from "@/lib/memberWorkClient";

const FILTERS = ["all", "draft", "completed"] as const;

export default function MyWork() {
  const [items, setItems] = useState<MemberWorkItem[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setItems(await loadMemberWork()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Saved work could not be loaded."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => items.filter((item) => `${item.title} ${item.toolId} ${item.kind}`.toLowerCase().includes(query.trim().toLowerCase()) && (filter === "all" || item.status === filter)), [filter, items, query]);
  const completed = items.filter((item) => item.status === "completed").length;
  const drafts = items.filter((item) => item.status === "draft").length;

  return <FieldKitToolLayout title="My Work" showHowTo={false}>
    <SEO title="My Work | Spartan Coaching" description="Continue saved tools, reports, coaching, and next actions across web and iPhone." />
    <div className="mx-auto max-w-6xl space-y-6" data-testid="page-my-work">
      <header className="grid gap-5 border-b border-border/70 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your connected work</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Pick up where you left off.</h1><p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Drafts, completed briefs, reports, and next actions from the website and iPhone, organized in one place.</p></div>
        <div className="grid grid-cols-3 gap-2 text-center">{[[items.length,"All"],[drafts,"Drafts"],[completed,"Done"]].map(([value,label]) => <div key={label} className="rounded-xl border border-border bg-card px-4 py-3"><p className="text-2xl font-black">{value}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p></div>)}</div>
      </header>
      <section className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card/70 p-3 sm:flex-row" aria-label="Filter My Work">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search by title or tool" aria-label="Search saved work" /></div>
        <div className="flex gap-2">{FILTERS.map((value) => <Button key={value} type="button" size="sm" variant={filter === value ? "default" : "outline"} className="capitalize" onClick={() => setFilter(value)}>{value}</Button>)}</div>
        <Button variant="ghost" size="sm" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </section>
      {loading ? <Card className="p-10 text-center">Loading your work…</Card> : error ? <Card className="p-8 text-center" role="alert"><p className="font-bold">My Work is unavailable</p><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button className="mt-4" onClick={() => void load()}>Try again</Button></Card> : visible.length === 0 ? <Card className="p-10 text-center"><FolderOpen className="mx-auto h-8 w-8 text-primary" /><p className="mt-3 font-bold">{query || filter !== "all" ? "No work matches this view" : "Nothing saved yet"}</p><p className="mt-2 text-sm text-muted-foreground">Finish a tool or save a draft. It will appear here with the next action attached.</p><Button asChild className="mt-4"><Link href="/tools">Choose a tool</Link></Button></Card> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visible.map((item) => <Card key={item.id} className="flex flex-col border-border/80 p-4 shadow-none"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{item.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span><div className="min-w-0"><p className="line-clamp-2 font-bold leading-5">{item.title}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.kind.replaceAll("_", " ")} · {item.status}</p></div></div><p className="mt-4 text-xs text-muted-foreground">Updated {new Date(item.updatedAt).toLocaleString()}</p>{item.nextAction?.href ? <Button asChild variant="outline" className="mt-4 w-full"><Link href={`${item.nextAction.href}${item.nextAction.href.includes("?") ? "&" : "?"}work=${item.id}`}>{item.nextAction.title}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : <Button asChild variant="ghost" className="mt-4 w-full"><Link href="/tools">Open related tools<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}</Card>)}</div>}
      <Card className="flex flex-col gap-3 border-border/70 p-4 shadow-none sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">Advanced AI history</p><p className="mt-1 text-sm text-muted-foreground">Review Elite AI runs kept in the advanced workspace.</p></div><Button asChild variant="outline"><Link href="/my-work/elite-outputs">Open Elite outputs</Link></Button></Card>
    </div>
  </FieldKitToolLayout>;
}
