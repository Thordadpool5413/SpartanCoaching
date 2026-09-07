import { useEffect, useRef, useState } from "react";
import { Moon, Sun, Palette, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { BG_PRESETS, THEME_PRESETS, type ThemePresetKey } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface AppearanceControlsProps {
  compact?: boolean;
  className?: string;
  testId?: string;
}

function ThemePresetButton({
  label,
  description,
  swatches,
  selected,
  onSelect,
  testId,
}: {
  label: string;
  description: string;
  swatches: readonly string[];
  selected: boolean;
  onSelect: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onSelect}
      aria-label={`Use ${label} theme`}
      aria-pressed={selected}
      data-testid={testId}
      className={cn(
        "flex min-h-16 flex-1 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        selected ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 overflow-hidden rounded-md border border-black/20 shadow-sm" aria-hidden>
        {swatches.map((swatch) => (
          <span key={swatch} className="h-full flex-1" style={{ backgroundColor: swatch }} />
        ))}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-foreground">{label}</span>
        <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground">{description}</span>
      </span>
      {selected && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" strokeWidth={3} />}
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
  const { mode, themePreset, setMode, setThemePreset } = useTheme();
  const activePreset = THEME_PRESETS.find((p) => p.key === themePreset);

  return (
    <div
      className={cn("space-y-5 text-foreground", className)}
      data-testid="appearance-panel"
      // Keep pointer events inside the panel
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div>
        <p id="appearance-preset-label" className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Brand preset
        </p>
        <div className="flex flex-col gap-2" role="group" aria-labelledby="appearance-preset-label">
          {THEME_PRESETS.map((preset) => (
            <ThemePresetButton
              key={preset.key}
              label={preset.label}
              description={preset.description}
              swatches={preset.swatches}
              selected={themePreset === preset.key}
              onSelect={() => setThemePreset(preset.key as ThemePresetKey)}
              testId={`button-theme-${preset.key}`}
            />
          ))}
        </div>
      </div>

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

      <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs leading-relaxed" aria-live="polite">
        <p className="text-muted-foreground">
          Active theme
        </p>
        <p className="font-semibold text-foreground mt-0.5">
          {activePreset?.label ?? "Custom"}
          {" · "}
          {mode === "light" ? "Light" : "Dark"}
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
  const { mode, background, themePreset } = useTheme();
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

  const activeSwatch = themePreset === "mamba"
    ? "linear-gradient(135deg, #552583 0 38%, #FDB927 38% 64%, #1A1A1A 64% 82%, #D4D4D4 82%)"
    : BG_PRESETS.find((p) => p.key === background)?.swatch ?? "hsl(0 0% 7%)";

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
          style={{ background: activeSwatch }}
          aria-hidden
        />
        <span className="sr-only">
          {themePreset === "mamba" ? "Mamba Mentality" : mode === "dark" ? "Dark" : "Light"} theme — open color picker
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
          Choose a brand and viewing mode. The whole site updates immediately.
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
