'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'ready' | 'picked_up' | 'delivered' | 'cancelled' | 'resell' | 'resold';

interface ScannedOrder {
  _id: string;
  uniqueCode: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryCharge: number;
  deliveryAddress: string;
  buildingName: string;
}

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

function ScanForm() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ message: string; order: ScannedOrder } | null>(null);

  useEffect(() => {
    const prefill = searchParams.get('code');
    if (prefill) setCode(prefill);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return toast.error('কোড লিখুন');

    setSubmitting(true);
    setResult(null);
    try {
      const res = await api.post('/delivery/scan', { uniqueCode: code.trim() });
      toast.success(res.data.message || 'সফল হয়েছে');
      setResult({ message: res.data.message, order: res.data.data.order });
      setCode('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">📱 কোড স্ক্যান</h1>
      <p className="text-stone-500 mb-6">প্যাকেটের উপর লেখা অর্ডার কোডটি লিখে সাবমিট করুন</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm mb-6 max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">অর্ডার কোড</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="যেমন: AK12345"
            autoFocus
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition"
        >
          {submitting ? 'যাচাই হচ্ছে...' : 'সাবমিট করুন'}
        </button>
      </form>

      {result && (
        <div className="bg-white rounded-2xl p-6 shadow-sm max-w-md">
          <p className="text-green-700 font-medium mb-3">{result.message}</p>
          <div className="flex items-center gap-2 mb-2">
            <p className="font-semibold text-stone-800">কোড: {result.order.uniqueCode}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[result.order.status]}`}>{STATUS_LABEL[result.order.status]}</span>
          </div>
          <p className="text-sm text-stone-500">{result.order.buildingName}, {result.order.deliveryAddress}</p>
          <p className="text-sm text-stone-600 mt-1">মোট: ৳{result.order.totalAmount} · ডেলিভারি চার্জ: ৳{result.order.deliveryCharge}</p>
        </div>
      )}
    </div>
  );
}

export default function DeliveryScanPage() {
  return (
    <Suspense fallback={<p className="text-stone-500">লোড হচ্ছে...</p>}>
      <ScanForm />
    </Suspense>
  );
}
