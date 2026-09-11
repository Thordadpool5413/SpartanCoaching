export type ThemeMode = "light" | "dark";
export type AccentKey = "red" | "blue" | "green" | "gold" | "purple" | "slate";
export type ThemePresetKey = "spartan" | "mamba" | "custom";
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
  /** Used by CSS via data-accent — primary HSL for light + dark */
  primaryLight: string;
  primaryDark: string;
}

export interface BgPreset {
  key: BgKey;
  label: string;
  swatch: string;
  /** light | dark — drives html.dark and readable text */
  tone: "light" | "dark";
  /** Page background HSL components */
  bg: string;
  /** Primary body text — high contrast, professional */
  fg: string;
  card: string;
  cardFg: string;
  muted: string;
  /** Secondary text — WCAG-friendly on this surface */
  mutedFg: string;
  secondary: string;
  border: string;
  sidebar: string;
}

export interface ThemePreset {
  key: ThemePresetKey;
  label: string;
  description: string;
  swatches: readonly string[];
}

export const MAMBA_COLORS = {
  purple: "#552583",
  gold: "#FDB927",
  black: "#1A1A1A",
  gray: "#6E6E6E",
  silver: "#D4D4D4",
} as const;

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: "spartan",
    label: "Spartan",
    description: "Paper, ink, and Spartan red.",
    swatches: ["#B6192A", "#FCFAF6", "#081424"],
  },
  {
    key: "mamba",
    label: "Mamba Mentality",
    description: "Focus, discipline, relentless execution.",
    swatches: [MAMBA_COLORS.purple, MAMBA_COLORS.gold, MAMBA_COLORS.black, MAMBA_COLORS.silver],
  },
];

const THEME_PRESET_CHOICE_KEY = "spartan_theme_preset_choice_v1";
const THEME_MODE_CHOICE_KEY = "spartan_theme_mode_choice_v1";

export const ACCENT_PRESETS: AccentPreset[] = [
  { key: "red", label: "Spartan Red", swatch: "hsl(0 85% 50%)", primaryLight: "0 85% 48%", primaryDark: "0 85% 58%" },
  { key: "blue", label: "Steel Blue", swatch: "hsl(213 80% 48%)", primaryLight: "213 80% 42%", primaryDark: "213 80% 58%" },
  { key: "green", label: "Forest", swatch: "hsl(142 65% 36%)", primaryLight: "142 65% 32%", primaryDark: "142 65% 48%" },
  { key: "gold", label: "Gold", swatch: "hsl(38 90% 42%)", primaryLight: "38 90% 38%", primaryDark: "38 90% 55%" },
  { key: "purple", label: "Purple", swatch: "hsl(270 65% 50%)", primaryLight: "270 65% 48%", primaryDark: "270 65% 62%" },
  { key: "slate", label: "Slate", swatch: "hsl(215 30% 40%)", primaryLight: "215 30% 36%", primaryDark: "215 30% 58%" },
];

/**
 * Absolute surface colors. Light presets are truly light; dark presets are
 * clearly distinct. fg / cardFg / mutedFg stay high-contrast so body and
 * secondary copy remain readable on every background.
 */
export const BG_PRESETS: BgPreset[] = [
  {
    key: "default",
    label: "Brand Dark",
    swatch: "hsl(0 0% 7%)",
    tone: "dark",
    bg: "0 0% 7%",
    fg: "0 0% 97%",
    card: "0 0% 12%",
    cardFg: "0 0% 97%",
    muted: "0 0% 15%",
    mutedFg: "0 0% 80%",
    secondary: "0 0% 17%",
    border: "0 0% 24%",
    sidebar: "0 0% 6%",
  },
  {
    key: "soft",
    label: "Soft White",
    swatch: "hsl(210 25% 98%)",
    tone: "light",
    bg: "210 25% 98%",
    fg: "222 30% 10%",
    card: "0 0% 100%",
    cardFg: "222 30% 10%",
    muted: "210 18% 93%",
    mutedFg: "220 16% 26%",
    secondary: "210 14% 91%",
    border: "214 14% 80%",
    sidebar: "210 20% 96%",
  },
  {
    key: "warm",
    label: "Warm Paper",
    swatch: "hsl(40 45% 96%)",
    tone: "light",
    bg: "40 45% 96%",
    fg: "25 35% 10%",
    card: "40 50% 99%",
    cardFg: "25 35% 10%",
    muted: "36 30% 90%",
    mutedFg: "25 18% 24%",
    secondary: "36 24% 88%",
    border: "34 18% 78%",
    sidebar: "38 35% 94%",
  },
  {
    key: "cool",
    label: "Cool Mist",
    swatch: "hsl(200 35% 96%)",
    tone: "light",
    bg: "200 35% 96%",
    fg: "210 35% 10%",
    card: "0 0% 100%",
    cardFg: "210 35% 10%",
    muted: "200 22% 91%",
    mutedFg: "210 18% 24%",
    secondary: "200 18% 89%",
    border: "200 16% 78%",
    sidebar: "200 28% 95%",
  },
  {
    key: "ink",
    label: "Pure Black",
    swatch: "hsl(0 0% 0%)",
    tone: "dark",
    bg: "0 0% 0%",
    fg: "0 0% 98%",
    card: "0 0% 9%",
    cardFg: "0 0% 97%",
    muted: "0 0% 12%",
    mutedFg: "0 0% 80%",
    secondary: "0 0% 14%",
    border: "0 0% 22%",
    sidebar: "0 0% 4%",
  },
  {
    key: "midnight",
    label: "Midnight Navy",
    swatch: "hsl(222 48% 9%)",
    tone: "dark",
    bg: "222 48% 9%",
    fg: "214 40% 98%",
    card: "222 40% 13%",
    cardFg: "214 35% 98%",
    muted: "222 36% 15%",
    mutedFg: "214 22% 78%",
    secondary: "222 32% 17%",
    border: "222 28% 22%",
    sidebar: "222 50% 7%",
  },
  {
    key: "charcoal",
    label: "Charcoal",
    swatch: "hsl(0 0% 20%)",
    tone: "dark",
    bg: "0 0% 18%",
    fg: "0 0% 98%",
    card: "0 0% 22%",
    cardFg: "0 0% 98%",
    muted: "0 0% 24%",
    mutedFg: "0 0% 82%",
    secondary: "0 0% 26%",
    border: "0 0% 34%",
    sidebar: "0 0% 14%",
  },
  {
    key: "forest",
    label: "Deep Forest",
    swatch: "hsl(152 28% 13%)",
    tone: "dark",
    bg: "152 28% 13%",
    fg: "140 25% 97%",
    card: "152 24% 17%",
    cardFg: "140 20% 97%",
    muted: "152 20% 19%",
    mutedFg: "140 16% 80%",
    secondary: "152 18% 21%",
    border: "152 16% 28%",
    sidebar: "152 30% 10%",
  },
];

const MAMBA_DARK_SURFACE: BgPreset = {
  key: "charcoal",
  label: "Mamba Black",
  swatch: MAMBA_COLORS.black,
  tone: "dark",
  bg: "0 0% 8%",
  fg: "0 0% 96%",
  card: "0 0% 11%",
  cardFg: "0 0% 96%",
  muted: "0 0% 16%",
  mutedFg: "0 0% 74%",
  secondary: "271 55% 33%",
  border: "0 0% 20%",
  sidebar: "0 0% 9%",
};

const MAMBA_LIGHT_SURFACE: BgPreset = {
  key: "soft",
  label: "Mamba Silver",
  swatch: MAMBA_COLORS.silver,
  tone: "light",
  bg: "0 0% 96%",
  fg: "0 0% 10%",
  card: "0 0% 100%",
  cardFg: "0 0% 10%",
  muted: "0 0% 90%",
  mutedFg: "0 0% 36%",
  secondary: "0 0% 90%",
  border: "0 0% 83%",
  sidebar: "0 0% 94%",
};

const SPARTAN_LIGHT_SURFACE: BgPreset = {
  key: "soft",
  label: "Spartan Paper",
  swatch: "#FCFAF6",
  tone: "light",
  bg: "38 33% 97%",
  fg: "217 64% 9%",
  card: "40 35% 99%",
  cardFg: "217 64% 9%",
  muted: "36 18% 92%",
  mutedFg: "216 20% 26%",
  secondary: "216 24% 90%",
  border: "216 16% 76%",
  sidebar: "40 25% 95%",
};

const SPARTAN_DARK_SURFACE: BgPreset = {
  key: "midnight",
  label: "Spartan Night",
  swatch: "#081424",
  tone: "dark",
  bg: "217 64% 7%",
  fg: "40 33% 96%",
  card: "216 49% 11%",
  cardFg: "40 33% 96%",
  muted: "216 35% 15%",
  mutedFg: "215 18% 82%",
  secondary: "216 30% 18%",
  border: "215 24% 25%",
  sidebar: "218 67% 6%",
};

export function resolveThemeSurface(
  themePreset: ThemePresetKey,
  mode: ThemeMode,
  background: BgKey,
): BgPreset {
  if (themePreset === "mamba") {
    return mode === "dark" ? MAMBA_DARK_SURFACE : MAMBA_LIGHT_SURFACE;
  }
  if (themePreset === "spartan") {
    return mode === "dark" ? SPARTAN_DARK_SURFACE : SPARTAN_LIGHT_SURFACE;
  }
  return getBgPreset(background);
}

const ACCENT_PROPS = [
  "--primary",
  "--primary-foreground",
  "--ring",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-ring",
  "--accent",
  "--accent-foreground",
] as const;

const SURFACE_PROPS = [
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

export function getBgPreset(bg: BgKey): BgPreset {
  return BG_PRESETS.find((p) => p.key === bg) ?? BG_PRESETS[0];
}

export function getAccentPreset(accent: AccentKey): AccentPreset {
  return ACCENT_PRESETS.find((p) => p.key === accent) ?? ACCENT_PRESETS[0];
}

export function getInitialThemePreset(): ThemePresetKey {
  if (typeof window === "undefined") return "mamba";
  try {
    const saved = localStorage.getItem("spartan_theme_preset");
    if (saved === "spartan" && localStorage.getItem(THEME_PRESET_CHOICE_KEY) !== "1") {
      return "mamba";
    }
    if (saved === "mamba" || saved === "spartan" || saved === "custom") return saved;
  } catch {
    /* ignore */
  }
  return "mamba";
}

export function markThemePresetChosen() {
  try {
    localStorage.setItem(THEME_PRESET_CHOICE_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function markThemeModeChosen() {
  try {
    localStorage.setItem(THEME_MODE_CHOICE_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function modeForBackground(bg: BgKey): ThemeMode {
  return getBgPreset(bg).tone;
}

export function getInitialAccent(): AccentKey {
  if (typeof window === "undefined") return "gold";
  try {
    const saved = localStorage.getItem("spartan_accent");
    if (saved && ACCENT_PRESETS.some((p) => p.key === saved)) return saved as AccentKey;
  } catch {
    /* ignore */
  }
  return "gold";
}

export function getInitialBackground(): BgKey {
  if (typeof window === "undefined") return "charcoal";
  try {
    const saved = localStorage.getItem("spartan_bg");
    if (saved && BG_PRESETS.some((preset) => preset.key === saved)) return saved as BgKey;
  } catch {
    /* ignore */
  }
  return "charcoal";
}

export function getInitialMode(): ThemeMode {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("spartan_theme");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed === "light" || parsed === "dark") return parsed;
      }
    } catch {
      /* ignore */
    }
  }
  return modeForBackground(getInitialBackground());
}

export function getInitialModeForPreset(themePreset: ThemePresetKey): ThemeMode {
  if (themePreset === "mamba" && typeof window !== "undefined") {
    try {
      if (localStorage.getItem(THEME_MODE_CHOICE_KEY) !== "1") return "dark";
    } catch {
      return "dark";
    }
  }
  return getInitialMode();
}

function setVar(prop: string, value: string) {
  document.documentElement.style.setProperty(prop, value);
}

/**
 * Apply theme to the live document. Safe to call outside React.
 * Sets data attributes (for CSS), CSS variables, dark class, and body color.
 */
export function applyAppearance(
  mode: ThemeMode,
  accent: AccentKey,
  background: BgKey,
  themePreset: ThemePresetKey = "spartan",
): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const body = document.body;
  const surface = resolveThemeSurface(themePreset, mode, background);
  const accentPreset = getAccentPreset(accent);
  const effectiveMode: ThemeMode = themePreset === "custom" ? surface.tone : mode;

  // 1) Mode class
  root.classList.toggle("dark", effectiveMode === "dark");
  root.style.colorScheme = effectiveMode;

  // 2) Data attributes — CSS hooks + debugging
  root.dataset.themeMode = effectiveMode;
  root.dataset.bg = background;
  root.dataset.accent = accent;
  root.dataset.themePreset = themePreset;

  // 3) Surface CSS variables (drive Tailwind tokens)
  setVar("--background", surface.bg);
  setVar("--foreground", surface.fg);
  setVar("--card", surface.card);
  setVar("--card-foreground", surface.cardFg);
  setVar("--card-border", surface.border);
  setVar("--muted", surface.muted);
  setVar("--muted-foreground", surface.mutedFg);
  setVar("--secondary", surface.secondary);
  setVar("--secondary-foreground", surface.fg);
  setVar("--popover", surface.card);
  setVar("--popover-foreground", surface.fg);
  setVar("--popover-border", surface.border);
  setVar("--border", surface.border);
  setVar("--input", surface.border);
  setVar("--sidebar", surface.sidebar);
  setVar("--sidebar-foreground", surface.fg);
  setVar("--sidebar-border", surface.border);

  // 4) Accent / brand — primary-foreground always contrasts with primary fill
  const primary = themePreset === "mamba"
    ? effectiveMode === "dark" ? "42 98% 57%" : "271 56% 33%"
    : themePreset === "spartan"
      ? effectiveMode === "dark" ? "357 82% 58%" : "357 78% 40%"
      : effectiveMode === "dark"
        ? accentPreset.primaryDark
        : accentPreset.primaryLight;
  const [ph, ps] = primary.split(" ");
  setVar("--primary", primary);
  // Gold is light on dark surfaces → dark label; otherwise white on brand color
  const primaryOnAccent =
    themePreset === "mamba"
      ? effectiveMode === "dark" ? "0 0% 10%" : "0 0% 100%"
      : accent === "gold" || accent === "green"
        ? "0 0% 10%"
      : "0 0% 100%";
  setVar("--primary-foreground", primaryOnAccent);
  setVar("--ring", primary);
  setVar("--sidebar-primary", primary);
  setVar("--sidebar-primary-foreground", primaryOnAccent);
  setVar("--sidebar-ring", primary);
  if (effectiveMode === "light") {
    setVar("--accent", `${ph} ${ps} 94%`);
    setVar("--accent-foreground", primary);
  } else {
    setVar("--accent", `${ph} ${ps} 18%`);
    setVar("--accent-foreground", surface.fg);
  }
  if (themePreset === "mamba") {
    setVar("--accent", effectiveMode === "dark" ? "271 56% 28%" : "42 98% 57%");
    setVar("--accent-foreground", effectiveMode === "dark" ? "0 0% 96%" : "0 0% 10%");
    setVar("--secondary", effectiveMode === "dark" ? "271 56% 28%" : "42 98% 57%");
    setVar("--secondary-foreground", effectiveMode === "dark" ? "0 0% 96%" : "0 0% 10%");
  } else if (themePreset === "spartan") {
    setVar("--accent", effectiveMode === "dark" ? "357 48% 20%" : "357 62% 93%");
    setVar("--accent-foreground", effectiveMode === "dark" ? "40 33% 96%" : "357 78% 34%");
    setVar("--secondary", surface.secondary);
    setVar("--secondary-foreground", surface.fg);
  }
  // Destructive always keeps readable on-fill text
  setVar("--destructive-foreground", "0 0% 100%");
  if (themePreset === "mamba") {
    setVar("--mamba-purple", MAMBA_COLORS.purple);
    setVar("--mamba-gold", MAMBA_COLORS.gold);
    setVar("--mamba-black", MAMBA_COLORS.black);
    setVar("--mamba-silver", MAMBA_COLORS.silver);
    setVar("--brand-command", "271 56% 33%");
    setVar("--brand-precision", "42 98% 57%");
  } else {
    root.style.removeProperty("--mamba-purple");
    root.style.removeProperty("--mamba-gold");
    root.style.removeProperty("--mamba-black");
    root.style.removeProperty("--mamba-silver");
    setVar("--brand-command", "357 78% 40%");
    setVar("--brand-precision", "38 82% 50%");
  }

  // 5) Hard paint html/body/#root so first paint matches surface (FOUC-safe)
  const bgColor = `hsl(${surface.bg})`;
  const fgColor = `hsl(${surface.fg})`;
  const mutedColor = `hsl(${surface.mutedFg})`;
  const cardColor = `hsl(${surface.card})`;
  root.style.backgroundColor = bgColor;
  root.style.color = fgColor;
  if (body) {
    body.style.backgroundColor = bgColor;
    body.style.color = fgColor;
  }
  const appRoot = document.getElementById("root");
  if (appRoot) {
    appRoot.style.backgroundColor = bgColor;
    appRoot.style.color = fgColor;
  }
  root.style.setProperty("--theme-muted-fg", mutedColor);
  root.style.setProperty("--theme-card", cardColor);
  // Semantic status tokens (shared by badges / trial chips)
  setVar("--success", effectiveMode === "dark" ? "142 70% 45%" : "142 65% 32%");
  setVar("--success-foreground", effectiveMode === "dark" ? "140 30% 96%" : "0 0% 100%");
  setVar("--warning", themePreset === "mamba" ? "42 98% 57%" : effectiveMode === "dark" ? "38 92% 55%" : "32 90% 42%");
  setVar("--warning-foreground", themePreset === "mamba" ? "0 0% 10%" : effectiveMode === "dark" ? "40 30% 10%" : "0 0% 100%");
  root.style.setProperty("color-scheme", effectiveMode);

  // 6) Persist
  try {
    localStorage.setItem("spartan_theme", JSON.stringify(effectiveMode));
    localStorage.setItem("spartan_bg", background);
    localStorage.setItem("spartan_accent", accent);
    localStorage.setItem("spartan_theme_preset", themePreset);
    localStorage.setItem(
      "spartan_theme_sync",
      JSON.stringify({ mode: effectiveMode, accent, background, themePreset, t: Date.now() }),
    );
  } catch {
    /* private mode */
  }

  // Notify same-tab listeners (custom event — more reliable than BroadcastChannel alone)
  try {
    window.dispatchEvent(
      new CustomEvent("spartan-theme-change", {
        detail: { mode: effectiveMode, accent, background, themePreset },
      }),
    );
  } catch {
    /* ignore */
  }
}

export function defaultBgForMode(mode: ThemeMode, current: BgKey): BgKey {
  const cur = getBgPreset(current);
  if (cur.tone === mode) return current;
  return mode === "light" ? "soft" : "midnight";
}

// Back-compat exports used elsewhere
export const BG_SURFACE_PROPS = SURFACE_PROPS;
export function applyBackground(bg: BgKey): ThemeMode {
  const accent = getInitialAccent();
  const tone = modeForBackground(bg);
  applyAppearance(tone, accent, bg, getInitialThemePreset());
  return tone;
}
export function applyAccent(accent: AccentKey, mode: ThemeMode) {
  const bg = getInitialBackground();
  applyAppearance(mode, accent, bg, getInitialThemePreset());
}
export function clearAccentVars() {
  for (const p of ACCENT_PROPS) document.documentElement.style.removeProperty(p);
}
export function clearBackgroundVars() {
  for (const p of SURFACE_PROPS) document.documentElement.style.removeProperty(p);
}
