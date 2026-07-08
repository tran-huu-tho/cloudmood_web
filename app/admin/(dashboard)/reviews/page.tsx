"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Review, UserRow, Place } from '@/lib/supabase/types';
import { Trash2, Search, Star } from 'lucide-react';

export default function ReviewsPage() {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [places, setPlaces] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: rv }, { data: us }, { data: pl }] = await Promise.all([
      supabase.from('Review').select('*'),
      supabase.from('User').select('id,fullName'),
      supabase.from('Place').select('id,name'),
    ]);
    setReviews((rv as Review[]) ?? []);
    const uMap: Record<string, string> = {};
    ((us as Pick<UserRow, 'id' | 'fullName'>[]) ?? []).forEach(u => { uMap[u.id] = u.fullName ?? u.id; });
    setUsers(uMap);
    const pMap: Record<string, string> = {};
    ((pl as Pick<Place, 'id' | 'name'>[]) ?? []).forEach(p => { pMap[p.id] = p.name ?? p.id; });
    setPlaces(pMap);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(id: string) {
    if (!confirm('Xóa đánh giá này?')) return;
    await supabase.from('Review').delete().eq('id', id);
    await fetchData();
  }

  function renderStars(rating: string | null) {
    const n = parseInt(rating ?? '0', 10);
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={12} className={i <= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
        ))}
        <span className="ml-1 text-xs text-gray-500">{rating ?? '?'}</span>
      </div>
    );
  }

  const filtered = reviews.filter(r =>
    (r.comment ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (users[r.userId ?? ''] ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (places[r.placeId ?? ''] ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá</h1>
          <p className="text-gray-500 text-sm mt-1">{reviews.length} đánh giá</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo nội dung, tên..." className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Không có đánh giá nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Người dùng</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Địa điểm</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Đánh giá</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nhận xét</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{users[r.userId ?? ''] ?? r.userId ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{places[r.placeId ?? ''] ?? r.placeId ?? '—'}</td>
                    <td className="px-4 py-3">{renderStars(r.rating)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.comment ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

