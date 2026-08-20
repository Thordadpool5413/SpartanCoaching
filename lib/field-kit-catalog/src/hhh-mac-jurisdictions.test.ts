import { describe, expect, it } from "vitest";
import { HHH_MAC_STATES, getHhhMacForState, isValidHhhMacSelection } from "./hhh-mac-jurisdictions";

describe("Home Health and Hospice MAC jurisdictions", () => {
  it("covers every state and the District of Columbia exactly once", () => {
    expect(HHH_MAC_STATES).toHaveLength(51);
    expect(new Set(HHH_MAC_STATES.map((item) => item.state)).size).toBe(51);
  });

  it("resolves representative states across every jurisdiction", () => {
    expect(getHhhMacForState("California")?.code).toBe("J6");
    expect(getHhhMacForState("Pennsylvania")?.code).toBe("J15");
    expect(getHhhMacForState("Vermont")?.code).toBe("JK");
    expect(getHhhMacForState("Florida")?.code).toBe("JM");
  });

  it("rejects mismatched or unknown selections", () => {
    expect(isValidHhhMacSelection("Florida", "JM")).toBe(true);
    expect(isValidHhhMacSelection("Florida", "JK")).toBe(false);
    expect(isValidHhhMacSelection("Atlantis", "JM")).toBe(false);
  });
});
