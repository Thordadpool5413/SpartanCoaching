import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { PORTAL_HEADER_NAV, MEMBER_NAV, type MemberNavItem } from "@/lib/memberNav";

function NavList({
  items,
  className,
  dense = false,
  testId = "portal-nav",
  ariaLabel = "Hospice Sales Pro portal navigation",
}: {
  items: MemberNavItem[];
  className?: string;
  dense?: boolean;
  testId?: string;
  ariaLabel?: string;
}) {
  const [location] = useLocation();

  return (
    <nav
      className={cn(
        "flex items-center gap-0.5",
        // Mobile: horizontal scroll chips; md+: wrap
        "overflow-x-auto max-w-full scrollbar-thin -mx-1 px-1",
        "md:flex-wrap md:overflow-visible",
        className,
      )}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {items.map(({ href, label, short, icon: Icon, match }) => {
        const active = match(location);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              dense ? "px-2.5 py-2 text-xs sm:text-sm" : "px-3 py-2 min-h-10",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
            aria-current={active ? "page" : undefined}
            data-testid={`portal-nav-${href.replace(/[^a-z0-9]+/gi, "") || "home"}`}
          >
            <Icon className={cn("shrink-0", dense ? "w-3.5 h-3.5" : "w-4 h-4")} aria-hidden />
            <span className="sm:hidden">{short ?? label}</span>
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Compact client workspace nav — used when a member is signed in (header). */
export function PortalNav({ className }: { className?: string }) {
  return <NavList items={PORTAL_HEADER_NAV} className={className} />;
}

/** Mobile sheet links for portal (full labels). */
export function PortalMobileLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const [location] = useLocation();
  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Portal menu">
      {MEMBER_NAV.map(({ href, label, icon: Icon, match }) => {
        const active = match(location);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold min-h-12 border transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "text-primary bg-primary/12 border-primary/30 shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
                : "text-foreground bg-card/50 border-border/50 active:bg-muted/50",
            )}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
