import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

function StickyBookCallContent() {
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const { canUseFieldKit } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) {
    return null;
  }

  // Quiet paid/member product mode — no sticky sales FAB over Field Kit work
  if (canUseFieldKit) {
    return null;
  }

  return (
    <>
      {isVisible && location !== "/contact" && (
        <Button
          asChild
          className={cn(
            "fixed gap-2 shadow-lg transition-all duration-300 ease-out animate-slide-in-up z-40",
            isMobile ? "bottom-[calc(80px+env(safe-area-inset-bottom,0px))] left-[calc(16px+env(safe-area-inset-left,0px))] p-0 w-12 h-12" : "bottom-8 left-8 px-5 py-3"
          )}
          data-testid="button-contact-sticky"
          aria-label="Contact us"
        >
          <Link href="/contact">
            <Phone className="w-5 h-5" />
            <span className="hidden sm:inline">Contact</span>
          </Link>
        </Button>
      )}
    </>
  );
}

export function StickyBookCall() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <StickyBookCallContent />,
    document.body
  );
}
