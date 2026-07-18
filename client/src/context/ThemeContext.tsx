import { createContext, useContext, useEffect, useState } from "react";
import {
  type ThemeMode,
  type AccentKey,
  getInitialAccent,
  applyAccent,
} from "@/lib/theme";
import { getInitialTheme, applyTheme } from "@/lib/utils";

interface ThemeContextValue {
  mode: ThemeMode;
  accent: AccentKey;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentKey) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialTheme);
  const [accent, setAccentState] = useState<AccentKey>(getInitialAccent);

  useEffect(() => {
    applyTheme(mode);
    applyAccent(accent, mode);
  }, [mode, accent]);

  const setMode = (m: ThemeMode) => setModeState(m);
  const setAccent = (a: AccentKey) => setAccentState(a);
  const toggleMode = () => setModeState((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
