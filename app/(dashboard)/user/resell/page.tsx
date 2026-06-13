'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';

interface OrderItem {
  foodItem: { _id: string; name: string } | string;
  quantity: number;
  price: number;
}

interface ResellOrder {
  _id: string;
  kitchen: { _id: string; name: string; kitchenName?: string } | string;
  items: OrderItem[];
  totalAmount: number;
  resellPrice: number;
  buildingName: string;
  deliveryAddress: string;
  area: string;
  createdAt: string;
}

export default function UserResellPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<ResellOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const loadOrders = () => {
    if (!user?.area) { setLoading(false); return; }
    setLoading(true);
    api.get('/orders/resell', { params: { area: user.area } })
      .then((r) => setOrders(r.data.data))
      .catch(() => toast.error('লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, [user?.area]);

  const handleBuy = async (id: string) => {
    setBuyingId(id);
    try {
      await api.post(`/orders/resell/${id}/buy`);
      toast.success('রিসেল অর্ডার কেনা হয়েছে');
      setOrders((o) => o.filter((x) => x._id !== id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'ব্যর্থ হয়েছে');
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">♻️ রিসেল</h1>
      <p className="text-stone-500 mb-6">বাতিল হওয়া অর্ডার ছাড়ে কিনুন</p>

      {!user?.area ? (
        <p className="text-stone-500">প্রোফাইলে এলাকা সেট করা নেই।</p>
      ) : loading ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : orders.length === 0 ? (
        <p className="text-stone-500">এই মুহূর্তে কোনো রিসেল অফার নেই।</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const kitchen = typeof order.kitchen === 'string' ? null : order.kitchen;
            const discountPct = Math.round((1 - order.resellPrice / order.totalAmount) * 100);
            return (
              <div key={order._id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-stone-800">{kitchen?.kitchenName || kitchen?.name || '—'}</p>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{discountPct}% ছাড়</span>
                    </div>
                    <p className="text-sm text-stone-500">{order.buildingName}, {order.deliveryAddress}</p>
                    <p className="text-xs text-stone-400 mt-1">{new Date(order.createdAt).toLocaleString('bn-BD')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-stone-400 line-through">৳{order.totalAmount}</p>
                    <p className="text-xl font-bold text-green-600">৳{order.resellPrice}</p>
                  </div>
                </div>

                <ul className="text-sm text-stone-600 mt-3 space-y-0.5">
                  {order.items.map((it, i) => {
                    const food = typeof it.foodItem === 'string' ? null : it.foodItem;
                    return <li key={i}>• {food?.name || '—'} × {it.quantity}</li>;
                  })}
                </ul>

                <button
                  onClick={() => handleBuy(order._id)}
                  disabled={buyingId === order._id}
                  className="mt-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
                >
                  {buyingId === order._id ? 'কেনা হচ্ছে...' : 'কিনুন'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
