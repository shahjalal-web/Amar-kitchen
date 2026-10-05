'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { firebaseSignOut } from '../lib/firebaseSignOut';
import { useAuthStore } from '../store/authStore';
import { canSeeAdminPage, isSuperAdmin } from '../lib/permissions';
import Loader from '../components/ui/Loader';

interface NavItem { href: string; label: string; icon: string; short?: string }

const NAV_ITEMS: Record<string, NavItem[]> = {
  admin: [
    { href: '/admin', icon: '📊', label: 'ড্যাশবোর্ড' },
    { href: '/admin/orders', icon: '🧾', label: 'সব অর্ডার', short: 'অর্ডার' },
    { href: '/admin/users', icon: '👥', label: 'ইউজার' },
    { href: '/admin/foods', icon: '🍽️', label: 'খাবার লাইব্রেরি', short: 'খাবার' },
    { href: '/admin/packages', icon: '📦', label: 'প্যাকেজ' },
    { href: '/admin/approvals', icon: '✅', label: 'অ্যাপ্রুভাল' },
    { href: '/admin/locations', icon: '🗺️', label: 'লোকেশন' },
    { href: '/admin/config', icon: '⚙️', label: 'কনফিগ' },
    { href: '/admin/finance', icon: '💰', label: 'ফিনান্স' },
    { href: '/admin/staff', icon: '🛡️', label: 'স্টাফ ও রোল', short: 'স্টাফ' },
    { href: '/profile', icon: '📍', label: 'প্রোফাইল' },
  ],
  kitchen: [
    { href: '/kitchen', icon: '📊', label: 'ড্যাশবোর্ড', short: 'হোম' },
    { href: '/kitchen/menu', icon: '🍱', label: 'আজকের মেনু', short: 'মেনু' },
    { href: '/kitchen/orders', icon: '📋', label: 'অর্ডার' },
    { href: '/kitchen/wallet', icon: '💰', label: 'ওয়ালেট' },
    { href: '/profile', icon: '📍', label: 'প্রোফাইল' },
  ],
  user: [
    { href: '/user', icon: '🏠', label: 'হোম' },
    { href: '/user/browse', icon: '🔍', label: 'কিচেন খুঁজুন', short: 'খুঁজুন' },
    { href: '/user/orders', icon: '📋', label: 'আমার অর্ডার', short: 'অর্ডার' },
    { href: '/user/subscription', icon: '🔔', label: 'সাবস্ক্রিপশন', short: 'সাবস্ক্রাইব' },
    { href: '/user/resell', icon: '♻️', label: 'রিসেল' },
    { href: '/profile', icon: '📍', label: 'প্রোফাইল' },
  ],
  delivery: [
    { href: '/delivery', icon: '📊', label: 'ড্যাশবোর্ড', short: 'হোম' },
    { href: '/delivery/pickups', icon: '📦', label: 'পিকআপ' },
    { href: '/delivery/scan', icon: '📱', label: 'কোড স্ক্যান', short: 'স্ক্যান' },
    { href: '/delivery/earnings', icon: '💵', label: 'আয়' },
    { href: '/profile', icon: '📍', label: 'প্রোফাইল' },
  ],
};

// মোবাইলের নিচের ট্যাব বারে প্রতি রোলের প্রথম ৪টি (বাকিগুলো "আরো" মেনুতে)
const TAB_COUNT = 4;

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const isActivePath = (pathname: string, href: string) =>
  pathname === href || (href.split('/').length > 2 && pathname.startsWith(href + '/'));

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth, isLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role || 'user';
  const navItems = (NAV_ITEMS[role] || []).filter((i) => role !== 'admin' || canSeeAdminPage(user, i.href));
  const tabs = navItems.slice(0, TAB_COUNT);

  const handleLogout = async () => {
    await firebaseSignOut();
    clearAuth();
    toast.success('লগআউট হয়েছে');
    router.push('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  // স্টাফের রোলে এই পেজের অনুমতি না থাকলে
  const blocked = !!user && role === 'admin' && pathname.startsWith('/admin') && !canSeeAdminPage(user, pathname);

  // ড্যাশবোর্ডের অনুমতি না থাকলে লগইনের পর প্রথম অনুমোদিত পেজে নিয়ে যাও
  const fallback = navItems[0]?.href;
  useEffect(() => {
    if (blocked && pathname === '/admin' && fallback && fallback !== '/admin') router.replace(fallback);
  }, [blocked, pathname, fallback, router]);

  return (
    <div className="flex min-h-screen bg-green-50 pt-16">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden sk-backdrop" onClick={closeSidebar} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed top-16 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white shadow-lg flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:z-auto md:w-56 md:translate-x-0 md:shadow-md',
        ].join(' ')}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-xl font-bold text-green-700">🍱 শখের কিচেন</span>
            {role === 'admin' && (
              <p className="text-[11px] text-stone-500 truncate">{isSuperAdmin(user) ? '🛡️ সুপার অ্যাডমিন' : `👤 ${user?.staffRole?.name ?? 'স্টাফ'}`}</p>
            )}
          </div>
          <button onClick={closeSidebar} className="md:hidden p-2 rounded-lg text-stone-500 hover:bg-stone-100 transition" aria-label="মেনু বন্ধ করুন">
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={`flex items-center gap-2 px-3 py-3 md:py-2.5 rounded-lg text-[15px] md:text-sm transition ${
                isActivePath(pathname, item.href) ? 'bg-green-100 text-green-700 font-semibold' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="text-xs text-stone-500 mb-1 truncate">{user?.name}</p>
          <button onClick={handleLogout} className="w-full text-sm text-red-500 hover:text-red-700 text-left transition py-1">
            লগআউট →
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 min-w-0">
          {isLoading && !user ? (
            <Loader />
          ) : blocked ? (
            <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-sm text-center mt-6">
              <p className="text-4xl mb-2">🔒</p>
              <h1 className="text-lg font-bold text-stone-800">এই পেজের অনুমতি নেই</h1>
              <p className="text-sm text-stone-500 mt-1">আপনার রোল ({user?.staffRole?.name ?? 'স্টাফ'})-এ এই অংশটি নেই। দরকার হলে সুপার অ্যাডমিনকে বলুন।</p>
              {navItems[0] && (
                <Link href={navItems[0].href} className="inline-block mt-4 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  {navItems[0].icon} {navItems[0].label}-এ যান
                </Link>
              )}
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* মোবাইলের নিচের ট্যাব বার */}
      {user && tabs.length > 0 && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}>
            {tabs.map((t) => {
              const active = isActivePath(pathname, t.href);
              return (
                <Link key={t.href} href={t.href} className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${active ? 'text-green-700 font-semibold' : 'text-stone-500'}`}>
                  <span className={`text-lg leading-none ${active ? '' : 'grayscale-40'}`} aria-hidden="true">{t.icon}</span>
                  <span className="truncate max-w-full px-1">{t.short ?? t.label}</span>
                </Link>
              );
            })}
            <button onClick={() => setSidebarOpen(true)} className="flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] text-stone-500">
              <span className="text-lg leading-none" aria-hidden="true">☰</span>
              <span>আরো</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
