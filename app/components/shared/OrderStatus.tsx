'use client';

export type OrderStatus =
  | 'pending' | 'accepted' | 'rejected' | 'ready' | 'picked_up'
  | 'delivered' | 'cancelled' | 'resell' | 'resold';

export interface StatusEvent {
  status: OrderStatus;
  at: string;
  role: 'user' | 'kitchen' | 'delivery' | 'admin' | 'system';
  note?: string;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'নতুন',
  accepted: 'গ্রহণকৃত',
  rejected: 'প্রত্যাখ্যাত',
  ready: 'রান্না শেষ',
  picked_up: 'ডেলিভারির পথে',
  delivered: 'ডেলিভার্ড',
  cancelled: 'বাতিল',
  resell: 'রিসেল',
  resold: 'রিসোল্ড',
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
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

const ROLE_LABEL: Record<StatusEvent['role'], string> = {
  user: 'আপনি/গ্রাহক',
  kitchen: 'কিচেন',
  delivery: 'ডেলিভারি বয়',
  admin: 'অ্যাডমিন',
  system: 'সিস্টেম',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>;
}

// মূল ধাপগুলোর প্রগ্রেস বার
const FLOW: OrderStatus[] = ['pending', 'accepted', 'ready', 'picked_up', 'delivered'];

export function StatusProgress({ status }: { status: OrderStatus }) {
  const idx = FLOW.indexOf(status);
  if (idx === -1) return null;
  return (
    <div className="flex items-center gap-1 mt-3">
      {FLOW.map((s, i) => (
        <div key={s} className="flex-1">
          <div className={`h-1.5 rounded-full ${i <= idx ? 'bg-green-500' : 'bg-stone-200'}`} />
          <p className={`text-[10px] mt-1 text-center ${i <= idx ? 'text-green-700 font-medium' : 'text-stone-400'}`}>{STATUS_LABEL[s]}</p>
        </div>
      ))}
    </div>
  );
}

export function StatusTimeline({ history }: { history?: StatusEvent[] }) {
  if (!history?.length) return null;
  return (
    <ol className="mt-3 border-l-2 border-stone-200 pl-4 space-y-2">
      {[...history].reverse().map((e, i) => (
        <li key={i} className="relative text-xs">
          <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-green-500' : 'bg-stone-300'}`} />
          <span className="font-medium text-stone-700">{STATUS_LABEL[e.status]}</span>
          <span className="text-stone-400"> · {ROLE_LABEL[e.role]} · {new Date(e.at).toLocaleString('bn-BD')}</span>
          {e.note && <p className="text-stone-500">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
