'use client';
import { APIProvider, Map, Marker, Circle } from '@vis.gl/react-google-maps';
import toast from 'react-hot-toast';

export interface Coords {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  value: Coords | null;
  onChange: (coords: Coords) => void;
  radiusKm?: number;
  height?: number;
}

const DEFAULT_CENTER: Coords = { lat: 23.8103, lng: 90.4125 }; // ঢাকা

export default function MapPicker({ value, onChange, radiusKm, height = 300 }: MapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const center = value || DEFAULT_CENTER;

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('আপনার ব্রাউজার লোকেশন সাপোর্ট করে না');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast.error('লোকেশন নেওয়া যায়নি — পারমিশন দিন')
    );
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleCurrentLocation}
        className="mb-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
      >
        📍 বর্তমান লোকেশন নিন
      </button>

      {!apiKey || apiKey === 'your_google_maps_key' ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg p-4">
          ম্যাপ দেখানোর জন্য Google Maps API key সেট করা হয়নি। .env.local এ
          NEXT_PUBLIC_GOOGLE_MAPS_KEY যুক্ত করুন।
          {value && (
            <p className="mt-2 text-stone-600">
              নির্বাচিত লোকেশন: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            </p>
          )}
        </div>
      ) : (
        <APIProvider apiKey={apiKey}>
          <Map
            style={{ width: '100%', height }}
            defaultCenter={center}
            center={value ? center : undefined}
            defaultZoom={14}
            gestureHandling="greedy"
            disableDefaultUI={false}
            onClick={(e) => {
              if (e.detail.latLng) onChange(e.detail.latLng);
            }}
          >
            {value && (
              <>
                <Marker
                  position={value}
                  draggable
                  onDragEnd={(e) => {
                    if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                  }}
                />
                {radiusKm && (
                  <Circle
                    center={value}
                    radius={radiusKm * 1000}
                    fillColor="#16a34a"
                    fillOpacity={0.1}
                    strokeColor="#16a34a"
                    strokeOpacity={0.5}
                    strokeWeight={1}
                  />
                )}
              </>
            )}
          </Map>
        </APIProvider>
      )}
    </div>
  );
}
