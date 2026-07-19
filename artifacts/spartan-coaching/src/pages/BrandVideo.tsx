import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { BackButton } from "@/components/BackButton";
import { FadeIn } from "@/components/animations";
import { Copy, Check, ExternalLink, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function getVideoUrl(): string {
  if (typeof window === "undefined") return "/spartan-video/";
  return window.location.origin + "/spartan-video/";
}

export default function BrandVideo() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = async () => {
    const url = getVideoUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Share this link with prospects to let them watch the Spartan brand video.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({
        title: "Could not copy",
        description: "Please copy the link manually from your browser address bar.",
        variant: "destructive",
      });
    }
  };

  const handleOpenInTab = () => {
    window.open(getVideoUrl(), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <SEO
        title="Brand Video — Spartan Coaching"
        description="Share the Spartan Coaching brand video with prospects."
      />
      <BackButton />

      <FadeIn>
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <Share2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary uppercase tracking-wide">Outreach Asset</span>
          </div>
          <h1 className="text-h1 font-black text-foreground mb-4" data-testid="text-brand-video-title">
            Spartan Brand Video
          </h1>
          <p className="text-body-lg text-muted-foreground leading-relaxed">
            Use this cinematic logo reveal as a credibility asset in your prospect outreach. Copy the shareable link and send it directly — no login required to view.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="rounded-2xl overflow-hidden bg-gray-950 shadow-2xl border border-white/10 mb-8" data-testid="container-brand-video">
          <iframe
            src="/spartan-video/"
            title="Spartan Coaching Brand Video"
            className="w-full"
            style={{ height: "clamp(320px, 56.25vw, 720px)", border: "none", display: "block" }}
            allow="autoplay; fullscreen"
            data-testid="iframe-brand-video"
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Button
            size="lg"
            className="font-bold px-8 min-w-[200px] group"
            onClick={handleCopyLink}
            data-testid="button-copy-share-link"
            aria-label="Copy shareable link to brand video"
          >
            {copied ? (
              <>
                <Check className="mr-2 w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                Copy Share Link
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="font-bold px-8 group"
            onClick={handleOpenInTab}
            data-testid="button-open-video-tab"
            aria-label="Open brand video in new tab"
          >
            <ExternalLink className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
            Open in New Tab
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="rounded-xl border-2 border-border bg-accent/30 p-6 sm:p-8">
          <h2 className="text-h3 font-bold text-foreground mb-4">How to use this in outreach</h2>
          <ul className="space-y-3 text-body text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">1</span>
              <span>Click <strong className="text-foreground">Copy Share Link</strong> above to copy the video URL to your clipboard.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">2</span>
              <span>Paste the link into an email, LinkedIn message, or text — no account needed to watch.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">3</span>
              <span>Prospects see a clean, full-screen brand video with no Replit chrome — just the Spartan identity.</span>
            </li>
          </ul>
        </div>
      </FadeIn>
    </div>
  );
}
