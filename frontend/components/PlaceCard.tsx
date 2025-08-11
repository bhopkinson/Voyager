import Link from 'next/link';

export type Place = {
  id: number;
  name: string;
  location?: string | null;
  description?: string | null;
  tags?: string[] | null;
  cost?: number | null;
  google_maps_url?: string | null;
  website_url?: string | null;
};

export default function PlaceCard({ place }: { place: Place }) {
  const costMap = ['Free', '£', '££', '£££'];
  const costLabel = place.cost != null ? costMap[place.cost] : '—';
  return (
    <Link
      href={`/places/${place.id}`}
      className="block bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">{place.name}</h3>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-50 border text-slate-700">{costLabel}</span>
      </div>
      {place.location && (
        <div className="mt-1 text-sm text-slate-600 line-clamp-1">{place.location}</div>
      )}
      {place.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {place.tags.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">{t}</span>
          ))}
        </div>
      ) : null}
      {(place.google_maps_url || place.website_url) && (
        <div className="mt-3 flex items-center gap-3 text-sm">
          {place.google_maps_url && (
            <a href={place.google_maps_url} onClick={(e) => e.stopPropagation()} className="underline text-blue-700 hover:text-blue-800" target="_blank" rel="noopener noreferrer">Maps</a>
          )}
          {place.website_url && (
            <a href={place.website_url} onClick={(e) => e.stopPropagation()} className="underline text-blue-700 hover:text-blue-800" target="_blank" rel="noopener noreferrer">Website</a>
          )}
        </div>
      )}
    </Link>
  );
}
