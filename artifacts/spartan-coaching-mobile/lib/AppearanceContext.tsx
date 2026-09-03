import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";

export type AppearancePreference = "system" | "light" | "dark";

type AppearanceContextValue = {
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => Promise<void>;
};

const STORAGE_KEY = "spartan.appearance.preference.v1";

const AppearanceContext = createContext<AppearanceContextValue>({
  preference: "system",
  setPreference: async () => undefined,
});

function applyPreference(preference: AppearancePreference) {
  Appearance.setColorScheme(preference === "system" ? "unspecified" : preference);
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<AppearancePreference>("system");

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!active) return;
      const next: AppearancePreference = stored === "light" || stored === "dark" ? stored : "system";
      setPreferenceState(next);
      applyPreference(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback(async (next: AppearancePreference) => {
    setPreferenceState(next);
    applyPreference(next);
    if (next === "system") await AsyncStorage.removeItem(STORAGE_KEY);
    else await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearancePreference() {
  return useContext(AppearanceContext);
}
