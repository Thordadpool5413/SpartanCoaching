import { createContext, useContext, useEffect, useState } from "react";
import {
  type ThemeMode,
  type AccentKey,
  type BgKey,
  getInitialAccent,
  getInitialBackground,
  applyAccent,
  applyBackground,
} from "@/lib/theme";
import { getInitialTheme, applyTheme } from "@/lib/utils";

interface ThemeContextValue {
  mode: ThemeMode;
  accent: AccentKey;
  background: BgKey;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentKey) => void;
  setBackground: (bg: BgKey) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialTheme);
  const [accent, setAccentState] = useState<AccentKey>(getInitialAccent);
  const [background, setBackgroundState] = useState<BgKey>(getInitialBackground);

  useEffect(() => {
    applyTheme(mode);
    applyBackground(background, mode);
    // Accent last so primary tokens win over any shared keys
    applyAccent(accent, mode);
  }, [mode, accent, background]);

  const setMode = (m: ThemeMode) => setModeState(m);
  const setAccent = (a: AccentKey) => setAccentState(a);
  const setBackground = (b: BgKey) => setBackgroundState(b);
  const toggleMode = () => setModeState((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider
      value={{ mode, accent, background, setMode, setAccent, setBackground, toggleMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
