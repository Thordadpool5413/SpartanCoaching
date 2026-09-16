export function normalizePhysicianNpi(value: unknown) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits || digits.length > 10) return '';
  return digits.padStart(10, '0');
}

export function physicianRelevance(specialtyRaw: unknown) {
  const specialty = String(specialtyRaw ?? '').trim().toLowerCase();
  if (/dermat|ophthalm|optometr|dent|patholog|radiolog|anesthes|orthopedic|podiatr/.test(specialty)) return 'Excluded';
  if (/oncolog|hematolog|palliative|geriatric|pulmon|cardiolog|nephrolog|neurolog/.test(specialty)) return 'Tier 1';
  if (/internal medicine|family practice|family medicine|hospitalist/.test(specialty)) return 'Tier 2';
  return 'Context';
}
