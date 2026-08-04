/**
 * Tests for the AppState-based billing refresh logic in AccountScreen.
 *
 * Four paths under test:
 *   1. Returning from Stripe via Manage Billing (stripeOpenedRef=true) → loadBilling always fires, flag reset to false
 *   2. Returning from Stripe via Subscribe checkout (stripeOpenedRef=true) → loadBilling fires, flag reset to false
 *   3. Normal app-switch within 30 s (stripeOpenedRef=false, age < BILLING_STALE_MS) → loadBilling NOT called
 *   4. Normal app-switch after 30 s (stripeOpenedRef=false, age ≥ BILLING_STALE_MS) → loadBilling IS called
 */

import React from "react";
import { AppState, type AppStateEvent, type AppStateStatus, type NativeEventSubscription } from "react-native";
import { render, waitFor, cleanup, act, fireEvent } from "@testing-library/react-native";

// ---------------------------------------------------------------------------
// Module mocks — must precede any import that pulls these paths in
// ---------------------------------------------------------------------------

const mockFetchBillingStatus = jest.fn();
const mockFetchOnboardingMobile = jest.fn();
const mockOpenBillingPortal = jest.fn();
const mockStartIndividualCheckout = jest.fn();

jest.mock("@/lib/api", () => ({
  fetchBillingStatus: (...args: unknown[]) => mockFetchBillingStatus(...args),
  fetchOnboardingMobile: (...args: unknown[]) => mockFetchOnboardingMobile(...args),
  openBillingPortal: (...args: unknown[]) => mockOpenBillingPortal(...args),
  startIndividualCheckout: (...args: unknown[]) => mockStartIndividualCheckout(...args),
  updateOnboardingMobile: jest.fn().mockResolvedValue({ member: {} }),
  getWebSiteUrl: () => "https://spartancoaching.com",
}));

// User with an active Stripe subscription — canPortal is true so the
// "Manage billing" button renders, letting us trigger stripeOpenedRef via a press.
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
    cancelAtPeriodEnd: false,
    hasStripeCustomer: true,
    hasStripeSubscription: true,
  },
  fieldKit: { allowed: true, reason: null, hoursRemaining: null },
};

// Personal user with no active subscription — canCheckout is true so the
// "Subscribe" button renders, letting us trigger stripeOpenedRef via that path.
const mockUnsubscribedUser = {
  member: {
    id: 2,
    email: "free@example.com",
    name: "Free User",
    role: "member",
    organizationId: 11,
    status: "active",
  },
  organization: {
    id: 11,
    name: "Free Hospice",
    type: "personal",
    seatLimit: 1,
    status: "active",
    billingPlan: "individual",
    billingStatus: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    hasStripeCustomer: false,
    hasStripeSubscription: false,
  },
  fieldKit: { allowed: true, reason: null, hoursRemaining: null },
};

// Mutable reference so individual tests can swap the active user fixture.
// Must be prefixed with "mock" so Jest's jest.mock() factory hoisting allows it.
let mockCurrentAuthUser: typeof mockUser = mockUser;

const mockRefresh = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/AuthContext", () => ({
  useAuth: () => ({
    user: mockCurrentAuthUser,
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
  router: { push: jest.fn(), replace: jest.fn() },
  useFocusEffect: (cb: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useEffect } = require("react") as typeof import("react");
    useEffect(cb, []);
  },
}));

jest.mock("@expo/vector-icons", () => ({
  Feather: () => null,
}));

// ---------------------------------------------------------------------------
// Import component AFTER mocks
// ---------------------------------------------------------------------------
import AccountScreen from "../app/(tabs)/account";

// ---------------------------------------------------------------------------
// AppState spy — captures the change handler the component registers
// ---------------------------------------------------------------------------

let capturedAppStateHandler: ((nextState: string) => void) | null = null;
let appStateListenerSpy: jest.SpyInstance;

beforeEach(() => {
  capturedAppStateHandler = null;
  appStateListenerSpy = jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_event: AppStateEvent, handler: (state: AppStateStatus) => void): NativeEventSubscription => {
      capturedAppStateHandler = handler as (state: string) => void;
      return { remove: jest.fn() };
    });
});

afterEach(() => {
  appStateListenerSpy.mockRestore();
  cleanup();
  jest.clearAllMocks();
  // Reset to the default subscribed user so other tests are unaffected.
  mockCurrentAuthUser = mockUser;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Billing response for a personal account with no active subscription (Subscribe button visible). */
function makeBillingUnsubscribed() {
  return {
    configured: true,
    individualWeeklyPriceConfigured: true,
    canCheckoutIndividual: true,
    canOpenPortal: false,
    organization: {
      id: 11,
      type: "personal",
      status: "active",
      billingPlan: "individual",
      billingStatus: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      hasStripeCustomer: false,
      hasStripeSubscription: false,
      billableSeats: null,
      seatLimit: 1,
      contractRef: null,
    },
  };
}

/** Billing response for an active, auto-renewing subscription. */
function makeBillingActive() {
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
      currentPeriodEnd: "2026-08-15T00:00:00.000Z",
      cancelAtPeriodEnd: false,
      hasStripeCustomer: true,
      hasStripeSubscription: true,
      billableSeats: null,
      seatLimit: 1,
      contractRef: null,
    },
  };
}

/**
 * Simulate: app goes to background, then returns to foreground.
 * The component's handler only acts when transitioning *to* active, so we
 * first push a non-active state to set appStateRef.current, then push active.
 */
function simulateBackgroundThenForeground() {
  act(() => {
    capturedAppStateHandler?.("background");
  });
  act(() => {
    capturedAppStateHandler?.("active");
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Account screen — AppState billing refresh", () => {
  // Full-suite runs on Windows can exceed the default 5s under worker contention.
  jest.setTimeout(15_000);

  beforeEach(() => {
    mockFetchOnboardingMobile.mockResolvedValue({
      member: { ...mockUser.member, checklistProgress: {} },
    });
    mockFetchBillingStatus.mockResolvedValue(makeBillingActive());
    mockOpenBillingPortal.mockResolvedValue({ url: "https://billing.stripe.com/test" });
    mockStartIndividualCheckout.mockResolvedValue({ url: "https://checkout.stripe.com/test" });
  });

  it("calls loadBilling when returning from Stripe (stripeOpenedRef=true) and resets the flag", async () => {
    const { getByTestId } = render(<AccountScreen />);

    // Wait for initial billing load triggered by useFocusEffect
    await waitFor(() => expect(mockFetchBillingStatus).toHaveBeenCalledTimes(1));

    // Press "Manage billing" to set stripeOpenedRef = true
    const manageBtn = getByTestId("button-manage-billing");
    await act(async () => {
      fireEvent.press(manageBtn);
      // Drain the micro-task queue so openBillingPortal resolves
      await new Promise((r) => setTimeout(r, 0));
    });

    // Simulate returning from the Stripe browser page
    simulateBackgroundThenForeground();

    // loadBilling must fire again because stripeOpenedRef was true
    await waitFor(() => expect(mockFetchBillingStatus).toHaveBeenCalledTimes(2));

    // A second foreground return (without pressing a Stripe button again) must NOT
    // trigger another fetch within the staleness window — confirming the flag was reset.
    simulateBackgroundThenForeground();
    // Still only 2 calls (age < 30 s and stripeOpenedRef is now false)
    expect(mockFetchBillingStatus).toHaveBeenCalledTimes(2);
  });

  it("calls loadBilling when returning from Stripe (stripeOpenedRef=true via Subscribe) and resets the flag", async () => {
    // Swap to a personal user with no active subscription so the Subscribe button renders.
    mockCurrentAuthUser = mockUnsubscribedUser as unknown as typeof mockUser;
    mockFetchBillingStatus.mockResolvedValue(makeBillingUnsubscribed());

    // Linking.canOpenURL must return true so onSubscribe sets stripeOpenedRef before openURL.
    const canOpenSpy = jest
      .spyOn(require("react-native").Linking, "canOpenURL")
      .mockResolvedValue(true);
    const openURLSpy = jest
      .spyOn(require("react-native").Linking, "openURL")
      .mockResolvedValue(undefined);

    try {
      const { getByTestId } = render(<AccountScreen />);

      // Wait for the initial billing load triggered by useFocusEffect.
      await waitFor(() => expect(mockFetchBillingStatus).toHaveBeenCalledTimes(1));

      // Press "Subscribe" to set stripeOpenedRef = true via the checkout path.
      const subscribeBtn = getByTestId("button-subscribe");
      await act(async () => {
        fireEvent.press(subscribeBtn);
        // Drain the micro-task queue so startIndividualCheckout resolves.
        await new Promise((r) => setTimeout(r, 0));
      });

      // Simulate returning from the Stripe browser checkout page.
      simulateBackgroundThenForeground();

      // loadBilling must fire again because stripeOpenedRef was true.
      await waitFor(() => expect(mockFetchBillingStatus).toHaveBeenCalledTimes(2));

      // A second foreground return (without re-pressing Subscribe) must NOT trigger
      // another fetch — confirming the flag was reset after the first return.
      simulateBackgroundThenForeground();
      // Still only 2 calls (age < 30 s and stripeOpenedRef is now false).
      expect(mockFetchBillingStatus).toHaveBeenCalledTimes(2);
    } finally {
      canOpenSpy.mockRestore();
      openURLSpy.mockRestore();
    }
  });

  it("does NOT call loadBilling on normal app-switch within 30 s (stripeOpenedRef=false, age < BILLING_STALE_MS)", async () => {
    render(<AccountScreen />);

    // Wait for initial billing load
    await waitFor(() => expect(mockFetchBillingStatus).toHaveBeenCalledTimes(1));

    // Immediately switch away and back — well within the 30-second staleness window
    simulateBackgroundThenForeground();

    // No additional fetch — data is still fresh
    expect(mockFetchBillingStatus).toHaveBeenCalledTimes(1);
  });

  it("calls loadBilling on normal app-switch after 30 s (stripeOpenedRef=false, age ≥ BILLING_STALE_MS)", async () => {
    render(<AccountScreen />);

    // Wait for initial billing load
    await waitFor(() => expect(mockFetchBillingStatus).toHaveBeenCalledTimes(1));

    // Advance Date.now() by 31 seconds so the staleness check triggers
    const realNow = Date.now();
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(realNow + 31_000);

    try {
      simulateBackgroundThenForeground();

      // loadBilling must fire because 31 s > BILLING_STALE_MS (30 s)
      await waitFor(() => expect(mockFetchBillingStatus).toHaveBeenCalledTimes(2));
    } finally {
      dateSpy.mockRestore();
    }
  });
});
