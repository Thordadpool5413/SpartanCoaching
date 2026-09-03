import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { FieldBriefExperience } from "./FieldBriefExperience";

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

const trackPublicFunnelEvent = vi.fn();

vi.mock("@/lib/publicFunnel", () => ({
  PUBLIC_FUNNEL_EVENT: {
    ctaClick: "cta_click",
    toolPreviewStart: "tool_preview_start",
  },
  trackPublicFunnelEvent: (...args: unknown[]) => trackPublicFunnelEvent(...args),
}));

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
  trackPublicFunnelEvent.mockClear();
});

describe("FieldBriefExperience", () => {
  it("recommends a role-specific path without collecting visitor data", () => {
    render(<FieldBriefExperience />);

    expect(screen.getByTestId("section-field-brief")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /prepared conversations are built/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /preview the field system/i }).getAttribute("href")).toBe(
      "#field-brief-tour",
    );

    fireEvent.click(screen.getByTestId("pathfinder-option-team"));

    expect(screen.getByText(/recommended path · consulting or evaluation/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /book a strategy call/i }).getAttribute("href")).toBe("/contact");
    expect(trackPublicFunnelEvent).toHaveBeenCalledWith("cta_click", "home:pathfinder_select_team");
  });

  it("keeps the product tour read-only and exposes all four workflow steps", () => {
    render(<FieldBriefExperience />);

    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(screen.getByRole("tabpanel", { name: /prepare workflow preview/i })).toBeTruthy();
    const prepareArtifact = screen.getByTestId("field-brief-artifact-prepare");
    expect(prepareArtifact).toBeTruthy();
    expect(within(prepareArtifact).getByText(/maple ridge medical group/i)).toBeTruthy();

    fireEvent.click(screen.getByTestId("field-brief-tab-review"));

    expect(screen.getByRole("tabpanel", { name: /review workflow preview/i })).toBeTruthy();
    const reviewArtifact = screen.getByTestId("field-brief-artifact-review");
    expect(reviewArtifact).toBeTruthy();
    expect(within(reviewArtifact).getByText(/a door opened/i)).toBeTruthy();
    expect(screen.getByText(/record the learning and put the next conversation on the calendar/i)).toBeTruthy();
    expect(screen.getByText(/do not enter phi/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /open the tool preview/i }).getAttribute("href")).toBe(
      "/tools/sales-workflow",
    );
  });

  it("hydrates the pathfinder from a role deep link and preserves the selection in the URL", () => {
    window.history.replaceState(null, "", "/?role=combined");

    render(<FieldBriefExperience />);

    expect(screen.getByTestId("pathfinder-option-combined").getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByTestId("pathfinder-option-field"));

    expect(window.location.search).toBe("?role=field");
    expect(window.location.hash).toBe("#field-brief");
  });
});