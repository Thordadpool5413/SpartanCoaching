export function platformAccountCopy(isAdministrator: boolean) {
  const accountLabel = isAdministrator ? "administrator account" : "workspace account";
  const accessLabel = isAdministrator ? "Platform administrator" : "Platform member";

  return {
    statusLabel: `${accessLabel} · no charge`,
    membershipBlurb: `${accessLabel} access is active. This account is not a customer subscription and is not billed.`,
    billingLabel: `${accessLabel} · no charge`,
    crossSurface: `Use the same ${accountLabel} on iPhone and web to continue with the same workspace access.`,
    appHandoff: `Sign in to Hospice Sales Pro with this ${accountLabel} to continue with the same workspace access.`,
    billingHeading: "Platform access",
    notBilled: "This platform account is not billed.",
    legalNote: `${accessLabel} access is role-based, is not billed, and works with the same sign-in on web and iPhone.`,
  } as const;
}
