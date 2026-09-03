import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

type Receipt = {
  days: number;
  highlights: string[];
  checklistDone: number;
  totalEvents: number;
};

/**
 * Weekly value receipt — web Account (craft Phase 4).
 */
export function ValueReceipt({ className }: { className?: string }) {
  const [data, setData] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/me/value-receipt", { credentials: "include" });
        if (!res.ok) throw new Error("fail");
        const json = (await res.json()) as Receipt;
        if (alive) setData(json);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Card
      className={`border border-border bg-card p-5 space-y-3 ${className || ""}`}
      data-testid="value-receipt-web"
    >
      <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
        This week · value receipt
      </p>
      <h2 className="text-lg font-display font-bold text-foreground">What you <span className="text-spartan-red">used</span></h2>
      {loading ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </p>
      ) : (
        <ul className="space-y-2">
          {(data?.highlights ?? ["No tracked activity yet — open Portal or a tool"]).map((h) => (
            <li key={h} className="flex gap-2 text-sm text-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Last {data?.days ?? 7} days · same seat on iPhone and web
      </p>
    </Card>
  );
}
