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
  applyAppearance,
  modeForBackground,
  getBgPreset,
} from "@/lib/theme";
import { getInitialTheme } from "@/lib/utils";

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
    try {
      const parsed = JSON.parse(raw);
      if (isMode(parsed)) return parsed;
    } catch {
      /* bare */
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

function broadcastTheme(mode: ThemeMode, accent: AccentKey, background: BgKey) {
  try {
    localStorage.setItem(
      "spartan_theme_sync",
      JSON.stringify({ mode, accent, background, t: Date.now() }),
    );
    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel(BROADCAST_CHANNEL);
      ch.postMessage({ mode, accent, background });
      ch.close();
    }
  } catch {
    /* private mode */
  }
}

/** Pick a matching background when user flips Light/Dark mode */
function defaultBgForMode(mode: ThemeMode, current: BgKey): BgKey {
  const cur = getBgPreset(current);
  if (cur.tone === mode) return current;
  return mode === "light" ? "soft" : "default";
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const bg = getInitialBackground();
    // Prefer background tone if user previously picked a light paper etc.
    const bgTone = modeForBackground(bg);
    const saved = getInitialTheme();
    // If bg is light-toned, force light so Soft White actually shows light
    if (bg !== "default" && bgTone !== saved) return bgTone;
    return saved;
  });
  const [accent, setAccentState] = useState<AccentKey>(getInitialAccent);
  const [background, setBackgroundState] = useState<BgKey>(getInitialBackground);

  // Apply on every change — paints html/body immediately
  useEffect(() => {
    applyAppearance(mode, accent, background);
  }, [mode, accent, background]);

  // Apply once on mount before paint settles (belt + suspenders)
  useEffect(() => {
    applyAppearance(mode, accent, background);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const pull = () => {
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
        pull();
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

    const onVisible = () => {
      if (document.visibilityState === "visible") pull();
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
      const nextBg = defaultBgForMode(m, background);
      setModeState(m);
      setBackgroundState(nextBg);
      applyAppearance(m, accent, nextBg);
      broadcastTheme(m, accent, nextBg);
    },
    [accent, background],
  );

  const setAccent = useCallback(
    (a: AccentKey) => {
      setAccentState(a);
      applyAppearance(mode, a, background);
      broadcastTheme(mode, a, background);
    },
    [mode, background],
  );

  const setBackground = useCallback(
    (b: BgKey) => {
      // Absolute background — also flip mode so contrast matches the surface
      const tone = modeForBackground(b);
      setBackgroundState(b);
      setModeState(tone);
      applyAppearance(tone, accent, b);
      broadcastTheme(tone, accent, b);
    },
    [accent],
  );

  const toggleMode = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

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
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Last-resort fallback — still paint from storage so UI is never stuck
    const mode = readModeFromStorage();
    const accent = readAccentFromStorage();
    const background = readBgFromStorage();
    return {
      mode,
      accent,
      background,
      setMode: (m) => {
        const bg = defaultBgForMode(m, background);
        applyAppearance(m, accent, bg);
        broadcastTheme(m, accent, bg);
      },
      setAccent: (a) => {
        applyAppearance(mode, a, background);
        broadcastTheme(mode, a, background);
      },
      setBackground: (b) => {
        const tone = modeForBackground(b);
        applyAppearance(tone, accent, b);
        broadcastTheme(tone, accent, b);
      },
      toggleMode: () => {
        const next: ThemeMode = mode === "dark" ? "light" : "dark";
        const bg = defaultBgForMode(next, background);
        applyAppearance(next, accent, bg);
        broadcastTheme(next, accent, bg);
      },
    };
  }
  return ctx;
}
