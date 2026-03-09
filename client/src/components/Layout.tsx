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
    { path: "/tools", label: "AI Field Kit", description: "Expert sales tools" },
    { path: "/resources", label: "Training Resources", description: "Downloadable templates, scripts, checklists, and guides" },
    { path: "/podcasts", label: "Podcasts", description: "Coaching podcasts and expert insights" },
    { path: "/articles", label: "Articles", description: "Industry insights and thought leadership" },
    { path: "/testimonials", label: "Testimonials", description: "Client success stories" },
    { path: "/about", label: "About", description: "Learn about Spartan Coaching" },
    { path: "/manifesto", label: "The Spartan Ethos", description: "What it means to be Spartan" },
    { path: "/faq", label: "FAQ", description: "Common questions answered" },
    { path: "/terms", label: "Terms of Service", description: "Terms governing use of our services" },
    { path: "/disclaimer", label: "Disclaimer", description: "Important disclaimers and notices" },
    { path: "/contact", label: "Contact", description: "Get in touch with Spartan Coaching" },
  ];

  const aiTools = [
    { path: "/tools/playbooks", label: "Sales Playbooks", description: "Generate custom sales playbooks" },
    { path: "/tools/objections", label: "Objection Handler", description: "Get strategies for handling objections" },
    { path: "/tools/research", label: "Territory Research", description: "Research facilities and territories" },
    { path: "/tools/email-templates", label: "Email Templates", description: "Create professional email templates" },
    { path: "/tools/role-play", label: "Role-Play Practice", description: "Practice sales conversations with AI" },
    { path: "/tools/roi-calculator", label: "ROI Calculator", description: "Estimate coaching impact on revenue" },
    { path: "/tools/activity-calculator", label: "Activity Calculator", description: "Convert your admission goal into daily conversation targets" },
    { path: "/tools/transcribe", label: "Call Transcriber", description: "Transcribe and summarize sales calls and meetings" },
    { path: "/learn/knowledge-base", label: "Knowledge Base", description: "Hospice terminology and regulations reference" },
    { path: "/quiz", label: "Knowledge Quiz", description: "Test your hospice sales knowledge with 20 questions" },
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
          <NavDropdown label="Solutions" dataTestId="dropdown-solutions" items={[
            { path: "/services", label: "Services", description: "Strategic services and consulting" },
            { path: "/programs", label: "Programs", description: "Training programs" },
            { path: "/method", label: "The Spartan Method", description: "Our proven methodology" },
            { path: "/manifesto", label: "The Spartan Ethos", description: "What it means to be Spartan" },
          ]} />
          <NavDropdown label="AI Tools" dataTestId="dropdown-ai-tools" items={[
            { path: "/tools", label: "AI Field Kit", description: "Expert sales tools" },
            { path: "/tools/playbooks", label: "Sales Playbooks", description: "Generate custom playbooks" },
            { path: "/tools/objections", label: "Objection Handler", description: "Handle objections" },
            { path: "/tools/research", label: "Territory Research", description: "Research facilities" },
            { path: "/tools/email-templates", label: "Email Templates", description: "Professional emails" },
            { path: "/tools/role-play", label: "Role-Play Practice", description: "Practice with AI" },
            { path: "/tools/transcribe", label: "Call Transcriber", description: "Transcribe and summarize sales calls" },
          ]} />
          <NavDropdown label="Calculators" dataTestId="dropdown-calculators" items={[
            { path: "/tools/roi-calculator", label: "ROI Calculator", description: "Estimate the revenue impact of Spartan Coaching" },
            { path: "/tools/activity-calculator", label: "Activity Calculator", description: "Convert your admission goal into daily conversation targets" },
            { path: "/tools/branch-profitability", label: "Branch Profitability Simulator", description: "Model break-even ADC, staffing, and cash runway for your branch" },
          ]} />
          <NavDropdown label="Learn" dataTestId="dropdown-learn" items={[
            { path: "/learn/knowledge-base", label: "Knowledge Base", description: "Hospice terminology and regulations" },
            { path: "/quiz", label: "Knowledge Quiz", description: "Test your hospice sales knowledge" },
            { path: "/resources", label: "Training Resources", description: "Templates and guides" },
            { path: "/drills", label: "Daily Drills", description: "Daily coaching exercises" },
            { path: "/podcasts", label: "Podcasts", description: "Expert insights" },
            { path: "/articles", label: "Articles", description: "Thought leadership" },
            { path: "/testimonials", label: "Testimonials", description: "Client success stories" },
            { path: "/faq", label: "FAQ", description: "Common questions answered" },
          ]} />
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
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

                <MobileNavSection title="Solutions" />
                {[
                  { path: "/services", label: "Services" },
                  { path: "/programs", label: "Programs" },
                  { path: "/method", label: "The Spartan Method" },
                  { path: "/manifesto", label: "The Spartan Ethos" },
                ].map((item) => (
                  <MobileNavLink key={item.path} href={item.path} label={item.label} location={location} onClose={() => setMobileMenuOpen(false)} />
                ))}

                <MobileNavSection title="AI Tools" />
                {[
                  { path: "/tools", label: "AI Field Kit" },
                  { path: "/tools/playbooks", label: "Sales Playbooks" },
                  { path: "/tools/objections", label: "Objection Handler" },
                  { path: "/tools/research", label: "Territory Research" },
                  { path: "/tools/email-templates", label: "Email Templates" },
                  { path: "/tools/role-play", label: "Role-Play Practice" },
                  { path: "/tools/transcribe", label: "Call Transcriber" },
                ].map((item) => (
                  <MobileNavLink key={item.path} href={item.path} label={item.label} location={location} onClose={() => setMobileMenuOpen(false)} />
                ))}

                <MobileNavSection title="Calculators" />
                {[
                  { path: "/tools/roi-calculator", label: "ROI Calculator" },
                  { path: "/tools/activity-calculator", label: "Activity Calculator" },
                  { path: "/tools/branch-profitability", label: "Branch Profitability Simulator" },
                ].map((item) => (
                  <MobileNavLink key={item.path} href={item.path} label={item.label} location={location} onClose={() => setMobileMenuOpen(false)} />
                ))}

                <MobileNavSection title="Learn" />
                {[
                  { path: "/learn/knowledge-base", label: "Knowledge Base" },
                  { path: "/quiz", label: "Knowledge Quiz" },
                  { path: "/resources", label: "Training Resources" },
                  { path: "/drills", label: "Daily Drills" },
                  { path: "/podcasts", label: "Podcasts" },
                  { path: "/articles", label: "Articles" },
                  { path: "/testimonials", label: "Testimonials" },
                  { path: "/faq", label: "FAQ" },
                ].map((item) => (
                  <MobileNavLink key={item.path} href={item.path} label={item.label} location={location} onClose={() => setMobileMenuOpen(false)} />
                ))}

                <MobileNavSection title="Company" />
                <MobileNavLink href="/about" label="About" location={location} onClose={() => setMobileMenuOpen(false)} />
                <MobileNavLink href="/contact" label="Contact" location={location} onClose={() => setMobileMenuOpen(false)} />
              </nav>
            </div>
            <div className="shrink-0 flex items-center justify-between gap-2 border-t border-border px-5 py-3">
              <span className="text-sm text-muted-foreground">Theme</span>
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
      <footer className="mt-auto border-t border-border bg-background no-print safe-area-bottom">
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
                Questions? Reach us at nicholas.lynch@spartan-coaching-schools.org
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
                className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md flex items-center justify-center touch-manipulation"
                data-testid="link-compliance"
                aria-label="Compliance and Ethics"
              >
                Compliance
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