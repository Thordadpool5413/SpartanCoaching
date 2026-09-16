import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReferralMarket from './ReferralMarket';
import type { DashboardData, Provider } from './types';

const mockGet = vi.hoisted(() => vi.fn());

vi.mock('./api', () => ({
  api: {
    get: mockGet,
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  mockGet.mockReset();
});

const provider: Provider = {
  ccn: '371653',
  name: 'Oklahoma Hospice Alpha',
  city: 'Tulsa',
  county: 'Tulsa',
  state: 'OK',
  zip: '74101',
};

const market: DashboardData = {
  generatedAt: '2026-09-16T00:00:00.000Z',
  state: 'OK',
  stateName: 'Oklahoma',
  focusCcn: provider.ccn,
  providers: [provider],
  counties: [],
  hospitals: [],
  snfs: [],
  sources: [],
  warnings: [],
  marketSummary: {},
  dataQuality: { status: 'healthy' },
};

describe('ReferralMarket physician workflow', () => {
  it('loads provider-scoped physicians and auto-opens a selected physician', async () => {
    mockGet.mockImplementation(async (path: string) => {
      if (path === '/api/physicians/OK?ccn=371653') return { data: { physicians: [{ npi: '0123456789', name: 'Dr. Ada', specialty: 'Oncology', city: 'Tulsa', county: 'Tulsa', beneficiaries: 42, score: 91, inServiceArea: true }], marketContext: { providerCcn: '371653' } } };
      if (path === '/api/physician/0123456789?state=OK&ccn=371653') return { data: { npi: '0123456789', profile: { name: 'Dr. Ada', specialty: 'Oncology', beneficiaries: 42 }, summary: { totalServices: 10 }, ranking: { score: 91 }, marketContext: { county: 'Tulsa', inServiceArea: true }, services: [] } };
      throw new Error(`Unexpected request: ${path}`);
    });

    render(<ReferralMarket state="OK" stateName="Oklahoma" market={market} provider={provider} selectedPhysicianNpi="0123456789" onSelectPhysician={() => undefined} />);
    fireEvent.click(screen.getByText('Physicians'));

    await waitFor(() => {
      expect(screen.getAllByText('Dr. Ada').length).toBeGreaterThan(0);
      expect(screen.getByText('IN FOOTPRINT')).toBeTruthy();
    });

    expect(mockGet).toHaveBeenCalledWith('/api/physicians/OK?ccn=371653');
    expect(mockGet).toHaveBeenCalledWith('/api/physician/0123456789?state=OK&ccn=371653');
  });

  it('clears stale physician detail when a new detail request fails', async () => {
    mockGet.mockImplementation(async (path: string) => {
      if (path === '/api/physicians/OK?ccn=371653') return { data: { physicians: [{ npi: '0123456789', name: 'Dr. Ada', specialty: 'Oncology', city: 'Tulsa', county: 'Tulsa', beneficiaries: 42, score: 91, inServiceArea: true }, { npi: '0987654321', name: 'Dr. Ben', specialty: 'Cardiology', city: 'Tulsa', county: 'Tulsa', beneficiaries: 30, score: 80, inServiceArea: false }] } };
      if (path === '/api/physician/0123456789?state=OK&ccn=371653') return { data: { npi: '0123456789', profile: { name: 'Dr. Ada', specialty: 'Oncology', beneficiaries: 42 }, summary: { totalServices: 12 }, services: [], caveat: 'Boundary.' } };
      if (path === '/api/physician/0987654321?state=OK&ccn=371653') throw new Error('Physician 360 failed');
      throw new Error(`Unexpected request: ${path}`);
    });

    render(<ReferralMarket state="OK" stateName="Oklahoma" market={market} provider={provider} onSelectPhysician={() => undefined} />);
    fireEvent.click(screen.getByText('Physicians'));

    await waitFor(() => {
      expect(screen.getAllByText('Dr. Ada').length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByText('Dr. Ada')[0]);

    await waitFor(() => {
      expect(screen.getByText('Boundary.')).toBeTruthy();
    });

    fireEvent.click(screen.getAllByText('Dr. Ben')[0]);

    await waitFor(() => {
      expect(screen.getByText('Physician 360 failed')).toBeTruthy();
      expect(screen.queryByText('Boundary.')).toBeNull();
    });
  });
});
