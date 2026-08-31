import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Building2, User, CheckCircle2, FileText } from "lucide-react";
import { ToolResultActions } from "@/components/ToolResultActions";
import { US_STATES } from "@/lib/usStates";

export type NpiHit = {
  npi: string;
  name: string;
  credential?: string;
  taxonomy?: string;
  city?: string;
  state?: string;
  phone?: string;
  enumerationType?: string;
  status?: string;
  address?: string;
  postalCode?: string;
  taxonomies: string[];
  lastUpdated?: string;
  source: { label: string; url: string; checkedAt: string };
};

type AccountBrief = {
  headline: string;
  verifiedFacts: Array<{ label: string; value: string }>;
  meetingObjective: string;
  opening: string;
  discoveryQuestions: string[];
  preparation: string[];
  accountLens?: string;
  valueHypotheses?: string[];
  watchouts?: string[];
  followUpMessage?: string;
  thirtyDayPlan?: Array<{ timing: string; action: string; outcome: string }>;
  nextMove: string;
  limitations: string[];
  generatedBy?: string;
  source: NpiHit["source"];
};

/**
 * Free CMS NPPES lookup for pre-call prep. No PHI — provider/org names only.
 */
export function NpiLookupPanel({
  className,
  onSelect,
  enableBrief = false,
}: {
  className?: string;
  onSelect?: (hit: NpiHit) => void;
  enableBrief?: boolean;
}) {
  const [mode, setMode] = useState<"person" | "org">("person");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NpiHit[]>([]);
  const [selected, setSelected] = useState<NpiHit | null>(null);
  const [relationshipStage, setRelationshipStage] = useState<"new" | "developing" | "active" | "reengage">("new");
  const [meetingPurpose, setMeetingPurpose] = useState("");
  const [accountType, setAccountType] = useState("physician-practice");
  const [stakeholderRole, setStakeholderRole] = useState("");
  const [knownContext, setKnownContext] = useState("");
  const [knownBarrier, setKnownBarrier] = useState("");
  const [desiredCommitment, setDesiredCommitment] = useState("");
  const [brief, setBrief] = useState<AccountBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  const search = async () => {
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      const params = new URLSearchParams();
      if (mode === "person") {
        if (!lastName.trim()) {
          setError("Last name is required");
          setLoading(false);
          return;
        }
        if (firstName.trim()) params.set("firstName", firstName.trim());
        params.set("lastName", lastName.trim());
      } else {
        if (!organization.trim()) {
          setError("Organization name is required");
          setLoading(false);
          return;
        }
        params.set("organization", organization.trim());
      }
      if (city.trim()) params.set("city", city.trim());
      if (state.trim()) params.set("state", state.trim());

      const res = await fetch(`/api/reference/npi?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setResults(data.results || []);
      if (!(data.results || []).length) setError("No matches. Try a broader name or remove the city.");
    } catch (e: any) {
      setError(e?.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const buildBrief = async () => {
    if (!selected) return;
    setError(null);
    setBriefLoading(true);
    try {
      const res = await fetch("/api/intelligence/account-brief", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selected, relationshipStage, meetingPurpose, accountType, stakeholderRole, knownContext, knownBarrier, desiredCommitment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Brief could not be built");
      setBrief(data.brief);
    } catch (e: any) {
      setError(e?.message || "Brief could not be built");
    } finally {
      setBriefLoading(false);
    }
  };

  return (
    <Card
      className={`border border-border bg-card p-4 sm:p-5 space-y-4 ${className || ""}`}
      data-testid="npi-lookup-panel"
    >
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
            Referral Intelligence · NPPES verified
          </p>
          <h2 className="text-xl font-extrabold text-foreground">Build the account brief before the visit.</h2>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Find the public record, choose the right provider, and convert verified facts into a focused meeting plan. Never enter patient information.
          </p>
        </div>
        {enableBrief ? <ol className="grid grid-cols-3 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground" aria-label="Referral Intelligence workflow">
          <li className="rounded-lg bg-primary/10 px-3 py-2 text-primary"><Search className="mx-auto mb-1 h-3.5 w-3.5" />Find</li>
          <li className="rounded-lg bg-muted px-3 py-2"><CheckCircle2 className="mx-auto mb-1 h-3.5 w-3.5" />Verify</li>
          <li className="rounded-lg bg-muted px-3 py-2"><FileText className="mx-auto mb-1 h-3.5 w-3.5" />Prepare</li>
        </ol> : null}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "person" ? "default" : "outline"}
          className="font-bold"
          onClick={() => setMode("person")}
          aria-pressed={mode === "person"}
        >
          <User className="w-3.5 h-3.5 mr-1" />
          Person
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "org" ? "default" : "outline"}
          className="font-bold"
          onClick={() => setMode("org")}
          aria-pressed={mode === "org"}
        >
          <Building2 className="w-3.5 h-3.5 mr-1" />
          Organization
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {mode === "person" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="npi-first-name" className="text-xs">First name</Label>
              <Input id="npi-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="npi-last-name" className="text-xs">Last name</Label>
              <Input id="npi-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Required" />
            </div>
          </>
        ) : (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="npi-organization" className="text-xs">Organization</Label>
            <Input
              id="npi-organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Facility or practice name"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="npi-city" className="text-xs">City</Label>
          <Input id="npi-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="npi-state" className="text-xs">State</Label>
          <select id="npi-state" value={state} onChange={(event) => setState(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="">All states</option>
            {US_STATES.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
          </select>
        </div>
      </div>

      <Button type="button" onClick={search} disabled={loading} className="font-bold w-full sm:w-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
        Search NPI
      </Button>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      {results.length > 0 && (
        <ul className="space-y-2 max-h-72 overflow-y-auto" aria-label="NPI search results">
          {results.map((r) => (
            <li
              key={r.npi}
              className={`rounded-xl border p-4 text-sm space-y-1 transition-colors ${selected?.npi === r.npi ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-background/60 hover:border-primary/40"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-foreground">
                    {r.name}
                    {r.credential ? `, ${r.credential}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    NPI {r.npi}
                    {r.taxonomy ? ` · ${r.taxonomy}` : ""}
                  </p>
                  {(r.city || r.state) && (
                    <p className="text-xs text-muted-foreground">
                      {[r.city, r.state].filter(Boolean).join(", ")}
                      {r.phone ? ` · ${r.phone}` : ""}
                    </p>
                  )}
                  {r.lastUpdated ? <p className="text-[11px] text-muted-foreground">Registry updated {r.lastUpdated}</p> : null}
                </div>
                {(enableBrief || onSelect) ? <Button type="button" size="sm" variant={selected?.npi === r.npi ? "default" : "outline"} className="font-bold" onClick={() => { setSelected(r); setBrief(null); onSelect?.(r); }}>
                  {selected?.npi === r.npi ? "Selected" : enableBrief ? "Prepare" : "Use"}
                </Button> : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {enableBrief && selected ? (
        <div className="rounded-xl border border-border bg-background/70 p-4 space-y-4" data-testid="account-brief-builder">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Elite meeting preparation</p>
            <h4 className="font-bold text-foreground mt-1">Prepare for {selected.name}</h4>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Relationship</Label>
            <div className="flex flex-wrap gap-2">
              {([['new', 'New'], ['developing', 'Developing'], ['active', 'Active'], ['reengage', 'Reconnect']] as const).map(([value, label]) => (
                <Button key={value} type="button" size="sm" variant={relationshipStage === value ? "default" : "outline"} aria-pressed={relationshipStage === value} onClick={() => setRelationshipStage(value)}>{label}</Button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="npi-account-type" className="text-xs">Account setting</Label><select id="npi-account-type" value={accountType} onChange={(e) => setAccountType(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="physician-practice">Physician practice</option><option value="hospital">Hospital</option><option value="snf">Skilled nursing</option><option value="assisted-living">Assisted living</option><option value="home-health">Home health</option><option value="community">Community organization</option><option value="other">Other</option></select></div>
            <div className="space-y-1.5"><Label htmlFor="npi-stakeholder" className="text-xs">Who are you meeting?</Label><Input id="npi-stakeholder" value={stakeholderRole} onChange={(e) => setStakeholderRole(e.target.value)} placeholder="Role, not patient information" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="npi-meeting-purpose" className="text-xs">What needs to happen in this meeting?</Label><Input id="npi-meeting-purpose" value={meetingPurpose} onChange={(e) => setMeetingPurpose(e.target.value)} placeholder="The outcome you need" /></div>
          <div className="space-y-1.5"><Label htmlFor="npi-context" className="text-xs">Known relationship context</Label><Textarea id="npi-context" value={knownContext} onChange={(e) => setKnownContext(e.target.value)} rows={3} placeholder="Only business context you can verify. Never enter patient information." /></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="npi-barrier" className="text-xs">Barrier to explore</Label><Input id="npi-barrier" value={knownBarrier} onChange={(e) => setKnownBarrier(e.target.value)} placeholder="What is getting in the way?" /></div><div className="space-y-1.5"><Label htmlFor="npi-commitment" className="text-xs">Commitment to earn</Label><Input id="npi-commitment" value={desiredCommitment} onChange={(e) => setDesiredCommitment(e.target.value)} placeholder="One observable next step" /></div></div>
          <Button type="button" className="w-full font-bold" disabled={briefLoading} onClick={buildBrief}>
            {briefLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Build account brief
          </Button>
        </div>
      ) : null}

      {enableBrief && brief ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-5" data-testid="account-brief-result">
          <div><p className="text-[10px] font-bold tracking-widest text-primary uppercase">Ready for the room</p><h4 className="font-bold text-foreground mt-1">{brief.headline}</h4></div>
          <div className="grid sm:grid-cols-2 gap-2">{brief.verifiedFacts.map((fact) => <div key={fact.label} className="rounded-lg border border-border bg-card p-3"><p className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">{fact.label}</p><p className="text-sm font-semibold text-foreground mt-1">{fact.value}</p></div>)}</div>
          {brief.generatedBy ? <p className="text-xs font-bold text-primary">{brief.generatedBy}</p> : null}
          {brief.accountLens ? <BriefSection title="Account lens"><p>{brief.accountLens}</p></BriefSection> : null}
          <BriefSection title="Meeting objective"><p>{brief.meetingObjective}</p></BriefSection>
          <BriefSection title="How to open"><p className="rounded-xl bg-card p-4 font-semibold">“{brief.opening}”</p></BriefSection>
          <BriefSection title="Questions worth asking"><ol className="space-y-2">{brief.discoveryQuestions.map((item, index) => <li key={item}><span className="font-bold text-primary mr-2">{index + 1}</span>{item}</li>)}</ol></BriefSection>
          <BriefSection title="Before you walk in"><ul className="space-y-2">{brief.preparation.map((item) => <li key={item} className="flex gap-2"><span className="font-bold text-primary">•</span><span>{item}</span></li>)}</ul></BriefSection>
          {brief.valueHypotheses?.length ? <BriefSection title="Value hypotheses to test"><ul className="space-y-2">{brief.valueHypotheses.map((item) => <li key={item} className="flex gap-2"><span className="font-bold text-primary">•</span><span>{item}</span></li>)}</ul></BriefSection> : null}
          {brief.watchouts?.length ? <BriefSection title="Watchouts"><ul className="space-y-2">{brief.watchouts.map((item) => <li key={item} className="flex gap-2"><span className="font-bold text-primary">•</span><span>{item}</span></li>)}</ul></BriefSection> : null}
          <BriefSection title="Walk out with this"><p className="font-semibold">{brief.nextMove}</p></BriefSection>
          {brief.followUpMessage ? <BriefSection title="Follow-up draft"><p className="rounded-xl bg-card p-4">{brief.followUpMessage}</p></BriefSection> : null}
          <div className="pt-3 border-t border-border text-xs text-muted-foreground space-y-1"><p>Source: <a className="text-primary underline" href={brief.source.url} target="_blank" rel="noreferrer">{brief.source.label}</a></p><p>{brief.limitations[0]}</p></div>
          <ToolResultActions
            toolId="spartan-intelligence"
            title="Keep the brief moving"
            description="Save this preparation so it is available in My Work on web and iPhone."
            saveResult={{
              toolId: "spartan-intelligence",
              title: brief.headline,
              kind: "intelligence_brief",
              value: JSON.stringify(brief),
              input: {
                providerNpi: selected?.npi,
                providerName: selected?.name,
                relationshipStage,
                meetingPurpose,
                accountType,
                stakeholderRole,
                knownContext,
                knownBarrier,
                desiredCommitment,
              },
              nextAction: { title: brief.nextMove, href: "/tools/intelligence" },
            }}
            actions={[{ id: "open-my-work", label: "Open My Work", href: "/my-work" }]}
            testId="account-brief-actions"
          />
        </div>
      ) : null}
    </Card>
  );
}

function BriefSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-2 text-sm leading-relaxed text-foreground"><h5 className="text-[10px] font-bold tracking-widest text-primary uppercase">{title}</h5>{children}</section>;
}
