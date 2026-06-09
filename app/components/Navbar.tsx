'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

const DASHBOARD_MAP: Record<string, string> = {
  admin: '/admin',
  kitchen: '/kitchen',
  user: '/user',
  delivery: '/delivery',
};

const ROLE_LABEL: Record<string, string> = {
  admin: 'অ্যাডমিন',
  kitchen: 'কিচেন',
  user: 'ড্যাশবোর্ড',
  delivery: 'ডেলিভারি',
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, clearAuth, isLoading } = useAuthStore();

  const isHome = pathname === '/';
  const transparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const close = () => setDropdownOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    clearAuth();
    toast.success('লগআউট হয়েছে');
    window.location.href = '/';
  };

  const dashboardHref = user ? (DASHBOARD_MAP[user.role] ?? '/') : '/';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent
          ? 'bg-transparent py-3'
          : 'bg-white/95 backdrop-blur-md shadow-sm py-2 border-b border-stone-100'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 select-none">
          <span className="text-2xl">🍱</span>
          <span className={`text-xl font-extrabold tracking-tight ${transparent ? 'text-white' : 'text-green-700'}`}>
            আমার কিচেন
          </span>
        </Link>

        {/* Desktop right side */}
        <div className="hidden sm:flex items-center gap-2">
          {isLoading ? (
            <div className="w-24 h-8 rounded-lg bg-stone-200/50 animate-pulse" />
          ) : user ? (
            /* ── Logged-in state ── */
            <div className="flex items-center gap-3">
              {/* Dashboard button */}
              <Link
                href={dashboardHref}
                className={`font-bold px-5 py-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 ${
                  transparent
                    ? 'bg-white text-green-700 hover:bg-green-50 shadow-sm'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow hover:shadow-md'
                }`}
              >
                {ROLE_LABEL[user.role] ?? 'ড্যাশবোর্ড'} →
              </Link>

              {/* User avatar dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                    transparent ? 'text-white hover:bg-white/10' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                  <span className="text-xs opacity-60">▾</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs text-stone-500">লগইন করা আছেন</p>
                      <p className="text-sm font-semibold text-stone-800 truncate">{user.email}</p>
                    </div>
                    <Link
                      href={dashboardHref}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      📊 ড্যাশবোর্ড
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      🚪 লগআউট
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Logged-out state ── */
            <>
              <Link
                href="/login"
                className={`font-semibold px-5 py-2 rounded-xl transition-all duration-200 ${
                  transparent
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-stone-700 hover:text-green-700 hover:bg-green-50'
                }`}
              >
                লগইন
              </Link>
              <Link
                href="/register"
                className={`font-bold px-5 py-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 ${
                  transparent
                    ? 'bg-white text-green-700 hover:bg-green-50 shadow-sm'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow hover:shadow-md'
                }`}
              >
                শুরু করুন
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-lg"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-5 h-0.5 ${i < 2 ? 'mb-1.5' : ''} ${transparent ? 'bg-white' : 'bg-stone-700'}`}
            />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden bg-white/98 backdrop-blur-md border-t border-stone-100 px-4 py-4 flex flex-col gap-2">
          {isLoading ? null : user ? (
            <>
              <div className="px-3 py-2 bg-green-50 rounded-xl mb-1">
                <p className="text-xs text-stone-500">লগইন করা আছেন</p>
                <p className="text-sm font-semibold text-stone-800">{user.name}</p>
              </div>
              <Link
                href={dashboardHref}
                className="font-bold text-center bg-green-600 text-white py-3 rounded-xl hover:bg-green-700"
                onClick={() => setMenuOpen(false)}
              >
                {ROLE_LABEL[user.role] ?? 'ড্যাশবোর্ড'} →
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-500 py-2 font-medium hover:text-red-700"
              >
                লগআউট
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-semibold text-stone-700 py-2 px-3 rounded-xl hover:bg-green-50 text-center" onClick={() => setMenuOpen(false)}>লগইন</Link>
              <Link href="/register" className="font-bold text-center bg-green-600 text-white py-3 rounded-xl hover:bg-green-700" onClick={() => setMenuOpen(false)}>শুরু করুন</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
