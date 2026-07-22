import { Link, useLocation } from "wouter";
import { Shield, Home, Wrench, FolderOpen, BookOpen, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { FIELD_KIT_WHAT } from "@/lib/fieldKitCatalog";
import { useAuth } from "@/context/AuthContext";

const LINKS = [
  { href: "/portal", label: "Home", icon: Home, match: (loc: string) => loc === "/portal" },
  {
    href: "/tools",
    label: "Tools",
    icon: Wrench,
    match: (loc: string) => loc === "/tools" || loc.startsWith("/tools/"),
  },
  {
    href: "/resources",
    label: "Resources",
    icon: FolderOpen,
    match: (loc: string) => loc === "/resources" || loc.startsWith("/resources/"),
  },
  {
    href: "/portal/learn",
    label: "Learn",
    icon: BookOpen,
    match: (loc: string) =>
      loc === "/portal/learn" ||
      loc === "/drills" ||
      loc === "/quiz" ||
      loc.startsWith("/learn/") ||
      loc === "/articles" ||
      loc === "/podcasts",
  },
  {
    href: "/contact?service=Field+Kit+Debrief",
    label: "Debrief",
    icon: Phone,
    match: (loc: string) => loc.startsWith("/contact"),
  },
];

/**
 * Persistent orientation strip for Field Kit surfaces.
 */
export function FieldKitChrome({
  className,
  nextHint,
}: {
  className?: string;
  nextHint?: string | null;
}) {
  const { canUseFieldKit, organization, fieldKit } = useAuth();
  const [location] = useLocation();

  if (!canUseFieldKit) return null;

  const trial =
    organization?.status === "trial" && fieldKit?.hoursRemaining != null
      ? fieldKit.hoursRemaining < 24
        ? `${Math.max(1, Math.round(fieldKit.hoursRemaining))}h left in evaluation`
        : `${Math.round(fieldKit.hoursRemaining / 24)}d left in evaluation`
      : organization?.status === "active"
        ? "Active client access"
        : null;

  return (
    <div
      className={cn(
        "mb-8 rounded-xl border border-border bg-card/80 p-4 sm:p-5 space-y-3",
        className,
      )}
      data-testid="field-kit-chrome"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Field Kit</p>
          <p className="text-sm text-foreground leading-relaxed max-w-2xl">{FIELD_KIT_WHAT}</p>
          {nextHint && (
            <p className="text-xs text-muted-foreground pt-0.5">
              <span className="font-semibold text-foreground">Next: </span>
              {nextHint}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {trial && (
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-200 bg-amber-500/10 border border-amber-500/25 rounded-md px-2.5 py-1">
              {trial}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground border border-border rounded-md px-2.5 py-1">
            <Shield className="w-3 h-3 text-primary" />
            No PHI
          </span>
        </div>
      </div>

      <nav
        className="flex flex-wrap gap-1.5 pt-1 border-t border-border/60"
        aria-label="Field Kit sections"
      >
        {LINKS.map(({ href, label, icon: Icon, match }) => {
          const active = match(location);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70",
              )}
              data-testid={`field-kit-chrome-${label.toLowerCase()}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
