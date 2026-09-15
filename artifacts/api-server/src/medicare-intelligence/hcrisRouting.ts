export type ParentFormRoute = {
  providerBasis: 'hospital-based' | 'home-health-based' | 'snf-based' | 'based-provider';
  parentForm: string;
  status: 'PARENT FORM AVAILABLE';
  nextStep: string;
};

export function resolveParentFormRoute(providerTypeRaw: string): ParentFormRoute | null {
  const providerType = String(providerTypeRaw || '').trim();
  const normalized = providerType.toLowerCase();
  if (!normalized || !/hospital|home health|\bhha\b|skilled nursing|\bsnf\b|based/.test(normalized)) return null;
  if (/hospital/.test(normalized)) return { providerBasis: 'hospital-based', parentForm: 'CMS-2552-10', status: 'PARENT FORM AVAILABLE', nextStep: 'Use the hospital parent-provider cost report route so based-provider economics stay normalized instead of falling back to freestanding hospice-only forms.' };
  if (/home health|\bhha\b/.test(normalized)) return { providerBasis: 'home-health-based', parentForm: 'CMS-1728-20', status: 'PARENT FORM AVAILABLE', nextStep: 'Use the home-health parent-provider cost report route so based-provider economics stay normalized instead of falling back to freestanding hospice-only forms.' };
  if (/skilled nursing|\bsnf\b/.test(normalized)) return { providerBasis: 'snf-based', parentForm: 'CMS-2540-10', status: 'PARENT FORM AVAILABLE', nextStep: 'Use the skilled-nursing parent-provider cost report route so based-provider economics stay normalized instead of falling back to freestanding hospice-only forms.' };
  return { providerBasis: 'based-provider', parentForm: 'Parent provider cost report', status: 'PARENT FORM AVAILABLE', nextStep: 'Use the applicable parent-provider cost report route before asserting normalized economics for this based provider.' };
}
