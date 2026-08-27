import { useState, type ComponentType } from "react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Crosshair,
  Database,
  Map,
  ShieldCheck,
} from "lucide-react";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { NpiLookupPanel } from "@/components/NpiLookupPanel";
import { SEO } from "@/components/SEO";
import { PolicyNavigatorPanel } from "@/components/PolicyNavigatorPanel";
import { HospiceMarketPanel } from "@/components/HospiceMarketPanel";
import { cn } from "@/lib/utils";

type Mission = "referral" | "policy" | "market";

const MISSIONS: Array<{
  id: Mission;
  label: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    id: "referral",
    label: "Referral Intelligence",
    title: "Verify a referral source",
    description: "Confirm who they are, where they practice, and what matters before you meet.",
    icon: Crosshair,
  },
  {
    id: "policy",
    label: "CMS Policy Navigator",
    title: "Navigate CMS policy",
    description: "Prepare a clear, sourced explanation for common Medicare hospice conversations.",
    icon: BookOpen,
  },
  {
    id: "market",
    label: "Market Explorer",
    title: "Explore a market",
    description: "Find enrolled hospice organizations and sharpen your market view.",
    icon: Map,
  },
];

export default function SpartanIntelligence() {
  const [mission, setMission] = useState<Mission>("referral");
  const active = MISSIONS.find((item) => item.id === mission) ?? MISSIONS[0];
  const ActiveIcon = active.icon;

  return (
    <FieldKitToolLayout toolPath="/tools/intelligence" className="max-w-[90rem]">
      <SEO
        title="Spartan Intelligence | Hospice Sales Pro"
        description="Verify referral sources, navigate CMS policy, and prepare focused account conversations with trusted public data."
      />

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:gap-8">
        <aside className="h-fit rounded-2xl border border-border/80 bg-card/70 p-4 shadow-sm lg:sticky lg:top-24" aria-label="Spartan Intelligence missions">
          <div className="border-b border-border/70 px-2 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Intelligence</p>
            <h2 className="mt-2 text-lg font-black text-foreground">Mission board</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Choose the preparation you need now.</p>
          </div>

          <nav className="mt-3 space-y-1">
            {MISSIONS.map((item) => {
              const Icon = item.icon;
              const selected = item.id === mission;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMission(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                    selected
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
                  )}
                  aria-current={selected ? "page" : undefined}
                  data-testid={`intelligence-nav-${item.id}`}
                >
                  <span className={cn("rounded-lg p-2", selected ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{item.title}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-5 rounded-xl border border-border bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold text-foreground">Verified data you can trust</p>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Public provider and policy data is sourced from CMS and NPPES. Patient information never belongs here.
            </p>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Hospice Sales Pro Elite</span>
              <span className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Verified public data</span>
            </div>
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">Spartan Intelligence</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              What do you need to know before the next conversation?
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Choose the mission. Spartan Intelligence will surface the facts that matter and help you prepare with confidence.
            </p>
          </header>

          <section className="mt-8 space-y-3" aria-label="Choose an intelligence mission">
            {MISSIONS.map((item) => {
              const Icon = item.icon;
              const selected = item.id === mission;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMission(item.id)}
                  className={cn(
                    "group flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-sm transition sm:p-5",
                    selected ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/50",
                  )}
                  data-testid={`intelligence-mission-${item.id}`}
                >
                  <span className={cn("rounded-xl p-3", selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-black text-foreground">{item.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{item.description}</span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </button>
              );
            })}
          </section>

          <section className="mt-8" aria-live="polite" data-testid={`intelligence-workspace-${mission}`}>
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><ActiveIcon className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Active mission</p>
                <h2 className="mt-1 text-xl font-black text-foreground">{active.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{active.description}</p>
              </div>
            </div>

            {mission === "referral" ? <NpiLookupPanel className="p-5 sm:p-7" enableBrief /> : null}
            {mission === "policy" ? <PolicyNavigatorPanel /> : null}
            {mission === "market" ? <HospiceMarketPanel /> : null}
          </section>

          <section className="mt-8 grid gap-3 sm:grid-cols-3">
            <Promise icon={Database} title="Sourced facts" body="Provider identity and status remain connected to the public record." />
            <Promise icon={Building2} title="Practical preparation" body="Use the result to plan a better conversation, not to make assumptions." />
            <Promise icon={CheckCircle2} title="Clear boundaries" body="The workspace never invents referral volume, influence, or relationship strength." />
          </section>
        </main>
      </div>
    </FieldKitToolLayout>
  );
}

function Promise({ icon: Icon, title, body }: { icon: typeof Database; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="mt-3 font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
