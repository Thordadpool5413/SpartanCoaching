import { useState } from "react";
import { Building2, ExternalLink, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { US_STATES } from "@/lib/usStates";

type Hospice = {
  npi: string; ccn: string; organizationName: string; doingBusinessAs: string;
  city: string; state: string; zipCode: string; ownership: string; organizationStructure: string;
  source: { label: string; url: string; checkedAt: string };
};

export function HospiceMarketPanel() {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [results, setResults] = useState<Hospice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!state) { setError("Choose a state to explore its enrolled hospice organizations."); return; }
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ state: state.trim().toUpperCase(), limit: "25" });
      if (city.trim()) params.set("city", city.trim());
      const response = await apiRequest("GET", `/api/intelligence/hospice-market?${params}`);
      const data = await response.json();
      setResults(data.results || []);
      if (!data.results?.length) setError("No enrolled hospice organizations matched that location.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "CMS hospice data is unavailable. Try again in a moment.");
    } finally { setLoading(false); }
  };

  return <Card className="p-5 sm:p-7 space-y-6">
    <div className="flex gap-3 items-start"><div className="rounded-xl bg-primary/10 p-2.5"><MapPin className="h-5 w-5 text-primary" /></div><div><p className="text-[10px] font-bold tracking-widest text-primary uppercase">Live CMS market explorer</p><h2 className="mt-1 text-2xl font-black text-foreground">See the enrolled hospice landscape.</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Search official CMS hospice enrollment data by state and city. Use it for market orientation, not performance claims.</p></div></div>
    <div className="grid gap-4 sm:grid-cols-[minmax(220px,0.7fr)_1fr_auto] sm:items-end"><div className="space-y-2"><Label htmlFor="market-state">State</Label><select id="market-state" value={state} onChange={(event) => setState(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><option value="">Choose a state</option>{US_STATES.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}</select></div><div className="space-y-2"><Label htmlFor="market-city">City</Label><Input id="market-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Optional city" /></div><Button type="button" className="font-bold" disabled={loading} onClick={search}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Explore market</Button></div>
    {error ? <p className="text-sm text-destructive">{error}</p> : null}
    {results.length ? <div className="space-y-3"><div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest text-primary uppercase">Verified organizations</p><p className="text-xs text-muted-foreground">Showing {results.length}</p></div><div className="grid gap-3 md:grid-cols-2">{results.map((item) => <div key={`${item.npi}-${item.ccn}`} className="rounded-xl border border-border bg-background p-4"><div className="flex gap-3"><div className="rounded-lg bg-primary/10 p-2 h-fit"><Building2 className="h-4 w-4 text-primary" /></div><div className="min-w-0"><h3 className="font-bold text-foreground">{item.doingBusinessAs || item.organizationName}</h3>{item.doingBusinessAs && item.doingBusinessAs !== item.organizationName ? <p className="mt-1 text-xs text-muted-foreground">{item.organizationName}</p> : null}<p className="mt-2 text-xs text-muted-foreground">{item.city}, {item.state} {item.zipCode.slice(0, 5)}</p><div className="mt-3 flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-muted px-2 py-1">{item.ownership}</span><span className="rounded-full bg-muted px-2 py-1">NPI {item.npi}</span>{item.ccn ? <span className="rounded-full bg-muted px-2 py-1">CCN {item.ccn}</span> : null}</div></div></div></div>)}</div><a className="inline-flex items-center gap-1 text-xs text-primary underline" href={results[0].source.url} target="_blank" rel="noreferrer">CMS Hospice enrollment data <ExternalLink className="h-3 w-3" /></a></div> : null}
  </Card>;
}
