import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

/**
 * Module-level fallback used when context is missing (Vite HMR can briefly
 * desync Provider vs consumer module instances on Replit). Still applies
 * theme tokens so the UI never hard-crashes.
 */
function buildFallbackApi(): ThemeContextValue {
  const readMode = (): ThemeMode => getInitialTheme();
  const readAccent = (): AccentKey => getInitialAccent();
  const readBg = (): BgKey => getInitialBackground();

  return {
    get mode() {
      return readMode();
    },
    get accent() {
      return readAccent();
    },
    get background() {
      return readBg();
    },
    setMode(m: ThemeMode) {
      applyTheme(m);
      applyBackground(readBg(), m);
      applyAccent(readAccent(), m);
    },
    setAccent(a: AccentKey) {
      const mode = readMode();
      applyAccent(a, mode);
    },
    setBackground(b: BgKey) {
      const mode = readMode();
      applyBackground(b, mode);
      applyAccent(readAccent(), mode);
    },
    toggleMode() {
      const next: ThemeMode = readMode() === "dark" ? "light" : "dark";
      applyTheme(next);
      applyBackground(readBg(), next);
      applyAccent(readAccent(), next);
    },
  };
}

const fallbackApi = buildFallbackApi();

const ThemeContext = createContext<ThemeContextValue>(fallbackApi);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialTheme);
  const [accent, setAccentState] = useState<AccentKey>(getInitialAccent);
  const [background, setBackgroundState] = useState<BgKey>(getInitialBackground);

  useEffect(() => {
    applyTheme(mode);
    applyBackground(background, mode);
    // Accent last so primary tokens win over any shared keys
    applyAccent(accent, mode);
  }, [mode, accent, background]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const setAccent = useCallback((a: AccentKey) => setAccentState(a), []);
  const setBackground = useCallback((b: BgKey) => setBackgroundState(b), []);
  const toggleMode = useCallback(
    () => setModeState((prev) => (prev === "dark" ? "light" : "dark")),
    [],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      accent,
      background,
      setMode,
      setAccent,
      setBackground,
      toggleMode,
    }),
    [mode, accent, background, setMode, setAccent, setBackground, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
