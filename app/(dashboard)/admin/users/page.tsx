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
import { useCities, fetchThanas, fetchAreas, ThanaOption, AreaOption } from '../../../lib/locations';

type Role = 'user' | 'kitchen' | 'delivery';
interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  isApproved: boolean;
  isAvailable?: boolean;
  area?: string;
  kitchenName?: string;
  rating?: number;
  orderLimit?: number;
  walletBalance?: number;
  deliveryAreaIds?: string[];
  orderCount: number;
  orderAmount?: number;
  lastOrderAt?: string | null;
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

// "আরো ফিল্টার" — সব মান string, খালি = প্রযোজ্য নয়
const EMPTY_FILTERS = {
  cityId: '', thanaId: '', areaId: '', orders: '', activity: '', joined: '', sort: '',
  minRating: '', menuToday: '', pin: '', available: '',
};
type Filters = typeof EMPTY_FILTERS;
const ORDER_RANGES: Record<string, { minOrders?: number; maxOrders?: number }> = {
  '0': { maxOrders: 0 }, '1-5': { minOrders: 1, maxOrders: 5 }, '6-20': { minOrders: 6, maxOrders: 20 },
  '21-50': { minOrders: 21, maxOrders: 50 }, '50+': { minOrders: 51 },
};
const SORTS: { value: string; label: string; roles?: Role[] }[] = [
  { value: '', label: 'নতুন যোগ দেওয়া আগে' },
  { value: 'oldest', label: 'পুরনো আগে' },
  { value: 'orders', label: 'বেশি অর্ডার আগে' },
  { value: 'orders_asc', label: 'কম অর্ডার আগে' },
  { value: 'amount', label: 'বেশি লেনদেন আগে' },
  { value: 'last_order', label: 'সাম্প্রতিক অর্ডার আগে' },
  { value: 'rating', label: 'বেশি রেটিং আগে', roles: ['kitchen'] },
  { value: 'name', label: 'নাম অনুযায়ী (ক-হ)' },
];
const bn = (n: number) => n.toLocaleString('bn-BD');
const ago = (d?: string | null) => {
  if (!d) return 'কখনো না';
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  return days <= 0 ? 'আজ' : days === 1 ? 'গতকাল' : `${bn(days)} দিন আগে`;
};

export default function AdminUsersPage() {
  const me = useAuthStore((st) => st.user);
  const canManage = can(me, 'users.manage');
  const canApprove = can(me, 'approvals.manage');
  const [role, setRole] = useState<'all' | Role>('all');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AdminUser[]; total: number; pages: number }>({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const { cities } = useCities();
  const [thanas, setThanas] = useState<ThanaOption[]>([]);
  const [areas, setAreas] = useState<AreaOption[]>([]);

  const setF = (patch: Partial<Filters>) => { setFilters((f) => ({ ...f, ...patch })); setPage(1); };
  const changeRole = (r: 'all' | Role) => {
    setRole(r);
    setPage(1);
    // অন্য রোলের নির্দিষ্ট ফিল্টার রেখে দিলে তালিকা অকারণে খালি হয়ে যায়
    setFilters((f) => ({
      ...f,
      ...(r !== 'kitchen' && { minRating: '', menuToday: '', pin: '', sort: f.sort === 'rating' ? '' : f.sort }),
      ...(r !== 'delivery' && { available: '' }),
    }));
  };
  const pickCity = (cityId: string) => {
    setF({ cityId, thanaId: '', areaId: '' });
    setThanas([]); setAreas([]);
    if (cityId) fetchThanas(cityId).then(setThanas).catch(() => {});
  };
  const pickThana = (thanaId: string) => {
    setF({ thanaId, areaId: '' });
    setAreas([]);
    if (thanaId) fetchAreas(thanaId).then(setAreas).catch(() => {});
  };
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setThanas([]); setAreas([]); setPage(1); };

  const load = useCallback(() => {
    const { orders, ...rest } = filters;
    const params: Record<string, string | number | undefined> = { role, status: status || undefined, q: q || undefined, page, ...ORDER_RANGES[orders] };
    for (const [k, v] of Object.entries(rest)) if (v) params[k] = v;
    api.get('/admin/users', { params })
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('ইউজার লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  }, [role, status, q, page, filters]);

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

  const review = async (u: { _id: string; name: string; kitchenName?: string }, approve: boolean) => {
    if (!approve && !confirm(`${u.kitchenName || u.name}-এর আবেদন বাতিল করবেন? একাউন্টটি বন্ধ হয়ে যাবে।`)) return;
    try {
      await api.patch(`/admin/approvals/${u._id}/${approve ? 'approve' : 'reject'}`);
      toast.success(approve ? 'অ্যাপ্রুভ করা হয়েছে ✅' : 'আবেদন বাতিল করা হয়েছে');
      load();
      if (detail?.user._id === u._id) openDetail(u._id);
    } catch (err) { toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে')); }
  };
  const isPending = (u: { role: Role; isActive: boolean; isApproved: boolean }) => u.role !== 'user' && u.isActive && !u.isApproved;

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
      <h1 className="text-xl sm:text-2xl font-bold text-stone-800 mb-1">👥 ইউজার ম্যানেজমেন্ট</h1>
      <p className="text-sm sm:text-base text-stone-500 mb-5">গ্রাহক, কিচেন ও ডেলিভারি বয় খুঁজুন, এলাকা/অর্ডার দিয়ে ফিল্টার করুন, অ্যাপ্রুভ, ব্লক/আনব্লক করুন ও কিচেনের অর্ডার লিমিট ঠিক করুন</p>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 flex-wrap">
          {ROLE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => changeRole(t.key)}
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
          <option value="blocked">ব্লকড / বাতিল</option>
        </select>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`px-3 py-2 rounded-lg text-sm border ${showFilters || activeFilterCount ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-stone-300 text-stone-600'}`}
        >
          🎛️ আরো ফিল্টার{activeFilterCount ? ` (${bn(activeFilterCount)})` : ''}
        </button>

        {showFilters && (
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 mt-1 border-t border-stone-100">
            <label className="text-xs text-stone-500">শহর
              <select value={filters.cityId} onChange={(e) => pickCity(e.target.value)} className={`${inputCls} w-full mt-1`}>
                <option value="">সব শহর</option>
                {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-xs text-stone-500">থানা
              <select value={filters.thanaId} onChange={(e) => pickThana(e.target.value)} disabled={!filters.cityId} className={`${inputCls} w-full mt-1 disabled:opacity-50`}>
                <option value="">সব থানা</option>
                {thanas.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </label>
            <label className="text-xs text-stone-500">এরিয়া
              <select value={filters.areaId} onChange={(e) => setF({ areaId: e.target.value })} disabled={!filters.thanaId} className={`${inputCls} w-full mt-1 disabled:opacity-50`}>
                <option value="">সব এরিয়া</option>
                {areas.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </label>
            <label className="text-xs text-stone-500">সাজান
              <select value={filters.sort} onChange={(e) => setF({ sort: e.target.value })} className={`${inputCls} w-full mt-1`}>
                {SORTS.filter((o) => !o.roles || (role !== 'all' && o.roles.includes(role))).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="text-xs text-stone-500">মোট অর্ডার
              <select value={filters.orders} onChange={(e) => setF({ orders: e.target.value })} className={`${inputCls} w-full mt-1`}>
                <option value="">যেকোনো</option>
                <option value="0">একটাও না</option>
                <option value="1-5">১–৫টি</option>
                <option value="6-20">৬–২০টি</option>
                <option value="21-50">২১–৫০টি</option>
                <option value="50+">৫০টির বেশি</option>
              </select>
            </label>
            <label className="text-xs text-stone-500">শেষ অর্ডার
              <select value={filters.activity} onChange={(e) => setF({ activity: e.target.value })} className={`${inputCls} w-full mt-1`}>
                <option value="">যেকোনো</option>
                <option value="recent30">গত ৩০ দিনে অর্ডার আছে</option>
                <option value="inactive30">৩০ দিনের বেশি অর্ডার নেই</option>
                <option value="never">কখনো অর্ডার হয়নি</option>
              </select>
            </label>
            <label className="text-xs text-stone-500">যোগ দিয়েছেন
              <select value={filters.joined} onChange={(e) => setF({ joined: e.target.value })} className={`${inputCls} w-full mt-1`}>
                <option value="">যেকোনো সময়</option>
                <option value="1">আজ</option>
                <option value="7">গত ৭ দিনে</option>
                <option value="30">গত ৩০ দিনে</option>
                <option value="90">গত ৩ মাসে</option>
              </select>
            </label>
            {role === 'kitchen' && (
              <>
                <label className="text-xs text-stone-500">রেটিং
                  <select value={filters.minRating} onChange={(e) => setF({ minRating: e.target.value })} className={`${inputCls} w-full mt-1`}>
                    <option value="">যেকোনো</option>
                    <option value="4.5">⭐ ৪.৫+</option>
                    <option value="4">⭐ ৪+</option>
                    <option value="3">⭐ ৩+</option>
                  </select>
                </label>
                <label className="text-xs text-stone-500">আজকের মেনু
                  <select value={filters.menuToday} onChange={(e) => setF({ menuToday: e.target.value })} className={`${inputCls} w-full mt-1`}>
                    <option value="">যেকোনো</option>
                    <option value="yes">আজ মেনু দিয়েছে</option>
                    <option value="no">আজ মেনু দেয়নি</option>
                  </select>
                </label>
                <label className="text-xs text-stone-500">ম্যাপ পিন
                  <select value={filters.pin} onChange={(e) => setF({ pin: e.target.value })} className={`${inputCls} w-full mt-1`}>
                    <option value="">যেকোনো</option>
                    <option value="yes">পিন দিয়েছে</option>
                    <option value="no">পিন দেয়নি</option>
                  </select>
                </label>
              </>
            )}
            {role === 'delivery' && (
              <label className="text-xs text-stone-500">এখন
                <select value={filters.available} onChange={(e) => setF({ available: e.target.value })} className={`${inputCls} w-full mt-1`}>
                  <option value="">যেকোনো</option>
                  <option value="yes">🟢 অ্যাক্টিভ</option>
                  <option value="no">⚪ অফ</option>
                </select>
              </label>
            )}
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="col-span-2 md:col-span-1 self-end text-sm text-red-600 hover:underline py-2">✕ ফিল্টার মুছুন</button>
            )}
          </div>
        )}
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
              <p className="text-xs text-stone-400 mt-0.5">
                ৳{bn(u.orderAmount ?? 0)} লেনদেন · শেষ অর্ডার {ago(u.lastOrderAt)}
                {u.role === 'delivery' && <> · {u.isAvailable === false ? '⚪ অফ' : '🟢 অ্যাক্টিভ'}</>}
              </p>
              <div className="flex flex-wrap gap-2 mt-3 text-sm">
                {canApprove && isPending(u) && (
                  <>
                    <button onClick={() => review(u, true)} className="px-3 py-1.5 rounded-lg bg-green-600 text-white font-medium">✓ অ্যাপ্রুভ</button>
                    <button onClick={() => review(u, false)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600">বাতিল</button>
                  </>
                )}
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
                    <span className="block text-xs text-stone-400">৳{bn(u.orderAmount ?? 0)} · শেষ: {ago(u.lastOrderAt)}</span>
                  </td>
                  <td className="p-3">
                    {statusChip(u)}
                    {u.role === 'delivery' && u.isActive && <span className="block text-[11px] text-stone-400 mt-1">{u.isAvailable === false ? '⚪ অফ' : '🟢 অ্যাক্টিভ'}</span>}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {canApprove && isPending(u) && (
                      <>
                        <button onClick={() => review(u, true)} className="text-xs bg-green-600 hover:bg-green-700 text-white rounded-md px-2.5 py-1 mr-2">✓ অ্যাপ্রুভ</button>
                        <button onClick={() => review(u, false)} className="text-xs text-red-600 hover:underline mr-3 py-1">বাতিল</button>
                      </>
                    )}
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
            {canApprove && isPending(detail.user) && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-800 mb-2">এই {ROLE_LABEL[detail.user.role]} অ্যাপ্রুভালের অপেক্ষায় আছে। তথ্য যাচাই করে সিদ্ধান্ত নিন।</p>
                <div className="flex gap-2">
                  <button onClick={() => review(detail.user, true)} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg py-2">✓ অ্যাপ্রুভ করুন</button>
                  <button onClick={() => review(detail.user, false)} className="flex-1 bg-white border border-red-200 text-red-600 text-sm rounded-lg py-2">বাতিল করুন</button>
                </div>
              </div>
            )}
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
