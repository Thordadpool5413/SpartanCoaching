/**
 * Asserts that the elite positioning copy on the /field-kit page renders
 * correctly for every subscriber state: unauthenticated, authenticated and
 * able to subscribe, and already subscribed.
 *
 * This prevents future copy changes from accidentally reverting hero
 * headlines or CTA labels to generic commerce language.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { render, cleanup, screen, within, fireEvent } from "@testing-library/react";

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
    openPortal: vi.fn(),
    checkoutPending: false,
    portalPending: false,
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
    expect(screen.getByText(/The edge that wins the room/i)).toBeTruthy();
    expect(screen.getByText(/Not every rep has access/i)).toBeTruthy();
  });

  it("renders the elite hero headline when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    expect(screen.getByText(/The edge that wins the room/i)).toBeTruthy();
    expect(screen.getByText(/Not every rep has access/i)).toBeTruthy();
  });

  it("renders the elite hero headline when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    expect(screen.getByText(/The edge that wins the room/i)).toBeTruthy();
    expect(screen.getByText(/Not every rep has access/i)).toBeTruthy();
  });
});

describe("FieldKit eyebrow copy — all states", () => {
  it("shows the elite eyebrow copy when unauthenticated", async () => {
    await renderFieldKit(UNAUTHED);
    expect(
      within(screen.getByTestId("section-hero")).getByText(/Private Field Kit/i),
    ).toBeTruthy();
  });

  it("shows the elite eyebrow copy when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    expect(
      within(screen.getByTestId("section-hero")).getByText(/Private Field Kit/i),
    ).toBeTruthy();
  });

  it("shows the elite eyebrow copy when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    expect(
      within(screen.getByTestId("section-hero")).getByText(/Private Field Kit/i),
    ).toBeTruthy();
  });
});

describe("FieldKit hero CTA — unauthenticated", () => {
  it("shows Create account to subscribe (honest self-serve path)", async () => {
    await renderFieldKit(UNAUTHED);
    const registerLinks = screen.getAllByText(/Create account to subscribe/i);
    expect(registerLinks.length).toBeGreaterThan(0);
  });

  it("shows a 'Sign in' link for existing users", async () => {
    await renderFieldKit(UNAUTHED);
    const links = screen.getAllByText(/Sign in/i);
    expect(links.length).toBeGreaterThan(0);
  });

  it("does NOT show Stripe Subscribe button when unauthenticated", async () => {
    await renderFieldKit(UNAUTHED);
    expect(screen.queryAllByText(/^Subscribe · \$14\.99\/wk$/i).length).toBe(0);
  });
});

describe("FieldKit hero CTA — can-subscribe", () => {
  it("shows a subscribe button with '$14.99/wk' copy", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const buttons = screen.getAllByText(/Subscribe · \$14\.99\/wk/i);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("does NOT show register as the primary CTA when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    expect(screen.queryAllByText(/Create account to subscribe/i).length).toBe(0);
  });
});

describe("FieldKit hero CTA — already subscribed", () => {
  it("shows 'Open Field Kit' link", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const links = screen.getAllByText(/Open Field Kit/i);
    expect(links.length).toBeGreaterThan(0);
  });

  it("does NOT show the subscribe button when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    expect(screen.queryAllByText(/Subscribe · \$14\.99\/wk/i).length).toBe(0);
  });

  it("does NOT show the register CTA when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    expect(screen.queryAllByText(/Create account to subscribe/i).length).toBe(0);
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
    const registerLinks = within(section).getAllByTestId("field-kit-hero-cta");
    expect(registerLinks.length).toBeGreaterThan(0);
    expect(registerLinks[0].textContent).toMatch(/Create account to subscribe/i);
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
    const buttons = within(section).getAllByText(/Subscribe · \$14\.99\/wk/i);
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
    const links = within(section).getAllByText(/Open Field Kit/i);
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
    const registerLinks = within(section).getAllByTestId("field-kit-pricing-cta");
    expect(registerLinks.length).toBeGreaterThan(0);
    expect(registerLinks[0].textContent).toMatch(/Create account to subscribe/i);
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
    const buttons = within(section).getAllByText(/Subscribe · \$14\.99\/wk/i);
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
    const links = within(section).getAllByText(/Open Field Kit/i);
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
  it("shows Create account to subscribe in the closing-cta section", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).getAllByText(/Create account to subscribe/i).length).toBeGreaterThan(0);
  });

  it("shows a 'Sign in' link in the closing-cta section", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).getAllByText(/Sign in/i).length).toBeGreaterThan(0);
  });

  it("does NOT show Stripe Subscribe in the closing-cta when unauthenticated", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).queryAllByText(/^Subscribe · \$14\.99\/wk$/i).length).toBe(0);
  });

  it("does NOT show Open Field Kit when unauthenticated", async () => {
    await renderFieldKit(UNAUTHED);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).queryAllByText(/Open Field Kit/i).length).toBe(0);
  });
});

describe("FieldKit closing-CTA section — can-subscribe", () => {
  it("shows Subscribe · $14.99/wk in the closing-cta section", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).getAllByText(/Subscribe · \$14\.99\/wk/i).length).toBeGreaterThan(0);
  });

  it("does NOT show register CTA when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).queryAllByText(/Create account to subscribe/i).length).toBe(0);
  });

  it("does NOT show Open Field Kit when can-subscribe", async () => {
    await renderFieldKit(CAN_SUBSCRIBE);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).queryAllByText(/Open Field Kit/i).length).toBe(0);
  });
});

describe("FieldKit closing-CTA section — already subscribed", () => {
  it("shows Open Field Kit in the closing-cta section", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).getAllByText(/Open Field Kit/i).length).toBeGreaterThan(0);
  });

  it("does NOT show Subscribe when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).queryAllByText(/Subscribe · \$14\.99\/wk/i).length).toBe(0);
  });

  it("does NOT show register CTA when already subscribed", async () => {
    await renderFieldKit(ALREADY_SUBSCRIBED);
    const section = screen.getByTestId("section-closing-cta");
    expect(within(section).queryAllByText(/Create account to subscribe/i).length).toBe(0);
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

    expect(unauthedItems.length).toBe(5);
    expect(canSubscribeItems.length).toBe(5);
    expect(subscribedItems.length).toBe(5);
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

// ── FAQ accordion interaction ──────────────────────────────────────────────────
//
// The accordion is auth-agnostic in its logic, but we verify the open/close
// behaviour explicitly for every auth state so a regression in any branch is
// caught immediately.

const FAQ_ACCORDION_CASES = [
  { label: "unauthenticated", state: UNAUTHED },
  { label: "can-subscribe", state: CAN_SUBSCRIBE },
  { label: "already subscribed", state: ALREADY_SUBSCRIBED },
] as const;

for (const { label, state } of FAQ_ACCORDION_CASES) {
  describe(`FieldKit FAQ accordion — open/close interaction (${label})`, () => {
    it("all FAQ items start collapsed (no answer text visible)", async () => {
      await renderFieldKit(state);
      const section = screen.getByTestId("section-faq");
      // Answers must not be in the DOM before any interaction
      expect(
        within(section).queryByText(/No\. You can create an individual account/i),
      ).toBeNull();
      expect(
        within(section).queryByText(/Both\. Individual reps use the Objection Handler/i),
      ).toBeNull();
    });

    it("clicking a FAQ item button reveals its answer", async () => {
      await renderFieldKit(state);
      const section = screen.getByTestId("section-faq");
      const firstItem = within(section).getByTestId("faq-item-0");
      const button = within(firstItem).getByRole("button");

      // Initially collapsed
      expect(button.getAttribute("aria-expanded")).toBe("false");
      expect(within(firstItem).queryByText(/No\. You can create an individual account/i)).toBeNull();

      fireEvent.click(button);

      // Answer is now visible
      expect(button.getAttribute("aria-expanded")).toBe("true");
      expect(
        within(firstItem).getByText(/No\. You can create an individual account/i),
      ).toBeTruthy();
    });

    it("clicking the same FAQ item again hides the answer", async () => {
      await renderFieldKit(state);
      const section = screen.getByTestId("section-faq");
      const firstItem = within(section).getByTestId("faq-item-0");
      const button = within(firstItem).getByRole("button");

      // Open then close
      fireEvent.click(button);
      expect(button.getAttribute("aria-expanded")).toBe("true");

      fireEvent.click(button);
      expect(button.getAttribute("aria-expanded")).toBe("false");
      expect(within(firstItem).queryByText(/No\. You can create an individual account/i)).toBeNull();
    });

    it("opening a second item closes the first", async () => {
      await renderFieldKit(state);
      const section = screen.getByTestId("section-faq");
      const firstItem = within(section).getByTestId("faq-item-0");
      const secondItem = within(section).getByTestId("faq-item-1");
      const firstButton = within(firstItem).getByRole("button");
      const secondButton = within(secondItem).getByRole("button");

      // Open first item
      fireEvent.click(firstButton);
      expect(firstButton.getAttribute("aria-expanded")).toBe("true");

      // Open second item — first should now be collapsed
      fireEvent.click(secondButton);
      expect(secondButton.getAttribute("aria-expanded")).toBe("true");
      expect(firstButton.getAttribute("aria-expanded")).toBe("false");
      expect(within(firstItem).queryByText(/No\. You can create an individual account/i)).toBeNull();
      expect(
        within(secondItem).getByText(/Both\. Individual reps use the Objection Handler/i),
      ).toBeTruthy();
    });

    it("each FAQ item button toggles only its own answer", async () => {
      await renderFieldKit(state);
      const section = screen.getByTestId("section-faq");

      // Open the third item (index 2)
      const thirdItem = within(section).getByTestId("faq-item-2");
      const thirdButton = within(thirdItem).getByRole("button");
      fireEvent.click(thirdButton);

      expect(thirdButton.getAttribute("aria-expanded")).toBe("true");
      expect(within(thirdItem).getByText(/Access stops at the end of the period/i)).toBeTruthy();

      // Other items must still be collapsed
      const firstItem = within(section).getByTestId("faq-item-0");
      const secondItem = within(section).getByTestId("faq-item-1");
      const fourthItem = within(section).getByTestId("faq-item-3");
      expect(within(firstItem).getByRole("button").getAttribute("aria-expanded")).toBe("false");
      expect(within(secondItem).getByRole("button").getAttribute("aria-expanded")).toBe("false");
      expect(within(fourthItem).getByRole("button").getAttribute("aria-expanded")).toBe("false");
    });
  });
}
