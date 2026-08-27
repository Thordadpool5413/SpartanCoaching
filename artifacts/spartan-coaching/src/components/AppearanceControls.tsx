import { useEffect, useRef, useState } from "react";
import { Moon, Sun, Palette, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { ACCENT_PRESETS, BG_PRESETS, type AccentKey, type BgKey } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface AppearanceControlsProps {
  compact?: boolean;
  className?: string;
  testId?: string;
}

function SwatchButton({
  label,
  color,
  selected,
  onSelect,
  testId,
}: {
  label: string;
  color: string;
  selected: boolean;
  onSelect: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onSelect}
      title={label}
      aria-label={`Use ${label}`}
      aria-pressed={selected}
      data-testid={testId}
      className={cn(
        "relative h-10 w-10 rounded-full border-2 touch-manipulation shrink-0 transition-transform",
        "hover:scale-110 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        selected ? "border-primary ring-2 ring-primary/50 scale-110" : "border-black/20 dark:border-white/30",
      )}
      style={{ backgroundColor: color }}
    >
      {selected && (
        <Check
          className="pointer-events-none absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
          strokeWidth={3}
        />
      )}
    </button>
  );
}

export function AppearancePanel({
  className,
  onDone,
}: {
  className?: string;
  onDone?: () => void;
}) {
  const { mode, accent, background, setMode, setAccent, setBackground } = useTheme();
  const lightBgs = BG_PRESETS.filter((p) => p.tone === "light");
  // Midnight Navy first — product default for dark surfaces
  const darkBgs = [
    ...BG_PRESETS.filter((p) => p.key === "midnight"),
    ...BG_PRESETS.filter((p) => p.tone === "dark" && p.key !== "midnight"),
  ];
  const activeBg = BG_PRESETS.find((p) => p.key === background);
  const activeAccent = ACCENT_PRESETS.find((p) => p.key === accent);

  return (
    <div
      className={cn("space-y-5 text-foreground", className)}
      data-testid="appearance-panel"
      // Keep pointer events inside the panel
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div>
        <p id="appearance-mode-label" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
          Mode
        </p>
        <div className="flex gap-2" role="group" aria-labelledby="appearance-mode-label">
          <Button
            type="button"
            size="sm"
            variant={mode === "light" ? "default" : "outline"}
            className="flex-1 font-semibold gap-1.5 h-10"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setMode("light")}
            aria-pressed={mode === "light"}
            data-testid="button-mode-light"
          >
            <Sun className="w-4 h-4" />
            Light
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "dark" ? "default" : "outline"}
            className="flex-1 font-semibold gap-1.5 h-10"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setMode("dark")}
            aria-pressed={mode === "dark"}
            data-testid="button-mode-dark"
          >
            <Moon className="w-4 h-4" />
            Dark
          </Button>
        </div>
      </div>

      <div>
        <p id="appearance-light-backgrounds-label" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Light backgrounds
        </p>
        <div className="flex flex-wrap gap-3 mb-4" role="group" aria-labelledby="appearance-light-backgrounds-label">
          {lightBgs.map((p) => (
            <div key={p.key} className="flex flex-col items-center gap-1.5 w-[4.25rem]">
              <SwatchButton
                label={p.label}
                color={p.swatch}
                selected={background === p.key}
                onSelect={() => setBackground(p.key as BgKey)}
                testId={`button-bg-${p.key}`}
              />
              <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">
                {p.label}
              </span>
            </div>
          ))}
        </div>

        <p id="appearance-dark-backgrounds-label" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Dark backgrounds
        </p>
        <div className="flex flex-wrap gap-3" role="group" aria-labelledby="appearance-dark-backgrounds-label">
          {darkBgs.map((p) => (
            <div key={p.key} className="flex flex-col items-center gap-1.5 w-[4.25rem]">
              <SwatchButton
                label={p.label}
                color={p.swatch}
                selected={background === p.key}
                onSelect={() => setBackground(p.key as BgKey)}
                testId={`button-bg-${p.key}`}
              />
              <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p id="appearance-accent-label" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
          Accent color
        </p>
        <div className="flex flex-wrap gap-2.5" role="group" aria-labelledby="appearance-accent-label">
          {ACCENT_PRESETS.map((p) => (
            <SwatchButton
              key={p.key}
              label={p.label}
              color={p.swatch}
              selected={accent === p.key}
              onSelect={() => setAccent(p.key as AccentKey)}
              testId={`button-accent-${p.key}`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs leading-relaxed" aria-live="polite">
        <p className="text-muted-foreground">
          Active theme
        </p>
        <p className="font-semibold text-foreground mt-0.5">
          {mode === "light" ? "Light" : "Dark"}
          {" · "}
          {activeBg?.label ?? background}
          {" · "}
          {activeAccent?.label ?? accent}
        </p>
        <p className="text-muted-foreground mt-1.5 text-[11px]">
          Body text uses high-contrast professional colors on every surface.
        </p>
      </div>

      {onDone && (
        <Button type="button" className="w-full font-semibold" onClick={onDone} data-testid="button-theme-done">
          Done
        </Button>
      )}
    </div>
  );
}

/**
 * Custom panel (not Radix Popover) so swatch clicks always register.
 * Positioned under the trigger in the header.
 */
export function AppearanceControls({
  compact = true,
  className,
  testId = "button-appearance",
}: AppearanceControlsProps) {
  const { mode, background } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogId = `${testId}-dialog`;

  const closePicker = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | PointerEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        closePicker(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePicker(true);
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("pointerdown", onDoc, true);
    document.addEventListener("keydown", onKey);
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>("[data-appearance-close]")?.focus();
    });
    return () => {
      document.removeEventListener("pointerdown", onDoc, true);
      document.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  const activeSwatch =
    BG_PRESETS.find((p) => p.key === background)?.swatch ?? "hsl(0 0% 7%)";

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size={compact ? "icon" : "sm"}
        className={cn(
          compact ? "h-9 w-9 relative" : "gap-1.5 font-medium",
          "border-border bg-card/80 text-foreground hover:bg-muted",
        )}
        aria-label="Change theme colors"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? dialogId : undefined}
        data-testid={testId}
        onClick={() => setOpen((v) => !v)}
      >
        <Palette className="w-4 h-4" />
        {!compact && <span>Theme</span>}
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-background"
          style={{ backgroundColor: activeSwatch }}
          aria-hidden
        />
        <span className="sr-only">
          {mode === "dark" ? "Dark" : "Light"} theme — open color picker
        </span>
      </Button>

      {open && (
        <div
          ref={dialogRef}
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-labelledby="appearance-dialog-title"
          aria-describedby="appearance-dialog-description"
          data-testid="popover-appearance"
          className={cn(
            "absolute right-0 top-[calc(100%+0.5rem)] z-[200]",
            "w-[min(92vw,22rem)] max-h-[min(80dvh,34rem)] overflow-y-auto",
            "rounded-xl border border-border bg-popover text-popover-foreground",
            "p-4 shadow-2xl",
          )}
          // Prevent outside handler from seeing internal presses as "outside"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p id="appearance-dialog-title" className="font-display font-bold text-sm tracking-tight text-foreground">
                Theme colors
              </p>
              <p id="appearance-dialog-description" className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Choose a color. The whole site updates immediately.
              </p>
            </div>
            <button
              type="button"
              data-appearance-close
              className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Close"
              onClick={() => closePicker(true)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <AppearancePanel onDone={() => closePicker(true)} />
        </div>
      )}
    </div>
  );
}
