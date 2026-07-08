"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRow } from '@/lib/supabase/types';
import { Plus, Pencil, Trash2, Search, X, ShieldCheck, User as UserIcon } from 'lucide-react';

const emptyForm = { fullName: '', email: '', password: '', role: false };

export default function UsersPage() {
  const supabase = createClient();
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('User').select('id,fullName,email,role,avatar,createdAt').order('createdAt', { ascending: false });
    setItems((data as UserRow[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  }

  function openEdit(item: UserRow) {
    setEditing(item);
    setForm({ fullName: item.fullName ?? '', email: item.email ?? '', password: '', role: item.role ?? false });
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.email.trim()) { setError('Email không được để trống.'); return; }
    setSaving(true);
    setError('');
    let err;
    if (editing) {
      const payload: Partial<UserRow> = { fullName: form.fullName, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;
      ({ error: err } = await supabase.from('User').update(payload).eq('id', editing.id));
    } else {
      if (!form.password) { setError('Mật khẩu không được để trống.'); setSaving(false); return; }
      ({ error: err } = await supabase.from('User').insert({
        id: crypto.randomUUID(),
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        createdAt: new Date().toISOString().split('T')[0],
      }));
    }
    if (err) { setError(err.message); setSaving(false); return; }
    await fetchData();
    setShowModal(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa người dùng này?')) return;
    await supabase.from('User').delete().eq('id', id);
    await fetchData();
  }

  const filtered = items.filter(i =>
    (i.fullName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} người dùng</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, email..." className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Không có dữ liệu</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ tên</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vai trò</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <UserIcon size={14} />
                      </div>
                      {item.fullName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      {item.role ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                          <ShieldCheck size={11} /> Admin
                        </span>
                      ) : (
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">User</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.createdAt ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Sửa người dùng' : 'Thêm người dùng'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Nguyễn Văn A" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu {editing && <span className="text-gray-400 font-normal">(để trống nếu không đổi)</span>}
                  {!editing && <span className="text-red-500"> *</span>}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="role" checked={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 accent-blue-600" />
                <label htmlFor="role" className="text-sm font-medium text-gray-700">Quyền Admin</label>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

