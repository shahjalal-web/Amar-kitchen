'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { getErrorMessage } from '../../../lib/errors';
import { FoodImage, foodImages } from '../../../lib/foodImages';
import MultiImageUpload, { discardUnsaved } from '../../../components/ui/MultiImageUpload';
import { FoodPreview, FoodThumb } from '../../../components/shared/FoodViewer';
import Loader from '../../../components/ui/Loader';

type FoodCategory = 'ভাত' | 'রুটি' | 'মাছ' | 'মাংস' | 'সবজি' | 'ডাল' | 'সালাদ' | 'পানীয়' | 'অন্যান্য';

interface FoodItem {
  _id: string;
  name: string;
  image: string;
  images?: FoodImage[];
  imageCredit?: string;
  category: FoodCategory;
  isActive: boolean;
  source?: 'admin' | 'kitchen';
  kitchen?: { _id: string; name: string; kitchenName?: string } | null;
}

const CATEGORIES: FoodCategory[] = ['ভাত', 'রুটি', 'মাছ', 'মাংস', 'সবজি', 'ডাল', 'সালাদ', 'পানীয়', 'অন্যান্য'];

const emptyForm = { name: '', category: 'ভাত' as FoodCategory, images: [] as FoodImage[] };

export default function AdminFoodsPage() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'admin' | 'kitchen'>('all');
  const [q, setQ] = useState('');

  const loadFoods = () =>
    api.get('/admin/foods').then((r) => setFoods(r.data.data)).catch(() => toast.error('লোড ব্যর্থ হয়েছে')).finally(() => setLoading(false));

  useEffect(() => { loadFoods(); }, []);

  const filteredFoods = foods.filter((item) => {
    if (q.trim() && !item.name.includes(q.trim()) && !item.category.includes(q.trim())) return false;
    if (filter === 'active') return item.isActive;
    if (filter === 'inactive') return !item.isActive;
    if (filter === 'admin') return item.source !== 'kitchen';
    if (filter === 'kitchen') return item.source === 'kitchen';
    return true;
  });

  const closeForm = (saved = false) => {
    if (!saved) discardUnsaved(form.images, editing ? foodImages(editing) : []);
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('নাম দিন');
    if (!form.images.length) return toast.error('অন্তত একটি ছবি দিন');

    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/admin/foods/${editing._id}`, form);
        toast.success('আপডেট হয়েছে');
      } else {
        await api.post('/admin/foods', form);
        toast.success('খাবার যোগ করা হয়েছে');
      }
      closeForm(true);
      loadFoods();
    } catch (err) {
      toast.error(getErrorMessage(err, 'সংরক্ষণ ব্যর্থ হয়েছে'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: FoodItem) => {
    if (showForm) discardUnsaved(form.images, editing ? foodImages(editing) : []);
    setEditing(item);
    setForm({ name: item.name, category: item.category, images: foodImages(item) });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleActive = async (item: FoodItem) => {
    setBusyId(item._id);
    try {
      await api.patch(`/admin/foods/${item._id}`, { isActive: !item.isActive });
      await loadFoods();
    } catch (err) {
      toast.error(getErrorMessage(err, 'আপডেট ব্যর্থ হয়েছে'));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: FoodItem) => {
    if (!confirm(`"${item.name}" স্থায়ীভাবে মুছে ফেলবেন? এর সব ছবিও মুছে যাবে।`)) return;
    setBusyId(item._id);
    try {
      const res = await api.delete(`/admin/foods/${item._id}`);
      toast.success(res.data.message);
      await loadFoods();
    } catch (err) {
      toast.error(getErrorMessage(err, 'মুছে ফেলা যায়নি'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-800 mb-1">🍽️ খাবার লাইব্রেরি</h1>
          <p className="text-sm text-stone-500">মাস্টার খাবার তালিকা পরিচালনা করুন</p>
        </div>
        <button
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2.5 rounded-xl transition"
        >
          {showForm ? 'বাতিল' : '+ নতুন খাবার'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm mb-6 space-y-4">
          <h2 className="font-semibold text-stone-700">{editing ? 'খাবার সম্পাদনা' : 'নতুন খাবার যোগ করুন'}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">নাম</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="যেমন: ভাত, মুরগির মাংস"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">ক্যাটাগরি</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as FoodCategory }))}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <MultiImageUpload
            label="ছবি (একাধিক)"
            value={form.images}
            onChange={(images) => setForm((f) => ({ ...f, images }))}
            folder="shokher-kitchen/foods"
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : editing ? 'আপডেট করুন' : 'যোগ করুন'}
          </button>
        </form>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 নাম বা ক্যাটাগরি দিয়ে খুঁজুন"
        className="w-full sm:max-w-sm border border-stone-300 rounded-xl px-4 py-2.5 mb-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
      />

      <div className="flex gap-2 mb-4 overflow-x-auto sk-no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {([
          { key: 'all', label: 'সব' },
          { key: 'active', label: 'সক্রিয়' },
          { key: 'inactive', label: 'বন্ধ' },
          { key: 'admin', label: '🛡️ অ্যাডমিন লাইব্রেরি' },
          { key: 'kitchen', label: '🧑‍🍳 কিচেনের তৈরি' },
        ] as const).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === opt.key
                ? 'bg-orange-500 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader label="খাবার আনা হচ্ছে…" />
      ) : filteredFoods.length === 0 ? (
        <p className="text-stone-500">কোনো খাবার নেই।</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredFoods.map((item) => (
            <div key={item._id} className={`bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col ${item.isActive ? '' : 'opacity-60'}`}>
              <FoodPreview food={item} className="block w-full rounded-none" subtitle={item.source === 'kitchen' ? `🧑‍🍳 ${item.kitchen?.kitchenName || item.kitchen?.name || 'কিচেন'}` : '🛡️ অ্যাডমিন লাইব্রেরি'}>
                <span className="relative block">
                  <FoodThumb food={item} className="w-full h-36 sm:h-44 rounded-none" sizes="(max-width: 640px) 50vw, 280px" />
                  <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full ${item.source === 'kitchen' ? 'bg-orange-500 text-white' : 'bg-white/90 text-stone-700'}`}>
                    {item.source === 'kitchen' ? `🧑‍🍳 ${item.kitchen?.kitchenName || item.kitchen?.name || 'কিচেন'}` : '🛡️ অ্যাডমিন'}
                  </span>
                </span>
              </FoodPreview>
              <div className="p-3 flex-1 flex flex-col">
                <p className="font-semibold text-stone-800 text-base leading-snug">{item.name}</p>
                <p className="text-sm text-stone-500 mb-3">{item.category}{!item.isActive && ' · বন্ধ'}</p>
                <div className="mt-auto grid grid-cols-3 gap-1 text-xs sm:text-sm">
                  <button onClick={() => handleEdit(item)} className="py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">সম্পাদনা</button>
                  <button
                    onClick={() => toggleActive(item)}
                    disabled={busyId === item._id}
                    className={`py-1.5 rounded-lg disabled:opacity-50 ${item.isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                  >
                    {item.isActive ? 'বন্ধ করুন' : 'চালু করুন'}
                  </button>
                  <button onClick={() => remove(item)} disabled={busyId === item._id} className="py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">
                    মুছুন
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
