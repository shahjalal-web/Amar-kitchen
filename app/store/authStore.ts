'use client';
import { create } from 'zustand';

export type UserRole = 'admin' | 'kitchen' | 'user' | 'delivery';

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isApproved: boolean;
  avatar?: string;
  walletBalance?: number;
  kitchenName?: string;
  buildingName?: string;
  area?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  deliveryAreaIds?: string[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  isLoading: boolean;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  setAuth: (user, token) => {
    localStorage.setItem('ak_token', token);
    document.cookie = `ak_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    set({ user, token });
  },
  clearAuth: () => {
    localStorage.removeItem('ak_token');
    document.cookie = 'ak_token=; path=/; max-age=0; SameSite=Lax';
    set({ user: null, token: null });
  },
  setLoading: (v) => set({ isLoading: v }),
}));
