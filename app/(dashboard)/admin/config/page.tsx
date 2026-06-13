'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

interface ConfigData {
  defaultOrderLimit: number;
  deliveryBaseFee: number;
  deliveryDiscountPercentPerOrder: number;
  maxDeliveryDiscount: number;
  commissionRate: number;
}

const FIELDS: { key: keyof ConfigData; label: string; suffix?: string }[] = [
  { key: 'defaultOrderLimit', label: 'ডিফল্ট অর্ডার লিমিট (প্রতি কিচেন)' },
  { key: 'deliveryBaseFee', label: 'বেস ডেলিভারি চার্জ', suffix: '৳' },
  { key: 'deliveryDiscountPercentPerOrder', label: 'প্রতি অতিরিক্ত অর্ডারে ছাড়', suffix: '%' },
  { key: 'maxDeliveryDiscount', label: 'সর্বোচ্চ ডেলিভারি ছাড়', suffix: '%' },
  { key: 'commissionRate', label: 'অ্যাডমিন কমিশন রেট', suffix: '%' },
];

export default function AdminConfigPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/config').then((r) => setConfig(r.data.data)).catch(() => toast.error('লোড ব্যর্থ হয়েছে')).finally(() => setLoading(false));
  }, []);

  const handleChange = (key: keyof ConfigData, value: number) => {
    setConfig((c) => (c ? { ...c, [key]: value } : c));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      const res = await api.patch('/admin/config', config);
      setConfig(res.data.data);
      toast.success('কনফিগ আপডেট হয়েছে');
    } catch {
      toast.error('আপডেট ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">⚙️ কনফিগ</h1>
      <p className="text-stone-500 mb-8">গ্লোবাল সেটিংস পরিচালনা করুন</p>

      {loading || !config ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4 max-w-lg">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-stone-700 mb-1">{field.label}</label>
              <div className="relative">
                <input
                  type="number"
                  value={config[field.key]}
                  onChange={(e) => handleChange(field.key, Number(e.target.value))}
                  className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  min={0}
                />
                {field.suffix && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">{field.suffix}</span>
                )}
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
        </form>
      )}
    </div>
  );
}
