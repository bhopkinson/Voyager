import { render, screen, waitFor } from '@testing-library/react';

import PlaceMap from '@/components/PlaceMap';
import { useGoogleMaps } from '@/lib/useGoogleMaps';

jest.mock('@/lib/useGoogleMaps', () => ({
  useGoogleMaps: jest.fn(),
}));

describe('PlaceMap', () => {
  beforeEach(() => {
    delete (window as any).google;
  });

  it('shows a loading placeholder before Google Maps is ready', () => {
    (useGoogleMaps as jest.Mock).mockReturnValue({ ready: false, error: null });
    const { container } = render(<PlaceMap location="51.5,-0.1" />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('falls back to text and map link when Google Maps fails', () => {
    (useGoogleMaps as jest.Mock).mockReturnValue({ ready: false, error: 'Missing key' });

    render(<PlaceMap location="51.5,-0.1" google_maps_url="https://maps.google.com/test" />);

    expect(screen.getByText('51.5,-0.1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open in Google Maps' })).toHaveAttribute(
      'href',
      'https://maps.google.com/test',
    );
  });

  it('creates a map and marker from coordinates when Google Maps is ready', async () => {
    const marker = jest.fn();
    const map = jest.fn();
    (window as any).google = {
      maps: {
        Map: map,
        Marker: marker,
      },
    };
    (useGoogleMaps as jest.Mock).mockReturnValue({ ready: true, error: null });

    render(<PlaceMap location="51.5,-0.1" />);

    await waitFor(() => {
      expect(map).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({ center: { lat: 51.5, lng: -0.1 } }),
      );
      expect(marker).toHaveBeenCalledWith(expect.objectContaining({ position: { lat: 51.5, lng: -0.1 } }));
    });
  });
});
