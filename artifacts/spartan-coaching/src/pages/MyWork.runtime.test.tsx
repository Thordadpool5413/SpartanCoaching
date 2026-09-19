import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MyWork from "./MyWork";

const { loadMemberWork } = vi.hoisted(() => ({ loadMemberWork: vi.fn() }));
vi.mock("@/lib/memberWorkClient", () => ({ loadMemberWork }));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/StateBlock", () => ({
  StateBlock: ({ title, action }: { title: string; action?: { label: string; onClick?: () => void } }) => (
    <div><span>{title}</span>{action?.onClick ? <button onClick={action.onClick}>{action.label}</button> : null}</div>
  ),
}));
vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
const fail = () => Promise.resolve(new Response("unavailable", { status: 503 }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("My Work runtime continuity", () => {
  it("keeps available sections visible when one sync source fails and routes saved work", async () => {
    loadMemberWork.mockResolvedValue([]);
    vi.stubGlobal("fetch", vi.fn((url: string) => {
      if (url.includes("member-sync")) return ok({ records: [{
        recordType: "tool_result", recordId: "objection", payload: { result: "Saved objection" },
        clientUpdatedAt: "2026-09-01T12:00:00Z", updatedAt: "2026-09-01T12:00:00Z", isDeleted: false,
      }] });
      if (url.includes("resource-work")) return fail();
      throw new Error(`unexpected ${url}`);
    }));
    render(<MyWork />);
    await waitFor(() => expect(screen.getByTestId("my-work-partial-warning")).toBeTruthy());
    await waitFor(() => expect(document.querySelector('a[href="/tools/objections"]')).toBeTruthy());
  });

  it("shows a retryable session-expiry failure when all sources reject", async () => {
    loadMemberWork.mockRejectedValue(new Error("Session expired"));
    vi.stubGlobal("fetch", vi.fn(() => fail()));
    render(<MyWork />);
    await waitFor(() => expect(screen.getByText("My Work is temporarily unavailable")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(3));
  });
});