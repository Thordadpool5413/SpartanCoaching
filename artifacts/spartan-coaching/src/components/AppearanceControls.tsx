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
  compact?: boolean;
  className?: string;
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
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      title={label}
      aria-label={label}
      aria-pressed={selected}
      data-testid={testId}
      className={cn(
        "relative h-9 w-9 rounded-full border-2 transition-transform touch-manipulation shrink-0",
        "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected ? "border-primary scale-110 ring-2 ring-primary/40" : "border-border",
      )}
      style={{ backgroundColor: color }}
    >
      {selected && (
        <Check
          className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
          strokeWidth={3}
        />
      )}
    </button>
  );
}

export function AppearancePanel({ className }: { className?: string }) {
  const { mode, accent, background, setMode, setAccent, setBackground } = useTheme();

  const lightBgs = BG_PRESETS.filter((p) => p.tone === "light");
  const darkBgs = BG_PRESETS.filter((p) => p.tone === "dark");

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
        <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
          Light switches the whole site off black. Dark keeps the brand look.
        </p>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Light backgrounds
        </p>
        <div className="flex flex-wrap gap-3 mb-4">
          {lightBgs.map((p) => (
            <div key={p.key} className="flex flex-col items-center gap-1 w-14">
              <SwatchButton
                label={p.label}
                color={p.swatch}
                selected={background === p.key}
                onClick={() => setBackground(p.key as BgKey)}
                testId={`button-bg-${p.key}`}
              />
              <span className="text-[10px] text-muted-foreground leading-tight text-center">
                {p.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Dark backgrounds
        </p>
        <div className="flex flex-wrap gap-3">
          {darkBgs.map((p) => (
            <div key={p.key} className="flex flex-col items-center gap-1 w-14">
              <SwatchButton
                label={p.label}
                color={p.swatch}
                selected={background === p.key}
                onClick={() => setBackground(p.key as BgKey)}
                testId={`button-bg-${p.key}`}
              />
              <span className="text-[10px] text-muted-foreground leading-tight text-center">
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
          Accent color
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

      <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground leading-snug">
        Active: <strong className="text-foreground">{mode}</strong>
        {" · "}
        <strong className="text-foreground">
          {BG_PRESETS.find((p) => p.key === background)?.label ?? background}
        </strong>
        {" · "}
        <strong className="text-foreground">
          {ACCENT_PRESETS.find((p) => p.key === accent)?.label ?? accent}
        </strong>
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
          variant={compact ? "outline" : "ghost"}
          size={compact ? "icon" : "sm"}
          className={cn(
            compact
              ? "h-9 w-9 border-border text-foreground hover:bg-muted"
              : "gap-1.5 font-medium",
            className,
          )}
          aria-label="Change theme colors"
          data-testid={testId}
        >
          <Palette className="w-4 h-4" />
          {!compact && <span>Theme</span>}
          <span className="sr-only">
            {mode === "dark" ? "Dark mode" : "Light mode"} — open appearance
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(92vw,22rem)] p-4 z-[100]"
        data-testid="popover-appearance"
      >
        <div className="mb-3">
          <p className="font-display font-bold text-sm tracking-tight">Theme colors</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tap Light or a light background to leave black. Changes apply to every page.
          </p>
        </div>
        <AppearancePanel />
      </PopoverContent>
    </Popover>
  );
}
