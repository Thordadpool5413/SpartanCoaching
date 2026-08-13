import {
  canCommitCsvImport,
  canManageWorkflowIntegrations,
  calendarConnectPath,
  defaultCalendarRedirectUri,
  formatCsvImportResult,
  guessCsvColumnMapping,
} from "../lib/commandCenterIntegrations";

describe("command center integrations (pass 8)", () => {
  it("limits import/calendar to org admins", () => {
    expect(canManageWorkflowIntegrations("org_admin")).toBe(true);
    expect(canManageWorkflowIntegrations("platform_admin")).toBe(true);
    expect(canManageWorkflowIntegrations("member")).toBe(false);
    expect(canManageWorkflowIntegrations(null)).toBe(false);
  });

  it("guesses CSV column mapping", () => {
    const mapping = guessCsvColumnMapping([
      "Facility Name",
      "Type",
      "Address",
      "External Id",
    ]);
    expect(mapping["Facility Name"]).toBe("accountName");
    expect(mapping.Type).toBe("accountType");
    expect(mapping.Address).toBe("address");
    expect(mapping["External Id"]).toBe("externalId");
  });

  it("requires accountName and no formula cells to commit", () => {
    const preview = {
      headers: ["name"],
      rows: [{ name: "Acme" }],
      formulaCells: [] as Array<{ row: number; column: string }>,
    };
    expect(
      canCommitCsvImport({ preview, mapping: { name: "accountName" } }),
    ).toBe(true);
    expect(canCommitCsvImport({ preview, mapping: { name: "" } })).toBe(false);
    expect(
      canCommitCsvImport({
        preview: { ...preview, formulaCells: [{ row: 1, column: "name" }] },
        mapping: { name: "accountName" },
      }),
    ).toBe(false);
  });

  it("formats import result and calendar paths", () => {
    expect(
      formatCsvImportResult({
        dryImported: 3,
        imported: 2,
        merged: 1,
        rejected: 0,
      }),
    ).toMatch(/Imported 2/);
    expect(calendarConnectPath("google")).toContain("/calendar/google/connect");
    expect(defaultCalendarRedirectUri("https://example.com/")).toBe(
      "https://example.com/integrations/calendar/callback",
    );
  });
});
