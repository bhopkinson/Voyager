"use client";

import React from 'react';
import TagInput from './TagInput';

export type PlaceFormValues = {
  name: string;
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
    location: initial?.location ?? '',
    description: initial?.description ?? '',
    tags: initial?.tags ?? [],
    cost: initial?.cost ?? 0,
    google_maps_url: initial?.google_maps_url ?? '',
    website_url: initial?.website_url ?? '',
  });
  const [busy, setBusy] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({ ...values, tags: values.tags?.filter(Boolean) });
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input
          className={inputCls}
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Location</label>
        <input
          className={inputCls}
          placeholder="address or lat,lon"
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
