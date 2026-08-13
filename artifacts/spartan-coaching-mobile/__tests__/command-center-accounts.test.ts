import {
  accountListSubtitle,
  buildScheduleAccountPayload,
  canSubmitSchedule,
  filterAccountsByQuery,
  sortAccountsByName,
} from "../lib/commandCenterAccounts";

const sample = [
  {
    id: "2",
    name: "Zenith Hospice",
    accountType: "SNF",
    address: "12 Oak St",
    ownerUserId: "u1",
  },
  {
    id: "1",
    name: "Acme Care",
    accountType: "Hospital",
    ownerUserId: "u1",
  },
];

describe("command center accounts (pass 6)", () => {
  it("sorts by name", () => {
    expect(sortAccountsByName(sample).map((a) => a.name)).toEqual([
      "Acme Care",
      "Zenith Hospice",
    ]);
  });

  it("filters by query across name/type/address", () => {
    expect(filterAccountsByQuery(sample, "oak").map((a) => a.id)).toEqual(["2"]);
    expect(filterAccountsByQuery(sample, "hospital").map((a) => a.id)).toEqual(["1"]);
    expect(filterAccountsByQuery(sample, "").length).toBe(2);
  });

  it("builds subtitle without inventing PHI", () => {
    expect(accountListSubtitle(sample[0]!)).toBe("SNF · 12 Oak St");
    expect(accountListSubtitle(sample[1]!)).toBe("Hospital");
  });

  it("builds schedule payload for existing vs new account", () => {
    const existing = buildScheduleAccountPayload({
      selectedAccount: sample[0]!,
      newAccountName: "ignored",
      ownerUserId: "owner-uuid",
      contact: { id: "c1", firstName: "Pat", lastName: "Lee" },
    });
    expect(existing.account).toMatchObject({
      id: "2",
      name: "Zenith Hospice",
      accountType: "SNF",
    });
    expect(existing.contactIds).toEqual([]);

    const created = buildScheduleAccountPayload({
      selectedAccount: null,
      newAccountName: "New Facility",
      ownerUserId: "owner-uuid",
      contact: { id: "c2", firstName: "Alex", lastName: "Morgan" },
    });
    expect(created.contactIds).toEqual(["c2"]);
    expect(created.account).toMatchObject({
      name: "New Facility",
      ownerUserId: "owner-uuid",
    });
  });

  it("validates schedule submit rules", () => {
    expect(
      canSubmitSchedule({
        selectedAccountId: "1",
        newAccountName: "",
        contactFirst: "",
        purpose: "Visit DON",
      }),
    ).toBe(true);
    expect(
      canSubmitSchedule({
        selectedAccountId: null,
        newAccountName: "X",
        contactFirst: "A",
        purpose: "Visit",
      }),
    ).toBe(true);
    expect(
      canSubmitSchedule({
        selectedAccountId: null,
        newAccountName: "X",
        contactFirst: "",
        purpose: "Visit",
      }),
    ).toBe(false);
  });
});
