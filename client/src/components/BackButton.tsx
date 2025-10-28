import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface BackButtonProps {
  fallbackPath?: string;
}

export function BackButton({ fallbackPath = "/" }: BackButtonProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation(fallbackPath);
    }
  };

  return (
    <Button
      variant="ghost"
      size="default"
      onClick={handleBack}
      data-testid="button-back"
      className="mb-6 min-h-[48px] touch-manipulation group"
    >
      <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
      <span>Back</span>
    </Button>
  );
}
