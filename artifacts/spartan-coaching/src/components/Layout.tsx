import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Linkedin, Search, LogIn, Menu, ArrowRight } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { navSections, allSearchablePages } from "@/lib/navigation";
import { PortalMobileLinks } from "@/components/PortalNav";
import { CONSENT_COPY, PRICING_FACTS } from "@/lib/complianceCopy";
import { AccentText } from "@/components/AccentText";

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative px-4 py-2 text-[13px] leading-none font-sans font-bold uppercase tracking-[0.06em] transition-colors block whitespace-nowrap",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary" aria-hidden />
      )}
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
        "px-5 py-5 text-xl font-display uppercase tracking-wide touch-manipulation min-h-[60px] flex items-center transition-all border-b border-border/20",
        location === href
          ? "text-primary font-black"
          : "text-foreground hover:bg-muted/50"
      )}
      data-testid={`link-mobile-${href.replace(/\//g, "-")}`}
    >
      {label}
    </Link>
  );
}

export function Header() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated, canUseFieldKit } = useAuth();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const allSearchItems = allSearchablePages;
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
    <header className="public-site-header sticky top-0 z-50 w-full safe-area-top" data-testid="site-header">
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-12 h-[4.75rem] sm:h-[5.5rem] flex items-center justify-between safe-area-x">
        <div className="flex items-center">
          <Link href={homeHref}>
            <div
              className="flex items-center gap-3 sm:gap-4 hover:opacity-90 transition-opacity cursor-pointer touch-manipulation group"
              data-testid="link-home"
            >
               <span className="brand-helmet-lockup">
                 <img src="/spartan-helmet-384.png" alt="Spartan Coaching helmet" width="204" height="384" />
               </span>
              <div className="min-w-0 flex flex-col">
                 <span className="font-black text-[1.05rem] sm:text-[1.35rem] text-foreground tracking-[0.01em] font-display uppercase leading-none">
                  SPARTAN COACHING
                </span>
                 <span className="hidden sm:block text-[9px] font-bold uppercase tracking-[0.24em] text-primary mt-1.5 leading-none">
                   Private performance house
                </span>
              </div>
            </div>
          </Link>
        </div>

        <nav className="hidden xl:flex items-center gap-2" aria-label="Main navigation">
          <NavLink href="/services">Consulting</NavLink>
          <NavLink href="/hospice-sales-pro">Hospice Sales Pro</NavLink>
          <NavLink href="/testimonials">Proof</NavLink>
          <NavLink href="/about">About</NavLink>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <AppearanceControls compact className="hidden xl:inline-flex touch-manipulation" testId="button-appearance-header" />
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden touch-manipulation"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            data-testid="button-mobile-search"
          >
            <Search className="w-5 h-5" />
          </Button>

          {!isAuthenticated && (
            <Link
              href="/login"
              className="hidden xl:inline-flex min-h-11 items-center gap-2 px-4 text-sm font-bold text-foreground hover:text-primary transition-colors"
              data-testid="button-login"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          )}

          {isAuthenticated ? (
            <Button
              asChild
              className="hidden xl:inline-flex min-h-11 rounded-none px-6 text-sm font-bold bg-foreground text-background hover:bg-primary hover:text-white"
              data-testid="button-open-workspace"
            >
              <Link href={canUseFieldKit ? "/portal" : "/account"}>
                {canUseFieldKit ? "Open Workspace" : "Account"}
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              className="hidden xl:inline-flex min-h-11 rounded-none px-6 text-sm font-bold bg-primary text-primary-foreground hover:bg-foreground hover:text-background border-none"
              data-testid="button-book-call"
            >
              <Link href="/contact">Book Strategy Call</Link>
            </Button>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="xl:hidden touch-manipulation gap-2 border-2 border-foreground rounded-none bg-transparent hover:bg-muted"
                aria-label="Toggle menu"
                data-testid="button-mobile-menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-[400px] p-0 flex flex-col h-full bg-background border-l-2 border-foreground">
              <SheetHeader className="px-6 py-6 border-b-2 border-foreground">
                <SheetTitle className="font-display uppercase tracking-widest text-left">Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-2">
                <nav className="flex flex-col" aria-label="Mobile navigation">
                  <MobileNavLink href={homeHref} label="Home" location={location} onClose={() => setMobileMenuOpen(false)} />
                  {isAuthenticated ? (
                    <>
                      <PortalMobileLinks onNavigate={() => setMobileMenuOpen(false)} />
                      <MobileNavLink href="/services" label="Consulting" location={location} onClose={() => setMobileMenuOpen(false)} />
                      <MobileNavLink href="/hospice-sales-pro" label="Hospice Sales Pro" location={location} onClose={() => setMobileMenuOpen(false)} />
                      <MobileNavLink href="/about" label="About" location={location} onClose={() => setMobileMenuOpen(false)} />
                    </>
                  ) : (
                    <>
                      <MobileNavLink href="/services" label="Consulting" location={location} onClose={() => setMobileMenuOpen(false)} />
                      <MobileNavLink href="/hospice-sales-pro" label="Hospice Sales Pro" location={location} onClose={() => setMobileMenuOpen(false)} />
                      <MobileNavLink href="/testimonials" label="Proof" location={location} onClose={() => setMobileMenuOpen(false)} />
                      <MobileNavLink href="/about" label="About" location={location} onClose={() => setMobileMenuOpen(false)} />
                      <MobileNavLink href="/contact" label="Book a Call" location={location} onClose={() => setMobileMenuOpen(false)} />
                      <MobileNavLink href="/login" label="Client Login" location={location} onClose={() => setMobileMenuOpen(false)} />
                    </>
                  )}
                </nav>
              </div>
              <div className="p-6 border-t-2 border-foreground bg-muted">
                <AppearancePanel className="mb-4" />
                {!isAuthenticated && (
                  <Button size="lg" asChild className="w-full font-display uppercase tracking-widest rounded-none bg-primary hover:bg-foreground">
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      Create Account
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[600px] border-2 border-foreground rounded-none p-0" data-testid="dialog-search">
          <div className="p-6 border-b border-border">
            <DialogTitle className="font-display uppercase text-2xl"><AccentText>Search</AccentText></DialogTitle>
            <DialogDescription className="sr-only">
              Search public Spartan Coaching pages and product information.
            </DialogDescription>
          </div>
          <div className="p-6">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                aria-label="Search Spartan Coaching"
                placeholder="SEARCH..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 font-display text-lg uppercase tracking-wider rounded-none border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary"
                autoFocus
                data-testid="input-search"
              />
            </div>
            <div className="max-h-[40dvh] overflow-y-auto space-y-2">
              {filteredResults.length === 0 ? (
                <div className="text-center py-8 font-mono text-sm text-muted-foreground">
                  No results found
                </div>
              ) : (
                filteredResults.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleSearchSelect(item.path)}
                    className="w-full text-left px-4 py-3 border border-transparent hover:border-foreground transition-colors group flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-foreground font-display tracking-wide uppercase">{item.label}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{item.description}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
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
      : "calc(4rem + env(safe-area-inset-bottom, 0px))";

  const publicLinks = [
    { href: "/services", label: "Consulting" },
    { href: "/hospice-sales-pro", label: "Hospice Sales Pro" },
    { href: "/testimonials", label: "Proof" },
    { href: "/app", label: "iPhone App" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Book a Call" },
    { href: "/login", label: "Client Login" },
  ];

  return (
    <footer className="public-site-footer mt-auto safe-area-bottom pt-16 pb-8" data-testid="site-footer">
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <img src="/spartan-helmet-384.png" alt="" width="204" height="384" className="h-16 w-auto" />
              <div>
              <p className="font-display text-3xl font-black text-foreground uppercase tracking-tight">Spartan Coaching</p>
              <p className="text-xs font-bold text-primary mt-2 uppercase tracking-[0.2em]">
                Private performance house
              </p>
              </div>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md">
              Hospice growth consulting and Hospice Sales Pro tools on web and iPhone. Two clear paths. One disciplined system.
            </p>
            <div className="mt-4 border-l-2 border-primary pl-4">
              <a href="mailto:nick@spartanhospicecoaching.com" className="block text-sm font-bold text-foreground hover:text-primary transition-colors">
                nick@spartanhospicecoaching.com
              </a>
              <a
                href="https://www.linkedin.com/in/nicholas-lynch-coaching"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors mt-2"
              >
                <Linkedin className="w-4 h-4" />
                Connect on LinkedIn
              </a>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-6">
            <p className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Navigation</p>
            <nav className="flex flex-col gap-3">
              {publicLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {!canUseFieldKit && (
            <div className="lg:col-span-4 flex flex-col gap-6">
              <p className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Updates</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {CONSENT_COPY.newsletterExplicit}
              </p>
              <NewsletterSignup />
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono uppercase tracking-widest text-muted-foreground" style={{ paddingBottom: padBottom }}>
          <p>© {new Date().getFullYear()} Spartan Coaching LLC</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-primary">Privacy</Link>
            <Link href="/terms" className="hover:text-primary">Terms</Link>
            <Link href="/compliance" className="hover:text-primary">Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
