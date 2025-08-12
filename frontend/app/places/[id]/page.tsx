"use client";

import React from 'react';
import { addVisit, fetchPlace, deletePlace } from '@/lib/api';
import VisitLog from '@/components/VisitLog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PlaceDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const router = useRouter();
  const [place, setPlace] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPlace(id);
      setPlace(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  if (loading) return <div>Loading...</div>;
  if (!place) return <div>Not found</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{place.name}</h1>
        <div className="space-x-2">
          <Link href={`/places/${id}/edit`} className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 border">Edit</Link>
          <button
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
            onClick={async () => { await deletePlace(id); router.push('/'); }}
          >Delete</button>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
        <div><span className="font-medium text-slate-700">Location: </span>{place.location ?? '—'}</div>
        <div className="text-slate-800 whitespace-pre-wrap">{place.description ?? ''}</div>
        {(place.google_maps_url || place.website_url) && (
          <div className="flex items-center gap-3 text-sm mt-2">
            {place.google_maps_url && (
              <a href={place.google_maps_url} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 hover:text-blue-800">Open in Google Maps</a>
            )}
            {place.website_url && (
              <a href={place.website_url} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 hover:text-blue-800">Website</a>
            )}
          </div>
        )}
        {place.tags?.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {place.tags.map((t: string) => <span key={t} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">{t}</span>)}
          </div>
        ) : null}
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Visits</h2>
        <AddVisitForm onAdd={async (values) => { await addVisit(id, values); await load(); }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {place.visits?.map((v: any) => <VisitLog key={v.id} visit={v} onChanged={load} />)}
        </div>
      </section>
    </div>
  );
}

function AddVisitForm({ onAdd }: { onAdd: (values: any) => Promise<void> }) {
  const [visit_date, setDate] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [rating, setRating] = React.useState<number | ''>('');
  const [notes, setNotes] = React.useState<string>('');
  const [busy, setBusy] = React.useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try { await onAdd({ visit_date, rating: rating === '' ? null : Number(rating), notes }); }
        finally { setBusy(false); }
      }}
      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-end shadow-sm"
    >
      <div>
        <label className="block text-sm text-slate-700">Date</label>
        <input type="date" value={visit_date} onChange={(e) => setDate(e.target.value)} className="rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm text-slate-700">Rating</label>
        <select value={rating} onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))} className="rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-2 py-1">
          <option value="">—</option>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm text-slate-700">Notes</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-2 py-1" />
      </div>
      <button disabled={busy} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Add Visit</button>
    </form>
  );
}
