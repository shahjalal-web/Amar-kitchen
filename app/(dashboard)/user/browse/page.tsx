'use client';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { getErrorMessage } from '../../../lib/errors';
import { useAreaDetail, areaLabel } from '../../../lib/locations';
import {
  SavedAddress, loadAddresses, formatAddress,
  AddressFormFields, emptyAddressForm, validateAddressForm,
} from '../../../components/shared/AddressBook';
import { FoodPreview, FoodThumb } from '../../../components/shared/FoodViewer';
import Loader, { SkeletonCards } from '../../../components/ui/Loader';
import { FoodImage } from '../../../lib/foodImages';
import MapPicker, { LatLng, toLatLng, areaForPin } from '../../../components/shared/MapPicker';
import type { AreaDetail } from '../../../lib/locations';

interface FoodItemRef { _id: string; name: string; image: string; images?: FoodImage[]; category: string; imageCredit?: string; source?: 'admin' | 'kitchen' }
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
interface Suggestion { kitchen: KitchenRef; menu: DailyMenu | null; distanceKm?: number | null; deliveryCharge?: number; sameArea?: boolean }
interface BrowseResult {
  radiusKm: number;
  defaultRadiusKm: number;
  pricing: { sameAreaFee: number; slabs: { upToKm: number; fee: number }[]; maxKm: number };
  areas: { _id: string; name: string; distanceKm: number }[];
  kitchens: Suggestion[];
}
type SortKey = 'distance' | 'rating' | 'charge' | 'price';
const RADIUS_OPTIONS = [0, 1, 2, 3, 4, 5, 7, 10];
const SORT_LABEL: Record<SortKey, string> = { distance: 'কাছের আগে', rating: 'রেটিং বেশি', charge: 'ডেলিভারি চার্জ কম', price: 'দাম কম' };
const bnNum = (n: number) => n.toLocaleString('bn-BD');
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
  const [savingAddress, setSavingAddress] = useState(false);
  const [pinDraft, setPinDraft] = useState<LatLng | null | undefined>(undefined); // undefined = পিন এডিটর বন্ধ
  const [pinArea, setPinArea] = useState<AreaDetail | null>(null);

  const [browse, setBrowse] = useState<BrowseResult | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(null); // null = অ্যাডমিনের ডিফল্ট পরিধি
  const [sortBy, setSortBy] = useState<SortKey>('distance');
  const [minRating, setMinRating] = useState(0);
  const [openOnly, setOpenOnly] = useState(false);
  const [category, setCategory] = useState('');
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

  const selectAddress = (id: string) => { setSelectedAddressId(id); setPinDraft(undefined); setPinArea(null); };

  // নতুন ঠিকানা (পিনসহ) অর্ডারের আগেই ঠিকানা বইয়ে সেভ
  const saveNewAddressNow = async () => {
    const err = validateAddressForm(newAddress);
    if (err) return toast.error(err);
    setSavingAddress(true);
    try {
      const res = await api.post('/auth/addresses', newAddress);
      setAddresses(res.data.data.addresses);
      setSelectedAddressId(res.data.data.address._id);
      setNewAddress(emptyAddressForm());
      toast.success('ঠিকানা সেভ হয়েছে');
    } catch (e) {
      toast.error(getErrorMessage(e, 'সেভ ব্যর্থ হয়েছে'));
    } finally {
      setSavingAddress(false);
    }
  };

  // সেভ করা ঠিকানার পিন সেভ (পিন অন্য এলাকায় পড়লে এলাকাও বদলায়)
  const savePin = async () => {
    if (!selectedAddress) return;
    setSavingAddress(true);
    try {
      const res = await api.patch(`/auth/addresses/${selectedAddress._id}`, { location: pinDraft ?? null, ...(pinArea ? { areaId: pinArea._id } : {}) });
      setAddresses(res.data.data);
      setPinDraft(undefined);
      setPinArea(null);
      toast.success(pinDraft ? 'পিন সেভ হয়েছে' : 'পিন মুছে ফেলা হয়েছে');
    } catch (e) {
      toast.error(getErrorMessage(e, 'সেভ ব্যর্থ হয়েছে'));
    } finally {
      setSavingAddress(false);
    }
  };
  const areaId = selectedAddressId === NEW_ADDRESS ? newAddress.areaId : selectedAddress?.areaId?._id ?? '';
  const areaDetail = useAreaDetail(areaId);
  // ঠিকানার ম্যাপ পিন থাকলে দূরত্ব/চার্জ সেখান থেকে, নইলে এরিয়ার কেন্দ্র থেকে
  const pin = selectedAddressId === NEW_ADDRESS ? newAddress.location : toLatLng(selectedAddress?.location);
  const pinLat = pin?.lat, pinLng = pin?.lng;

  // ─── নিজের এলাকা + পরিধির মধ্যের কিচেন (দূরত্ব ও ডেলিভারি চার্জসহ, এক রিকোয়েস্টে) ───
  useEffect(() => {
    let cancelled = false;
    if (!areaId) {
      Promise.resolve().then(() => { if (!cancelled) setBrowse(null); });
      return () => { cancelled = true; };
    }
    Promise.resolve().then(() => !cancelled && setLoading(true));
    api.get('/kitchen/browse', { params: { areaId, ...(radiusKm !== null ? { radiusKm } : {}), ...(pinLat !== undefined ? { lat: pinLat, lng: pinLng } : {}) } })
      .then((r) => { if (!cancelled) setBrowse(r.data.data); })
      .catch(() => { if (!cancelled) toast.error('লোড ব্যর্থ হয়েছে'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [areaId, radiusKm, pinLat, pinLng]);

  const charges = useMemo(
    () => Object.fromEntries((browse?.kitchens ?? []).map((k) => [k.kitchen._id, k.deliveryCharge ?? 0])) as Record<string, number>,
    [browse]
  );
  const effectiveRadius = browse?.radiusKm ?? 0;
  const maxKm = browse?.pricing.maxKm ?? 10;

  const categories = useMemo(() => {
    const set = new Set<string>();
    browse?.kitchens.forEach((k) => k.menu?.items.forEach((it) => set.add(it.foodItem.category)));
    return [...set];
  }, [browse]);

  const filtersActive = sortBy !== 'distance' || minRating > 0 || openOnly || !!category;
  const resetFilters = () => { setSortBy('distance'); setMinRating(0); setOpenOnly(false); setCategory(''); setSearch(''); };

  const { ownArea, around } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const minPrice = (k: Suggestion) => (k.menu?.items.length ? Math.min(...k.menu.items.map((it) => it.price)) : Infinity);
    const list = (browse?.kitchens ?? []).filter((k) =>
      (!q || (k.kitchen.kitchenName || k.kitchen.name).toLowerCase().includes(q)) &&
      (!openOnly || !!k.menu) &&
      (!minRating || (k.kitchen.rating ?? 0) >= minRating) &&
      (!category || !!k.menu?.items.some((it) => it.foodItem.category === category)));
    const cmp: Record<SortKey, (a: Suggestion, b: Suggestion) => number> = {
      distance: (a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || (b.kitchen.rating ?? 0) - (a.kitchen.rating ?? 0),
      rating: (a, b) => (b.kitchen.rating ?? 0) - (a.kitchen.rating ?? 0),
      charge: (a, b) => (a.deliveryCharge ?? 0) - (b.deliveryCharge ?? 0),
      price: (a, b) => minPrice(a) - minPrice(b),
    };
    // আজকের মেনু আছে এমন কিচেন সবসময় আগে, তারপর বাছাই করা ক্রম
    const sorted = [...list].sort((a, b) => Number(!!b.menu) - Number(!!a.menu) || cmp[sortBy](a, b));
    return { ownArea: sorted.filter((k) => k.sameArea), around: sorted.filter((k) => !k.sameArea) };
  }, [browse, search, openOnly, minRating, category, sortBy]);

  // ─── খাবার সার্চ: অ্যাডমিন লাইব্রেরির খাবার আগে, তারপর কিচেনের নিজের খাবার (সার্ভারে সাজানো) ─
  useEffect(() => {
    const q = foodQuery.trim();
    let cancelled = false;
    if (!areaId || q.length < 1) {
      // আগের চলমান সার্চ বাতিল হলে তার finally চলে না — তাই লোডার এখানেই বন্ধ করতে হয়
      Promise.resolve().then(() => { if (!cancelled) { setFoodHits(null); setFoodSearching(false); } });
      return () => { cancelled = true; };
    }
    const t = setTimeout(() => {
      setFoodSearching(true);
      api.get('/kitchen/food-search', { params: { q, areaId, radiusKm: effectiveRadius } })
        .then((r) => { if (!cancelled) setFoodHits(r.data.data); })
        .catch(() => { if (!cancelled) setFoodHits([]); })
        .finally(() => { if (!cancelled) setFoodSearching(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [foodQuery, areaId, effectiveRadius]);

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

  const renderQty = (menuId: string, foodId: string, big = false) => {
    const qty = cart[menuId]?.[foodId] || 0;
    const btn = big ? 'w-11 h-11 text-xl' : 'w-9 h-9 text-lg';
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <button type="button" onClick={() => updateQty(menuId, foodId, -1)} disabled={!qty} className={`${btn} rounded-full bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700 font-bold`} aria-label="কমান">−</button>
        <span className={`${big ? 'w-8 text-lg' : 'w-6 text-base'} text-center font-semibold`}>{qty}</span>
        <button type="button" onClick={() => updateQty(menuId, foodId, 1)} className={`${btn} rounded-full bg-green-600 hover:bg-green-700 text-white font-bold`} aria-label="বাড়ান">+</button>
      </div>
    );
  };

  const renderKitchen = ({ kitchen, menu, distanceKm }: Suggestion) => (
    <div key={kitchen._id} id={`kitchen-${kitchen._id}`} className={`scroll-mt-32 bg-white rounded-2xl p-4 sm:p-5 shadow-sm ${menu ? '' : 'opacity-70'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-lg font-bold text-stone-800">{kitchen.kitchenName || kitchen.name}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-sm">
            {!!kitchen.rating && <span className="text-amber-500">⭐ {kitchen.rating.toFixed(1)}</span>}
            {kitchen.area && <span className="text-stone-400">📍 {kitchen.area}</span>}
            {distanceKm ? <span className="text-stone-500">📏 ~{bnNum(distanceKm)} কিমি</span> : null}
            {charges[kitchen._id] !== undefined && <span className="text-green-700">🚚 ডেলিভারি ৳{charges[kitchen._id]}</span>}
          </div>
          {kitchen.kitchenDescription && <p className="text-sm text-stone-500 mt-1">{kitchen.kitchenDescription}</p>}
        </div>
        {menu?.isReadyForPickup && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">প্রস্তুত</span>}
      </div>

      {!menu ? (
        <p className="text-sm text-stone-500">আজকের মেনু এখনো দেওয়া হয়নি।</p>
      ) : (
        <>
          {menu.freeItems.length > 0 && (
            <p className="text-sm text-purple-600 mb-3">🎁 ফ্রি: {menu.freeItems.map((f) => f.name).join(', ')}</p>
          )}
          <div className="divide-y divide-stone-100">
            {menu.items.map((it) => {
              const kitchenName = kitchen.kitchenName || kitchen.name;
              return (
                <div key={it.foodItem._id} className="flex items-center gap-3 py-3 first:pt-0">
                  <FoodPreview
                    food={it.foodItem}
                    price={it.price}
                    subtitle={`🍳 ${kitchenName}`}
                    footer={<div className="flex items-center justify-between gap-3"><span className="text-sm text-stone-600">পরিমাণ</span>{renderQty(menu._id, it.foodItem._id, true)}</div>}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <FoodThumb food={it.foodItem} size="md" />
                    <span className="min-w-0">
                      <span className="block text-base sm:text-lg font-semibold text-stone-800 leading-snug">{it.foodItem.name}</span>
                      <span className="block text-base font-bold text-orange-600">৳{it.price}</span>
                      <span className="block text-xs text-stone-400">{it.foodItem.category}</span>
                    </span>
                  </FoodPreview>
                  {renderQty(menu._id, it.foodItem._id)}
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
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition"
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
      <h1 className="text-xl sm:text-2xl font-bold text-stone-800 mb-1">🔍 কিচেন খুঁজুন</h1>
      <p className="text-sm text-stone-500 mb-4">ঠিকানা বাছুন — সেই এলাকার ঘরোয়া কিচেনের আজকের মেনু থেকে অর্ডার করুন</p>

      {/* ─── ডেলিভারি ঠিকানা ─── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-stone-700 mb-3">🚚 ডেলিভারি ঠিকানা</h2>
        {!addressesLoaded ? (
          <Loader size="sm" inline label="ঠিকানা আনা হচ্ছে…" />
        ) : (
          <div className="space-y-2">
            {addresses.map((a) => (
              <label key={a._id} className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer ${selectedAddressId === a._id ? 'border-green-500 bg-green-50' : 'border-stone-200'}`}>
                <input type="radio" checked={selectedAddressId === a._id} onChange={() => selectAddress(a._id)} className="mt-1 accent-green-600" />
                <span className="text-sm">
                  <b className="text-stone-800">{a.label}</b>{a.isDefault && <span className="text-xs text-green-700"> (ডিফল্ট)</span>}
                  <br /><span className="text-stone-600">{formatAddress(a)}</span>
                </span>
              </label>
            ))}
            <label className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer ${selectedAddressId === NEW_ADDRESS ? 'border-green-500 bg-green-50' : 'border-stone-200'}`}>
              <input type="radio" checked={selectedAddressId === NEW_ADDRESS} onChange={() => selectAddress(NEW_ADDRESS)} className="mt-1 accent-green-600" />
              <span className="text-sm font-medium text-stone-800">+ নতুন ঠিকানা</span>
            </label>
            {selectedAddressId === NEW_ADDRESS && (
              <div className="pl-1 pt-2 space-y-2">
                <AddressFormFields value={newAddress} onChange={setNewAddress} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm text-stone-600">
                    <input type="checkbox" checked={saveNewAddress} onChange={(e) => setSaveNewAddress(e.target.checked)} className="accent-green-600" />
                    অর্ডারের সময় ঠিকানাটি সেভ করুন
                  </label>
                  <button type="button" onClick={saveNewAddressNow} disabled={savingAddress} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
                    {savingAddress ? 'সেভ হচ্ছে…' : '💾 ঠিকানা ও পিন এখনই সেভ করুন'}
                  </button>
                </div>
              </div>
            )}

            {/* সেভ করা ঠিকানায় ম্যাপ পিন দেওয়া/বদলানো */}
            {selectedAddress && (
              pinDraft !== undefined ? (
                <div className="pt-2 space-y-2">
                  <MapPicker
                    value={pinDraft}
                    onChange={setPinDraft}
                    areaCenter={selectedAddress.areaId?.location?.coordinates ?? null}
                    onAreaDetected={(res) => setPinArea(areaForPin(selectedAddress.areaId?._id ?? '', res))}
                    title={`🗺️ "${selectedAddress.label}" ঠিকানার পিন`}
                    defaultOpen
                  />
                  {pinArea && <p className="text-xs text-amber-700">পিনটা {pinArea.name} এলাকায় পড়েছে — সেভ করলে ঠিকানার এলাকাও {pinArea.name} হবে।</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={savePin} disabled={savingAddress} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
                      {savingAddress ? 'সেভ হচ্ছে…' : '💾 পিন সেভ করুন'}
                    </button>
                    <button type="button" onClick={() => { setPinDraft(undefined); setPinArea(null); }} className="text-sm text-stone-500 px-3">বাতিল</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => { setPinDraft(toLatLng(selectedAddress.location)); setPinArea(null); }} className="text-sm text-green-700 hover:underline pt-1">
                  {selectedAddress.location ? '📍 এই ঠিকানার ম্যাপ পিন বদলান' : '📍 এই ঠিকানায় ম্যাপ পিন দিন (চার্জ আরো সঠিক হবে)'}
                </button>
              )
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
          {foodSearching && <div className="mt-2"><Loader size="sm" inline label="খোঁজা হচ্ছে…" /></div>}
          {foodHits && !foodSearching && (
            foodHits.length === 0 ? (
              <p className="text-sm text-stone-500 mt-3">আপনার ও আশেপাশের এলাকার আজকের মেনুতে &quot;{foodQuery}&quot; পাওয়া যায়নি।</p>
            ) : (
              <ul className="mt-3 divide-y divide-stone-100">
                {foodHits.map((h) => {
                  const kName = h.kitchen.kitchenName || h.kitchen.name;
                  return (
                    <li key={`${h.menuId}-${h.food._id}`} className="flex items-center gap-3 py-3">
                      <FoodPreview
                        food={h.food}
                        price={h.price}
                        subtitle={<button type="button" onClick={() => goToKitchen(h.kitchen._id)} className="text-green-700 hover:underline">🍳 {kName}{h.kitchen.rating ? ` · ⭐${h.kitchen.rating.toFixed(1)}` : ''}</button>}
                        footer={<div className="flex items-center justify-between gap-3"><span className="text-sm text-stone-600">পরিমাণ</span>{renderQty(h.menuId, h.food._id, true)}</div>}
                      >
                        <FoodThumb food={h.food} size="md" />
                      </FoodPreview>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-stone-800 leading-snug">
                          {h.food.name}
                          {h.food.source === 'kitchen' && <span className="ml-1 align-middle text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">কিচেনের স্পেশাল</span>}
                        </p>
                        <p className="text-base font-bold text-orange-600">৳{h.price}</p>
                        <button onClick={() => goToKitchen(h.kitchen._id)} className="text-sm text-green-700 hover:underline text-left truncate block max-w-full">
                          {kName}
                          {h.kitchen.rating ? ` · ⭐${h.kitchen.rating.toFixed(1)}` : ''}
                          {h.distanceKm ? ` · ~${h.distanceKm} কিমি` : ' · আপনার এলাকা'}
                        </button>
                      </div>
                      {renderQty(h.menuId, h.food._id)}
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

      {areaId && browse && (
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm mb-4 space-y-3">
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <p className="text-sm font-semibold text-stone-700">📏 কত দূর পর্যন্ত দেখবেন</p>
              {filtersActive && <button onClick={resetFilters} className="text-xs text-red-600 hover:underline">ফিল্টার মুছুন</button>}
            </div>
            <div className="flex gap-2 overflow-x-auto sk-no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
              {RADIUS_OPTIONS.filter((km) => km <= maxKm).map((km) => (
                <button
                  key={km}
                  onClick={() => setRadiusKm(km)}
                  className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-medium transition ${
                    effectiveRadius === km ? 'bg-green-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {km === 0 ? '🏠 শুধু আমার এলাকা' : `${bnNum(km)} কিমি`}
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-500 mt-2">
              🚚 ডেলিভারি: নিজের এলাকায় ৳{browse.pricing.sameAreaFee}
              {browse.pricing.slabs.map((x) => ` · ${bnNum(x.upToKm)} কিমি পর্যন্ত ৳${x.fee}`).join('')}
              {' '}(রাস্তার দূরত্বে) · এর বেশি দূরে অর্ডার হয় না।
              {!pin && ' ঠিকানায় ম্যাপ পিন দিলে দূরত্ব আরো সঠিক হয়।'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white">
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => <option key={k} value={k}>↕ {SORT_LABEL[k]}</option>)}
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">🍽 সব ধরনের খাবার</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={() => setMinRating(minRating ? 0 : 4)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border ${minRating ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-stone-300 text-stone-700'}`}
            >
              ⭐ ৪+ রেটিং
            </button>
            <button
              onClick={() => setOpenOnly(!openOnly)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border ${openOnly ? 'bg-green-50 border-green-400 text-green-800' : 'bg-white border-stone-300 text-stone-700'}`}
            >
              ✅ আজ মেনু আছে
            </button>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔎 কিচেনের নাম দিয়ে খুঁজুন..."
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      )}

      {!areaId ? (
        <p className="text-stone-500">শুরু করতে উপরে ডেলিভারি ঠিকানা (শহর → থানা → এরিয়া) নির্বাচন করুন।</p>
      ) : loading && !browse ? (
        <SkeletonCards count={3} />
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <h2 className="text-lg font-bold text-stone-800 mb-3">🏠 আপনার এলাকার কিচেন {ownArea.length > 0 && <span className="text-sm font-normal text-stone-500">({bnNum(ownArea.length)})</span>}</h2>
          {ownArea.length === 0 ? (
            <p className="text-sm text-stone-500 mb-6 bg-white rounded-2xl p-4">
              {filtersActive || search ? 'ফিল্টারের সাথে মেলে এমন কিচেন আপনার এলাকায় নেই।' : 'এই এলাকায় এখনো কোনো কিচেন নেই।'}
              {effectiveRadius === 0 ? ' উপর থেকে দূরত্ব বাড়িয়ে আশেপাশের কিচেন দেখুন।' : ''}
            </p>
          ) : (
            <div className="space-y-4 sm:space-y-6 mb-8">{ownArea.map(renderKitchen)}</div>
          )}

          {effectiveRadius > 0 && (
            <div>
              <h2 className="text-lg font-bold text-stone-800 mb-1">
                📍 {bnNum(effectiveRadius)} কিমির মধ্যে আশেপাশের কিচেন {around.length > 0 && <span className="text-sm font-normal text-stone-500">({bnNum(around.length)})</span>}
              </h2>
              {browse && browse.areas.length > 0 && (
                <p className="text-xs text-stone-500 mb-4">
                  কাছের এলাকা: {browse.areas.slice(0, 6).map((a) => `${a.name} (${bnNum(a.distanceKm)} কিমি)`).join(', ')}{browse.areas.length > 6 ? ` আরো ${bnNum(browse.areas.length - 6)}টি` : ''}
                </p>
              )}
              {around.length === 0 ? (
                <p className="text-sm text-stone-500 bg-white rounded-2xl p-4">
                  {bnNum(effectiveRadius)} কিমির মধ্যে {filtersActive || search ? 'ফিল্টারের সাথে মেলে এমন ' : ''}আর কোনো কিচেন পাওয়া যায়নি{effectiveRadius < maxKm ? ' — দূরত্ব আরেকটু বাড়িয়ে দেখুন।' : '।'}
                </p>
              ) : (
                <div className="space-y-4 sm:space-y-6">{around.map(renderKitchen)}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
