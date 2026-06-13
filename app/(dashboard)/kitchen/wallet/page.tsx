'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

interface Wallet {
  walletBalance: number;
  name: string;
}

interface Withdrawal {
  _id: string;
  amount: number;
  bkashNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  note?: string;
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

export default function KitchenWalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(0);
  const [bkashNumber, setBkashNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    Promise.all([
      api.get('/kitchen/wallet'),
      api.get('/kitchen/wallet/withdrawals'),
    ])
      .then(([walletRes, withdrawRes]) => {
        setWallet(walletRes.data.data);
        setWithdrawals(withdrawRes.data.data);
      })
      .catch(() => toast.error('লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return toast.error('সঠিক পরিমাণ দিন');
    if (!bkashNumber.trim()) return toast.error('বিকাশ নাম্বার দিন');

    setSubmitting(true);
    try {
      await api.post('/kitchen/wallet/withdraw', { amount, bkashNumber });
      toast.success('উইথড্র রিকোয়েস্ট পাঠানো হয়েছে');
      setAmount(0);
      setBkashNumber('');
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">💰 ওয়ালেট</h1>
      <p className="text-stone-500 mb-6">ব্যালেন্স দেখুন ও উইথড্র রিকোয়েস্ট করুন</p>

      {loading || !wallet ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <p className="text-sm text-stone-500">বর্তমান ব্যালেন্স</p>
            <p className="text-3xl font-bold text-orange-600">৳ {wallet.walletBalance}</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm mb-8 space-y-4 max-w-md">
            <h2 className="font-semibold text-stone-700">উইথড্র রিকোয়েস্ট করুন</h2>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">পরিমাণ (৳)</label>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">বিকাশ নাম্বার</label>
              <input
                value={bkashNumber}
                onChange={(e) => setBkashNumber(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="01XXXXXXXXX"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition"
            >
              {submitting ? 'পাঠানো হচ্ছে...' : 'রিকোয়েস্ট পাঠান'}
            </button>
          </form>

          <h2 className="font-semibold text-stone-700 mb-3">উইথড্র ইতিহাস</h2>
          {withdrawals.length === 0 ? (
            <p className="text-stone-500">কোনো ইতিহাস নেই।</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm divide-y">
              {withdrawals.map((w) => (
                <div key={w._id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-700">৳{w.amount}</p>
                    <p className="text-xs text-stone-400">{new Date(w.createdAt).toLocaleDateString('bn-BD')} · {w.bkashNumber}</p>
                    {w.note && <p className="text-xs text-red-500 mt-0.5">{w.note}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[w.status]}`}>{STATUS_LABEL[w.status]}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
