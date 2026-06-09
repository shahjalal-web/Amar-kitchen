'use client';
import { useAuthStore } from '../../store/authStore';
import Link from 'next/link';

export default function KitchenDashboard() {
  const { user } = useAuthStore();

  if (!user?.isApproved) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-amber-50 rounded-2xl p-8 max-w-sm">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-amber-700 mb-2">অ্যাপ্রুভালের অপেক্ষায়</h2>
          <p className="text-amber-600 text-sm">অ্যাডমিন আপনার তথ্য যাচাই করছেন। অ্যাপ্রুভ হলে ইমেইল পাবেন।</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">{user?.kitchenName || 'আমার কিচেন'}</h1>
      <p className="text-stone-500 mb-8">আজকের রান্না পরিচালনা করুন</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: '/kitchen/menu', icon: '🍱', label: 'আজকের মেনু', color: 'bg-orange-100' },
          { href: '/kitchen/orders', icon: '📋', label: 'অর্ডার', color: 'bg-green-100' },
          { href: '/kitchen/wallet', icon: '💰', label: 'ওয়ালেট', color: 'bg-yellow-100' },
          { href: '/kitchen/menu', icon: '✅', label: 'পিকআপ রেডি', color: 'bg-blue-100' },
        ].map((card) => (
          <Link
            key={card.href + card.label}
            href={card.href}
            className={`${card.color} rounded-2xl p-6 text-center hover:shadow-md transition block`}
          >
            <div className="text-4xl mb-2">{card.icon}</div>
            <p className="font-medium text-stone-700">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-stone-500">আজকের ওয়ালেট ব্যালেন্স</p>
        <p className="text-3xl font-bold text-orange-600">৳ {user?.walletBalance || 0}</p>
      </div>
    </div>
  );
}
