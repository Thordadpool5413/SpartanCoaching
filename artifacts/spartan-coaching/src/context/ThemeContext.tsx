import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  type ThemeMode,
  type AccentKey,
  type BgKey,
  ACCENT_PRESETS,
  BG_PRESETS,
  getInitialAccent,
  getInitialBackground,
  getInitialMode,
  applyAppearance,
  modeForBackground,
  defaultBgForMode,
} from "@/lib/theme";

interface ThemeState {
  mode: ThemeMode;
  accent: AccentKey;
  background: BgKey;
}

interface ThemeContextValue extends ThemeState {
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentKey) => void;
  setBackground: (bg: BgKey) => void;
  toggleMode: () => void;
}

/** Module store — single source of truth so clicks always work, even if React context hiccups */
let store: ThemeState = {
  mode: "dark",
  accent: "red",
  background: "default",
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ThemeState {
  return store;
}

function commit(next: ThemeState) {
  store = next;
  applyAppearance(next.mode, next.accent, next.background);
  emit();
}

function initStoreFromStorage() {
  if (typeof window === "undefined") return;
  const background = getInitialBackground();
  const accent = getInitialAccent();
  const mode = getInitialMode();
  store = { mode, accent, background };
  applyAppearance(mode, accent, background);
}

// Initialize as soon as this module loads in the browser
if (typeof window !== "undefined") {
  initStoreFromStorage();
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // useSyncExternalStore keeps every consumer in lockstep with the module store
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    // Re-apply on mount (covers hydration / late body)
    applyAppearance(store.mode, store.accent, store.background);

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const next: ThemeState = {
        mode: detail.mode ?? store.mode,
        accent: detail.accent ?? store.accent,
        background: detail.background ?? store.background,
      };
      // Only sync state if something external changed (avoid loops)
      if (
        next.mode !== store.mode ||
        next.accent !== store.accent ||
        next.background !== store.background
      ) {
        store = next;
        emit();
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "spartan_theme" ||
        e.key === "spartan_bg" ||
        e.key === "spartan_accent" ||
        e.key === "spartan_theme_sync"
      ) {
        initStoreFromStorage();
        emit();
      }
    };

    window.addEventListener("spartan-theme-change", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("spartan-theme-change", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setMode = useCallback((mode: ThemeMode) => {
    const background = defaultBgForMode(mode, store.background);
    commit({ mode, accent: store.accent, background });
  }, []);

  const setAccent = useCallback((accent: AccentKey) => {
    commit({ mode: store.mode, accent, background: store.background });
  }, []);

  const setBackground = useCallback((background: BgKey) => {
    const mode = modeForBackground(background);
    commit({ mode, accent: store.accent, background });
  }, []);

  const toggleMode = useCallback(() => {
    setMode(store.mode === "dark" ? "light" : "dark");
  }, [setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...state,
      setMode,
      setAccent,
      setBackground,
      toggleMode,
    }),
    [state, setMode, setAccent, setBackground, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  // Always prefer live store so UI never goes stale
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setMode = useCallback((mode: ThemeMode) => {
    const background = defaultBgForMode(mode, store.background);
    commit({ mode, accent: store.accent, background });
  }, []);

  const setAccent = useCallback((accent: AccentKey) => {
    commit({ mode: store.mode, accent, background: store.background });
  }, []);

  const setBackground = useCallback((background: BgKey) => {
    const mode = modeForBackground(background);
    commit({ mode, accent: store.accent, background });
  }, []);

  const toggleMode = useCallback(() => {
    setMode(store.mode === "dark" ? "light" : "dark");
  }, [setMode]);

  // Merge context (if any) with store-backed setters that always work
  return {
    mode: state.mode,
    accent: state.accent,
    background: state.background,
    setMode: ctx?.setMode ?? setMode,
    setAccent: ctx?.setAccent ?? setAccent,
    setBackground: ctx?.setBackground ?? setBackground,
    toggleMode: ctx?.toggleMode ?? toggleMode,
  };
}

// Re-export for convenience
export { ACCENT_PRESETS, BG_PRESETS };
