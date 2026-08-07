import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { MenuIcon, CloseIcon } from "./icons";
import { Button } from "@/components/ui/button";
import { Linkedin, Search, ChevronDown, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AppearanceControls, AppearancePanel } from "@/components/AppearanceControls";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { navSections, allSearchablePages } from "@/lib/navigation";
import { PortalNav, PortalMobileLinks } from "@/components/PortalNav";
import { useIsMobile } from "@/hooks/use-breakpoint";

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative px-3 py-2 text-sm font-semibold tracking-wide transition-colors block whitespace-nowrap rounded-lg",
        isActive
          ? "text-primary after:absolute after:left-3 after:right-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary after:content-['']"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, label, location, onClose }: { href: string; label: string; location: string; onClose: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "px-4 py-3.5 rounded-xl text-sm font-semibold touch-manipulation min-h-[48px] flex items-center transition-all border",
        location === href
          ? "text-primary bg-primary/12 border-primary/30 shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
          : "text-foreground bg-card/50 border-border/50 active:bg-muted/50"
      )}
      data-testid={`link-mobile-${href}`}
    >
      {label}
    </Link>
  );
}

function MobileNavSection({ title }: { title: string }) {
  return (
    <div className="pt-3 pb-1">
      <span className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
    </div>
  );
}

function NavDropdown({ label, items, dataTestId }: { 
  label: string; 
  items: { path: string; label: string; description: string }[];
  dataTestId: string;
}) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = `nav-menu-${dataTestId}`;
  const isGroupActive = items.some(item => location === item.path || location.startsWith(item.path + '/'));

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent | PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        const btn = rootRef.current?.querySelector("button");
        btn?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  
  return (
    <div
      ref={rootRef}
      className="relative"
      data-testid={dataTestId}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button 
        type="button"
        className={cn(
          "px-3 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate flex items-center gap-1 whitespace-nowrap cursor-pointer",
          isGroupActive || open
            ? "text-primary border-b-2 border-primary rounded-none"
            : "text-foreground hover:text-foreground"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${label} menu`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {label}
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <div
        id={menuId}
        role="menu"
        aria-label={label}
        hidden={!open}
        className={cn(
          "absolute top-full left-0 pt-2 z-50 min-w-[220px]",
          open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none",
          "transition-opacity duration-150",
        )}
      >
        <div className="bg-popover border rounded-lg shadow-lg py-2">
          {items.map(item => (
            <Link
              key={item.path}
              href={item.path}
              role="menuitem"
              tabIndex={open ? 0 : -1}
              className={cn(
                "block px-4 py-2.5 text-sm hover-elevate transition-colors focus-visible:bg-muted/60 focus-visible:outline-none",
                location === item.path
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground"
              )}
              data-testid={`link-nav-${item.path.replace(/\//g, '-')}`}
              onClick={() => setOpen(false)}
            >
              <div className="font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


export function Header() {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated, canUseFieldKit, member } = useAuth();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const allSearchItems = allSearchablePages;
  // Marketing home always — Portal is for signed-in members.
  const homeHref = "/";

  const filteredResults = searchQuery.trim()
    ? allSearchItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allSearchItems;

  const handleSearchSelect = (path: string) => {
    setLocation(path);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-50 w-full dark-authority-header safe-area-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.25rem] sm:h-[4.5rem] md:h-20 flex items-center safe-area-x">
        {/* Brand — fixed footprint, never collides with nav */}
        <div className="shrink-0 flex items-center pr-4 sm:pr-6 lg:pr-8 lg:mr-2 lg:border-r lg:border-border/50">
          <Link href={homeHref}>
            <div
              className="flex items-center gap-3 sm:gap-3.5 hover:opacity-95 transition-opacity cursor-pointer touch-manipulation group"
              data-testid="link-home"
            >
              <img
                src="/spartan-logo-stamp.png"
                alt=""
                className="h-8 w-8 sm:h-9 sm:w-9 object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.45)] shrink-0"
                width={36}
                height={36}
                decoding="async"
              />
              <div className="min-w-0">
                {/* Not h1 — page content owns the document title heading (a11y) */}
                <span className="font-black text-lg sm:text-xl md:text-[1.35rem] text-primary tracking-tight font-display block leading-none group-hover:text-primary whitespace-nowrap">
                  SPARTAN COACHING
                </span>
                <span className="hidden md:block text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground mt-1.5 whitespace-nowrap">
                  Consulting · Hospice Sales Pro
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation — elite restraint: few labels + one CTA */}
        <nav
          className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-1.5 min-w-0 px-4 xl:px-8"
          aria-label="Main navigation"
        >
          {isAuthenticated ? (
            <>
              <PortalNav />
            </>
          ) : (
            <>
              {navSections
                .filter((section) => section.title !== "Company")
                .map((section) => (
                  <NavDropdown
                    key={section.title}
                    label={section.title}
                    dataTestId={`dropdown-${section.title.toLowerCase().replace(/\s+/g, "-")}`}
                    items={section.items}
                  />
                ))}
              <NavLink href="/about">About</NavLink>
            </>
          )}
        </nav>

        {/* Utility actions — Login + single primary CTA (no duplicate Home) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto pl-3 sm:pl-4 lg:pl-6 lg:border-l lg:border-border/50">
          <AppearanceControls
            compact
            className="touch-manipulation"
            testId="button-appearance-header"
          />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden touch-manipulation text-foreground"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            data-testid="button-mobile-search"
          >
            <Search className="w-5 h-5" />
          </Button>
          {!isAuthenticated && (
            <Button
              size="sm"
              variant="ghost"
              asChild
              className="hidden lg:inline-flex font-semibold text-foreground"
              data-testid="button-login"
            >
              <Link href="/login">
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            asChild
            className="hidden sm:inline-flex font-bold px-4 shrink-0"
            data-testid="button-book-call"
          >
            <Link href="/contact">Book a strategy call</Link>
          </Button>

          {/* Mobile Menu Sheet */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden touch-manipulation"
                aria-label="Toggle menu"
                data-testid="button-mobile-menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-[350px] p-0 flex flex-col h-full max-h-[100dvh] bg-background border-border">
            <SheetHeader className="px-5 pt-5 pb-3 shrink-0">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5"
              style={{ WebkitOverflowScrolling: 'touch' }}
              data-testid="mobile-menu-scroll-container"
            >
              <nav className="flex flex-col space-y-1" aria-label="Mobile navigation">
                <MobileNavLink
                  href={homeHref}
                  label="Home"
                  location={location}
                  onClose={() => setMobileMenuOpen(false)}
                />
                {isAuthenticated ? (
                  <>
                    <PortalMobileLinks onNavigate={() => setMobileMenuOpen(false)} />
                    <MobileNavSection title="Site" />
                    <MobileNavLink href="/services" label="Services" location={location} onClose={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/about" label="About" location={location} onClose={() => setMobileMenuOpen(false)} />
                  </>
                ) : (
                  <>
                    <MobileNavLink href="/login" label="Client Login" location={location} onClose={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/register" label="Create account · Hospice Sales Pro" location={location} onClose={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/request-access" label="Team / evaluation access" location={location} onClose={() => setMobileMenuOpen(false)} />
                    {navSections.map((section) => (
                      <div key={section.title}>
                        <MobileNavSection title={section.title} />
                        <div className="flex flex-col space-y-1">
                          {section.items.map((item) => (
                            <MobileNavLink key={item.path} href={item.path} label={item.label} location={location} onClose={() => setMobileMenuOpen(false)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </nav>
            </div>
            <div className="shrink-0 border-t border-border px-5 py-4 space-y-3 max-h-[45dvh] overflow-y-auto">
              <AppearancePanel className="pb-1" />
              {canUseFieldKit ? (
                <Button size="lg" asChild className="w-full font-bold touch-manipulation" data-testid="button-mobile-command">
                  <Link href="/tools/sales-workflow" onClick={() => setMobileMenuOpen(false)}>
                    Open Command Center
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="w-full font-bold touch-manipulation" data-testid="button-mobile-book-call">
                  <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                    Book a Call
                  </Link>
                </Button>
              )}
              {!isAuthenticated && (
                <>
                  <Button size="lg" variant="outline" asChild className="w-full font-bold touch-manipulation" data-testid="button-mobile-register">
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      Create account · Hospice Sales Pro
                    </Link>
                  </Button>
                  <Button size="lg" variant="ghost" asChild className="w-full font-semibold touch-manipulation" data-testid="button-mobile-request">
                    <Link href="/request-access" onClick={() => setMobileMenuOpen(false)}>
                      Team / evaluation access
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[600px]" data-testid="dialog-search">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>
              Search through pages and AI tools to quickly navigate to what you need.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search pages and tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
                data-testid="input-search"
                aria-label="Search pages and tools"
              />
            </div>
            <div className="max-h-[40dvh] overflow-y-auto space-y-1">
              {filteredResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-results">
                  No results found
                </div>
              ) : (
                filteredResults.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleSearchSelect(item.path)}
                    className="w-full text-left px-4 py-3 rounded-lg hover-elevate active-elevate-2 transition-colors"
                    data-testid={`button-search-result-${item.path}`}
                    aria-label={`Navigate to ${item.label}`}
                  >
                    <div className="font-medium text-foreground">{item.label}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}

export function Footer() {
  const [location] = useLocation();
  const { canUseFieldKit } = useAuth();
  const padBottom =
    location === "/contact" || canUseFieldKit
      ? "1rem"
      : "calc(5rem + env(safe-area-inset-bottom, 0px))";

  const memberLinks = [
    { href: "/portal", label: "Portal" },
    { href: "/tools/sales-workflow", label: "Command Center" },
    { href: "/tools", label: "All tools" },
    { href: "/resources", label: "Resources" },
    { href: "/portal/learn", label: "Learn" },
    { href: "/account", label: "Account" },
    { href: "/contact?service=Hospice+Sales+Pro+Debrief", label: "Coach" },
    { href: "/compliance", label: "Compliance" },
    { href: "/faq", label: "FAQ" },
  ];

  const publicLinks = [
    { href: "/hospice-sales-pro", label: "Hospice Sales Pro" },
    { href: "/tools", label: "Preview tools" },
    { href: "/services", label: "Consulting" },
    { href: "/register", label: "Create account" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Book a call" },
    { href: "/request-access", label: "Team access" },
    { href: "/login", label: "Client Login" },
    { href: "/resources", label: "Resources" },
    { href: "/compliance", label: "Compliance" },
    { href: "/faq", label: "FAQ" },
  ];

  const links = canUseFieldKit ? memberLinks : publicLinks;

  return (
    <>
      <footer className="mt-auto border-t border-border bg-background no-print safe-area-bottom">
        {/* 3-column main footer */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
          <div className={`grid grid-cols-1 gap-10 md:gap-8 lg:gap-16 ${canUseFieldKit ? "md:grid-cols-2" : "md:grid-cols-3"}`}>

            {/* Column 1 — Brand + contact */}
            <div className="flex flex-col gap-4">
              <div>
                <p className="font-display text-lg font-black text-foreground tracking-tight uppercase">Spartan Coaching</p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
                  {canUseFieldKit ? "Hospice Sales Pro · Portal" : "Consulting · Hospice Sales Pro"}
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {canUseFieldKit
                  ? "Your Hospice Sales Pro portal — Command Center, tools, resources, and coaching when you need a human."
                  : "Hospice growth consulting and Hospice Sales Pro (tools & resources) on web and iPhone — two clear offers, one firm."}
              </p>
              <p className="text-xs text-muted-foreground/90 leading-relaxed border-l-2 border-primary/50 pl-3">
                {canUseFieldKit
                  ? "No PHI in tools · Cancel anytime from Account · Ethics-first field work"
                  : "Consulting for teams · Hospice Sales Pro $14.99/wk · Preview free · Cancel anytime · No PHI in tools"}
              </p>
              <div className="flex flex-col gap-2">
                <a href="mailto:nick@spartanhospicecoaching.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-email">
                  nick@spartanhospicecoaching.com
                </a>
                <a
                  href="https://www.linkedin.com/in/nicholas-lynch-coaching"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  data-testid="link-linkedin-footer"
                  aria-label="Connect with Nick Lynch on LinkedIn"
                >
                  <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Connect with Nick Lynch
                </a>
              </div>
            </div>

            {/* Column 2 — Quick navigation */}
            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-widest">
                {canUseFieldKit ? "Portal" : "Quick Links"}
              </p>
              <nav className="grid grid-cols-2 gap-x-4 gap-y-2">
                {links.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5"
                    data-testid={`link-footer-${href.replace(/\//g, "-").replace(/^-/, "").slice(0, 40)}`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Column 3 — Newsletter (public only) */}
            {!canUseFieldKit && (
              <div className="flex flex-col gap-4" data-testid="section-newsletter">
                <p className="text-xs font-bold text-foreground uppercase tracking-widest">Weekly Coaching Tips</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Actionable hospice sales strategies delivered to your inbox. No fluff.
                </p>
                <NewsletterSignup />
              </div>
            )}

          </div>
        </div>

        {/* Legal bottom bar */}
        <div className="border-t border-border/50 dark:border-red-900/10">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4" style={{ paddingBottom: padBottom }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground order-last sm:order-first">
                © 2026 Spartan Coaching. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                {[
                  { href: "/privacy", label: "Privacy", testId: "link-privacy" },
                  { href: "/terms", label: "Terms", testId: "link-terms" },
                  { href: "/disclaimer", label: "Disclaimer", testId: "link-disclaimer" },
                  { href: "/compliance", label: "Compliance", testId: "link-compliance-legal" },
                  { href: "/legal", label: "Legal", testId: "link-legal" },
                ].map(({ href, label, testId }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                    data-testid={testId}
                  >
                    {label}
                  </Link>
                ))}
                <AppearanceControls
                  compact
                  className="ml-1 h-7 w-7"
                  testId="button-appearance-footer"
                />
              </div>
            </div>
          </div>
        </div>
      </footer>

    </>
  );
}