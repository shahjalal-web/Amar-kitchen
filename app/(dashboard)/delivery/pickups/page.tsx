'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';

interface OrderItem {
  foodItem: { _id: string; name: string } | string;
  quantity: number;
  price: number;
}

interface DeliveryOrder {
  _id: string;
  uniqueCode: string;
  status: string;
  totalAmount: number;
  deliveryCharge: number;
  deliveryAddress: string;
  buildingName: string;
  area: string;
  kitchen: { _id: string; name: string; kitchenName?: string; phone: string } | string;
  user: { _id: string; name: string; phone: string } | string;
  items: OrderItem[];
  createdAt: string;
}

export default function DeliveryPickupsPage() {
  const { user } = useAuthStore();
  const [available, setAvailable] = useState<DeliveryOrder[]>([]);
  const [active, setActive] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      user?.area ? api.get('/delivery/pickups', { params: { area: user.area } }) : Promise.resolve({ data: { data: [] } }),
      api.get('/delivery/my-deliveries'),
    ])
      .then(([pickupsRes, activeRes]) => {
        setAvailable(pickupsRes.data.data);
        setActive(activeRes.data.data);
      })
      .catch(() => toast.error('লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.area]);

  const renderOrder = (order: DeliveryOrder, actionLabel: string) => {
    const kitchen = typeof order.kitchen === 'string' ? null : order.kitchen;
    const customer = typeof order.user === 'string' ? null : order.user;

    return (
      <div key={order._id} className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-stone-800">কোড: {order.uniqueCode}</p>
            <p className="text-sm text-stone-600">কিচেন: {kitchen?.kitchenName || kitchen?.name || '—'} · {kitchen?.phone || ''}</p>
            <p className="text-sm text-stone-600">গ্রাহক: {customer?.name || '—'} · {customer?.phone || ''}</p>
            <p className="text-sm text-stone-500">{order.buildingName}, {order.deliveryAddress}</p>
            <p className="text-xs text-stone-400 mt-1">{new Date(order.createdAt).toLocaleString('bn-BD')}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-orange-600">৳{order.totalAmount}</p>
            <p className="text-xs text-stone-400">ডেলিভারি চার্জ: ৳{order.deliveryCharge}</p>
          </div>
        </div>

        <ul className="text-sm text-stone-600 mt-3 space-y-0.5">
          {order.items.map((it, i) => {
            const food = typeof it.foodItem === 'string' ? null : it.foodItem;
            return <li key={i}>• {food?.name || '—'} × {it.quantity}</li>;
          })}
        </ul>

        <Link
          href={`/delivery/scan?code=${encodeURIComponent(order.uniqueCode)}`}
          className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {actionLabel}
        </Link>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">📦 পিকআপ লিস্ট</h1>
      <p className="text-stone-500 mb-8">এলাকার প্রস্তুত অর্ডার ও চলমান ডেলিভারি দেখুন</p>

      {loading ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : (
        <>
          <h2 className="font-semibold text-stone-700 mb-3">🆕 নতুন পিকআপ (এলাকা: {user?.area || 'সেট করা নেই'})</h2>
          {!user?.area ? (
            <p className="text-stone-500 mb-8">প্রোফাইলে এলাকা সেট করা নেই।</p>
          ) : available.length === 0 ? (
            <p className="text-stone-500 mb-8">এখন কোনো পিকআপ প্রস্তুত নেই।</p>
          ) : (
            <div className="space-y-4 mb-8">
              {available.map((o) => renderOrder(o, 'পিকআপ কনফার্ম করুন →'))}
            </div>
          )}

          <h2 className="font-semibold text-stone-700 mb-3">🚴 আমার চলমান ডেলিভারি</h2>
          {active.length === 0 ? (
            <p className="text-stone-500">কোনো চলমান ডেলিভারি নেই।</p>
          ) : (
            <div className="space-y-4">
              {active.map((o) => renderOrder(o, 'ডেলিভারি কনফার্ম করুন →'))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
