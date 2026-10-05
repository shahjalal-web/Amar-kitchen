'use client';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { getErrorMessage } from '../../../lib/errors';
import { useCities } from '../../../lib/locations';
import {
  OrderStatus, StatusEvent, StatusBadge, StatusTimeline, STATUS_LABEL,
} from '../../../components/shared/OrderStatus';

interface AdminOrder {
  _id: string;
  uniqueCode: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryCharge: number;
  deliveryAddress: string;
  customerPhone?: string;
  area: string;
  city?: string;
  deliveryMode?: 'self' | 'delivery_boy';
  paymentMethod?: string;
  createdAt: string;
  user?: { name: string; phone: string; email: string };
  kitchen?: { name: string; kitchenName?: string; phone: string };
  deliveryBoy?: { name: string; phone: string } | null;
  items: { foodItem?: { name: string }; quantity: number; price: number }[];
  statusHistory?: StatusEvent[];
}

const STATUSES: ('all' | OrderStatus)[] = ['all', 'pending', 'accepted', 'ready', 'picked_up', 'delivered', 'cancelled', 'rejected', 'resell', 'resold'];
const LIVE: OrderStatus[] = ['pending', 'accepted', 'ready', 'picked_up'];
const inputCls = 'border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400';

export default function AdminOrdersPage() {
  const { cities } = useCities();
  const [status, setStatus] = useState<'all' | OrderStatus>('all');
  const [city, setCity] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<{ items: AdminOrder[]; total: number; pages: number }>({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get('/admin/orders', { params: { status, city: city || undefined, q: q || undefined, from: from || undefined, to: to || undefined, page } })
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('অর্ডার লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  }, [status, city, q, from, to, page]);

  // সার্চ টাইপ করার সময় একটু অপেক্ষা করে লোড
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const cancel = async (o: AdminOrder) => {
    const reason = prompt(`অর্ডার ${o.uniqueCode} বাতিলের কারণ লিখুন (গ্রাহক, কিচেন ও ডেলিভারি বয়কে ইমেইলে জানানো হবে):`);
    if (reason === null) return;
    try {
      await api.patch(`/admin/orders/${o._id}/cancel`, { reason });
      toast.success('অর্ডার বাতিল করা হয়েছে');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'বাতিল ব্যর্থ হয়েছে'));
    }
  };

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1); };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">🧾 সব অর্ডার</h1>
      <p className="text-stone-500 mb-5">পুরো প্ল্যাটফর্মের অর্ডার খুঁজুন, বিস্তারিত ও টাইমলাইন দেখুন, প্রয়োজনে বাতিল করুন</p>

      {/* ─── ফিল্টার — এক সারিতে ─── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex flex-wrap gap-2 items-center">
        <input value={q} onChange={(e) => resetPage(setQ)(e.target.value)} placeholder="🔎 কোড, ফোন বা এলাকা" className={`${inputCls} flex-1 min-w-48`} />
        <select value={status} onChange={(e) => resetPage(setStatus)(e.target.value as 'all' | OrderStatus)} className={inputCls}>
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'সব স্ট্যাটাস' : STATUS_LABEL[s]}</option>)}
        </select>
        <select value={city} onChange={(e) => resetPage(setCity)(e.target.value)} className={inputCls}>
          <option value="">সব শহর</option>
          {cities.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>
        <label className="text-xs text-stone-500 flex items-center gap-1">থেকে <input type="date" value={from} onChange={(e) => resetPage(setFrom)(e.target.value)} className={inputCls} /></label>
        <label className="text-xs text-stone-500 flex items-center gap-1">পর্যন্ত <input type="date" value={to} onChange={(e) => resetPage(setTo)(e.target.value)} className={inputCls} /></label>
      </div>

      <p className="text-sm text-stone-500 mb-3">মোট {data.total.toLocaleString('bn-BD')}টি অর্ডার</p>

      {loading ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : data.items.length === 0 ? (
        <p className="text-stone-500">কোনো অর্ডার পাওয়া যায়নি।</p>
      ) : (
        <div className="space-y-2">
          {data.items.map((o) => (
            <div key={o._id} className="bg-white rounded-xl shadow-sm">
              <button onClick={() => setOpenId(openId === o._id ? null : o._id)} className="w-full text-left p-4 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-mono text-xs text-stone-600 w-20">{o.uniqueCode}</span>
                <StatusBadge status={o.status} />
                <span className="text-sm text-stone-800 flex-1 min-w-40 truncate">
                  {o.user?.name ?? '—'} → {o.kitchen?.kitchenName || o.kitchen?.name || '—'}
                </span>
                <span className="text-xs text-stone-500">{o.area}{o.city ? `, ${o.city}` : ''}</span>
                <span className="text-xs text-stone-400">{new Date(o.createdAt).toLocaleString('bn-BD')}</span>
                <span className="text-sm font-semibold text-stone-800 w-20 text-right">৳{o.totalAmount + o.deliveryCharge}</span>
              </button>
              {openId === o._id && (
                <div className="border-t px-4 pb-4 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p><span className="text-stone-400">গ্রাহক:</span> {o.user?.name} · 📞 {o.customerPhone || o.user?.phone} · {o.user?.email}</p>
                    <p><span className="text-stone-400">ঠিকানা:</span> {o.deliveryAddress}</p>
                    <p><span className="text-stone-400">কিচেন:</span> {o.kitchen?.kitchenName || o.kitchen?.name} · 📞 {o.kitchen?.phone}</p>
                    <p>
                      <span className="text-stone-400">ডেলিভারি:</span>{' '}
                      {o.deliveryMode === 'self' ? 'কিচেন নিজে' : o.deliveryBoy ? `${o.deliveryBoy.name} · 📞 ${o.deliveryBoy.phone}` : 'এখনো নির্ধারিত হয়নি'}
                    </p>
                    <p><span className="text-stone-400">পেমেন্ট:</span> {o.paymentMethod === 'cash' ? 'ক্যাশ অন ডেলিভারি' : o.paymentMethod ?? '—'}</p>
                    <ul className="pt-1 text-stone-600">
                      {o.items.map((it, i) => <li key={i}>• {it.foodItem?.name ?? '—'} × {it.quantity} (৳{it.price})</li>)}
                    </ul>
                    <p className="pt-1">খাবার ৳{o.totalAmount} + ডেলিভারি ৳{o.deliveryCharge}</p>
                    {LIVE.includes(o.status) && (
                      <button onClick={() => cancel(o)} className="mt-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg">
                        অর্ডার বাতিল করুন
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-600">স্ট্যাটাস টাইমলাইন</p>
                    <StatusTimeline history={o.statusHistory} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm rounded-lg bg-white border disabled:opacity-40">← আগের</button>
          <span className="text-sm text-stone-600">{page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm rounded-lg bg-white border disabled:opacity-40">পরের →</button>
        </div>
      )}
    </div>
  );
}
