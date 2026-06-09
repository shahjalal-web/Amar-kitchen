'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { auth } from '../../lib/firebase';
import api from '../../lib/api';
import { useAuthStore, UserRole } from '../../store/authStore';

type RegisterForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  buildingName?: string;
  buildingAddress?: string;
  area?: string;
  kitchenName?: string;
  nidNumber?: string;
};

const ROLES = [
  { value: 'user', label: '👤 গ্রাহক' },
  { value: 'kitchen', label: '👩‍🍳 কিচেন ওনার' },
  { value: 'delivery', label: '🛵 ডেলিভারি বয়' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: { role: 'user' },
  });

  const role = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await sendEmailVerification(cred.user);
      const firebaseToken = await cred.user.getIdToken();
      const res = await api.post('/auth/register', { ...data, firebaseToken });
      const { user, token } = res.data.data;
      setAuth(user, token);

      if (data.role === 'kitchen' || data.role === 'delivery') {
        toast.success('রেজিস্ট্রেশন সফল! অ্যাডমিন অ্যাপ্রুভ করলে কাজ শুরু করতে পারবেন।');
        router.push('/login');
      } else {
        toast.success('রেজিস্ট্রেশন সফল!');
        router.push('/user');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-bold text-stone-800 mb-6">নতুন একাউন্ট</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">আপনি কে?</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <label key={r.value} className={`cursor-pointer border-2 rounded-lg p-2 text-center text-sm transition ${role === r.value ? 'border-green-600 bg-green-50' : 'border-stone-200'}`}>
                <input type="radio" {...register('role')} value={r.value} className="sr-only" />
                {r.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">নাম</label>
          <input
            {...register('name', { required: 'নাম দিন' })}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="আপনার পুরো নাম"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">ইমেইল</label>
          <input
            type="email"
            {...register('email', { required: 'ইমেইল দিন' })}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">মোবাইল নম্বর</label>
          <input
            {...register('phone', { required: 'মোবাইল নম্বর দিন' })}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="01XXXXXXXXX"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">পাসওয়ার্ড</label>
          <input
            type="password"
            {...register('password', { required: 'পাসওয়ার্ড দিন', minLength: { value: 6, message: 'ন্যূনতম ৬ অক্ষর' } })}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        {/* User-specific fields */}
        {role === 'user' && (
          <>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">বিল্ডিং নাম</label>
              <input {...register('buildingName')} className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="যেমন: করিম টাওয়ার" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">ঠিকানা</label>
              <input {...register('buildingAddress')} className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">এলাকা</label>
              <input {...register('area')} className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="যেমন: মিরপুর-১০" />
            </div>
          </>
        )}

        {/* Kitchen-specific fields */}
        {role === 'kitchen' && (
          <>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">কিচেনের নাম</label>
              <input {...register('kitchenName', { required: role === 'kitchen' ? 'কিচেনের নাম দিন' : false })} className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">এনআইডি নম্বর</label>
              <input {...register('nidNumber')} className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
              ⚠️ কিচেন একাউন্ট অ্যাডমিন অ্যাপ্রুভ করার পর সক্রিয় হবে।
            </p>
          </>
        )}

        {/* Delivery-specific fields */}
        {role === 'delivery' && (
          <>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">এনআইডি নম্বর</label>
              <input {...register('nidNumber')} className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
              ⚠️ ডেলিভারি একাউন্ট অ্যাডমিন অ্যাপ্রুভ করার পর সক্রিয় হবে।
            </p>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
        >
          {loading ? 'অপেক্ষা করুন...' : 'রেজিস্ট্রেশন করুন'}
        </button>
      </form>

      <p className="text-center text-sm text-stone-600 mt-6">
        একাউন্ট আছে?{' '}
        <Link href="/login" className="text-green-600 hover:underline font-medium">
          লগইন করুন
        </Link>
      </p>
    </>
  );
}
