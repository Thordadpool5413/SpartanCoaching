import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Tools from "./Tools";
import { FIELD_KIT_TOOLS } from "@/lib/fieldKitCatalog";

const auth = vi.fn();

vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth() }));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/animations", () => ({
  SlideUp: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  StaggerContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  StaggerItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Tools catalog", () => {
  it("renders every shared field-kit item with its catalog route", () => {
    auth.mockReturnValue({ canUseFieldKit: false, isAuthenticated: false, isLoading: false });
    render(<Tools />);
    fireEvent.click(screen.getByTestId("button-show-tools-catalog"));

    for (const tool of FIELD_KIT_TOOLS) {
      expect(document.querySelector(`a[href="${tool.path}"]`)).toBeTruthy();
    }
    expect(screen.getByText(`${FIELD_KIT_TOOLS.length} tools`)).toBeTruthy();
  });
});