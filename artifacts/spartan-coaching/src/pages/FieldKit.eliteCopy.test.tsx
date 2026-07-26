/**
 * Asserts that the elite positioning copy on the /field-kit page renders
 * correctly for every subscriber state: unauthenticated, authenticated and
 * able to subscribe, and already subscribed.
 *
 * This prevents future copy changes from accidentally reverting hero
 * headlines or CTA labels to generic commerce language.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { render, cleanup, screen, within } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/SEO", () => ({ SEO: () => null }));

// Stub the catalog so the tool cards section renders without crashing.
vi.mock("@workspace/field-kit-catalog", () => ({
  FIELD_KIT_TOOLS: [
    {
      id: "objections",
      title: "Objection Handler",
      category: "conversation",
      scenario: "Scenario stub",
      outcome: "Outcome stub",
      whenToUse: "Stub",
      description: "Stub",
      public: false,
    },
    {
      id: "playbooks",
      title: "Playbook Generator",
      category: "conversation",
      scenario: "Scenario stub",
      outcome: "Outcome stub",
      whenToUse: "Stub",
      description: "Stub",
      public: false,
    },
    {
      id: "role-play",
      title: "Role-Play",
      category: "conversation",
      scenario: "Scenario stub",
      outcome: "Outcome stub",
      whenToUse: "Stub",
      description: "Stub",
      public: false,
    },
    {
      id: "sales-workflow",
      title: "Sales Workflow",
      category: "planning",
      scenario: "Scenario stub",
      outcome: "Outcome stub",
      whenToUse: "Stub",
      description: "Stub",
      public: false,
    },
    {
      id: "weekly-plan",
      title: "Weekly Plan Builder",
      category: "planning",
      scenario: "Scenario stub",
      outcome: "Outcome stub",
      whenToUse: "Stub",
      description: "Stub",
      public: false,
    },
    {
      id: "cold-call",
      title: "Cold Call Script",
      category: "conversation",
      scenario: "Scenario stub",
      outcome: "Outcome stub",
      whenToUse: "Stub",
      description: "Stub",
      public: false,
    },
    {
      id: "email-templates",
      title: "Email Templates",
      category: "conversation",
      scenario: "Scenario stub",
      outcome: "Outcome stub",
      whenToUse: "Stub",
      description: "Stub",
      public: false,
    },
  ],
}));

// ── Auth & billing mocks (overridden per-test) ─────────────────────────────────

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
  organization: null,
  member: null,
  canUseFieldKit: false,
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

async function renderFieldKit(authState: object) {
  mockUseAuth.mockReturnValue(authState);
  const { default: FieldKit } = await import("./FieldKit");
  return render(<FieldKit />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("FieldKit hero headline — all states", () => {
  it("renders the elite hero headline regardless of auth state (unauthenticated)", async () => {
    await renderFieldKit(UNAUTHED);
    // The page-level container must be present
    expect(screen.getByTestId("page-field-kit")).toBeTruthy();
    // Elite headline fragments
    expect(screen.getByText(/The edge that converts/i)).toBeTruthy();
    expect(screen.getByText(/Not every rep has access/i)).toBeTruthy();
  });

  it("renders the elite hero headline when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    expect(screen.getByText(/The edge that converts/i)).toBeTruthy();
    expect(screen.getByText(/Not every rep has access/i)).toBeTruthy();
  });

  it("renders the elite hero headline when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    expect(screen.getByText(/The edge that converts/i)).toBeTruthy();
    expect(screen.getByText(/Not every rep has access/i)).toBeTruthy();
  });
});

describe("FieldKit eyebrow copy — all states", () => {
  it("shows the elite eyebrow copy when unauthenticated", async () => {
    await renderFieldKit(UNAUTHED);
    expect(
      screen.getByText(/Private Field Kit/i),
    ).toBeTruthy();
  });

  it("shows the elite eyebrow copy when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    expect(screen.getByText(/Private Field Kit/i)).toBeTruthy();
  });

  it("shows the elite eyebrow copy when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    expect(screen.getByText(/Private Field Kit/i)).toBeTruthy();
  });
});

describe("FieldKit hero CTA — unauthenticated", () => {
  it("shows a 'Get access' link to /register", async () => {
    await renderFieldKit(UNAUTHED);
    // HeroCTA is rendered in hero, pricing-cta, and closing-cta — all three
    // carry the register link when unauthenticated
    const registerLinks = screen.getAllByTestId("field-kit-hero-register");
    expect(registerLinks.length).toBeGreaterThan(0);
    expect(registerLinks[0].textContent).toMatch(/Get access/i);
  });

  it("shows a 'Sign in' link for existing users", async () => {
    await renderFieldKit(UNAUTHED);
    // "Sign in" appears in the hero CTA; there may be multiple instances
    const links = screen.getAllByText(/Sign in/i);
    expect(links.length).toBeGreaterThan(0);
  });

  it("does NOT show the subscribe CTA when unauthenticated", async () => {
    await renderFieldKit(UNAUTHED);
    // $14.99/week subscribe button should not appear in the hero CTA
    const heroCTAs = screen.queryAllByText(/Get access · \$14\.99\/week/i);
    // Any matches should NOT have the checkout click handler — there should be
    // zero rendered SubscribeBtn elements for the hero area
    expect(heroCTAs.length).toBe(0);
  });
});

describe("FieldKit hero CTA — can-subscribe", () => {
  it("shows a subscribe button with 'Get access · $14.99/week' copy", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const buttons = screen.getAllByText(/Get access · \$14\.99\/week/i);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("does NOT show a link to /register as the primary CTA when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    expect(screen.queryByTestId("field-kit-hero-register")).toBeNull();
  });
});

describe("FieldKit hero CTA — already subscribed", () => {
  it("shows 'Go to your account' link", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    // HeroCTA renders in hero, pricing-cta, and closing-cta sections
    const links = screen.getAllByText(/Go to your account/i);
    expect(links.length).toBeGreaterThan(0);
  });

  it("does NOT show the subscribe button when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    expect(screen.queryAllByText(/Get access · \$14\.99\/week/i).length).toBe(0);
  });

  it("does NOT show the /register CTA when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    expect(screen.queryByTestId("field-kit-hero-register")).toBeNull();
  });
});

describe("FieldKit pricing framing — all states", () => {
  it("shows '$14.99/week' pricing copy when unauthenticated", async () => {
    await renderFieldKit(UNAUTHED);
    // Multiple elements contain $14.99 copy across sections
    expect(screen.getAllByText(/\$14\.99\/week/i).length).toBeGreaterThan(0);
  });

  it("shows '$14.99/week' pricing copy when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    expect(screen.getAllByText(/\$14\.99/i).length).toBeGreaterThan(0);
  });

  it("shows '$14.99/week' pricing copy when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    expect(screen.getAllByText(/\$14\.99/i).length).toBeGreaterThan(0);
  });
});

describe("FieldKit hero section — unauthenticated", () => {
  it("shows a 'Get access' register link in the hero section", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-hero");
    const registerLinks = within(section).getAllByTestId("field-kit-hero-register");
    expect(registerLinks.length).toBeGreaterThan(0);
    expect(registerLinks[0].textContent).toMatch(/Get access/i);
  });

  it("shows a 'Sign in' link in the hero section", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-hero");
    const signInLinks = within(section).getAllByText(/Sign in/i);
    expect(signInLinks.length).toBeGreaterThan(0);
  });

  it("does NOT show the subscribe button in the hero section when unauthenticated", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-hero");
    expect(within(section).queryAllByText(/Get access · \$14\.99\/week/i).length).toBe(0);
  });

  it("does NOT show 'Go to your account' in the hero section when unauthenticated", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-hero");
    expect(within(section).queryAllByText(/Go to your account/i).length).toBe(0);
  });
});

describe("FieldKit hero section — can-subscribe", () => {
  it("shows the subscribe button with 'Get access · $14.99/week' in the hero section", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-hero");
    const buttons = within(section).getAllByText(/Get access · \$14\.99\/week/i);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("does NOT show the /register link in the hero section when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-hero");
    expect(within(section).queryByTestId("field-kit-hero-register")).toBeNull();
  });

  it("does NOT show 'Go to your account' in the hero section when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-hero");
    expect(within(section).queryAllByText(/Go to your account/i).length).toBe(0);
  });
});

describe("FieldKit hero section — already subscribed", () => {
  it("shows 'Go to your account' link in the hero section", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-hero");
    const links = within(section).getAllByText(/Go to your account/i);
    expect(links.length).toBeGreaterThan(0);
  });

  it("does NOT show the subscribe button in the hero section when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-hero");
    expect(within(section).queryAllByText(/Get access · \$14\.99\/week/i).length).toBe(0);
  });

  it("does NOT show the /register link in the hero section when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-hero");
    expect(within(section).queryByTestId("field-kit-hero-register")).toBeNull();
  });
});

describe("FieldKit pricing-CTA section — unauthenticated", () => {
  it("shows a 'Get access' register link in the pricing-cta section", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-pricing-cta");
    const registerLinks = within(section).getAllByTestId("field-kit-hero-register");
    expect(registerLinks.length).toBeGreaterThan(0);
    expect(registerLinks[0].textContent).toMatch(/Get access/i);
  });

  it("shows a 'Sign in' link in the pricing-cta section", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-pricing-cta");
    const signInLinks = within(section).getAllByText(/Sign in/i);
    expect(signInLinks.length).toBeGreaterThan(0);
  });

  it("does NOT show the subscribe button in the pricing-cta section when unauthenticated", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-pricing-cta");
    expect(within(section).queryAllByText(/Get access · \$14\.99\/week/i).length).toBe(0);
  });

  it("does NOT show 'Go to your account' in the pricing-cta section when unauthenticated", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-pricing-cta");
    expect(within(section).queryAllByText(/Go to your account/i).length).toBe(0);
  });
});

describe("FieldKit pricing-CTA section — can-subscribe", () => {
  it("shows the subscribe button with 'Get access · $14.99/week' in the pricing-cta section", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-pricing-cta");
    const buttons = within(section).getAllByText(/Get access · \$14\.99\/week/i);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("does NOT show the /register link in the pricing-cta section when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-pricing-cta");
    expect(within(section).queryByTestId("field-kit-hero-register")).toBeNull();
  });

  it("does NOT show 'Go to your account' in the pricing-cta section when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-pricing-cta");
    expect(within(section).queryAllByText(/Go to your account/i).length).toBe(0);
  });
});

describe("FieldKit pricing-CTA section — already subscribed", () => {
  it("shows 'Go to your account' link in the pricing-cta section", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-pricing-cta");
    const links = within(section).getAllByText(/Go to your account/i);
    expect(links.length).toBeGreaterThan(0);
  });

  it("does NOT show the subscribe button in the pricing-cta section when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-pricing-cta");
    expect(within(section).queryAllByText(/Get access · \$14\.99\/week/i).length).toBe(0);
  });

  it("does NOT show the /register link in the pricing-cta section when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-pricing-cta");
    expect(within(section).queryByTestId("field-kit-hero-register")).toBeNull();
  });
});

describe("FieldKit closing-CTA section — unauthenticated", () => {
  it("shows a 'Get access' register link in the closing-cta section", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-closing-cta");
    const registerLinks = within(section).getAllByTestId("field-kit-hero-register");
    expect(registerLinks.length).toBeGreaterThan(0);
    expect(registerLinks[0].textContent).toMatch(/Get access/i);
  });

  it("shows a 'Sign in' link in the closing-cta section", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-closing-cta");
    const signInLinks = within(section).getAllByText(/Sign in/i);
    expect(signInLinks.length).toBeGreaterThan(0);
  });

  it("does NOT show the subscribe button in the closing-cta section when unauthenticated", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).queryAllByText(/Get access · \$14\.99\/week/i).length).toBe(0);
  });

  it("does NOT show 'Go to your account' in the closing-cta section when unauthenticated", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).queryAllByText(/Go to your account/i).length).toBe(0);
  });
});

describe("FieldKit closing-CTA section — can-subscribe", () => {
  it("shows the subscribe button with 'Get access · $14.99/week' in the closing-cta section", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-closing-cta");
    const buttons = within(section).getAllByText(/Get access · \$14\.99\/week/i);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("does NOT show the /register link in the closing-cta section when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).queryByTestId("field-kit-hero-register")).toBeNull();
  });

  it("does NOT show 'Go to your account' in the closing-cta section when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).queryAllByText(/Go to your account/i).length).toBe(0);
  });
});

describe("FieldKit closing-CTA section — already subscribed", () => {
  it("shows 'Go to your account' link in the closing-cta section", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-closing-cta");
    const links = within(section).getAllByText(/Go to your account/i);
    expect(links.length).toBeGreaterThan(0);
  });

  it("does NOT show the subscribe button in the closing-cta section when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).queryAllByText(/Get access · \$14\.99\/week/i).length).toBe(0);
  });

  it("does NOT show the /register link in the closing-cta section when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).queryByTestId("field-kit-hero-register")).toBeNull();
  });
});

describe("FieldKit FAQ section — unauthenticated", () => {
  it("renders the FAQ section", async () => {
    await renderFieldKit(UNAUTHED);
    expect(screen.getByTestId("section-faq")).toBeTruthy();
  });

  it("renders the faq-list inside the FAQ section", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-faq");
    expect(within(section).getByTestId("faq-list")).toBeTruthy();
  });

  it("renders at least the first FAQ item inside the FAQ section", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-faq");
    expect(within(section).getByTestId("faq-item-0")).toBeTruthy();
  });

  it("renders all four FAQ items inside the FAQ section", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-faq");
    expect(within(section).getByTestId("faq-item-0")).toBeTruthy();
    expect(within(section).getByTestId("faq-item-1")).toBeTruthy();
    expect(within(section).getByTestId("faq-item-2")).toBeTruthy();
    expect(within(section).getByTestId("faq-item-3")).toBeTruthy();
  });
});

describe("FieldKit FAQ section — can-subscribe", () => {
  it("renders the FAQ section", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    expect(screen.getByTestId("section-faq")).toBeTruthy();
  });

  it("renders the faq-list inside the FAQ section", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-faq");
    expect(within(section).getByTestId("faq-list")).toBeTruthy();
  });

  it("renders at least the first FAQ item inside the FAQ section", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-faq");
    expect(within(section).getByTestId("faq-item-0")).toBeTruthy();
  });

  it("renders all four FAQ items inside the FAQ section", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-faq");
    expect(within(section).getByTestId("faq-item-0")).toBeTruthy();
    expect(within(section).getByTestId("faq-item-1")).toBeTruthy();
    expect(within(section).getByTestId("faq-item-2")).toBeTruthy();
    expect(within(section).getByTestId("faq-item-3")).toBeTruthy();
  });
});

describe("FieldKit FAQ section — already subscribed", () => {
  it("renders the FAQ section", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    expect(screen.getByTestId("section-faq")).toBeTruthy();
  });

  it("renders the faq-list inside the FAQ section", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-faq");
    expect(within(section).getByTestId("faq-list")).toBeTruthy();
  });

  it("renders at least the first FAQ item inside the FAQ section", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-faq");
    expect(within(section).getByTestId("faq-item-0")).toBeTruthy();
  });

  it("renders all four FAQ items inside the FAQ section", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-faq");
    expect(within(section).getByTestId("faq-item-0")).toBeTruthy();
    expect(within(section).getByTestId("faq-item-1")).toBeTruthy();
    expect(within(section).getByTestId("faq-item-2")).toBeTruthy();
    expect(within(section).getByTestId("faq-item-3")).toBeTruthy();
  });
});

describe("FieldKit FAQ section — markup consistency across auth states", () => {
  it("renders the same number of FAQ items regardless of auth state", async () => {
    await renderFieldKit(UNAUTHED);
    const unauthedSection = screen.getByTestId("section-faq");
    const unauthedItems = within(unauthedSection).queryAllByTestId(/^faq-item-/);
    cleanup();

    await renderFieldKit(CAN_SUBSCRIBE);
    const canSubscribeSection = screen.getByTestId("section-faq");
    const canSubscribeItems = within(canSubscribeSection).queryAllByTestId(/^faq-item-/);
    cleanup();

    await renderFieldKit(ALREADY_SUBSCRIBED);
    const subscribedSection = screen.getByTestId("section-faq");
    const subscribedItems = within(subscribedSection).queryAllByTestId(/^faq-item-/);

    expect(unauthedItems.length).toBe(4);
    expect(canSubscribeItems.length).toBe(4);
    expect(subscribedItems.length).toBe(4);
  });

  it("FAQ section heading is present for all auth states", async () => {
    for (const state of [UNAUTHED, CAN_SUBSCRIBE, ALREADY_SUBSCRIBED]) {
      await renderFieldKit(state);
      const section = screen.getByTestId("section-faq");
      expect(within(section).getByText(/Questions prospects actually ask/i)).toBeTruthy();
      cleanup();
    }
  });
});
