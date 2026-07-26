import { Link, useLocation } from "wouter";
import { Shield, Home, Wrench, FolderOpen, BookOpen, Phone, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { FIELD_KIT_WHAT } from "@/lib/fieldKitCatalog";
import { useAuth } from "@/context/AuthContext";

const MEMBER_LINKS = [
  { href: "/portal", label: "Home", icon: Home, match: (loc: string) => loc === "/portal" },
  {
    href: "/tools/sales-workflow",
    label: "Command",
    icon: Crosshair,
    match: (loc: string) => loc.startsWith("/tools/sales-workflow"),
  },
  {
    href: "/tools",
    label: "Tools",
    icon: Wrench,
    match: (loc: string) =>
      (loc === "/tools" || loc.startsWith("/tools/")) && !loc.startsWith("/tools/sales-workflow"),
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

/** Browse-only nav for visitors previewing tools without a subscription */
const PREVIEW_LINKS = [
  {
    href: "/field-kit",
    label: "Overview",
    icon: Home,
    match: (loc: string) => loc === "/field-kit",
  },
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
    href: "/field-kit-membership",
    label: "Pricing",
    icon: Phone,
    match: (loc: string) =>
      loc === "/field-kit-membership" || loc.startsWith("/pricing/field-kit"),
  },
];

/**
 * Persistent orientation strip for Field Kit surfaces.
 * Members get full nav; non-members get a preview browse strip so they can
 * move between tool UIs without live access.
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

  const isPreview = !canUseFieldKit;
  const links = isPreview ? PREVIEW_LINKS : MEMBER_LINKS;

  const trial =
    !isPreview && organization?.status === "trial" && fieldKit?.hoursRemaining != null
      ? fieldKit.hoursRemaining < 24
        ? `${Math.max(1, Math.round(fieldKit.hoursRemaining))}h left in evaluation`
        : `${Math.round(fieldKit.hoursRemaining / 24)}d left in evaluation`
      : !isPreview && organization?.status === "active"
        ? organization?.billingPlan === "individual_weekly"
          ? "Member · $14.99/wk"
          : organization?.billingPlan === "corporate_contract"
            ? "Member · Team"
            : organization?.billingPlan === "comp"
              ? "Member · Comp"
              : "Field Kit Member"
        : null;

  return (
    <div
      className={cn(
        "mb-8 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-4 sm:p-5 space-y-3.5 shadow-elite surface-noise",
        isPreview && "border-primary/30 bg-primary/[0.04]",
        className,
      )}
      data-testid="field-kit-chrome"
      data-preview={isPreview ? "true" : "false"}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-kicker">
            {isPreview
              ? "Field Kit · preview browse"
              : "Field Kit · private operating system"}
          </p>
          <p className="text-sm text-foreground/95 leading-relaxed max-w-2xl">
            {isPreview
              ? "See every tool’s real layout. Live generation and saves unlock with membership."
              : FIELD_KIT_WHAT}
          </p>
          {nextHint && !isPreview && (
            <p className="text-xs text-muted-foreground pt-0.5">
              <span className="font-semibold text-foreground">Next: </span>
              {nextHint}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isPreview && (
            <span className="text-[11px] font-semibold text-primary bg-primary/12 border border-primary/30 rounded-full px-3 py-1">
              View only
            </span>
          )}
          {trial && (
            <span className="text-[11px] font-semibold text-foreground bg-muted/80 border border-border/80 rounded-full px-3 py-1">
              {trial}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground border border-border/80 rounded-full px-3 py-1 bg-background/40">
            <Shield className="w-3 h-3 text-primary" />
            No PHI
          </span>
        </div>
      </div>

      <nav
        className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50"
        aria-label="Field Kit sections"
      >
        {links.map(({ href, label, icon: Icon, match }) => {
          const active = match(location);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-elite-red"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70 border border-transparent hover:border-border/60",
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
