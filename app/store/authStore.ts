'use client';
import { create } from 'zustand';

export type UserRole = 'admin' | 'kitchen' | 'user' | 'delivery';

export interface StaffRoleRef { _id: string; name: string; permissions: string[]; isActive: boolean }

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isApproved: boolean;
  avatar?: string;
  walletBalance?: number;
  kitchenName?: string;
  kitchenDescription?: string;
  buildingName?: string;
  buildingAddress?: string;
  areaId?: string;   // user/kitchen — নির্বাচিত এলাকা
  area?: string;     // এলাকার নাম
  deliveryAreaIds?: string[];
  isAvailable?: boolean;     // ডেলিভারি বয় অ্যাক্টিভ/অফ
  staffRole?: StaffRoleRef | null; // admin: না থাকলে সুপার অ্যাডমিন
  kitchenLocation?: { coordinates: [number, number] } | null; // kitchen: নিজের পিন (শুধু নিজের প্রোফাইলে আসে)
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  isLoading: boolean;
  setLoading: (v: boolean) => void;
}

// শেষ প্রোফাইল localStorage-এ রাখা হয় — পরের বার পেজ খুললে সার্ভারের উত্তরের অপেক্ষা না করেই ড্যাশবোর্ড দেখায়
const USER_KEY = 'ak_user';
const safe = <T,>(fn: () => T, fallback: T): T => { try { return fn(); } catch { return fallback; } };

export const readCachedSession = (): { user: AuthUser; token: string } | null => {
  if (typeof window === 'undefined') return null;
  return safe(() => {
    const token = localStorage.getItem('ak_token');
    const raw = localStorage.getItem(USER_KEY);
    return token && raw ? { token, user: JSON.parse(raw) as AuthUser } : null;
  }, null);
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  setAuth: (user, token) => {
    safe(() => {
      localStorage.setItem('ak_token', token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }, undefined);
    document.cookie = `ak_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    set({ user, token });
  },
  clearAuth: () => {
    safe(() => {
      localStorage.removeItem('ak_token');
      localStorage.removeItem(USER_KEY);
    }, undefined);
    document.cookie = 'ak_token=; path=/; max-age=0; SameSite=Lax';
    set({ user: null, token: null });
  },
  setLoading: (v) => set({ isLoading: v }),
}));
