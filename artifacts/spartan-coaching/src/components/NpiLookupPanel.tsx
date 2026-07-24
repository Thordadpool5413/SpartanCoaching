import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Building2, User } from "lucide-react";

export type NpiHit = {
  npi: string;
  name: string;
  credential?: string;
  taxonomy?: string;
  city?: string;
  state?: string;
  phone?: string;
  enumerationType?: string;
};

/**
 * Free CMS NPPES lookup for pre-call prep. No PHI — provider/org names only.
 */
export function NpiLookupPanel({
  className,
  onSelect,
}: {
  className?: string;
  onSelect?: (hit: NpiHit) => void;
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
      if (!(data.results || []).length) setError("No matches — try a broader name or city.");
    } catch (e: any) {
      setError(e?.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={`border border-border bg-card p-4 sm:p-5 space-y-4 ${className || ""}`}
      data-testid="npi-lookup-panel"
    >
      <div className="space-y-1">
        <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
          Pre-call · Public registry
        </p>
        <h3 className="font-bold text-foreground">NPI lookup</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Free CMS NPPES search for provider specialty and location. Use for pre-call context only — never
          enter patient information.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "person" ? "default" : "outline"}
          className="font-bold"
          onClick={() => setMode("person")}
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
        >
          <Building2 className="w-3.5 h-3.5 mr-1" />
          Organization
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {mode === "person" ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">First name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Last name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Required" />
            </div>
          </>
        ) : (
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Organization</Label>
            <Input
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Facility or practice name"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs">City</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">State</Label>
          <Input
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
            placeholder="e.g. FL"
            maxLength={2}
          />
        </div>
      </div>

      <Button type="button" onClick={search} disabled={loading} className="font-bold w-full sm:w-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
        Search NPI
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {results.length > 0 && (
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {results.map((r) => (
            <li
              key={r.npi}
              className="rounded-lg border border-border bg-background/60 p-3 text-sm space-y-1"
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
                </div>
                {onSelect && (
                  <Button type="button" size="sm" variant="outline" className="font-bold" onClick={() => onSelect(r)}>
                    Use
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
