import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// প্রতিটি request এ JWT token যোগ করো
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ak_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 হলে localStorage ও কুকি দুটোই মুছে login এ পাঠাও।
// শুধু localStorage মুছলে কুকি থেকে যেত → proxy /login থেকে / এ ফেরত পাঠাত → হোম পেজ বারবার রিফ্রেশ হত।
// পাবলিক/অথ পেজে থাকলে হার্ড রিডাইরেক্ট করি না (সেখানেই রিডাইরেক্ট লুপ হচ্ছিল)।
const PUBLIC_PATHS = ['/', '/login', '/register'];

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      useAuthStore.getState().clearAuth();
      if (!PUBLIC_PATHS.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
