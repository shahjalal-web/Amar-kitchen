'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { getErrorMessage } from '../../lib/errors';
import { useAuthStore } from '../../store/authStore';
import { OrderStatus } from './OrderStatus';

export interface DeliveryBoyRef { _id: string; name: string; phone: string; isAvailable?: boolean }

// অর্ডারের অবস্থা থেকে ডেলিভারিকারীর এখনকার কাজ
const DELIVERY_STAGE: Partial<Record<OrderStatus, string>> = {
  accepted: '⏳ রান্না শেষের অপেক্ষায়',
  ready: '📦 পিকআপের অপেক্ষায়',
  picked_up: '🛵 খাবার নিয়ে পথে আছেন',
  delivered: '✅ ডেলিভারি দিয়েছেন',
};

// ─── ডেলিভারি তথ্য: কে দেবে, ফোন, অ্যাক্টিভ/অফ, এখনকার অবস্থা ───
export function DeliveryInfo({
  status, deliveryMode, deliveryBoy, kitchenPhone, viewer,
}: {
  status: OrderStatus;
  deliveryMode?: 'self' | 'delivery_boy';
  deliveryBoy?: DeliveryBoyRef | null;
  kitchenPhone?: string;
  viewer: 'kitchen' | 'user' | 'admin';
}) {
  if (['pending', 'rejected', 'cancelled', 'resell', 'resold'].includes(status) && !deliveryBoy) return null;
  const stage = DELIVERY_STAGE[status];

  if (deliveryMode === 'self') {
    return (
      <div className="mt-2 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
        <span className="font-medium text-orange-800">🚚 {viewer === 'kitchen' ? 'আপনি নিজে ডেলিভারি দেবেন' : 'কিচেন নিজে ডেলিভারি দেবে'}</span>
        {viewer !== 'kitchen' && kitchenPhone && <a href={`tel:${kitchenPhone}`} className="text-orange-700 hover:underline">📞 {kitchenPhone}</a>}
        {stage && <span className="text-stone-600">{stage}</span>}
      </div>
    );
  }

  if (deliveryBoy) {
    return (
      <div className="mt-2 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5">
        <span className="font-medium text-indigo-800">🛵 ডেলিভারি বয়: {deliveryBoy.name}</span>
        <a href={`tel:${deliveryBoy.phone}`} className="text-indigo-700 hover:underline">📞 {deliveryBoy.phone}</a>
        {viewer !== 'user' && deliveryBoy.isAvailable !== undefined && (
          <span className={deliveryBoy.isAvailable ? 'text-green-700' : 'text-stone-500'}>
            {deliveryBoy.isAvailable ? '● অ্যাক্টিভ' : '○ অফ'}
          </span>
        )}
        {stage && <span className="text-stone-600">{stage}</span>}
      </div>
    );
  }

  if (status === 'accepted' || status === 'ready') {
    return (
      <p className="mt-2 text-xs text-amber-700">
        ⚠️ ডেলিভারি এখনো নির্ধারিত হয়নি{viewer === 'kitchen' ? ' — নিচে নিজে ডেলিভারি দিন বা ডেলিভারি বয় বেছে নিন' : ''}
      </p>
    );
  }
  return null;
}

// ─── ডেলিভারি সম্পন্ন: গ্রাহকের ৪ অঙ্কের কোড দিয়ে ───
export function DeliverWithOtp({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!/^\d{4}$/.test(otp)) return toast.error('গ্রাহকের কাছ থেকে ৪ অঙ্কের কোড নিন');
    setBusy(true);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'delivered', otp });
      toast.success('ডেলিভারি সম্পন্ন হয়েছে ✅');
      setOtp('');
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে'));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await api.post(`/orders/${orderId}/resend-otp`);
      toast.success('গ্রাহককে নতুন কোড পাঠানো হয়েছে');
    } catch (err) { toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে')); }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 w-full">
      <span className="text-sm text-emerald-900">খাবার দেওয়ার পর গ্রাহকের ডেলিভারি কোড:</span>
      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
        inputMode="numeric"
        placeholder="••••"
        className="w-24 text-center tracking-[0.4em] font-semibold border border-emerald-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
      <button onClick={submit} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
        {busy ? 'যাচাই হচ্ছে...' : '✅ ডেলিভারি সম্পন্ন'}
      </button>
      <button onClick={resend} type="button" className="text-xs text-emerald-800 hover:underline">গ্রাহক কোড পাননি? আবার পাঠান</button>
    </div>
  );
}

// ─── ডেলিভারি বয়ের অ্যাক্টিভ/অফ সুইচ ───
export function AvailabilityToggle({ onChange }: { onChange?: (v: boolean) => void }) {
  const { user, token, setAuth } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const on = user?.isAvailable !== false;

  const toggle = async () => {
    setBusy(true);
    try {
      const res = await api.patch('/delivery/availability', { isAvailable: !on });
      if (token) setAuth(res.data.data, token);
      toast.success(res.data.message);
      onChange?.(!on);
    } catch (err) {
      toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 mb-6 border ${on ? 'bg-green-50 border-green-200' : 'bg-stone-100 border-stone-200'}`}>
      <div>
        <p className={`font-semibold ${on ? 'text-green-800' : 'text-stone-700'}`}>{on ? '● আপনি এখন অ্যাক্টিভ' : '○ আপনি এখন অফ'}</p>
        <p className="text-xs text-stone-500">
          {on ? 'কিচেন আপনাকে খুঁজে পাবে এবং এলাকার নতুন ডেলিভারি দেখবেন।' : 'অফ থাকলে কিচেনের তালিকায় দেখাবেন না, নতুন ডেলিভারিও আসবে না। চলমান ডেলিভারি শেষ করতে পারবেন।'}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        role="switch"
        aria-checked={on}
        className={`relative w-14 h-8 rounded-full transition disabled:opacity-50 ${on ? 'bg-green-600' : 'bg-stone-400'}`}
      >
        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
        <span className="sr-only">{on ? 'অফ করুন' : 'অ্যাক্টিভ করুন'}</span>
      </button>
    </div>
  );
}
