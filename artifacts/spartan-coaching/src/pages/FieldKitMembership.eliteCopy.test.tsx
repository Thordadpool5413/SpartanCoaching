/**
 * Asserts that the elite positioning copy on the /field-kit-membership page
 * renders correctly for every subscriber state: unauthenticated, authenticated
 * and able to subscribe, and already subscribed.
 *
 * Verifies "Join the Field Kit" positioning and SubscribeCTA honest funnel
 * (Create account → Subscribe · $14.99/wk → Open Field Kit).
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
    openPortal: vi.fn(),
    checkoutPending: false,
    portalPending: false,
  }),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
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
  fieldKit: null,
};

const CAN_SUBSCRIBE = {
  isAuthenticated: true,
  canUseFieldKit: false,
  organization: {
    type: "personal",
    billingPlan: "standard",
    status: "expired",
    hasStripeSubscription: false,
    billingStatus: null,
  },
  member: { role: "member" },
  fieldKit: { allowed: false, reason: "expired" },
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
  fieldKit: { allowed: true },
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
  it("shows Create account to subscribe via SubscribeCTA in the hero", async () => {
    await renderMembership(UNAUTHED);
    const cta = screen.getByTestId("membership-hero-subscribe");
    expect(cta).toBeTruthy();
    expect(cta.textContent).toMatch(/Create account to subscribe/i);
  });

  it("shows Sign in for existing users", async () => {
    await renderMembership(UNAUTHED);
    expect(screen.getAllByText(/Sign in/i).length).toBeGreaterThan(0);
  });

  it("does NOT show Stripe Subscribe · $14.99/wk when unauthenticated", async () => {
    await renderMembership(UNAUTHED);
    expect(screen.queryByText(/^Subscribe · \$14\.99\/wk$/i)).toBeNull();
  });

  it("does NOT promise free trial in the hero", async () => {
    await renderMembership(UNAUTHED);
    expect(screen.queryByText(/free trial/i)).toBeNull();
  });
});

describe("FieldKitMembership CTA — can-subscribe", () => {
  it("shows Subscribe · $14.99/wk in the hero", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    const btn = screen.getByTestId("membership-hero-subscribe");
    expect(btn).toBeTruthy();
    expect(btn.textContent).toMatch(/Subscribe · \$14\.99\/wk|Resubscribe · \$14\.99\/wk/i);
  });

  it("shows subscribe CTA in the individual tier card", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    const tierBtn = screen.getByTestId("button-tier-individual");
    expect(tierBtn).toBeTruthy();
    expect(tierBtn.textContent).toMatch(/Subscribe · \$14\.99\/wk|Resubscribe · \$14\.99\/wk/i);
  });

  it("does NOT show Create account as the hero CTA when can-subscribe", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    expect(screen.queryByText(/Create account to subscribe/i)).toBeNull();
  });

  it("does NOT show Open Field Kit when can-subscribe", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    expect(screen.queryByText(/Open Field Kit/i)).toBeNull();
  });
});

describe("FieldKitMembership CTA — already subscribed", () => {
  it("shows Open Field Kit in the hero", async () => {
    await renderMembership(ALREADY_SUBSCRIBED);
    const cta = screen.getByTestId("membership-hero-subscribe");
    expect(cta.textContent).toMatch(/Open Field Kit/i);
  });

  it("does NOT show Subscribe · $14.99/wk when already subscribed", async () => {
    await renderMembership(ALREADY_SUBSCRIBED);
    expect(screen.queryByText(/Subscribe · \$14\.99\/wk/i)).toBeNull();
  });

  it("does NOT show Create account CTA when already subscribed", async () => {
    await renderMembership(ALREADY_SUBSCRIBED);
    expect(screen.queryByText(/Create account to subscribe/i)).toBeNull();
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

describe("FieldKitMembership how-to-access — honest funnel", () => {
  it("lists preview → create account → subscribe steps", async () => {
    await renderMembership(UNAUTHED);
    expect(screen.getByText(/How to get access/i)).toBeTruthy();
    expect(screen.getAllByText(/Preview free/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Create your account/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Subscribe/i).length).toBeGreaterThan(0);
  });

  it("does NOT claim immediate access after register alone", async () => {
    await renderMembership(UNAUTHED);
    expect(screen.queryByText(/immediate access after register/i)).toBeNull();
    expect(screen.queryByText(/free trial starts automatically/i)).toBeNull();
  });
});

describe("FieldKitMembership end-user why section", () => {
  it("frames value as personal edge, not provider Medicare revenue", async () => {
    await renderMembership(UNAUTHED);
    const section = screen.getByTestId("section-why-membership");
    expect(section.textContent).toMatch(/Walk in with the answer/i);
    expect(section.textContent).not.toMatch(/Medicare revenue/i);
    expect(section.textContent).not.toMatch(/admit rate.*annual/i);
  });
});

describe("FieldKitMembership pricing framing — $14.99/week", () => {
  it("shows '$14.99' pricing copy when unauthenticated", async () => {
    await renderMembership(UNAUTHED);
    expect(screen.getAllByText(/\$14\.99/i).length).toBeGreaterThan(0);
  });

  it("shows '$14.99' pricing copy when can-subscribe", async () => {
    await renderMembership(CAN_SUBSCRIBE);
    expect(screen.getAllByText(/\$14\.99/i).length).toBeGreaterThan(0);
  });

  it("shows '$14.99' pricing copy when already subscribed", async () => {
    await renderMembership(ALREADY_SUBSCRIBED);
    expect(screen.getAllByText(/\$14\.99/i).length).toBeGreaterThan(0);
  });

  it("shows 'Individual access' label on the pricing section", async () => {
    await renderMembership(UNAUTHED);
    const card = screen.getByTestId("card-tier-individual");
    expect(card.textContent).toMatch(/Individual access/i);
  });
});
