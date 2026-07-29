import { describe, expect, it } from "vitest";
import { findPotentialIdentifiers } from "./deidentification";

describe("de-identified clinical input screening", () => {
  it.each([
    ["email", { notes: "Contact jane@example.com" }, "EMAIL_ADDRESS"],
    ["phone", { notes: "Call (404) 555-1212" }, "PHONE_NUMBER"],
    ["SSN", { notes: "SSN 123-45-6789" }, "SOCIAL_SECURITY_NUMBER"],
    ["MRN", { notes: "MRN: AB-12345" }, "MEDICAL_RECORD_NUMBER"],
    ["DOB", { notes: "DOB: 03/14/1941" }, "DATE_OF_BIRTH"],
    [
      "patient name",
      { notes: "Patient name: Jane Smith" },
      "PATIENT_NAME",
    ],
    [
      "address",
      { notes: "Lives at 123 Main Street" },
      "POSTAL_ADDRESS",
    ],
  ])("detects a direct %s without returning its value", (_, input, code) => {
    expect(findPotentialIdentifiers(input)).toContain(code);
    expect(JSON.stringify(findPotentialIdentifiers(input))).not.toContain(
      Object.values(input)[0],
    );
  });

  it("allows ordinary de-identified clinical education input", () => {
    expect(
      findPotentialIdentifiers({
        diagnosis: "End-stage heart disease",
        observations: [
          "Progressive functional decline over the last six months",
          "Dependent in four of six activities of daily living",
        ],
        ageRange: "80-89",
      }),
    ).toEqual([]);
  });
});
