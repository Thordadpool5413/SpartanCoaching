/**
 * Tests for the billing card in the Account screen.
 * Covers the cancel-at-period-end edge case: "Access until <date>" should appear
 * instead of "Renews <date>", and the "Manage billing / cancel" button should still
 * be visible so the user can reverse the cancel.
 */
import React from "react";
import { render, waitFor, cleanup, act } from "@testing-library/react-native";

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that pull in these paths
// ---------------------------------------------------------------------------

const mockFetchBillingStatus = jest.fn();
const mockFetchOnboardingMobile = jest.fn();
const mockStartIndividualCheckout = jest.fn();
const mockOpenBillingPortal = jest.fn();

jest.mock("@/lib/api", () => ({
  fetchBillingStatus: (...args: unknown[]) => mockFetchBillingStatus(...args),
  fetchAppleBillingConfig: jest.fn().mockResolvedValue({
    configured: true,
    appAccountToken: "65b35d18-1d82-4f4f-9d3d-bf81f82a32fb",
    products: [],
  }),
  verifyAppleTransaction: jest.fn().mockResolvedValue({ applied: true, active: true }),
  fetchOnboardingMobile: (...args: unknown[]) => mockFetchOnboardingMobile(...args),
  startIndividualCheckout: (...args: unknown[]) => mockStartIndividualCheckout(...args),
  openBillingPortal: (...args: unknown[]) => mockOpenBillingPortal(...args),
  updateOnboardingMobile: jest.fn().mockResolvedValue({ member: {} }),
  fetchValueReceipt: jest.fn().mockResolvedValue({
    days: 7,
    since: new Date().toISOString(),
    checklistDone: 0,
    totalEvents: 0,
    events: [],
    highlights: ["No tracked activity yet"],
  }),
  getWebSiteUrl: () => "https://spartancoaching.com",
}));

const mockUser = {
  member: {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    role: "member",
    organizationId: 10,
    status: "active",
  },
  organization: {
    id: 10,
    name: "Acme Hospice",
    type: "personal",
    seatLimit: 1,
    status: "active",
    billingPlan: "individual",
    billingStatus: "active",
    currentPeriodEnd: "2026-08-15T00:00:00.000Z",
    cancelAtPeriodEnd: true,
    hasStripeCustomer: true,
    hasStripeSubscription: true,
  },
  fieldKit: { allowed: true, reason: null, hoursRemaining: null },
};

const mockRefresh = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
    canUseFieldKit: true,
    logout: jest.fn(),
    refresh: mockRefresh,
  }),
}));

jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    background: "#000",
    foreground: "#fff",
    primary: "#e8291e",
    mutedForeground: "#888",
    card: "#111",
    border: "#333",
  }),
}));

jest.mock("@/hooks/useAccessibilityPrefs", () => ({
  useAccessibilityPrefs: () => ({ reduceMotion: true }),
}));

jest.mock("@/lib/onboarding", () => ({
  formatTrialRemaining: () => null,
  isChecklistDone: () => false,
  visibleChecklist: () => [],
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// useFocusEffect must call its callback immediately so state updates run in tests
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useFocusEffect: (cb: () => void | (() => void)) => {
    // require is allowed inside jest.mock factories; React is not in scope here
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useEffect } = require("react") as typeof import("react");
    useEffect(cb, []);
  },
}));

jest.mock("@expo/vector-icons", () => ({
  Feather: () => null,
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Success: "success" },
}));

jest.mock("@/lib/analytics", () => ({
  trackMobileEvent: jest.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Import the component under test AFTER mocks are set up
// ---------------------------------------------------------------------------
import AccountScreen from "../app/(tabs)/account";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Billing response that represents an active subscription being canceled at period end. */
function makeBillingCanceling(periodEnd: string) {
  return {
    configured: true,
    individualWeeklyPriceConfigured: true,
    canCheckoutIndividual: false,
    canOpenPortal: true,
    organization: {
      id: 10,
      type: "personal",
      status: "active",
      billingPlan: "individual",
      billingStatus: "active",
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: true,
      hasStripeCustomer: true,
      hasStripeSubscription: true,
      billableSeats: null,
      seatLimit: 1,
      contractRef: null,
    },
  };
}

/** Billing response that represents a normally-renewing active subscription. */
function makeBillingRenewing(periodEnd: string) {
  return {
    configured: true,
    individualWeeklyPriceConfigured: true,
    canCheckoutIndividual: false,
    canOpenPortal: true,
    organization: {
      id: 10,
      type: "personal",
      status: "active",
      billingPlan: "individual",
      billingStatus: "active",
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      hasStripeCustomer: true,
      hasStripeSubscription: true,
      billableSeats: null,
      seatLimit: 1,
      contractRef: null,
    },
  };
}

const PERIOD_END = "2026-08-15T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Account screen billing card — cancel-at-period-end", () => {
  beforeEach(() => {
    mockFetchOnboardingMobile.mockResolvedValue({
      member: { ...mockUser.member, checklistProgress: {} },
    });
  });

  it('shows "Access until" date when cancelAtPeriodEnd is true', async () => {
    mockFetchBillingStatus.mockResolvedValue(makeBillingCanceling(PERIOD_END));

    const { queryByText, getByText } = render(<AccountScreen />);

    await waitFor(() => {
      // Billing must have loaded (loading indicator gone)
      const expectedDate = new Date(PERIOD_END).toLocaleDateString();
      const dateLabel = getByText(`Access until ${expectedDate}`);
      expect(dateLabel).toBeTruthy();
    });

    // Must NOT show "Renews" when canceling
    expect(queryByText(/^Renews /)).toBeNull();
  });

  it('shows "Renews" date when cancelAtPeriodEnd is false', async () => {
    mockFetchBillingStatus.mockResolvedValue(makeBillingRenewing(PERIOD_END));

    const { queryByText, getByText } = render(<AccountScreen />);

    await waitFor(() => {
      const expectedDate = new Date(PERIOD_END).toLocaleDateString();
      const dateLabel = getByText(`Renews ${expectedDate}`);
      expect(dateLabel).toBeTruthy();
    });

    expect(queryByText(/^Access until /)).toBeNull();
  });

  it('still shows "Manage billing / cancel" button when subscription is canceling', async () => {
    mockFetchBillingStatus.mockResolvedValue(makeBillingCanceling(PERIOD_END));

    const { getByTestId } = render(<AccountScreen />);

    await waitFor(() => {
      const btn = getByTestId("button-manage-billing");
      expect(btn).toBeTruthy();
    });
  });

  it('shows canceling status chip when cancelAtPeriodEnd is true', async () => {
    mockFetchBillingStatus.mockResolvedValue(makeBillingCanceling(PERIOD_END));

    const { getAllByText } = render(<AccountScreen />);

    await waitFor(() => {
      // Craft Phase 4 entitlement shell chip (may also appear as Status label)
      expect(getAllByText("Hospice Sales Pro · active · canceling").length).toBeGreaterThan(0);
    });
  });

  it("shows the canceling blurb in the membership card", async () => {
    mockFetchBillingStatus.mockResolvedValue(makeBillingCanceling(PERIOD_END));

    const { getAllByText } = render(<AccountScreen />);

    await waitFor(() => {
      expect(
        getAllByText(
          "Your subscription is set to cancel. You keep tools until the current period ends. Reverse cancel in Manage billing if needed.",
        ).length,
      ).toBeGreaterThan(0);
    });
  });
});
