export function isCurrentCmsPolicy<T extends {
  source: string;
  retiredAt: Date | null;
  effectiveAt: Date | null;
}>(policy: T | null | undefined, now = new Date()): policy is T & { effectiveAt: Date } {
  return Boolean(policy && policy.source === "CMS_MCD" && !policy.retiredAt &&
    policy.effectiveAt && Number.isFinite(policy.effectiveAt.getTime()) && policy.effectiveAt <= now);
}
