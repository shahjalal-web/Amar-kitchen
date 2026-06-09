'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

const NAV_ITEMS = {
  admin: [
    { href: '/admin', label: '📊 ড্যাশবোর্ড' },
    { href: '/admin/foods', label: '🍽️ খাবার লাইব্রেরি' },
    { href: '/admin/packages', label: '📦 প্যাকেজ' },
    { href: '/admin/approvals', label: '✅ অ্যাপ্রুভাল' },
    { href: '/admin/config', label: '⚙️ কনফিগ' },
    { href: '/admin/finance', label: '💰 ফিনান্স' },
  ],
  kitchen: [
    { href: '/kitchen', label: '📊 ড্যাশবোর্ড' },
    { href: '/kitchen/menu', label: '🍱 আজকের মেনু' },
    { href: '/kitchen/orders', label: '📋 অর্ডার' },
    { href: '/kitchen/wallet', label: '💰 ওয়ালেট' },
  ],
  user: [
    { href: '/user', label: '🏠 হোম' },
    { href: '/user/browse', label: '🔍 কিচেন খুঁজুন' },
    { href: '/user/orders', label: '📋 আমার অর্ডার' },
    { href: '/user/subscription', label: '🔔 সাবস্ক্রিপশন' },
    { href: '/user/resell', label: '♻️ রিসেল' },
  ],
  delivery: [
    { href: '/delivery', label: '📊 ড্যাশবোর্ড' },
    { href: '/delivery/pickups', label: '📦 পিকআপ' },
    { href: '/delivery/scan', label: '📱 কোড স্ক্যান' },
    { href: '/delivery/earnings', label: '💵 আয়' },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const role = user?.role || 'user';
  const navItems = NAV_ITEMS[role as keyof typeof NAV_ITEMS] || [];

  const handleLogout = async () => {
    await signOut(auth);
    clearAuth();
    toast.success('লগআউট হয়েছে');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-green-50 pt-16">
      {/* Sidebar */}
      <aside className="w-56 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <span className="text-xl font-bold text-green-700">🍱 আমার কিচেন</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition ${
                pathname === item.href
                  ? 'bg-green-100 text-green-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <p className="text-xs text-stone-500 mb-1">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-red-500 hover:text-red-700 text-left"
          >
            লগআউট →
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
