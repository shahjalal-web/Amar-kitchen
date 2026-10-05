'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Loader from '../ui/Loader';
import type { LatLng } from './MapPickerInner';
import { AreaDetail, searchAreas, areaLabelBilingual } from '../../lib/locations';

export type { LatLng };

// Leaflet ব্রাউজার ছাড়া চলে না, আর ভারী — তাই শুধু ম্যাপ খুললে লোড হয়
const MapPickerInner = dynamic(() => import('./MapPickerInner'), {
  ssr: false,
  loading: () => <div className="h-65 grid place-items-center bg-stone-50 rounded-xl"><Loader size="sm" label="ম্যাপ আসছে…" /></div>,
});

const GoogleMapPickerInner = dynamic(() => import('./GoogleMapPickerInner'), {
  ssr: false,
  loading: () => <div className="h-75 grid place-items-center bg-stone-50 rounded-xl"><Loader size="sm" label="Google ম্যাপ আসছে…" /></div>,
});

// আসল Google key দেখতে "AIza…" (৩৯ অক্ষর)। না থাকলে/ভুল হলে ফ্রি OpenStreetMap ম্যাপ + এরিয়া সার্চ।
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';
const HAS_GOOGLE_KEY = /^AIza[\w-]{30,}$/.test(GOOGLE_KEY);
let googleFailed = false; // key ভুল/বিলিং বন্ধ হলে Google gm_authFailure ডাকে — তখন সব ম্যাপ ফ্রি ম্যাপে চলে যায়

const CUMILLA: [number, number] = [23.4607, 91.1809];

// ফ্রি ম্যাপের জন্য সার্চ: আমাদের এরিয়া তালিকা (বাংলা/English/জিপ কোড) — বাছলে সেই এরিয়ার কেন্দ্রে পিন
function AreaSearch({ onPick }: { onPick: (p: LatLng) => void }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<AreaDetail[]>([]);
  const [picked, setPicked] = useState(''); // বাছাইয়ের পর বক্সে নাম বসলে আবার সার্চ নয়
  useEffect(() => {
    const query = q.trim();
    let cancelled = false;
    const t = setTimeout(() => {
      if (query.length < 2 || query === picked) { if (!cancelled) setItems([]); return; }
      searchAreas(query).then((list) => { if (!cancelled) setItems(list.filter((a) => a.location?.coordinates).slice(0, 8)); }).catch(() => {});
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, picked]);
  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔎 এলাকার নাম বা জিপ কোড লিখে ম্যাপে খুঁজুন (যেমন: কান্দিরপাড়, Mirpur, 3500)"
        className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
      />
      {items.length > 0 && (
        <ul className="absolute z-500 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {items.map((a) => (
            <li key={a._id}>
              <button
                type="button"
                onClick={() => { const [lng, lat] = a.location!.coordinates; setItems([]); setPicked(a.name); setQ(a.name); onPick({ lat, lng }); }}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-green-50"
              >
                📍 {areaLabelBilingual(a)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// "আমার বর্তমান অবস্থান": বাংলাদেশের সীমানা, কতক্ষণ খুঁজবে, কোন নির্ভুলতা ভালো/গ্রহণযোগ্য
const BD = { minLat: 20.5, maxLat: 26.8, minLng: 88.0, maxLng: 92.8 };
const LOCATE_MS = 12000;
const GOOD_M = 50;        // এর মধ্যে হলে সাথে সাথে বসাই
const MAX_ACCEPT_M = 1500; // এর বেশি আনুমানিক হলে পিন বসাই না

// GeoJSON [lng, lat] ↔ { lat, lng }
export const toLatLng = (p?: { coordinates?: number[] } | null): LatLng | null =>
  p?.coordinates?.length === 2 ? { lat: p.coordinates[1], lng: p.coordinates[0] } : null;

export const mapsLink = (p: LatLng) => `https://www.google.com/maps?q=${p.lat},${p.lng}`;

export interface NearestAreaResult {
  area: AreaDetail;
  distanceKm: number;
  candidates: { _id: string; name: string; distanceKm: number }[];
}

// পিন বসানোর পর কোন এরিয়া হবে: এরিয়ার কেন্দ্র আনুমানিক, তাই বাছাই করা এরিয়াটা যদি
// সবচেয়ে কাছেরটার চেয়ে ৫০০ মিটারের বেশি দূরে না হয় তাহলে সেটাই রাখি (সীমানার কাছে উল্টাপাল্টা না হতে)।
// null = যা আছে তাই থাকবে
export const SAME_AREA_SLACK_KM = 0.5;
export const areaForPin = (currentAreaId: string, r: NearestAreaResult): AreaDetail | null => {
  if (r.area._id === currentAreaId) return null;
  const current = r.candidates.find((c) => c._id === currentAreaId);
  if (current && current.distanceKm <= r.distanceKm + SAME_AREA_SLACK_KM) return null;
  return r.area;
};

// ম্যাপে লোকেশন বসানো (ঐচ্ছিক)। পিন বসালে সবচেয়ে কাছের এরিয়া খুঁজে onAreaDetected-এ জানায়।
export default function MapPicker({
  value, onChange, areaCenter, onAreaDetected, title = '🗺️ ম্যাপে লোকেশন দিন', hint, defaultOpen = false,
}: {
  value: LatLng | null;
  onChange: (p: LatLng | null) => void;
  areaCenter?: [number, number] | null; // [lng, lat] — নির্বাচিত এরিয়ার কেন্দ্র
  onAreaDetected?: (result: NearestAreaResult) => void;
  title?: string;
  hint?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || !!value);
  const [locating, setLocating] = useState(false);
  const [useGoogle, setUseGoogle] = useState(HAS_GOOGLE_KEY && !googleFailed);

  // Google key কাজ না করলে (ভুল key, বিলিং বন্ধ, API চালু নেই) ফ্রি ম্যাপে ফিরে যাই
  useEffect(() => {
    if (!useGoogle) return;
    const w = window as unknown as { gm_authFailure?: () => void };
    w.gm_authFailure = () => {
      googleFailed = true;
      setUseGoogle(false);
      console.error('Google Maps key কাজ করছে না — OpenStreetMap ম্যাপ দেখানো হচ্ছে');
      toast('Google ম্যাপ চালু হয়নি — বিকল্প ম্যাপ দেখানো হচ্ছে', { icon: 'ℹ️' });
    };
  }, [useGoogle]);
  const center: [number, number] = areaCenter ? [areaCenter[1], areaCenter[0]] : CUMILLA;

  const place = async (p: LatLng) => {
    const rounded = { lat: Math.round(p.lat * 1e6) / 1e6, lng: Math.round(p.lng * 1e6) / 1e6 };
    onChange(rounded);
    if (!onAreaDetected) return;
    try {
      const r = await api.get('/locations/areas/nearest', { params: rounded });
      if (r.data.data?.area) onAreaDetected(r.data.data as NearestAreaResult);
    } catch { /* এরিয়া না পেলে ব্যবহারকারী নিজে বাছবেন */ }
  };

  // একবারের জন্য বর্তমান অবস্থান — শুধু পিন বসাতে, কোথাও ট্র্যাক বা সেভ হয় না যতক্ষণ না ঠিকানা সেভ করেন
  const locate = () => {
    if (!navigator.geolocation) return toast.error('এই ব্রাউজারে লোকেশন পাওয়া যায় না');
    setLocating(true);
    // কম্পিউটারে GPS থাকে না — ব্রাউজার Wi-Fi/IP থেকে আন্দাজ করে, VPN থাকলে অন্য দেশও দেখায়।
    // তাই একবারের উত্তরে ভরসা না করে কয়েক সেকেন্ড ধরে রিডিং নিই, বাংলাদেশের ভেতরের সবচেয়ে নিখুঁতটা রাখি,
    // আর খুব আনুমানিক হলে পিন না বসিয়ে ব্যবহারকারীকে নিজে বসাতে বলি।
    let best: GeolocationPosition | null = null;
    let outside = 0;
    let finished = false;
    const finish = (watchId: number, timer: ReturnType<typeof setTimeout>) => {
      if (finished) return;
      finished = true;
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      setLocating(false);
      if (!best) {
        toast.error(outside
          ? 'আপনার ডিভাইস বাংলাদেশের বাইরের লোকেশন দিচ্ছে (VPN চালু থাকলে বন্ধ করুন) — ম্যাপে চাপ দিয়ে পিন বসান'
          : 'লোকেশন পাওয়া যায়নি — ম্যাপে চাপ দিয়ে পিন বসান');
        return;
      }
      const acc = Math.round(best.coords.accuracy);
      if (acc > MAX_ACCEPT_M) {
        toast.error(`লোকেশন অনেক আনুমানিক (±${(acc / 1000).toFixed(1)} কিমি) — মোবাইলে GPS চালু করে চেষ্টা করুন অথবা ম্যাপে নিজে পিন বসান`);
        return;
      }
      place({ lat: best.coords.latitude, lng: best.coords.longitude });
      if (acc > GOOD_M) toast(`লোকেশন আনুমানিক (±${acc} মিটার) — পিনটা টেনে ঠিক জায়গায় বসান`, { icon: 'ℹ️' });
    };
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        if (lat < BD.minLat || lat > BD.maxLat || lng < BD.minLng || lng > BD.maxLng) { outside++; return; }
        if (!best || accuracy < best.coords.accuracy) best = pos;
        if (accuracy <= GOOD_M) finish(watchId, timer); // যথেষ্ট নিখুঁত — আর অপেক্ষা নয়
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          finish(watchId, timer);
          toast.error('লোকেশনের অনুমতি দেওয়া হয়নি — ব্রাউজারের সেটিংস থেকে অনুমতি দিন বা ম্যাপে পিন বসান');
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: LOCATE_MS }
    );
    const timer = setTimeout(() => finish(watchId, timer), LOCATE_MS);
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left border border-dashed border-green-400 bg-green-50/60 hover:bg-green-50 rounded-xl px-3 py-2.5">
        <span className="text-sm font-medium text-green-800">{title} <span className="font-normal text-stone-500">(ঐচ্ছিক)</span></span>
        {hint && <span className="block text-xs text-stone-500 mt-0.5">{hint}</span>}
      </button>
    );
  }

  return (
    <div className="border border-green-200 rounded-xl p-2 space-y-2 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-sm font-medium text-stone-700">{title}</p>
        <div className="flex gap-2">
          <button type="button" onClick={locate} disabled={locating} className="text-xs font-medium bg-green-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
            {locating ? '📡 নিখুঁত লোকেশন খোঁজা হচ্ছে…' : '🎯 আমার বর্তমান অবস্থান'}
          </button>
          {value && <button type="button" onClick={() => onChange(null)} className="text-xs text-red-600 px-2">পিন মুছুন</button>}
        </div>
      </div>
      {useGoogle ? (
        <GoogleMapPickerInner apiKey={GOOGLE_KEY} value={value} center={center} onChange={place} />
      ) : (
        <>
          <AreaSearch onPick={place} />
          <MapPickerInner value={value} center={center} onChange={place} />
        </>
      )}
      <p className="text-xs text-stone-500 px-1">
        {value ? '✅ পিন বসানো হয়েছে — দরকার হলে টেনে সরান।' : 'ম্যাপে বাসার জায়গায় চাপ দিন।'} {hint}
      </p>
    </div>
  );
}
