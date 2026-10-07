'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore, UserRole } from '../../store/authStore';
import { firebaseSignOut } from '../../lib/firebaseSignOut';

type JoinRole = 'user' | 'kitchen' | 'delivery';

const REGISTER: Record<JoinRole, string> = { user: '/register', kitchen: '/register?role=kitchen', delivery: '/register?role=delivery' };
export const DASHBOARD: Record<UserRole, string> = { user: '/user/browse', kitchen: '/kitchen', delivery: '/delivery', admin: '/admin' };
const ROLE_NAME: Record<UserRole, string> = { user: 'গ্রাহক', kitchen: 'কিচেন মালিক', delivery: 'ডেলিভারি পার্টনার', admin: 'অ্যাডমিন' };

interface Props {
  role: JoinRole;             // এই বোতাম কোন ধরনের একাউন্টের জন্য
  label: React.ReactNode;     // লগআউট অবস্থায় / অন্য রোলে লগইন থাকলে
  loggedLabel?: React.ReactNode; // একই রোলে লগইন থাকলে (ড্যাশবোর্ডে যায়)
  loggedHref?: string;        // একই রোলে লগইন থাকলে কোথায় যাবে (ডিফল্ট ড্যাশবোর্ড)
  className?: string;
}

// লগআউট → রেজিস্টার পেজ; একই রোলে লগইন → নিজের ড্যাশবোর্ড;
// অন্য রোলে লগইন → অনুমতি চেয়ে মডাল, রাজি হলে লগআউট করে নতুন একাউন্ট খোলার পেজে
export default function RoleLink({ role, label, loggedLabel, loggedHref, className }: Props) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) return <Link href={REGISTER[role]} className={className}>{label}</Link>;
  if (user.role === role) return <Link href={loggedHref ?? DASHBOARD[role]} className={className}>{loggedLabel ?? label}</Link>;

  const switchAccount = async () => {
    setBusy(true);
    await firebaseSignOut();
    clearAuth(); // কুকিও মুছে যায় — নইলে proxy রেজিস্টার পেজ থেকে আবার ড্যাশবোর্ডে ফেরত পাঠাত
    toast.success('লগআউট হয়েছে — এবার নতুন একাউন্ট খুলুন');
    window.location.href = REGISTER[role];
  };

  return (
    <>
      <button type="button" onClick={() => setAsk(true)} className={className}>{label}</button>
      {ask && createPortal(
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="sk-backdrop absolute inset-0 bg-black/60" onClick={() => !busy && setAsk(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-labelledby="switch-title" className="sk-sheet relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-left">
            <div className="text-4xl mb-3">🔄</div>
            <h2 id="switch-title" className="text-xl font-bold text-stone-800 mb-2">নতুন {ROLE_NAME[role]} একাউন্ট খুলবেন?</h2>
            <p className="text-sm text-stone-600 leading-relaxed mb-1">
              আপনি এখন <b>{user.name}</b> নামে <b>{ROLE_NAME[user.role]}</b> হিসেবে লগইন আছেন।
            </p>
            <p className="text-sm text-stone-600 leading-relaxed mb-6">
              নতুন একাউন্ট খুলতে আগে এই একাউন্ট থেকে লগআউট করতে হবে। আপনার বর্তমান একাউন্ট ও তথ্য যেমন আছে তেমনই থাকবে — পরে আবার লগইন করতে পারবেন।
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button type="button" onClick={() => setAsk(false)} disabled={busy} className="flex-1 py-3 rounded-xl border border-stone-300 text-stone-700 font-medium hover:bg-stone-50 disabled:opacity-50">
                না, থাক
              </button>
              <button type="button" onClick={switchAccount} disabled={busy} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-60">
                {busy ? 'লগআউট হচ্ছে...' : 'লগআউট করে এগিয়ে যান'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
