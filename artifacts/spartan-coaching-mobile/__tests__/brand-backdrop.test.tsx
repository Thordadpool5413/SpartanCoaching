import React from "react";
import { render } from "@testing-library/react-native";
import { BrandBackdrop } from "@/components/brand/BrandBackdrop";

describe("BrandBackdrop", () => {
  it("renders no decorative overlay over app screens", () => {
    const { queryByTestId, toJSON } = render(<BrandBackdrop />);

    expect(queryByTestId("brand-backdrop")).toBeNull();
    expect(toJSON()).toBeNull();
  });
});
