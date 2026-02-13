import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { MenuIcon, CloseIcon } from "./icons";
import { applyTheme, getInitialTheme } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Linkedin, Search, ChevronDown } from "lucide-react";
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
import { ContactForm } from "@/components/ContactForm";
import { NewsletterSignup } from "@/components/NewsletterSignup";

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
          : "text-foreground hover:bg-accent"
      )}
    >
      {children}
    </Link>
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

  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const routes = [
    { path: "/", label: "Home", description: "Main landing page" },
    { path: "/services", label: "Services", description: "Strategic services and consulting" },
    { path: "/programs", label: "Programs", description: "Training programs for hospice providers" },
    { path: "/method", label: "The Spartan Method", description: "Our proven sales methodology" },
    { path: "/tools", label: "AI Field Kit", description: "AI-powered sales tools" },
    { path: "/resources", label: "Training Resources", description: "Downloadable templates, scripts, checklists, and guides" },
    { path: "/podcasts", label: "Podcasts", description: "Coaching podcasts and expert insights" },
    { path: "/articles", label: "Articles", description: "Industry insights and thought leadership" },
    { path: "/testimonials", label: "Testimonials", description: "Client success stories" },
    { path: "/about", label: "About", description: "Learn about Spartan Coaching" },
  ];

  const aiTools = [
    { path: "/tools/playbooks", label: "Sales Playbooks", description: "Generate custom sales playbooks" },
    { path: "/tools/objections", label: "Objection Handler", description: "Get strategies for handling objections" },
    { path: "/tools/research", label: "Territory Research", description: "Research facilities and territories" },
    { path: "/tools/email-templates", label: "Email Templates", description: "Create professional email templates" },
  ];

  const allSearchItems = [...routes, ...aiTools];

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/75 shadow-lg safe-area-top" style={{
      boxShadow: '0 4px 24px -2px rgba(0, 0, 0, 0.12), 0 2px 8px -2px rgba(0, 0, 0, 0.08), inset 0 -1px 0 0 rgba(255, 255, 255, 0.05)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-24 sm:h-28 md:h-32 flex items-center justify-between gap-3 sm:gap-6 safe-area-x">
        <Link href="/">
          <div className="flex items-center gap-2 sm:gap-4 hover:opacity-80 transition-opacity cursor-pointer touch-manipulation" data-testid="link-home">
            <div>
              <h1 className="font-black text-xl sm:text-2xl md:text-3xl text-primary tracking-tight">SPARTAN COACHING</h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Expert Hospice Sales Training</p>
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
          <NavDropdown label="Solutions" dataTestId="dropdown-solutions" items={[
            { path: "/services", label: "Services", description: "Strategic services and consulting" },
            { path: "/programs", label: "Programs", description: "Training programs" },
            { path: "/method", label: "The Spartan Method", description: "Our proven methodology" },
          ]} />
          <NavDropdown label="AI Tools" dataTestId="dropdown-ai-tools" items={[
            { path: "/tools", label: "AI Field Kit", description: "AI-powered sales tools" },
            { path: "/tools/playbooks", label: "Sales Playbooks", description: "Generate custom playbooks" },
            { path: "/tools/objections", label: "Objection Handler", description: "Handle objections" },
            { path: "/tools/research", label: "Territory Research", description: "Research facilities" },
            { path: "/tools/email-templates", label: "Email Templates", description: "Professional emails" },
          ]} />
          <NavDropdown label="Learn" dataTestId="dropdown-learn" items={[
            { path: "/resources", label: "Training Resources", description: "Templates and guides" },
            { path: "/podcasts", label: "Podcasts", description: "Expert insights" },
            { path: "/articles", label: "Articles", description: "Thought leadership" },
            { path: "/testimonials", label: "Testimonials", description: "Client success stories" },
          ]} />
          <NavLink href="/about">About</NavLink>
          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </nav>

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
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col mt-6 space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-5 py-4 rounded-xl text-base font-medium touch-manipulation min-h-[56px] flex items-center transition-all",
                  location === "/"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-foreground bg-muted/50 active-elevate-2"
                )}
                data-testid="link-mobile-/"
              >
                Home
              </Link>

              <div className="pt-3 pb-1">
                <span className="px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Solutions</span>
              </div>
              {[
                { path: "/services", label: "Services" },
                { path: "/programs", label: "Programs" },
                { path: "/method", label: "The Spartan Method" },
              ].map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-5 py-4 rounded-xl text-base font-medium touch-manipulation min-h-[56px] flex items-center transition-all",
                    location === item.path
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground bg-muted/50 active-elevate-2"
                  )}
                  data-testid={`link-mobile-${item.path}`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="pt-3 pb-1">
                <span className="px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Tools</span>
              </div>
              {[
                { path: "/tools", label: "AI Field Kit" },
                { path: "/tools/playbooks", label: "Sales Playbooks" },
                { path: "/tools/objections", label: "Objection Handler" },
                { path: "/tools/research", label: "Territory Research" },
                { path: "/tools/email-templates", label: "Email Templates" },
              ].map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-5 py-4 rounded-xl text-base font-medium touch-manipulation min-h-[56px] flex items-center transition-all",
                    location === item.path
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground bg-muted/50 active-elevate-2"
                  )}
                  data-testid={`link-mobile-${item.path}`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="pt-3 pb-1">
                <span className="px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Learn</span>
              </div>
              {[
                { path: "/resources", label: "Training Resources" },
                { path: "/podcasts", label: "Podcasts" },
                { path: "/articles", label: "Articles" },
                { path: "/testimonials", label: "Testimonials" },
              ].map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-5 py-4 rounded-xl text-base font-medium touch-manipulation min-h-[56px] flex items-center transition-all",
                    location === item.path
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground bg-muted/50 active-elevate-2"
                  )}
                  data-testid={`link-mobile-${item.path}`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="pt-3 pb-1">
                <span className="px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</span>
              </div>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-5 py-4 rounded-xl text-base font-medium touch-manipulation min-h-[56px] flex items-center transition-all",
                  location === "/about"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-foreground bg-muted/50 active-elevate-2"
                )}
                data-testid="link-mobile-/about"
              >
                About
              </Link>

              <div className="pt-4 flex items-center justify-between border-t border-border mt-4">
                <span className="text-sm text-muted-foreground px-4">Theme</span>
                <Button
                  onClick={toggleTheme}
                  variant="ghost"
                  size="icon"
                  className="touch-manipulation"
                  aria-label="Toggle theme"
                  data-testid="button-mobile-theme-toggle"
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
              </div>
            </nav>
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
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-1">
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
  const [contactFormOpen, setContactFormOpen] = useState(false);

  return (
    <footer className="mt-auto border-t border-border bg-background no-print safe-area-bottom">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Spartan Coaching. All rights reserved.
            </p>
            <a
              href="https://www.linkedin.com/in/nicholas-lynch-coaching?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BzPbXAWy3RZWKMT%2FppHgzbw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors hover-elevate px-3 py-2 rounded-md group"
              data-testid="link-linkedin-footer"
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
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md flex items-center justify-center touch-manipulation"
              data-testid="link-privacy"
            >
              Privacy Policy
            </a>
            <button
              onClick={() => setContactFormOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md flex items-center justify-center touch-manipulation"
              data-testid="button-footer-contact"
            >
              Contact
            </button>
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md flex items-center justify-center touch-manipulation"
              data-testid="link-admin"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>

      <ContactForm open={contactFormOpen} onOpenChange={setContactFormOpen} />
    </footer>
  );
}