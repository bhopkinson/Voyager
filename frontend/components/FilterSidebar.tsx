"use client";

import React from 'react';
import TagInput from './TagInput';

export type Filters = {
  text_search?: string;
  max_cost?: number;
  tags?: string[];
  distance_from?: string; // "lat,lon"
  radius_km?: number;
};

export default function FilterSidebar({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (next: Filters) => void;
}) {
  const [useCurrentLocation, setUseCurrentLocation] = React.useState(false);

  React.useEffect(() => {
    if (!useCurrentLocation) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lon = pos.coords.longitude.toFixed(6);
      onChange({ ...value, distance_from: `${lat},${lon}` });
    });
  }, [useCurrentLocation, onChange, value]);

  const inputCls = "mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
  const cardCls = "w-full md:w-72 shrink-0 bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm";

  return (
    <aside className={cardCls}>
      <div>
        <label className="block text-sm font-medium text-slate-700">Search</label>
        <input
          className={inputCls}
          placeholder="text..."
          value={value.text_search ?? ''}
          onChange={(e) => onChange({ ...value, text_search: e.target.value })}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">Max Cost</label>
          <span className="text-xs text-slate-500">{value.max_cost ?? 3}</span>
        </div>
        <input
          type="range"
          min={0}
          max={3}
          value={value.max_cost ?? 3}
          onChange={(e) => onChange({ ...value, max_cost: Number(e.target.value) })}
          className="w-full accent-blue-600"
        />
        <div className="flex gap-1 text-xs text-slate-500">
          {[0,1,2,3].map(n => (
            <span key={n} className={`px-2 py-0.5 rounded ${n <= (value.max_cost ?? 3) ? 'bg-blue-50 text-blue-700' : 'bg-slate-50'}`}>{['Free','£','££','£££'][n]}</span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Tags</label>
        <TagInput value={value.tags ?? []} onChange={(tags) => onChange({ ...value, tags })} placeholder="Filter by tag..." />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Distance Filter</label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={useCurrentLocation} onChange={(e) => setUseCurrentLocation(e.target.checked)} />
          Use current location
        </label>
        <input
          className={inputCls}
          placeholder="lat,lon"
          value={value.distance_from ?? ''}
          onChange={(e) => onChange({ ...value, distance_from: e.target.value })}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700">Radius (km)</span>
          <input
            type="number"
            min={1}
            value={value.radius_km ?? 50}
            onChange={(e) => onChange({ ...value, radius_km: Number(e.target.value) })}
            className="w-28 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </aside>
  );
}
