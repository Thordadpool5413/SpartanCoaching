import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductMapGroup = {
  title: string;
  description: string;
  /** Optional deep link */
  href?: string;
};

type Props = {
  className?: string;
  groups?: ProductMapGroup[];
  /** Show full-width Command Center spine */
  showSpine?: boolean;
};

const DEFAULT_GROUPS: ProductMapGroup[] = [
  {
    title: "Practice",
    description: "Objections, role-play, email, playbooks — before you walk in.",
    href: "/tools",
  },
  {
    title: "Plan & measure",
    description: "Weekly plan, activity, ROI, rep cost, branch math.",
    href: "/tools",
  },
  {
    title: "Resources",
    description: "Templates, scripts, checklists you can fill and print.",
    href: "/resources",
  },
  {
    title: "Learn",
    description: "Articles, podcasts, drills, and knowledge for the week.",
    href: "/portal/learn",
  },
];

/**
 * Hospice Sales Pro inventory map — spine first, then satellite groups.
 * One emphasis surface; satellites stay quiet.
 */
export function ProductMap({
  className,
  groups = DEFAULT_GROUPS,
  showSpine = true,
}: Props) {
  return (
    <div className={cn("space-y-4", className)} data-testid="product-map">
      {showSpine && (
        <Card className="border border-primary/35 bg-primary/5 p-5 sm:p-6 elite-emphasis">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                <Crosshair className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-primary">
                  Daily spine
                </p>
                <p className="text-lg font-bold text-foreground tracking-tight">
                  Sales Command Center
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1 max-w-xl">
                  Plan the visit → practice if needed → capture outcome → lock the next step.
                  Everything else is a satellite of this workflow.
                </p>
              </div>
            </div>
            <Button asChild className="font-bold shrink-0" data-testid="product-map-command">
              <Link href="/tools/sales-workflow">
                Open Command Center
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {groups.map((g) => (
          <Card
            key={g.title}
            className="p-4 sm:p-5 border border-border/80 bg-card h-full shadow-none hover:shadow-sm"
          >
            <p className="text-[10px] font-bold tracking-widest uppercase text-primary mb-2">
              {g.title}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{g.description}</p>
            {g.href && (
              <Link
                href={g.href}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                Browse
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
