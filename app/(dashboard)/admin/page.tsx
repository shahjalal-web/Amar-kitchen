'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface ConfigData {
  defaultOrderLimit?: number;
  deliveryBaseFee?: number;
  commissionRate?: number;
}

export default function AdminDashboard() {
  const [config, setConfig] = useState<ConfigData | null>(null);

  useEffect(() => {
    api.get('/admin/config').then((r) => setConfig(r.data.data)).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">অ্যাডমিন ড্যাশবোর্ড</h1>
      <p className="text-stone-500 mb-8">সম্পূর্ণ সিস্টেম পরিচালনা করুন</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { href: '/admin/foods', icon: '🍽️', label: 'খাবার লাইব্রেরি', color: 'bg-orange-100' },
          { href: '/admin/packages', icon: '📦', label: 'প্যাকেজ ম্যানেজ', color: 'bg-green-100' },
          { href: '/admin/approvals', icon: '✅', label: 'অ্যাপ্রুভাল', color: 'bg-blue-100' },
          { href: '/admin/config', icon: '⚙️', label: 'কনফিগ', color: 'bg-purple-100' },
          { href: '/admin/finance', icon: '💰', label: 'ফিনান্স', color: 'bg-yellow-100' },
        ].map((card) => (
          <a
            key={card.href}
            href={card.href}
            className={`${card.color} rounded-2xl p-6 text-center hover:shadow-md transition block`}
          >
            <div className="text-4xl mb-2">{card.icon}</div>
            <p className="font-medium text-stone-700">{card.label}</p>
          </a>
        ))}
      </div>

      {config && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-stone-700 mb-4">বর্তমান কনফিগ</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold text-orange-600">{config.defaultOrderLimit}</p><p className="text-xs text-stone-500">ডিফল্ট অর্ডার লিমিট</p></div>
            <div><p className="text-2xl font-bold text-orange-600">৳{config.deliveryBaseFee}</p><p className="text-xs text-stone-500">বেস ডেলিভারি চার্জ</p></div>
            <div><p className="text-2xl font-bold text-orange-600">{config.commissionRate}%</p><p className="text-xs text-stone-500">কমিশন রেট</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
