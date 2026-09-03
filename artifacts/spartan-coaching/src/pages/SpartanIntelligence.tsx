import { AccentText } from "@/components/AccentText";
import { useState, type ComponentType } from "react";
import { BookOpen, CheckCircle2, Crosshair, Database, Map, ShieldCheck } from "lucide-react";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { NpiLookupPanel } from "@/components/NpiLookupPanel";
import { SEO } from "@/components/SEO";
import { PolicyNavigatorPanel } from "@/components/PolicyNavigatorPanel";
import { HospiceMarketPanel } from "@/components/HospiceMarketPanel";
import { cn } from "@/lib/utils";

type Mission = "referral" | "policy" | "market";

const MISSIONS: Array<{ id: Mission; label: string; description: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "referral", label: "Prepare for an account", description: "Verify a referral source and build a focused meeting brief.", icon: Crosshair },
  { id: "policy", label: "Answer a policy question", description: "Find sourced CMS guidance and explain it clearly.", icon: BookOpen },
  { id: "market", label: "Understand a market", description: "Explore enrolled hospice organizations in a service area.", icon: Map },
];

export default function SpartanIntelligence() {
  const [mission, setMission] = useState<Mission>("referral");

  return (
    <FieldKitToolLayout toolPath="/tools/intelligence" className="max-w-[90rem]" showHowTo={false}>
      <SEO
        title="Spartan Intelligence | Hospice Sales Pro"
        description="Verify referral sources, navigate CMS policy, and prepare focused account conversations with trusted public data."
      />

      <header className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.10] via-card to-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary-foreground">Spartan Intelligence</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified public data
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl"><AccentText>Walk into the next conversation prepared.</AccentText></h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Choose a mission and work in one focused space. Every result stays connected to its public source, with no patient information or invented referral data.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" /> CMS and NPPES sourced
          </div>
        </div>
      </header>

      <nav className="mt-5 grid gap-3 md:grid-cols-3" aria-label="Choose an intelligence mission">
        {MISSIONS.map((item) => {
          const Icon = item.icon;
          const selected = item.id === mission;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMission(item.id)}
              className={cn(
                "flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition",
                selected ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/50 hover:bg-muted/30",
              )}
              aria-pressed={selected}
              data-testid={`intelligence-mission-${item.id}`}
            >
              <span className={cn("rounded-xl p-2.5", selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}><Icon className="h-5 w-5" /></span>
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
      </section>
    </FieldKitToolLayout>
  );
}

function Promise({ icon: Icon, title, body }: { icon: typeof Database; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="mt-3 font-bold text-foreground"><AccentText>{title}</AccentText></h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
