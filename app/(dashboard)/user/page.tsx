'use client';
import { useAuthStore } from '../../store/authStore';
import Link from 'next/link';

export default function UserDashboard() {
  const { user } = useAuthStore();

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">স্বাগতম, {user?.name}!</h1>
      <p className="text-stone-500 mb-8">আজকের খাবার অর্ডার করুন</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: '/user/browse', icon: '🔍', label: 'কিচেন খুঁজুন', color: 'bg-orange-100' },
          { href: '/user/orders', icon: '📋', label: 'আমার অর্ডার', color: 'bg-green-100' },
          { href: '/user/subscription', icon: '🔔', label: 'সাবস্ক্রিপশন', color: 'bg-blue-100' },
          { href: '/user/resell', icon: '♻️', label: 'রিসেল অফার', color: 'bg-purple-100' },
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

      {user?.buildingName && (
        <div className="mt-8 bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-stone-500">📍 আপনার বিল্ডিং: <span className="font-semibold text-stone-700">{user.buildingName}</span></p>
          <p className="text-xs text-green-600 mt-1">একই বিল্ডিংয়ের অর্ডার একসাথে করলে ডেলিভারি চার্জ কম পড়বে!</p>
        </div>
      )}
    </div>
  );
}
