"use client";

import React from 'react';
import TagInput from './TagInput';

export type PlaceFormValues = {
  name: string;
  google_place_id?: string;
  location?: string;
  description?: string;
  tags?: string[];
  cost?: number;
  google_maps_url?: string;
  website_url?: string;
};

export default function PlaceForm({
  initial,
  onSubmit,
  submitLabel = 'Save',
}: {
  initial?: Partial<PlaceFormValues>;
  onSubmit: (values: PlaceFormValues) => Promise<void> | void;
  submitLabel?: string;
}) {
  const [values, setValues] = React.useState<PlaceFormValues>({
    name: initial?.name ?? '',
    google_place_id: (initial as any)?.google_place_id ?? '',
    location: initial?.location ?? '',
    description: initial?.description ?? '',
    tags: initial?.tags ?? [],
    cost: initial?.cost ?? 0,
    google_maps_url: initial?.google_maps_url ?? '',
    website_url: initial?.website_url ?? '',
  });
  const [busy, setBusy] = React.useState(false);
  const [predictions, setPredictions] = React.useState<any[]>([]);
  const [placesError, setPlacesError] = React.useState<string | null>(null);
  const debounceRef = React.useRef<any | null>(null);
  const sessionTokenRef = React.useRef<string>('');
  React.useEffect(() => {
    if (!sessionTokenRef.current) {
      try {
        // @ts-ignore
        const id = (globalThis?.crypto?.randomUUID?.() as string) || String(Date.now());
        sessionTokenRef.current = id;
      } catch {
        sessionTokenRef.current = String(Date.now());
      }
    }
  }, []);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const fieldMask = 'id,displayName,formattedAddress,location,googleMapsUri';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...values,
        name: values.name?.trim(),
        google_place_id: values.google_place_id?.trim() || undefined,
        location: values.location?.trim() || undefined,
        description: values.description?.trim() || undefined,
        google_maps_url: values.google_maps_url?.trim() || undefined,
        website_url: values.website_url?.trim() || undefined,
        tags: values.tags?.filter(Boolean) || undefined,
      };
      await onSubmit(payload);
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <div className="relative">
          <input
            className={inputCls}
            value={values.name}
            onChange={(e) => {
              const text = e.target.value;
              setValues({ ...values, name: text, google_place_id: '' });
              setPlacesError(null);
              if (debounceRef.current) clearTimeout(debounceRef.current);
              if (!text || text.length < 2) {
                setPredictions([]);
                return;
              }
              debounceRef.current = setTimeout(async () => {
                if (!apiKey) {
                  setPlacesError('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
                  return;
                }
                try {
                  const resp = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-Goog-Api-Key': apiKey,
                      'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.text',
                    },
                    body: JSON.stringify({
                      input: text,
                      sessionToken: sessionTokenRef.current,
                    }),
                  });
                  if (!resp.ok) {
                    setPlacesError(`Places API error ${resp.status}`);
                    setPredictions([]);
                    return;
                  }
                  const data = await resp.json();
                  const suggestions = (data?.suggestions || [])
                    .map((s: any) => s.placePrediction)
                    .filter(Boolean);
                  setPredictions(suggestions);
                } catch (err: any) {
                  setPlacesError('Failed to fetch suggestions');
                  setPredictions([]);
                }
              }, 250);
            }}
            required
          />
          {placesError && (
            <div className="mt-1 text-xs text-red-600">{placesError} (check API key and restrictions)</div>
          )}
          {predictions && predictions.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow">
              {predictions.map((p: any) => (
                <li
                  key={p.placeId}
                  className="cursor-pointer px-3 py-2 hover:bg-slate-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const mainText = p.structuredFormat?.mainText?.text || p.text?.text || '';
                    const placeId = p.placeId;
                    setValues((prev) => ({ ...prev, name: mainText, google_place_id: placeId }));
                    setPredictions([]);
                    // Fetch place details to auto-fill lat,lon and Google Maps URL
                    (async () => {
                      try {
                        const resp = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=en&regionCode=GB`, {
                          headers: {
                            'X-Goog-Api-Key': apiKey || '',
                            'X-Goog-FieldMask': fieldMask,
                          },
                        });
                        if (resp.ok) {
                          const data = await resp.json();
                          const lat = data?.location?.latitude;
                          const lon = data?.location?.longitude;
                          const mapsUri = data?.googleMapsUri;
                          setValues((prev) => ({
                            ...prev,
                            location: typeof lat === 'number' && typeof lon === 'number' ? `${lat.toFixed(6)},${lon.toFixed(6)}` : prev.location,
                            google_maps_url: mapsUri || prev.google_maps_url,
                          }));
                        }
                      } catch (err) {
                        // ignore detail fetch errors; user can fill manually
                      }
                    })();
                  }}
                >
                  <div className="text-sm font-medium text-slate-900">{p.structuredFormat?.mainText?.text || p.text?.text}</div>
                  <div className="text-xs text-slate-600">{p.structuredFormat?.secondaryText?.text}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Location (lat,lon)</label>
        <input
          className={inputCls}
          placeholder="12.345678,-98.765432"
          value={values.location}
          onChange={(e) => setValues({ ...values, location: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          className={inputCls}
          rows={4}
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Google Maps URL</label>
        <input
          className={inputCls}
          placeholder="https://maps.google.com/..."
          type="url"
          value={values.google_maps_url}
          onChange={(e) => setValues({ ...values, google_maps_url: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Website URL</label>
        <input
          className={inputCls}
          placeholder="https://example.com"
          type="url"
          value={values.website_url}
          onChange={(e) => setValues({ ...values, website_url: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Tags</label>
        <TagInput value={values.tags ?? []} onChange={(tags) => setValues({ ...values, tags })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Cost</label>
        <select
          className={inputCls}
          value={values.cost}
          onChange={(e) => setValues({ ...values, cost: Number(e.target.value) })}
        >
          <option value={0}>Free</option>
          <option value={1}>£</option>
          <option value={2}>££</option>
          <option value={3}>£££</option>
        </select>
      </div>
      <div className="pt-2">
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 disabled:opacity-50">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
