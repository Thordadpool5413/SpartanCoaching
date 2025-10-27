import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { SpartanLogo, MenuIcon, CloseIcon } from "./icons";
import { applyTheme, getInitialTheme } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Linkedin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [location] = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const routes = [
    { path: "/", label: "Home" },
    { path: "/services", label: "Services" },
    { path: "/programs", label: "Programs" },
    { path: "/method", label: "The Spartan Method" },
    { path: "/tools", label: "AI Field Kit" },
    { path: "/resources", label: "Resources" },
    { path: "/testimonials", label: "Testimonials" },
    { path: "/about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
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
            onClick={() => {
              const searchInput = document.createElement('input');
              searchInput.placeholder = 'Search tools, resources...';
              // TODO: Implement full search modal
              console.log('Search feature - coming soon');
            }}
          >
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
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-4 min-h-[52px] min-w-[52px] flex items-center justify-center text-foreground hover-elevate active-elevate-2 rounded-lg touch-manipulation transition-transform active:scale-95 -mr-2"
          aria-label="Toggle menu"
          data-testid="button-mobile-menu"
        >
          {menuOpen ? <CloseIcon className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <nav className="lg:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg z-50 animate-fade-in mobile-safe-padding">
          <div className="flex flex-col p-4 space-y-3 max-h-[70vh] overflow-y-auto">
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-lg text-base font-medium transition-all hover-elevate active-elevate-2 touch-manipulation min-h-[48px] flex items-center",
                  location === route.path
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                {route.label}
              </Link>
            ))}
            <div className="pt-2 flex items-center justify-between">
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
              href="https://www.linkedin.com/in/nicholas-lynch-coaching"
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
          </div>
        </div>
      </div>
    </footer>
  );
}