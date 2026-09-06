import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, useColorScheme } from "react-native";

export type AppearancePreference = "system" | "light" | "dark" | "mamba";

type AppearanceContextValue = {
  preference: AppearancePreference;
  effectiveScheme: "light" | "dark";
  hydrated: boolean;
  setPreference: (preference: AppearancePreference) => Promise<void>;
};

const STORAGE_KEY = "spartan.appearance.preference.v1";
const CHOICE_KEY = "spartan.appearance.preference.choice.v1";

const AppearanceContext = createContext<AppearanceContextValue>({
  preference: "mamba",
  effectiveScheme: "dark",
  hydrated: false,
  setPreference: async () => undefined,
});

function applyPreference(preference: AppearancePreference) {
  Appearance.setColorScheme(
    preference === "system" ? "unspecified" : preference === "mamba" ? "dark" : preference,
  );
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<AppearancePreference>("mamba");
  const [hydrated, setHydrated] = useState(false);
  const systemScheme = useColorScheme();

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then(async (stored) => {
      if (!active) return;
       const storedPreference: AppearancePreference =
          stored === "light" || stored === "dark" || stored === "mamba" ? stored : "mamba";
       const next: AppearancePreference =
         stored === "system" && (await AsyncStorage.getItem(CHOICE_KEY)) !== "1"
           ? "mamba"
           : storedPreference;
      setPreferenceState(next);
      applyPreference(next);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback(async (next: AppearancePreference) => {
    setPreferenceState(next);
    applyPreference(next);
    await AsyncStorage.setItem(CHOICE_KEY, "1");
    if (next === "system") await AsyncStorage.removeItem(STORAGE_KEY);
    else await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const effectiveScheme: "light" | "dark" =
    preference === "mamba" || preference === "dark"
      ? "dark"
      : preference === "light"
        ? "light"
        : systemScheme === "dark"
          ? "dark"
          : "light";
  const value = useMemo(
    () => ({ preference, effectiveScheme, hydrated, setPreference }),
    [preference, effectiveScheme, hydrated, setPreference],
  );
  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearancePreference() {
  return useContext(AppearanceContext);
}
