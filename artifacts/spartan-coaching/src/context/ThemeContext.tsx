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
  ACCENT_PRESETS,
  BG_PRESETS,
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

const STORAGE_KEYS = {
  mode: "spartan_theme",
  accent: "spartan_accent",
  background: "spartan_bg",
} as const;

const BROADCAST_CHANNEL = "spartan-theme";

function isMode(v: unknown): v is ThemeMode {
  return v === "light" || v === "dark";
}

function isAccent(v: unknown): v is AccentKey {
  return typeof v === "string" && ACCENT_PRESETS.some((p) => p.key === v);
}

function isBg(v: unknown): v is BgKey {
  return typeof v === "string" && BG_PRESETS.some((p) => p.key === v);
}

function readModeFromStorage(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.mode);
    if (!raw) return getInitialTheme();
    // LS helper JSON-encodes; also accept bare values
    try {
      const parsed = JSON.parse(raw);
      if (isMode(parsed)) return parsed;
    } catch {
      /* bare string */
    }
    if (isMode(raw)) return raw;
  } catch {
    /* ignore */
  }
  return getInitialTheme();
}

function readAccentFromStorage(): AccentKey {
  return getInitialAccent();
}

function readBgFromStorage(): BgKey {
  return getInitialBackground();
}

function applyAll(mode: ThemeMode, accent: AccentKey, background: BgKey) {
  applyTheme(mode);
  applyBackground(background, mode);
  applyAccent(accent, mode);
  // Mark root so CSS / debug tools can see active prefs
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.dataset.themeMode = mode;
    root.dataset.accent = accent;
    root.dataset.bg = background;
  }
}

function broadcastTheme(mode: ThemeMode, accent: AccentKey, background: BgKey) {
  try {
    const payload = JSON.stringify({ mode, accent, background, t: Date.now() });
    localStorage.setItem("spartan_theme_sync", payload);
    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel(BROADCAST_CHANNEL);
      ch.postMessage({ mode, accent, background });
      ch.close();
    }
  } catch {
    /* private mode / quota */
  }
}

/**
 * Module-level fallback used when context is missing (Vite HMR can briefly
 * desync Provider vs consumer module instances on Replit). Still applies
 * theme tokens so the UI never hard-crashes.
 */
function buildFallbackApi(): ThemeContextValue {
  return {
    get mode() {
      return readModeFromStorage();
    },
    get accent() {
      return readAccentFromStorage();
    },
    get background() {
      return readBgFromStorage();
    },
    setMode(m: ThemeMode) {
      applyAll(m, readAccentFromStorage(), readBgFromStorage());
      broadcastTheme(m, readAccentFromStorage(), readBgFromStorage());
    },
    setAccent(a: AccentKey) {
      const mode = readModeFromStorage();
      applyAll(mode, a, readBgFromStorage());
      broadcastTheme(mode, a, readBgFromStorage());
    },
    setBackground(b: BgKey) {
      const mode = readModeFromStorage();
      applyAll(mode, readAccentFromStorage(), b);
      broadcastTheme(mode, readAccentFromStorage(), b);
    },
    toggleMode() {
      const next: ThemeMode = readModeFromStorage() === "dark" ? "light" : "dark";
      applyAll(next, readAccentFromStorage(), readBgFromStorage());
      broadcastTheme(next, readAccentFromStorage(), readBgFromStorage());
    },
  };
}

const fallbackApi = buildFallbackApi();

const ThemeContext = createContext<ThemeContextValue>(fallbackApi);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialTheme);
  const [accent, setAccentState] = useState<AccentKey>(getInitialAccent);
  const [background, setBackgroundState] = useState<BgKey>(getInitialBackground);

  // Apply tokens whenever prefs change
  useEffect(() => {
    applyAll(mode, accent, background);
  }, [mode, accent, background]);

  // Cross-tab + same-origin sync (other browser tabs, iframes)
  useEffect(() => {
    const pullFromStorage = () => {
      const nextMode = readModeFromStorage();
      const nextAccent = readAccentFromStorage();
      const nextBg = readBgFromStorage();
      setModeState((m) => (m !== nextMode ? nextMode : m));
      setAccentState((a) => (a !== nextAccent ? nextAccent : a));
      setBackgroundState((b) => (b !== nextBg ? nextBg : b));
    };

    const onStorage = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === STORAGE_KEYS.mode ||
        e.key === STORAGE_KEYS.accent ||
        e.key === STORAGE_KEYS.background ||
        e.key === "spartan_theme_sync"
      ) {
        pullFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);

    let ch: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      ch = new BroadcastChannel(BROADCAST_CHANNEL);
      ch.onmessage = (ev) => {
        const data = ev?.data;
        if (!data || typeof data !== "object") return;
        if (isMode(data.mode)) setModeState(data.mode);
        if (isAccent(data.accent)) setAccentState(data.accent);
        if (isBg(data.background)) setBackgroundState(data.background);
      };
    }

    // Re-apply when tab becomes visible (covers bfcache / multi-tab drift)
    const onVisible = () => {
      if (document.visibilityState === "visible") pullFromStorage();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      ch?.close();
    };
  }, []);

  const setMode = useCallback(
    (m: ThemeMode) => {
      setModeState(m);
      // Apply + broadcast immediately so every open tab/page sees tokens now
      applyAll(m, accent, background);
      broadcastTheme(m, accent, background);
    },
    [accent, background],
  );

  const setAccent = useCallback(
    (a: AccentKey) => {
      setAccentState(a);
      applyAll(mode, a, background);
      broadcastTheme(mode, a, background);
    },
    [mode, background],
  );

  const setBackground = useCallback(
    (b: BgKey) => {
      setBackgroundState(b);
      applyAll(mode, accent, b);
      broadcastTheme(mode, accent, b);
    },
    [mode, accent],
  );

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      applyAll(next, accent, background);
      broadcastTheme(next, accent, background);
      return next;
    });
  }, [accent, background]);

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
