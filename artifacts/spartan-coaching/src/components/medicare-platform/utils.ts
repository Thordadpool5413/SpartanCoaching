import type { AnyRow } from './types';

export const finite = (value: unknown): number | null => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
export const num = (value: unknown, digits = 0) => finite(value) === null ? 'NR' : new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(Number(value));
export const pct = (value: unknown, digits = 1) => finite(value) === null ? 'NR' : `${Number(value).toFixed(digits)}%`;
export const money = (value: unknown) => finite(value) === null ? 'NR' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value));
export const clean = (value: unknown, fallback = 'NR') => String(value ?? '').trim() || fallback;
export const apiError = (error: unknown, fallback = 'Request failed.') => { const value = error as AnyRow; return String(value?.response?.data?.error || value?.response?.data?.message || value?.message || fallback); };
export const statusClass = (value: unknown) => String(value || 'limited').toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const today = () => new Date().toISOString().slice(0, 10);
export const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
export const stateName = (code: string) => STATES.find((state) => state.code === code)?.name || code;

export const STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['DC','District of Columbia'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']
].map(([code, name]) => ({ code, name }));

export function csvDownload(filename: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}
