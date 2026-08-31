import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageLoadingState, RouteErrorBoundary } from "./RouteRecovery";

function BrokenRoute(): never {
  throw new Error("Route chunk failed");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("route recovery states", () => {
  it("announces page loading accessibly", () => {
    render(<PageLoadingState label="Checking secure access" />);

    expect(screen.getByRole("status").getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Checking secure access")).toBeTruthy();
  });

  it("shows a safe recovery state and clears it after navigation", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const view = render(
      <RouteErrorBoundary resetKey="/broken">
        <BrokenRoute />
      </RouteErrorBoundary>,
    );

    expect(screen.getByRole("alert").textContent).toContain("We could not load this page");
    expect(screen.getByRole("link", { name: "Go to homepage" }).getAttribute("href")).toBe("/");

    view.rerender(
      <RouteErrorBoundary resetKey="/recovered">
        <p>Recovered route</p>
      </RouteErrorBoundary>,
    );

    expect(screen.getByText("Recovered route")).toBeTruthy();
  });
});