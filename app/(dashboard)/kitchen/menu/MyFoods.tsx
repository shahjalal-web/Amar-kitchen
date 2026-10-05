'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { getErrorMessage } from '../../../lib/errors';
import { FoodImage, foodImages } from '../../../lib/foodImages';
import MultiImageUpload, { discardUnsaved } from '../../../components/ui/MultiImageUpload';
import { FoodPreview, FoodThumb } from '../../../components/shared/FoodViewer';

const CATEGORIES = ['ভাত', 'রুটি', 'মাছ', 'মাংস', 'সবজি', 'ডাল', 'সালাদ', 'পানীয়', 'অন্যান্য'];

export interface OwnFood {
  _id: string;
  name: string;
  category: string;
  image: string;
  images?: FoodImage[];
  isActive: boolean;
}

const emptyForm = { name: '', category: 'ভাত', images: [] as FoodImage[] };
const inputCls = 'w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';

// কিচেন মালিকের নিজের তৈরি খাবার — অ্যাডমিন লাইব্রেরিতে না থাকলে নিজেই যোগ করা যায়
export default function MyFoods({ onChanged }: { onChanged: () => void }) {
  const [foods, setFoods] = useState<OwnFood[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OwnFood | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/kitchen/foods/mine').then((r) => setFoods(r.data.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const close = (saved = false) => {
    if (!saved) discardUnsaved(form.images, editing ? foodImages(editing) : []);
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };
  const startNew = () => { setForm(emptyForm); setEditing(null); setOpen(true); };
  const startEdit = (f: OwnFood) => {
    if (open) discardUnsaved(form.images, editing ? foodImages(editing) : []);
    setForm({ name: f.name, category: f.category, images: foodImages(f) });
    setEditing(f);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('খাবারের নাম দিন');
    if (!form.images.length) return toast.error('অন্তত একটি ছবি দিন');
    setSaving(true);
    try {
      if (editing) await api.patch(`/kitchen/foods/${editing._id}`, form);
      else await api.post('/kitchen/foods', form);
      toast.success(editing ? 'খাবার আপডেট হয়েছে' : 'খাবার যোগ হয়েছে — এখন মেনুতে বাছতে পারবেন');
      close(true);
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

  const remove = async (f: OwnFood) => {
    if (!confirm(`"${f.name}" স্থায়ীভাবে মুছে ফেলবেন? এর সব ছবিও মুছে যাবে।`)) return;
    try {
      const res = await api.delete(`/kitchen/foods/${f._id}`);
      toast.success(res.data.message);
      await load();
      onChanged();
    } catch (err) { toast.error(getErrorMessage(err, 'মুছে ফেলা যায়নি')); }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h2 className="font-semibold text-stone-700">🧑‍🍳 আমার নিজের খাবার</h2>
        {!open && <button onClick={startNew} className="text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg">+ নতুন খাবার</button>}
      </div>
      <p className="text-xs text-stone-500 mb-4">
        অ্যাডমিনের লাইব্রেরিতে নেই এমন খাবার এখানে যোগ করুন। এগুলো শুধু আপনার মেনুতে থাকবে; গ্রাহকের সার্চে অ্যাডমিন লাইব্রেরির খাবারের পরে দেখাবে।
      </p>

      {open && (
        <form onSubmit={save} className="border border-orange-200 bg-orange-50/40 rounded-xl p-3 sm:p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="খাবারের নাম (যেমন: রহিমার স্পেশাল খিচুড়ি)" className={inputCls} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <MultiImageUpload label="ছবি (একাধিক দেওয়া যায়)" value={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} folder="shokher-kitchen/kitchen-foods" />
          <div className="flex gap-2">
            <button disabled={saving} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
              {saving ? 'সংরক্ষণ হচ্ছে...' : editing ? 'আপডেট করুন' : 'যোগ করুন'}
            </button>
            <button type="button" onClick={() => close()} className="text-sm text-stone-500 px-3">বাতিল</button>
          </div>
        </form>
      )}

      {foods.length === 0 ? (
        <p className="text-sm text-stone-400">এখনো নিজের কোনো খাবার যোগ করেননি।</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {foods.map((f) => (
            <div key={f._id} className={`border border-stone-200 rounded-xl overflow-hidden flex flex-col ${f.isActive ? '' : 'opacity-60'}`}>
              <FoodPreview food={{ ...f, source: 'kitchen' }} className="block w-full rounded-none">
                <FoodThumb food={f} className="w-full h-32 sm:h-36" sizes="(max-width: 640px) 50vw, 240px" />
              </FoodPreview>
              <div className="p-2.5 flex-1 flex flex-col">
                <p className="text-[15px] font-semibold text-stone-800 leading-snug">{f.name}</p>
                <p className="text-xs text-stone-500 mb-2">{f.category}{!f.isActive && ' · বন্ধ'}</p>
                <div className="mt-auto grid grid-cols-3 gap-1 text-xs">
                  <button onClick={() => startEdit(f)} className="py-1.5 rounded-lg bg-blue-50 text-blue-700">সম্পাদনা</button>
                  <button onClick={() => toggle(f)} className={`py-1.5 rounded-lg ${f.isActive ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                    {f.isActive ? 'বন্ধ' : 'চালু'}
                  </button>
                  <button onClick={() => remove(f)} className="py-1.5 rounded-lg bg-red-50 text-red-600">মুছুন</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
