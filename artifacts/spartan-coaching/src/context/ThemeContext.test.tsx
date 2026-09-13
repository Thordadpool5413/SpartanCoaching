import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

const appearanceStorage = {
  spartan_theme: JSON.stringify("light"),
  spartan_bg: "warm",
  spartan_accent: "purple",
  spartan_theme_preset: "custom",
  spartan_theme_sync: JSON.stringify({
    mode: "light",
    accent: "purple",
    background: "warm",
    themePreset: "custom",
    t: 123,
  }),
} as const;

function ThemeStateProbe() {
  const { mode, accent, background, themePreset } = useTheme();

  return (
    <output data-testid="theme-state">
      {JSON.stringify({ mode, accent, background, themePreset })}
    </output>
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("ThemeProvider cross-tab appearance sync", () => {
  it("reloads every saved appearance value without writing back to the current tab", () => {
    render(
      <ThemeProvider>
        <ThemeStateProbe />
      </ThemeProvider>,
    );

    const writeBackEvents: Event[] = [];
    const onThemeChange = (event: Event) => writeBackEvents.push(event);
    window.addEventListener("spartan-theme-change", onThemeChange);

    act(() => {
      for (const [key, value] of Object.entries(appearanceStorage)) {
        localStorage.setItem(key, value);
        window.dispatchEvent(new StorageEvent("storage", { key, newValue: value }));
      }
    });

    expect(screen.getByTestId("theme-state").textContent).toBe(
      JSON.stringify({
        mode: "light",
        accent: "purple",
        background: "warm",
        themePreset: "custom",
      }),
    );
    expect(document.documentElement.dataset.themeMode).toBe("light");
    expect(document.documentElement.dataset.accent).toBe("purple");
    expect(document.documentElement.dataset.bg).toBe("warm");
    expect(document.documentElement.dataset.themePreset).toBe("custom");
    expect(writeBackEvents).toHaveLength(0);

    window.removeEventListener("spartan-theme-change", onThemeChange);
  });
});