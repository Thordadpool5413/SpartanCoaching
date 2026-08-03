import { useEffect } from "react";
import { useLocation } from "wouter";

/** Client-side redirect for legacy product URLs → Hospice Sales Pro. */
export default function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [setLocation, to]);
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">
      Redirecting…
    </div>
  );
}

export function RedirectToHospiceSalesPro() {
  return <Redirect to="/hospice-sales-pro" />;
}

/** @deprecated use RedirectToHospiceSalesPro */
export function RedirectToMembership() {
  return <RedirectToHospiceSalesPro />;
}
