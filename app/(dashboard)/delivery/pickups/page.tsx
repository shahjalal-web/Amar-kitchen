'use client';
import { toLatLng, mapsLink } from '../../../components/shared/MapPicker';
import { SkeletonCards } from '../../../components/ui/Loader';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';
import { getErrorMessage } from '../../../lib/errors';
import { OrderStatus, StatusBadge } from '../../../components/shared/OrderStatus';
import { AvailabilityToggle, DeliverWithOtp } from '../../../components/shared/DeliveryParts';

interface OrderItem {
  foodItem: { _id: string; name: string } | string;
  quantity: number;
  price: number;
}

interface DeliveryOrder {
  _id: string;
  uniqueCode: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryCharge: number;
  deliveryAddress: string;
  deliveryLocation?: { coordinates: [number, number] } | null;
  distanceKm?: number;
  customerPhone?: string;
  area: string;
  kitchen: { _id: string; name: string; kitchenName?: string; phone: string; area?: string; buildingAddress?: string; kitchenLocation?: { coordinates: [number, number] } | null } | string;
  user: { _id: string; name: string; phone: string } | string;
  items: OrderItem[];
  paymentMethod?: string;
  createdAt: string;
}

export default function DeliveryPickupsPage() {
  const { user } = useAuthStore();
  const [available, setAvailable] = useState<DeliveryOrder[]>([]);
  const [active, setActive] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = useCallback(() =>
    Promise.all([api.get('/delivery/pickups'), api.get('/delivery/my-deliveries')])
      .then(([pickupsRes, activeRes]) => {
        setAvailable(pickupsRes.data.data);
        setActive(activeRes.data.data);
      })
      .catch((err) => toast.error(getErrorMessage(err, 'লোড ব্যর্থ হয়েছে')))
      .finally(() => setLoading(false)), []);

  useEffect(() => { loadData(); }, [loadData]);

  const run = async (id: string, fn: () => Promise<{ data: { message?: string } }>) => {
    setProcessingId(id);
    try {
      const res = await fn();
      toast.success(res.data.message || 'আপডেট হয়েছে');
      await loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে'));
    } finally {
      setProcessingId(null);
    }
  };

  const claim = (id: string) => run(id, () => api.post(`/delivery/orders/${id}/claim`));
  const setStatus = (id: string, status: OrderStatus) => run(id, () => api.patch(`/orders/${id}/status`, { status }));

  const renderOrder = (order: DeliveryOrder, mine: boolean) => {
    const kitchen = typeof order.kitchen === 'string' ? null : order.kitchen;
    const customer = typeof order.user === 'string' ? null : order.user;
    const busy = processingId === order._id;

    return (
      <div key={order._id} className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-stone-800">কোড: {order.uniqueCode}</p>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-stone-600">
              🍳 পিকআপ: {kitchen?.kitchenName || kitchen?.name || '—'} · 📞 {kitchen?.phone || ''}
              {kitchen?.area && <span className="text-stone-400"> · {kitchen.area}{kitchen.buildingAddress ? `, ${kitchen.buildingAddress}` : ''}</span>}
            </p>
            <p className="text-sm text-stone-600">🏠 ডেলিভারি: {customer?.name || '—'} · 📞 {order.customerPhone || customer?.phone || ''}</p>
            <p className="text-sm text-stone-500">{order.deliveryAddress}</p>
            <div className="flex flex-wrap gap-3 text-xs">
              {(() => { const p = toLatLng(kitchen?.kitchenLocation); return p ? <a href={mapsLink(p)} target="_blank" rel="noopener noreferrer" className="text-orange-700 hover:underline">🗺️ পিকআপ (কিচেন) ম্যাপে</a> : null; })()}
              {(() => { const p = toLatLng(order.deliveryLocation); return p ? <a href={mapsLink(p)} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">🗺️ গ্রাহকের লোকেশন ম্যাপে</a> : null; })()}
              {order.distanceKm ? <span className="text-stone-500">📏 ~{order.distanceKm} কিমি</span> : null}
            </div>
            <p className="text-xs text-stone-400">{new Date(order.createdAt).toLocaleString('bn-BD')}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-orange-600">৳{order.totalAmount + order.deliveryCharge}</p>
            <p className="text-xs text-stone-400">{order.paymentMethod === 'cash' ? 'ক্যাশ অন ডেলিভারি' : 'পরিশোধিত'} · ডেলিভারি চার্জ ৳{order.deliveryCharge}</p>
          </div>
        </div>

        <ul className="text-sm text-stone-600 mt-3 space-y-0.5">
          {order.items.map((it, i) => {
            const food = typeof it.foodItem === 'string' ? null : it.foodItem;
            return <li key={i}>• {food?.name || '—'} × {it.quantity}</li>;
          })}
        </ul>

        <div className="flex flex-wrap gap-2 mt-4">
          {!mine && (
            <button onClick={() => claim(order._id)} disabled={busy} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
              এই ডেলিভারিটি নেব
            </button>
          )}
          {mine && order.status === 'accepted' && (
            <p className="text-sm text-amber-700">⏳ কিচেন এখনো রান্না করছে — প্রস্তুত হলে পিকআপ করতে পারবেন</p>
          )}
          {mine && order.status === 'ready' && (
            <button onClick={() => setStatus(order._id, 'picked_up')} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
              📦 পিকআপ করেছি
            </button>
          )}
          {mine && order.status === 'picked_up' && <DeliverWithOtp orderId={order._id} onDone={loadData} />}
          {mine && order.status === 'ready' && (
            <Link href={`/delivery/scan?code=${encodeURIComponent(order.uniqueCode)}`} className="text-sm text-green-700 hover:underline self-center">
              কোড স্ক্যান করে কনফার্ম →
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">📦 পিকআপ ও ডেলিভারি</h1>
      <p className="text-stone-500 mb-6">আপনার এলাকার নতুন ডেলিভারি নিন এবং চলমান ডেলিভারির স্ট্যাটাস আপডেট করুন</p>
      <AvailabilityToggle onChange={() => loadData()} />

      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <>
          <h2 className="font-semibold text-stone-700 mb-3">🚴 আমার ডেলিভারি</h2>
          {active.length === 0 ? (
            <p className="text-stone-500 mb-8">কোনো চলমান ডেলিভারি নেই।</p>
          ) : (
            <div className="space-y-4 mb-8">{active.map((o) => renderOrder(o, true))}</div>
          )}

          <h2 className="font-semibold text-stone-700 mb-3">
            🆕 এলাকার নতুন ডেলিভারি
            {user?.deliveryAreaIds?.length ? ` (${user.deliveryAreaIds.length}টি এরিয়া নির্বাচিত)` : ''}
          </h2>
          {user?.isAvailable === false ? (
            <p className="text-stone-500">আপনি এখন অফ আছেন — উপরের সুইচ চালু করলে এলাকার নতুন ডেলিভারি দেখবেন।</p>
          ) : available.length === 0 ? (
            <p className="text-stone-500">
              এখন কোনো নতুন ডেলিভারি নেই। আপনার ডেলিভারি এরিয়া{' '}
              <Link href="/profile" className="text-orange-600 underline">প্রোফাইলে</Link> সেট করা আছে কিনা দেখুন।
            </p>
          ) : (
            <div className="space-y-4">{available.map((o) => renderOrder(o, false))}</div>
          )}
        </>
      )}
    </div>
  );
}
