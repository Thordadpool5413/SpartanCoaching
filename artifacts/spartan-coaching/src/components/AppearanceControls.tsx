import { Moon, Sun, Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "@/context/ThemeContext";
import { ACCENT_PRESETS, BG_PRESETS, type AccentKey, type BgKey } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface AppearanceControlsProps {
  /** Compact icon-only trigger (header/footer). */
  compact?: boolean;
  /** Extra class on the trigger button */
  className?: string;
  /** test id prefix */
  testId?: string;
}

function SwatchButton({
  label,
  color,
  selected,
  onClick,
  testId,
}: {
  label: string;
  color: string;
  selected: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={selected}
      data-testid={testId}
      className={cn(
        "relative h-8 w-8 rounded-full border-2 transition-transform touch-manipulation",
        "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected ? "border-foreground scale-110" : "border-transparent",
      )}
      style={{ backgroundColor: color }}
    >
      {selected && (
        <Check
          className={cn(
            "absolute inset-0 m-auto h-3.5 w-3.5 drop-shadow",
            // light swatches need dark check
            "text-white mix-blend-difference",
          )}
          strokeWidth={3}
        />
      )}
    </button>
  );
}

export function AppearancePanel({ className }: { className?: string }) {
  const { mode, accent, background, setMode, setAccent, setBackground } = useTheme();

  return (
    <div className={cn("space-y-5", className)} data-testid="appearance-panel">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
          Mode
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "light" ? "default" : "outline"}
            className="flex-1 font-semibold gap-1.5"
            onClick={() => setMode("light")}
            data-testid="button-mode-light"
          >
            <Sun className="w-3.5 h-3.5" />
            Light
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "dark" ? "default" : "outline"}
            className="flex-1 font-semibold gap-1.5"
            onClick={() => setMode("dark")}
            data-testid="button-mode-dark"
          >
            <Moon className="w-3.5 h-3.5" />
            Dark
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
          Background
        </p>
        <div className="grid grid-cols-4 gap-2.5">
          {BG_PRESETS.map((p) => (
            <div key={p.key} className="flex flex-col items-center gap-1">
              <SwatchButton
                label={p.label}
                color={mode === "dark" ? p.swatch : p.swatchLight}
                selected={background === p.key}
                onClick={() => setBackground(p.key as BgKey)}
                testId={`button-bg-${p.key}`}
              />
              <span className="text-[10px] text-muted-foreground leading-none text-center">
                {p.label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
          Changes the page surface color. Accent (brand) stays separate.
        </p>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
          Accent
        </p>
        <div className="flex flex-wrap gap-2.5">
          {ACCENT_PRESETS.map((p) => (
            <SwatchButton
              key={p.key}
              label={p.label}
              color={p.swatch}
              selected={accent === p.key}
              onClick={() => setAccent(p.key as AccentKey)}
              testId={`button-accent-${p.key}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AppearanceControls({
  compact = true,
  className,
  testId = "button-appearance",
}: AppearanceControlsProps) {
  const { mode } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className={cn(
            compact
              ? "h-8 w-8 text-muted-foreground hover:text-foreground"
              : "gap-1.5 font-medium",
            className,
          )}
          aria-label="Appearance settings — theme, background, and accent"
          data-testid={testId}
        >
          <Palette className="w-4 h-4" />
          {!compact && <span>Appearance</span>}
          <span className="sr-only">
            {mode === "dark" ? "Dark mode" : "Light mode"} — open appearance
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 sm:w-80 p-4"
        data-testid="popover-appearance"
      >
        <div className="mb-3">
          <p className="font-display font-bold text-sm tracking-tight">Appearance</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Light or dark, background color, and brand accent.
          </p>
        </div>
        <AppearancePanel />
      </PopoverContent>
    </Popover>
  );
}
