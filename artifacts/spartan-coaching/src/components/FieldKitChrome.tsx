import { Link, useLocation } from "wouter";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { FIELD_KIT_WHAT } from "@/lib/fieldKitCatalog";
import { useAuth } from "@/context/AuthContext";
import { MEMBER_NAV, PREVIEW_NAV } from "@/lib/memberNav";

/**
 * Persistent orientation strip for Hospice Sales Pro tool surfaces.
 * Members get full nav; non-members get a preview browse strip.
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
  // Chrome omits Account (in header) to keep tool strip focused; Debrief uses Coach label.
  const links = isPreview
    ? PREVIEW_NAV
    : MEMBER_NAV.filter((item) => item.href !== "/account");

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
              : "Member"
        : null;

  return (
    <div
      className={cn(
        "mb-6 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-3 sm:p-4 space-y-3",
        isPreview && "border-primary/25 bg-primary/[0.03]",
        className,
      )}
      data-testid="membership-chrome"
      data-preview={isPreview ? "true" : "false"}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-bold tracking-widest uppercase text-primary">
            {isPreview ? "Hospice Sales Pro · preview" : "Hospice Sales Pro"}
          </p>
          {isPreview ? (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Preview real tool layouts. Live runs unlock with a Hospice Sales Pro subscription.
            </p>
          ) : nextHint ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Next: </span>
              {nextHint}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {FIELD_KIT_WHAT}
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
            <Shield className="w-3 h-3 text-primary" aria-hidden />
            No PHI
          </span>
        </div>
      </div>

      <nav
        className="flex gap-1.5 pt-2 border-t border-border/50 overflow-x-auto scrollbar-thin pb-0.5 -mx-0.5 px-0.5"
        aria-label="Hospice Sales Pro sections"
      >
        {links.map(({ href, label, icon: Icon, match }) => {
          const active = match(location);
          return (
            <Link
              key={`${label}-${href}`}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 min-h-10 rounded-lg transition-colors duration-200 shrink-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70",
              )}
              data-testid={`membership-chrome-${label.toLowerCase().replace(/\s+/g, "-")}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
