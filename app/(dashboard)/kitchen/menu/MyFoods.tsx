'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { getErrorMessage } from '../../../lib/errors';
import ImageUpload from '../../../components/ui/ImageUpload';

const CATEGORIES = ['ভাত', 'রুটি', 'মাছ', 'মাংস', 'সবজি', 'ডাল', 'সালাদ', 'পানীয়', 'অন্যান্য'];

export interface OwnFood {
  _id: string;
  name: string;
  category: string;
  image: string;
  isActive: boolean;
}

const emptyForm = { name: '', category: 'ভাত', image: '' };
const inputCls = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';

// কিচেন মালিকের নিজের তৈরি খাবার — অ্যাডমিন লাইব্রেরিতে না থাকলে নিজেই যোগ করা যায়
export default function MyFoods({ onChanged }: { onChanged: () => void }) {
  const [foods, setFoods] = useState<OwnFood[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/kitchen/foods/mine').then((r) => setFoods(r.data.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const startNew = () => { setForm(emptyForm); setEditingId(null); setOpen(true); };
  const startEdit = (f: OwnFood) => { setForm({ name: f.name, category: f.category, image: f.image }); setEditingId(f._id); setOpen(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('খাবারের নাম দিন');
    if (!form.image) return toast.error('খাবারের ছবি আপলোড করুন');
    setSaving(true);
    try {
      if (editingId) await api.patch(`/kitchen/foods/${editingId}`, form);
      else await api.post('/kitchen/foods', form);
      toast.success(editingId ? 'খাবার আপডেট হয়েছে' : 'খাবার যোগ হয়েছে — এখন মেনুতে বাছতে পারবেন');
      setOpen(false);
      await load();
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'সংরক্ষণ ব্যর্থ হয়েছে'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (f: OwnFood) => {
    try {
      await api.patch(`/kitchen/foods/${f._id}`, { isActive: !f.isActive });
      await load();
      onChanged();
    } catch (err) { toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে')); }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h2 className="font-semibold text-stone-700">🧑‍🍳 আমার নিজের খাবার</h2>
        {!open && <button onClick={startNew} className="text-sm text-orange-600 hover:underline">+ নতুন খাবার যোগ করুন</button>}
      </div>
      <p className="text-xs text-stone-500 mb-4">
        অ্যাডমিনের লাইব্রেরিতে নেই এমন খাবার এখানে যোগ করুন। এগুলো শুধু আপনার মেনুতে থাকবে; গ্রাহকের সার্চে অ্যাডমিন লাইব্রেরির খাবারের পরে দেখাবে।
      </p>

      {open && (
        <form onSubmit={save} className="border border-orange-200 bg-orange-50/40 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="খাবারের নাম (যেমন: রহিমার স্পেশাল খিচুড়ি)" className={inputCls} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <ImageUpload label="ছবি" value={form.image} onChange={(url) => setForm({ ...form, image: url })} folder="shokher-kitchen/kitchen-foods" />
          <div className="flex gap-2">
            <button disabled={saving} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
              {saving ? 'সংরক্ষণ হচ্ছে...' : editingId ? 'আপডেট করুন' : 'যোগ করুন'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-500 px-3">বাতিল</button>
          </div>
        </form>
      )}

      {foods.length === 0 ? (
        <p className="text-sm text-stone-400">এখনো নিজের কোনো খাবার যোগ করেননি।</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {foods.map((f) => (
            <div key={f._id} className={`border border-stone-200 rounded-xl overflow-hidden ${f.isActive ? '' : 'opacity-60'}`}>
              <div className="relative w-full h-24"><Image src={f.image} alt={f.name} fill className="object-cover" /></div>
              <div className="p-2">
                <p className="text-sm font-medium text-stone-800 truncate">{f.name}</p>
                <p className="text-[11px] text-stone-500">{f.category}</p>
                <div className="flex justify-between text-xs mt-1">
                  <button onClick={() => startEdit(f)} className="text-blue-600 hover:underline">সম্পাদনা</button>
                  <button onClick={() => toggle(f)} className={f.isActive ? 'text-orange-600 hover:underline' : 'text-green-700 hover:underline'}>
                    {f.isActive ? 'বন্ধ করুন' : 'চালু করুন'}
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
