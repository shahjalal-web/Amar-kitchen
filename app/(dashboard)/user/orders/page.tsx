'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'ready' | 'picked_up' | 'delivered' | 'cancelled' | 'resell' | 'resold';

interface OrderItem {
  foodItem: { _id: string; name: string } | string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  kitchen: { _id: string; name: string; kitchenName?: string } | string;
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
  { key: 'picked_up', label: 'পিকআপ হয়েছে' },
  { key: 'delivered', label: 'ডেলিভার্ড' },
  { key: 'rejected', label: 'প্রত্যাখ্যাত' },
  { key: 'cancelled', label: 'বাতিল' },
  { key: 'resell', label: 'রিসেল' },
  { key: 'resold', label: 'রিসোল্ড' },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'নতুন',
  accepted: 'গ্রহণকৃত',
  rejected: 'প্রত্যাখ্যাত',
  ready: 'প্রস্তুত',
  picked_up: 'পিকআপ হয়েছে',
  delivered: 'ডেলিভার্ড',
  cancelled: 'বাতিল',
  resell: 'রিসেল',
  resold: 'রিসোল্ড',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  ready: 'bg-green-100 text-green-700',
  picked_up: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-stone-100 text-stone-600',
  resell: 'bg-purple-100 text-purple-700',
  resold: 'bg-purple-100 text-purple-700',
};

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadOrders = () => {
    setLoading(true);
    api.get('/orders/mine')
      .then((r) => setOrders(r.data.data))
      .catch(() => toast.error('লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

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
        <p className="text-stone-500">লোড হচ্ছে...</p>
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                    </div>
                    <p className="text-sm text-stone-600">{kitchen?.kitchenName || kitchen?.name || ''}</p>
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
