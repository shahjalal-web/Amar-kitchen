'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import MapPicker, { Coords } from '../../components/shared/MapPicker';

interface AreaOption {
  _id: string;
  name: string;
  radiusKm: number;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'অ্যাডমিন',
  kitchen: 'কিচেন মালিক',
  user: 'ব্যবহারকারী',
  delivery: 'ডেলিভারি বয়',
};

export default function ProfilePage() {
  const { user, token, setAuth } = useAuthStore();
  const [location, setLocation] = useState<Coords | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);

  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [savingAreas, setSavingAreas] = useState(false);

  useEffect(() => {
    if (user?.location?.coordinates) {
      const [lng, lat] = user.location.coordinates;
      setLocation({ lat, lng });
    }
    setSelectedAreaIds(user?.deliveryAreaIds || []);
  }, [user]);

  useEffect(() => {
    if (user?.role === 'delivery') {
      api.get('/areas').then((r) => setAreas(r.data.data)).catch(() => toast.error('এরিয়া লোড ব্যর্থ হয়েছে'));
    }
  }, [user?.role]);

  const handleSaveLocation = async () => {
    if (!location) return toast.error('ম্যাপে লোকেশন নির্বাচন করুন');
    setSavingLocation(true);
    try {
      const res = await api.patch('/auth/profile/location', location);
      if (token) setAuth(res.data.data, token);
      toast.success('লোকেশন আপডেট হয়েছে');
    } catch {
      toast.error('আপডেট ব্যর্থ হয়েছে');
    } finally {
      setSavingLocation(false);
    }
  };

  const toggleArea = (areaId: string) => {
    setSelectedAreaIds((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    );
  };

  const handleSaveAreas = async () => {
    setSavingAreas(true);
    try {
      const res = await api.patch('/delivery/areas', { areaIds: selectedAreaIds });
      if (token) setAuth(res.data.data, token);
      toast.success('ডেলিভারি এরিয়া আপডেট হয়েছে');
    } catch {
      toast.error('আপডেট ব্যর্থ হয়েছে');
    } finally {
      setSavingAreas(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">📍 প্রোফাইল</h1>
      <p className="text-stone-500 mb-8">আপনার তথ্য ও লোকেশন পরিচালনা করুন</p>

      <div className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-stone-400">নাম</p>
            <p className="font-medium text-stone-800">{user?.name}</p>
          </div>
          <div>
            <p className="text-stone-400">ইমেইল</p>
            <p className="font-medium text-stone-800">{user?.email}</p>
          </div>
          <div>
            <p className="text-stone-400">ফোন</p>
            <p className="font-medium text-stone-800">{user?.phone}</p>
          </div>
          <div>
            <p className="text-stone-400">রোল</p>
            <p className="font-medium text-stone-800">{user ? ROLE_LABELS[user.role] : '—'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl mb-6">
        <h2 className="font-semibold text-stone-700 mb-1">🗺️ লোকেশন</h2>
        <p className="text-xs text-stone-500 mb-3">
          ম্যাপে পিন বসান বা ড্র্যাগ করুন, অথবা &quot;বর্তমান লোকেশন নিন&quot; বাটনে ক্লিক করুন। সবুজ বৃত্তটি ৫ কিমি পরিসীমা দেখায়।
        </p>
        <MapPicker value={location} onChange={setLocation} radiusKm={5} height={350} />
        <button
          onClick={handleSaveLocation}
          disabled={savingLocation}
          className="mt-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition"
        >
          {savingLocation ? 'সংরক্ষণ হচ্ছে...' : 'লোকেশন সংরক্ষণ করুন'}
        </button>
      </div>

      {user?.role === 'delivery' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl">
          <h2 className="font-semibold text-stone-700 mb-1">🏘️ ডেলিভারি এরিয়া</h2>
          <p className="text-xs text-stone-500 mb-3">
            যে এরিয়াগুলোতে আপনি ডেলিভারি দিতে চান, সেগুলো নির্বাচন করুন। এছাড়া আপনার লোকেশনের ৫ কিমির মধ্যের অর্ডারও দেখানো হবে।
          </p>
          {areas.length === 0 ? (
            <p className="text-stone-500 text-sm">এখনো কোনো এরিয়া তৈরি করা হয়নি।</p>
          ) : (
            <div className="space-y-2">
              {areas.map((area) => (
                <label key={area._id} className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAreaIds.includes(area._id)}
                    onChange={() => toggleArea(area._id)}
                    className="w-4 h-4 accent-green-600"
                  />
                  {area.name} <span className="text-stone-400">({area.radiusKm} কিমি)</span>
                </label>
              ))}
            </div>
          )}
          <button
            onClick={handleSaveAreas}
            disabled={savingAreas}
            className="mt-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            {savingAreas ? 'সংরক্ষণ হচ্ছে...' : 'এরিয়া সংরক্ষণ করুন'}
          </button>
        </div>
      )}
    </div>
  );
}
