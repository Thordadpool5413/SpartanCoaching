import React from "react";
import { render } from "@testing-library/react-native";
import { BrandBackdrop } from "@/components/brand/BrandBackdrop";

describe("BrandBackdrop", () => {
  it("is decorative and hidden from the accessibility tree", () => {
    const { UNSAFE_root } = render(<BrandBackdrop />);
    const backdrop = UNSAFE_root.findByProps({ testID: "brand-backdrop" });
    expect(backdrop.props.accessibilityElementsHidden).toBe(true);
    expect(backdrop.props.importantForAccessibility).toBe("no-hide-descendants");
  });
});
