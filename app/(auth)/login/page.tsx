'use client';
import { useState } from 'react';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { auth } from '../../lib/firebase';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

type LoginForm = { email: string; password: string };

export default function LoginPage() {
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
      const firebaseToken = await cred.user.getIdToken();
      const res = await api.post('/auth/login', { firebaseToken });
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success('লগইন সফল হয়েছে!');

      const dashboardMap: Record<string, string> = {
        admin: '/admin',
        kitchen: '/kitchen',
        user: '/user',
        delivery: '/delivery',
      };
      // Full page navigation — ensures cookie is sent with the next server request
      window.location.href = dashboardMap[user.role] || '/';
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-bold text-stone-800 mb-6">লগইন করুন</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">ইমেইল</label>
          <input
            type="email"
            {...register('email', { required: 'ইমেইল দিন' })}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="example@email.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">পাসওয়ার্ড</label>
          <input
            type="password"
            {...register('password', { required: 'পাসওয়ার্ড দিন', minLength: { value: 6, message: 'ন্যূনতম ৬ অক্ষর' } })}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="••••••"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
        >
          {loading ? 'অপেক্ষা করুন...' : 'লগইন'}
        </button>
      </form>

      <p className="text-center text-sm text-stone-600 mt-6">
        একাউন্ট নেই?{' '}
        <Link href="/register" className="text-green-600 hover:underline font-medium">
          নতুন একাউন্ট খুলুন
        </Link>
      </p>
    </>
  );
}
