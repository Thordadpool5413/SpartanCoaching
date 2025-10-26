import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { SpartanLogo, MenuIcon, CloseIcon } from "./icons";
import { applyTheme, getInitialTheme } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={cn(
        "text-base font-bold transition-all hover:text-red-600 relative py-1",
        active ? "text-red-600" : "text-foreground",
        active && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600"
      )}
    >
      {children}
    </a>
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
    { path: "/about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-4 hover:opacity-80 transition-opacity group cursor-pointer" data-testid="link-home">
            <SpartanLogo className="h-14 w-auto object-contain group-hover:scale-110 transition-transform" />
            <div className="hidden sm:block">
              <h1 className="font-black text-2xl text-foreground tracking-tight">Spartan Coaching</h1>
              <p className="text-sm text-muted-foreground">Expert Hospice Sales Training</p>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => {
              const searchInput = document.createElement('input');
              searchInput.placeholder = 'Search tools, resources...';
              // TODO: Implement full search modal
              console.log('Search feature - coming soon');
            }}
          >
            <span className="text-base font-bold">Search</span>
          </Button>
          {routes.slice(1).map((route) => (
            <Link key={route.path} href={route.path}>
              <NavLink href={route.path} active={location === route.path}>
                {route.label}
              </NavLink>
            </Link>
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
          className="lg:hidden p-2 text-foreground hover-elevate rounded-lg"
          aria-label="Toggle menu"
          data-testid="button-mobile-menu"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <nav className="lg:hidden py-4 grid gap-2" aria-label="Mobile navigation">
          {routes.map((route) => (
            <Link key={route.path} href={route.path}>
              <div
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 text-lg font-bold rounded-lg transition-colors hover-elevate cursor-pointer ${
                  location === route.path
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground"
                }`}
                data-testid={`link-mobile-${route.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {route.label}
              </div>
            </Link>
          ))}
          <Button
            onClick={() => {
              toggleTheme();
              setMenuOpen(false);
            }}
            variant="ghost"
            className="w-full mt-2 justify-start text-lg font-bold"
            data-testid="button-mobile-theme-toggle"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-5 h-5 mr-2" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 mr-2" />
                Dark Mode
              </>
            )}
          </Button>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background no-print">
      <div className="w-full max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Spartan Coaching. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-privacy"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
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