import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { SpartanLogo, MenuIcon, CloseIcon } from "./icons";
import { applyTheme, getInitialTheme } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Linkedin, Search } from "lucide-react";
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
    { path: "/resources", label: "Resources", description: "Helpful guides and resources" },
    { path: "/testimonials", label: "Testimonials", description: "Client success stories" },
    { path: "/about", label: "About", description: "Learn about Spartan Coaching" },
  ];

  const aiTools = [
    { path: "/tools/playbooks", label: "Sales Playbooks", description: "Generate custom sales playbooks" },
    { path: "/tools/objections", label: "Objection Handler", description: "Get strategies for handling objections" },
    { path: "/tools/research", label: "Territory Research", description: "Research facilities and territories" },
    { path: "/tools/email-templates", label: "Email Templates", description: "Create professional email templates" },
    { path: "/tools/chatbot", label: "AI Coach", description: "Chat with your AI sales coach" },
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/75 shadow-lg" style={{
      boxShadow: '0 4px 24px -2px rgba(0, 0, 0, 0.12), 0 2px 8px -2px rgba(0, 0, 0, 0.08), inset 0 -1px 0 0 rgba(255, 255, 255, 0.05)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-24 sm:h-28 md:h-32 flex items-center justify-between gap-3 sm:gap-6">
        <Link href="/">
          <div className="flex items-center gap-2 sm:gap-4 hover:opacity-80 transition-opacity group cursor-pointer touch-manipulation" data-testid="link-home">
            <SpartanLogo className="h-14 sm:h-16 md:h-20 w-auto object-contain group-hover:scale-110 transition-transform" />
            <div className="hidden sm:block">
              <h1 className="font-black text-2xl md:text-3xl text-foreground tracking-tight">Spartan Coaching</h1>
              <p className="text-sm md:text-base text-muted-foreground">Expert Hospice Sales Training</p>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2 flex-shrink-0" aria-label="Main navigation">
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
          {routes.slice(1).map((route) => (
            <NavLink key={route.path} href={route.path}>
              {route.label}
            </NavLink>
          ))}
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-4 min-h-[48px] min-w-[48px] flex items-center justify-center text-foreground hover-elevate active-elevate-2 rounded-lg touch-manipulation transition-transform active:scale-95 -mr-2"
          aria-label="Toggle menu"
          data-testid="button-mobile-menu"
        >
          {mobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="lg:hidden fixed top-[96px] sm:top-[112px] md:top-[128px] left-0 right-0 bottom-0 bg-background/98 backdrop-blur-lg z-50 overflow-y-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex flex-col p-4 space-y-2 min-h-full">
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-5 py-4 rounded-xl text-base font-medium touch-manipulation min-h-[56px] flex items-center transition-all active:scale-[0.98]",
                  location === route.path
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-foreground bg-muted/50 active-elevate-2"
                )}
              >
                {route.label}
              </Link>
            ))}
            <div className="pt-2 flex items-center justify-between border-t border-border mt-4">
              <span className="text-sm text-muted-foreground px-4">Theme</span>
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="icon"
                className="touch-manipulation min-h-[48px] min-w-[48px]"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </nav>
      )}

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
  return (
    <footer className="mt-auto border-t border-border bg-background no-print">
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
          <div className="flex flex-wrap gap-3 sm:gap-6 text-sm">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md min-h-[48px] flex items-center justify-center touch-manipulation"
              data-testid="link-privacy"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md min-h-[48px] flex items-center justify-center touch-manipulation"
              data-testid="link-contact"
            >
              Contact
            </a>
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 hover-elevate rounded-md min-h-[48px] flex items-center justify-center touch-manipulation"
              data-testid="link-admin"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}