'use client';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { getErrorMessage } from '../../../lib/errors';
import {
  OrderStatus, StatusEvent, StatusBadge, StatusTimeline,
} from '../../../components/shared/OrderStatus';
import LocationPicker from '../../../components/shared/LocationPicker';
import { DeliveryInfo, DeliverWithOtp, DeliveryBoyRef } from '../../../components/shared/DeliveryParts';

interface OrderItem {
  foodItem: { _id: string; name: string } | string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  user: { _id: string; name: string; phone: string } | string;
  items: OrderItem[];
  totalAmount: number;
  deliveryCharge: number;
  status: OrderStatus;
  uniqueCode: string;
  deliveryAddress: string;
  customerPhone?: string;
  area: string;
  thana?: string;
  areaId?: string;
  deliveryMode?: 'self' | 'delivery_boy';
  deliveryBoy?: DeliveryBoyRef | null;
  statusHistory?: StatusEvent[];
  createdAt: string;
}

interface DeliveryBoy {
  _id: string;
  name: string;
  phone: string;
  activeDeliveries: number;
  deliveryAreaIds: { _id: string; name: string }[];
}

const STATUS_OPTIONS: { key: 'all' | OrderStatus; label: string }[] = [
  { key: 'all', label: 'সব' },
  { key: 'pending', label: 'নতুন' },
  { key: 'accepted', label: 'গ্রহণকৃত' },
  { key: 'ready', label: 'রান্না শেষ' },
  { key: 'picked_up', label: 'ডেলিভারির পথে' },
  { key: 'delivered', label: 'ডেলিভার্ড' },
  { key: 'rejected', label: 'প্রত্যাখ্যাত' },
  { key: 'cancelled', label: 'বাতিল' },
];

const btn = 'disabled:opacity-50 text-sm font-medium px-4 py-2 rounded-lg transition';

export default function KitchenOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ডেলিভারি বয় খোঁজার প্যানেল
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [boySearchArea, setBoySearchArea] = useState('');
  const [boyQuery, setBoyQuery] = useState('');
  const [boys, setBoys] = useState<DeliveryBoy[]>([]);
  const [boysLoading, setBoysLoading] = useState(false);

  const loadOrders = useCallback((status: 'all' | OrderStatus) => {
    const params = status === 'all' ? {} : { status };
    return api.get('/orders/kitchen', { params })
      .then((r) => setOrders(r.data.data))
      .catch(() => toast.error('লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadOrders(filter); }, [filter, loadOrders]);

  const run = async (id: string, fn: () => Promise<{ data: { message?: string } }>) => {
    setProcessingId(id);
    try {
      const res = await fn();
      toast.success(res.data.message || 'আপডেট হয়েছে');
      await loadOrders(filter);
    } catch (err) {
      toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে'));
    } finally {
      setProcessingId(null);
    }
  };

  const respond = (id: string, action: 'accept' | 'reject') =>
    run(id, () => api.patch(`/orders/${id}/respond`, { action }));
  const setStatus = (id: string, status: OrderStatus) =>
    run(id, () => api.patch(`/orders/${id}/status`, { status }));
  const deliverSelf = (id: string) =>
    run(id, () => api.patch(`/orders/${id}/assign`, { mode: 'self' }));

  // ─── ডেলিভারি বয় খোঁজা ──────────────────────────────────
  const searchBoys = useCallback((areaId: string, q: string) => {
    setBoysLoading(true);
    api.get('/kitchen/delivery-boys', { params: { areaId: areaId || undefined, q: q || undefined } })
      .then((r) => setBoys(r.data.data))
      .catch((err) => toast.error(getErrorMessage(err, 'ডেলিভারি বয় লোড ব্যর্থ হয়েছে')))
      .finally(() => setBoysLoading(false));
  }, []);

  const openAssign = (order: Order) => {
    setAssigningOrder(order);
    setBoySearchArea('');
    setBoyQuery('');
    searchBoys('', '');
  };

  const assignBoy = async (boy: DeliveryBoy) => {
    if (!assigningOrder) return;
    const id = assigningOrder._id;
    setAssigningOrder(null);
    await run(id, () => api.patch(`/orders/${id}/assign`, { mode: 'delivery_boy', deliveryBoyId: boy._id }));
  };

  const renderActions = (order: Order) => {
    const busy = processingId === order._id;
    const canAssign = order.status === 'accepted' || order.status === 'ready';
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {order.status === 'pending' && (
          <>
            <p className="w-full text-xs text-stone-500">গ্রহণ করার পর নিজে ডেলিভারি দেওয়া বা ডেলিভারি বয় বাছার অপশন আসবে।</p>
            <button onClick={() => respond(order._id, 'accept')} disabled={busy} className={`${btn} bg-green-600 hover:bg-green-700 text-white`}>গ্রহণ করুন</button>
            <button onClick={() => respond(order._id, 'reject')} disabled={busy} className={`${btn} bg-red-50 hover:bg-red-100 text-red-600`}>প্রত্যাখ্যান করুন</button>
          </>
        )}
        {order.status === 'accepted' && (
          <button onClick={() => setStatus(order._id, 'ready')} disabled={busy} className={`${btn} bg-green-600 hover:bg-green-700 text-white`}>✅ রান্না শেষ (প্রস্তুত)</button>
        )}
        {canAssign && order.deliveryMode !== 'self' && (
          <button onClick={() => deliverSelf(order._id)} disabled={busy} className={`${btn} bg-orange-50 hover:bg-orange-100 text-orange-700`}>🚚 নিজে ডেলিভারি দেব</button>
        )}
        {canAssign && (
          <button onClick={() => openAssign(order)} disabled={busy} className={`${btn} bg-indigo-50 hover:bg-indigo-100 text-indigo-700`}>
            🛵 {order.deliveryBoy ? 'ডেলিভারি বয় বদলান' : 'ডেলিভারি বয় খুঁজুন'}
          </button>
        )}
        {order.deliveryMode === 'self' && order.status === 'ready' && (
          <button onClick={() => setStatus(order._id, 'picked_up')} disabled={busy} className={`${btn} bg-indigo-600 hover:bg-indigo-700 text-white`}>ডেলিভারিতে বের হয়েছি</button>
        )}
        {/* ডেলিভার্ড শুধু ডেলিভারিকারী করতে পারে — নিজে দিলে কিচেন, নইলে ডেলিভারি বয়; গ্রাহকের কোড লাগে */}
        {order.deliveryMode === 'self' && order.status === 'picked_up' && (
          <DeliverWithOtp orderId={order._id} onDone={() => loadOrders(filter)} />
        )}
        {order.deliveryMode === 'delivery_boy' && order.status === 'picked_up' && (
          <p className="text-xs text-stone-500">ডেলিভারি বয় গ্রাহকের কোড দিয়ে অথবা গ্রাহক অ্যাপ থেকে নিশ্চিত করলে ডেলিভার্ড হবে।</p>
        )}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">📋 অর্ডার</h1>
      <p className="text-stone-500 mb-6">অর্ডার গ্রহণ করুন, স্ট্যাটাস আপডেট করুন, নিজে ডেলিভারি দিন বা ডেলিভারি বয় নির্ধারণ করুন</p>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => { setLoading(true); setFilter(opt.key); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === opt.key ? 'bg-orange-500 text-white' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : orders.length === 0 ? (
        <p className="text-stone-500">কোনো অর্ডার নেই।</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const customer = typeof order.user === 'string' ? null : order.user;
            return (
              <div key={order._id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-stone-800">কোড: {order.uniqueCode}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-stone-600">{customer ? `${customer.name} · 📞 ${order.customerPhone || customer.phone}` : ''}</p>
                    <p className="text-sm text-stone-500">{order.deliveryAddress}</p>
                    <DeliveryInfo status={order.status} deliveryMode={order.deliveryMode} deliveryBoy={order.deliveryBoy} viewer="kitchen" />
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

                {renderActions(order)}

                <details className="mt-3">
                  <summary className="text-xs text-green-700 cursor-pointer select-none">স্ট্যাটাসের ইতিহাস</summary>
                  <StatusTimeline history={order.statusHistory} />
                </details>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ডেলিভারি বয় খোঁজার প্যানেল ─── */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setAssigningOrder(null)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-800">🛵 ডেলিভারি বয় নির্বাচন — {assigningOrder.uniqueCode}</h2>
              <button onClick={() => setAssigningOrder(null)} className="text-stone-400 hover:text-stone-700 text-xl" aria-label="বন্ধ করুন">×</button>
            </div>
            <p className="text-xs text-stone-500 mb-3">
              ডিফল্টভাবে আপনার কিচেনের এলাকার ডেলিভারি বয় দেখানো হচ্ছে। অন্য এলাকা (যেমন গ্রাহকের এলাকা: {assigningOrder.area}) বাছতে পারেন।
            </p>
            <div className="space-y-2 mb-3">
              <LocationPicker value={boySearchArea} onChange={(id) => { setBoySearchArea(id); if (id) searchBoys(id, boyQuery); }} showSearch={false} />
              <div className="flex gap-2">
                <input
                  value={boyQuery}
                  onChange={(e) => setBoyQuery(e.target.value)}
                  placeholder="নাম বা ফোন নম্বর"
                  className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button onClick={() => searchBoys(boySearchArea, boyQuery)} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 rounded-lg">খুঁজুন</button>
                {boySearchArea && (
                  <button onClick={() => { setBoySearchArea(''); searchBoys('', boyQuery); }} className="text-xs text-stone-500 px-2">নিজের এলাকা</button>
                )}
              </div>
            </div>

            {boysLoading ? (
              <p className="text-sm text-stone-500">খোঁজা হচ্ছে...</p>
            ) : boys.length === 0 ? (
              <p className="text-sm text-stone-500">এই এলাকায় এখন কোনো অ্যাক্টিভ ডেলিভারি বয় নেই। অন্য এলাকা দেখুন অথবা নিজে ডেলিভারি দিন।</p>
            ) : (
              <div className="space-y-2">
                {boys.map((b) => (
                  <div key={b._id} className="flex items-center justify-between gap-3 border border-stone-200 rounded-xl p-3">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{b.name} <span className="text-xs text-green-700">● অ্যাক্টিভ</span></p>
                      <p className="text-xs text-stone-500">📞 {b.phone} · চলমান ডেলিভারি: {b.activeDeliveries}</p>
                      <p className="text-xs text-stone-400">{b.deliveryAreaIds.slice(0, 4).map((a) => a.name).join(', ')}{b.deliveryAreaIds.length > 4 ? '…' : ''}</p>
                    </div>
                    <button onClick={() => assignBoy(b)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded-lg">নির্বাচন</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
