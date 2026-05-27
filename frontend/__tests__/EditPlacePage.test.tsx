import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import EditPlacePage from '@/app/places/[id]/edit/page';
import { fetchPlace, updatePlace } from '@/lib/api';
import { useRouter } from 'next/navigation';

jest.mock('@/lib/api', () => ({
  fetchPlace: jest.fn(),
  updatePlace: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('EditPlacePage', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue([]),
    }) as unknown as typeof fetch;
    (fetchPlace as jest.Mock).mockResolvedValue({
      id: 7,
      name: 'Existing Place',
      location: '51.500000,-0.100000',
      tags: ['coffee'],
      cost: 1,
    });
    (updatePlace as jest.Mock).mockResolvedValue({ id: 7 });
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  it('loads an existing place, updates it, and redirects', async () => {
    render(<EditPlacePage params={{ id: '7' }} />);

    expect(await screen.findByText('Edit Place')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => {
      expect(fetchPlace).toHaveBeenCalledWith(7);
      expect(updatePlace).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'Existing Place' }));
      expect(useRouter().push).toHaveBeenCalledWith('/places/7');
    });
  });
});
