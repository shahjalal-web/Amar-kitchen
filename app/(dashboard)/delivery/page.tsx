'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import Link from 'next/link';

interface EarningData {
  deliveryCount: number;
  totalEarning: number;
}

export default function DeliveryDashboard() {
  const { user } = useAuthStore();
  const [earnings, setEarnings] = useState<EarningData | null>(null);

  useEffect(() => {
    if (user?.isApproved) {
      api.get('/delivery/earnings').then((r) => setEarnings(r.data.data)).catch(console.error);
    }
  }, [user]);

  if (!user?.isApproved) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-amber-50 rounded-2xl p-8 max-w-sm">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-amber-700 mb-2">অ্যাপ্রুভালের অপেক্ষায়</h2>
          <p className="text-amber-600 text-sm">অ্যাডমিন আপনার এনআইডি যাচাই করছেন।</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">ডেলিভারি ড্যাশবোর্ড</h1>
      <p className="text-stone-500 mb-8">আজকের ডেলিভারি পরিচালনা করুন</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { href: '/delivery/pickups', icon: '📦', label: 'পিকআপ লিস্ট', color: 'bg-orange-100' },
          { href: '/delivery/scan', icon: '📱', label: 'কোড স্ক্যান', color: 'bg-green-100' },
          { href: '/delivery/earnings', icon: '💵', label: 'আজকের আয়', color: 'bg-yellow-100' },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`${card.color} rounded-2xl p-6 text-center hover:shadow-md transition block`}
          >
            <div className="text-4xl mb-2">{card.icon}</div>
            <p className="font-medium text-stone-700">{card.label}</p>
          </Link>
        ))}
      </div>

      {earnings && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-stone-700 mb-4">আজকের সারসংক্ষেপ</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div><p className="text-3xl font-bold text-orange-600">{earnings.deliveryCount}</p><p className="text-sm text-stone-500">ডেলিভারি</p></div>
            <div><p className="text-3xl font-bold text-green-600">৳{earnings.totalEarning}</p><p className="text-sm text-stone-500">মোট আয়</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
