'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

interface FoodItem {
  _id: string;
  name: string;
  category: string;
}

interface MenuItem {
  foodItem: FoodItem | string;
  price: number;
  isFree: boolean;
}

interface DailyMenu {
  _id: string;
  date: string;
  items: MenuItem[];
  freeItems: (FoodItem | string)[];
  isPublished: boolean;
  isReadyForPickup: boolean;
}

const emptyForm = {
  items: [] as { foodItem: string; price: number }[],
  freeItems: [] as string[],
};

export default function KitchenMenuPage() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [menu, setMenu] = useState<DailyMenu | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);

  const loadData = () => {
    Promise.all([
      api.get('/kitchen/foods'),
      api.get('/kitchen/menu/mine'),
    ])
      .then(([foodRes, menuRes]) => {
        const foodList = foodRes.data.data as FoodItem[];
        setFoods(foodList);

        const m = menuRes.data.data as DailyMenu | null;
        setMenu(m);
        if (m) {
          setForm({
            items: m.items.map((it) => ({
              foodItem: typeof it.foodItem === 'string' ? it.foodItem : it.foodItem._id,
              price: it.price,
            })),
            freeItems: m.freeItems.map((f) => (typeof f === 'string' ? f : f._id)),
          });
        }
      })
      .catch(() => toast.error('লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const addItemRow = () => {
    if (foods.length === 0) return toast.error('কোনো সক্রিয় খাবার নেই');
    setForm((f) => ({ ...f, items: [...f.items, { foodItem: foods[0]._id, price: 0 }] }));
  };

  const updateItemRow = (idx: number, field: 'foodItem' | 'price', value: string | number) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    }));
  };

  const removeItemRow = (idx: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const toggleFreeItem = (foodId: string) => {
    setForm((f) => ({
      ...f,
      freeItems: f.freeItems.includes(foodId)
        ? f.freeItems.filter((id) => id !== foodId)
        : [...f.freeItems, foodId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.items.length === 0) return toast.error('অন্তত একটি আইটেম যোগ করুন');
    if (form.items.some((it) => it.price <= 0)) return toast.error('সব আইটেমের মূল্য দিন');

    setSaving(true);
    try {
      const res = await api.post('/kitchen/menu', form);
      setMenu(res.data.data);
      toast.success('আজকের মেনু সেট করা হয়েছে');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleReady = async () => {
    setMarkingReady(true);
    try {
      const res = await api.patch('/kitchen/menu/ready');
      setMenu(res.data.data);
      toast.success('ডেলিভারি বয়কে সিগন্যাল পাঠানো হয়েছে');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'ব্যর্থ হয়েছে');
    } finally {
      setMarkingReady(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 mb-1">🍱 আজকের মেনু</h1>
          <p className="text-stone-500">আজকের জন্য খাবারের তালিকা ও মূল্য সেট করুন</p>
        </div>
        {menu && (
          <button
            onClick={handleReady}
            disabled={markingReady || menu.isReadyForPickup}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl transition"
          >
            {menu.isReadyForPickup ? '✅ পিকআপের জন্য প্রস্তুত' : markingReady ? 'পাঠানো হচ্ছে...' : 'পিকআপের জন্য প্রস্তুত করুন'}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : foods.length === 0 ? (
        <p className="text-stone-500">খাবার লাইব্রেরিতে কোনো সক্রিয় খাবার নেই। অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-stone-700">আজকের আইটেম ও মূল্য</label>
              <button type="button" onClick={addItemRow} className="text-sm text-orange-600 hover:underline">+ আইটেম যোগ করুন</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={item.foodItem}
                    onChange={(e) => updateItemRow(idx, 'foodItem', e.target.value)}
                    className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    {foods.map((f) => <option key={f._id} value={f._id}>{f.name} ({f.category})</option>)}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={item.price}
                    onChange={(e) => updateItemRow(idx, 'price', Number(e.target.value))}
                    placeholder="মূল্য"
                    className="w-24 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <button type="button" onClick={() => removeItemRow(idx)} className="text-red-500 text-sm hover:underline">মুছুন</button>
                </div>
              ))}
              {form.items.length === 0 && <p className="text-sm text-stone-400">কোনো আইটেম নেই</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">ফ্রি আইটেম (ঐচ্ছিক)</label>
            <div className="flex flex-wrap gap-2">
              {foods.map((f) => (
                <button
                  key={f._id}
                  type="button"
                  onClick={() => toggleFreeItem(f._id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    form.freeItems.includes(f._id)
                      ? 'bg-green-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'মেনু সংরক্ষণ করুন'}
          </button>
        </form>
      )}
    </div>
  );
}
