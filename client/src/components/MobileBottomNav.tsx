import { Link, useLocation } from "wouter";
import { Home, Wrench, BookOpen, ClipboardList, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tools", label: "AI Tools", icon: Wrench },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/assessment/active", label: "Assessment", icon: ClipboardList },
  { href: "/contact", label: "Contact", icon: Phone },
];

export function MobileBottomNav() {
  const [location] = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
      }}
      className="bg-background border-t border-border"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? location === "/"
              : href.startsWith("/assessment")
              ? location.startsWith("/assessment")
              : location === href || location.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors min-h-[44px] cursor-pointer select-none",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              data-testid={`link-bottom-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon className={cn("w-5 h-5", isActive ? "scale-110" : "scale-100")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
