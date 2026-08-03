import { useEffect } from "react";
import { useLocation } from "wouter";

/** Client-side redirect for legacy product URLs → Membership. */
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

export function RedirectToMembership() {
  return <Redirect to="/membership" />;
}
