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
import { PortalMobileLinks } from "@/components/PortalNav";
import { useIsMobile } from "@/hooks/use-breakpoint";

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex h-full min-h-12 items-center whitespace-nowrap border-x border-transparent px-5 font-mono text-[0.78rem] font-bold uppercase tracking-[0.13em] text-[#272329] transition-all duration-200 hover:border-black/10 hover:bg-[#ebe6dc] hover:text-black 2xl:px-7",
        isActive
          ? "border-[#151316] bg-[#151316] !text-white shadow-[inset_0_-3px_0_#d61f26]"
          : "text-[#272329]"
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, label, location, onClose }: { href: string; label: string; location: string; onClose: () => void }) {
  const isActive = location === href;
  return (
    <Link
      href={href}
      onClick={onClose}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "px-4 py-4 rounded-none text-xs font-mono uppercase tracking-widest font-bold touch-manipulation min-h-[48px] flex items-center transition-all border-b border-border",
        isActive
          ? "text-primary bg-primary/5 border-primary/30 shadow-[inset_4px_0_0_0_hsl(var(--primary))]"
          : "text-foreground bg-transparent border-transparent active:bg-muted/50"
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

export function NavDropdown({ label, items, dataTestId }: {
  label: string;
  items: { path: string; label: string; description: string }[];
  dataTestId: string;
}) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pendingMenuFocus = useRef<"first" | "last" | null>(null);
  const menuId = `nav-menu-${dataTestId}`;
  const isGroupActive = items.some(item => location === item.path || location.startsWith(item.path + '/'));

  const focusMenuItem = (position: "first" | "last") => {
    const menuItems = rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!menuItems?.length) return;
    menuItems[position === "first" ? 0 : menuItems.length - 1]?.focus();
  };

  const openAndFocusMenu = (position: "first" | "last") => {
    pendingMenuFocus.current = position;
    setOpen(true);
  };

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    if (!open || !pendingMenuFocus.current) return;
    const position = pendingMenuFocus.current;
    pendingMenuFocus.current = null;
    const frame = window.requestAnimationFrame(() => focusMenuItem(position));
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

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
        triggerRef.current?.focus();
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
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "flex h-full min-h-12 cursor-pointer items-center gap-2.5 whitespace-nowrap border-x border-transparent px-5 font-mono text-[0.78rem] font-bold uppercase tracking-[0.13em] text-[#272329] transition-all duration-200 hover:border-black/10 hover:bg-[#ebe6dc] hover:text-black 2xl:px-7",
          isGroupActive || open
            ? "border-[#151316] bg-[#151316] !text-white shadow-[inset_0_-3px_0_#d61f26]"
            : "text-[#272329]"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${label} menu`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openAndFocusMenu("first");
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            openAndFocusMenu("last");
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
          }
        }}
      >
        {label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-[#d61f26] transition-transform duration-200",
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
        onKeyDown={(event) => {
          const menuItems = Array.from(
            rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
          );
          const currentIndex = menuItems.indexOf(event.target as HTMLElement);
          if (!menuItems.length || currentIndex < 0) return;

          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const direction = event.key === "ArrowDown" ? 1 : -1;
            menuItems[(currentIndex + direction + menuItems.length) % menuItems.length]?.focus();
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            menuItems[event.key === "Home" ? 0 : menuItems.length - 1]?.focus();
          } else if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
          } else if (event.key === "Tab") {
            setOpen(false);
          }
        }}
        className={cn(
          "absolute left-1/2 top-full z-50 min-w-[370px] -translate-x-1/2 pt-3",
          open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none",
          "transition-opacity duration-150",
        )}
      >
        <div className="border border-white/15 bg-[#101012] p-2 shadow-[0_30px_80px_rgba(0,0,0,.68)]">
          {items.map(item => (
            <Link
              key={item.path}
              href={item.path}
              role="menuitem"
              tabIndex={open ? 0 : -1}
              className={cn(
                "group block border border-transparent px-5 py-4 transition-colors hover:border-white/15 hover:bg-white/[0.07] focus-visible:border-[#d61f26] focus-visible:bg-white/[0.07] focus-visible:outline-none",
                location === item.path
                  ? "border-[#d61f26]/50 bg-[#d61f26]/10 text-white"
                  : "text-white"
              )}
              data-testid={`link-nav-${item.path.replace(/\//g, '-')}`}
              onClick={() => setOpen(false)}
            >
              <div className="font-display text-[0.96rem] font-extrabold uppercase tracking-[-0.01em] text-white">{item.label}</div>
              <div className="mt-1.5 text-[0.82rem] leading-relaxed text-white/75 transition-colors group-hover:text-white/90">{item.description}</div>
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
    <header
      className="public-site-header safe-area-top sticky top-0 z-50 w-full border-b border-black/15 bg-[#f7f4ed] text-[#151316] shadow-[0_18px_45px_-28px_rgba(20,16,14,.45)]"
      data-testid="site-header"
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-[#d61f26]" aria-hidden="true" />
      <div className="safe-area-x mx-auto grid h-[4.75rem] w-full max-w-[1520px] grid-cols-[minmax(0,1fr)_auto] items-center px-4 sm:px-6 md:h-[5.5rem] xl:h-[9.25rem] xl:grid-cols-[auto_1fr_auto] xl:grid-rows-[5.5rem_3.75rem] xl:px-8">
        {/* Brand — fixed footprint, never collides with nav */}
        <div className="flex min-w-0 shrink items-center pr-2 sm:pr-4 xl:pr-6">
          <Link href={homeHref}>
            <div
              className="flex items-center gap-3 sm:gap-3.5 hover:opacity-95 transition-opacity cursor-pointer touch-manipulation group"
              data-testid="link-home"
            >
              <img
                src="/spartan-logo-stamp.png"
                alt=""
                className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
                width={44}
                height={44}
                decoding="async"
              />
              <div className="min-w-0">
                {/* Not h1 — page content owns the document title heading (a11y) */}
                <span aria-label="SPARTAN COACHING" className="block whitespace-nowrap font-display text-[0.9rem] font-black leading-none tracking-[-0.035em] text-[#151316] min-[390px]:text-base sm:text-xl md:text-[1.4rem]">
                  SPARTAN <span className="text-[#b91920]">COACHING</span>
                </span>
                <span className="mt-1.5 hidden whitespace-nowrap font-mono text-[0.58rem] font-bold uppercase tracking-[0.18em] text-black/55 md:block">
                  Consulting · Hospice Sales Pro
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="hidden min-w-0 items-center justify-center xl:flex">
          <div className="flex items-center gap-4">
            <span className="h-px w-12 bg-[#d61f26]" aria-hidden="true" />
            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-black/60">
              Field authority for hospice growth leaders
            </p>
            <span className="h-px w-12 bg-[#d61f26]" aria-hidden="true" />
          </div>
        </div>

        {/* Desktop Navigation — a dedicated row keeps every destination legible */}
        <nav
          className="hidden min-w-0 items-stretch justify-center border-t border-black/10 xl:col-span-3 xl:col-start-1 xl:row-start-2 xl:flex"
          aria-label="Main navigation"
        >
          {/* Marketing chrome stays marketing — workspace has its own shell (HSP-32) */}
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
          {isAuthenticated && (
            <NavLink href="/portal">Workspace</NavLink>
          )}
        </nav>

        {/* Utility actions — Login + single primary CTA (no duplicate Home) */}
        <div className="col-start-2 row-start-1 ml-auto flex shrink-0 items-center gap-2 border-l border-black/15 pl-2 sm:pl-4 xl:col-start-3 xl:pl-5">
          <Button
            variant="ghost"
            size="icon"
            className="hidden touch-manipulation text-[#151316] hover:bg-black/5 hover:text-black sm:inline-flex xl:hidden"
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
               className="inline-flex h-11 border border-black/35 bg-transparent px-3 font-mono text-[0.69rem] font-bold uppercase tracking-[0.12em] !text-[#151316] shadow-none transition-all hover:border-black hover:bg-[#151316] hover:!text-white sm:px-5"
              data-testid="button-login"
            >
              <Link href="/login">
                <LogIn className="hidden h-4 w-4 sm:block" />
                Login
              </Link>
            </Button>
          )}
          {isAuthenticated ? (
            <Button
              size="sm"
              asChild
               className="hidden h-11 shrink-0 border border-[#d61f26] bg-[#d61f26] px-6 font-bold text-white shadow-[0_10px_34px_-12px_rgba(214,31,38,.9)] hover:bg-[#b91920] xl:inline-flex"
              data-testid="button-open-workspace"
            >
              <Link href={canUseFieldKit ? "/portal" : "/account"}>
                {canUseFieldKit ? "Open workspace" : "Account"}
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              asChild
               className="hidden h-11 shrink-0 border border-[#d61f26] bg-[#d61f26] px-6 font-bold text-white shadow-[0_10px_34px_-12px_rgba(214,31,38,.9)] hover:bg-[#b91920] xl:inline-flex"
              data-testid="button-book-call"
            >
              <Link href="/contact">Request a strategy call</Link>
            </Button>
          )}

          {/* Mobile Menu Sheet */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="touch-manipulation border border-black/25 text-[#151316] hover:border-black/50 hover:bg-black/5 hover:text-black xl:hidden"
                aria-label="Toggle menu"
                data-testid="button-mobile-menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-[350px] p-0 flex flex-col h-full max-h-[100dvh] bg-background border-border" data-testid="mobile-menu-sheet">
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
                    <MobileNavSection title="Consulting" />
                    {navSections.find((section) => section.title === "Consulting")?.items.map((item) => (
                      <MobileNavLink key={item.path} href={item.path} label={item.label} location={location} onClose={() => setMobileMenuOpen(false)} />
                    ))}
                    <MobileNavSection title="Site" />
                    <MobileNavLink href="/about" label="About" location={location} onClose={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/app" label="iPhone app" location={location} onClose={() => setMobileMenuOpen(false)} />
                  </>
                ) : (
                  <>
                    <MobileNavSection title="Choose your path" />
                    <MobileNavLink href="/services" label="Consulting for teams" location={location} onClose={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/hospice-sales-pro" label="Hospice Sales Pro · daily work" location={location} onClose={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/request-access" label="Team / evaluation access" location={location} onClose={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/contact" label="Request a strategy call" location={location} onClose={() => setMobileMenuOpen(false)} />
                    <MobileNavSection title="Account & app" />
                    <MobileNavLink href="/login" label="Client Login" location={location} onClose={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/register" label="Create account · Hospice Sales Pro" location={location} onClose={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/app" label="Get the iPhone app" location={location} onClose={() => setMobileMenuOpen(false)} />
                    {navSections.map((section) => (
                      (() => {
                        const secondaryItems = section.items.filter(
                          (item) =>
                            !["/services", "/hospice-sales-pro", "/request-access", "/contact", "/register", "/app"].includes(item.path),
                        );
                        if (!secondaryItems.length) return null;
                        return (
                          <div key={section.title}>
                            <MobileNavSection title={section.title} />
                            <div className="flex flex-col space-y-1">
                              {secondaryItems.map((item) => (
                                <MobileNavLink key={item.path} href={item.path} label={item.label} location={location} onClose={() => setMobileMenuOpen(false)} />
                              ))}
                            </div>
                          </div>
                        );
                      })()
                    ))}
                  </>
                )}
              </nav>
            </div>
            <div className="shrink-0 border-t border-border px-5 py-4 space-y-3 max-h-[45dvh] overflow-y-auto">
              <AppearancePanel className="pb-1" />
              <Button size="lg" asChild className="w-full border border-[#d61f26] bg-[#d61f26] font-bold text-white touch-manipulation hover:bg-[#b91920] hover:text-white" data-testid="button-mobile-book-call">
                <Link href="/contact?service=Consulting" onClick={() => setMobileMenuOpen(false)}>
                  Request a strategy call
                </Link>
              </Button>
              {canUseFieldKit && (
                <Button size="lg" variant="outline" asChild className="w-full font-bold touch-manipulation" data-testid="button-mobile-command">
                  <Link href="/tools/sales-workflow" onClick={() => setMobileMenuOpen(false)}>
                    Open Command Center
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
                  <Button size="lg" variant="ghost" asChild className="w-full font-semibold text-foreground touch-manipulation" data-testid="button-mobile-request">
                    <Link href="/request-access" onClick={() => setMobileMenuOpen(false)} style={{ color: "hsl(var(--foreground))" }}>
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
                placeholder="SEARCH PAGES AND TOOLS..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 font-mono text-xs uppercase tracking-wider rounded-none"
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
    { href: "/portal/coach", label: "Coach" },
    { href: "/my-work", label: "My Work" },
    { href: "/compliance", label: "Compliance" },
    { href: "/faq", label: "FAQ" },
  ];

  const publicLinks = [
    { href: "/hospice-sales-pro", label: "Hospice Sales Pro" },
    { href: "/app", label: "iPhone app" },
    { href: "/tools", label: "Preview tools" },
    { href: "/services", label: "Consulting" },
    { href: "/register", label: "Create account" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Request a call" },
    { href: "/request-access", label: "Team access" },
    { href: "/login", label: "Client Login" },
    { href: "/resources", label: "Resources" },
    { href: "/compliance", label: "Compliance" },
    { href: "/faq", label: "FAQ" },
  ];

  const links = canUseFieldKit ? memberLinks : publicLinks;

  return (
    <>
      <footer className="public-site-footer mt-auto border-t border-border bg-background no-print safe-area-bottom">
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
                  : "Hospice growth consulting for leaders and teams, with Hospice Sales Pro available as the separate field-tools platform."}
              </p>
              <p className="text-xs text-muted-foreground/90 leading-relaxed border-l-2 border-primary/50 pl-3">
                {canUseFieldKit
                  ? "No PHI in tools · Cancel anytime from Account · Ethics-first field work"
                  : "Diagnose the constraint · Install the standard · Sustain the behavior"}
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
                <p className="text-xs font-bold text-foreground uppercase tracking-widest">Optional email updates</p>
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
                  { href: "/trust", label: "Trust Center", testId: "link-trust-center" },
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
