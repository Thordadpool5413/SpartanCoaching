import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToolResultActions } from "./ToolResultActions";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("ToolResultActions", () => {
  it("renders a clear next-tool destination and an honest persistence boundary", () => {
    render(
      <ToolResultActions
        toolId="cold-call"
        description="Rehearse the opening before you dial."
        persistenceNote="This result is not automatically saved or synced."
        actions={[
          {
            id: "practice-opening",
            label: "Practice Opening in Role-Play",
            href: "/tools/role-play",
          },
        ]}
      />,
    );

    const action = screen.getByTestId("tool-result-actions-practice-opening");
    expect(action.tagName).toBe("A");
    expect(action.getAttribute("href")).toBe("/tools/role-play");
    expect(screen.getByText(/not automatically saved or synced/i)).toBeTruthy();
  });

  it("tracks only safe tool and action identifiers when a member chooses a next action", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const onClick = vi.fn();

    render(
      <ToolResultActions
        toolId="email-templates"
        actions={[{ id: "send", label: "Send this email", onClick }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /send this email/i }));
    expect(onClick).toHaveBeenCalledOnce();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const request = fetchMock.mock.calls[0][1];
    expect(request.body).toContain("next_action_confirmation");
    const payload = JSON.parse(request.body);
    const metadata = JSON.parse(payload.metadata);
    expect(metadata).toMatchObject({
      toolId: "email-templates",
      platform: "web",
      stepId: "send",
    });
    expect(request.body).not.toContain("recipient@example.com");
  });

  it("shows unavailable actions as disabled instead of sending a member into a dead end", () => {
    render(
      <ToolResultActions
        toolId="email-templates"
        actions={[
          {
            id: "send",
            label: "Send this email",
            disabled: true,
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: /send this email/i })).toHaveProperty(
      "disabled",
      true,
    );
  });
});