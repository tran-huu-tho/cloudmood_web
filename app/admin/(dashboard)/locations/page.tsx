"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Place, Category } from '@/lib/supabase/types';
import { Plus, Pencil, Trash2, Search, X, MapPin } from 'lucide-react';

const emptyForm = { name: '', description: '', address: '', latitude: '', longitude: '', price: '', openTime: '', closeTime: '', categoryId: '', image: '' };

export default function LocationsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: places }, { data: cats }] = await Promise.all([
      supabase.from('Place').select('*').order('name'),
      supabase.from('Category').select('*').order('name'),
    ]);
    setItems((places as Place[]) ?? []);
    setCategories((cats as Category[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  }

  function openEdit(item: Place) {
    setEditing(item);
    setForm({
      name: item.name ?? '', description: item.description ?? '',
      address: item.address ?? '', latitude: item.latitude ?? '',
      longitude: item.longitude ?? '', price: item.price ?? '',
      openTime: item.openTime ?? '', closeTime: item.closeTime ?? '',
      categoryId: item.categoryId ?? '', image: item.image ?? '',
    });
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Tên địa điểm không được để trống.'); return; }
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(), description: form.description,
      address: form.address, latitude: form.latitude,
      longitude: form.longitude, price: form.price,
      openTime: form.openTime || null, closeTime: form.closeTime || null,
      categoryId: form.categoryId || null, image: form.image,
    };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from('Place').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('Place').insert({ id: crypto.randomUUID(), ...payload }));
    }
    if (err) { setError(err.message); setSaving(false); return; }
    await fetchData();
    setShowModal(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa địa điểm này?')) return;
    await supabase.from('Place').delete().eq('id', id);
    await fetchData();
  }

  function getCategoryName(id: string | null) {
    return categories.find(c => c.id === id)?.name ?? '—';
  }

  const filtered = items.filter(i =>
    (i.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.address ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const f = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý địa điểm</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} địa điểm</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, địa chỉ..." className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:border-blue-500" />
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
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên địa điểm</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh mục</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Giờ hoạt động</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-emerald-500 shrink-0" />
                        <span className="max-w-[180px] truncate">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{item.address ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{getCategoryName(item.categoryId)}</td>
                    <td className="px-4 py-3 text-gray-600">{item.price ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {item.openTime && item.closeTime ? `${item.openTime} – ${item.closeTime}` : '—'}
                    </td>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Sửa địa điểm' : 'Thêm địa điểm'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên địa điểm <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={f('name')} placeholder="Hồ Hoàn Kiếm" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea value={form.description} onChange={f('description')} rows={2} placeholder="Mô tả ngắn về địa điểm..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input value={form.address} onChange={f('address')} placeholder="Số 1 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vĩ độ (Latitude)</label>
                <input value={form.latitude} onChange={f('latitude')} placeholder="21.0285" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kinh độ (Longitude)</label>
                <input value={form.longitude} onChange={f('longitude')} placeholder="105.8542" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá vé</label>
                <input value={form.price} onChange={f('price')} placeholder="Miễn phí / 50.000đ" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select value={form.categoryId} onChange={f('categoryId')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ mở cửa</label>
                <input type="time" value={form.openTime} onChange={f('openTime')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ đóng cửa</label>
                <input type="time" value={form.closeTime} onChange={f('closeTime')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL ảnh</label>
                <input value={form.image} onChange={f('image')} placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
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

