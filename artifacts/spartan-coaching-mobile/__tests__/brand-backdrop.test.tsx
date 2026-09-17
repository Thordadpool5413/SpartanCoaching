import React from "react";
import { render } from "@testing-library/react-native";
import { BrandBackdrop } from "@/components/brand/BrandBackdrop";

describe("BrandBackdrop", () => {
  it("renders a non-interactive decorative overlay over app screens", () => {
    const { toJSON } = render(<BrandBackdrop />);
    const tree = toJSON();

    expect(tree).not.toBeNull();
    expect(tree).toMatchObject({ props: { pointerEvents: "none" } });
  });
});
