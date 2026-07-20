import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wrench,
  BookOpen,
  UserCircle,
  Phone,
} from "lucide-react";

const PORTAL_LINKS = [
  { href: "/portal", label: "Field Kit", icon: LayoutDashboard },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/articles", label: "Learn", icon: BookOpen },
  { href: "/account", label: "Account", icon: UserCircle },
  { href: "/contact", label: "Coaching", icon: Phone },
];

function isActive(location: string, href: string) {
  if (href === "/portal") return location === "/portal";
  if (href === "/tools") return location === "/tools" || location.startsWith("/tools/");
  if (href === "/articles") {
    return (
      location === "/articles" ||
      location === "/podcasts" ||
      location === "/resources" ||
      location.startsWith("/learn/") ||
      location === "/drills" ||
      location === "/quiz"
    );
  }
  return location === href || location.startsWith(href + "/");
}

/** Compact client workspace nav — used when a member is signed in. */
export function PortalNav({ className }: { className?: string }) {
  const [location] = useLocation();

  return (
    <nav
      className={cn("flex items-center gap-0.5 flex-wrap", className)}
      aria-label="Field Kit navigation"
      data-testid="portal-nav"
    >
      {PORTAL_LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(location, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5",
            )}
            data-testid={`portal-nav-${href.replace(/\//g, "") || "home"}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PortalMobileLinks({
  location,
  onClose,
}: {
  location: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col space-y-1 pb-2" data-testid="portal-mobile-nav">
      <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2 pb-1">
        Field Kit
      </p>
      {PORTAL_LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          onClick={() => onClose()}
          className={cn(
            "px-4 py-3 rounded-lg text-sm font-medium touch-manipulation min-h-[44px] flex items-center transition-all",
            isActive(location, href)
              ? "text-primary bg-primary/10 border-l-2 border-primary"
              : "text-foreground bg-muted/30",
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
