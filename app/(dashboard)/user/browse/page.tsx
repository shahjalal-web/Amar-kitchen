'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { getErrorMessage } from '../../../lib/errors';
import { useAreaDetail, areaLabel } from '../../../lib/locations';
import {
  SavedAddress, loadAddresses, formatAddress,
  AddressFormFields, emptyAddressForm, validateAddressForm,
} from '../../../components/shared/AddressBook';

interface FoodItemRef { _id: string; name: string; image: string; category: string; imageCredit?: string; source?: 'admin' | 'kitchen' }
interface MenuItem { foodItem: FoodItemRef; price: number; isFree: boolean }
interface KitchenRef {
  _id: string;
  name: string;
  kitchenName?: string;
  kitchenDescription?: string;
  rating?: number;
  totalRatings?: number;
  area?: string;
}
interface DailyMenu { _id: string; items: MenuItem[]; freeItems: FoodItemRef[]; isReadyForPickup: boolean }
interface Suggestion { kitchen: KitchenRef; menu: DailyMenu | null; distanceKm?: number | null }
interface NearbyResult { areas: { _id: string; name: string; distanceKm: number }[]; kitchens: Suggestion[] }
interface FoodHit {
  menuId: string;
  price: number;
  food: FoodItemRef;
  kitchen: { _id: string; name: string; kitchenName?: string; rating?: number; area?: string };
  distanceKm: number | null;
}

const NEW_ADDRESS = 'new';

export default function UserBrowsePage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddress, setNewAddress] = useState(emptyAddressForm());
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [nearby, setNearby] = useState<NearbyResult | null>(null);
  const [charges, setCharges] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<Record<string, Record<string, number>>>({});
  const [orderingId, setOrderingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [foodQuery, setFoodQuery] = useState('');
  const [foodHits, setFoodHits] = useState<FoodHit[] | null>(null);
  const [foodSearching, setFoodSearching] = useState(false);

  // ─── সেভ করা ঠিকানা ────────────────────────────────────
  useEffect(() => {
    loadAddresses()
      .then((list) => {
        setAddresses(list);
        setSelectedAddressId(list.find((a) => a.isDefault)?._id ?? list[0]?._id ?? NEW_ADDRESS);
      })
      .catch(() => setSelectedAddressId(NEW_ADDRESS))
      .finally(() => setAddressesLoaded(true));
  }, []);

  const selectedAddress = addresses.find((a) => a._id === selectedAddressId);
  const areaId = selectedAddressId === NEW_ADDRESS ? newAddress.areaId : selectedAddress?.areaId?._id ?? '';
  const areaDetail = useAreaDetail(areaId);

  // ─── এলাকার কিচেন + আশেপাশের টপ কিচেন ─────────────────
  useEffect(() => {
    let cancelled = false;
    if (!areaId) {
      Promise.resolve().then(() => { if (!cancelled) { setSuggestions([]); setNearby(null); } });
      return () => { cancelled = true; };
    }
    Promise.resolve().then(() => !cancelled && setLoading(true));
    Promise.all([
      api.get('/kitchen/suggestions', { params: { areaId } }).then((r) => r.data.data as Suggestion[]),
      api.get('/kitchen/top-nearby', { params: { areaId } }).then((r) => r.data.data as NearbyResult).catch(() => null),
    ])
      .then(async ([inArea, near]) => {
        if (cancelled) return;
        setSuggestions(inArea);
        setNearby(near);
        // প্রতিটি কিচেনের ডেলিভারি চার্জ (একই এরিয়া ৳২০, একই থানা/অন্য থানা আলাদা)
        const ids = [...inArea, ...(near?.kitchens ?? [])].filter((s) => s.menu).map((s) => s.kitchen._id);
        const entries = await Promise.all(
          [...new Set(ids)].map((kitchenId) =>
            api.get('/kitchen/delivery-charge', { params: { kitchenId, areaId } })
              .then((r) => [kitchenId, r.data.data.charge as number] as const)
              .catch(() => null))
        );
        if (!cancelled) setCharges(Object.fromEntries(entries.filter(Boolean) as [string, number][]));
      })
      .catch(() => { if (!cancelled) toast.error('লোড ব্যর্থ হয়েছে'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [areaId]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? suggestions.filter((s) => (s.kitchen.kitchenName || s.kitchen.name).toLowerCase().includes(q))
      : suggestions;
    return [...list].sort((a, b) => Number(!!b.menu) - Number(!!a.menu));
  }, [suggestions, search]);

  // ─── খাবার সার্চ: অ্যাডমিন লাইব্রেরির খাবার আগে, তারপর কিচেনের নিজের খাবার (সার্ভারে সাজানো) ─
  useEffect(() => {
    const q = foodQuery.trim();
    let cancelled = false;
    if (!areaId || q.length < 1) {
      Promise.resolve().then(() => { if (!cancelled) setFoodHits(null); });
      return () => { cancelled = true; };
    }
    const t = setTimeout(() => {
      setFoodSearching(true);
      api.get('/kitchen/food-search', { params: { q, areaId } })
        .then((r) => { if (!cancelled) setFoodHits(r.data.data); })
        .catch(() => { if (!cancelled) setFoodHits([]); })
        .finally(() => { if (!cancelled) setFoodSearching(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [foodQuery, areaId]);

  const goToKitchen = (kitchenId: string) =>
    document.getElementById(`kitchen-${kitchenId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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

  const placeOrder = async (kitchen: KitchenRef, menu: DailyMenu) => {
    const menuCart = cart[menu._id] || {};
    const items = menu.items
      .filter((it) => (menuCart[it.foodItem._id] || 0) > 0)
      .map((it) => ({ foodItem: it.foodItem._id, quantity: menuCart[it.foodItem._id] }));
    if (items.length === 0) return toast.error('অন্তত একটি খাবার নির্বাচন করুন');

    const body: Record<string, unknown> = { kitchenId: kitchen._id, items, paymentMethod: 'cash' };
    if (selectedAddressId === NEW_ADDRESS) {
      const err = validateAddressForm(newAddress);
      if (err) return toast.error(err);
      body.address = newAddress;
      body.saveAddress = saveNewAddress;
    } else if (selectedAddress) {
      body.addressId = selectedAddress._id;
    } else {
      return toast.error('ডেলিভারি ঠিকানা নির্বাচন করুন');
    }

    setOrderingId(menu._id);
    try {
      await api.post('/orders', body);
      toast.success('অর্ডার দেওয়া হয়েছে — "আমার অর্ডার" পেজে স্ট্যাটাস দেখুন');
      setCart((prev) => ({ ...prev, [menu._id]: {} }));
      if (selectedAddressId === NEW_ADDRESS && saveNewAddress) {
        const list = await loadAddresses().catch(() => addresses);
        setAddresses(list);
        const saved = list.find((a) => a.areaId?._id === newAddress.areaId && a.buildingName === newAddress.buildingName.trim());
        if (saved) setSelectedAddressId(saved._id);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে'));
    } finally {
      setOrderingId(null);
    }
  };

  const renderKitchen = ({ kitchen, menu, distanceKm }: Suggestion) => (
    <div key={kitchen._id} id={`kitchen-${kitchen._id}`} className={`scroll-mt-20 bg-white rounded-2xl p-5 shadow-sm ${menu ? '' : 'opacity-70'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-stone-800">{kitchen.kitchenName || kitchen.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs">
            {!!kitchen.rating && <span className="text-amber-500">⭐ {kitchen.rating.toFixed(1)}</span>}
            {kitchen.area && <span className="text-stone-400">📍 {kitchen.area}</span>}
            {distanceKm != null && <span className="text-stone-400">~{distanceKm} কিমি</span>}
            {charges[kitchen._id] !== undefined && <span className="text-green-700">🚚 ডেলিভারি ৳{charges[kitchen._id]}</span>}
          </div>
          {kitchen.kitchenDescription && <p className="text-xs text-stone-500 mt-1">{kitchen.kitchenDescription}</p>}
        </div>
        {menu?.isReadyForPickup && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">প্রস্তুত</span>}
      </div>

      {!menu ? (
        <p className="text-sm text-stone-500">আজকের মেনু এখনো দেওয়া হয়নি।</p>
      ) : (
        <>
          {menu.freeItems.length > 0 && (
            <p className="text-xs text-purple-600 mb-3">🎁 ফ্রি: {menu.freeItems.map((f) => f.name).join(', ')}</p>
          )}
          <div className="space-y-2">
            {menu.items.map((it) => {
              const qty = cart[menu._id]?.[it.foodItem._id] || 0;
              return (
                <div key={it.foodItem._id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0" title={it.foodItem.imageCredit}>
                      <Image src={it.foodItem.image} alt={it.foodItem.name} fill sizes="48px" className="object-cover" />
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
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t">
            <div>
              <p className="text-lg font-bold text-orange-600">সাবটোটাল: ৳{getSubtotal(menu)}</p>
              {getSubtotal(menu) > 0 && charges[kitchen._id] !== undefined && (
                <p className="text-xs text-stone-500">ডেলিভারিসহ মোট: ৳{getSubtotal(menu) + charges[kitchen._id]}</p>
              )}
            </div>
            <button
              onClick={() => placeOrder(kitchen, menu)}
              disabled={orderingId === menu._id || getSubtotal(menu) === 0}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
            >
              {orderingId === menu._id ? 'অর্ডার হচ্ছে...' : 'অর্ডার করুন'}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">🔍 কিচেন খুঁজুন</h1>
      <p className="text-stone-500 mb-4">ঠিকানা বাছুন — সেই এলাকার ঘরোয়া কিচেনের আজকের মেনু থেকে অর্ডার করুন</p>

      {/* ─── ডেলিভারি ঠিকানা ─── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-stone-700 mb-3">🚚 ডেলিভারি ঠিকানা</h2>
        {!addressesLoaded ? (
          <p className="text-sm text-stone-500">লোড হচ্ছে...</p>
        ) : (
          <div className="space-y-2">
            {addresses.map((a) => (
              <label key={a._id} className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer ${selectedAddressId === a._id ? 'border-green-500 bg-green-50' : 'border-stone-200'}`}>
                <input type="radio" checked={selectedAddressId === a._id} onChange={() => setSelectedAddressId(a._id)} className="mt-1 accent-green-600" />
                <span className="text-sm">
                  <b className="text-stone-800">{a.label}</b>{a.isDefault && <span className="text-xs text-green-700"> (ডিফল্ট)</span>}
                  <br /><span className="text-stone-600">{formatAddress(a)}</span>
                </span>
              </label>
            ))}
            <label className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer ${selectedAddressId === NEW_ADDRESS ? 'border-green-500 bg-green-50' : 'border-stone-200'}`}>
              <input type="radio" checked={selectedAddressId === NEW_ADDRESS} onChange={() => setSelectedAddressId(NEW_ADDRESS)} className="mt-1 accent-green-600" />
              <span className="text-sm font-medium text-stone-800">+ নতুন ঠিকানা</span>
            </label>
            {selectedAddressId === NEW_ADDRESS && (
              <div className="pl-1 pt-2 space-y-2">
                <AddressFormFields value={newAddress} onChange={setNewAddress} />
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <input type="checkbox" checked={saveNewAddress} onChange={(e) => setSaveNewAddress(e.target.checked)} className="accent-green-600" />
                  এই ঠিকানাটি পরের জন্য সেভ করুন
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── খাবার সার্চ ─── */}
      {areaId && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <input
            type="text"
            value={foodQuery}
            onChange={(e) => setFoodQuery(e.target.value)}
            placeholder="🍛 খাবার খুঁজুন — যেমন: খিচুড়ি, মুরগি, ভাত"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {foodSearching && <p className="text-xs text-stone-500 mt-2">খোঁজা হচ্ছে...</p>}
          {foodHits && !foodSearching && (
            foodHits.length === 0 ? (
              <p className="text-sm text-stone-500 mt-3">আপনার ও আশেপাশের এলাকার আজকের মেনুতে &quot;{foodQuery}&quot; পাওয়া যায়নি।</p>
            ) : (
              <ul className="mt-3 divide-y divide-stone-100">
                {foodHits.map((h) => {
                  const qty = cart[h.menuId]?.[h.food._id] || 0;
                  return (
                    <li key={`${h.menuId}-${h.food._id}`} className="flex items-center gap-3 py-2">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0" title={h.food.imageCredit}>
                        <Image src={h.food.image} alt={h.food.name} fill sizes="56px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">
                          {h.food.name}
                          {h.food.source === 'kitchen' && <span className="ml-1 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">কিচেনের স্পেশাল</span>}
                        </p>
                        <button onClick={() => goToKitchen(h.kitchen._id)} className="text-xs text-green-700 hover:underline text-left truncate block">
                          {h.kitchen.kitchenName || h.kitchen.name}
                          {h.kitchen.rating ? ` · ⭐${h.kitchen.rating.toFixed(1)}` : ''}
                          {h.distanceKm ? ` · ~${h.distanceKm} কিমি` : ' · আপনার এলাকা'}
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-stone-700 w-12 text-right">৳{h.price}</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(h.menuId, h.food._id, -1)} className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold">−</button>
                        <span className="w-5 text-center text-sm">{qty}</span>
                        <button onClick={() => updateQty(h.menuId, h.food._id, 1)} className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold">+</button>
                      </div>
                    </li>
                  );
                })}
                <li className="pt-2 text-xs text-stone-500">কার্টে যোগ করে কিচেনের নামে ক্লিক করুন — সেই কিচেনের কার্ড থেকে অর্ডার দিন।</li>
              </ul>
            )
          )}
        </div>
      )}

      {areaDetail && (
        <p className="text-sm text-stone-600 mb-3">📍 <b>{areaLabel(areaDetail)}</b> এলাকার কিচেন</p>
      )}

      {suggestions.length > 0 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔎 কিচেনের নাম দিয়ে খুঁজুন..."
          className="w-full sm:w-80 border border-stone-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      )}

      {!areaId ? (
        <p className="text-stone-500">শুরু করতে উপরে ডেলিভারি ঠিকানা (শহর → থানা → এরিয়া) নির্বাচন করুন।</p>
      ) : loading ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : (
        <>
          {visible.length === 0 ? (
            <p className="text-stone-500 mb-6">এই এলাকায় এখনো কোনো কিচেন নেই{nearby?.kitchens.length ? ' — নিচে আশেপাশের কিচেন দেখুন।' : '।'}</p>
          ) : (
            <div className="space-y-6 mb-8">{visible.map(renderKitchen)}</div>
          )}

          {/* ─── আশেপাশের এলাকার টপ কিচেন ─── */}
          {nearby && nearby.kitchens.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-stone-800 mb-1">🌟 আশেপাশের এলাকার টপ কিচেন</h2>
              <p className="text-xs text-stone-500 mb-4">
                কাছের এলাকা: {nearby.areas.slice(0, 6).map((a) => `${a.name} (${a.distanceKm} কিমি)`).join(', ')}
              </p>
              <div className="space-y-6">{nearby.kitchens.map(renderKitchen)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
