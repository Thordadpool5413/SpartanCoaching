import { describe, expect, it } from 'vitest';
import { normalizePhysicianNpi, physicianRelevance } from './physicianData';

describe('normalizePhysicianNpi', () => {
  it('preserves ten-digit NPIs and pads trimmed NPIs', () => {
    expect(normalizePhysicianNpi('1234567890')).toBe('1234567890');
    expect(normalizePhysicianNpi('123456789')).toBe('0123456789');
    expect(normalizePhysicianNpi(' 0123456789 ')).toBe('0123456789');
  });

  it('rejects empty or oversized identifiers', () => {
    expect(normalizePhysicianNpi('')).toBe('');
    expect(normalizePhysicianNpi('12345678901')).toBe('');
  });
});

describe('physicianRelevance', () => {
  it('classifies hospice-relevant specialties consistently', () => {
    expect(physicianRelevance('Medical Oncology')).toBe('Tier 1');
    expect(physicianRelevance('Family Medicine')).toBe('Tier 2');
    expect(physicianRelevance('Dermatology')).toBe('Excluded');
    expect(physicianRelevance('General Surgery')).toBe('Context');
  });
});
