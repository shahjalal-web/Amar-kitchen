'use client';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { getErrorMessage } from '../../../lib/errors';
import Loader from '../../../components/ui/Loader';

interface PermGroup { group: string; items: { key: string; label: string }[] }
interface Role { _id: string; name: string; slug: string; description?: string; permissions: string[]; isActive: boolean; memberCount: number }
interface Member {
  _id: string; name: string; email: string; phone: string; isActive: boolean; createdAt: string;
  staffRole?: { _id: string; name: string; isActive: boolean } | null;
}

const inputCls = 'w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400';
const emptyRole = { name: '', slug: '', description: '', permissions: [] as string[] };
const emptyMember = { name: '', email: '', phone: '', password: '', roleId: '' };

export default function StaffPage() {
  const [tab, setTab] = useState<'members' | 'roles'>('members');
  const [groups, setGroups] = useState<PermGroup[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [roleForm, setRoleForm] = useState(emptyRole);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [roleOpen, setRoleOpen] = useState(false);

  const [memberForm, setMemberForm] = useState(emptyMember);
  const [memberOpen, setMemberOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() =>
    Promise.all([api.get('/staff/permissions'), api.get('/staff/roles'), api.get('/staff/members')])
      .then(([p, r, m]) => { setGroups(p.data.data); setRoles(r.data.data); setMembers(m.data.data); })
      .catch((err) => toast.error(getErrorMessage(err, 'লোড ব্যর্থ হয়েছে')))
      .finally(() => setLoading(false)), []);

  useEffect(() => { load(); }, [load]);

  const permLabel = (key: string) => groups.flatMap((g) => g.items).find((i) => i.key === key)?.label ?? key;

  // ─── রোল ───
  const openRole = (role?: Role) => {
    setEditingRole(role?._id ?? null);
    setRoleForm(role ? { name: role.name, slug: role.slug, description: role.description ?? '', permissions: role.permissions } : emptyRole);
    setRoleOpen(true);
  };

  const togglePerm = (key: string) =>
    setRoleForm((f) => ({ ...f, permissions: f.permissions.includes(key) ? f.permissions.filter((p) => p !== key) : [...f.permissions, key] }));

  const toggleGroup = (g: PermGroup) => {
    const keys = g.items.map((i) => i.key);
    const all = keys.every((k) => roleForm.permissions.includes(k));
    setRoleForm((f) => ({ ...f, permissions: all ? f.permissions.filter((p) => !keys.includes(p)) : [...new Set([...f.permissions, ...keys])] }));
  };

  const saveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) return toast.error('রোলের নাম দিন');
    if (!roleForm.permissions.length) return toast.error('অন্তত একটি পারমিশন দিন');
    setSaving(true);
    try {
      const res = editingRole ? await api.patch(`/staff/roles/${editingRole}`, roleForm) : await api.post('/staff/roles', roleForm);
      toast.success(res.data.message);
      setRoleOpen(false);
      await load();
    } catch (err) { toast.error(getErrorMessage(err, 'সংরক্ষণ ব্যর্থ হয়েছে')); }
    finally { setSaving(false); }
  };

  const roleAction = async (role: Role, action: 'toggle' | 'delete') => {
    if (action === 'delete' && !confirm(`"${role.name}" রোলটি মুছে ফেলবেন?`)) return;
    try {
      const res = action === 'delete'
        ? await api.delete(`/staff/roles/${role._id}`)
        : await api.patch(`/staff/roles/${role._id}`, { isActive: !role.isActive });
      toast.success(res.data.message);
      await load();
    } catch (err) { toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে')); }
  };

  // ─── স্টাফ ───
  const saveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = memberForm;
    if (!f.name.trim() || !f.email.trim() || !f.phone.trim()) return toast.error('নাম, ইমেইল ও ফোন দিন');
    if (f.password.length < 8) return toast.error('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের দিন');
    if (!f.roleId) return toast.error('রোল বাছুন');
    setSaving(true);
    try {
      const res = await api.post('/staff/members', f);
      toast.success(res.data.message);
      setMemberForm(emptyMember);
      setMemberOpen(false);
      await load();
    } catch (err) { toast.error(getErrorMessage(err, 'তৈরি করা যায়নি')); }
    finally { setSaving(false); }
  };

  const memberUpdate = async (m: Member, data: Record<string, unknown>) => {
    try {
      const res = await api.patch(`/staff/members/${m._id}`, data);
      toast.success(res.data.message);
      await load();
    } catch (err) { toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে')); }
  };

  const resetPassword = (m: Member) => {
    const password = prompt(`${m.name}-এর নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর):`);
    if (password) memberUpdate(m, { password });
  };

  const removeMember = async (m: Member) => {
    if (!confirm(`${m.name}-এর একাউন্ট মুছে ফেলবেন? উনি আর লগইন করতে পারবেন না।`)) return;
    try {
      const res = await api.delete(`/staff/members/${m._id}`);
      toast.success(res.data.message);
      await load();
    } catch (err) { toast.error(getErrorMessage(err, 'ব্যর্থ হয়েছে')); }
  };

  const activeRoles = roles.filter((r) => r.isActive);

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl sm:text-2xl font-bold text-stone-800 mb-1">🛡️ স্টাফ ও রোল</h1>
      <p className="text-sm text-stone-500 mb-4">সাব অ্যাডমিন, ম্যানেজার, অ্যাকাউন্টস ইত্যাদি একাউন্ট তৈরি করুন; প্রতিটি রোলে কোন কাজের অনুমতি থাকবে ঠিক করে দিন।</p>

      <div className="inline-flex bg-white rounded-xl p-1 shadow-sm mb-5">
        {([['members', `👥 স্টাফ (${members.filter((m) => m.staffRole).length})`], ['roles', `🔑 রোল (${roles.length})`]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? 'bg-green-600 text-white' : 'text-stone-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : tab === 'members' ? (
        <>
          {!memberOpen ? (
            <button onClick={() => { setMemberForm({ ...emptyMember, roleId: activeRoles[0]?._id ?? '' }); setMemberOpen(true); }} className="mb-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl">
              + নতুন স্টাফ
            </button>
          ) : (
            <form onSubmit={saveMember} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm mb-5 space-y-3">
              <h2 className="font-semibold text-stone-700">নতুন স্টাফ একাউন্ট</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} placeholder="নাম" className={inputCls} />
                <input value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} placeholder="ফোন" inputMode="tel" className={inputCls} />
                <input value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} placeholder="ইমেইল (লগইনের জন্য)" type="email" className={inputCls} />
                <input value={memberForm.password} onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })} placeholder="পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)" type="text" autoComplete="new-password" className={inputCls} />
                <select value={memberForm.roleId} onChange={(e) => setMemberForm({ ...memberForm, roleId: e.target.value })} className={`${inputCls} sm:col-span-2`}>
                  <option value="">— রোল বাছুন —</option>
                  {activeRoles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                </select>
              </div>
              <p className="text-xs text-stone-500">স্টাফ এই ইমেইল আর পাসওয়ার্ড দিয়ে সাধারণ লগইন পেজ থেকে ঢুকবেন। পাসওয়ার্ডটি তাকে নিরাপদে জানিয়ে দিন।</p>
              <div className="flex gap-2">
                <button disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg">{saving ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}</button>
                <button type="button" onClick={() => setMemberOpen(false)} className="text-sm text-stone-500 px-3">বাতিল</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {members.map((m) => (
              <div key={m._id} className={`bg-white rounded-2xl p-4 shadow-sm ${m.isActive ? '' : 'opacity-60'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-800">
                      {m.name}
                      {!m.staffRole && <span className="ml-2 text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">সুপার অ্যাডমিন</span>}
                      {!m.isActive && <span className="ml-2 text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">ব্লক</span>}
                    </p>
                    <p className="text-sm text-stone-500 break-all">{m.email}</p>
                    <a href={`tel:${m.phone}`} className="text-sm text-stone-500 hover:underline">📞 {m.phone}</a>
                  </div>
                  {m.staffRole && (
                    <select value={m.staffRole._id} onChange={(e) => memberUpdate(m, { roleId: e.target.value })} className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white">
                      {roles.map((r) => <option key={r._id} value={r._id} disabled={!r.isActive}>{r.name}{r.isActive ? '' : ' (বন্ধ)'}</option>)}
                    </select>
                  )}
                </div>
                {m.staffRole && (
                  <div className="flex flex-wrap gap-2 mt-3 text-sm">
                    <button onClick={() => memberUpdate(m, { isActive: !m.isActive })} className={`px-3 py-1.5 rounded-lg ${m.isActive ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                      {m.isActive ? 'ব্লক করুন' : 'চালু করুন'}
                    </button>
                    <button onClick={() => resetPassword(m)} className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700">পাসওয়ার্ড বদলান</button>
                    <button onClick={() => removeMember(m)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600">মুছুন</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {!roleOpen && (
            <button onClick={() => openRole()} className="mb-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl">+ নতুন রোল</button>
          )}

          {roleOpen && (
            <form onSubmit={saveRole} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm mb-5 space-y-4">
              <h2 className="font-semibold text-stone-700">{editingRole ? 'রোল সম্পাদনা' : 'নতুন রোল'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="রোলের নাম (যেমন: অপারেশন্স)" className={inputCls} />
                {!editingRole && (
                  <input value={roleForm.slug} onChange={(e) => setRoleForm({ ...roleForm, slug: e.target.value })} placeholder="ইংরেজি নাম (ঐচ্ছিক, যেমন: operations)" className={inputCls} />
                )}
                <input value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} placeholder="ছোট বর্ণনা" className={`${inputCls} sm:col-span-2`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map((g) => {
                  const all = g.items.every((i) => roleForm.permissions.includes(i.key));
                  return (
                    <fieldset key={g.group} className="border border-stone-200 rounded-xl p-3">
                      <legend className="px-1">
                        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 cursor-pointer">
                          <input type="checkbox" checked={all} onChange={() => toggleGroup(g)} className="w-4 h-4 accent-green-600" />
                          {g.group}
                        </label>
                      </legend>
                      <div className="space-y-1">
                        {g.items.map((i) => (
                          <label key={i.key} className="flex items-center gap-2.5 py-1.5 text-sm text-stone-700 cursor-pointer">
                            <input type="checkbox" checked={roleForm.permissions.includes(i.key)} onChange={() => togglePerm(i.key)} className="w-4 h-4 accent-green-600" />
                            {i.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
              <p className="text-xs text-stone-500">স্টাফ ও রোল ব্যবস্থাপনা শুধু সুপার অ্যাডমিনের হাতে থাকে, কোনো রোলে দেওয়া যায় না।</p>
              <div className="flex gap-2">
                <button disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg">{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</button>
                <button type="button" onClick={() => setRoleOpen(false)} className="text-sm text-stone-500 px-3">বাতিল</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roles.map((r) => (
              <div key={r._id} className={`bg-white rounded-2xl p-4 shadow-sm flex flex-col ${r.isActive ? '' : 'opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-stone-800">{r.name} {!r.isActive && <span className="text-[11px] text-red-600">(বন্ধ)</span>}</p>
                    {r.description && <p className="text-xs text-stone-500">{r.description}</p>}
                  </div>
                  <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full shrink-0">{r.memberCount} জন</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {r.permissions.map((p) => <span key={p} className="text-[11px] bg-green-50 text-green-800 px-2 py-0.5 rounded-full">{permLabel(p)}</span>)}
                </div>
                <div className="flex flex-wrap gap-2 mt-auto pt-3 text-sm">
                  <button onClick={() => openRole(r)} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700">সম্পাদনা</button>
                  <button onClick={() => roleAction(r, 'toggle')} className={`px-3 py-1.5 rounded-lg ${r.isActive ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{r.isActive ? 'বন্ধ করুন' : 'চালু করুন'}</button>
                  <button onClick={() => roleAction(r, 'delete')} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600">মুছুন</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
