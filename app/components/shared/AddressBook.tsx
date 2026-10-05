'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { getErrorMessage } from '../../lib/errors';
import { AreaDetail, areaLabel } from '../../lib/locations';
import LocationPicker from './LocationPicker';

export interface SavedAddress {
  _id: string;
  label: string;
  areaId: AreaDetail;   // populated
  buildingName: string;
  addressLine: string;
  phone?: string;
  isDefault: boolean;
}

interface AddressForm {
  label: string;
  areaId: string;
  buildingName: string;
  addressLine: string;
  phone: string;
}

const EMPTY: AddressForm = { label: 'বাসা', areaId: '', buildingName: '', addressLine: '', phone: '' };
const inputCls = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400';

export const formatAddress = (a: SavedAddress) =>
  `${a.buildingName}, ${a.addressLine}, ${a.areaId ? areaLabel(a.areaId) : ''}`;

export async function loadAddresses(): Promise<SavedAddress[]> {
  const r = await api.get('/auth/addresses');
  return r.data.data;
}

// ─── ঠিকানা ফর্ম (নতুন/সম্পাদনা) ─────────────────────────
export function AddressFormFields({ value, onChange }: { value: AddressForm; onChange: (v: AddressForm) => void }) {
  const set = (k: keyof AddressForm, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3">
      <LocationPicker value={value.areaId} onChange={(id) => set('areaId', id)} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={value.buildingName} onChange={(e) => set('buildingName', e.target.value)} placeholder="বিল্ডিং/বাসার নাম" className={inputCls} />
        <input value={value.addressLine} onChange={(e) => set('addressLine', e.target.value)} placeholder="বাসা/রোড/ফ্ল্যাট নম্বর" className={inputCls} />
        <input value={value.label} onChange={(e) => set('label', e.target.value)} placeholder="লেবেল (যেমন: বাসা, অফিস)" className={inputCls} />
        <input value={value.phone} onChange={(e) => set('phone', e.target.value)} placeholder="যোগাযোগ নম্বর (ঐচ্ছিক)" className={inputCls} />
      </div>
    </div>
  );
}

export const emptyAddressForm = () => ({ ...EMPTY });

export const validateAddressForm = (f: AddressForm) => {
  if (!f.areaId) return 'শহর, থানা ও এরিয়া নির্বাচন করুন';
  if (!f.buildingName.trim() || !f.addressLine.trim()) return 'বিল্ডিংয়ের নাম ও বিস্তারিত ঠিকানা দিন';
  return null;
};

// ─── পূর্ণ ঠিকানা বই (প্রোফাইল পেজ) ───────────────────────
export default function AddressBook({ onChanged }: { onChanged?: (list: SavedAddress[]) => void }) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const apply = (list: SavedAddress[]) => { setAddresses(list); onChanged?.(list); };

  useEffect(() => {
    loadAddresses().then(apply).catch(() => toast.error('ঠিকানা লোড ব্যর্থ হয়েছে')).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNew = () => { setForm(EMPTY); setEditingId('new'); };
  const startEdit = (a: SavedAddress) => {
    setForm({ label: a.label, areaId: a.areaId?._id ?? '', buildingName: a.buildingName, addressLine: a.addressLine, phone: a.phone ?? '' });
    setEditingId(a._id);
  };

  const save = async () => {
    const err = validateAddressForm(form);
    if (err) return toast.error(err);
    setSaving(true);
    try {
      if (editingId === 'new') {
        const res = await api.post('/auth/addresses', form);
        apply(res.data.data.addresses);
      } else {
        const res = await api.patch(`/auth/addresses/${editingId}`, form);
        apply(res.data.data);
      }
      toast.success('ঠিকানা সেভ হয়েছে');
      setEditingId(null);
    } catch (e) {
      toast.error(getErrorMessage(e, 'সেভ ব্যর্থ হয়েছে'));
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (id: string) => {
    try {
      const res = await api.patch(`/auth/addresses/${id}`, { isDefault: true });
      apply(res.data.data);
    } catch (e) { toast.error(getErrorMessage(e, 'ব্যর্থ হয়েছে')); }
  };

  const remove = async (id: string) => {
    if (!confirm('ঠিকানাটি মুছে ফেলবেন?')) return;
    try {
      const res = await api.delete(`/auth/addresses/${id}`);
      apply(res.data.data);
    } catch (e) { toast.error(getErrorMessage(e, 'ব্যর্থ হয়েছে')); }
  };

  if (loading) return <p className="text-sm text-stone-500">লোড হচ্ছে...</p>;

  return (
    <div className="space-y-3">
      {addresses.length === 0 && editingId !== 'new' && <p className="text-sm text-stone-500">কোনো ঠিকানা সেভ করা নেই।</p>}

      {addresses.map((a) => (
        <div key={a._id} className="border border-stone-200 rounded-xl p-3">
          {editingId === a._id ? (
            <>
              <AddressFormFields value={form} onChange={setForm} />
              <div className="flex gap-2 mt-3">
                <button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">সেভ</button>
                <button onClick={() => setEditingId(null)} className="text-sm text-stone-500 px-3">বাতিল</button>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-stone-800 text-sm">
                  {a.label} {a.isDefault && <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">ডিফল্ট</span>}
                </p>
                <p className="text-sm text-stone-600">{formatAddress(a)}</p>
                {a.phone && <p className="text-xs text-stone-400">📞 {a.phone}</p>}
              </div>
              <div className="flex gap-3 text-sm">
                {!a.isDefault && <button onClick={() => makeDefault(a._id)} className="text-green-700 hover:underline">ডিফল্ট করুন</button>}
                <button onClick={() => startEdit(a)} className="text-purple-600 hover:underline">সম্পাদনা</button>
                <button onClick={() => remove(a._id)} className="text-red-500 hover:underline">মুছুন</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {editingId === 'new' ? (
        <div className="border border-dashed border-green-300 rounded-xl p-3">
          <AddressFormFields value={form} onChange={setForm} />
          <div className="flex gap-2 mt-3">
            <button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">সেভ</button>
            <button onClick={() => setEditingId(null)} className="text-sm text-stone-500 px-3">বাতিল</button>
          </div>
        </div>
      ) : (
        addresses.length < 10 && (
          <button onClick={startNew} className="text-sm font-medium text-green-700 hover:underline">+ নতুন ঠিকানা যোগ করুন</button>
        )
      )}
    </div>
  );
}
