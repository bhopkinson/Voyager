export type Visit = {
  id: number;
  visit_date: string; // ISO
  rating?: number | null;
  notes?: string | null;
};

export default function VisitLog({ visit }: { visit: Visit }) {
  const date = new Date(visit.visit_date).toLocaleDateString();
  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
      <div className="text-sm text-slate-700">{date}</div>
      {visit.rating != null && (
        <div className="text-amber-600 text-sm">Rating: {visit.rating}/5</div>
      )}
      {visit.notes && <div className="text-sm mt-1 text-slate-800">{visit.notes}</div>}
    </div>
  );
}
