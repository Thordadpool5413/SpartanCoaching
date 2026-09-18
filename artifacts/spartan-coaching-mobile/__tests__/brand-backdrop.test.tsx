import React from "react";
import { render } from "@testing-library/react-native";
import { BrandBackdrop } from "@/components/brand/BrandBackdrop";

describe("BrandBackdrop", () => {
  it("stays inert so decoration cannot destabilize native startup", () => {
    const { toJSON } = render(<BrandBackdrop />);
    expect(toJSON()).toBeNull();
  });
});
