import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import PlaceDetailPage from '@/app/places/[id]/page';
import { addVisit, deletePlace, fetchPlace } from '@/lib/api';
import { useRouter } from 'next/navigation';

jest.mock('@/components/PlaceMap', () => ({
  __esModule: true,
  default: () => <div data-testid="place-map" />,
}));

jest.mock('@/lib/api', () => ({
  addVisit: jest.fn(),
  deletePlace: jest.fn(),
  deleteVisit: jest.fn(),
  fetchPlace: jest.fn(),
  updateVisit: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const place = {
  id: 7,
  name: 'Detail Place',
  location_summary: 'London',
  location: '51.500000,-0.100000',
  description: 'A good place',
  tags: ['coffee'],
  google_maps_url: 'https://maps.google.com/detail',
  website_url: 'https://detail.example',
  visits: [{ id: 3, visit_date: '2026-05-27', rating: 4, notes: 'Nice' }],
};

describe('PlaceDetailPage', () => {
  beforeEach(() => {
    (fetchPlace as jest.Mock).mockResolvedValue(place);
    (addVisit as jest.Mock).mockResolvedValue({ id: 4 });
    (deletePlace as jest.Mock).mockResolvedValue(true);
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  it('renders place details and visits', async () => {
    render(<PlaceDetailPage params={{ id: '7' }} />);

    expect(await screen.findByText('Detail Place')).toBeInTheDocument();
    expect(screen.getByText('A good place')).toBeInTheDocument();
    expect(screen.getByText('coffee')).toBeInTheDocument();
    expect(screen.getByText('Rating: 4/5')).toBeInTheDocument();
    expect(screen.getByTestId('place-map')).toBeInTheDocument();
  });

  it('deletes a place and redirects home', async () => {
    render(<PlaceDetailPage params={{ id: '7' }} />);
    await screen.findByText('Detail Place');

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    await waitFor(() => {
      expect(deletePlace).toHaveBeenCalledWith(7);
      expect(useRouter().push).toHaveBeenCalledWith('/');
    });
  });

  it('adds a visit and reloads place details', async () => {
    render(<PlaceDetailPage params={{ id: '7' }} />);
    await screen.findByText('Detail Place');
    (fetchPlace as jest.Mock).mockClear();

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-06-01' } });
    fireEvent.change(screen.getByLabelText('Rating'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Loved it' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Visit' }));

    await waitFor(() => {
      expect(addVisit).toHaveBeenCalledWith(7, {
        visit_date: '2026-06-01',
        rating: 5,
        notes: 'Loved it',
      });
      expect(fetchPlace).toHaveBeenCalledWith(7);
    });
  });
});
