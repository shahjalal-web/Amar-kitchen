'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';

export interface LatLng { lat: number; lng: number }

// ছবির ফাইল ছাড়া পিন (bundler-এ Leaflet-এর ডিফল্ট আইকন পাথ ভেঙে যায়)
const pinIcon = L.divIcon({
  className: '',
  html: '<div style="font-size:34px;line-height:34px;transform:translate(-50%,-100%);filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))">📍</div>',
  iconSize: [0, 0],
});

function ClickToPlace({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

// বাইরে থেকে কেন্দ্র বদলালে (এরিয়া বাছাই, "আমার অবস্থান") ম্যাপ সরে যায়
function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, Math.max(map.getZoom(), zoom)); }, [center[0], center[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function MapPickerInner({
  value, center, onChange, height = 260,
}: {
  value: LatLng | null;
  center: [number, number]; // [lat, lng]
  onChange: (p: LatLng) => void;
  height?: number;
}) {
  const focus: [number, number] = value ? [value.lat, value.lng] : center;
  return (
    <MapContainer center={focus} zoom={value ? 17 : 15} scrollWheelZoom={false} style={{ height, width: '100%' }} className="rounded-xl z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Recenter center={focus} zoom={value ? 17 : 15} />
      <ClickToPlace onPick={onChange} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pinIcon}
          draggable
          eventHandlers={{ dragend: (e) => { const p = (e.target as L.Marker).getLatLng(); onChange({ lat: p.lat, lng: p.lng }); } }}
        />
      )}
    </MapContainer>
  );
}
