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
  /** Preview swatch (dark-mode oriented for brand default) */
  swatch: string;
  /** Light-mode preview */
  swatchLight: string;
  vars: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
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
    label: "Default",
    swatch: "hsl(0 0% 4%)",
    swatchLight: "hsl(0 0% 99%)",
    vars: { light: {}, dark: {} },
  },
  {
    key: "soft",
    label: "Soft Gray",
    swatch: "hsl(220 10% 10%)",
    swatchLight: "hsl(220 14% 97%)",
    vars: {
      light: {
        "--background": "220 14% 97%",
        "--foreground": "220 15% 12%",
        "--card": "0 0% 100%",
        "--card-foreground": "220 15% 10%",
        "--card-border": "220 12% 90%",
        "--muted": "220 12% 94%",
        "--muted-foreground": "220 8% 40%",
        "--secondary": "220 12% 93%",
        "--secondary-foreground": "220 15% 14%",
        "--popover": "0 0% 100%",
        "--popover-foreground": "220 15% 12%",
        "--popover-border": "220 12% 90%",
        "--border": "220 12% 90%",
        "--input": "220 12% 90%",
        "--sidebar": "220 14% 96%",
        "--sidebar-foreground": "220 15% 14%",
        "--sidebar-border": "220 12% 88%",
      },
      dark: {
        "--background": "220 10% 9%",
        "--foreground": "220 10% 96%",
        "--card": "220 10% 12%",
        "--card-foreground": "220 10% 95%",
        "--card-border": "220 8% 18%",
        "--muted": "220 8% 14%",
        "--muted-foreground": "220 8% 62%",
        "--secondary": "220 8% 16%",
        "--secondary-foreground": "220 10% 96%",
        "--popover": "220 10% 10%",
        "--popover-foreground": "220 10% 96%",
        "--popover-border": "220 8% 18%",
        "--border": "220 8% 100% / 0.09",
        "--input": "220 8% 18%",
        "--sidebar": "220 10% 8%",
        "--sidebar-foreground": "220 10% 92%",
        "--sidebar-border": "220 8% 16%",
      },
    },
  },
  {
    key: "warm",
    label: "Warm Paper",
    swatch: "hsl(30 12% 9%)",
    swatchLight: "hsl(40 33% 97%)",
    vars: {
      light: {
        "--background": "40 33% 97%",
        "--foreground": "25 20% 12%",
        "--card": "40 40% 99%",
        "--card-foreground": "25 20% 10%",
        "--card-border": "35 18% 88%",
        "--muted": "36 22% 93%",
        "--muted-foreground": "25 10% 40%",
        "--secondary": "36 18% 92%",
        "--secondary-foreground": "25 18% 14%",
        "--popover": "40 40% 99%",
        "--popover-foreground": "25 20% 12%",
        "--popover-border": "35 18% 88%",
        "--border": "35 18% 88%",
        "--input": "35 18% 88%",
        "--sidebar": "38 28% 96%",
        "--sidebar-foreground": "25 18% 14%",
        "--sidebar-border": "35 16% 86%",
      },
      dark: {
        "--background": "30 12% 8%",
        "--foreground": "35 20% 95%",
        "--card": "30 12% 11%",
        "--card-foreground": "35 18% 94%",
        "--card-border": "30 10% 17%",
        "--muted": "30 10% 13%",
        "--muted-foreground": "30 8% 60%",
        "--secondary": "30 10% 15%",
        "--secondary-foreground": "35 18% 95%",
        "--popover": "30 12% 9%",
        "--popover-foreground": "35 20% 95%",
        "--popover-border": "30 10% 17%",
        "--border": "30 10% 100% / 0.09",
        "--input": "30 10% 17%",
        "--sidebar": "30 12% 7%",
        "--sidebar-foreground": "35 16% 92%",
        "--sidebar-border": "30 10% 15%",
      },
    },
  },
  {
    key: "cool",
    label: "Cool Slate",
    swatch: "hsl(215 18% 10%)",
    swatchLight: "hsl(210 25% 97%)",
    vars: {
      light: {
        "--background": "210 25% 97%",
        "--foreground": "215 25% 12%",
        "--card": "0 0% 100%",
        "--card-foreground": "215 25% 10%",
        "--card-border": "210 16% 89%",
        "--muted": "210 18% 93%",
        "--muted-foreground": "215 12% 40%",
        "--secondary": "210 16% 92%",
        "--secondary-foreground": "215 22% 14%",
        "--popover": "0 0% 100%",
        "--popover-foreground": "215 25% 12%",
        "--popover-border": "210 16% 89%",
        "--border": "210 16% 89%",
        "--input": "210 16% 89%",
        "--sidebar": "210 22% 96%",
        "--sidebar-foreground": "215 22% 14%",
        "--sidebar-border": "210 14% 87%",
      },
      dark: {
        "--background": "215 18% 9%",
        "--foreground": "210 20% 96%",
        "--card": "215 16% 12%",
        "--card-foreground": "210 18% 95%",
        "--card-border": "215 12% 18%",
        "--muted": "215 12% 13%",
        "--muted-foreground": "215 10% 62%",
        "--secondary": "215 12% 16%",
        "--secondary-foreground": "210 18% 96%",
        "--popover": "215 18% 10%",
        "--popover-foreground": "210 20% 96%",
        "--popover-border": "215 12% 18%",
        "--border": "215 12% 100% / 0.09",
        "--input": "215 12% 18%",
        "--sidebar": "215 18% 8%",
        "--sidebar-foreground": "210 16% 92%",
        "--sidebar-border": "215 12% 16%",
      },
    },
  },
  {
    key: "ink",
    label: "Pure Ink",
    swatch: "hsl(0 0% 0%)",
    swatchLight: "hsl(0 0% 100%)",
    vars: {
      light: {
        "--background": "0 0% 100%",
        "--foreground": "0 0% 4%",
        "--card": "0 0% 100%",
        "--card-foreground": "0 0% 4%",
        "--card-border": "0 0% 90%",
        "--muted": "0 0% 96%",
        "--muted-foreground": "0 0% 40%",
        "--secondary": "0 0% 94%",
        "--secondary-foreground": "0 0% 10%",
        "--popover": "0 0% 100%",
        "--popover-foreground": "0 0% 4%",
        "--popover-border": "0 0% 90%",
        "--border": "0 0% 90%",
        "--input": "0 0% 90%",
        "--sidebar": "0 0% 98%",
        "--sidebar-foreground": "0 0% 10%",
        "--sidebar-border": "0 0% 88%",
      },
      dark: {
        "--background": "0 0% 0%",
        "--foreground": "0 0% 98%",
        "--card": "0 0% 5%",
        "--card-foreground": "0 0% 96%",
        "--card-border": "0 0% 12%",
        "--muted": "0 0% 7%",
        "--muted-foreground": "0 0% 58%",
        "--secondary": "0 0% 12%",
        "--secondary-foreground": "0 0% 96%",
        "--popover": "0 0% 3%",
        "--popover-foreground": "0 0% 98%",
        "--popover-border": "0 0% 14%",
        "--border": "0 0% 100% / 0.08",
        "--input": "0 0% 14%",
        "--sidebar": "0 0% 2%",
        "--sidebar-foreground": "0 0% 94%",
        "--sidebar-border": "0 0% 12%",
      },
    },
  },
  {
    key: "midnight",
    label: "Midnight",
    swatch: "hsl(230 30% 8%)",
    swatchLight: "hsl(230 30% 97%)",
    vars: {
      light: {
        "--background": "230 30% 97%",
        "--foreground": "230 30% 12%",
        "--card": "0 0% 100%",
        "--card-foreground": "230 28% 10%",
        "--card-border": "230 18% 90%",
        "--muted": "230 20% 94%",
        "--muted-foreground": "230 12% 40%",
        "--secondary": "230 18% 93%",
        "--secondary-foreground": "230 25% 14%",
        "--popover": "0 0% 100%",
        "--popover-foreground": "230 30% 12%",
        "--popover-border": "230 18% 90%",
        "--border": "230 18% 90%",
        "--input": "230 18% 90%",
        "--sidebar": "230 25% 96%",
        "--sidebar-foreground": "230 25% 14%",
        "--sidebar-border": "230 16% 88%",
      },
      dark: {
        "--background": "230 30% 7%",
        "--foreground": "230 20% 96%",
        "--card": "230 28% 10%",
        "--card-foreground": "230 18% 95%",
        "--card-border": "230 20% 16%",
        "--muted": "230 22% 12%",
        "--muted-foreground": "230 12% 62%",
        "--secondary": "230 22% 14%",
        "--secondary-foreground": "230 18% 96%",
        "--popover": "230 30% 8%",
        "--popover-foreground": "230 20% 96%",
        "--popover-border": "230 20% 16%",
        "--border": "230 20% 100% / 0.09",
        "--input": "230 20% 16%",
        "--sidebar": "230 32% 6%",
        "--sidebar-foreground": "230 16% 92%",
        "--sidebar-border": "230 20% 14%",
      },
    },
  },
  {
    key: "charcoal",
    label: "Charcoal",
    swatch: "hsl(0 0% 12%)",
    swatchLight: "hsl(0 0% 94%)",
    vars: {
      light: {
        "--background": "0 0% 94%",
        "--foreground": "0 0% 10%",
        "--card": "0 0% 98%",
        "--card-foreground": "0 0% 8%",
        "--card-border": "0 0% 86%",
        "--muted": "0 0% 90%",
        "--muted-foreground": "0 0% 38%",
        "--secondary": "0 0% 88%",
        "--secondary-foreground": "0 0% 12%",
        "--popover": "0 0% 98%",
        "--popover-foreground": "0 0% 10%",
        "--popover-border": "0 0% 86%",
        "--border": "0 0% 86%",
        "--input": "0 0% 86%",
        "--sidebar": "0 0% 92%",
        "--sidebar-foreground": "0 0% 12%",
        "--sidebar-border": "0 0% 84%",
      },
      dark: {
        "--background": "0 0% 12%",
        "--foreground": "0 0% 96%",
        "--card": "0 0% 16%",
        "--card-foreground": "0 0% 95%",
        "--card-border": "0 0% 22%",
        "--muted": "0 0% 18%",
        "--muted-foreground": "0 0% 64%",
        "--secondary": "0 0% 20%",
        "--secondary-foreground": "0 0% 96%",
        "--popover": "0 0% 14%",
        "--popover-foreground": "0 0% 96%",
        "--popover-border": "0 0% 22%",
        "--border": "0 0% 100% / 0.1",
        "--input": "0 0% 22%",
        "--sidebar": "0 0% 10%",
        "--sidebar-foreground": "0 0% 92%",
        "--sidebar-border": "0 0% 18%",
      },
    },
  },
  {
    key: "forest",
    label: "Forest",
    swatch: "hsl(150 18% 8%)",
    swatchLight: "hsl(140 20% 97%)",
    vars: {
      light: {
        "--background": "140 20% 97%",
        "--foreground": "150 25% 12%",
        "--card": "0 0% 100%",
        "--card-foreground": "150 22% 10%",
        "--card-border": "140 14% 88%",
        "--muted": "140 16% 93%",
        "--muted-foreground": "150 10% 38%",
        "--secondary": "140 14% 92%",
        "--secondary-foreground": "150 20% 14%",
        "--popover": "0 0% 100%",
        "--popover-foreground": "150 25% 12%",
        "--popover-border": "140 14% 88%",
        "--border": "140 14% 88%",
        "--input": "140 14% 88%",
        "--sidebar": "140 18% 96%",
        "--sidebar-foreground": "150 20% 14%",
        "--sidebar-border": "140 12% 86%",
      },
      dark: {
        "--background": "150 18% 7%",
        "--foreground": "140 15% 95%",
        "--card": "150 16% 10%",
        "--card-foreground": "140 12% 94%",
        "--card-border": "150 12% 16%",
        "--muted": "150 12% 12%",
        "--muted-foreground": "150 8% 60%",
        "--secondary": "150 12% 14%",
        "--secondary-foreground": "140 12% 95%",
        "--popover": "150 18% 8%",
        "--popover-foreground": "140 15% 95%",
        "--popover-border": "150 12% 16%",
        "--border": "150 12% 100% / 0.09",
        "--input": "150 12% 16%",
        "--sidebar": "150 20% 6%",
        "--sidebar-foreground": "140 12% 92%",
        "--sidebar-border": "150 12% 14%",
      },
    },
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

export function applyAccent(accent: AccentKey, mode: ThemeMode) {
  const preset = ACCENT_PRESETS.find((p) => p.key === accent);
  if (!preset) return;
  const vars = preset.vars[mode];
  const root = document.documentElement;
  for (const [prop, val] of Object.entries(vars)) {
    root.style.setProperty(prop, val);
  }
  localStorage.setItem("spartan_accent", accent);
}

export function applyBackground(bg: BgKey, mode: ThemeMode) {
  const root = document.documentElement;
  root.dataset.bg = bg;
  localStorage.setItem("spartan_bg", bg);

  // Always clear previous surface overrides first
  for (const prop of BG_SURFACE_PROPS) {
    root.style.removeProperty(prop);
  }

  if (bg === "default") return;

  const preset = BG_PRESETS.find((p) => p.key === bg);
  if (!preset) return;
  const vars = preset.vars[mode];
  for (const [prop, val] of Object.entries(vars)) {
    root.style.setProperty(prop, val);
  }
}

export function clearAccentVars() {
  const props = [
    "--primary", "--primary-foreground", "--accent", "--accent-foreground",
    "--ring", "--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-ring",
  ];
  const root = document.documentElement;
  for (const prop of props) root.style.removeProperty(prop);
}

export function clearBackgroundVars() {
  const root = document.documentElement;
  for (const prop of BG_SURFACE_PROPS) root.style.removeProperty(prop);
  delete root.dataset.bg;
}
