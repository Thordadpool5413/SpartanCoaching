export type ThemeMode = "light" | "dark";
export type AccentKey = "red" | "blue" | "green" | "gold" | "purple" | "slate";
export type BgKey =
  | "default"
  | "soft"
  | "warm"
  | "cool"
  | "ink"
  | "midnight"
  | "charcoal"
  | "forest";

export interface AccentPreset {
  key: AccentKey;
  label: string;
  swatch: string;
  vars: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export interface BgPreset {
  key: BgKey;
  label: string;
  /** Single swatch shown in the picker (the real color users get) */
  swatch: string;
  /** Kept for back-compat with older UI */
  swatchLight: string;
  /**
   * Absolute surface — NOT mode-tinted near-black.
   * Picking a light preset paints a light site; dark presets paint a dark site.
   * `tone` drives the html.dark class so text contrast matches.
   */
  tone: "light" | "dark";
  /** HSL components without hsl() wrapper, e.g. "40 33% 97%" */
  background: string;
  vars: Record<string, string>;
}

/** Surface tokens a background preset may override */
export const BG_SURFACE_PROPS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--card-border",
  "--muted",
  "--muted-foreground",
  "--secondary",
  "--secondary-foreground",
  "--popover",
  "--popover-foreground",
  "--popover-border",
  "--border",
  "--input",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-border",
] as const;

function surfaceVars(opts: {
  bg: string;
  fg: string;
  card: string;
  cardFg: string;
  muted: string;
  mutedFg: string;
  secondary: string;
  border: string;
  sidebar: string;
}): Record<string, string> {
  return {
    "--background": opts.bg,
    "--foreground": opts.fg,
    "--card": opts.card,
    "--card-foreground": opts.cardFg,
    "--card-border": opts.border,
    "--muted": opts.muted,
    "--muted-foreground": opts.mutedFg,
    "--secondary": opts.secondary,
    "--secondary-foreground": opts.fg,
    "--popover": opts.card,
    "--popover-foreground": opts.fg,
    "--popover-border": opts.border,
    "--border": opts.border,
    "--input": opts.border,
    "--sidebar": opts.sidebar,
    "--sidebar-foreground": opts.fg,
    "--sidebar-border": opts.border,
  };
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    key: "red",
    label: "Spartan Red",
    swatch: "hsl(0 85% 58%)",
    vars: {
      light: {
        "--primary": "0 85% 58%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "0 100% 97%",
        "--accent-foreground": "0 84% 35%",
        "--ring": "0 85% 58%",
        "--sidebar-primary": "0 75% 55%",
        "--sidebar-primary-foreground": "0 0% 100%",
        "--sidebar-ring": "0 75% 55%",
      },
      dark: {
        "--primary": "0 85% 62%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "0 85% 16%",
        "--accent-foreground": "0 85% 94%",
        "--ring": "0 85% 62%",
        "--sidebar-primary": "0 85% 62%",
        "--sidebar-primary-foreground": "0 0% 100%",
        "--sidebar-ring": "0 85% 62%",
      },
    },
  },
  {
    key: "blue",
    label: "Steel Blue",
    swatch: "hsl(213 80% 50%)",
    vars: {
      light: {
        "--primary": "213 80% 50%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "213 80% 96%",
        "--accent-foreground": "213 80% 28%",
        "--ring": "213 80% 50%",
        "--sidebar-primary": "213 75% 48%",
        "--sidebar-primary-foreground": "0 0% 100%",
        "--sidebar-ring": "213 75% 48%",
      },
      dark: {
        "--primary": "213 80% 62%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "213 80% 15%",
        "--accent-foreground": "213 80% 92%",
        "--ring": "213 80% 62%",
        "--sidebar-primary": "213 80% 62%",
        "--sidebar-primary-foreground": "0 0% 100%",
        "--sidebar-ring": "213 80% 62%",
      },
    },
  },
  {
    key: "green",
    label: "Forest Green",
    swatch: "hsl(142 65% 38%)",
    vars: {
      light: {
        "--primary": "142 65% 38%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "142 65% 95%",
        "--accent-foreground": "142 65% 22%",
        "--ring": "142 65% 38%",
        "--sidebar-primary": "142 60% 36%",
        "--sidebar-primary-foreground": "0 0% 100%",
        "--sidebar-ring": "142 60% 36%",
      },
      dark: {
        "--primary": "142 65% 52%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "142 65% 14%",
        "--accent-foreground": "142 65% 90%",
        "--ring": "142 65% 52%",
        "--sidebar-primary": "142 65% 52%",
        "--sidebar-primary-foreground": "0 0% 100%",
        "--sidebar-ring": "142 65% 52%",
      },
    },
  },
  {
    key: "gold",
    label: "Gold",
    swatch: "hsl(38 90% 45%)",
    vars: {
      light: {
        "--primary": "38 90% 45%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "38 90% 96%",
        "--accent-foreground": "38 90% 25%",
        "--ring": "38 90% 45%",
        "--sidebar-primary": "38 85% 43%",
        "--sidebar-primary-foreground": "0 0% 100%",
        "--sidebar-ring": "38 85% 43%",
      },
      dark: {
        "--primary": "38 90% 58%",
        "--primary-foreground": "0 0% 8%",
        "--accent": "38 90% 14%",
        "--accent-foreground": "38 90% 90%",
        "--ring": "38 90% 58%",
        "--sidebar-primary": "38 90% 58%",
        "--sidebar-primary-foreground": "0 0% 8%",
        "--sidebar-ring": "38 90% 58%",
      },
    },
  },
  {
    key: "purple",
    label: "Purple",
    swatch: "hsl(270 65% 55%)",
    vars: {
      light: {
        "--primary": "270 65% 55%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "270 65% 96%",
        "--accent-foreground": "270 65% 30%",
        "--ring": "270 65% 55%",
        "--sidebar-primary": "270 60% 53%",
        "--sidebar-primary-foreground": "0 0% 100%",
        "--sidebar-ring": "270 60% 53%",
      },
      dark: {
        "--primary": "270 65% 65%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "270 65% 16%",
        "--accent-foreground": "270 65% 93%",
        "--ring": "270 65% 65%",
        "--sidebar-primary": "270 65% 65%",
        "--sidebar-primary-foreground": "0 0% 100%",
        "--sidebar-ring": "270 65% 65%",
      },
    },
  },
  {
    key: "slate",
    label: "Slate",
    swatch: "hsl(215 30% 42%)",
    vars: {
      light: {
        "--primary": "215 30% 42%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "215 30% 95%",
        "--accent-foreground": "215 30% 22%",
        "--ring": "215 30% 42%",
        "--sidebar-primary": "215 28% 40%",
        "--sidebar-primary-foreground": "0 0% 100%",
        "--sidebar-ring": "215 28% 40%",
      },
      dark: {
        "--primary": "215 30% 58%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "215 30% 14%",
        "--accent-foreground": "215 30% 90%",
        "--ring": "215 30% 58%",
        "--sidebar-primary": "215 30% 58%",
        "--sidebar-primary-foreground": "0 0% 100%",
        "--sidebar-ring": "215 30% 58%",
      },
    },
  },
];

export const BG_PRESETS: BgPreset[] = [
  {
    key: "default",
    label: "Brand Dark",
    swatch: "hsl(0 0% 6%)",
    swatchLight: "hsl(0 0% 6%)",
    tone: "dark",
    background: "0 0% 6%",
    vars: surfaceVars({
      bg: "0 0% 6%",
      fg: "0 0% 96%",
      card: "0 0% 10%",
      cardFg: "0 0% 96%",
      muted: "0 0% 12%",
      mutedFg: "0 0% 62%",
      secondary: "0 0% 14%",
      border: "0 0% 18%",
      sidebar: "0 0% 5%",
    }),
  },
  {
    key: "soft",
    label: "Soft White",
    swatch: "hsl(220 20% 97%)",
    swatchLight: "hsl(220 20% 97%)",
    tone: "light",
    background: "220 20% 97%",
    vars: surfaceVars({
      bg: "220 20% 97%",
      fg: "220 20% 12%",
      card: "0 0% 100%",
      cardFg: "220 20% 10%",
      muted: "220 14% 93%",
      mutedFg: "220 10% 38%",
      secondary: "220 12% 91%",
      border: "220 12% 86%",
      sidebar: "220 16% 95%",
    }),
  },
  {
    key: "warm",
    label: "Warm Paper",
    swatch: "hsl(40 40% 96%)",
    swatchLight: "hsl(40 40% 96%)",
    tone: "light",
    background: "40 40% 96%",
    vars: surfaceVars({
      bg: "40 40% 96%",
      fg: "25 25% 12%",
      card: "40 50% 99%",
      cardFg: "25 25% 10%",
      muted: "36 28% 91%",
      mutedFg: "25 12% 36%",
      secondary: "36 22% 90%",
      border: "35 18% 84%",
      sidebar: "38 32% 94%",
    }),
  },
  {
    key: "cool",
    label: "Cool Mist",
    swatch: "hsl(210 30% 96%)",
    swatchLight: "hsl(210 30% 96%)",
    tone: "light",
    background: "210 30% 96%",
    vars: surfaceVars({
      bg: "210 30% 96%",
      fg: "215 28% 12%",
      card: "0 0% 100%",
      cardFg: "215 28% 10%",
      muted: "210 22% 92%",
      mutedFg: "215 14% 38%",
      secondary: "210 18% 90%",
      border: "210 16% 84%",
      sidebar: "210 24% 94%",
    }),
  },
  {
    key: "ink",
    label: "Pure Black",
    swatch: "hsl(0 0% 0%)",
    swatchLight: "hsl(0 0% 0%)",
    tone: "dark",
    background: "0 0% 0%",
    vars: surfaceVars({
      bg: "0 0% 0%",
      fg: "0 0% 98%",
      card: "0 0% 7%",
      cardFg: "0 0% 96%",
      muted: "0 0% 10%",
      mutedFg: "0 0% 60%",
      secondary: "0 0% 12%",
      border: "0 0% 16%",
      sidebar: "0 0% 3%",
    }),
  },
  {
    key: "midnight",
    label: "Midnight Navy",
    swatch: "hsl(222 40% 12%)",
    swatchLight: "hsl(222 40% 12%)",
    tone: "dark",
    background: "222 40% 12%",
    vars: surfaceVars({
      bg: "222 40% 12%",
      fg: "214 30% 96%",
      card: "222 36% 16%",
      cardFg: "214 28% 95%",
      muted: "222 30% 18%",
      mutedFg: "214 16% 68%",
      secondary: "222 28% 20%",
      border: "222 24% 24%",
      sidebar: "222 42% 10%",
    }),
  },
  {
    key: "charcoal",
    label: "Charcoal",
    swatch: "hsl(0 0% 18%)",
    swatchLight: "hsl(0 0% 18%)",
    tone: "dark",
    background: "0 0% 18%",
    vars: surfaceVars({
      bg: "0 0% 18%",
      fg: "0 0% 96%",
      card: "0 0% 22%",
      cardFg: "0 0% 96%",
      muted: "0 0% 24%",
      mutedFg: "0 0% 70%",
      secondary: "0 0% 26%",
      border: "0 0% 30%",
      sidebar: "0 0% 14%",
    }),
  },
  {
    key: "forest",
    label: "Deep Forest",
    swatch: "hsl(150 25% 12%)",
    swatchLight: "hsl(150 25% 12%)",
    tone: "dark",
    background: "150 25% 12%",
    vars: surfaceVars({
      bg: "150 25% 12%",
      fg: "140 20% 95%",
      card: "150 22% 16%",
      cardFg: "140 18% 94%",
      muted: "150 18% 18%",
      mutedFg: "140 12% 68%",
      secondary: "150 16% 20%",
      border: "150 14% 24%",
      sidebar: "150 28% 10%",
    }),
  },
];

export function getInitialAccent(): AccentKey {
  if (typeof window === "undefined") return "red";
  const saved = localStorage.getItem("spartan_accent");
  if (saved && ACCENT_PRESETS.some((p) => p.key === saved)) return saved as AccentKey;
  return "red";
}

export function getInitialBackground(): BgKey {
  if (typeof window === "undefined") return "default";
  const saved = localStorage.getItem("spartan_bg");
  if (saved && BG_PRESETS.some((p) => p.key === saved)) return saved as BgKey;
  return "default";
}

export function getBgPreset(bg: BgKey): BgPreset {
  return BG_PRESETS.find((p) => p.key === bg) ?? BG_PRESETS[0];
}

/** Mode implied by a background preset (light paper → light UI). */
export function modeForBackground(bg: BgKey): ThemeMode {
  return getBgPreset(bg).tone;
}

function setCssVars(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [prop, val] of Object.entries(vars)) {
    root.style.setProperty(prop, val);
  }
}

function clearCssVars(props: readonly string[]) {
  const root = document.documentElement;
  for (const prop of props) root.style.removeProperty(prop);
}

/**
 * Paint the entire document with the chosen surface color.
 * Sets CSS variables AND hard background-color on html/body so nothing stays stuck black.
 */
export function paintDocumentBackground(hslComponents: string) {
  const color = `hsl(${hslComponents})`;
  const root = document.documentElement;
  root.style.setProperty("--background", hslComponents);
  root.style.backgroundColor = color;
  if (document.body) {
    document.body.style.backgroundColor = color;
  }
}

export function applyAccent(accent: AccentKey, mode: ThemeMode) {
  const preset = ACCENT_PRESETS.find((p) => p.key === accent);
  if (!preset) return;
  setCssVars(preset.vars[mode]);
  localStorage.setItem("spartan_accent", accent);
}

/**
 * Apply a background preset. Absolute colors — Soft White is actually white.
 * Also returns the tone so callers can sync light/dark mode.
 */
export function applyBackground(bg: BgKey, _mode?: ThemeMode): ThemeMode {
  const preset = getBgPreset(bg);
  const root = document.documentElement;
  root.dataset.bg = bg;
  localStorage.setItem("spartan_bg", bg);

  clearCssVars(BG_SURFACE_PROPS);
  setCssVars(preset.vars);
  paintDocumentBackground(preset.background);

  return preset.tone;
}

/**
 * Full appearance apply — mode class, background surfaces, accent.
 * Call this from ThemeProvider whenever any pref changes.
 */
export function applyAppearance(mode: ThemeMode, accent: AccentKey, background: BgKey) {
  const root = document.documentElement;
  const preset = getBgPreset(background);

  // Mode class drives Tailwind dark: variants
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  try {
    localStorage.setItem("spartan_theme", JSON.stringify(mode));
  } catch { /* ignore */ }

  root.dataset.themeMode = mode;
  root.dataset.accent = accent;
  root.dataset.bg = background;

  // Surfaces from background preset (absolute)
  clearCssVars(BG_SURFACE_PROPS);
  setCssVars(preset.vars);
  paintDocumentBackground(preset.background);
  localStorage.setItem("spartan_bg", background);

  // Accent last so primary wins
  applyAccent(accent, mode);
}

export function clearAccentVars() {
  clearCssVars([
    "--primary", "--primary-foreground", "--accent", "--accent-foreground",
    "--ring", "--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-ring",
  ]);
}

export function clearBackgroundVars() {
  clearCssVars(BG_SURFACE_PROPS);
  const root = document.documentElement;
  delete root.dataset.bg;
  root.style.removeProperty("background-color");
  if (document.body) document.body.style.removeProperty("background-color");
}
