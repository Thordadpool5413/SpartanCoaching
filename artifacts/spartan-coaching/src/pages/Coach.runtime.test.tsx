import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Coach from "./Coach";

vi.mock("wouter", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/MarkdownContent", () => ({
  MarkdownContent: ({ content }: { content: string }) => <p>{content}</p>,
}));

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response;
}

describe("Spartan Coach live response rendering", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => "40000000-0000-4000-8000-000000000001" });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(() => ({ animation: "started" })),
    });
    fetchMock.mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === "/api/v1/coach/conversations/c1/messages" && init?.method === "POST") {
        return jsonResponse({
          message: {
            id: "m2",
            role: "assistant",
            content: "Acknowledge the concern, then ask what readiness would look like.",
            createdAt: "2026-08-28T19:00:05.000Z",
          },
        });
      }
      if (path === "/api/v1/coach/conversations/c1") {
        return jsonResponse({
          conversation: { id: "c1", title: "Objection practice", createdAt: "2026-08-28T19:00:00.000Z", updatedAt: "2026-08-28T19:00:00.000Z" },
          messages: [],
        });
      }
      if (path === "/api/v1/coach/conversations") {
        return jsonResponse({
          conversations: [{ id: "c1", title: "Objection practice", createdAt: "2026-08-28T19:00:00.000Z", updatedAt: "2026-08-28T19:00:05.000Z" }],
        });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
  });

  afterEach(() => {
    cleanup();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  it("keeps the route mounted when an optimistic message is replaced by the AI response", async () => {
    render(<Coach />);
    const input = await screen.findByLabelText("Message Spartan Coach");
    fireEvent.change(input, { target: { value: "Help me respond to a family readiness objection." } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/acknowledge the concern/i)).toBeTruthy();
    });
    expect(screen.getByTestId("page-coach")).toBeTruthy();
  });
});
