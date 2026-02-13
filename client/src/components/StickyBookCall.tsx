import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

function StickyBookCallContent() {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling down 300px
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Button - only render if scroll condition is met */}
      {isVisible && (
        <Button
          onClick={() => setIsFormOpen(true)}
          className={cn(
            "fixed gap-2 shadow-lg transition-all duration-300 ease-out animate-slide-in-up z-50",
            isMobile ? "bottom-[calc(20px+env(safe-area-inset-bottom,0px))] left-[calc(16px+env(safe-area-inset-left,0px))] p-0 w-12 h-12" : "bottom-8 left-8 px-5 py-3"
          )}
          data-testid="button-book-a-call"
          aria-label="Book a Call"
        >
          <Phone className="w-5 h-5" />
          <span className="hidden sm:inline">Book a Call</span>
        </Button>
      )}

      {/* ContactForm - rendered alongside button, not nested */}
      <ContactForm open={isFormOpen} onOpenChange={setIsFormOpen} />
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
