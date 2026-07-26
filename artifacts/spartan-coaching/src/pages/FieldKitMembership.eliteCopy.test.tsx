/**
 * Asserts that the elite positioning copy on the /field-kit-membership page
 * renders correctly for every subscriber state: unauthenticated, authenticated
 * and able to subscribe, and already subscribed.
 *
 * Specifically verifies "Join the Field Kit" and "Get access" language per
 * state so a future copy change cannot silently revert to generic commerce
 * language.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("wouter", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/SEO", () => ({ SEO: () => null }));

// Minimal catalog stubs — enough for the membership page to render without
// crashing, while keeping focus on copy assertions.
vi.mock("@workspace/field-kit-catalog", () => ({
  FIELD_KIT_TOOLS: [
    {
      id: "objections",
      title: "Objection Handler",
      category: "Conversation",
      description: "Stub",
      public: false,
      scenario: "Scenario stub",
      outcome: "Outcome stub",
      whenToUse: "Stub",
    },
    {
      id: "playbooks",
      title: "Playbook Generator",
      category: "Conversation",
      description: "Stub",
      public: false,
      scenario: "Scenario stub",
      outcome: "Outcome stub",
      whenToUse: "Stub",
    },
  ],
  FIELD_KIT_CATEGORIES: ["Conversation"],
  FIELD_KIT_CAT_BLURBS: {
    Conversation: { label: "Conversation", blurb: "Stub blurb" },
  },
}));

// ── Auth & billing mocks (overridden per describe block) ──────────────────────

const mockUseAuth = vi.fn();
const mockStartCheckout = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/useBillingActions", () => ({
  useBillingActions: () => ({
    startCheckout: mockStartCheckout,
    checkoutPending: false,
  }),
}));

// ── Browser API stubs ─────────────────────────────────────────────────────────

beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  }
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ── Shared auth fixtures ───────────────────────────────────────────────────────

const UNAUTHED = {
  isAuthenticated: false,
  canUseFieldKit: false,
  organization: null,
  member: null,
};

const CAN_SUBSCRIBE = {
  isAuthenticated: true,
  canUseFieldKit: false,
  organization: {
    type: "personal",
    billingPlan: "standard",
    status: "pending",
    hasStripeSubscription: false,
    billingStatus: null,
  },
  member: { role: "member" },
};

const ALREADY_SUBSCRIBED = {
  isAuthenticated: true,
  canUseFieldKit: true,
  organization: {
    type: "personal",
    billingPlan: "standard",
    status: "active",
    hasStripeSubscription: true,
    billingStatus: "active",
  },
  member: { role: "member" },
};

async function renderMembership(authState: object) {
  mockUseAuth.mockReturnValue(authState);
  const { default: FieldKitMembership } = await import("./FieldKitMembership");
  return render(<FieldKitMembership />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("FieldKitMembership page container", () => {
  it("renders the page wrapper for unauthenticated users", async () => {
    await renderMembership(UNAUTHED);
    expect(screen.getByTestId("page-field-kit-membership")).toBeTruthy();
  });

  it("renders the page wrapper when can-subscribe", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    expect(screen.getByTestId("page-field-kit-membership")).toBeTruthy();
  });

  it("renders the page wrapper when already subscribed", async () => {
    await renderMembership(ALREADY_SUBSCRIBED);
    expect(screen.getByTestId("page-field-kit-membership")).toBeTruthy();
  });
});

describe("FieldKitMembership hero copy — 'Join the Field Kit'", () => {
  it("shows 'Join the Field Kit' eyebrow when unauthenticated", async () => {
    await renderMembership(UNAUTHED);
    expect(screen.getAllByText(/Join the Field Kit/i).length).toBeGreaterThan(0);
  });

  it("shows 'Join the Field Kit' eyebrow when can-subscribe", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    expect(screen.getAllByText(/Join the Field Kit/i).length).toBeGreaterThan(0);
  });

  it("shows 'Join the Field Kit' eyebrow when already subscribed", async () => {
    await renderMembership(ALREADY_SUBSCRIBED);
    expect(screen.getAllByText(/Join the Field Kit/i).length).toBeGreaterThan(0);
  });
});

describe("FieldKitMembership hero headline — elite positioning", () => {
  it("shows 'Not every rep has access' in the hero when unauthenticated", async () => {
    await renderMembership(UNAUTHED);
    expect(screen.getByText(/Not every rep has access/i)).toBeTruthy();
  });

  it("shows 'Not every rep has access' in the hero when can-subscribe", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    expect(screen.getByText(/Not every rep has access/i)).toBeTruthy();
  });

  it("shows 'Not every rep has access' in the hero when already subscribed", async () => {
    await renderMembership(ALREADY_SUBSCRIBED);
    expect(screen.getByText(/Not every rep has access/i)).toBeTruthy();
  });

  it("shows 'the top reps in your market use' copy in the hero", async () => {
    await renderMembership(UNAUTHED);
    expect(screen.getByText(/the top reps in your market use/i)).toBeTruthy();
  });
});

describe("FieldKitMembership CTA — unauthenticated", () => {
  it("shows a 'Get access' link to /register in the hero", async () => {
    await renderMembership(UNAUTHED);
    const registerLink = screen.getByTestId("membership-hero-register");
    expect(registerLink).toBeTruthy();
    expect(registerLink.textContent).toMatch(/Get access/i);
  });

  it("includes 'join the Field Kit' in the /register link copy", async () => {
    await renderMembership(UNAUTHED);
    const registerLink = screen.getByTestId("membership-hero-register");
    expect(registerLink.textContent).toMatch(/join the Field Kit/i);
  });

  it("shows 'Already have an account? Sign in' for existing users", async () => {
    await renderMembership(UNAUTHED);
    expect(screen.getByText(/Already have an account/i)).toBeTruthy();
  });

  it("does NOT show the subscribe button when unauthenticated", async () => {
    await renderMembership(UNAUTHED);
    expect(
      screen.queryByTestId("membership-hero-subscribe"),
    ).toBeNull();
  });
});

describe("FieldKitMembership CTA — can-subscribe", () => {
  it("shows the subscribe button in the hero with 'Get access · $14.99/week' copy", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    const btn = screen.getByTestId("membership-hero-subscribe");
    expect(btn).toBeTruthy();
    expect(btn.textContent).toMatch(/Get access/i);
    expect(btn.textContent).toMatch(/\$14\.99\/week/i);
  });

  it("shows the subscribe button in the individual tier card", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    const tierBtn = screen.getByTestId("button-tier-individual-subscribe");
    expect(tierBtn).toBeTruthy();
    expect(tierBtn.textContent).toMatch(/Get access/i);
  });

  it("does NOT show the /register link as the hero CTA when can-subscribe", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    expect(screen.queryByTestId("membership-hero-register")).toBeNull();
  });

  it("does NOT show 'Open Account' when can-subscribe", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    expect(screen.queryByText(/Open Account · manage billing/i)).toBeNull();
  });
});

describe("FieldKitMembership CTA — already subscribed", () => {
  it("shows 'Open Account · manage billing' in the hero", async () => {
    await renderMembership(ALREADY_SUBSCRIBED);
    expect(screen.getByText(/Open Account · manage billing/i)).toBeTruthy();
  });

  it("does NOT show the hero subscribe button when already subscribed", async () => {
    await renderMembership(ALREADY_SUBSCRIBED);
    expect(screen.queryByTestId("membership-hero-subscribe")).toBeNull();
  });

  it("does NOT show the /register CTA when already subscribed", async () => {
    await renderMembership(ALREADY_SUBSCRIBED);
    expect(screen.queryByTestId("membership-hero-register")).toBeNull();
  });
});

describe("FieldKitMembership individual tier card — 'Join the Field Kit'", () => {
  it("shows 'Join the Field Kit' as the individual tier card heading", async () => {
    await renderMembership(UNAUTHED);
    const card = screen.getByTestId("card-tier-individual");
    expect(card.textContent).toMatch(/Join the Field Kit/i);
  });

  it("individual tier card heading shows 'Join the Field Kit' when can-subscribe", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    const card = screen.getByTestId("card-tier-individual");
    expect(card.textContent).toMatch(/Join the Field Kit/i);
  });
});

describe("FieldKitMembership pricing framing — $14.99/week", () => {
  it("shows '$14.99/week' pricing copy when unauthenticated", async () => {
    await renderMembership(UNAUTHED);
    expect(screen.getAllByText(/\$14\.99/i).length).toBeGreaterThan(0);
  });

  it("shows '$14.99/week' pricing copy when can-subscribe", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    expect(screen.getAllByText(/\$14\.99/i).length).toBeGreaterThan(0);
  });

  it("shows '$14.99/week' pricing copy when already subscribed", async () => {
    await renderMembership(ALREADY_SUBSCRIBED);
    expect(screen.getAllByText(/\$14\.99/i).length).toBeGreaterThan(0);
  });

  it("shows 'Individual access' label on the pricing section", async () => {
    await renderMembership(UNAUTHED);
    // The tier card has an "Individual access" label
    const card = screen.getByTestId("card-tier-individual");
    expect(card.textContent).toMatch(/Individual access/i);
  });
});
