import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SalesWorkflow from "./SalesWorkflow";

const auth = vi.fn();
vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth() }));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/FieldKitToolLayout", () => ({
  FieldKitToolLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/ToolAnatomy", () => ({ ToolAnatomyRelated: () => null }));
vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("@workspace/hospice-sales-runtime/sales-workflow/http-client", () => ({
  createWorkflowHttpClient: () => ({}),
}));
vi.mock("@workspace/hospice-sales-runtime/sales-workflow/react", () => ({
  SalesWorkflowPanel: ({ actor }: { actor: { role: string } }) => (
    <div data-testid="live-workflow-panel">Live workflow for {actor.role}</div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Sales Command Center access states", () => {
  it("shows an explicit loading state while authentication resolves", () => {
    auth.mockReturnValue({ member: null, isLoading: true, isAuthenticated: false });
    render(<SalesWorkflow />);
    expect(screen.getByTestId("command-loading")).toBeTruthy();
  });

  it("keeps an unauthenticated visitor in a useful preview shell", () => {
    auth.mockReturnValue({ member: null, isLoading: false, isAuthenticated: false });
    render(<SalesWorkflow />);
    expect(screen.getByTestId("command-preview-shell")).toBeTruthy();
    expect(screen.getByRole("link", { name: /sign in to run live/i }).getAttribute("href")).toBe("/login");
    expect(screen.queryByTestId("live-workflow-panel")).toBeNull();
  });

  it("mounts the live panel with manager ownership for administrators", () => {
    auth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      member: { id: 7, organizationId: 3, role: "org_admin" },
    });
    render(<SalesWorkflow />);
    expect(screen.getByTestId("live-workflow-panel").textContent).toContain("manager");
  });
});