import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import NewPlacePage from '@/app/places/new/page';
import { createPlace } from '@/lib/api';
import { useRouter } from 'next/navigation';

jest.mock('@/lib/api', () => ({
  createPlace: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('NewPlacePage', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue([]),
    }) as unknown as typeof fetch;
    (createPlace as jest.Mock).mockResolvedValue({ id: 42 });
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  it('creates a place and navigates to the detail page', async () => {
    render(<NewPlacePage />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Cafe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(createPlace).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Cafe' }));
      expect(useRouter().push).toHaveBeenCalledWith('/places/42');
    });
  });
});
