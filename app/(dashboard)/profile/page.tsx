'use client';
import Loader from '../../components/ui/Loader';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { getErrorMessage } from '../../lib/errors';
import { useAuthStore } from '../../store/authStore';
import LocationPicker from '../../components/shared/LocationPicker';
import DeliveryAreasPicker from '../../components/shared/DeliveryAreasPicker';
import AddressBook from '../../components/shared/AddressBook';
import MapPicker, { LatLng, toLatLng, areaForPin } from '../../components/shared/MapPicker';
import { useAreaDetail } from '../../lib/locations';

const ROLE_LABELS: Record<string, string> = {
  admin: 'অ্যাডমিন',
  kitchen: 'কিচেন মালিক',
  user: 'ব্যবহারকারী',
  delivery: 'ডেলিভারি বয়',
};

export default function ProfilePage() {
  const { user } = useAuthStore();
  if (!user) return <Loader />;
  // ইউজার লোড হওয়ার পর ফর্মের প্রাথমিক মান সেট করতে key দিয়ে রিমাউন্ট
  return <ProfileContent key={user._id} />;
}

function ProfileContent() {
  const { user, token, setAuth } = useAuthStore();

  const [areaId, setAreaId] = useState(user?.areaId || '');
  const [buildingAddress, setBuildingAddress] = useState(user?.buildingAddress || '');
  const [kitchenPin, setKitchenPin] = useState<LatLng | null>(toLatLng(user?.kitchenLocation));
  const kitchenArea = useAreaDetail(user?.role === 'kitchen' ? areaId : '');
  const [savingKitchen, setSavingKitchen] = useState(false);

  const [deliveryAreaIds, setDeliveryAreaIds] = useState<string[]>(user?.deliveryAreaIds || []);
  const [savingAreas, setSavingAreas] = useState(false);

  const refreshProfile = async () => {
    const res = await api.get('/auth/profile');
    if (token) setAuth(res.data.data, token);
  };

  const handleSaveKitchen = async () => {
    if (!areaId) return toast.error('শহর, থানা ও এরিয়া নির্বাচন করুন');
    setSavingKitchen(true);
    try {
      const res = await api.patch('/auth/profile', { areaId, buildingAddress, kitchenLocation: kitchenPin });
      if (token) setAuth(res.data.data, token);
      toast.success('কিচেনের লোকেশন আপডেট হয়েছে');
    } catch (err) {
      toast.error(getErrorMessage(err, 'আপডেট ব্যর্থ হয়েছে'));
    } finally {
      setSavingKitchen(false);
    }
  };

  const handleSaveAreas = async () => {
    if (deliveryAreaIds.length === 0) return toast.error('অন্তত একটি এলাকা নির্বাচন করুন');
    setSavingAreas(true);
    try {
      const res = await api.patch('/auth/profile', { deliveryAreaIds });
      if (token) setAuth(res.data.data, token);
      toast.success('ডেলিভারি এরিয়া আপডেট হয়েছে');
    } catch (err) {
      toast.error(getErrorMessage(err, 'আপডেট ব্যর্থ হয়েছে'));
    } finally {
      setSavingAreas(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">👤 প্রোফাইল</h1>
      <p className="text-stone-500 mb-8">আপনার তথ্য, ঠিকানা ও এলাকা পরিচালনা করুন</p>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-stone-400">নাম</p><p className="font-medium text-stone-800">{user?.name}</p></div>
          <div><p className="text-stone-400">ইমেইল</p><p className="font-medium text-stone-800">{user?.email}</p></div>
          <div><p className="text-stone-400">ফোন</p><p className="font-medium text-stone-800">{user?.phone}</p></div>
          <div><p className="text-stone-400">রোল</p><p className="font-medium text-stone-800">{user ? ROLE_LABELS[user.role] : '—'}</p></div>
        </div>
      </div>

      {user?.role === 'user' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 max-w-3xl">
          <h2 className="font-semibold text-stone-700 mb-1">📍 আমার ঠিকানাসমূহ</h2>
          <p className="text-xs text-stone-500 mb-4">
            একাধিক ঠিকানা সেভ রাখুন — অর্ডারের সময় এখান থেকে বাছতে পারবেন। ডিফল্ট ঠিকানার এলাকার কিচেন আগে দেখানো হবে।
          </p>
          <AddressBook onChanged={() => { refreshProfile().catch(() => {}); }} />
        </div>
      )}

      {user?.role === 'kitchen' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 max-w-3xl">
          <h2 className="font-semibold text-stone-700 mb-1">📍 কিচেনের লোকেশন</h2>
          <p className="text-xs text-stone-500 mb-4">আপনার কিচেন এই এলাকা ও আশেপাশের গ্রাহকদের কাছে সাজেস্ট করা হবে।</p>
          <div className="space-y-3">
            <LocationPicker value={areaId} onChange={(id) => setAreaId(id)} />
            <input
              value={buildingAddress}
              onChange={(e) => setBuildingAddress(e.target.value)}
              placeholder="বিস্তারিত ঠিকানা (বাসা/রোড নম্বর)"
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <MapPicker
              value={kitchenPin}
              onChange={setKitchenPin}
              areaCenter={kitchenArea?.location?.coordinates ?? null}
              onAreaDetected={(r) => { const a = areaForPin(areaId, r); if (a) { setAreaId(a._id); toast.success(`এলাকা: ${a.name} — ভুল হলে উপর থেকে বদলে নিন`); } }}
              title="🗺️ ম্যাপে কিচেনের জায়গা দেখান"
              hint="🔒 গ্রাহকরা আপনার সঠিক লোকেশন কখনো দেখতে পাবেন না — শুধু দূরত্ব আর ডেলিভারি চার্জ হিসাবে লাগে। অ্যাসাইন করা ডেলিভারি বয় পিকআপের জন্য দেখেন।"
            />
          </div>
          <button
            onClick={handleSaveKitchen}
            disabled={savingKitchen}
            className="mt-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            {savingKitchen ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
        </div>
      )}

      {user?.role === 'delivery' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm max-w-3xl">
          <h2 className="font-semibold text-stone-700 mb-1">🏘️ ডেলিভারি এরিয়া</h2>
          <p className="text-xs text-stone-500 mb-3">
            যে এলাকাগুলোতে আপনি ডেলিভারি দিতে চান সেগুলো নির্বাচন করুন — এসব এলাকার কিচেন আপনাকে খুঁজে পাবে এবং এখানকার অর্ডার পিকআপ তালিকায় আসবে।
          </p>
          <DeliveryAreasPicker value={deliveryAreaIds} onChange={setDeliveryAreaIds} />
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
