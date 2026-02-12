import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Configuration constants
const IOS_PROMPT_DELAY = 3000; // 3 seconds
const ANDROID_PROMPT_DELAY = 2000; // 2 seconds
const DISMISS_COOLDOWN_DAYS = 7;

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissed = dismissedDate 
      ? (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    // Only show if not standalone, and either never dismissed or dismissed >DISMISS_COOLDOWN_DAYS days ago
    if (!standalone && (!dismissed || daysSinceDismissed > DISMISS_COOLDOWN_DAYS)) {
      if (iOS) {
        // For iOS, show custom prompt after a delay
        const timer = setTimeout(() => setShowPrompt(true), IOS_PROMPT_DELAY);
        return () => clearTimeout(timer);
      }

      // For Android/Desktop, listen for beforeinstallprompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        // Show prompt after a short delay
        setTimeout(() => setShowPrompt(true), ANDROID_PROMPT_DELAY);
      };

      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'dismissed') {
      // Persist dismiss timestamp to enforce cooldown period
      localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    setShowPrompt(false);
  };

  // Don't show if already installed or dismissed
  if (isStandalone || !showPrompt) {
    return null;
  }

  // iOS Install Instructions
  if (isIOS) {
    return (
      <div 
        className="fixed bottom-4 left-4 right-4 z-50 animate-slide-in-up" 
        role="dialog"
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-description"
        data-testid="pwa-install-prompt"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <Card className="p-4 shadow-2xl border-2 border-primary/20 bg-card/95 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-destructive flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="pwa-install-title" className="font-bold text-foreground mb-1">Install Spartan Coaching</h3>
              <p id="pwa-install-description" className="text-sm text-muted-foreground mb-3">
                Get quick access from your home screen. Tap the share button 
                <span className="inline-block mx-1 px-2 py-0.5 bg-primary/10 rounded text-xs">
                  <svg className="inline w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
                  </svg>
                </span>
                then "Add to Home Screen"
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="flex-shrink-0"
              data-testid="button-dismiss-install"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Android/Desktop Install Prompt
  return (
    <div 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-in-up"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
      data-testid="pwa-install-prompt"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <Card className="p-4 shadow-2xl border-2 border-primary/20 bg-card/95 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-destructive flex items-center justify-center">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground mb-1">Install Spartan Coaching</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Install our app for quick access, offline support, and a better experience.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="flex-1"
                data-testid="button-install-pwa"
              >
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                data-testid="button-dismiss-install"
              >
                Not Now
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
