import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AiToolsHub from "./AiToolsHub";

const mockUseAuth = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("wouter", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/FieldKitToolLayout", () => ({
  FieldKitToolLayout: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

vi.mock("@/components/SEO", () => ({ SEO: () => null }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AI tools catalog access states", () => {
  it("lets preview users open every tool instead of rendering dead cards", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      canUseFieldKit: false,
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<AiToolsHub />);

    await waitFor(() => {
      expect(
        screen
          .getByRole("link", { name: /Content Categorizer/i })
          .getAttribute("href"),
      ).toBe(
        "/tools/ai/content-categorizer",
      );
    });
    expect(screen.getAllByText("Preview · sign in to run")).toHaveLength(14);
  });

  it("keeps explicitly disabled tools locked for active members", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      canUseFieldKit: true,
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          tools: [
            {
              id: "content-categorizer",
              availability: { enabled: false },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    render(<AiToolsHub />);

    await waitFor(() => {
      expect(screen.getByText("Content Categorizer")).toBeTruthy();
    });
    expect(screen.queryByRole("link", { name: /Content Categorizer/i })).toBeNull();
    expect(screen.getByText("Not enabled")).toBeTruthy();
  });
});
