'use client';
import Loader from '../../../components/ui/Loader';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { getErrorMessage } from '../../../lib/errors';

interface Slab { upToKm: number; fee: number }

interface ConfigData {
  defaultOrderLimit: number;
  deliveryBaseFee: number;
  sameAreaDeliveryFee: number;
  sameThanaDeliveryFee: number;
  deliverySlabs: Slab[];
  deliveryCommissionRate: number;
  roadDistanceFactor: number;
  nearbyRadiusKm: number;
  deliveryDiscountPercentPerOrder: number;
  maxDeliveryDiscount: number;
  commissionRate: number;
}

type NumKey = Exclude<keyof ConfigData, 'deliverySlabs'>;

const GROUPS: { title: string; fields: { key: NumKey; label: string; suffix?: string; step?: number }[] }[] = [
  {
    title: '🚚 ডেলিভারি চার্জ',
    fields: [
      { key: 'sameAreaDeliveryFee', label: 'কিচেন ও গ্রাহক একই এরিয়ায়', suffix: '৳' },
      { key: 'deliveryDiscountPercentPerOrder', label: 'একই বিল্ডিংয়ে প্রতি অতিরিক্ত অর্ডারে ছাড়', suffix: '%' },
      { key: 'maxDeliveryDiscount', label: 'সর্বোচ্চ ডেলিভারি ছাড়', suffix: '%' },
      { key: 'nearbyRadiusKm', label: 'গ্রাহকের ব্রাউজ পেজে ডিফল্ট দূরত্ব', suffix: 'কিমি', step: 0.5 },
    ],
  },
  {
    title: '💰 কমিশন',
    fields: [
      { key: 'commissionRate', label: 'খাবারের দাম থেকে কমিশন', suffix: '%' },
      { key: 'deliveryCommissionRate', label: 'ডেলিভারি চার্জ থেকে কমিশন (ডেলিভারি বয় বা কিচেন — যে-ই দিক)', suffix: '%' },
    ],
  },
  {
    title: '⚙️ অন্যান্য',
    fields: [
      { key: 'defaultOrderLimit', label: 'ডিফল্ট অর্ডার লিমিট (প্রতি কিচেন)' },
      { key: 'roadDistanceFactor', label: 'রাস্তার দূরত্ব না পেলে: সোজা দূরত্ব × কত', suffix: '×', step: 0.05 },
      { key: 'sameThanaDeliveryFee', label: 'এরিয়ার লোকেশন না থাকলে — একই থানার চার্জ', suffix: '৳' },
      { key: 'deliveryBaseFee', label: 'এরিয়ার লোকেশন না থাকলে — অন্য থানার চার্জ', suffix: '৳' },
    ],
  },
];

const inputCls = 'w-full border border-stone-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400';

export default function AdminConfigPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/config').then((r) => setConfig(r.data.data)).catch(() => toast.error('লোড ব্যর্থ হয়েছে')).finally(() => setLoading(false));
  }, []);

  const setNum = (key: NumKey, value: number) => setConfig((c) => (c ? { ...c, [key]: value } : c));
  const setSlab = (i: number, k: keyof Slab, v: number) =>
    setConfig((c) => (c ? { ...c, deliverySlabs: c.deliverySlabs.map((x, j) => (j === i ? { ...x, [k]: v } : x)) } : c));
  const addSlab = () => setConfig((c) => {
    if (!c) return c;
    const last = c.deliverySlabs[c.deliverySlabs.length - 1];
    return { ...c, deliverySlabs: [...c.deliverySlabs, { upToKm: (last?.upToKm ?? 0) + 1, fee: (last?.fee ?? c.sameAreaDeliveryFee) + 5 }] };
  });
  const removeSlab = (i: number) => setConfig((c) => (c ? { ...c, deliverySlabs: c.deliverySlabs.filter((_, j) => j !== i) } : c));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      const res = await api.patch('/admin/config', config);
      setConfig(res.data.data);
      toast.success('কনফিগ আপডেট হয়েছে');
    } catch (err) {
      toast.error(getErrorMessage(err, 'আপডেট ব্যর্থ হয়েছে'));
    } finally {
      setSaving(false);
    }
  };

  const slabs = config?.deliverySlabs ?? [];
  const maxKm = slabs.length ? Math.max(...slabs.map((s) => s.upToKm)) : 0;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-stone-800 mb-1">⚙️ কনফিগ</h1>
      <p className="text-sm text-stone-500 mb-6">গ্লোবাল সেটিংস পরিচালনা করুন</p>

      {loading || !config ? (
        <Loader />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <h2 className="font-semibold text-stone-800 mb-1">📏 এরিয়ার বাইরে ডেলিভারি চার্জ (রাস্তার দূরত্বের ধাপ)</h2>
            <p className="text-xs text-stone-500 mb-4">
              কিচেন আর গ্রাহকের ম্যাপ পিন (না থাকলে এরিয়ার কেন্দ্র) থেকে রাস্তার দূরত্ব মেপে চার্জ ঠিক হয়।
              শেষ ধাপের দূরত্বই সর্বোচ্চ — এখন <b>{maxKm} কিমি</b>, এর বেশি দূরে অর্ডার হবে না।
            </p>
            <div className="space-y-2">
              {slabs.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-stone-600 shrink-0 w-16">{i === 0 ? 'শুরু' : `${slabs[i - 1].upToKm} কিমি`} →</span>
                  <div className="relative flex-1">
                    <input type="number" step={0.5} min={0.5} value={s.upToKm} onChange={(e) => setSlab(i, 'upToKm', Number(e.target.value))} className={inputCls} aria-label="কত কিমি পর্যন্ত" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">কিমি</span>
                  </div>
                  <div className="relative flex-1">
                    <input type="number" min={0} value={s.fee} onChange={(e) => setSlab(i, 'fee', Number(e.target.value))} className={inputCls} aria-label="চার্জ" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">৳</span>
                  </div>
                  <button type="button" onClick={() => removeSlab(i)} disabled={slabs.length === 1} className="text-red-500 text-sm px-2 py-2 disabled:opacity-30" aria-label="ধাপ মুছুন">✕</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addSlab} className="mt-3 text-sm text-purple-700 hover:underline">+ ধাপ যোগ করুন</button>
          </div>

          {GROUPS.map((g) => (
            <div key={g.title} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-stone-800">{g.title}</h2>
              {g.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-stone-700 mb-1">{field.label}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step={field.step ?? 1}
                      value={config[field.key] ?? ''}
                      onChange={(e) => setNum(field.key, Number(e.target.value))}
                      className={inputCls}
                      min={0}
                    />
                    {field.suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">{field.suffix}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
        </form>
      )}
    </div>
  );
}
