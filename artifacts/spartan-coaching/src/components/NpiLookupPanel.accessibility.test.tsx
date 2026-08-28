import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NpiLookupPanel } from "./NpiLookupPanel";

afterEach(cleanup);

describe("NPI lookup accessibility", () => {
  it("gives every search field a stable accessible name", () => {
    render(<NpiLookupPanel />);

    expect(screen.getByLabelText("First name")).toBeTruthy();
    expect(screen.getByLabelText("Last name")).toBeTruthy();
    expect(screen.getByLabelText("City")).toBeTruthy();
    expect(screen.getByLabelText("State")).toBeTruthy();

    const organizationMode = screen.getByRole("button", { name: "Organization" });
    expect(organizationMode.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(organizationMode);
    expect(screen.getByLabelText("Organization")).toBeTruthy();
    expect(organizationMode.getAttribute("aria-pressed")).toBe("true");
  });
});
