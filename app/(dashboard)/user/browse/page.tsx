'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';
import { haversineKm } from '../../../lib/geo';

interface FoodItemRef {
  _id: string;
  name: string;
  image: string;
  category: string;
}

interface MenuItem {
  foodItem: FoodItemRef;
  price: number;
  isFree: boolean;
}

interface KitchenRef {
  _id: string;
  name: string;
  kitchenName?: string;
  rating?: number;
  location?: { coordinates: [number, number] };
}

interface DailyMenu {
  _id: string;
  kitchen: KitchenRef;
  items: MenuItem[];
  freeItems: FoodItemRef[];
  isReadyForPickup: boolean;
}

interface AreaOption {
  _id: string;
  name: string;
  radiusKm: number;
  location: { coordinates: [number, number] };
}

type DeliveryMode = 'live' | 'area';
type SortMode = 'distance' | 'rating';

const MODE_STORAGE_KEY = 'ak_browse_mode';

export default function UserBrowsePage() {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<DeliveryMode>('live');
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cart, setCart] = useState<Record<string, Record<string, number>>>({});
  const [orderingId, setOrderingId] = useState<string | null>(null);
  const [deliveryEstimate, setDeliveryEstimate] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('distance');

  const [buildingName, setBuildingName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // ─── প্রাথমিক ডেটা লোড ─────────────────────────────────
  useEffect(() => {
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as DeliveryMode | null;
    if (savedMode === 'live' || savedMode === 'area') setMode(savedMode);

    api.get('/areas').then((r) => setAreas(r.data.data)).catch(() => {});
    api.get('/kitchen/delivery-charge', { params: { count: 1 } })
      .then((r) => setDeliveryEstimate(r.data.data.charge))
      .catch(() => {});

    setBuildingName(user?.buildingName || '');
  }, [user?.buildingName]);

  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  // ─── রেফারেন্স পয়েন্ট (দূরত্ব হিসাবের জন্য) ────────────
  const referencePoint = useMemo(() => {
    if (mode === 'live') return liveLocation;
    const area = areas.find((a) => a._id === selectedAreaId);
    if (!area) return null;
    const [lng, lat] = area.location.coordinates;
    return { lat, lng };
  }, [mode, liveLocation, areas, selectedAreaId]);

  // ─── কিচেন মেনু ফেচ ────────────────────────────────────
  const fetchMenus = async (params: { lat?: number; lng?: number; areaId?: string }) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get('/kitchen/nearby', { params });
      setMenus(res.data.data);
    } catch {
      toast.error('লোড ব্যর্থ হয়েছে');
      setMenus([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast.error('আপনার ব্রাউজার লোকেশন সাপোর্ট করে না');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLiveLocation(coords);
        setLocating(false);
        fetchMenus({ lat: coords.lat, lng: coords.lng });
      },
      () => {
        toast.error('লোকেশন নেওয়া যায়নি — পারমিশন দিন');
        setLocating(false);
      }
    );
  };

  const handleSelectArea = (areaId: string) => {
    setSelectedAreaId(areaId);
    if (areaId) fetchMenus({ areaId });
    else { setMenus([]); setSearched(false); }
  };

  // ─── দূরত্ব হিসাব ───────────────────────────────────────
  const getDistance = (menu: DailyMenu): number | null => {
    if (!referencePoint || !menu.kitchen.location?.coordinates) return null;
    const [lng, lat] = menu.kitchen.location.coordinates;
    return haversineKm(referencePoint, { lat, lng });
  };

  // ─── সার্চ + সর্ট ────────────────────────────────────────
  const visibleMenus = useMemo(() => {
    let list = menus;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((m) =>
        (m.kitchen.kitchenName || m.kitchen.name).toLowerCase().includes(q)
      );
    }
    const withDistance = list.map((m) => ({ menu: m, distance: getDistance(m) }));
    withDistance.sort((a, b) => {
      if (sortMode === 'distance') {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      }
      return (b.menu.kitchen.rating || 0) - (a.menu.kitchen.rating || 0);
    });
    return withDistance;
  }, [menus, search, sortMode, referencePoint]);

  // ─── কার্ট ──────────────────────────────────────────────
  const updateQty = (menuId: string, foodItemId: string, delta: number) => {
    setCart((prev) => {
      const menuCart = { ...(prev[menuId] || {}) };
      const next = Math.max(0, (menuCart[foodItemId] || 0) + delta);
      if (next === 0) delete menuCart[foodItemId];
      else menuCart[foodItemId] = next;
      return { ...prev, [menuId]: menuCart };
    });
  };

  const getSubtotal = (menu: DailyMenu) => {
    const menuCart = cart[menu._id] || {};
    return menu.items.reduce((sum, it) => sum + (menuCart[it.foodItem._id] || 0) * it.price, 0);
  };

  const placeOrder = async (menu: DailyMenu) => {
    const menuCart = cart[menu._id] || {};
    const items = menu.items
      .filter((it) => (menuCart[it.foodItem._id] || 0) > 0)
      .map((it) => ({ foodItem: it.foodItem._id, quantity: menuCart[it.foodItem._id], price: it.price }));

    if (items.length === 0) return toast.error('অন্তত একটি খাবার নির্বাচন করুন');
    if (mode === 'live' && !liveLocation) return toast.error('আগে লোকেশন শেয়ার করুন');
    if (mode === 'area' && !selectedAreaId) return toast.error('আগে এলাকা নির্বাচন করুন');

    setOrderingId(menu._id);
    try {
      await api.post('/orders', {
        kitchenId: menu.kitchen._id,
        items,
        totalAmount: getSubtotal(menu),
        paymentMethod: 'cash',
        deliveryMode: mode,
        deliveryLocation: mode === 'live' ? liveLocation : undefined,
        areaId: mode === 'area' ? selectedAreaId : undefined,
        buildingName: buildingName || undefined,
        deliveryAddress: deliveryAddress || undefined,
      });
      toast.success('অর্ডার দেওয়া হয়েছে');
      setCart((prev) => ({ ...prev, [menu._id]: {} }));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'ব্যর্থ হয়েছে');
    } finally {
      setOrderingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">🔍 কিচেন খুঁজুন</h1>
      <p className="text-stone-500 mb-4">আপনার আশেপাশের কিচেনের আজকের মেনু থেকে অর্ডার করুন</p>

      {/* মোড টগল */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex flex-wrap gap-3">
        <button
          onClick={() => setMode('live')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            mode === 'live' ? 'bg-green-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          🛰️ বর্তমান লোকেশন
        </button>
        <button
          onClick={() => setMode('area')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            mode === 'area' ? 'bg-green-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          🏠 এলাকা নির্বাচন
        </button>
      </div>

      {/* মোড-নির্ভর ইনপুট */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        {mode === 'live' ? (
          <div>
            <button
              onClick={handleShareLocation}
              disabled={locating}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
            >
              {locating ? 'লোকেশন নেওয়া হচ্ছে...' : '📍 লোকেশন শেয়ার করুন'}
            </button>
            {liveLocation && (
              <p className="text-xs text-stone-500 mt-2">
                নির্বাচিত লোকেশন: {liveLocation.lat.toFixed(5)}, {liveLocation.lng.toFixed(5)} — ৫ কিমির মধ্যের কিচেন দেখানো হচ্ছে
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">এলাকা নির্বাচন করুন</label>
            <select
              value={selectedAreaId}
              onChange={(e) => handleSelectArea(e.target.value)}
              className="w-full sm:w-72 border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">— এলাকা বাছুন —</option>
              {areas.map((a) => (
                <option key={a._id} value={a._id}>{a.name} ({a.radiusKm} কিমি)</option>
              ))}
            </select>
            {areas.length === 0 && (
              <p className="text-xs text-stone-400 mt-2">এখনো কোনো এরিয়া তৈরি করা হয়নি।</p>
            )}
          </div>
        )}
      </div>

      {/* ডেলিভারি ঠিকানা */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-stone-700 mb-3">🚚 ডেলিভারি তথ্য</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-stone-500 mb-1">বিল্ডিং/বাসার নাম</label>
            <input
              type="text"
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              placeholder="যেমন: সুমন ভিলা"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">ডেলিভারি ঠিকানা</label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="যেমন: বাড়ি ৫, রোড ৩, ধানমন্ডি"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>
      </div>

      {deliveryEstimate !== null && (
        <p className="text-xs text-green-600 mb-4">আনুমানিক ডেলিভারি চার্জ: ৳{deliveryEstimate} (একই বিল্ডিংয়ে আরও অর্ডার থাকলে কম পড়বে)</p>
      )}

      {/* সার্চ ও সর্ট */}
      {searched && menus.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔎 কিচেনের নাম দিয়ে খুঁজুন..."
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-50 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setSortMode('distance')}
              className={`px-3 py-2 rounded-lg transition ${sortMode === 'distance' ? 'bg-green-100 text-green-700 font-medium' : 'bg-stone-100 text-stone-600'}`}
            >
              📏 দূরত্ব
            </button>
            <button
              onClick={() => setSortMode('rating')}
              className={`px-3 py-2 rounded-lg transition ${sortMode === 'rating' ? 'bg-green-100 text-green-700 font-medium' : 'bg-stone-100 text-stone-600'}`}
            >
              ⭐ রেটিং
            </button>
          </div>
        </div>
      )}

      {/* মেনু লিস্ট */}
      {!searched ? (
        <p className="text-stone-500">শুরু করতে উপরে লোকেশন শেয়ার করুন বা এলাকা নির্বাচন করুন।</p>
      ) : loading ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : visibleMenus.length === 0 ? (
        <p className="text-stone-500">এই পরিসরে আজ কোনো কিচেনের মেনু পাওয়া যায়নি।</p>
      ) : (
        <div className="space-y-6">
          {visibleMenus.map(({ menu, distance }) => (
            <div key={menu._id} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-stone-800">{menu.kitchen.kitchenName || menu.kitchen.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {!!menu.kitchen.rating && <p className="text-xs text-amber-500">⭐ {menu.kitchen.rating.toFixed(1)}</p>}
                    {distance !== null && (
                      <p className="text-xs text-stone-400">📍 {distance.toFixed(1)} কিমি দূরে</p>
                    )}
                  </div>
                </div>
                {menu.isReadyForPickup && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">প্রস্তুত</span>}
              </div>

              {menu.freeItems.length > 0 && (
                <p className="text-xs text-purple-600 mb-3">🎁 ফ্রি: {menu.freeItems.map((f) => f.name).join(', ')}</p>
              )}

              <div className="space-y-2">
                {menu.items.map((it) => {
                  const qty = cart[menu._id]?.[it.foodItem._id] || 0;
                  return (
                    <div key={it.foodItem._id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                          <Image src={it.foodItem.image} alt={it.foodItem.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-700">{it.foodItem.name}</p>
                          <p className="text-xs text-stone-500">৳{it.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(menu._id, it.foodItem._id, -1)} className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold">−</button>
                        <span className="w-6 text-center text-sm">{qty}</span>
                        <button onClick={() => updateQty(menu._id, it.foodItem._id, 1)} className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-lg font-bold text-orange-600">সাবটোটাল: ৳{getSubtotal(menu)}</p>
                <button
                  onClick={() => placeOrder(menu)}
                  disabled={orderingId === menu._id || getSubtotal(menu) === 0}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
                >
                  {orderingId === menu._id ? 'অর্ডার হচ্ছে...' : 'অর্ডার করুন'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
