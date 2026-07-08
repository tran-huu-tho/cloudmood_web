"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Place, Category, Review } from '@/lib/supabase/types';
import { Users, MapPin, Map as MapIcon, MessageSquare, Star, TrendingUp } from 'lucide-react';

type Stat = { label: string; value: number; icon: React.ElementType; color: string; bg: string };

export default function StatisticsPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stat[]>([]);
  const [topPlaces, setTopPlaces] = useState<{ name: string; count: number }[]>([]);
  const [topCategories, setTopCategories] = useState<{ name: string; icon: string; count: number }[]>([]);
  const [ratingDist, setRatingDist] = useState<{ rating: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [
      { count: userCount },
      { count: placeCount },
      { count: itineraryCount },
      { count: reviewCount },
      { data: reviews },
      { data: places },
      { data: categories },
    ] = await Promise.all([
      supabase.from('User').select('*', { count: 'exact', head: true }),
      supabase.from('Place').select('*', { count: 'exact', head: true }),
      supabase.from('Itinerary').select('*', { count: 'exact', head: true }),
      supabase.from('Review').select('*', { count: 'exact', head: true }),
      supabase.from('Review').select('id,rating,placeId'),
      supabase.from('Place').select('id,name,categoryId'),
      supabase.from('Category').select('id,name,icon'),
    ]);

    setStats([
      { label: 'Người dùng', value: userCount ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { label: 'Địa điểm', value: placeCount ?? 0, icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { label: 'Lịch trình', value: itineraryCount ?? 0, icon: MapIcon, color: 'text-purple-500', bg: 'bg-purple-500/10' },
      { label: 'Đánh giá', value: reviewCount ?? 0, icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ]);

    // Top places by review count
    const rv = (reviews as Pick<Review, 'id' | 'rating' | 'placeId'>[]) ?? [];
    const pl = (places as Pick<Place, 'id' | 'name' | 'categoryId'>[]) ?? [];
    const cats = (categories as Pick<Category, 'id' | 'name' | 'icon'>[]) ?? [];

    const placeReviewCount: Record<string, number> = {};
    rv.forEach(r => { if (r.placeId) placeReviewCount[r.placeId] = (placeReviewCount[r.placeId] ?? 0) + 1; });
    const topP = pl
      .map(p => ({ name: p.name ?? '—', count: placeReviewCount[p.id] ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setTopPlaces(topP);

    // Top categories by place count
    const catPlaceCount: Record<string, number> = {};
    pl.forEach(p => { if (p.categoryId) catPlaceCount[p.categoryId] = (catPlaceCount[p.categoryId] ?? 0) + 1; });
    const catMap: Record<string, { name: string; icon: string }> = {};
    cats.forEach(c => { catMap[c.id] = { name: c.name ?? '—', icon: c.icon ?? '' }; });
    const topC = cats
      .map(c => ({ name: c.name ?? '—', icon: c.icon ?? '', count: catPlaceCount[c.id] ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setTopCategories(topC);

    // Rating distribution
    const rDist: Record<string, number> = {};
    rv.forEach(r => { const k = r.rating ?? '?'; rDist[k] = (rDist[k] ?? 0) + 1; });
    const sorted = Object.entries(rDist).sort((a, b) => b[0].localeCompare(a[0])).map(([rating, count]) => ({ rating, count }));
    setRatingDist(sorted);

    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const maxReview = Math.max(...topPlaces.map(p => p.count), 1);
  const maxCat = Math.max(...topCategories.map(c => c.count), 1);

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Đang tải thống kê...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thống kê</h1>
        <p className="text-gray-500 text-sm mt-1">Tổng quan dữ liệu hệ thống</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">{s.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</h3>
            </div>
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>
              <s.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top places */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-blue-500" />
            <h2 className="font-bold text-gray-900">Top địa điểm được đánh giá nhiều nhất</h2>
          </div>
          {topPlaces.length === 0 ? (
            <p className="text-gray-400 text-sm">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-3">
              {topPlaces.map((p, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium truncate max-w-[200px]">{p.name}</span>
                    <span className="text-gray-500 text-xs ml-2 shrink-0">{p.count} đánh giá</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(p.count / maxReview) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top categories */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={16} className="text-emerald-500" />
            <h2 className="font-bold text-gray-900">Danh mục có nhiều địa điểm nhất</h2>
          </div>
          {topCategories.length === 0 ? (
            <p className="text-gray-400 text-sm">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((c, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{c.icon} {c.name}</span>
                    <span className="text-gray-500 text-xs">{c.count} địa điểm</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${(c.count / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rating distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <Star size={16} className="text-yellow-400" />
            <h2 className="font-bold text-gray-900">Phân bổ đánh giá</h2>
          </div>
          {ratingDist.length === 0 ? (
            <p className="text-gray-400 text-sm">Chưa có đánh giá nào</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {ratingDist.map((r, i) => {
                const total = ratingDist.reduce((s, x) => s + x.count, 0);
                const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 min-w-[60px]">
                    <div className="text-2xl font-bold text-gray-900">{r.count}</div>
                    <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= parseInt(r.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />)}</div>
                    <div className="text-xs text-gray-500">{pct}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

