/**
 * Command Center account ledger helpers (pass 6).
 * Pure formatting/filter rules for mobile GET /accounts UI.
 */

export type WorkflowAccountLike = {
  id: string;
  name: string;
  accountType?: string | null;
  address?: string | null;
  ownerUserId?: string;
  territoryId?: string | null;
};

export function sortAccountsByName(
  accounts: readonly WorkflowAccountLike[],
): WorkflowAccountLike[] {
  return [...accounts].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export function filterAccountsByQuery(
  accounts: readonly WorkflowAccountLike[],
  query: string,
): WorkflowAccountLike[] {
  const q = query.trim().toLowerCase();
  if (!q) return sortAccountsByName(accounts);
  return sortAccountsByName(accounts).filter((a) => {
    const hay = [a.name, a.accountType, a.address, a.territoryId]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

/** Short label for list rows — no PHI; org-safe fields only. */
export function accountListSubtitle(account: WorkflowAccountLike): string {
  const type = (account.accountType || "Healthcare account").trim();
  const place = (account.address || "").trim();
  if (place) return `${type} · ${place}`;
  return type;
}

/**
 * Build POST /cycles account payload for existing ledger row vs new name.
 */
export function buildScheduleAccountPayload(input: {
  selectedAccount: WorkflowAccountLike | null;
  newAccountName: string;
  ownerUserId: string;
  contact: { id: string; firstName: string; lastName: string };
}): {
  account:
    | {
        id: string;
        name: string;
        accountType?: string;
        ownerUserId: string;
        contacts: [];
      }
    | {
        name: string;
        ownerUserId: string;
        contacts: Array<{
          id: string;
          firstName: string;
          lastName: string;
          isPrimary: true;
        }>;
      };
  contactIds: string[];
} {
  if (input.selectedAccount) {
    return {
      account: {
        id: input.selectedAccount.id,
        name: input.selectedAccount.name,
        ...(input.selectedAccount.accountType
          ? { accountType: input.selectedAccount.accountType }
          : {}),
        ownerUserId: input.selectedAccount.ownerUserId || input.ownerUserId,
        contacts: [],
      },
      contactIds: [],
    };
  }
  return {
    account: {
      name: input.newAccountName.trim(),
      ownerUserId: input.ownerUserId,
      contacts: [
        {
          id: input.contact.id,
          firstName: input.contact.firstName.trim(),
          lastName: input.contact.lastName.trim(),
          isPrimary: true,
        },
      ],
    },
    contactIds: [input.contact.id],
  };
}

export function canSubmitSchedule(input: {
  selectedAccountId: string | null;
  newAccountName: string;
  contactFirst: string;
  purpose: string;
}): boolean {
  if (!input.purpose.trim()) return false;
  if (input.selectedAccountId) return true;
  return Boolean(input.newAccountName.trim() && input.contactFirst.trim());
}
