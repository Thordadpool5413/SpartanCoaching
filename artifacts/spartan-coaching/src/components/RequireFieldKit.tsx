import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { FieldKitGate } from "@/components/FieldKitGate";

/** Wraps tool pages — shows consulting gate unless Field Kit entitlement is active. */
export function RequireFieldKit({ children }: { children: ReactNode }) {
  const { isLoading, canUseFieldKit } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!canUseFieldKit) {
    return <FieldKitGate />;
  }

  return (
    <>
      {children}
      <p className="text-center text-[11px] text-muted-foreground py-4 border-t border-white/5">
        Do not enter PHI · Coaching aid only · Not clinical advice
      </p>
    </>
  );
}
