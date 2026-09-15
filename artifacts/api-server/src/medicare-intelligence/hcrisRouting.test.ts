import { describe, expect, it } from "vitest";
import { resolveParentFormRoute } from "./hcrisRouting";

describe("HCRIS parent-form routing", () => {
  it("routes hospital-based hospices to the hospital parent form", () => {
    expect(resolveParentFormRoute("Hospital Based Hospice")).toEqual(
      expect.objectContaining({
        providerBasis: "hospital-based",
        parentForm: "CMS-2552-10",
        status: "PARENT FORM AVAILABLE",
      }),
    );
  });

  it("routes home-health-based hospices to the HHA parent form", () => {
    expect(resolveParentFormRoute("HHA Based Hospice")).toEqual(
      expect.objectContaining({
        providerBasis: "home-health-based",
        parentForm: "CMS-1728-20",
      }),
    );
  });

  it("returns null for freestanding hospices", () => {
    expect(resolveParentFormRoute("Freestanding Hospice")).toBeNull();
  });
});
