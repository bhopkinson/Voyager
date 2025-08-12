import React, { useState } from 'react';
import { updateVisit, deleteVisit } from '@/lib/api';
export type Visit = {
  id: number;
  visit_date: string; // ISO
  rating?: number | null;
  notes?: string | null;
};

export default function VisitLog({ visit, onChanged }: { visit: Visit; onChanged?: () => Promise<void> | void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [visitDate, setVisitDate] = useState<string>(visit.visit_date.slice(0, 10));
  const [rating, setRating] = useState<number | ''>(visit.rating ?? '');
  const [notes, setNotes] = useState<string>(visit.notes ?? '');
  const [busy, setBusy] = useState(false);

  const date = new Date(visit.visit_date).toLocaleDateString();

  async function handleSave() {
    setBusy(true);
    try {
      const payload: any = { visit_date: visitDate, rating: rating === '' ? null : Number(rating), notes };
      await updateVisit(visit.id, payload);
      setIsEditing(false);
      await onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this visit?')) return;
    setBusy(true);
    try {
      await deleteVisit(visit.id);
      await onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  if (isEditing) {
    return (
      <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm space-y-2">
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs text-slate-600">Date</label>
            <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="rounded-md border-slate-300 shadow-sm px-2 py-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Rating</label>
            <select value={rating} onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))} className="rounded-md border-slate-300 shadow-sm px-2 py-1">
              <option value="">—</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-slate-600">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm px-2 py-1" />
          </div>
        </div>
        <div className="flex gap-2">
          <button disabled={busy} onClick={handleSave} className="px-3 py-1.5 rounded-md bg-blue-600 text-white disabled:opacity-50">Save</button>
          <button disabled={busy} onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded-md border">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-700">{date}</div>
          {visit.rating != null && (
            <div className="text-amber-600 text-sm">Rating: {visit.rating}/5</div>
          )}
          {visit.notes && <div className="text-sm mt-1 text-slate-800">{visit.notes}</div>}
        </div>
        <div className="flex gap-1 shrink-0">
          <button disabled={busy} onClick={() => setIsEditing(true)} className="text-xs px-2 py-1 rounded-md border">Edit</button>
          <button disabled={busy} onClick={handleDelete} className="text-xs px-2 py-1 rounded-md border text-red-600">Delete</button>
        </div>
      </div>
    </div>
  );
}
