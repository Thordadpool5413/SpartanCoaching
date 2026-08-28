import { useMemo, useState } from "react";
import { BarChart3, Building2, Loader2, MapPin, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { ToolResultActions } from "@/components/ToolResultActions";
import { US_STATES } from "@/lib/usStates";

type Hospice = {
  npi: string; ccn: string; organizationName: string; doingBusinessAs: string; facilityName: string;
  address: string; city: string; state: string; zipCode: string; county: string; phone: string;
  ownership: string; organizationStructure: string; certificationDate: string; yearsCertified: number | null;
  source: { label: string; url: string; checkedAt: string };
};
type Summary = { totalMatched: number; displayed: number; ownership: Array<{ label: string; count: number }>; establishedBefore2000: number; newestCertificationYear: number | null; sourceCheckedAt: string };
type Measure = { code: string; name: string; displayScore: string; comparisonLabel: string; favorable: boolean | null; reportingPeriod: string; footnote: string };
type Profile = { organization: Hospice; quality: Measure[]; familyExperience: Measure[]; serviceArea: { zipCodes: string[]; count: number }; strengths: string[]; questionsToAsk: string[]; interpretation: string; sources: Array<{ label: string; url: string; checkedAt: string }> };

export function HospiceMarketPanel() {
  const [state, setState] = useState(""); const [city, setCity] = useState(""); const [county, setCounty] = useState("");
  const [zipCode, setZipCode] = useState(""); const [name, setName] = useState(""); const [ownership, setOwnership] = useState("");
  const [results, setResults] = useState<Hospice[]>([]); const [summary, setSummary] = useState<Summary | null>(null);
  const [selected, setSelected] = useState<Hospice | null>(null); const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false); const [profileLoading, setProfileLoading] = useState(false); const [error, setError] = useState("");
  const ownershipOptions = useMemo(() => summary?.ownership.map((item) => item.label).filter(Boolean) || [], [summary]);

  const search = async () => {
    if (!state) { setError("Choose a state to explore the verified CMS market."); return; }
    setLoading(true); setError(""); setSelected(null); setProfile(null);
    try {
      const params = new URLSearchParams({ state, limit: "50" });
      if (city.trim()) params.set("city", city.trim()); if (county.trim()) params.set("county", county.trim());
      if (zipCode.trim()) params.set("zipCode", zipCode.trim()); if (name.trim()) params.set("name", name.trim());
      if (ownership) params.set("ownership", ownership);
      const response = await apiRequest("GET", "/api/intelligence/hospice-market?" + params.toString());
      const data = await response.json(); setResults(data.results || []); setSummary(data.summary || null);
      if (!(data.results || []).length) setError("No CMS-certified hospices matched these filters. Broaden the city, county, ZIP, or name.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "CMS market data is unavailable."); }
    finally { setLoading(false); }
  };

  const openProfile = async (organization: Hospice) => {
    setSelected(organization); setProfile(null); setProfileLoading(true); setError("");
    try {
      const response = await apiRequest("GET", "/api/intelligence/hospice-profile?ccn=" + encodeURIComponent(organization.ccn));
      const data = await response.json(); setProfile(data.profile);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The CMS profile could not be loaded."); }
    finally { setProfileLoading(false); }
  };

  return <div className="space-y-5">
    <Card className="p-5 sm:p-6 space-y-5">
      <div className="flex gap-3 items-start"><div className="rounded-xl bg-primary/10 p-2.5"><MapPin className="h-5 w-5 text-primary" /></div><div><p className="text-xs font-bold tracking-wider text-primary uppercase">CMS Market Intelligence</p><h2 className="mt-1 text-xl font-black text-foreground">Map a territory, then inspect the accounts that matter.</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Search current CMS Care Compare records, filter the landscape, and open an account-level quality and family-experience profile. Public organization data only.</p></div></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Field label="State" id="market-state"><select id="market-state" value={state} onChange={(e) => setState(e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Choose state</option>{US_STATES.map(([code,n]) => <option key={code} value={code}>{n} ({code})</option>)}</select></Field>
        <Field label="City" id="market-city"><Input id="market-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Optional" /></Field>
        <Field label="County" id="market-county"><Input id="market-county" value={county} onChange={(e) => setCounty(e.target.value)} placeholder="Optional" /></Field>
        <Field label="ZIP" id="market-zip"><Input id="market-zip" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Optional" /></Field>
        <Field label="Organization" id="market-name"><Input id="market-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name contains" /></Field>
        <Field label="Ownership" id="market-ownership"><select id="market-ownership" value={ownership} onChange={(e) => setOwnership(e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">All ownership</option>{ownershipOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
      </div>
      <Button type="button" className="h-11 w-full sm:w-auto font-bold" disabled={loading} onClick={search}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Explore verified market</Button>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </Card>

    {summary ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Market summary">
      <Metric label="CMS records matched" value={String(summary.totalMatched)} detail={String(results.length) + " shown for review"} />
      <Metric label="Established before 2000" value={String(summary.establishedBefore2000)} detail="Longevity is context, not quality" />
      <Metric label="Newest certification" value={summary.newestCertificationYear ? String(summary.newestCertificationYear) : "Unavailable"} detail="Verify current operating context" />
      <Metric label="Source checked" value={new Date(summary.sourceCheckedAt).toLocaleDateString()} detail="CMS Care Compare" />
    </div> : null}

    {results.length ? <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card className="p-4 sm:p-5 h-fit"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Verified organizations</p><h3 className="mt-1 text-lg font-black">{results.length} accounts ready to inspect</h3></div><Building2 className="h-5 w-5 text-muted-foreground" /></div><div className="max-h-[45rem] space-y-2 overflow-y-auto pr-1">{results.map((item) => <button key={item.ccn} type="button" onClick={() => openProfile(item)} className={"w-full rounded-xl border p-4 text-left transition " + (selected?.ccn === item.ccn ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-background hover:border-primary/50")}><div className="flex justify-between gap-3"><div><p className="font-bold text-foreground">{item.facilityName || item.organizationName}</p>{item.doingBusinessAs && item.doingBusinessAs !== item.facilityName ? <p className="mt-1 text-xs text-muted-foreground">DBA {item.doingBusinessAs}</p> : null}<p className="mt-2 text-xs text-muted-foreground">{item.city}, {item.state} {item.zipCode} · CCN {item.ccn}</p><div className="mt-2 flex flex-wrap gap-1.5"><Tag>{item.ownership || "Ownership unavailable"}</Tag>{item.yearsCertified !== null ? <Tag>{item.yearsCertified} years certified</Tag> : null}{item.npi ? <Tag>NPI {item.npi}</Tag> : null}</div></div><span className="text-xs font-bold text-primary">Open →</span></div></button>)}</div></Card>

      <Card className="p-5 sm:p-6 min-h-[35rem]">
        {profileLoading ? <div className="flex min-h-[30rem] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : !profile ? <div className="flex min-h-[30rem] flex-col items-center justify-center text-center px-5"><BarChart3 className="h-10 w-10 text-primary" /><h3 className="mt-4 text-xl font-black">Select an organization for the full CMS profile.</h3><p className="mt-2 max-w-md text-sm text-muted-foreground">Review public quality measures, family experience, service-area coverage, strengths, limitations, and questions to verify in the field.</p></div> :
        <div className="space-y-5" data-testid="hospice-profile">
          <div className="border-b border-border pb-4"><div className="flex items-center gap-2 text-xs font-bold text-primary"><ShieldCheck className="h-4 w-4" />CMS VERIFIED PROFILE</div><h3 className="mt-2 text-2xl font-black">{profile.organization.facilityName}</h3><p className="mt-2 text-sm text-muted-foreground">{profile.organization.address}, {profile.organization.city}, {profile.organization.state} {profile.organization.zipCode}</p><p className="mt-1 text-xs text-muted-foreground">{profile.organization.phone} · CCN {profile.organization.ccn}</p></div>
          {profile.strengths.length ? <Section title="Public-data strengths"><List items={profile.strengths} /></Section> : null}
          <div className="grid gap-4 md:grid-cols-2"><MeasureGroup title="Quality measures" items={profile.quality} /><MeasureGroup title="Family experience" items={profile.familyExperience} /></div>
          <Section title="Questions to verify"><List items={profile.questionsToAsk} /></Section>
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-relaxed text-muted-foreground">{profile.interpretation}</div>
          <ToolResultActions toolId="spartan-intelligence" title="Keep this market profile" description="Save the verified CMS profile to My Work." saveResult={{ toolId: "spartan-intelligence", title: profile.organization.facilityName + " market profile", kind: "market_profile", value: JSON.stringify(profile), input: { ccn: profile.organization.ccn, state, city, county, zipCode }, nextAction: { title: "Prepare the next account conversation", href: "/tools/intelligence" } }} actions={[{ id: "my-work", label: "Open My Work", href: "/my-work" }]} testId="market-profile-actions" />
        </div>}
      </Card>
    </div> : null}
  </div>;
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}</div>; }
function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <Card className="p-4"><p className="text-xs font-bold uppercase tracking-wider text-primary">{label}</p><p className="mt-2 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></Card>; }
function Tag({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">{children}</span>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-2"><h4 className="text-xs font-bold uppercase tracking-wider text-primary">{title}</h4>{children}</section>; }
function List({ items }: { items: string[] }) { return <ul className="space-y-2 text-sm">{items.map((item) => <li key={item} className="flex gap-2"><span className="text-primary font-bold">•</span><span>{item}</span></li>)}</ul>; }
function MeasureGroup({ title, items }: { title: string; items: Measure[] }) { return <Section title={title}><div className="space-y-2">{items.length ? items.slice(0,6).map((item) => <div key={item.code} className="rounded-lg border border-border bg-background p-3"><div className="flex justify-between gap-3"><p className="text-xs font-semibold">{item.name}</p><p className="text-sm font-black">{item.displayScore}</p></div><p className="mt-1 text-[11px] text-muted-foreground">{item.comparisonLabel}</p></div>) : <p className="text-sm text-muted-foreground">No comparable CMS measure is available.</p>}</div></Section>; }
