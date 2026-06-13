'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import ImageUpload from '../../../components/ui/ImageUpload';

type FoodCategory = 'ভাত' | 'রুটি' | 'মাছ' | 'মাংস' | 'সবজি' | 'ডাল' | 'সালাদ' | 'পানীয়' | 'অন্যান্য';

interface FoodItem {
  _id: string;
  name: string;
  image: string;
  category: FoodCategory;
  isActive: boolean;
}

const CATEGORIES: FoodCategory[] = ['ভাত', 'রুটি', 'মাছ', 'মাংস', 'সবজি', 'ডাল', 'সালাদ', 'পানীয়', 'অন্যান্য'];

const emptyForm = { name: '', category: 'ভাত' as FoodCategory, image: '' };

export default function AdminFoodsPage() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const loadFoods = () => {
    api.get('/admin/foods').then((r) => setFoods(r.data.data)).catch(() => toast.error('লোড ব্যর্থ হয়েছে')).finally(() => setLoading(false));
  };

  useEffect(() => { loadFoods(); }, []);

  const filteredFoods = foods.filter((item) => {
    if (filter === 'active') return item.isActive;
    if (filter === 'inactive') return !item.isActive;
    return true;
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('নাম দিন');
    if (!form.image) return toast.error('ছবি আপলোড করুন');

    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/admin/foods/${editingId}`, form);
        toast.success('আপডেট হয়েছে');
      } else {
        await api.post('/admin/foods', form);
        toast.success('খাবার যোগ করা হয়েছে');
      }
      resetForm();
      loadFoods();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: FoodItem) => {
    setEditingId(item._id);
    setForm({ name: item.name, category: item.category, image: item.image });
    setShowForm(true);
  };

  const toggleActive = async (item: FoodItem) => {
    try {
      if (item.isActive) {
        await api.delete(`/admin/foods/${item._id}`);
      } else {
        await api.patch(`/admin/foods/${item._id}`, { isActive: true });
      }
      loadFoods();
    } catch {
      toast.error('আপডেট ব্যর্থ হয়েছে');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 mb-1">🍽️ খাবার লাইব্রেরি</h1>
          <p className="text-stone-500">মাস্টার খাবার তালিকা পরিচালনা করুন</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm((s) => !s); }}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-xl transition"
        >
          {showForm ? 'বাতিল' : '+ নতুন খাবার'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm mb-6 space-y-4">
          <h2 className="font-semibold text-stone-700">{editingId ? 'খাবার সম্পাদনা' : 'নতুন খাবার যোগ করুন'}</h2>

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

          <ImageUpload
            label="ছবি"
            value={form.image}
            onChange={(url) => setForm((f) => ({ ...f, image: url }))}
            folder="amar-kitchen/foods"
          />

          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : editingId ? 'আপডেট করুন' : 'যোগ করুন'}
          </button>
        </form>
      )}

      <div className="flex items-center gap-2 mb-4">
        {([
          { key: 'all', label: 'সব' },
          { key: 'active', label: 'সক্রিয়' },
          { key: 'inactive', label: 'নিষ্ক্রিয়' },
        ] as const).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
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
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : filteredFoods.length === 0 ? (
        <p className="text-stone-500">কোনো খাবার নেই।</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFoods.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="relative w-full h-32">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
              <div className="p-3">
                <p className="font-medium text-stone-700">{item.name}</p>
                <p className="text-xs text-stone-500 mb-2">{item.category}</p>
                <div className="flex items-center justify-between text-sm">
                  <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline">সম্পাদনা</button>
                  <button
                    onClick={() => toggleActive(item)}
                    className={item.isActive ? 'text-green-600 hover:underline' : 'text-stone-400 hover:underline'}
                  >
                    {item.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয় (চালু করুন)'}
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
