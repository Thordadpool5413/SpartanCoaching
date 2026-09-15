import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { FieldKitPreviewLock } from "@/components/FieldKitPreviewLock";
import { ToolDisclaimer } from "@/components/ToolDisclaimer";
import { ClinicalToolDisclaimer } from "@/components/ClinicalToolDisclaimer";
import { PageLoadingState } from "@/components/RouteRecovery";
import { getSpartanAiTool } from "@workspace/spartan-ai-tools";
import { Link, useLocation } from "wouter";
import { hasEliteMembership } from "@workspace/field-kit-catalog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

/**
 * Wraps tool pages.
 * - Active Membership: full interactive tool + disclaimer
 * - No access: real tool UI in view-only preview (cannot submit / generate / save)
 *   Server routes remain membership-gated at the matching tier.
 */
export function RequireFieldKit({ children, tier = "standard" }: { children: ReactNode; tier?: "standard" | "elite" }) {
  const { isLoading, canUseFieldKit, member, organization } = useAuth();
  const [location] = useLocation();
  const aiToolId = location.match(/^\/tools\/ai\/([^/?#]+)/)?.[1];
  const clinical = aiToolId ? getSpartanAiTool(aiToolId)?.containsPhi === true : false;

  if (isLoading) {
    return <PageLoadingState label="Checking your Hospice Sales Pro access" />;
  }

  if (!canUseFieldKit) {
    return <FieldKitPreviewLock>{children}</FieldKitPreviewLock>;
  }

  const canUseElite = hasEliteMembership({
    billingPlan: organization?.billingPlan,
    organizationType: organization?.type,
    memberRole: member?.role,
  });

  if (tier === "elite" && !canUseElite) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16" data-testid="elite-access-gate">
        <Card className="w-full max-w-xl border border-border bg-card p-8 text-center sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary"><Crown className="h-6 w-6" /></div>
          <h1 className="mt-5 text-2xl font-black text-foreground">Medicare Intelligence requires Elite</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Your account is active, but this national provider, market, territory, and decision workspace is included with Hospice Sales Pro Elite.</p>
          <Button asChild className="mt-6 font-bold"><Link href="/account?subscribe=1&plan=elite_weekly">Upgrade to Elite</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[50vh]">
      <div className="flex-1">{children}</div>
      {clinical ? <ClinicalToolDisclaimer /> : <ToolDisclaimer />}
    </div>
  );
}
