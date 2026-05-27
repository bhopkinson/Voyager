import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import HomePage from '@/app/page';
import { fetchPlaces } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchPlaces: jest.fn(),
}));

describe('HomePage', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue([]),
    }) as unknown as typeof fetch;
    (fetchPlaces as jest.Mock).mockResolvedValue([]);
  });

  it('shows the empty state when no places are returned', async () => {
    render(<HomePage />);

    expect(await screen.findByText('No places found. Try adjusting filters or add a new place.')).toBeInTheDocument();
    expect(fetchPlaces).toHaveBeenCalledWith(
      expect.objectContaining({
        max_cost: 3,
        radius_km: 50,
      }),
    );
  });

  it('renders returned places', async () => {
    (fetchPlaces as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: 'Museum', location_summary: 'London', tags: ['culture'], cost: 0 },
    ]);

    render(<HomePage />);

    expect(await screen.findByText('Museum')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('culture')).toBeInTheDocument();
  });

  it('reloads places when filters change', async () => {
    render(<HomePage />);
    await waitFor(() => expect(fetchPlaces).toHaveBeenCalled());
    (fetchPlaces as jest.Mock).mockClear();

    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'museum' },
    });

    await waitFor(() => {
      expect(fetchPlaces).toHaveBeenLastCalledWith(
        expect.objectContaining({
          text_search: 'museum',
          max_cost: 3,
          radius_km: 50,
        }),
      );
    });
  });
});
