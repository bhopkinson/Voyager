"use client";

import { fetchPlace, updatePlace } from '@/lib/api';
import PlaceForm from '@/components/PlaceForm';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditPlacePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const router = useRouter();
  const [place, setPlace] = useState<any | null>(null);

  useEffect(() => {
    fetchPlace(id).then(setPlace);
  }, [id]);

  if (!place) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Place</h1>
      <PlaceForm
        initial={place}
        submitLabel="Update"
        onSubmit={async (values) => {
          const updated = await updatePlace(id, values);
          router.push(`/places/${updated.id}`);
        }}
      />
    </div>
  );
}
