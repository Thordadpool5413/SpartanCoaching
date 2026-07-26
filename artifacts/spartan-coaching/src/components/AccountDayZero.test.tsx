/**
 * Wave 4 — Day Zero ceremony (post-register money moment).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AccountDayZero } from "./AccountDayZero";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/useBillingActions", () => ({
  useBillingActions: () => ({
    startCheckout: vi.fn(),
    openPortal: vi.fn(),
    checkoutPending: false,
    portalPending: false,
  }),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("@workspace/field-kit-catalog", () => ({
  FIELD_KIT_TOOLS: [
    { id: "objections", title: "Objection Handler" },
    { id: "playbooks", title: "Playbook Generator" },
    { id: "weekly-plan", title: "Weekly Plan Builder" },
    { id: "sales-workflow", title: "Sales Command Center" },
    { id: "role-play", title: "Role-Play Practice" },
    { id: "email-templates", title: "Email Templates" },
    { id: "cold-call", title: "Cold Call Script" },
    { id: "research", title: "Grounded Research" },
    { id: "brand-video", title: "Brand Video" },
  ],
}));

afterEach(() => cleanup());

describe("AccountDayZero", () => {
  it("renders three-step unlock path and subscribe CTA for welcome", () => {
    render(<AccountDayZero firstName="Nick" isWelcome />);
    expect(screen.getByTestId("card-account-day-zero")).toBeTruthy();
    expect(screen.getByText(/Welcome, Nick/i)).toBeTruthy();
    expect(screen.getByText(/Step 1/i)).toBeTruthy();
    expect(screen.getByText(/^Subscribe$/i)).toBeTruthy();
    expect(screen.getByTestId("button-day-zero-subscribe")).toBeTruthy();
    expect(screen.getByText(/Preview tools first/i)).toBeTruthy();
    expect(screen.getByText("Run one Objection Handler")).toBeTruthy();
    expect(screen.getByText(/Open Command Center/i)).toBeTruthy();
  });

  it("shows resubscribe framing when expired", () => {
    render(<AccountDayZero firstName="Alex" isExpired isWelcome={false} />);
    expect(
      screen.getByRole("heading", { name: /evaluation window ended/i }),
    ).toBeTruthy();
  });

  it("shows update billing when suspended", () => {
    render(<AccountDayZero isSuspended />);
    expect(screen.getByTestId("button-day-zero-portal")).toBeTruthy();
    expect(screen.getByTestId("button-day-zero-portal").textContent).toMatch(
      /Update billing|Restore access/i,
    );
  });
});
