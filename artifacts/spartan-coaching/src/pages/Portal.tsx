import { SEO } from "@/components/SEO";
import { FieldKitGate } from "@/components/FieldKitGate";
import { MembershipActivation } from "@/components/MembershipActivation";
import { ElitePortalHome } from "@/components/elite/ElitePortalHome";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export default function Portal() {
  const { member, canUseFieldKit, isLoading } = useAuth();
  const [alsoLeadsTeam, setAlsoLeadsTeam] = useState(false);

  useEffect(() => {
    if (!canUseFieldKit) return;
    void fetch("/api/me/onboarding", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setAlsoLeadsTeam(Boolean(data?.member?.alsoLeadsTeam)))
      .catch(() => undefined);
  }, [canUseFieldKit]);

  async function updateLeadershipPreference(checked: boolean) {
    setAlsoLeadsTeam(checked);
    await fetch("/api/me/onboarding", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alsoLeadsTeam: checked }),
    }).catch(() => setAlsoLeadsTeam(!checked));
  }

  if (isLoading) {
    return <div className="grid min-h-[60vh] place-items-center" role="status"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /><span className="sr-only">Loading workspace</span></div>;
  }

  if (!canUseFieldKit) return <FieldKitGate />;

  return (
    <>
      <SEO title="Hospice Sales Pro Workspace | Spartan Coaching" noIndex />
      <MembershipActivation />
      <section id="section-mission-next" aria-labelledby="portal-next-action-heading" aria-live="polite">
        <h1 id="portal-next-action-heading" className="sr-only">Your Hospice Sales Pro workspace</h1>
        <ElitePortalHome
          firstName={member?.name?.split(" ")[0] || ""}
          nextMove={{
            title: "Open today’s Command Center",
            desc: "Choose the next account, prepare the conversation, record the outcome, and lock the next commitment.",
            href: "/tools/sales-workflow",
          }}
        />
        <div className="mx-auto -mt-3 w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
          <details className="rounded-xl border border-border/70 bg-card/40 p-4">
            <summary className="cursor-pointer text-sm font-bold text-foreground">Personalize recommendations</summary>
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
              <div><p className="text-sm font-semibold">I also lead a team</p><p className="mt-1 text-xs text-muted-foreground">Include leadership and coaching recommendations in your workspace.</p></div>
              <Switch checked={alsoLeadsTeam} onCheckedChange={(checked) => void updateLeadershipPreference(checked)} data-testid="switch-also-leads-team" aria-label="I also lead a team" />
            </div>
          </details>
        </div>
      </section>
    </>
  );
}
