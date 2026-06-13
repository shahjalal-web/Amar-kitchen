'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';

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
}

interface DailyMenu {
  _id: string;
  kitchen: KitchenRef;
  items: MenuItem[];
  freeItems: FoodItemRef[];
  isReadyForPickup: boolean;
}

export default function UserBrowsePage() {
  const { user } = useAuthStore();
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, Record<string, number>>>({});
  const [orderingId, setOrderingId] = useState<string | null>(null);
  const [deliveryEstimate, setDeliveryEstimate] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.area) { setLoading(false); return; }
    Promise.all([
      api.get('/kitchen/nearby', { params: { area: user.area } }),
      api.get('/kitchen/delivery-charge', { params: { count: 1 } }),
    ])
      .then(([menuRes, chargeRes]) => {
        setMenus(menuRes.data.data);
        setDeliveryEstimate(chargeRes.data.data.charge);
      })
      .catch(() => toast.error('লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  }, [user?.area]);

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

    setOrderingId(menu._id);
    try {
      await api.post('/orders', {
        kitchenId: menu.kitchen._id,
        items,
        totalAmount: getSubtotal(menu),
        paymentMethod: 'cash',
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
      <p className="text-stone-500 mb-2">আপনার এলাকার কিচেনের আজকের মেনু থেকে অর্ডার করুন</p>
      {deliveryEstimate !== null && (
        <p className="text-xs text-green-600 mb-6">আনুমানিক ডেলিভারি চার্জ: ৳{deliveryEstimate} (একই বিল্ডিংয়ে আরও অর্ডার থাকলে কম পড়বে)</p>
      )}

      {!user?.area ? (
        <p className="text-stone-500">প্রোফাইলে এলাকা সেট করা নেই।</p>
      ) : loading ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : menus.length === 0 ? (
        <p className="text-stone-500">আজ আপনার এলাকায় কোনো কিচেনের মেনু পাওয়া যায়নি।</p>
      ) : (
        <div className="space-y-6">
          {menus.map((menu) => (
            <div key={menu._id} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-stone-800">{menu.kitchen.kitchenName || menu.kitchen.name}</p>
                  {!!menu.kitchen.rating && <p className="text-xs text-amber-500">⭐ {menu.kitchen.rating.toFixed(1)}</p>}
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
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
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
