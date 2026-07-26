import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { MenuIcon, CloseIcon } from "./icons";
import { Button } from "@/components/ui/button";
import { Linkedin, Search, ChevronDown, Shield, LogIn, UserCircle, Home } from "lucide-react";
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

// Helper hook to determine if the screen is mobile
function useIsMobile() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width < 768; // Adjust breakpoint as needed
}

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "px-3 py-2 text-sm font-medium transition-colors hover-elevate block whitespace-nowrap",
        isActive
          ? "text-primary border-b-2 border-primary pb-0"
          : "text-muted-foreground hover:text-foreground"
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
        "px-4 py-3 rounded-lg text-sm font-medium touch-manipulation min-h-[44px] flex items-center transition-all",
        location === href
          ? "text-primary bg-primary/10 border-l-2 border-primary"
          : "text-foreground bg-muted/30 active-elevate-2"
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
  const isGroupActive = items.some(item => location === item.path || location.startsWith(item.path + '/'));
  
  return (
    <div className="relative group" data-testid={dataTestId}>
      <button 
        className={cn(
          "px-3 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate flex items-center gap-1 whitespace-nowrap",
          isGroupActive ? "text-primary border-b-2 border-primary rounded-none" : "text-foreground hover:text-foreground"
        )}
        aria-haspopup="true"
        aria-label={`${label} menu`}
      >
        {label}
        <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
      </button>
      <div className="invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200 absolute top-full left-0 pt-2 z-50">
        <div className="bg-popover border rounded-lg shadow-lg py-2 min-w-[220px]">
          {items.map(item => (
            <Link
              key={item.path}
              href={item.path}
              tabIndex={0}
              className={cn(
                "block px-4 py-2.5 text-sm hover-elevate transition-colors",
                location === item.path
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground"
              )}
              data-testid={`link-nav-${item.path.replace(/\//g, '-')}`}
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
  // Marketing home always — Field Kit board is reached via Field Kit / Portal links.
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
    <header className="sticky top-0 z-50 w-full border-b border-border surface-chrome backdrop-blur-2xl supports-[backdrop-filter]:bg-background/80 shadow-lg safe-area-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 md:h-20 flex items-center justify-between gap-3 sm:gap-6 safe-area-x">
        <Link href={homeHref}>
          <div className="flex items-center gap-2 sm:gap-4 hover:opacity-80 transition-opacity cursor-pointer touch-manipulation" data-testid="link-home">
            <div>
              {/* Not h1 — page content owns the document title heading (a11y) */}
              <span className="font-black text-xl sm:text-2xl md:text-3xl text-primary tracking-tight font-display block">
                SPARTAN COACHING
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation — portal shell when signed in */}
        <nav className="hidden lg:flex items-center gap-1 flex-shrink-0" aria-label="Main navigation">
          <Button
            size="sm"
            variant="ghost"
            asChild
            className="font-semibold gap-1.5 text-foreground"
            data-testid="button-home-nav"
          >
            <Link href={homeHref}>
              <Home className="w-4 h-4" />
              Home
            </Link>
          </Button>
          {isAuthenticated ? (
            <>
              <PortalNav />
              {!canUseFieldKit && (
                <Button
                  size="sm"
                  asChild
                  className="font-bold ml-2 px-5"
                  data-testid="button-book-call"
                >
                  <Link href="/contact">Book a Call</Link>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-sm text-foreground"
                onClick={() => setSearchOpen(true)}
                data-testid="button-search"
              >
                <Search className="w-4 h-4" />
                <span className="font-medium">Search</span>
              </Button>
              {navSections.filter(section => section.title !== "Company").map(section => (
                <NavDropdown
                  key={section.title}
                  label={section.title}
                  dataTestId={`dropdown-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                  items={section.items}
                />
              ))}
              <NavLink href="/about">About</NavLink>
              <Button size="sm" variant="ghost" asChild className="font-medium ml-1 gap-1.5 text-foreground" data-testid="button-login">
                <Link href="/login">
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="font-bold ml-1 px-4"
                data-testid="button-subscribe-nav"
              >
                <Link href="/register">Create account</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="font-bold ml-1 px-4"
                data-testid="button-request-access-nav"
              >
                <Link href="/request-access">Team access</Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                asChild
                className="font-bold ml-1 px-4"
                data-testid="button-book-call"
              >
                <Link href="/contact">Book a call</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Home + Appearance + Mobile Search */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="h-9 w-9 border-border bg-card/80 text-foreground hover:bg-muted touch-manipulation"
            data-testid="button-home-toolbar"
          >
            <Link href={homeHref} aria-label="Go to home">
              <Home className="w-4 h-4" />
            </Link>
          </Button>
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
        </div>

        {/* Mobile Menu Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden touch-manipulation -mr-2"
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
                    <PortalMobileLinks location={location} onClose={() => setMobileMenuOpen(false)} />
                    <MobileNavSection title="Site" />
                    <MobileNavLink href="/services" label="Services" location={location} onClose={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/about" label="About" location={location} onClose={() => setMobileMenuOpen(false)} />
                  </>
                ) : (
                  <>
                    <MobileNavLink href="/login" label="Client Login" location={location} onClose={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/register" label="Create account · Field Kit" location={location} onClose={() => setMobileMenuOpen(false)} />
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
                      Create account · Field Kit
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
    { href: "/portal", label: "Board" },
    { href: "/tools/sales-workflow", label: "Command Center" },
    { href: "/tools", label: "All tools" },
    { href: "/resources", label: "Resources" },
    { href: "/portal/learn", label: "Learn" },
    { href: "/account", label: "Account" },
    { href: "/contact?service=Field+Kit+Debrief", label: "Coach" },
    { href: "/compliance", label: "Compliance" },
    { href: "/faq", label: "FAQ" },
  ];

  const publicLinks = [
    { href: "/field-kit", label: "Field Kit" },
    { href: "/tools", label: "Preview tools" },
    { href: "/field-kit-membership", label: "Membership $14.99/wk" },
    { href: "/register", label: "Create account" },
    { href: "/services", label: "Services" },
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
                  {canUseFieldKit ? "Field Kit · Member" : "The Authority in Hospice Excellence"}
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {canUseFieldKit
                  ? "Private operating system for hospice growth — Command Center, tools, and coaching when you need a human."
                  : "Structured coaching for hospice sales reps, directors, and organizations who want a repeatable system — not another motivational talk."}
              </p>
              <p className="text-xs text-muted-foreground/90 leading-relaxed border-l-2 border-primary/50 pl-3">
                {canUseFieldKit
                  ? "No PHI in tools · Cancel anytime from Account · Ethics-first field work"
                  : "Private Field Kit · Preview free · Individuals $14.99/wk · Cancel anytime · Teams under contract · No PHI in consumer tools"}
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
                {canUseFieldKit ? "Field Kit" : "Quick Links"}
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