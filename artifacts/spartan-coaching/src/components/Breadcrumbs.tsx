import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap", className)}
      data-testid="nav-breadcrumbs"
    >
      <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors" data-testid="breadcrumb-home">
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-foreground transition-colors"
              data-testid={`breadcrumb-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium" data-testid={`breadcrumb-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
