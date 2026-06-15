'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import MapPicker, { Coords } from '../../../components/shared/MapPicker';

interface AreaItem {
  _id: string;
  name: string;
  radiusKm: number;
  isActive: boolean;
  location: { coordinates: [number, number] };
}

export default function AdminAreasPage() {
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [location, setLocation] = useState<Coords | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAreas = () => {
    setLoading(true);
    api.get('/areas/all').then((r) => setAreas(r.data.data)).catch(() => toast.error('লোড ব্যর্থ হয়েছে')).finally(() => setLoading(false));
  };

  useEffect(() => { loadAreas(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('এরিয়ার নাম দিন');
    if (!location) return toast.error('ম্যাপে এরিয়ার সেন্টার পয়েন্ট নির্বাচন করুন');

    setSaving(true);
    try {
      await api.post('/areas', { name: name.trim(), lat: location.lat, lng: location.lng });
      toast.success('এরিয়া তৈরি হয়েছে');
      setName('');
      setLocation(null);
      loadAreas();
    } catch {
      toast.error('তৈরি ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (area: AreaItem) => {
    try {
      if (area.isActive) {
        await api.delete(`/areas/${area._id}`);
      } else {
        await api.patch(`/areas/${area._id}`, { isActive: true });
      }
      loadAreas();
    } catch {
      toast.error('আপডেট ব্যর্থ হয়েছে');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">🗺️ এরিয়া ম্যানেজমেন্ট</h1>
      <p className="text-stone-500 mb-8">৫ কিমি রেডিয়াসের এরিয়া তৈরি করুন — এগুলো ইউজার ও ডেলিভারি বয়ের জন্য দেখানো হবে</p>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-8 max-w-2xl">
        <h2 className="font-semibold text-stone-700 mb-3">নতুন এরিয়া তৈরি করুন</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">এরিয়ার নাম</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: ধানমন্ডি"
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">সেন্টার পয়েন্ট (৫ কিমি রেডিয়াস)</label>
            <MapPicker value={location} onChange={setLocation} radiusKm={5} height={350} />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            {saving ? 'তৈরি হচ্ছে...' : 'এরিয়া তৈরি করুন'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl">
        <h2 className="font-semibold text-stone-700 mb-3">সব এরিয়া</h2>
        {loading ? (
          <p className="text-stone-500">লোড হচ্ছে...</p>
        ) : areas.length === 0 ? (
          <p className="text-stone-500">কোনো এরিয়া তৈরি করা হয়নি।</p>
        ) : (
          <div className="space-y-2">
            {areas.map((area) => (
              <div key={area._id} className="flex items-center justify-between border border-stone-100 rounded-lg px-4 py-3">
                <div>
                  <p className="font-medium text-stone-800">{area.name}</p>
                  <p className="text-xs text-stone-400">রেডিয়াস: {area.radiusKm} কিমি</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${area.isActive ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                    {area.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                  <button
                    onClick={() => handleToggle(area)}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    {area.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
