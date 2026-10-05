'use client';
import { useEffect, useRef, useState } from 'react';
import {
  useCities, fetchThanas, fetchAreas, fetchAreaDetail, searchAreas,
  ThanaOption, AreaOption, AreaDetail, areaLabelBilingual,
} from '../../lib/locations';

interface LocationPickerProps {
  value: string;                                    // নির্বাচিত areaId ('' = কিছু না)
  onChange: (areaId: string, detail: AreaDetail | null) => void;
  showSearch?: boolean;                             // জিপ কোড/নাম দিয়ে খোঁজার বক্স
}

const selectCls =
  'w-full border border-stone-300 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50';

// শহর → থানা → এরিয়া ক্যাসকেডিং ড্রপডাউন + জিপ কোড সার্চ
export default function LocationPicker({ value, onChange, showSearch = true }: LocationPickerProps) {
  const { cities, loading: citiesLoading } = useCities();
  const [cityId, setCityId] = useState('');
  const [thanaId, setThanaId] = useState('');
  const [thanas, setThanas] = useState<ThanaOption[]>([]);
  const [areas, setAreas] = useState<AreaOption[]>([]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AreaDetail[]>([]);
  const [searching, setSearching] = useState(false);
  const syncedFor = useRef<string | null>(null);

  // বাইরে থেকে value এলে (যেমন সেভ করা ঠিকানা) শহর/থানা মিলিয়ে নাও
  useEffect(() => {
    if (!value || syncedFor.current === value) return;
    syncedFor.current = value;
    fetchAreaDetail(value).then(async (d) => {
      if (!d) return;
      const [t, a] = await Promise.all([fetchThanas(d.city._id), fetchAreas(d.thana._id)]);
      setCityId(d.city._id);
      setThanas(t);
      setThanaId(d.thana._id);
      setAreas(a);
    }).catch(() => {});
  }, [value]);

  const pickCity = async (id: string) => {
    setCityId(id);
    setThanaId('');
    setAreas([]);
    setThanas(id ? await fetchThanas(id).catch(() => []) : []);
    syncedFor.current = '';
    onChange('', null);
  };

  const pickThana = async (id: string) => {
    setThanaId(id);
    setAreas(id ? await fetchAreas(id).catch(() => []) : []);
    syncedFor.current = '';
    onChange('', null);
  };

  const pickArea = async (id: string) => {
    syncedFor.current = id;
    onChange(id, id ? await fetchAreaDetail(id).catch(() => null) : null);
  };

  // সার্চ ফলাফল থেকে বাছাই → তিনটি ড্রপডাউনই সেট হয়ে যায়
  const pickResult = async (a: AreaDetail) => {
    const [t, ar] = await Promise.all([fetchThanas(a.city._id), fetchAreas(a.thana._id)]);
    setCityId(a.city._id);
    setThanas(t);
    setThanaId(a.thana._id);
    setAreas(ar);
    setQuery('');
    setResults([]);
    syncedFor.current = a._id;
    onChange(a._id, a);
  };

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { Promise.resolve().then(() => setResults([])); return; }
    const t = setTimeout(() => {
      setSearching(true);
      searchAreas(q).then(setResults).catch(() => setResults([])).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="space-y-2">
      {showSearch && (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔎 জিপ কোড বা এলাকার নাম — বাংলা বা English (যেমন: 1216, কান্দিরপাড়, Mirpur)"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {(results.length > 0 || (searching && query.trim().length >= 2)) && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searching && results.length === 0 ? (
                <p className="px-3 py-2 text-sm text-stone-500">খোঁজা হচ্ছে...</p>
              ) : (
                results.map((a) => (
                  <button
                    key={a._id}
                    type="button"
                    onClick={() => pickResult(a)}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-green-50"
                  >
                    {areaLabelBilingual(a)}
                  </button>
                ))
              )}
            </div>
          )}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="text-xs text-stone-400 mt-1">কিছু পাওয়া যায়নি — নিচের ড্রপডাউন থেকে বাছুন।</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select value={cityId} onChange={(e) => pickCity(e.target.value)} disabled={citiesLoading} className={selectCls}>
          <option value="">{citiesLoading ? 'লোড হচ্ছে...' : '— শহর —'}</option>
          {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={thanaId} onChange={(e) => pickThana(e.target.value)} disabled={!cityId} className={selectCls}>
          <option value="">— থানা —</option>
          {thanas.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <select value={value} onChange={(e) => pickArea(e.target.value)} disabled={!thanaId} className={selectCls}>
          <option value="">— এরিয়া —</option>
          {areas.map((a) => <option key={a._id} value={a._id}>{a.name} ({a.zipCode})</option>)}
        </select>
      </div>
    </div>
  );
}
