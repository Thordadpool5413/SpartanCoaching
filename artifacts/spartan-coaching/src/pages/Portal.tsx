import { SEO } from "@/components/SEO";
import { FieldKitGate } from "@/components/FieldKitGate";
import { MembershipActivation } from "@/components/MembershipActivation";
import { ElitePortalHome } from "@/components/elite/ElitePortalHome";
import { useAuth } from "@/context/AuthContext";

export default function Portal() {
  const { member, canUseFieldKit, isLoading } = useAuth();

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
      </section>
    </>
  );
}
