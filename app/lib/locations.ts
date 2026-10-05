'use client';
import { useEffect, useState } from 'react';
import api from './api';

export interface CityOption { _id: string; name: string; nameEn?: string; slug?: string; isActive?: boolean }
export interface ThanaOption { _id: string; name: string; nameEn?: string; slug?: string; city: string; isActive?: boolean }
export interface AreaOption {
  _id: string;
  name: string;
  nameEn?: string;
  slug?: string;
  zipCode: string;
  thana: string;
  city: string;
  isActive?: boolean;
  location?: { coordinates: [number, number] };
}
// populated (search/detail) — থানা ও শহরের নামসহ
export interface AreaDetail extends Omit<AreaOption, 'thana' | 'city'> {
  thana: { _id: string; name: string; nameEn?: string };
  city: { _id: string; name: string; nameEn?: string };
}

export const areaLabel = (a: AreaDetail) => `${a.name}, ${a.thana.name}, ${a.city.name}-${a.zipCode}`;
// সার্চ ফলাফলে বাংলা + ইংরেজি দুটোই
export const areaLabelBilingual = (a: AreaDetail) =>
  `${a.name}${a.nameEn ? ` (${a.nameEn})` : ''}, ${a.thana.name}, ${a.city.name}-${a.zipCode}`;

export const fetchThanas = (cityId: string) =>
  api.get('/locations/thanas', { params: { cityId } }).then((r) => r.data.data as ThanaOption[]);

export const fetchAreas = (thanaId: string) =>
  api.get('/locations/areas', { params: { thanaId } }).then((r) => r.data.data as AreaOption[]);

export const fetchAreaDetail = (areaId: string) =>
  api.get(`/locations/areas/${areaId}`).then((r) => r.data.data as AreaDetail | null);

export const searchAreas = (q: string) =>
  api.get('/locations/areas/search', { params: { q } }).then((r) => r.data.data as AreaDetail[]);

// সক্রিয় শহর তালিকা (পাবলিক — রেজিস্ট্রেশনের আগেও কাজ করে)
export function useCities() {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/locations/cities')
      .then((r) => setCities(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { cities, loading };
}

// একটি এরিয়ার বিস্তারিত (নাম, থানা, শহর) — areaId বদলালে আবার আনে
export function useAreaDetail(areaId?: string | null) {
  const [detail, setDetail] = useState<AreaDetail | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!areaId) { Promise.resolve().then(() => !cancelled && setDetail(null)); return; }
    fetchAreaDetail(areaId).then((d) => { if (!cancelled) setDetail(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, [areaId]);
  return detail;
}
