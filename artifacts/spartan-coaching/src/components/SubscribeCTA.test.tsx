/**
 * Wave 4 — conversion CTA state matrix (happy-path unit tests).
 * Register → Subscribe → Open Field Kit must never show false free-trial copy.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SubscribeCTA } from "./SubscribeCTA";

const mockUseAuth = vi.fn();
const mockStartCheckout = vi.fn();
const mockOpenPortal = vi.fn();

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/useBillingActions", () => ({
  useBillingActions: () => ({
    startCheckout: mockStartCheckout,
    openPortal: mockOpenPortal,
    checkoutPending: false,
    portalPending: false,
  }),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SubscribeCTA — state matrix", () => {
  it("logged out: Create account to subscribe (not free trial)", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      canUseFieldKit: false,
      organization: null,
      member: null,
      fieldKit: null,
    });
    render(<SubscribeCTA surface="field_kit_why" showPreview testId="cta" />);
    expect(screen.getByText(/Create account to subscribe/i)).toBeTruthy();
    expect(screen.queryByText(/free trial/i)).toBeNull();
    expect(screen.getByText(/Preview tools/i)).toBeTruthy();
    expect(screen.getByText(/Sign in/i)).toBeTruthy();
  });

  it("can subscribe personal: Subscribe · $14.99/wk", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      canUseFieldKit: false,
      organization: {
        type: "personal",
        status: "expired",
        billingPlan: null,
        hasStripeSubscription: false,
        billingStatus: null,
      },
      member: { role: "org_admin" },
      fieldKit: { allowed: false, reason: "expired" },
    });
    render(<SubscribeCTA surface="account" testId="cta" />);
    expect(screen.getByText(/Resubscribe · \$14\.99\/wk|Subscribe · \$14\.99\/wk/i)).toBeTruthy();
  });

  it("active member: Open Field Kit", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      canUseFieldKit: true,
      organization: {
        type: "personal",
        status: "active",
        billingPlan: "individual_weekly",
        hasStripeSubscription: true,
        billingStatus: "active",
      },
      member: { role: "member" },
      fieldKit: { allowed: true },
    });
    render(<SubscribeCTA surface="field_kit_hero" testId="cta" />);
    expect(screen.getByText(/Open Field Kit/i)).toBeTruthy();
    expect(screen.queryByText(/Subscribe · \$14\.99/i)).toBeNull();
  });

  it("company org: Request team access (no fake individual checkout)", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      canUseFieldKit: false,
      organization: { type: "company", status: "expired" },
      member: { role: "org_admin" },
      fieldKit: { allowed: false, reason: "expired" },
    });
    render(<SubscribeCTA surface="other" testId="cta" />);
    expect(screen.getByText(/Request team access/i)).toBeTruthy();
  });
});
