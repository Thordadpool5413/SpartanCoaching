import { Crosshair, Database, ShieldCheck } from "lucide-react";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { NpiLookupPanel } from "@/components/NpiLookupPanel";
import { SEO } from "@/components/SEO";
import { PolicyNavigatorPanel } from "@/components/PolicyNavigatorPanel";
import { HospiceMarketPanel } from "@/components/HospiceMarketPanel";

export default function SpartanIntelligence() {
  return (
    <FieldKitToolLayout toolPath="/tools/intelligence" className="max-w-6xl">
      <SEO title="Spartan Intelligence | Hospice Sales Pro" description="Verify referral sources and prepare focused account conversations with public CMS data and the Spartan Method." />
      <header className="mb-8 max-w-3xl space-y-4">
        <p className="text-[11px] font-bold tracking-[0.24em] text-primary uppercase">Hospice Sales Pro Elite</p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">Know the account before you enter the room.</h1>
        <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">Spartan Intelligence turns verified public provider data into sharper preparation. Facts stay sourced. Strategy stays practical. You still lead the conversation.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        <Promise icon={Database} title="Verified identity" body="Provider identity, specialty, location, and registry status come directly from CMS NPPES." />
        <Promise icon={Crosshair} title="Focused preparation" body="Build a meeting objective, opening, discovery questions, and a clear next move." />
        <Promise icon={ShieldCheck} title="Honest boundaries" body="Public data never pretends to know referral volume, influence, or relationship strength." />
      </div>
      <NpiLookupPanel className="p-5 sm:p-7" enableBrief />
      <div className="mt-6"><PolicyNavigatorPanel /></div>
      <div className="mt-6"><HospiceMarketPanel /></div>
    </FieldKitToolLayout>
  );
}

function Promise({ icon: Icon, title, body }: { icon: typeof Database; title: string; body: string }) {
  return <div className="rounded-xl border border-border bg-card p-4"><Icon className="h-5 w-5 text-primary" /><h2 className="mt-3 font-bold text-foreground">{title}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p></div>;
}
