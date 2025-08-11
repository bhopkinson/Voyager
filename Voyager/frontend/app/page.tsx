"use client";

import React from 'react';
import FilterSidebar, { Filters } from '@/components/FilterSidebar';
import PlaceCard from '@/components/PlaceCard';
import { fetchPlaces } from '@/lib/api';

export default function HomePage() {
  const [filters, setFilters] = React.useState<Filters>({ max_cost: 3, radius_km: 50 });
  const [places, setPlaces] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPlaces({
        text_search: filters.text_search,
        max_cost: filters.max_cost,
        tags: filters.tags,
        distance_from: filters.distance_from,
        radius_km: filters.radius_km,
      });
      setPlaces(data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <FilterSidebar value={filters} onChange={setFilters} />
      <div className="flex-1">
        {loading && <div className="text-slate-600">Loading...</div>}
        {!loading && places.length === 0 && (
          <div className="text-slate-600 bg-white border border-dashed rounded-xl p-8 text-center">
            No places found. Try adjusting filters or add a new place.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {!loading && places.map((p) => <PlaceCard key={p.id} place={p} />)}
        </div>
      </div>
    </div>
  );
}
