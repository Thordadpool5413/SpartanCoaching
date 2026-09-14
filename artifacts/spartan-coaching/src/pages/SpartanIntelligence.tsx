import { AccentText } from "@/components/AccentText";
import { useState, type ComponentType } from "react";
import { BarChart3, BookOpen, Building2, Calculator, Crosshair, Database, ExternalLink, Map, Network, Search, ShieldAlert, ShieldCheck, Sparkles, Stethoscope, Target, Trophy } from "lucide-react";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { NpiLookupPanel } from "@/components/NpiLookupPanel";
import { SEO } from "@/components/SEO";
import { PolicyNavigatorPanel } from "@/components/PolicyNavigatorPanel";
import { HospiceMarketPanel } from "@/components/HospiceMarketPanel";
import { MedicareDecisionPanel } from "@/components/MedicareDecisionPanel";
import { cn } from "@/lib/utils";

type Mission = "referral" | "market" | "decision" | "policy";
type Experience = "national" | "field";

const CMS_PLATFORM_URL = "https://oklahoma-hospice-intelligence-os-mogirs.v2.appdeploy.ai/";

const PLATFORM_WORKSPACES = [
  { label: "Command Center", detail: "National and state market signal", icon: BarChart3 },
  { label: "Decision Room", detail: "Evidence, confidence, guardrails, action", icon: Target },
  { label: "Provider 360", detail: "Utilization, quality, ownership, history", icon: Building2 },
  { label: "National Search", detail: "Find Medicare-certified hospices", icon: Search },
  { label: "Provider Compare", detail: "Compare three organizations", icon: Network },
  { label: "Growth Strategy", detail: "Build a measurable 90-day plan", icon: Trophy },
  { label: "Territory Deployment", detail: "County evidence and service geography", icon: Map },
  { label: "Referral Market", detail: "Hospitals, SNFs, and physicians", icon: Stethoscope },
  { label: "Data Lab", detail: "Source health, periods, and diagnostics", icon: Database },
] as const;

const MISSIONS: Array<{ id: Mission; label: string; description: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "referral", label: "Research a provider", description: "Verify the account and prepare the conversation.", icon: Crosshair },
  { id: "market", label: "Analyze a market", description: "See enrolled hospices across a service area.", icon: Map },
  { id: "decision", label: "Build a decision brief", description: "Turn evidence into one defensible next move.", icon: Target },
  { id: "policy", label: "Answer a policy question", description: "Explain sourced CMS guidance clearly.", icon: BookOpen },
];

export default function SpartanIntelligence() {
  const [experience, setExperience] = useState<Experience>("national");
  const [mission, setMission] = useState<Mission>("referral");

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
              Explore the complete CMS intelligence platform or switch to the focused field assistant. Evidence, source periods, confidence, guardrails, and next actions remain visible.
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

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between" data-testid="cms-hub-experience-switcher">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-1 sm:w-auto">
          <button type="button" onClick={() => setExperience("national")} aria-pressed={experience === "national"} className={cn("rounded-lg px-4 py-2.5 text-sm font-black transition", experience === "national" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>National platform</button>
          <button type="button" onClick={() => setExperience("field")} aria-pressed={experience === "field"} className={cn("rounded-lg px-4 py-2.5 text-sm font-black transition", experience === "field" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Field assistant</button>
        </div>
        <a href={CMS_PLATFORM_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-foreground hover:border-primary/50">Open full screen <ExternalLink className="h-4 w-4" /></a>
      </div>

      {experience === "national" ? <section className="mt-5 space-y-4" data-testid="cms-national-platform">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_WORKSPACES.map(({ label, detail, icon: Icon }) => <article key={label} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"><span className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></span><span><strong className="block text-sm text-foreground">{label}</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">{detail}</span></span></article>)}
        </div>
        <div className="overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span><strong className="text-foreground">Live CMS platform</strong> · Public evidence plus your private decision workspace</span><span>No patient data · Sources and limitations stay visible</span></div>
          <iframe title="CMS Medicare Knowledge Hub national intelligence platform" src={CMS_PLATFORM_URL} className="h-[78vh] min-h-[720px] w-full bg-background" allow="clipboard-write" referrerPolicy="strict-origin-when-cross-origin" />
        </div>
      </section> : <>

      <nav className="mt-5 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4" aria-label="Choose an intelligence mission">
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
        {mission === "referral" ? <NpiLookupPanel className="p-5 sm:p-7" enableBrief /> : null}
        {mission === "policy" ? <PolicyNavigatorPanel /> : null}
        {mission === "market" ? <HospiceMarketPanel /> : null}
        {mission === "decision" ? <MedicareDecisionPanel /> : null}
      </section>
      </>}
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
