import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import postcss, { type AtRule, type Node, type Rule } from "postcss";
import { routeVisualContracts } from "./routeVisualContracts";
import { isWorkspacePath, requiresAuthenticationPath } from "./workspaceShell";

const srcRoot = path.resolve(import.meta.dirname, "..");
const app = fs.readFileSync(path.join(srcRoot, "App.tsx"), "utf8");
const css = fs.readFileSync(path.join(srcRoot, "index.css"), "utf8");

function appRoutes(): string[] {
  const routes = [...app.matchAll(/<Route\s+path="([^"]*)"/g)].map((match) => match[1]);
  if (/<Route\s+component=\{NotFound\}/.test(app)) routes.push("*");
  return routes;
}

describe("route visual matrix", () => {
  it("inventories every App.tsx route exactly once", () => {
    const actual = appRoutes();
    const inventoried = routeVisualContracts.map((route) => route.path);
    expect(new Set(inventoried).size).toBe(inventoried.length);
    expect(inventoried.sort()).toEqual([...new Set(actual)].sort());
  });

  it("matches runtime workspace and authentication behavior for both session states", () => {
    for (const route of routeVisualContracts) {
      const workspaceCapable = isWorkspacePath(route.path);
      const requiresAuth = requiresAuthenticationPath(route.path);
      expect(route.authenticatedSurface === "workspace").toBe(workspaceCapable);
      expect(route.anonymousSurface === "redirect").toBe(requiresAuth);
      expect(route.auth).toBe(requiresAuth ? "required" : workspaceCapable ? "optional" : "anonymous");
      if (route.authenticatedSurface === "workspace") expect(route.authenticatedTheme).toBe("workspace-user");
      if (route.anonymousSurface === "public") expect(route.anonymousTheme).toMatch(/^(spartan|print)-light$/);
    }
    expect(routeVisualContracts.find((route) => route.path === "/tools")).toMatchObject({
      auth: "optional",
      anonymousSurface: "public",
      authenticatedSurface: "workspace",
    });
    expect(routeVisualContracts.find((route) => route.path === "/tools/objections")).toMatchObject({
      auth: "optional",
      anonymousSurface: "public",
      authenticatedSurface: "workspace",
    });
    expect(routeVisualContracts.find((route) => route.path === "/portal")).toMatchObject({
      auth: "required",
      anonymousSurface: "redirect",
      authenticatedSurface: "workspace",
    });
  });

  it("requires route-surface scoping for workspace visual rules", () => {
    expect(css).toMatch(/html\[data-route-surface="workspace"\]/);
    expect(css).toMatch(/html\[data-route-surface="public"\]/);
  });

  it("allows literal high-visibility colors only for print or brand imagery", () => {
    const violations: string[] = [];
    const root = postcss.parse(css, { from: path.join(srcRoot, "index.css") });

    function ancestors(node: Node): Node[] {
      const result: Node[] = [];
      let parent = node.parent;
      while (parent) {
        result.push(parent);
        parent = parent.parent;
      }
      return result;
    }

    root.walkDecls((declaration) => {
      if (!/^(?:color|background(?:-color)?|border-color)$/i.test(declaration.prop)) return;
      if (!/^(?:#|rgb\()/i.test(declaration.value.trim())) return;
      const parents = ancestors(declaration);
      const inPrint = parents.some(
        (node) =>
          node.type === "atrule" &&
          (node as AtRule).name === "media" &&
          /\bprint\b/.test((node as AtRule).params),
      );
      const selector = parents
        .filter((node) => node.type === "rule")
        .map((node) => (node as Rule).selector)
        .join(" ");
      const allowed = inPrint || /brand|hero|gradient|from-red|print-panel|print-metric/i.test(selector);
      if (!allowed) {
        violations.push(`${declaration.source?.start?.line ?? "?"}: ${declaration.toString()}`);
      }
    });

    expect(violations).toEqual([]);
  });
});