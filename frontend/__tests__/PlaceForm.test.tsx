import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import PlaceForm from '@/components/PlaceForm';

function okJson(body: unknown) {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue(body),
  };
}

describe('PlaceForm', () => {
  const mockFetch = jest.fn();
  const originalApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  beforeEach(() => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/tags')) {
        return Promise.resolve(okJson([]));
      }
      return Promise.resolve(okJson({}));
    });
    global.fetch = mockFetch as unknown as typeof fetch;
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    } else {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalApiKey;
    }
  });

  it('submits a trimmed payload with blank optional fields omitted', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(
      <PlaceForm initial={{ tags: ['coffee', ''] }} submitLabel="Create" onSubmit={onSubmit} />,
    );
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  Cafe  ' } });
    fireEvent.change(screen.getByLabelText('Location summary'), {
      target: { value: '  London  ' },
    });
    fireEvent.change(screen.getByLabelText('Location (lat,lon)'), {
      target: { value: ' 51.500000,-0.100000 ' },
    });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: '  Good coffee  ' } });
    fireEvent.change(screen.getByLabelText('Google Maps URL'), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByLabelText('Website URL'), {
      target: { value: ' https://example.com ' },
    });
    fireEvent.change(screen.getByLabelText('Cost'), { target: { value: '2' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cafe',
          location_summary: 'London',
          location: '51.500000,-0.100000',
          description: 'Good coffee',
          google_maps_url: undefined,
          website_url: 'https://example.com',
          tags: ['coffee'],
          cost: 2,
        }),
      );
    });
  });

  it('fills place details from Google Places autocomplete selection', async () => {
    jest.useFakeTimers();
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key';
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/tags')) {
        return Promise.resolve(okJson([]));
      }
      if (url.includes('places:autocomplete')) {
        return Promise.resolve(
          okJson({
            suggestions: [
              {
                placePrediction: {
                  placeId: 'abc123',
                  structuredFormat: {
                    mainText: { text: 'Test Cafe' },
                    secondaryText: { text: 'London' },
                  },
                  text: { text: 'Test Cafe, London' },
                },
              },
            ],
          }),
        );
      }
      if (url.includes('/places/abc123')) {
        return Promise.resolve(
          okJson({
            location: { latitude: 51.501, longitude: -0.141 },
            googleMapsUri: 'https://maps.google.com/test',
            websiteUri: 'https://test.example',
            addressComponents: [
              { types: ['postal_town'], shortText: 'London', longText: 'London' },
            ],
          }),
        );
      }
      return Promise.resolve(okJson({}));
    });

    render(<PlaceForm onSubmit={jest.fn()} />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/tags'), expect.anything()));

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Te' } });

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    fireEvent.click(await screen.findByText('Test Cafe'));

    await waitFor(() => {
      expect(screen.getByLabelText('Location summary')).toHaveValue('London');
      expect(screen.getByLabelText('Location (lat,lon)')).toHaveValue('51.501000,-0.141000');
      expect(screen.getByLabelText('Google Maps URL')).toHaveValue('https://maps.google.com/test');
      expect(screen.getByLabelText('Website URL')).toHaveValue('https://test.example');
    });

    jest.useRealTimers();
  });
});
