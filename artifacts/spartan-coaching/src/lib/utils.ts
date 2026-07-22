import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Local storage helper
export const LS = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set(key: string, value: unknown): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing from localStorage:", error);
    }
  },
};

// Theme management (mode only — full appearance lives in lib/theme.ts)
export function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  try {
    const raw = localStorage.getItem("spartan_theme");
    if (!raw) return "dark";
    try {
      const parsed = JSON.parse(raw);
      if (parsed === "light" || parsed === "dark") return parsed;
    } catch {
      if (raw === "light" || raw === "dark") return raw;
    }
    // LS helper may have stored JSON string
    const viaLs = LS.get<string>("spartan_theme", "");
    if (viaLs === "light" || viaLs === "dark") return viaLs;
  } catch {
    /* ignore */
  }
  return "dark";
}

export function applyTheme(theme: "light" | "dark") {
  LS.set("spartan_theme", theme);
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.themeMode = theme;
  root.style.colorScheme = theme;
}

// Audio playback helper
export async function playAudio(audioData: ArrayBuffer, sampleRate: number = 24000): Promise<void> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(audioData);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
  
  return new Promise((resolve) => {
    source.onended = () => {
      resolve();
    };
  });
}

// Debounce helper
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
