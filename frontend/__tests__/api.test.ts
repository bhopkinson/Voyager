function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: jest.fn().mockResolvedValue(body),
  };
}

describe('api client', () => {
  const mockFetch = jest.fn();
  const originalApiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    jest.resetModules();
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  afterAll(() => {
    if (originalApiBase === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBase;
    }
  });

  it('fetches places with scalar and array query params', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([{ id: 1, name: 'Cafe' }]));
    const { fetchPlaces } = await import('@/lib/api');

    await expect(
      fetchPlaces({
        text_search: 'cafe',
        max_cost: 2,
        tags: ['coffee', 'views'],
        empty: '',
      }),
    ).resolves.toEqual([{ id: 1, name: 'Cafe' }]);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/places?text_search=cafe&max_cost=2&tags=coffee&tags=views',
      { cache: 'no-store' },
    );
  });

  it('posts JSON when creating a place', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://api.test';
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 10, name: 'Museum' }));
    const { createPlace } = await import('@/lib/api');

    await expect(createPlace({ name: 'Museum', cost: 0 })).resolves.toEqual({
      id: 10,
      name: 'Museum',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://api.test/places',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Museum', cost: 0 }),
      }),
    );
  });

  it('throws helpful errors for failed responses', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ detail: 'missing' }, false));
    const { fetchPlace } = await import('@/lib/api');

    await expect(fetchPlace(123)).rejects.toThrow('Failed to fetch place');
  });
});
