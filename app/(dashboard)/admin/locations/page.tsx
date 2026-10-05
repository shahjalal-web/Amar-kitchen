'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { getErrorMessage } from '../../../lib/errors';
import { CityOption, ThanaOption, AreaOption } from '../../../lib/locations';

const inputCls = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400';
const smallBtn = 'text-xs font-medium disabled:opacity-50';

// ─── এক লাইনের নাম-সম্পাদনাযোগ্য আইটেম (শহর/থানা) ─────────
function NameRow({
  name, nameEn, isActive, selected, onSelect, onSave, onToggle,
}: {
  name: string;
  nameEn?: string;
  isActive: boolean;
  selected: boolean;
  onSelect: () => void;
  onSave: (v: { name: string; nameEn: string }) => Promise<boolean>;
  onToggle: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [valueEn, setValueEn] = useState(nameEn ?? '');

  if (editing) {
    return (
      <div className="space-y-2 p-2 rounded-lg bg-purple-50">
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="বাংলা নাম" className={inputCls} autoFocus />
        <input value={valueEn} onChange={(e) => setValueEn(e.target.value)} placeholder="English name" className={inputCls} />
        <div className="flex gap-2">
          <button onClick={async () => { if (await onSave({ name: value, nameEn: valueEn })) setEditing(false); }} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg">সেভ</button>
          <button onClick={() => { setValue(name); setValueEn(nameEn ?? ''); setEditing(false); }} className="text-xs text-stone-500 px-1">বাতিল</button>
        </div>
      </div>
    );
  }
  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer border ${
        selected ? 'border-purple-400 bg-purple-50' : 'border-transparent hover:bg-stone-50'
      }`}
    >
      <div className="min-w-0">
        <p className={`text-sm truncate ${isActive ? 'text-stone-800' : 'text-stone-400 line-through'}`}>{name}</p>
        <p className="text-[11px] text-stone-400 truncate">{nameEn || '⚠️ ইংরেজি নাম নেই'}</p>
      </div>
      <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setValue(name); setValueEn(nameEn ?? ''); setEditing(true); }} className={`${smallBtn} text-purple-600`}>সম্পাদনা</button>
        <button onClick={onToggle} className={`${smallBtn} ${isActive ? 'text-orange-600' : 'text-green-600'}`}>{isActive ? 'বন্ধ' : 'চালু'}</button>
      </div>
    </div>
  );
}

// ─── এরিয়া সারি (নাম, জিপ, lat/lng) ──────────────────────
interface AreaForm { name: string; nameEn: string; zipCode: string; lat: string; lng: string }
const areaToForm = (a?: AreaOption): AreaForm => ({
  name: a?.name ?? '',
  nameEn: a?.nameEn ?? '',
  zipCode: a?.zipCode ?? '',
  lat: a?.location?.coordinates ? String(a.location.coordinates[1]) : '',
  lng: a?.location?.coordinates ? String(a.location.coordinates[0]) : '',
});

// Google Maps থেকে কপি করা "23.7465, 90.3760" পেস্ট করলে lat/lng দুই ঘরে ভাগ হয়ে যায়
const parseLatLng = (text: string) => {
  const m = text.match(/(-?\d{1,2}\.\d+)\s*[,\s]\s*(-?\d{1,3}\.\d+)/);
  return m ? { lat: m[1], lng: m[2] } : null;
};

function AreaFields({ value, onChange, context }: { value: AreaForm; onChange: (v: AreaForm) => void; context: string }) {
  const set = (k: keyof AreaForm, v: string) => onChange({ ...value, [k]: v });
  const onCoordInput = (k: 'lat' | 'lng', v: string) => {
    const both = parseLatLng(v);
    if (both) onChange({ ...value, ...both });
    else set(k, v);
  };
  const query = [value.nameEn || value.name, context].filter(Boolean).join(', ');
  const hasCoords = value.lat.trim() !== '' && value.lng.trim() !== '';
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <input value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="বাংলা নাম" className={inputCls} />
        <input value={value.nameEn} onChange={(e) => set('nameEn', e.target.value)} placeholder="English name" className={inputCls} />
        <input value={value.zipCode} onChange={(e) => set('zipCode', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="জিপ কোড" inputMode="numeric" className={`${inputCls} col-span-2 sm:col-span-1`} />
        <input value={value.lat} onChange={(e) => onCoordInput('lat', e.target.value)} placeholder="অক্ষাংশ (lat) বা পুরো কোঅর্ডিনেট পেস্ট" inputMode="decimal" className={`${inputCls} col-span-2 sm:col-span-1`} />
        <input value={value.lng} onChange={(e) => onCoordInput('lng', e.target.value)} placeholder="দ্রাঘিমাংশ (lng)" inputMode="decimal" className={`${inputCls} col-span-2 sm:col-span-1`} />
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {(value.name || value.nameEn) && (
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            🗺️ Google Maps-এ খুঁজুন (রাইট-ক্লিক করে কোঅর্ডিনেট কপি করুন)
          </a>
        )}
        {hasCoords && (
          <a href={`https://www.google.com/maps?q=${value.lat},${value.lng}`} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">
            📍 বর্তমান কোঅর্ডিনেট ম্যাপে যাচাই করুন
          </a>
        )}
      </div>
    </div>
  );
}

const areaPayload = (f: AreaForm) => ({
  name: f.name.trim(),
  nameEn: f.nameEn.trim(),
  zipCode: f.zipCode.trim(),
  lat: f.lat.trim() === '' ? null : Number(f.lat),
  lng: f.lng.trim() === '' ? null : Number(f.lng),
});

export default function AdminLocationsPage() {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [thanas, setThanas] = useState<ThanaOption[]>([]);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [cityId, setCityId] = useState('');
  const [thanaId, setThanaId] = useState('');

  const [newCity, setNewCity] = useState('');
  const [newCityEn, setNewCityEn] = useState('');
  const [newThana, setNewThana] = useState('');
  const [newThanaEn, setNewThanaEn] = useState('');
  const [newArea, setNewArea] = useState<AreaForm>(areaToForm());
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaEdit, setAreaEdit] = useState<AreaForm>(areaToForm());
  const [areaSearch, setAreaSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const loadCities = useCallback(() =>
    api.get('/locations/admin/cities').then((r) => setCities(r.data.data)).catch(() => toast.error('শহর লোড ব্যর্থ')), []);
  const loadThanas = useCallback((id: string) =>
    api.get('/locations/admin/thanas', { params: { cityId: id } }).then((r) => setThanas(r.data.data)).catch(() => toast.error('থানা লোড ব্যর্থ')), []);
  const loadAreas = useCallback((id: string) =>
    api.get('/locations/admin/areas', { params: { thanaId: id } }).then((r) => setAreas(r.data.data)).catch(() => toast.error('এরিয়া লোড ব্যর্থ')), []);

  useEffect(() => { loadCities(); }, [loadCities]);

  const selectCity = (id: string) => {
    setCityId(id); setThanaId(''); setAreas([]); setThanas([]);
    loadThanas(id);
  };
  const selectThana = (id: string) => {
    setThanaId(id); setAreas([]); setEditingAreaId(null); setAreaSearch('');
    loadAreas(id);
  };

  // সাধারণ মিউটেশন হেল্পার — সফল হলে true
  const mutate = async (fn: () => Promise<unknown>, after: () => unknown, okMsg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      await after();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const cityName = cities.find((c) => c._id === cityId)?.name;
  const thanaName = thanas.find((t) => t._id === thanaId)?.name;
  const thanaObj = thanas.find((t) => t._id === thanaId);
  const cityObj = cities.find((c) => c._id === cityId);
  const mapContext = [thanaObj?.nameEn || thanaObj?.name, cityObj?.nameEn || cityObj?.name, 'Bangladesh'].filter(Boolean).join(', ');

  const visibleAreas = useMemo(() => {
    const q = areaSearch.trim().toLowerCase();
    return q ? areas.filter((a) => a.name.toLowerCase().includes(q) || (a.nameEn ?? '').toLowerCase().includes(q) || a.zipCode.includes(q)) : areas;
  }, [areas, areaSearch]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">🗺️ লোকেশন ম্যানেজমেন্ট</h1>
      <p className="text-stone-500 mb-6">
        প্রথমে শহর, তারপর শহরের মধ্যে থানা, তারপর থানার মধ্যে এরিয়া যোগ করুন। প্রতিটি আলাদাভাবে সম্পাদনা ও চালু/বন্ধ করা যায়।
        এরিয়ার অক্ষাংশ/দ্রাঘিমাংশ (এলাকার আনুমানিক কেন্দ্র) দিয়ে &quot;আশেপাশের এলাকা&quot; বের করা হয় — Google Maps-এ জায়গায় রাইট-ক্লিক করলে কপি করা যায়।
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_2fr] gap-4">
        {/* ─── শহর ─── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-stone-700 mb-3">১. শহর <span className="text-xs text-stone-400">({cities.length})</span></h2>
          <form
            onSubmit={(e) => { e.preventDefault(); mutate(() => api.post('/locations/cities', { name: newCity, nameEn: newCityEn }), () => { setNewCity(''); setNewCityEn(''); return loadCities(); }, 'শহর যোগ হয়েছে'); }}
            className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-3"
          >
            <input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="নতুন শহর" className={inputCls} />
            <input value={newCityEn} onChange={(e) => setNewCityEn(e.target.value)} placeholder="English" className={inputCls} />
            <button disabled={busy || !newCity.trim()} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-3 rounded-lg">যোগ</button>
          </form>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {cities.map((c) => (
              <NameRow
                key={c._id}
                name={c.name}
                nameEn={c.nameEn}
                isActive={c.isActive !== false}
                selected={c._id === cityId}
                onSelect={() => selectCity(c._id)}
                onSave={(v) => mutate(() => api.patch(`/locations/cities/${c._id}`, v), loadCities, 'শহর আপডেট হয়েছে')}
                onToggle={() => mutate(() => api.patch(`/locations/cities/${c._id}`, { isActive: c.isActive === false }), loadCities, 'আপডেট হয়েছে')}
              />
            ))}
          </div>
        </div>

        {/* ─── থানা ─── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-stone-700 mb-3">
            ২. থানা {cityName && <span className="text-xs text-stone-400">— {cityName} ({thanas.length})</span>}
          </h2>
          {!cityId ? (
            <p className="text-sm text-stone-400">বাম থেকে একটি শহর বাছুন।</p>
          ) : (
            <>
              <form
                onSubmit={(e) => { e.preventDefault(); mutate(() => api.post('/locations/thanas', { name: newThana, nameEn: newThanaEn, cityId }), () => { setNewThana(''); setNewThanaEn(''); return loadThanas(cityId); }, 'থানা যোগ হয়েছে'); }}
                className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-3"
              >
                <input value={newThana} onChange={(e) => setNewThana(e.target.value)} placeholder="নতুন থানা" className={inputCls} />
                <input value={newThanaEn} onChange={(e) => setNewThanaEn(e.target.value)} placeholder="English" className={inputCls} />
                <button disabled={busy || !newThana.trim()} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-3 rounded-lg">যোগ</button>
              </form>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {thanas.map((t) => (
                  <NameRow
                    key={t._id}
                    name={t.name}
                    nameEn={t.nameEn}
                    isActive={t.isActive !== false}
                    selected={t._id === thanaId}
                    onSelect={() => selectThana(t._id)}
                    onSave={(v) => mutate(() => api.patch(`/locations/thanas/${t._id}`, v), () => loadThanas(cityId), 'থানা আপডেট হয়েছে')}
                    onToggle={() => mutate(() => api.patch(`/locations/thanas/${t._id}`, { isActive: t.isActive === false }), () => loadThanas(cityId), 'আপডেট হয়েছে')}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ─── এরিয়া ─── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-stone-700 mb-3">
            ৩. এরিয়া {thanaName && <span className="text-xs text-stone-400">— {thanaName} ({areas.length})</span>}
          </h2>
          {!thanaId ? (
            <p className="text-sm text-stone-400">একটি থানা বাছুন।</p>
          ) : (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutate(() => api.post('/locations/areas', { ...areaPayload(newArea), thanaId }), () => { setNewArea(areaToForm()); return loadAreas(thanaId); }, 'এরিয়া যোগ হয়েছে');
                }}
                className="space-y-2 mb-4 p-3 rounded-xl bg-stone-50"
              >
                <AreaFields value={newArea} onChange={setNewArea} context={mapContext} />
                <button disabled={busy || !newArea.name.trim() || newArea.zipCode.length !== 4} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
                  + এরিয়া যোগ করুন
                </button>
              </form>

              <input value={areaSearch} onChange={(e) => setAreaSearch(e.target.value)} placeholder="🔎 নাম বা জিপ দিয়ে খুঁজুন" className={`${inputCls} mb-2`} />

              <div className="space-y-1 max-h-[55vh] overflow-y-auto">
                {visibleAreas.map((a) =>
                  editingAreaId === a._id ? (
                    <div key={a._id} className="p-3 rounded-xl bg-purple-50 space-y-2">
                      <AreaFields value={areaEdit} onChange={setAreaEdit} context={mapContext} />
                      <div className="flex gap-2">
                        <button
                          disabled={busy}
                          onClick={async () => {
                            if (await mutate(() => api.patch(`/locations/areas/${a._id}`, areaPayload(areaEdit)), () => loadAreas(thanaId), 'এরিয়া আপডেট হয়েছে')) setEditingAreaId(null);
                          }}
                          className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg"
                        >
                          সেভ
                        </button>
                        <button onClick={() => setEditingAreaId(null)} className="text-xs text-stone-500 px-2">বাতিল</button>
                      </div>
                    </div>
                  ) : (
                    <div key={a._id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-stone-50">
                      <div className="min-w-0">
                        <p className={`text-sm ${a.isActive !== false ? 'text-stone-800' : 'text-stone-400 line-through'}`}>
                          {a.name} <span className="text-xs text-stone-500">· {a.nameEn || '⚠️ English নেই'} · {a.zipCode}</span>
                        </p>
                        <p className="text-[11px] text-stone-400">
                          {a.location?.coordinates
                            ? `${a.location.coordinates[1].toFixed(4)}, ${a.location.coordinates[0].toFixed(4)}`
                            : '⚠️ কোঅর্ডিনেট নেই — আশেপাশের সাজেশনে আসবে না'}
                        </p>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button onClick={() => { setAreaEdit(areaToForm(a)); setEditingAreaId(a._id); }} className={`${smallBtn} text-purple-600`}>সম্পাদনা</button>
                        <button
                          onClick={() => mutate(() => api.patch(`/locations/areas/${a._id}`, { isActive: a.isActive === false }), () => loadAreas(thanaId), 'আপডেট হয়েছে')}
                          className={`${smallBtn} ${a.isActive !== false ? 'text-orange-600' : 'text-green-600'}`}
                        >
                          {a.isActive !== false ? 'বন্ধ' : 'চালু'}
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
