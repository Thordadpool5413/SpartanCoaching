import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { MenuIcon, CloseIcon } from "./icons";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Linkedin, Search, ChevronDown, Shield } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
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
        "px-3 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate block whitespace-nowrap",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-foreground"
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
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-foreground bg-muted/50 active-elevate-2"
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
          isGroupActive ? "bg-primary text-primary-foreground" : "text-foreground"
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const { mode: theme, toggleMode: toggleTheme } = useTheme();

  const allSearchItems = allSearchablePages;

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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 dark:border-red-900/20 bg-background/90 dark:bg-[#040404]/92 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/80 dark:supports-[backdrop-filter]:bg-[#040404]/88 shadow-lg dark:shadow-[0_4px_32px_-2px_rgba(0,0,0,0.9),_0_0_1px_0_rgba(232,41,30,0.12)] safe-area-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 md:h-20 flex items-center justify-between gap-3 sm:gap-6 safe-area-x">
        <Link href="/">
          <div className="flex items-center gap-2 sm:gap-4 hover:opacity-80 transition-opacity cursor-pointer touch-manipulation" data-testid="link-home">
            <div>
              <h1 className="font-black text-xl sm:text-2xl md:text-3xl text-primary tracking-tight">SPARTAN COACHING</h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">The Authority in Hospice Excellence</p>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 flex-shrink-0" aria-label="Main navigation">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-sm"
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
          <Button
            size="sm"
            asChild
            className="font-bold ml-1 px-5"
            data-testid="button-book-call"
          >
            <Link href="/contact">Book a Call</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </nav>

        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden touch-manipulation"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          data-testid="button-mobile-search"
        >
          <Search className="w-5 h-5" />
        </Button>

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
          <SheetContent side="right" className="w-[85vw] max-w-[350px] p-0 flex flex-col h-full max-h-[100dvh]">
            <SheetHeader className="px-5 pt-5 pb-3 shrink-0">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5"
              style={{ WebkitOverflowScrolling: 'touch' }}
              data-testid="mobile-menu-scroll-container"
            >
              <nav className="flex flex-col space-y-1" aria-label="Mobile navigation">
                <MobileNavLink href="/" label="Home" location={location} onClose={() => setMobileMenuOpen(false)} />

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
              </nav>
            </div>
            <div className="shrink-0 border-t border-border px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">Appearance</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => theme === "dark" && toggleTheme()}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border touch-manipulation ${theme === "light" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}
                    data-testid="button-mobile-light-mode"
                    aria-label="Light mode"
                  >
                    <Sun className="w-3.5 h-3.5" />
                    Light
                  </button>
                  <button
                    onClick={() => theme === "light" && toggleTheme()}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border touch-manipulation ${theme === "dark" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}
                    data-testid="button-mobile-dark-mode"
                    aria-label="Dark mode"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    Dark
                  </button>
                </div>
              </div>
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
  return (
    <>
      <footer className="mt-auto border-t border-red-900/20 dark:border-red-900/20 bg-background dark:bg-[#030303] no-print safe-area-bottom">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ paddingBottom: location === '/contact' ? '2rem' : 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-3">
              <p className="text-sm text-muted-foreground">
                © 2026 Spartan Coaching. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground max-w-md">
                We respect your privacy. We do not sell or share your personal information. See our full Privacy Policy for details.
              </p>
              <p className="text-xs text-muted-foreground max-w-md">
                All coaching services are subject to our Terms of Service. Refund eligibility is outlined in our terms.
              </p>
              <p className="text-xs text-muted-foreground max-w-md">
                Questions? Reach us at nick@spartanhospicecoaching.com
              </p>
              <a
                href="https://www.linkedin.com/in/nicholas-lynch-coaching?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BzPbXAWy3RZWKMT%2FppHgzbw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors hover-elevate px-3 py-2 rounded-md group"
                data-testid="link-linkedin-footer"
                aria-label="Connect with Nick Lynch on LinkedIn"
              >
                <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Connect with Nick Lynch</span>
              </a>
            </div>
            <div className="flex flex-col items-center md:items-start gap-2" data-testid="section-newsletter">
              <h3 className="text-sm font-semibold text-foreground">Weekly Coaching Tips</h3>
              <p className="text-xs text-muted-foreground max-w-xs text-center md:text-left">Get actionable hospice sales strategies delivered to your inbox.</p>
              <NewsletterSignup />
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-6 text-sm">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md flex items-center justify-center touch-manipulation"
                data-testid="link-privacy"
                aria-label="Privacy Policy"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md flex items-center justify-center touch-manipulation"
                data-testid="link-terms"
                aria-label="Terms of Service"
              >
                Terms of Service
              </Link>
              <Link
                href="/disclaimer"
                className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md flex items-center justify-center touch-manipulation"
                data-testid="link-disclaimer"
                aria-label="Disclaimer"
              >
                Disclaimer
              </Link>
              <Link
                href="/legal"
                className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md flex items-center justify-center touch-manipulation"
                data-testid="link-legal"
                aria-label="Legal Agreements"
              >
                Legal Agreements
              </Link>
              <Link
                href="/compliance"
                className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md flex items-center gap-1.5 justify-center touch-manipulation"
                data-testid="link-compliance"
                aria-label="Compliance and Data Practices"
              >
                <Shield className="w-3.5 h-3.5" />
                HIPAA Compliance
              </Link>
              <Link
                href="/manifesto"
                className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md flex items-center justify-center touch-manipulation"
                data-testid="link-manifesto"
                aria-label="The Spartan Ethos"
              >
                The Spartan Ethos
              </Link>
              <Link
                href="/contact"
                className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md flex items-center justify-center touch-manipulation"
                data-testid="link-footer-contact"
                aria-label="Contact us"
              >
                Contact
              </Link>
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md flex items-center justify-center touch-manipulation"
                data-testid="link-admin"
                aria-label="Admin dashboard"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </>
  );
}