'use client';
import { SkeletonCards } from '../../../components/ui/Loader';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import {
  OrderStatus, StatusEvent, StatusBadge, StatusProgress, StatusTimeline,
} from '../../../components/shared/OrderStatus';
import { DeliveryInfo, DeliveryBoyRef } from '../../../components/shared/DeliveryParts';
import { getErrorMessage } from '../../../lib/errors';

interface OrderItem {
  foodItem: { _id: string; name: string } | string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  kitchen: { _id: string; name: string; kitchenName?: string; phone?: string } | string;
  deliveryBoy?: DeliveryBoyRef | null;
  deliveryOtp?: string;
  deliveryMode?: 'self' | 'delivery_boy';
  statusHistory?: StatusEvent[];
  items: OrderItem[];
  totalAmount: number;
  deliveryCharge: number;
  status: OrderStatus;
  uniqueCode: string;
  deliveryAddress: string;
  createdAt: string;
}

const STATUS_OPTIONS: { key: 'all' | OrderStatus; label: string }[] = [
  { key: 'all', label: 'সব' },
  { key: 'pending', label: 'নতুন' },
  { key: 'accepted', label: 'গ্রহণকৃত' },
  { key: 'ready', label: 'প্রস্তুত' },
  { key: 'picked_up', label: 'ডেলিভারির পথে' },
  { key: 'delivered', label: 'ডেলিভার্ড' },
  { key: 'rejected', label: 'প্রত্যাখ্যাত' },
  { key: 'cancelled', label: 'বাতিল' },
  { key: 'resell', label: 'রিসেল' },
  { key: 'resold', label: 'রিসোল্ড' },
];

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadOrders = () => {
    api.get('/orders/mine')
      .then((r) => setOrders(r.data.data))
      .catch(() => toast.error('লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const confirmReceived = async (id: string) => {
    if (!confirm('আপনি কি খাবার হাতে পেয়েছেন? নিশ্চিত করলে অর্ডারটি ডেলিভার্ড হয়ে যাবে।')) return;
    setProcessingId(id);
    try {
      const res = await api.post(`/orders/${id}/confirm-delivery`);
      toast.success(res.data.message);
      loadOrders();
    } catch (err) {
      toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('আপনি কি এই অর্ডারটি বাতিল করতে চান?')) return;
    setProcessingId(id);
    try {
      const res = await api.delete(`/orders/${id}/cancel`);
      toast.success(res.data.message);
      loadOrders();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'ব্যর্থ হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">📋 আমার অর্ডার</h1>
      <p className="text-stone-500 mb-6">আপনার সকল অর্ডারের অবস্থা দেখুন</p>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === opt.key
                ? 'bg-orange-500 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCards count={4} />
      ) : filteredOrders.length === 0 ? (
        <p className="text-stone-500">কোনো অর্ডার নেই।</p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const kitchen = typeof order.kitchen === 'string' ? null : order.kitchen;
            return (
              <div key={order._id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-stone-800">কোড: {order.uniqueCode}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-stone-600">
                      {kitchen?.kitchenName || kitchen?.name || ''}{kitchen?.phone && <span className="text-stone-400"> · 📞 {kitchen.phone}</span>}
                    </p>
                    <DeliveryInfo status={order.status} deliveryMode={order.deliveryMode} deliveryBoy={order.deliveryBoy} kitchenPhone={kitchen?.phone} viewer="user" />
                    <p className="text-sm text-stone-500">{order.deliveryAddress}</p>
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
                    return <li key={i}>• {food?.name || '—'} × {it.quantity} (৳{it.price})</li>;
                  })}
                </ul>

                <StatusProgress status={order.status} />
                <details className="mt-2">
                  <summary className="text-xs text-green-700 cursor-pointer select-none">স্ট্যাটাসের ইতিহাস দেখুন</summary>
                  <StatusTimeline history={order.statusHistory} />
                </details>
                {/* খাবার পথে থাকলে: গোপন ডেলিভারি কোড + নিজে নিশ্চিত করার বাটন */}
                {order.status === 'picked_up' && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div>
                      <p className="text-xs text-emerald-800">খাবার হাতে পাওয়ার পর ডেলিভারিকারীকে এই কোড দিন</p>
                      <p className="text-3xl font-bold tracking-[0.3em] text-emerald-900">{order.deliveryOtp ?? '----'}</p>
                      <p className="text-[11px] text-stone-500">খাবার না পেয়ে কাউকে কোড দেবেন না। কোডটি ইমেইলেও পাঠানো হয়েছে।</p>
                    </div>
                    <button
                      onClick={() => confirmReceived(order._id)}
                      disabled={processingId === order._id}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                    >
                      ✅ খাবার পেয়েছি
                    </button>
                  </div>
                )}

                {(order.status === 'pending' || order.status === 'accepted') && (
                  <button
                    onClick={() => handleCancel(order._id)}
                    disabled={processingId === order._id}
                    className="mt-4 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition"
                  >
                    অর্ডার বাতিল করুন
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
