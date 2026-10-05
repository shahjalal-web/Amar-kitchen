'use client';
import { useEffect } from 'react';
import { readCachedSession, useAuthStore } from '../store/authStore';
import api from '../lib/api';

// সেশন = ব্যাকএন্ডের নিজের JWT (Firebase শুধু লগইন/রেজিস্টারে লাগে)।
// আগে Firebase-এর onAuthStateChanged-এর অপেক্ষা করা হতো, তাতে প্রতিবার পেজ খুলতে দেরি হতো।
// এখন: সেভ করা প্রোফাইল দিয়ে সাথে সাথে দেখাই, তারপর পেছনে /auth/profile থেকে হালনাগাদ করি।
export const useAuthInit = () => {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const cached = readCachedSession();
    let token: string | null = null;
    try { token = localStorage.getItem('ak_token'); } catch { /* প্রাইভেট মোড */ }

    if (!token) {
      // টোকেন নেই কিন্তু পুরনো কুকি থাকলে মুছে দাও, নইলে proxy ভাবে লগইন করা আছে
      if (document.cookie.includes('ak_token=')) clearAuth();
      setLoading(false);
      return;
    }

    if (cached) {
      setAuth(cached.user, cached.token);
      setLoading(false);
    }

    api.get('/auth/profile')
      .then((res) => setAuth(res.data.data, token!))
      .catch((err) => {
        // শুধু টোকেন অবৈধ হলে লগআউট; নেটওয়ার্ক সমস্যায় সেভ করা প্রোফাইলই থাকুক
        if (err?.response?.status === 401 || !cached) clearAuth();
      })
      .finally(() => setLoading(false));
  }, [setAuth, clearAuth, setLoading]);
};
