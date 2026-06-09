'use client';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

export const useAuthInit = () => {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const storedToken = localStorage.getItem('ak_token');

        // No backend token yet — login page is handling the flow, don't interfere
        if (!storedToken) {
          setLoading(false);
          return;
        }

        try {
          const res = await api.get('/auth/profile', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          setAuth(res.data.data, storedToken);
        } catch {
          clearAuth();
        }
      } else {
        clearAuth();
      }
      setLoading(false);
    });
    return () => unsub();
  }, [setAuth, clearAuth, setLoading]);
};
