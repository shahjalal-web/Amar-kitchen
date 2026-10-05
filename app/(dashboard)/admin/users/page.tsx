'use client';
import { toLatLng, mapsLink } from '../../../components/shared/MapPicker';
import { useAuthStore } from '../../../store/authStore';
import { can } from '../../../lib/permissions';
import { SkeletonCards } from '../../../components/ui/Loader';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { getErrorMessage } from '../../../lib/errors';
import { OrderStatus, StatusBadge } from '../../../components/shared/OrderStatus';

type Role = 'user' | 'kitchen' | 'delivery';
interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  isApproved: boolean;
  area?: string;
  kitchenName?: string;
  rating?: number;
  orderLimit?: number;
  walletBalance?: number;
  deliveryAreaIds?: string[];
  orderCount: number;
  createdAt: string;
}
interface UserDetail {
  user: Omit<AdminUser, 'deliveryAreaIds'> & {
    addresses?: { _id: string; label: string; buildingName: string; addressLine: string; location?: { coordinates: [number, number] } | null; areaId?: { name: string; zipCode: string; thana?: { name: string }; city?: { name: string } } }[];
    kitchenLocation?: { coordinates: [number, number] } | null;
    deliveryAreaIds?: { _id: string; name: string; zipCode: string }[];
    buildingAddress?: string;
    nidNumber?: string;
  };
  orders: { _id: string; uniqueCode: string; status: OrderStatus; totalAmount: number; area: string; createdAt: string }[];
}

const ROLE_TABS: { key: 'all' | Role; label: string }[] = [
  { key: 'all', label: 'সবাই' },
  { key: 'user', label: '👤 গ্রাহক' },
  { key: 'kitchen', label: '👩‍🍳 কিচেন' },
  { key: 'delivery', label: '🛵 ডেলিভারি বয়' },
];
const ROLE_LABEL: Record<Role, string> = { user: 'গ্রাহক', kitchen: 'কিচেন', delivery: 'ডেলিভারি বয়' };
const inputCls = 'border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400';

export default function AdminUsersPage() {
  const canManage = can(useAuthStore((st) => st.user), 'users.manage');
  const [role, setRole] = useState<'all' | Role>('all');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AdminUser[]; total: number; pages: number }>({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<UserDetail | null>(null);

  const load = useCallback(() => {
    api.get('/admin/users', { params: { role, status: status || undefined, q: q || undefined, page } })
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('ইউজার লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  }, [role, status, q, page]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const openDetail = async (id: string) => {
    try {
      const r = await api.get(`/admin/users/${id}`);
      setDetail(r.data.data);
    } catch (err) { toast.error(getErrorMessage(err, 'লোড ব্যর্থ হয়েছে')); }
  };

  const toggleActive = async (u: AdminUser) => {
    if (u.isActive && !confirm(`${u.name}-কে ব্লক করবেন? তিনি আর লগইন করতে পারবেন না।`)) return;
    try {
      await api.patch(`/admin/users/${u._id}/active`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'ব্লক করা হয়েছে' : 'চালু করা হয়েছে');
      load();
      if (detail?.user._id === u._id) openDetail(u._id);
    } catch (err) { toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে')); }
  };

  const changeLimit = async (u: AdminUser) => {
    const v = prompt(`${u.kitchenName || u.name}-এর দৈনিক অর্ডার লিমিট:`, String(u.orderLimit ?? 5));
    if (v === null) return;
    const limit = Number(v);
    if (!Number.isInteger(limit) || limit < 0) return toast.error('সঠিক সংখ্যা দিন');
    try {
      await api.patch(`/admin/kitchen/${u._id}/order-limit`, { limit });
      toast.success('অর্ডার লিমিট আপডেট হয়েছে');
      load();
    } catch (err) { toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে')); }
  };

  const statusChip = (u: { isActive: boolean; isApproved: boolean }) =>
    !u.isActive ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">ব্লকড</span>
      : !u.isApproved ? <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">অপেক্ষমাণ</span>
        : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">সক্রিয়</span>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">👥 ইউজার ম্যানেজমেন্ট</h1>
      <p className="text-stone-500 mb-5">গ্রাহক, কিচেন ও ডেলিভারি বয় খুঁজুন, বিস্তারিত দেখুন, ব্লক/আনব্লক করুন ও কিচেনের অর্ডার লিমিট ঠিক করুন</p>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 flex-wrap">
          {ROLE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setRole(t.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm ${role === t.key ? 'bg-purple-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="🔎 নাম, ইমেইল, ফোন বা এলাকা" className={`${inputCls} flex-1 min-w-48`} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={inputCls}>
          <option value="">সব অবস্থা</option>
          <option value="active">সক্রিয়</option>
          <option value="pending">অ্যাপ্রুভালের অপেক্ষায়</option>
          <option value="blocked">ব্লকড</option>
        </select>
      </div>

      <p className="text-sm text-stone-500 mb-3">মোট {data.total.toLocaleString('bn-BD')} জন</p>

      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <>
        {/* মোবাইল: কার্ড */}
        <div className="md:hidden space-y-2">
          {data.items.map((u) => (
            <div key={u._id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => openDetail(u._id)} className="text-left min-w-0">
                  <p className="font-semibold text-stone-800">{u.kitchenName || u.name}</p>
                  <p className="text-xs text-stone-500">{u.kitchenName ? `${u.name} · ` : ''}{u.phone}</p>
                </button>
                {statusChip(u)}
              </div>
              <p className="text-sm text-stone-600 mt-2">
                {ROLE_LABEL[u.role]}{u.role === 'kitchen' && u.rating ? <span className="text-amber-500"> ⭐{u.rating.toFixed(1)}</span> : null}
                {' · '}{u.role === 'delivery' ? `${(u.deliveryAreaIds?.length ?? 0).toLocaleString('bn-BD')}টি এরিয়া` : u.area ?? '—'}
                {' · '}{u.orderCount.toLocaleString('bn-BD')}টি অর্ডার
                {u.role === 'kitchen' && <span className="text-stone-400"> · লিমিট {u.orderLimit}/দিন</span>}
              </p>
              <div className="flex flex-wrap gap-2 mt-3 text-sm">
                <button onClick={() => openDetail(u._id)} className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700">বিস্তারিত</button>
                {canManage && u.role === 'kitchen' && <button onClick={() => changeLimit(u)} className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700">লিমিট</button>}
                {canManage && (
                  <button onClick={() => toggleActive(u)} className={`px-3 py-1.5 rounded-lg ${u.isActive ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                    {u.isActive ? 'ব্লক' : 'আনব্লক'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {data.items.length === 0 && <p className="p-4 text-stone-500">কেউ পাওয়া যায়নি।</p>}
        </div>
        <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-180">
            <thead>
              <tr className="text-left text-xs text-stone-500 border-b">
                <th className="p-3 font-medium">নাম</th><th className="p-3 font-medium">রোল</th>
                <th className="p-3 font-medium">এলাকা</th><th className="p-3 font-medium">অর্ডার</th>
                <th className="p-3 font-medium">অবস্থা</th><th className="p-3 font-medium text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u._id} className="border-b last:border-0 hover:bg-stone-50">
                  <td className="p-3">
                    <button onClick={() => openDetail(u._id)} className="text-left">
                      <p className="font-medium text-stone-800 hover:text-purple-700">{u.kitchenName || u.name}</p>
                      <p className="text-xs text-stone-400">{u.kitchenName ? `${u.name} · ` : ''}{u.phone}</p>
                    </button>
                  </td>
                  <td className="p-3 text-stone-600">{ROLE_LABEL[u.role]}{u.role === 'kitchen' && u.rating ? <span className="text-amber-500 text-xs"> ⭐{u.rating.toFixed(1)}</span> : null}</td>
                  <td className="p-3 text-stone-600">{u.role === 'delivery' ? `${(u.deliveryAreaIds?.length ?? 0).toLocaleString('bn-BD')}টি এরিয়া` : u.area ?? '—'}</td>
                  <td className="p-3 text-stone-600">
                    {u.orderCount.toLocaleString('bn-BD')}
                    {u.role === 'kitchen' && <span className="text-xs text-stone-400"> · লিমিট {u.orderLimit}/দিন</span>}
                  </td>
                  <td className="p-3">{statusChip(u)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {canManage && u.role === 'kitchen' && <button onClick={() => changeLimit(u)} className="text-xs text-purple-600 hover:underline mr-3 py-1">লিমিট</button>}
                    {canManage && (
                      <button onClick={() => toggleActive(u)} className={`text-xs hover:underline py-1 ${u.isActive ? 'text-red-600' : 'text-green-700'}`}>
                        {u.isActive ? 'ব্লক' : 'আনব্লক'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.items.length === 0 && <p className="p-4 text-stone-500">কেউ পাওয়া যায়নি।</p>}
        </div>
        </>
      )}

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm rounded-lg bg-white border disabled:opacity-40">← আগের</button>
          <span className="text-sm text-stone-600">{page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm rounded-lg bg-white border disabled:opacity-40">পরের →</button>
        </div>
      )}

      {/* ─── বিস্তারিত প্যানেল ─── */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={() => setDetail(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-800">{detail.user.kitchenName || detail.user.name}</h2>
                <p className="text-sm text-stone-500">{ROLE_LABEL[detail.user.role]} · {statusChip(detail.user)}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-2xl text-stone-400 hover:text-stone-700" aria-label="বন্ধ করুন">×</button>
            </div>
            <div className="space-y-1 text-sm mb-4">
              <p><span className="text-stone-400">নাম:</span> {detail.user.name}</p>
              <p><span className="text-stone-400">ইমেইল:</span> {detail.user.email}</p>
              <p><span className="text-stone-400">ফোন:</span> {detail.user.phone}</p>
              {detail.user.nidNumber && <p><span className="text-stone-400">এনআইডি:</span> {detail.user.nidNumber}</p>}
              {detail.user.area && <p><span className="text-stone-400">এলাকা:</span> {detail.user.area}{detail.user.buildingAddress ? `, ${detail.user.buildingAddress}` : ''}</p>}
              {detail.user.role === 'kitchen' && (() => { const p = toLatLng(detail.user.kitchenLocation); return (
                <p><span className="text-stone-400">আসল লোকেশন:</span>{' '}
                  {p ? <a href={mapsLink(p)} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">🗺️ ম্যাপে দেখুন ({p.lat.toFixed(5)}, {p.lng.toFixed(5)})</a> : <span className="text-stone-400">পিন দেওয়া হয়নি</span>}
                  <span className="block text-[11px] text-stone-400">শুধু অ্যাডমিন দেখতে পান — গ্রাহকরা নন</span>
                </p>
              ); })()}
              {detail.user.role === 'kitchen' && <p><span className="text-stone-400">ওয়ালেট:</span> ৳{detail.user.walletBalance ?? 0} · <span className="text-stone-400">রেটিং:</span> {detail.user.rating ?? 0}</p>}
              <p><span className="text-stone-400">যোগ দিয়েছেন:</span> {new Date(detail.user.createdAt).toLocaleDateString('bn-BD')}</p>
            </div>

            {!!detail.user.addresses?.length && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-stone-700 mb-1">সেভ করা ঠিকানা</h3>
                <ul className="text-sm text-stone-600 space-y-1">
                  {detail.user.addresses.map((a) => (
                    <li key={a._id}>• <b>{a.label}:</b> {a.buildingName}, {a.addressLine}, {a.areaId?.name}, {a.areaId?.thana?.name}, {a.areaId?.city?.name}-{a.areaId?.zipCode}
                      {(() => { const p = toLatLng(a.location); return p ? <a href={mapsLink(p)} target="_blank" rel="noopener noreferrer" className="ml-1 text-xs text-blue-700 hover:underline">🗺️ ম্যাপ</a> : null; })()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detail.user.role === 'delivery' && !!detail.user.deliveryAreaIds?.length && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-stone-700 mb-1">ডেলিভারি এরিয়া</h3>
                <p className="text-sm text-stone-600">{detail.user.deliveryAreaIds.map((a) => `${a.name} (${a.zipCode})`).join(', ')}</p>
              </div>
            )}

            <h3 className="text-sm font-semibold text-stone-700 mb-2">সাম্প্রতিক অর্ডার</h3>
            {detail.orders.length === 0 ? (
              <p className="text-sm text-stone-400">কোনো অর্ডার নেই।</p>
            ) : (
              <ul className="space-y-2">
                {detail.orders.map((o) => (
                  <li key={o._id} className="flex items-center justify-between text-sm border border-stone-100 rounded-lg px-3 py-2">
                    <span className="font-mono text-xs">{o.uniqueCode}</span>
                    <StatusBadge status={o.status} />
                    <span className="text-stone-500 text-xs">{new Date(o.createdAt).toLocaleDateString('bn-BD')}</span>
                    <span>৳{o.totalAmount}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
