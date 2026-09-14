import { useState, type ComponentType } from "react";
import { Activity, Bell, Building2, Database, FileSpreadsheet, HeartPulse, Landmark, MapPinned, Search, Stethoscope, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getMedicareIntelligence } from "@/lib/medicareIntelligenceClient";
import { cn } from "@/lib/utils";

type Workspace = { id: string; title: string; description: string; icon: ComponentType<{ className?: string }>; endpoint: (state: string, ccn: string, npi: string) => string; needs: "state" | "ccn" | "npi" | "none" };

const WORKSPACES: Workspace[] = [
  { id: "national", title: "National command", description: "State market, provider, county, and competitive signals.", icon: Landmark, endpoint: (state, ccn) => `/dashboard?state=${state}&ccn=${ccn}`, needs: "state" },
  { id: "provider", title: "Provider 360", description: "Certification, ownership, quality, utilization, and evidence.", icon: Building2, endpoint: (_, ccn) => `/intelligence?ccn=${ccn}`, needs: "ccn" },
  { id: "economics", title: "County economics", description: "Population, Medicare demand, supply, and opportunity context.", icon: FileSpreadsheet, endpoint: (_, ccn) => `/county/${ccn}`, needs: "ccn" },
  { id: "hcris", title: "HCRIS economics", description: "Cost report operating model and financial coordinates.", icon: Database, endpoint: (_, ccn) => `/hcris/${ccn}?detail=1`, needs: "ccn" },
  { id: "ssvi", title: "SSVI signals", description: "Hospice service, utilization, and value indicators.", icon: HeartPulse, endpoint: (_, ccn) => `/ssvi/${ccn}`, needs: "ccn" },
  { id: "geography", title: "Service geography", description: "Observed counties, reach, concentration, and white space.", icon: MapPinned, endpoint: (_, ccn) => `/service-geography/${ccn}`, needs: "ccn" },
  { id: "territory", title: "Territory deployment", description: "Prioritized field deployment grounded in market evidence.", icon: Target, endpoint: (state, ccn) => `/territory-deployment-private/${ccn}?state=${state}`, needs: "ccn" },
  { id: "physician", title: "Physician 360", description: "NPI profile, services, eligibility, and referral context.", icon: Stethoscope, endpoint: (_, __, npi) => `/physician/${npi}`, needs: "npi" },
  { id: "referrals", title: "Referral market", description: "Hospitals, physicians, and provider opportunity by state.", icon: Users, endpoint: (state) => `/physicians/${state}`, needs: "state" },
  { id: "watchlist", title: "Watchlist", description: "Tracked providers and their latest monitoring status.", icon: Bell, endpoint: () => "/watchlist", needs: "none" },
  { id: "actions", title: "Decision actions", description: "Accountable decisions, owners, dates, and status.", icon: Activity, endpoint: (_, ccn) => `/decision-actions?ccn=${ccn}`, needs: "none" },
  { id: "diagnostics", title: "Source diagnostics", description: "CMS source health, freshness, cache, and model status.", icon: Search, endpoint: (state, ccn) => `/system-diagnostics?state=${state}&ccn=${ccn}`, needs: "state" },
];

export function MedicareOperationsPanel() {
  const [active, setActive] = useState(WORKSPACES[0]);
  const [state, setState] = useState("OK");
  const [ccn, setCcn] = useState("");
  const [npi, setNpi] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const run = async () => {
    setStatus("loading"); setResult(null);
    try { setResult(await getMedicareIntelligence(active.endpoint(state.trim().toUpperCase(), ccn.trim(), npi.trim()))); setStatus("idle"); }
    catch (error) { setResult({ error: error instanceof Error ? error.message : "Unable to load Medicare intelligence." }); setStatus("error"); }
  };

  return <div className="grid gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
    <aside className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1" aria-label="Medicare intelligence workspaces">
      {WORKSPACES.map((workspace) => { const Icon = workspace.icon; return <button key={workspace.id} type="button" onClick={() => { setActive(workspace); setResult(null); }} className={cn("flex gap-3 rounded-2xl border p-3 text-left transition", active.id === workspace.id ? "border-primary bg-primary/10 ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/50")}>
        <span className={cn("rounded-xl p-2", active.id === workspace.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}><Icon className="h-4 w-4" /></span>
        <span><strong className="block text-sm text-foreground">{workspace.title}</strong><span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{workspace.description}</span></span>
      </button>; })}
    </aside>
    <Card className="min-w-0 overflow-hidden p-5 sm:p-7">
      <div className="flex items-start gap-3"><active.icon className="mt-1 h-6 w-6 text-primary" /><div><h2 className="text-2xl font-black text-foreground">{active.title}</h2><p className="mt-1 text-sm text-muted-foreground">{active.description}</p></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[7rem_1fr_1fr_auto]">
        <Input aria-label="State" value={state} onChange={(e) => setState(e.target.value.slice(0, 2))} placeholder="State" />
        <Input aria-label={active.id === "economics" ? "County FIPS" : "Provider CCN"} value={ccn} onChange={(e) => setCcn(e.target.value)} placeholder={active.id === "economics" ? "County FIPS" : "Provider CCN"} />
        <Input aria-label="Physician NPI" value={npi} onChange={(e) => setNpi(e.target.value)} placeholder="Physician NPI" />
        <Button onClick={run} disabled={status === "loading" || (active.needs === "ccn" && !ccn.trim()) || (active.needs === "npi" && !npi.trim())}>{status === "loading" ? "Loading…" : "Run analysis"}</Button>
      </div>
      {!result ? <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center"><p className="font-bold text-foreground">Ready for a verified query</p><p className="mt-1 text-sm text-muted-foreground">Results preserve source status, missing evidence, methodology, and retrieval time.</p></div> : <EvidenceResult value={result} error={status === "error"} />}
    </Card>
  </div>;
}

function EvidenceResult({ value, error }: { value: unknown; error: boolean }) {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : { result: value };
  const entries = Object.entries(data).filter(([, item]) => ["string", "number", "boolean"].includes(typeof item)).slice(0, 10);
  return <div className="mt-6 space-y-4" aria-live="polite">
    <div className={cn("rounded-2xl border p-4", error ? "border-destructive/40 bg-destructive/5" : "border-emerald-500/30 bg-emerald-500/5")}><strong className="text-foreground">{error ? "Analysis unavailable" : "Evidence returned"}</strong><p className="mt-1 text-xs text-muted-foreground">Public CMS evidence and calculated results remain explicitly labeled in the detailed record.</p></div>
    {entries.length ? <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{entries.map(([key, item]) => <div key={key} className="rounded-xl border border-border bg-card p-3"><dt className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">{key.replace(/([A-Z])/g, " $1")}</dt><dd className="mt-1 break-words text-sm font-bold text-foreground">{String(item)}</dd></div>)}</dl> : null}
    <details className="rounded-xl border border-border"><summary className="cursor-pointer p-4 text-sm font-black text-foreground">Complete evidence record</summary><pre className="max-h-[34rem] overflow-auto border-t border-border bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">{JSON.stringify(value, null, 2)}</pre></details>
  </div>;
}
