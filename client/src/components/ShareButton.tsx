import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
}

export function ShareButton({
  title,
  text,
  url,
  className,
  size = "sm",
  variant = "outline",
}: ShareButtonProps) {
  const [canShare, setCanShare] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  if (!canShare) return null;

  const handleShare = async () => {
    try {
      await navigator.share({
        title,
        text: text || title,
        url: url || window.location.href,
      });
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={className}
      data-testid="button-share"
    >
      {shared ? (
        <Check className="w-4 h-4 mr-1.5" />
      ) : (
        <Share2 className="w-4 h-4 mr-1.5" />
      )}
      {shared ? "Shared" : "Share"}
    </Button>
  );
}
