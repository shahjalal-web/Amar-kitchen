'use client';
import Loader from '../../components/ui/Loader';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { OrderStatus, StatusBadge } from '../../components/shared/OrderStatus';

interface DayStat { date: string; orders: number; revenue: number }
interface Dashboard {
  counts: { users: number; kitchens: number; deliveryBoys: number; pendingApprovals: number; liveOrders: number };
  today: { orders: number; revenue: number; deliveryCharge: number };
  last14: DayStat[];
  statusBreakdown: Partial<Record<OrderStatus, number>>;
  topKitchens: { _id: string; name: string; area?: string; rating?: number; orders: number; revenue: number }[];
  topAreas: { area: string; thana?: string; city?: string; orders: number }[];
  recentOrders: {
    _id: string; uniqueCode: string; status: OrderStatus; totalAmount: number; area: string; createdAt: string;
    user?: { name: string }; kitchen?: { name: string; kitchenName?: string };
  }[];
  coverage: {
    noKitchen: { areaId: string; label: string; customers: number }[];
    noDelivery: { areaId: string; label: string; kitchens: number }[];
  };
}

const bn = (n: number) => n.toLocaleString('bn-BD');
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00+06:00`).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });

function StatTile({ label, value, hint, href, tone = 'text-stone-900' }: { label: string; value: string; hint?: string; href?: string; tone?: string }) {
  const body = (
    <div className="bg-white rounded-2xl p-4 shadow-sm h-full hover:shadow-md transition">
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p>
      {hint && <p className="text-[11px] text-stone-400 mt-0.5">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

// ১৪ দিনের অর্ডার — একটাই সিরিজ, তাই লেজেন্ড নয়, শিরোনামেই নাম; প্রতিটি বারে হোভার টুলটিপ
function OrdersChart({ data }: { data: DayStat[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.orders));
  const H = 160;
  return (
    <div className="relative">
      <div className="flex items-end gap-0.5 border-b border-stone-200" style={{ height: H }}>
        {data.map((d, i) => (
          <div
            key={d.date}
            className="flex-1 h-full flex items-end cursor-default"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex={0}
            aria-label={`${dayLabel(d.date)}: ${bn(d.orders)}টি অর্ডার, ৳${bn(d.revenue)}`}
          >
            <div
              className={`w-full rounded-t ${hover === i ? 'bg-green-700' : 'bg-green-600'}`}
              style={{ height: `${(d.orders / max) * (H - 8)}px`, minHeight: d.orders ? 2 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-stone-400 mt-1">
        <span>{dayLabel(data[0]?.date ?? '')}</span>
        <span>সর্বোচ্চ {bn(max)}টি</span>
        <span>আজ</span>
      </div>
      {hover !== null && data[hover] && (
        <div
          className="absolute -top-2 -translate-y-full bg-stone-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none whitespace-nowrap shadow-lg"
          style={{ left: `${((hover + 0.5) / data.length) * 100}%`, transform: 'translate(-50%, -100%)' }}
        >
          <p className="font-semibold">{dayLabel(data[hover].date)}</p>
          <p>{bn(data[hover].orders)}টি অর্ডার · ৳{bn(data[hover].revenue)}</p>
        </div>
      )}
    </div>
  );
}

// অনুভূমিক র‍্যাঙ্ক বার (টপ কিচেন/এরিয়া) — লেবেল টেক্সট কালিতে, বার শুধু মান দেখায়
function RankBars({ rows }: { rows: { label: string; sub?: string; value: number; valueLabel: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-stone-400">এখনো ডেটা নেই।</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={i} title={`${r.label}: ${r.valueLabel}`}>
          <div className="flex justify-between text-sm">
            <span className="text-stone-800 truncate">{r.label}{r.sub && <span className="text-stone-400 text-xs"> · {r.sub}</span>}</span>
            <span className="text-stone-600 shrink-0 ml-2">{r.valueLabel}</span>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full mt-1">
            <div className="h-1.5 bg-green-600 rounded-full" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/admin/dashboard').then((r) => setData(r.data.data)).catch(() => setError(true));
  }, []);

  if (error) return <p className="text-red-500">ড্যাশবোর্ড লোড করা যায়নি।</p>;
  if (!data) return <Loader />;

  const total14 = data.last14.reduce((s, d) => s + d.orders, 0);
  const revenue14 = data.last14.reduce((s, d) => s + d.revenue, 0);
  const statusOrder: OrderStatus[] = ['pending', 'accepted', 'ready', 'picked_up', 'delivered', 'cancelled', 'rejected', 'resell', 'resold'];
  const statusTotal = Object.values(data.statusBreakdown).reduce((s, n) => s + (n ?? 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">অ্যাডমিন ড্যাশবোর্ড</h1>
      <p className="text-stone-500 mb-6">পুরো প্ল্যাটফর্মের এক নজরে অবস্থা</p>

      {/* ─── KPI ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <StatTile label="আজকের অর্ডার" value={bn(data.today.orders)} href="/admin/orders" />
        <StatTile label="আজকের বিক্রি" value={`৳${bn(data.today.revenue)}`} hint={`ডেলিভারি চার্জ ৳${bn(data.today.deliveryCharge)}`} />
        <StatTile label="চলমান অর্ডার" value={bn(data.counts.liveOrders)} hint="নতুন থেকে ডেলিভারির পথে" href="/admin/orders" />
        <StatTile
          label="অ্যাপ্রুভালের অপেক্ষায়"
          value={bn(data.counts.pendingApprovals)}
          tone={data.counts.pendingApprovals ? 'text-amber-600' : 'text-stone-900'}
          hint={data.counts.pendingApprovals ? '⚠️ দেখুন' : 'সব ঠিক আছে'}
          href="/admin/approvals"
        />
        <StatTile label="সক্রিয় কিচেন" value={bn(data.counts.kitchens)} href="/admin/users" />
        <StatTile label="গ্রাহক / ডেলিভারি বয়" value={`${bn(data.counts.users)} / ${bn(data.counts.deliveryBoys)}`} href="/admin/users" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* ─── ১৪ দিনের অর্ডার ─── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <h2 className="font-semibold text-stone-700">গত ১৪ দিনের অর্ডার</h2>
            <p className="text-sm text-stone-500">মোট {bn(total14)}টি · ৳{bn(revenue14)}</p>
          </div>
          <OrdersChart data={data.last14} />
        </div>

        {/* ─── স্ট্যাটাস ─── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-stone-700 mb-4">স্ট্যাটাস (গত ৩০ দিন)</h2>
          {statusTotal === 0 ? (
            <p className="text-sm text-stone-400">এখনো অর্ডার নেই।</p>
          ) : (
            <ul className="space-y-2">
              {statusOrder.filter((s) => data.statusBreakdown[s]).map((s) => (
                <li key={s} className="flex items-center justify-between text-sm">
                  <StatusBadge status={s} />
                  <span className="text-stone-700">
                    {bn(data.statusBreakdown[s] ?? 0)} <span className="text-stone-400 text-xs">({Math.round(((data.statusBreakdown[s] ?? 0) / statusTotal) * 100)}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-stone-700 mb-4">🏆 টপ কিচেন (৩০ দিন)</h2>
          <RankBars rows={data.topKitchens.map((k) => ({
            label: k.name, sub: k.area, value: k.orders, valueLabel: `${bn(k.orders)}টি · ৳${bn(k.revenue)}`,
          }))} />
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-stone-700 mb-4">📍 সবচেয়ে বেশি অর্ডারের এরিয়া</h2>
          <RankBars rows={data.topAreas.map((a) => ({
            label: a.area, sub: [a.thana, a.city].filter(Boolean).join(', '), value: a.orders, valueLabel: `${bn(a.orders)}টি`,
          }))} />
        </div>

        {/* ─── কভারেজ গ্যাপ ─── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-stone-700 mb-1">🧭 কভারেজ গ্যাপ</h2>
          <p className="text-xs text-stone-500 mb-3">যেখানে চাহিদা আছে কিন্তু সাপ্লাই নেই — এখানে কিচেন/ডেলিভারি বয় খুঁজুন</p>
          <p className="text-xs font-medium text-stone-600 mb-1">গ্রাহক আছে, কিচেন নেই</p>
          {data.coverage.noKitchen.length === 0 ? (
            <p className="text-xs text-green-700 mb-3">✓ সব এরিয়ায় কিচেন আছে</p>
          ) : (
            <ul className="text-sm space-y-1 mb-3">
              {data.coverage.noKitchen.map((g) => (
                <li key={g.areaId} className="flex justify-between gap-2"><span className="truncate text-stone-700">{g.label}</span><span className="text-stone-500 shrink-0">{bn(g.customers)} গ্রাহক</span></li>
              ))}
            </ul>
          )}
          <p className="text-xs font-medium text-stone-600 mb-1">কিচেন আছে, ডেলিভারি বয় নেই</p>
          {data.coverage.noDelivery.length === 0 ? (
            <p className="text-xs text-green-700">✓ সব কিচেন এলাকায় ডেলিভারি বয় আছে</p>
          ) : (
            <ul className="text-sm space-y-1">
              {data.coverage.noDelivery.map((g) => (
                <li key={g.areaId} className="flex justify-between gap-2"><span className="truncate text-stone-700">{g.label}</span><span className="text-stone-500 shrink-0">{bn(g.kitchens)} কিচেন</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ─── সাম্প্রতিক অর্ডার ─── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-stone-700">সাম্প্রতিক অর্ডার</h2>
          <Link href="/admin/orders" className="text-sm text-green-700 hover:underline">সব দেখুন →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone-500 border-b">
                <th className="py-2 pr-3 font-medium">কোড</th><th className="py-2 pr-3 font-medium">গ্রাহক</th>
                <th className="py-2 pr-3 font-medium">কিচেন</th><th className="py-2 pr-3 font-medium">এরিয়া</th>
                <th className="py-2 pr-3 font-medium">স্ট্যাটাস</th><th className="py-2 font-medium text-right">টাকা</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((o) => (
                <tr key={o._id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-mono text-xs">{o.uniqueCode}</td>
                  <td className="py-2 pr-3">{o.user?.name ?? '—'}</td>
                  <td className="py-2 pr-3">{o.kitchen?.kitchenName || o.kitchen?.name || '—'}</td>
                  <td className="py-2 pr-3 text-stone-500">{o.area}</td>
                  <td className="py-2 pr-3"><StatusBadge status={o.status} /></td>
                  <td className="py-2 text-right">৳{bn(o.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
