import { AccentText } from "@/components/AccentText";
import { useState, type ComponentType } from "react";
import { BarChart3, BookOpen, Building2, Calculator, Crosshair, Map, Network, ShieldAlert, ShieldCheck, Sparkles, Target } from "lucide-react";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { NpiLookupPanel } from "@/components/NpiLookupPanel";
import { SEO } from "@/components/SEO";
import { PolicyNavigatorPanel } from "@/components/PolicyNavigatorPanel";
import { HospiceMarketPanel } from "@/components/HospiceMarketPanel";
import { MedicareDecisionPanel } from "@/components/MedicareDecisionPanel";
import { MedicareCommandCenter } from "@/components/MedicareCommandCenter";
import { MedicareComparePanel } from "@/components/MedicareComparePanel";
import { cn } from "@/lib/utils";
import { MedicareOperationsPanel } from "@/components/MedicareOperationsPanel";

type Mission = "overview" | "operations" | "referral" | "market" | "compare" | "decision" | "policy";

const MISSIONS: Array<{ id: Mission; label: string; description: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "Overview", description: "Choose the strongest next workflow.", icon: BarChart3 },
  { id: "operations", label: "Intelligence workspaces", description: "Open all national, provider, territory, and monitoring tools.", icon: Building2 },
  { id: "referral", label: "Research a provider", description: "Verify the account and prepare the conversation.", icon: Crosshair },
  { id: "market", label: "Analyze a market", description: "See enrolled hospices across a service area.", icon: Map },
  { id: "compare", label: "Compare providers", description: "Evaluate up to three verified hospices.", icon: Network },
  { id: "decision", label: "Build a decision brief", description: "Turn evidence into one defensible next move.", icon: Target },
  { id: "policy", label: "Answer a policy question", description: "Explain sourced CMS guidance clearly.", icon: BookOpen },
];

export default function SpartanIntelligence() {
  const [mission, setMission] = useState<Mission>("overview");
  const [activeCcn, setActiveCcn] = useState("");
  const openWithCcn = (next: "compare" | "decision", ccn: string) => { setActiveCcn(ccn); setMission(next); };

  return (
    <FieldKitToolLayout toolPath="/tools/intelligence" className="max-w-[90rem]" showHowTo={false}>
      <SEO
        title="CMS Medicare Knowledge Hub | Hospice Sales Pro"
        description="Turn verified Medicare provider, market, and policy evidence into focused hospice sales decisions."
      />

      <header className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">CMS Medicare Knowledge Hub</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified public data
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl"><AccentText>National hospice intelligence, inside your workspace.</AccentText></h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Verify providers, analyze markets, compare evidence, explain policy, and turn the result into one accountable next move without leaving Spartan.
            </p>
          </div>
          <div className="grid gap-2 text-xs font-semibold text-muted-foreground sm:grid-cols-2 lg:grid-cols-1">
            <TrustSignal icon={ShieldCheck} label="Verified fact" detail="CMS or NPPES source" />
            <TrustSignal icon={Calculator} label="Calculated result" detail="Rule-based analysis" />
            <TrustSignal icon={Sparkles} label="Coach guidance" detail="Clearly identified advice" />
            <TrustSignal icon={ShieldAlert} label="Missing evidence" detail="Never scored as zero" />
          </div>
        </div>
      </header>

      <nav className="mt-5 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 xl:grid-cols-7" aria-label="Choose an intelligence mission">
        {MISSIONS.map((item) => {
          const Icon = item.icon;
          const selected = item.id === mission;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMission(item.id)}
              className={cn(
                "flex min-h-24 items-start gap-2 rounded-2xl border p-3 text-left transition sm:gap-3 sm:p-4",
                selected ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/50 hover:bg-muted/30",
              )}
              aria-pressed={selected}
              data-testid={`intelligence-mission-${item.id}`}
            >
              <span className={cn("hidden rounded-xl p-2.5 sm:block", selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}><Icon className="h-5 w-5" /></span>
              <span>
                <span className="block font-black text-foreground">{item.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{item.description}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <section className="mt-5" aria-live="polite" data-testid={`intelligence-workspace-${mission}`}>
        {mission === "overview" ? <MedicareCommandCenter onOpen={(next) => setMission(next)} /> : null}
        {mission === "operations" ? <MedicareOperationsPanel /> : null}
        {mission === "referral" ? <NpiLookupPanel className="p-5 sm:p-7" enableBrief /> : null}
        {mission === "policy" ? <PolicyNavigatorPanel /> : null}
        {mission === "market" ? <HospiceMarketPanel onCompare={(ccn) => openWithCcn("compare", ccn)} onDecide={(ccn) => openWithCcn("decision", ccn)} /> : null}
        {mission === "compare" ? <MedicareComparePanel key={`compare-${activeCcn}`} initialCcn={activeCcn} /> : null}
        {mission === "decision" ? <MedicareDecisionPanel key={`decision-${activeCcn}`} initialCcn={activeCcn} /> : null}
      </section>
    </FieldKitToolLayout>
  );
}

function TrustSignal({ icon: Icon, label, detail }: { icon: typeof ShieldCheck; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span><strong className="text-foreground">{label}</strong><span className="block font-normal">{detail}</span></span>
    </div>
  );
}
