import { Lock } from "lucide-react";

export function ContentNotice() {
  return (
    <div
      className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-4 py-3 mb-6 print:hidden"
      data-testid="notice-content-restriction"
    >
      <Lock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <p className="text-sm text-muted-foreground leading-relaxed">
        <strong className="text-foreground font-medium">Personal use only.</strong>{" "}
        This content may not be resold, redistributed, or reproduced in any form without prior written permission from Spartan Coaching.
      </p>
    </div>
  );
}
