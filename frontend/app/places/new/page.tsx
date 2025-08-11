"use client";

import { createPlace } from '@/lib/api';
import PlaceForm from '@/components/PlaceForm';
import { useRouter } from 'next/navigation';

export default function NewPlacePage() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Add New Place</h1>
      <PlaceForm
        submitLabel="Create"
        onSubmit={async (values) => {
          const created = await createPlace(values);
          router.push(`/places/${created.id}`);
        }}
      />
    </div>
  );
}
