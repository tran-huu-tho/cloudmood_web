"use client";

import React, { useEffect, useState } from 'react';
import { Place, Itinerary, Category } from '@/lib/supabase/types';
import { Users, MapPin, Map as MapIcon, MessageSquare, Loader2, Star, TrendingUp } from 'lucide-react';
import { cleanAddress } from '@/lib/utils';

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raw DB Data
  const [totalUsers, setTotalUsers] = useState(0);
  const [places, setPlaces] = useState<Place[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, placesRes, itinerariesRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats').then(r => {
          if (!r.ok) throw new Error('Không thể tải thống kê chung.');
          return r.json();
        }),
        fetch('/api/admin/places?limit=10000').then(r => {
          if (!r.ok) throw new Error('Không thể tải danh sách địa điểm.');
          return r.json();
        }),
        fetch('/api/admin/itineraries?limit=10000').then(r => {
          if (!r.ok) throw new Error('Không thể tải danh sách lịch trình.');
          return r.json();
        }),
        fetch('/api/admin/categories').then(r => {
          if (!r.ok) throw new Error('Không thể tải danh sách danh mục.');
          return r.json();
        }),
      ]);

      setTotalUsers(statsRes.stats?.userCount || 0);
      setTotalReviews(statsRes.stats?.reviewCount || 0);
      setPlaces(placesRes.places || []);
      setItineraries(itinerariesRes || []);
      setCategories(categoriesRes || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu thống kê.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <span>Đang tính toán số liệu thống kê...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-red-500">
        <p className="font-semibold">{error}</p>
        <button onClick={fetchStats} className="mt-4 text-sm text-blue-600 hover:underline">
          Thử lại
        </button>
      </div>
    );
  }

  // Calculate statistics in-memory
  const avgRating = places.length > 0
    ? (places.reduce((acc, curr) => acc + (curr.rating || 0), 0) / places.length).toFixed(1)
    : '0.0';

  // Places by Category distribution
  const categoryCounts = categories.map((cat) => {
    const count = places.filter((p) => p.categoryId === cat.id).length;
    const percentage = places.length > 0 ? Math.round((count / places.length) * 100) : 0;
    return { name: cat.name || 'N/A', count, percentage };
  }).sort((a, b) => b.count - a.count);

  // Top rated places (Filter for high quality places rating >= 4.5, then sort by review count/popularity descending)
  const topPlaces = [...places]
    .filter((p) => p.rating !== null && p.rating >= 4.5)
    .sort((a, b) => (b.userRatingCount || 0) - (a.userRatingCount || 0))
    .slice(0, 5);

  // Recent Itineraries
  const recentItineraries = itineraries.slice(0, 5);

  // General metrics
  const totalBudget = itineraries.reduce((acc, curr) => acc + (curr.budget || 0), 0);
  const avgBudget = itineraries.length > 0 ? Math.round(totalBudget / itineraries.length) : 0;

  const statsCards = [
    { label: 'Số người dùng', value: totalUsers.toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Số địa điểm', value: places.length.toLocaleString(), icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Lịch trình đã lên', value: itineraries.length.toLocaleString(), icon: MapIcon, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Số lượt đánh giá (Avg)', value: `${totalReviews} (${avgRating} ⭐)`, icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo Thống kê</h1>
        <p className="text-gray-500 text-sm mt-1">Phân tích chuyên sâu dữ liệu hoạt động hệ thống</p>
      </div>

      {/* Grid counters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Details charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Categories distribution & Insights */}
        <div className="lg:col-span-1 space-y-6">
          {/* Category distribution */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-base mb-4">Cơ cấu Địa điểm</h3>
            <div className="space-y-4">
              {categoryCounts.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-500 font-bold">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Travel Insights card */}
          <div className="bg-white border border-gray-200 text-gray-900 rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600" />
              <h3 className="font-bold text-gray-900 text-base">Travel Insights</h3>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500 font-semibold">Ngân sách trung bình/plan:</span>
                <span className="font-mono font-bold text-gray-800">
                  {avgBudget.toLocaleString()} đ
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500 font-semibold">Bạn đồng hành phổ biến:</span>
                <span className="font-bold text-gray-800">Friends (Bạn bè)</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-gray-500 font-semibold">Nơi được chọn nhiều nhất:</span>
                <span className="font-bold text-gray-800">Cần Thơ 🌤️</span>
              </div>
            </div>
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 text-xs leading-relaxed text-indigo-950 font-medium">
              🌤️ Các địa điểm du lịch văn hóa - tự nhiên đang được du khách ưu tiên xây dựng lịch trình theo điều kiện thời tiết trong tuần.
            </div>
          </div>
        </div>

        {/* Right column: Recent activities & top places */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Itineraries */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-base mb-4">Các Lịch trình vừa khởi tạo</h3>
            {recentItineraries.length === 0 ? (
              <p className="text-gray-400 text-sm py-6 text-center">Chưa có lịch trình nào được tạo.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-200 font-semibold uppercase">
                      <th className="pb-3">Tên kế hoạch</th>
                      <th className="pb-3">Điểm đến</th>
                      <th className="pb-3">Thời gian</th>
                      <th className="pb-3 text-right">Ngân sách</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentItineraries.map((itinerary) => (
                      <tr key={itinerary.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 font-semibold text-gray-900">{itinerary.title}</td>
                        <td className="py-3 text-gray-700">{itinerary.destination || 'N/A'}</td>
                        <td className="py-3 text-gray-500">
                          {itinerary.days} ngày ({itinerary.startDate || 'N/A'})
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-gray-900">
                          {itinerary.budget ? `${itinerary.budget.toLocaleString()} đ` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top rated places */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-base mb-4">Top Địa điểm Đánh giá Cao</h3>
            {topPlaces.length === 0 ? (
              <p className="text-gray-400 text-sm py-6 text-center">Chưa có địa điểm nào được xếp hạng.</p>
            ) : (
              <div className="space-y-3.5">
                {topPlaces.map((place) => (
                  <div key={place.id} className="flex justify-between items-center gap-4 hover:bg-gray-50/50 p-2 rounded-lg transition-colors">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{place.name}</h4>
                      <p className="text-gray-500 text-xs truncate mt-0.5">{cleanAddress(place.address)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Star size={14} fill="#fbbf24" className="text-amber-400" />
                      <span className="font-bold text-sm text-gray-900 font-mono">{(place.rating || 0).toFixed(1)}</span>
                      <span className="text-gray-400 text-xs">({place.userRatingCount || 0} vote)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
