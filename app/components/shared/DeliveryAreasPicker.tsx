'use client';
import { useEffect, useState } from 'react';
import {
  useCities, fetchThanas, fetchAreas, fetchAreaDetail, ThanaOption, AreaOption,
} from '../../lib/locations';

interface Props {
  value: string[];                       // নির্বাচিত areaId-গুলো
  onChange: (areaIds: string[]) => void;
}

const selectCls =
  'w-full border border-stone-300 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50';

// ডেলিভারি বয়ের একাধিক এরিয়া বাছাই: শহর → থানা → এরিয়া চেকবক্স; বাছাইকৃতগুলো চিপ হিসেবে দেখায়
export default function DeliveryAreasPicker({ value, onChange }: Props) {
  const { cities, loading } = useCities();
  const [cityId, setCityId] = useState('');
  const [thanaId, setThanaId] = useState('');
  const [thanas, setThanas] = useState<ThanaOption[]>([]);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});

  // আগে থেকে নির্বাচিত এরিয়ার নাম আনো
  useEffect(() => {
    const missing = value.filter((id) => !labels[id]);
    if (missing.length === 0) return;
    Promise.all(missing.map((id) => fetchAreaDetail(id).catch(() => null))).then((details) => {
      setLabels((prev) => {
        const next = { ...prev };
        details.forEach((d) => { if (d) next[d._id] = `${d.name} (${d.thana.name})`; });
        return next;
      });
    });
  }, [value, labels]);

  const pickCity = async (id: string) => {
    setCityId(id);
    setThanaId('');
    setAreas([]);
    setThanas(id ? await fetchThanas(id).catch(() => []) : []);
  };

  const pickThana = async (id: string) => {
    setThanaId(id);
    setAreas(id ? await fetchAreas(id).catch(() => []) : []);
  };

  const thanaName = thanas.find((t) => t._id === thanaId)?.name ?? '';

  const toggle = (a: AreaOption) => {
    if (value.includes(a._id)) {
      onChange(value.filter((x) => x !== a._id));
    } else {
      setLabels((prev) => ({ ...prev, [a._id]: `${a.name} (${thanaName})` }));
      onChange([...value, a._id]);
    }
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-800 text-xs px-2 py-1 rounded-full">
              {labels[id] ?? '...'}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== id))} className="text-green-600 hover:text-red-600" aria-label="সরান">×</button>
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select value={cityId} onChange={(e) => pickCity(e.target.value)} disabled={loading} className={selectCls}>
          <option value="">{loading ? 'লোড হচ্ছে...' : '— শহর —'}</option>
          {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={thanaId} onChange={(e) => pickThana(e.target.value)} disabled={!cityId} className={selectCls}>
          <option value="">— থানা —</option>
          {thanas.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </div>

      {thanaId && (
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-stone-200 rounded-lg p-3">
          {areas.map((a) => (
            <label key={a._id} className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input type="checkbox" checked={value.includes(a._id)} onChange={() => toggle(a)} className="w-4 h-4 accent-green-600" />
              {a.name} <span className="text-stone-400 text-xs">{a.zipCode}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
