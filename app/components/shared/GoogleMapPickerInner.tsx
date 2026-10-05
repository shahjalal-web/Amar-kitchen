'use client';
import { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, Marker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { LatLng } from './MapPickerInner';

// আসল Google Map + Google-এর জায়গা/ঠিকানা সার্চ (Places API New)।
// key: NEXT_PUBLIC_GOOGLE_MAPS_KEY — Google Cloud-এ "Maps JavaScript API" আর "Places API (New)" চালু থাকতে হবে।
interface Props {
  apiKey: string;
  value: LatLng | null;
  center: [number, number]; // [lat, lng]
  onChange: (p: LatLng) => void;
  height?: number;
}

interface Suggestion { id: string; main: string; secondary: string; prediction: google.maps.places.PlacePrediction }

// বাইরে থেকে পিন/কেন্দ্র বদলালে ম্যাপ সেখানে সরে যায়
function FollowPoint({ focus, zoom }: { focus: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: focus[0], lng: focus[1] });
    if ((map.getZoom() ?? 0) < zoom) map.setZoom(zoom);
  }, [map, focus[0], focus[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// সার্চ বক্স: টাইপ করলে Google-এর সাজেশন, বাছলে সেই জায়গায় পিন
function PlaceSearch({ near, onPick }: { near: [number, number]; onPick: (p: LatLng) => void }) {
  const places = useMapsLibrary('places');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const picked = useRef(''); // বাছাইয়ের পর বক্সে নাম বসলে আবার সার্চ নয়

  useEffect(() => {
    if (!places || q.trim().length < 2 || q === picked.current) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      // এক সার্চ-সেশনে একটাই token — Google তাতে কম বিল করে
      if (!token.current) token.current = new places.AutocompleteSessionToken();
      try {
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q.trim(),
          sessionToken: token.current,
          includedRegionCodes: ['bd'],
          locationBias: { center: { lat: near[0], lng: near[1] }, radius: 20000 },
          language: 'bn',
        });
        if (cancelled) return;
        setItems(suggestions.flatMap((s) => {
          const p = s.placePrediction;
          return p ? [{ id: p.placeId, main: p.mainText?.toString() ?? p.text.toString(), secondary: p.secondaryText?.toString() ?? '', prediction: p }] : [];
        }));
        setOpen(true);
      } catch {
        if (!cancelled) setItems([]);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, places]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = async (s: Suggestion) => {
    setOpen(false);
    setItems([]);
    picked.current = s.main;
    setQ(s.main);
    try {
      const place = s.prediction.toPlace();
      await place.fetchFields({ fields: ['location'] });
      if (place.location) onPick({ lat: place.location.lat(), lng: place.location.lng() });
    } finally {
      token.current = null; // সেশন শেষ — পরের সার্চে নতুন token
    }
  };

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); if (e.target.value.trim().length < 2) { setItems([]); setOpen(false); } }}
        onFocus={() => items.length && setOpen(true)}
        placeholder="🔎 এলাকা, রাস্তা, দোকান বা বিল্ডিংয়ের নাম লিখে খুঁজুন"
        className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
      />
      {open && items.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {items.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => choose(s)} className="w-full text-left px-3 py-2.5 hover:bg-green-50">
                <span className="block text-sm text-stone-800">📍 {s.main}</span>
                {s.secondary && <span className="block text-xs text-stone-500">{s.secondary}</span>}
              </button>
            </li>
          ))}
          <li className="px-3 py-1.5 text-[10px] text-stone-400 text-right">Google দ্বারা</li>
        </ul>
      )}
    </div>
  );
}

export default function GoogleMapPickerInner({ apiKey, value, center, onChange, height = 300 }: Props) {
  const focus: [number, number] = value ? [value.lat, value.lng] : center;
  const zoom = value ? 17 : 15;
  return (
    <APIProvider apiKey={apiKey} language="bn" region="BD">
      <div className="space-y-2">
        <PlaceSearch near={focus} onPick={onChange} />
        <div style={{ height }} className="rounded-xl overflow-hidden">
          <Map
            defaultCenter={{ lat: focus[0], lng: focus[1] }}
            defaultZoom={zoom}
            gestureHandling="greedy"
            streetViewControl={false}
            mapTypeControl
            fullscreenControl={false}
            clickableIcons={false}
            onClick={(e) => { const p = e.detail.latLng; if (p) onChange({ lat: p.lat, lng: p.lng }); }}
          >
            <FollowPoint focus={focus} zoom={zoom} />
            {value && (
              <Marker
                position={value}
                draggable
                onDragEnd={(e) => { const p = e.latLng; if (p) onChange({ lat: p.lat(), lng: p.lng() }); }}
              />
            )}
          </Map>
        </div>
      </div>
    </APIProvider>
  );
}
