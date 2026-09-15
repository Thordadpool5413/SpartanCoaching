/**
 * Route-family visual contracts.
 *
 * These are intentionally source-level checks: the failure this task fixes was
 * a valid render with the wrong inherited surface, so a component-only test
 * would not protect the shared boundary.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { applyAppearance } from "./theme";

const srcRoot = path.resolve(import.meta.dirname, "..");
const appearanceStorageKeys = [
  "spartan_theme",
  "spartan_bg",
  "spartan_accent",
  "spartan_theme_preset",
  "spartan_theme_sync",
] as const;

function read(relativePath: string): string {
  return fs.readFileSync(path.join(srcRoot, relativePath), "utf8");
}

function readAppearanceStorage() {
  return Object.fromEntries(
    appearanceStorageKeys.map((key) => [key, localStorage.getItem(key)]),
  );
}

describe("route-family visual contracts", () => {
  it("keeps Resources public styling free of workspace-only token overrides", () => {
    const css = read("index.css");

    expect(css).not.toMatch(
      /\.resources-premium\s*>\s*div:first-of-type,[\s\S]{0,1200}--foreground:\s*0 0% 98%/,
    );
    expect(css).not.toMatch(
      /\.resources-premium\s+\.shadcn-card\s*\{[\s\S]{0,900}--card:\s*221 40% 10%/,
    );
    expect(css).toMatch(/\.field-workspace\s+\.resources-premium\s+>\s*div:first-of-type/);
    expect(css).toMatch(/\.field-workspace\s+\.resources-library-dock/);
  });

  it("declares route-scoped appearance without persisting a route visit", () => {
    const app = read("App.tsx");
    const theme = read("lib/theme.ts");

    expect(app).toMatch(/dataset\.routeSurface/);
    expect(app).toMatch(/applyAppearance\(mode, accent, background, themePreset/);
    expect(app).toMatch(/applyAppearance\("light", "red", "soft", "spartan"/);
    expect(theme).toMatch(/options:\s*\{\s*persist\?: boolean;\s*notify\?: boolean/);
    expect(theme).toMatch(/Route scopes use the same[\s\S]{0,40}renderer/);

    localStorage.clear();
    applyAppearance("dark", "gold", "charcoal", "mamba");
    const savedWorkspaceTheme = localStorage.getItem("spartan_theme_preset");

    applyAppearance("light", "red", "soft", "spartan", {
      persist: false,
      notify: false,
    });

    expect(document.documentElement.dataset.themeMode).toBe("light");
    expect(document.documentElement.dataset.themePreset).toBe("spartan");
    expect(document.documentElement.style.getPropertyValue("--background")).toBe("38 33% 97%");
    expect(localStorage.getItem("spartan_theme_preset")).toBe(savedWorkspaceTheme);
  });

  it("preserves the saved workspace appearance across public and workspace surfaces", () => {
    localStorage.clear();
    applyAppearance("dark", "purple", "midnight", "custom");
    const savedWorkspaceAppearance = readAppearanceStorage();
    const routeThemeEvents: Event[] = [];
    const onRouteThemeChange = (event: Event) => routeThemeEvents.push(event);
    window.addEventListener("spartan-theme-change", onRouteThemeChange);

    applyAppearance("light", "red", "soft", "spartan", {
      persist: false,
      notify: false,
    });

    expect(document.documentElement.dataset.themeMode).toBe("light");
    expect(document.documentElement.dataset.accent).toBe("red");
    expect(document.documentElement.dataset.bg).toBe("soft");
    expect(document.documentElement.dataset.themePreset).toBe("spartan");
    expect(readAppearanceStorage()).toEqual(savedWorkspaceAppearance);
    expect(routeThemeEvents).toHaveLength(0);

    applyAppearance("dark", "purple", "midnight", "custom", {
      persist: false,
      notify: false,
    });

    expect(document.documentElement.dataset.themeMode).toBe("dark");
    expect(document.documentElement.dataset.accent).toBe("purple");
    expect(document.documentElement.dataset.bg).toBe("midnight");
    expect(document.documentElement.dataset.themePreset).toBe("custom");
    expect(readAppearanceStorage()).toEqual(savedWorkspaceAppearance);
    expect(routeThemeEvents).toHaveLength(0);

    window.removeEventListener("spartan-theme-change", onRouteThemeChange);
  });

  it("keeps every major rendered family represented in the route registry", () => {
    const app = read("App.tsx");
    const layout = read("components/Layout.tsx");
    const requiredRoutes = [
      'path="/resources"',
      'path="/resources/weekly-plan"',
      'path="/resources/metrics-dashboard"',
      'path="/portal"',
      'path="/tools"',
      'path="/tools/ai/:toolId"',
      'path="/my-work"',
      'path="/org/admin"',
      'path="/admin/access-desk"',
      'path="/services"',
      'path="/privacy"',
      'path="/legal"',
      'path="/assess/:slug"',
      'path="/assessment/:id/print"',
      'path="/sign/:token"',
      "component={NotFound}",
    ];

    for (const route of requiredRoutes) {
      expect(app, `missing route contract: ${route}`).toContain(route);
    }

    expect(layout).toMatch(/public-site-footer/);
    expect(layout).not.toMatch(/isAuthenticated[\s\S]{0,160}public-site-footer/);
  });
});