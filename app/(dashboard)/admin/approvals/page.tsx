'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

interface PendingUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'kitchen' | 'delivery';
  kitchenName?: string;
  kitchenDescription?: string;
  nidNumber?: string;
  nidImage?: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  kitchen: '👩‍🍳 কিচেন ওনার',
  delivery: '🛵 ডেলিভারি বয়',
};

type FilterStatus = 'pending' | 'approved' | 'rejected' | 'all';

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'pending', label: 'পেন্ডিং' },
  { value: 'approved', label: 'অ্যাপ্রুভড' },
  { value: 'rejected', label: 'প্রত্যাখ্যাত' },
  { value: 'all', label: 'সব' },
];

const EMPTY_MESSAGE: Record<FilterStatus, string> = {
  pending: 'কোনো পেন্ডিং আবেদন নেই।',
  approved: 'কোনো অ্যাপ্রুভড ব্যবহারকারী নেই।',
  rejected: 'কোনো প্রত্যাখ্যাত আবেদন নেই।',
  all: 'কোনো আবেদন নেই।',
};

const getStatus = (u: PendingUser): 'pending' | 'approved' | 'rejected' => {
  if (!u.isActive) return 'rejected';
  return u.isApproved ? 'approved' : 'pending';
};

const STATUS_BADGE: Record<'pending' | 'approved' | 'rejected', string> = {
  pending: 'bg-amber-50 text-amber-600',
  approved: 'bg-green-50 text-green-600',
  rejected: 'bg-red-50 text-red-600',
};

const STATUS_LABEL: Record<'pending' | 'approved' | 'rejected', string> = {
  pending: '⏳ পেন্ডিং',
  approved: '✅ অ্যাপ্রুভড',
  rejected: '❌ প্রত্যাখ্যাত',
};

export default function AdminApprovalsPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('pending');

  const loadUsers = (status: FilterStatus) => {
    setLoading(true);
    api.get('/admin/approvals', { params: { status } })
      .then((r) => setUsers(r.data.data))
      .catch(() => toast.error('লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(filter); }, [filter]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await api.patch(`/admin/approvals/${id}/approve`);
      toast.success('অ্যাপ্রুভ করা হয়েছে');
      setUsers((u) => u.filter((x) => x._id !== id));
    } catch {
      toast.error('ব্যর্থ হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('এই আবেদন প্রত্যাখ্যান করতে চান?')) return;
    setProcessingId(id);
    try {
      await api.patch(`/admin/approvals/${id}/reject`);
      toast.success('প্রত্যাখ্যান করা হয়েছে');
      setUsers((u) => u.filter((x) => x._id !== id));
    } catch {
      toast.error('ব্যর্থ হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">✅ অ্যাপ্রুভাল</h1>
      <p className="text-stone-500 mb-4">কিচেন ও ডেলিভারি বয়দের NID যাচাই করে অ্যাপ্রুভ করুন</p>

      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition ${
              filter === f.value
                ? 'bg-orange-600 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : users.length === 0 ? (
        <p className="text-stone-500">{EMPTY_MESSAGE[filter]}</p>
      ) : (
        <div className="space-y-4">
          {users.map((u) => {
            const status = getStatus(u);
            return (
              <div key={u._id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-stone-800">{u.name}</p>
                      <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{ROLE_LABEL[u.role]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
                    </div>
                    {u.role === 'kitchen' && u.kitchenName && (
                      <p className="text-sm text-stone-600">কিচেন: {u.kitchenName}</p>
                    )}
                    <p className="text-sm text-stone-500">{u.email} · {u.phone}</p>
                    <p className="text-sm text-stone-500">এনআইডি: {u.nidNumber || '—'}</p>
                    <p className="text-xs text-stone-400 mt-1">আবেদনের তারিখ: {new Date(u.createdAt).toLocaleDateString('bn-BD')}</p>
                  </div>

                  {u.nidImage && (
                    <a href={u.nidImage} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                      এনআইডি ছবি দেখুন →
                    </a>
                  )}
                </div>

                {status === 'pending' && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleApprove(u._id)}
                      disabled={processingId === u._id}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                    >
                      অ্যাপ্রুভ করুন
                    </button>
                    <button
                      onClick={() => handleReject(u._id)}
                      disabled={processingId === u._id}
                      className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition"
                    >
                      প্রত্যাখ্যান করুন
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
