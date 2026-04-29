import React from 'react';

let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useGoogleMaps(): { ready: boolean; error: string | null } {
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      setError('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
      return;
    }
    if ((window as any).google?.maps) {
      setReady(true);
      return;
    }
    loadGoogleMapsScript(key)
      .then(() => setReady(true))
      .catch((e) => setError(e.message));
  }, []);

  return { ready, error };
}
