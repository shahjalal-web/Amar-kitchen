'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

interface FinanceSummary {
  totalRevenue: number;
  totalDeliveryCharge: number;
  deliveredOrders: number;
  commissionRate: number;
  commissionEarned: number;
  totalKitchenWalletBalance: number;
  pendingWithdrawals: { count: number; amount: number };
  totalPaidOut: number;
}

interface Withdrawal {
  _id: string;
  kitchen: { _id: string; kitchenName?: string; name: string };
  amount: number;
  bkashNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'অপেক্ষমান',
  approved: 'অ্যাপ্রুভড',
  rejected: 'বাতিল',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminFinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = () => {
    Promise.all([
      api.get('/admin/finance'),
      api.get('/admin/withdrawals'),
    ])
      .then(([financeRes, withdrawRes]) => {
        setSummary(financeRes.data.data);
        setWithdrawals(withdrawRes.data.data);
      })
      .catch(() => toast.error('লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await api.patch(`/admin/withdrawals/${id}/approve`);
      toast.success('উইথড্র অ্যাপ্রুভ করা হয়েছে');
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'ব্যর্থ হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('এই উইথড্র রিকোয়েস্ট প্রত্যাখ্যান করতে চান?')) return;
    setProcessingId(id);
    try {
      await api.patch(`/admin/withdrawals/${id}/reject`);
      toast.success('প্রত্যাখ্যান করা হয়েছে');
      loadData();
    } catch {
      toast.error('ব্যর্থ হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const processedWithdrawals = withdrawals.filter((w) => w.status !== 'pending');

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">💰 ফিনান্স</h1>
      <p className="text-stone-500 mb-8">আয়, কমিশন ও উইথড্র রিকোয়েস্ট দেখুন</p>

      {loading || !summary ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-stone-500 mb-1">মোট আয় (ডেলিভারড অর্ডার)</p>
              <p className="text-2xl font-bold text-orange-600">৳{summary.totalRevenue.toLocaleString('bn-BD')}</p>
              <p className="text-xs text-stone-400 mt-1">{summary.deliveredOrders} টি অর্ডার</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-stone-500 mb-1">অ্যাডমিন কমিশন ({summary.commissionRate}%)</p>
              <p className="text-2xl font-bold text-green-600">৳{summary.commissionEarned.toLocaleString('bn-BD')}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-stone-500 mb-1">মোট ডেলিভারি চার্জ</p>
              <p className="text-2xl font-bold text-blue-600">৳{summary.totalDeliveryCharge.toLocaleString('bn-BD')}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-stone-500 mb-1">কিচেন ওয়ালেট ব্যালেন্স (মোট)</p>
              <p className="text-2xl font-bold text-stone-700">৳{summary.totalKitchenWalletBalance.toLocaleString('bn-BD')}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-stone-500 mb-1">পেন্ডিং উইথড্র</p>
              <p className="text-2xl font-bold text-amber-600">৳{summary.pendingWithdrawals.amount.toLocaleString('bn-BD')}</p>
              <p className="text-xs text-stone-400 mt-1">{summary.pendingWithdrawals.count} টি রিকোয়েস্ট</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-stone-500 mb-1">মোট পরিশোধিত</p>
              <p className="text-2xl font-bold text-stone-700">৳{summary.totalPaidOut.toLocaleString('bn-BD')}</p>
            </div>
          </div>

          <h2 className="font-semibold text-stone-700 mb-3">পেন্ডিং উইথড্র রিকোয়েস্ট</h2>
          {pendingWithdrawals.length === 0 ? (
            <p className="text-stone-500 mb-8">কোনো পেন্ডিং রিকোয়েস্ট নেই।</p>
          ) : (
            <div className="space-y-3 mb-8">
              {pendingWithdrawals.map((w) => (
                <div key={w._id} className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-stone-700">{w.kitchen?.kitchenName || w.kitchen?.name || '—'}</p>
                    <p className="text-sm text-stone-500">বিকাশ: {w.bkashNumber}</p>
                    <p className="text-xs text-stone-400">{new Date(w.createdAt).toLocaleDateString('bn-BD')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold text-orange-600">৳{w.amount}</p>
                    <button
                      onClick={() => handleApprove(w._id)}
                      disabled={processingId === w._id}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      অ্যাপ্রুভ
                    </button>
                    <button
                      onClick={() => handleReject(w._id)}
                      disabled={processingId === w._id}
                      className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      বাতিল
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="font-semibold text-stone-700 mb-3">পূর্ববর্তী রিকোয়েস্ট</h2>
          {processedWithdrawals.length === 0 ? (
            <p className="text-stone-500">কোনো ইতিহাস নেই।</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm divide-y">
              {processedWithdrawals.map((w) => (
                <div key={w._id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-700">{w.kitchen?.kitchenName || w.kitchen?.name || '—'}</p>
                    <p className="text-xs text-stone-400">{new Date(w.createdAt).toLocaleDateString('bn-BD')} · {w.bkashNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-stone-700">৳{w.amount}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[w.status]}`}>{STATUS_LABEL[w.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
