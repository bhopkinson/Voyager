const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function toQuery(params: Record<string, any>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null || v === '') return;
    if (Array.isArray(v)) {
      v.forEach((item) => search.append(k, String(item)));
    } else {
      search.append(k, String(v));
    }
  });
  const s = search.toString();
  return s ? `?${s}` : '';
}

export async function fetchPlaces(params: any = {}) {
  const res = await fetch(`${API_BASE}/places${toQuery(params)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch places');
  return res.json();
}

export async function fetchPlace(id: number) {
  const res = await fetch(`${API_BASE}/places/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch place');
  return res.json();
}

export async function createPlace(data: any) {
  const res = await fetch(`${API_BASE}/places`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create place');
  return res.json();
}

export async function updatePlace(id: number, data: any) {
  const res = await fetch(`${API_BASE}/places/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update place');
  return res.json();
}

export async function deletePlace(id: number) {
  const res = await fetch(`${API_BASE}/places/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete place');
  return true;
}

export async function addVisit(placeId: number, data: any) {
  const res = await fetch(`${API_BASE}/places/${placeId}/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add visit');
  return res.json();
}

export async function updateVisit(visitId: number, data: any) {
  const res = await fetch(`${API_BASE}/visits/${visitId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update visit');
  return res.json();
}

export async function deleteVisit(visitId: number) {
  const res = await fetch(`${API_BASE}/visits/${visitId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete visit');
  return true;
}