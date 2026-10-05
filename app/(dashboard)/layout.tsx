'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

const NAV_ITEMS = {
  admin: [
    { href: '/admin', label: '📊 ড্যাশবোর্ড' },
    { href: '/admin/orders', label: '🧾 সব অর্ডার' },
    { href: '/admin/users', label: '👥 ইউজার' },
    { href: '/admin/foods', label: '🍽️ খাবার লাইব্রেরি' },
    { href: '/admin/packages', label: '📦 প্যাকেজ' },
    { href: '/admin/approvals', label: '✅ অ্যাপ্রুভাল' },
    { href: '/admin/locations', label: '🗺️ লোকেশন' },
    { href: '/admin/config', label: '⚙️ কনফিগ' },
    { href: '/admin/finance', label: '💰 ফিনান্স' },
    { href: '/profile', label: '📍 প্রোফাইল' },
  ],
  kitchen: [
    { href: '/kitchen', label: '📊 ড্যাশবোর্ড' },
    { href: '/kitchen/menu', label: '🍱 আজকের মেনু' },
    { href: '/kitchen/orders', label: '📋 অর্ডার' },
    { href: '/kitchen/wallet', label: '💰 ওয়ালেট' },
    { href: '/profile', label: '📍 প্রোফাইল' },
  ],
  user: [
    { href: '/user', label: '🏠 হোম' },
    { href: '/user/browse', label: '🔍 কিচেন খুঁজুন' },
    { href: '/user/orders', label: '📋 আমার অর্ডার' },
    { href: '/user/subscription', label: '🔔 সাবস্ক্রিপশন' },
    { href: '/user/resell', label: '♻️ রিসেল' },
    { href: '/profile', label: '📍 প্রোফাইল' },
  ],
  delivery: [
    { href: '/delivery', label: '📊 ড্যাশবোর্ড' },
    { href: '/delivery/pickups', label: '📦 পিকআপ' },
    { href: '/delivery/scan', label: '📱 কোড স্ক্যান' },
    { href: '/delivery/earnings', label: '💵 আয়' },
    { href: '/profile', label: '📍 প্রোফাইল' },
  ],
};

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect y="3" width="20" height="2" rx="1" fill="currentColor" />
      <rect y="9" width="20" height="2" rx="1" fill="currentColor" />
      <rect y="15" width="20" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role || 'user';
  const navItems = NAV_ITEMS[role as keyof typeof NAV_ITEMS] || [];

  const handleLogout = async () => {
    await signOut(auth);
    clearAuth();
    toast.success('লগআউট হয়েছে');
    router.push('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const currentLabel = navItems.find((i) => i.href === pathname)?.label ?? '🍱 শখের কিচেন';

  return (
    <div className="flex min-h-screen bg-green-50 pt-16">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed top-16 left-0 bottom-0 z-40 w-64 bg-white shadow-lg flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:top-auto md:left-auto md:bottom-auto md:z-auto',
          'md:w-56 md:translate-x-0 md:shadow-md',
        ].join(' ')}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <span className="text-xl font-bold text-green-700">🍱 শখের কিচেন</span>
          <button
            onClick={closeSidebar}
            className="md:hidden p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 transition"
            aria-label="মেনু বন্ধ করুন"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={`block px-3 py-2.5 rounded-lg text-sm transition ${
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
          <p className="text-xs text-stone-500 mb-1 truncate">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-red-500 hover:text-red-700 text-left transition"
          >
            লগআউট →
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-16 z-20 bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-700 transition"
            aria-label="মেনু খুলুন"
          >
            <HamburgerIcon />
          </button>
          <span className="text-sm font-semibold text-stone-700 truncate">{currentLabel}</span>
        </div>

        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
