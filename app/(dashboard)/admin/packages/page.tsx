'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

type PackageTier = 'economy' | 'standard' | 'premium';

interface FoodItem {
  _id: string;
  name: string;
  category: string;
  isActive: boolean;
}

interface PackageItem {
  foodItem: FoodItem | string;
  quantity: number;
}

interface PackageData {
  _id: string;
  name: string;
  tier: PackageTier;
  items: PackageItem[];
  basePrice: number;
  isActive: boolean;
}

const TIERS: { value: PackageTier; label: string }[] = [
  { value: 'economy', label: 'ইকোনমি' },
  { value: 'standard', label: 'স্ট্যান্ডার্ড' },
  { value: 'premium', label: 'প্রিমিয়াম' },
];

const emptyForm = {
  name: '',
  tier: 'standard' as PackageTier,
  basePrice: 0,
  items: [] as { foodItem: string; quantity: number }[],
};

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    Promise.all([
      api.get('/admin/packages'),
      api.get('/admin/foods'),
    ])
      .then(([pkgRes, foodRes]) => {
        setPackages(pkgRes.data.data);
        setFoods((foodRes.data.data as FoodItem[]).filter((f) => f.isActive));
      })
      .catch(() => toast.error('লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const addItemRow = () => {
    if (foods.length === 0) return toast.error('আগে খাবার লাইব্রেরিতে আইটেম যোগ করুন');
    setForm((f) => ({ ...f, items: [...f.items, { foodItem: foods[0]._id, quantity: 1 }] }));
  };

  const updateItemRow = (idx: number, field: 'foodItem' | 'quantity', value: string | number) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    }));
  };

  const removeItemRow = (idx: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('নাম দিন');
    if (form.items.length === 0) return toast.error('অন্তত একটি আইটেম যোগ করুন');
    if (form.basePrice <= 0) return toast.error('মূল্য দিন');

    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/admin/packages/${editingId}`, form);
        toast.success('আপডেট হয়েছে');
      } else {
        await api.post('/admin/packages', form);
        toast.success('প্যাকেজ তৈরি হয়েছে');
      }
      resetForm();
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pkg: PackageData) => {
    setEditingId(pkg._id);
    setForm({
      name: pkg.name,
      tier: pkg.tier,
      basePrice: pkg.basePrice,
      items: pkg.items.map((it) => ({
        foodItem: typeof it.foodItem === 'string' ? it.foodItem : it.foodItem._id,
        quantity: it.quantity,
      })),
    });
    setShowForm(true);
  };

  const toggleActive = async (pkg: PackageData) => {
    try {
      await api.patch(`/admin/packages/${pkg._id}`, { isActive: !pkg.isActive });
      loadData();
    } catch {
      toast.error('আপডেট ব্যর্থ হয়েছে');
    }
  };

  const tierLabel = (tier: PackageTier) => TIERS.find((t) => t.value === tier)?.label || tier;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 mb-1">📦 প্যাকেজ ম্যানেজ</h1>
          <p className="text-stone-500">কিচেন ওনারদের জন্য প্যাকেজ টেমপ্লেট তৈরি করুন</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm((s) => !s); }}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-xl transition"
        >
          {showForm ? 'বাতিল' : '+ নতুন প্যাকেজ'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm mb-6 space-y-4">
          <h2 className="font-semibold text-stone-700">{editingId ? 'প্যাকেজ সম্পাদনা' : 'নতুন প্যাকেজ'}</h2>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">নাম</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="যেমন: রেগুলার মিল"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">টায়ার</label>
              <select
                value={form.tier}
                onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as PackageTier }))}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">বেস মূল্য (৳)</label>
              <input
                type="number"
                value={form.basePrice}
                onChange={(e) => setForm((f) => ({ ...f, basePrice: Number(e.target.value) }))}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
                min={0}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-stone-700">আইটেমসমূহ</label>
              <button type="button" onClick={addItemRow} className="text-sm text-green-600 hover:underline">+ আইটেম যোগ করুন</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={item.foodItem}
                    onChange={(e) => updateItemRow(idx, 'foodItem', e.target.value)}
                    className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    {foods.map((f) => <option key={f._id} value={f._id}>{f.name} ({f.category})</option>)}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItemRow(idx, 'quantity', Number(e.target.value))}
                    className="w-20 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button type="button" onClick={() => removeItemRow(idx)} className="text-red-500 text-sm hover:underline">মুছুন</button>
                </div>
              ))}
              {form.items.length === 0 && <p className="text-sm text-stone-400">কোনো আইটেম নেই</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : editingId ? 'আপডেট করুন' : 'তৈরি করুন'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : packages.length === 0 ? (
        <p className="text-stone-500">কোনো প্যাকেজ নেই। নতুন তৈরি করুন।</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg._id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-stone-700">{pkg.name}</p>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{tierLabel(pkg.tier)}</span>
              </div>
              <p className="text-xl font-bold text-orange-600 mb-2">৳{pkg.basePrice}</p>
              <ul className="text-sm text-stone-600 space-y-0.5 mb-3">
                {pkg.items.map((it, i) => {
                  const food = typeof it.foodItem === 'string' ? null : it.foodItem;
                  return <li key={i}>• {food?.name || '—'} × {it.quantity}</li>;
                })}
              </ul>
              <div className="flex items-center justify-between text-sm">
                <button onClick={() => handleEdit(pkg)} className="text-blue-600 hover:underline">সম্পাদনা</button>
                <button onClick={() => toggleActive(pkg)} className={pkg.isActive ? 'text-green-600' : 'text-stone-400'}>
                  {pkg.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয় (চালু করুন)'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
