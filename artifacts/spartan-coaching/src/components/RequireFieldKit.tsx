import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { FieldKitPreviewLock } from "@/components/FieldKitPreviewLock";
import { ToolDisclaimer } from "@/components/ToolDisclaimer";
import { ClinicalToolDisclaimer } from "@/components/ClinicalToolDisclaimer";
import { getSpartanAiTool } from "@workspace/spartan-ai-tools";
import { useLocation } from "wouter";

/**
 * Wraps tool pages.
 * - Active Field Kit: full interactive tool + disclaimer
 * - No access: real tool UI in view-only preview (cannot submit / generate / save)
 *   Server routes remain requireFieldKit-gated.
 */
export function RequireFieldKit({ children }: { children: ReactNode }) {
  const { isLoading, canUseFieldKit } = useAuth();
  const [location] = useLocation();
  const aiToolId = location.match(/^\/tools\/ai\/([^/?#]+)/)?.[1];
  const clinical = aiToolId ? getSpartanAiTool(aiToolId)?.containsPhi === true : false;

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!canUseFieldKit) {
    return <FieldKitPreviewLock>{children}</FieldKitPreviewLock>;
  }

  return (
    <div className="flex flex-col min-h-[50vh]">
      <div className="flex-1">{children}</div>
      {clinical ? <ClinicalToolDisclaimer /> : <ToolDisclaimer />}
    </div>
  );
}
