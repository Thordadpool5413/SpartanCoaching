export type ThemeMode = "light" | "dark";
export type AccentKey = "red" | "blue" | "green" | "gold" | "purple" | "slate";

export interface AccentPreset {
  key: AccentKey;
  label: string;
  swatch: string;
  vars: {
    light: Record<string, string>;
    dark: Record<string, string>;
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

export function getInitialAccent(): AccentKey {
  if (typeof window === "undefined") return "red";
  const saved = localStorage.getItem("spartan_accent");
  if (saved && ACCENT_PRESETS.some((p) => p.key === saved)) return saved as AccentKey;
  return "red";
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

export function clearAccentVars() {
  const props = [
    "--primary", "--primary-foreground", "--accent", "--accent-foreground",
    "--ring", "--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-ring",
  ];
  const root = document.documentElement;
  for (const prop of props) root.style.removeProperty(prop);
}
