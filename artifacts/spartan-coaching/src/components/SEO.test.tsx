import { cleanup, render } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SEO } from "./SEO";
import { SITE_ORIGIN } from "@/lib/seo-config";

let currentPath = "/";

vi.mock("wouter", () => ({
  useLocation: () => [currentPath],
}));

afterEach(() => {
  cleanup();
  currentPath = "/";
});

function renderSEO() {
  return render(
    <HelmetProvider>
      <SEO />
    </HelmetProvider>,
  );
}

describe("route-level SEO baseline", () => {
  it.each([
    "/assessment/abc123/print",
    "/assessment-results/submission-42",
    "/sign/a-secure-token",
    "/membership",
  ])("marks protected or redirect route %s as noindex", (path) => {
    currentPath = path;
    renderSEO();

    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe(
      "noindex, nofollow",
    );
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      `${SITE_ORIGIN}${path}`,
    );
  });

  it("allows a page-specific SEO declaration to override the shared baseline", () => {
    currentPath = "/checkout-return";
    render(
      <HelmetProvider>
        <SEO />
        <SEO title="Checkout complete | Hospice Sales Pro" noIndex />
      </HelmetProvider>,
    );

    expect(document.title).toBe("Checkout complete | Hospice Sales Pro");
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe(
      "noindex, nofollow",
    );
  });
});