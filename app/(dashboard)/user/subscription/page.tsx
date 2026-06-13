'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';

type SubStatus = 'active' | 'cancel_pending' | 'cancelled';

interface FoodRef {
  _id: string;
  name: string;
  image: string;
}

interface SubItem {
  foodItem: FoodRef | string;
  quantity: number;
  price: number;
}

interface KitchenRef {
  _id: string;
  name: string;
  kitchenName?: string;
}

interface Subscription {
  _id: string;
  kitchen: KitchenRef | string;
  package?: { _id: string; name: string } | string;
  customItems: SubItem[];
  totalDailyAmount: number;
  status: SubStatus;
  startDate: string;
  cancelEffectiveDate?: string;
}

interface MenuItem {
  foodItem: FoodRef;
  price: number;
  isFree: boolean;
}

interface DailyMenu {
  _id: string;
  kitchen: KitchenRef;
  items: MenuItem[];
  freeItems: FoodRef[];
}

const SUB_STATUS_LABEL: Record<SubStatus, string> = {
  active: '✅ সক্রিয়',
  cancel_pending: '⏳ আগামীকাল থেকে বন্ধ হবে',
  cancelled: '❌ বাতিল',
};

const SUB_STATUS_COLOR: Record<SubStatus, string> = {
  active: 'bg-green-100 text-green-700',
  cancel_pending: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-stone-100 text-stone-600',
};

export default function UserSubscriptionPage() {
  const { user } = useAuthStore();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, Record<string, number>>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    const requests: Promise<unknown>[] = [api.get('/subscription/mine')];
    if (user?.area) requests.push(api.get('/kitchen/nearby', { params: { area: user.area } }));

    Promise.all(requests)
      .then((results) => {
        setSubs((results[0] as { data: { data: Subscription[] } }).data.data);
        if (results[1]) setMenus((results[1] as { data: { data: DailyMenu[] } }).data.data);
      })
      .catch(() => toast.error('লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.area]);

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

  const handleCancel = async (id: string) => {
    if (!confirm('আগামীকাল থেকে সাবস্ক্রিপশন বন্ধ করতে চান?')) return;
    setProcessingId(id);
    try {
      await api.delete(`/subscription/${id}/cancel`);
      toast.success('সাবস্ক্রিপশন ক্যান্সেল রিকোয়েস্ট নেওয়া হয়েছে');
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'ব্যর্থ হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubscribe = async (menu: DailyMenu) => {
    const menuCart = cart[menu._id] || {};
    const customItems = menu.items
      .filter((it) => (menuCart[it.foodItem._id] || 0) > 0)
      .map((it) => ({ foodItem: it.foodItem._id, quantity: menuCart[it.foodItem._id], price: it.price }));

    if (customItems.length === 0) return toast.error('অন্তত একটি খাবার নির্বাচন করুন');

    setSubscribingId(menu._id);
    try {
      await api.post('/subscription', {
        kitchenId: menu.kitchen._id,
        customItems,
        totalDailyAmount: getSubtotal(menu),
      });
      toast.success('সাবস্ক্রিপশন সফল হয়েছে');
      setCart((prev) => ({ ...prev, [menu._id]: {} }));
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'ব্যর্থ হয়েছে');
    } finally {
      setSubscribingId(null);
    }
  };

  const subscribedKitchenIds = new Set(
    subs.filter((s) => s.status !== 'cancelled').map((s) => (typeof s.kitchen === 'string' ? s.kitchen : s.kitchen._id))
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">🔔 সাবস্ক্রিপশন</h1>
      <p className="text-stone-500 mb-6">প্রতিদিনের জন্য খাবার সাবস্ক্রাইব করুন</p>

      {loading ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : (
        <>
          <h2 className="font-semibold text-stone-700 mb-3">আমার সাবস্ক্রিপশন</h2>
          {subs.length === 0 ? (
            <p className="text-stone-500 mb-8">কোনো সাবস্ক্রিপশন নেই।</p>
          ) : (
            <div className="space-y-4 mb-8">
              {subs.map((sub) => {
                const kitchen = typeof sub.kitchen === 'string' ? null : sub.kitchen;
                return (
                  <div key={sub._id} className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-stone-800">{kitchen?.kitchenName || kitchen?.name || '—'}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${SUB_STATUS_COLOR[sub.status]}`}>{SUB_STATUS_LABEL[sub.status]}</span>
                        </div>
                        <ul className="text-sm text-stone-600 space-y-0.5">
                          {sub.customItems.map((it, i) => {
                            const food = typeof it.foodItem === 'string' ? null : it.foodItem;
                            return <li key={i}>• {food?.name || '—'} × {it.quantity}</li>;
                          })}
                        </ul>
                        <p className="text-xs text-stone-400 mt-1">শুরু: {new Date(sub.startDate).toLocaleDateString('bn-BD')}</p>
                        {sub.cancelEffectiveDate && (
                          <p className="text-xs text-amber-600 mt-0.5">বন্ধ হবে: {new Date(sub.cancelEffectiveDate).toLocaleDateString('bn-BD')}</p>
                        )}
                      </div>
                      <p className="text-xl font-bold text-orange-600">৳{sub.totalDailyAmount}/দিন</p>
                    </div>

                    {sub.status === 'active' && (
                      <button
                        onClick={() => handleCancel(sub._id)}
                        disabled={processingId === sub._id}
                        className="mt-4 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition"
                      >
                        সাবস্ক্রিপশন বন্ধ করুন
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <h2 className="font-semibold text-stone-700 mb-3">নতুন সাবস্ক্রিপশন শুরু করুন</h2>
          {!user?.area ? (
            <p className="text-stone-500">প্রোফাইলে এলাকা সেট করা নেই।</p>
          ) : menus.length === 0 ? (
            <p className="text-stone-500">আপনার এলাকায় কোনো কিচেনের মেনু পাওয়া যায়নি।</p>
          ) : (
            <div className="space-y-6">
              {menus.map((menu) => {
                const alreadySubscribed = subscribedKitchenIds.has(menu.kitchen._id);
                return (
                  <div key={menu._id} className="bg-white rounded-2xl p-5 shadow-sm">
                    <p className="font-semibold text-stone-800 mb-3">{menu.kitchen.kitchenName || menu.kitchen.name}</p>

                    {alreadySubscribed ? (
                      <p className="text-sm text-stone-500">আপনি ইতিমধ্যে এই কিচেনে সাবস্ক্রাইব করা আছেন।</p>
                    ) : (
                      <>
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
                          <p className="text-lg font-bold text-orange-600">দৈনিক: ৳{getSubtotal(menu)}</p>
                          <button
                            onClick={() => handleSubscribe(menu)}
                            disabled={subscribingId === menu._id || getSubtotal(menu) === 0}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
                          >
                            {subscribingId === menu._id ? 'সাবস্ক্রাইব হচ্ছে...' : 'সাবস্ক্রাইব করুন'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
