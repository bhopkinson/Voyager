"use client";

import React from 'react';
import { useGoogleMaps } from '@/lib/useGoogleMaps';

type Props = {
  google_place_id?: string | null;
  location?: string | null;
  google_maps_url?: string | null;
};

function parseLatLon(location: string): { lat: number; lng: number } | null {
  const parts = location.split(',');
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

function addMarker(map: google.maps.Map, position: google.maps.LatLng | google.maps.LatLngLiteral) {
  try {
    // Use AdvancedMarkerElement if available (Maps JS v3.55+)
    const { AdvancedMarkerElement } = (google.maps as any).marker || {};
    if (AdvancedMarkerElement) {
      new AdvancedMarkerElement({ map, position });
      return;
    }
  } catch {
    // fall through
  }
  new google.maps.Marker({ map, position });
}

function FallbackLocation({ location, mapsUrl }: { location?: string | null; mapsUrl?: string | null }) {
  if (!location && !mapsUrl) return null;
  return (
    <div className="text-slate-700 text-sm py-1">
      {location && <span className="font-medium">{location}</span>}
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 underline text-blue-700 hover:text-blue-800"
        >
          Open in Google Maps
        </a>
      )}
    </div>
  );
}

export default function PlaceMap({ google_place_id, location, google_maps_url }: Props) {
  const { ready, error } = useGoogleMaps();
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [mapFailed, setMapFailed] = React.useState(false);
  const mapInstanceRef = React.useRef<google.maps.Map | null>(null);

  React.useEffect(() => {
    if (!ready || !mapRef.current) return;

    // Prevent re-init if nothing changed
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }

    const mapOptions: google.maps.MapOptions = {
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
    };

    if (google_place_id) {
      const map = new google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      const service = new google.maps.places.PlacesService(map);
      service.getDetails(
        { placeId: google_place_id, fields: ['geometry'] },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result?.geometry?.location) {
            map.setCenter(result.geometry.location);
            if (result.geometry.viewport) map.fitBounds(result.geometry.viewport);
            addMarker(map, result.geometry.location);
          } else {
            // Place ID failed — fall back to coordinates
            if (location) {
              const coords = parseLatLon(location);
              if (coords) {
                map.setCenter(coords);
                addMarker(map, coords);
              } else {
                setMapFailed(true);
              }
            } else {
              setMapFailed(true);
            }
          }
        }
      );
      return;
    }

    if (location) {
      const coords = parseLatLon(location);
      if (coords) {
        const map = new google.maps.Map(mapRef.current, { ...mapOptions, center: coords });
        mapInstanceRef.current = map;
        addMarker(map, coords);
        return;
      }
    }

    setMapFailed(true);
  }, [ready, google_place_id, location]);

  if (error || mapFailed) {
    return <FallbackLocation location={location} mapsUrl={google_maps_url} />;
  }

  if (!ready) {
    return <div className="w-full h-64 rounded-xl bg-slate-100 animate-pulse" />;
  }

  return <div ref={mapRef} className="w-full h-64 rounded-xl overflow-hidden border border-slate-200" />;
}
