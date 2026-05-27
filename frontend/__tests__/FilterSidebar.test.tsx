import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import FilterSidebar, { type Filters } from '@/components/FilterSidebar';

describe('FilterSidebar', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue([]),
    });
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('emits search, cost, and distance filter changes', async () => {
    const value: Filters = { max_cost: 3, radius_km: 50 };
    const onChange = jest.fn();
    render(<FilterSidebar value={value} onChange={onChange} />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'museum' },
    });
    expect(onChange).toHaveBeenCalledWith({ ...value, text_search: 'museum' });

    fireEvent.change(screen.getByLabelText('Max Cost'), {
      target: { value: '1' },
    });
    expect(onChange).toHaveBeenCalledWith({ ...value, max_cost: 1 });

    fireEvent.change(screen.getByLabelText('Distance Filter'), {
      target: { value: '51.5,-0.1' },
    });
    expect(onChange).toHaveBeenCalledWith({ ...value, distance_from: '51.5,-0.1' });
  });

  it('can populate distance from current browser location', async () => {
    const value: Filters = { max_cost: 3, radius_km: 50 };
    const onChange = jest.fn();
    const getCurrentPosition = jest.fn((callback) => {
      callback({ coords: { latitude: 51.5, longitude: -0.1 } });
    });

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(<FilterSidebar value={value} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Use current location'));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        ...value,
        distance_from: '51.500000,-0.100000',
      });
    });
  });
});
