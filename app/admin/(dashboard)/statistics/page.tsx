"use client";

import React, { useEffect, useState } from 'react';
import { Place, Itinerary, Category } from '@/lib/supabase/types';
import {
  Users,
  MapPin,
  Map as MapIcon,
  MessageSquare,
  Loader2,
  Star,
  TrendingUp,
  BookOpen,
  Zap,
  Compass,
  Calendar,
  Wallet,
  RefreshCw,
  Layers,
  Award
} from 'lucide-react';

interface ItineraryItem {
  id: number | string;
  title: string;
  startDate?: string | null;
  days?: number | null;
  budget?: number | null;
  destination?: string | null;
  companion?: string | null;
  isGuide?: boolean | null;
  isAi?: boolean | null;
}

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raw DB Data
  const [totalUsers, setTotalUsers] = useState(0);
  const [places, setPlaces] = useState<Place[]>([]);
  const [itineraries, setItineraries] = useState<ItineraryItem[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [avgReviewRating, setAvgReviewRating] = useState<number | null>(null);
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
      if (statsRes.stats?.avgReviewRating !== undefined) {
        setAvgReviewRating(statsRes.stats.avgReviewRating);
      }
      setPlaces(placesRes.places || []);
      setItineraries(itinerariesRes || []);
      setCategories(categoriesRes || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu thống kê.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to remove zip/postal codes (e.g. 94100, 65000, 890000)
  const formatAddress = (text?: string | null) => {
    if (!text) return '';
    return text.replace(/\s*\b\d{4,6}\b/g, '').trim();
  };

  // Helper to remove raw emojis from start of string
  const stripLeadingEmoji = (text?: string | null) => {
    if (!text) return '';
    return text.replace(/^[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\s]+/gu, '').trim();
  };

  // Helper to format ISO dates cleanly
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (_) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center text-gray-500 dark:text-slate-400">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <span className="font-semibold text-sm">Đang tính toán toàn bộ số liệu thống kê hệ thống...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-rose-500">
        <p className="font-semibold">{error}</p>
        <button onClick={fetchStats} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline font-bold">
          Thử lại
        </button>
      </div>
    );
  }

  // Calculate statistics in-memory
  const avgRating = avgReviewRating !== null && avgReviewRating > 0
    ? avgReviewRating.toFixed(1)
    : places.length > 0
      ? (places.reduce((acc, curr) => acc + (curr.rating || 0), 0) / places.length).toFixed(1)
      : '0.0';

  // Places by Category distribution
  const categoryCounts = categories.map((cat) => {
    const count = places.filter((p) => p.categoryId === cat.id).length;
    const percentage = places.length > 0 ? Math.round((count / places.length) * 100) : 0;
    return { name: cat.name || 'N/A', count, percentage };
  }).sort((a, b) => b.count - a.count);

  // Helper to get true total review count combining external ratings & in-app reviews
  const getReviewCount = (p: any) => {
    const externalCount = Number(p.userRatingCount) || 0;
    const inAppCount = Number(p._count?.reviews) || 0;
    return Math.max(externalCount, inAppCount);
  };

  // Top rated & hot places (Sorted by weighted popularity score: Rating + Total Reviews)
  const topPlaces = [...places]
    .filter((p) => p.rating !== null && Number(p.rating) >= 4.0)
    .sort((a, b) => {
      const aRating = Number(a.rating) || 0;
      const bRating = Number(b.rating) || 0;
      const aCount = getReviewCount(a);
      const bCount = getReviewCount(b);

      // Weighted score calculation: High rating + High volume of reviews
      const scoreA = aRating * 20 + Math.log10(aCount + 1) * 10;
      const scoreB = bRating * 20 + Math.log10(bCount + 1) * 10;

      return scoreB - scoreA;
    })
    .slice(0, 5);

  // Recent Itineraries (First 5)
  const recentItineraries = itineraries.slice(0, 6);

  // Dynamic Travel Insights Calculation
  const tripCount = itineraries.filter((i) => !i.isGuide).length;
  const guideCount = itineraries.filter((i) => i.isGuide).length;
  const aiTripCount = itineraries.filter((i) => i.isAi).length;

  const validBudgets = itineraries.map(i => Number(i.budget) || 0).filter(b => b > 0);
  const avgBudget = validBudgets.length > 0
    ? Math.round(validBudgets.reduce((a, b) => a + b, 0) / validBudgets.length)
    : 0;

  // Find most popular companion dynamically
  const companionCounts: Record<string, number> = {};
  itineraries.forEach(i => {
    if (i.companion) {
      const key = i.companion === 'Riêng tư' ? 'Đi một mình' : i.companion;
      companionCounts[key] = (companionCounts[key] || 0) + 1;
    }
  });
  const topCompanion = Object.entries(companionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Đi một mình';

  // Find most popular destination dynamically
  const destCounts: Record<string, number> = {};
  itineraries.forEach(i => {
    if (i.destination) {
      destCounts[i.destination] = (destCounts[i.destination] || 0) + 1;
    }
  });
  const topDestination = Object.entries(destCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Cần Thơ';

  const statsCards = [
    {
      label: 'SỐ NGƯỜI DÙNG',
      value: totalUsers.toLocaleString(),
      subText: 'Tài khoản đăng ký',
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60'
    },
    {
      label: 'SỐ ĐỊA ĐIỂM',
      value: places.length.toLocaleString(),
      subText: `${categories.length} danh mục địa điểm`,
      icon: MapPin,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60'
    },
    {
      label: 'HÀNH TRÌNH & HƯỚNG DẪN',
      value: itineraries.length.toLocaleString(),
      subText: `${tripCount} Chuyến đi · ${guideCount} Hướng dẫn`,
      icon: MapIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900/60'
    },
    {
      label: 'LƯỢT ĐÁNH GIÁ & ĐIỂM AVG',
      value: `${totalReviews} (${avgRating} ⭐)`,
      subText: 'Đánh giá từ người dùng',
      icon: MessageSquare,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-gray-900 dark:text-slate-100">Báo cáo Thống kê</h1>
          <p className="text-gray-500 dark:text-slate-400 text-xs font-medium mt-1">Phân tích chuyên sâu dữ liệu hoạt động hệ thống CloudMood</p>
        </div>

        <button
          onClick={fetchStats}
          className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
        >
          <RefreshCw size={14} className="text-blue-600 dark:text-blue-400" /> Cập nhật số liệu
        </button>
      </div>

      {/* Grid counters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsCards.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all">
            <div className="space-y-1">
              <p className="text-gray-400 dark:text-slate-500 text-[11px] font-extrabold tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100">{stat.value}</h3>
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">{stat.subText}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${stat.bg} ${stat.color}`}>
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
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-gray-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Layers size={16} className="text-blue-600 dark:text-blue-400" /> Cơ cấu Địa điểm
              </h3>
              <span className="text-xs font-bold text-gray-400 dark:text-slate-500">{categories.length} danh mục</span>
            </div>

            <div className="space-y-3.5">
              {categoryCounts.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-800 dark:text-slate-200">{item.name}</span>
                    <span className="text-gray-500 dark:text-slate-400 font-bold">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Travel Insights card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <TrendingUp size={18} className="text-purple-600 dark:text-purple-400" />
              <h3 className="font-extrabold text-gray-900 dark:text-slate-100 text-sm">Xu hướng & Thống kê thông minh</h3>
            </div>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800/80 pb-2.5">
                <span className="text-gray-500 dark:text-slate-400 font-bold">Ngân sách trung bình/kế hoạch:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/60">
                  {avgBudget > 0 ? `${avgBudget.toLocaleString('vi-VN')} đ` : 'Tự do'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800/80 pb-2.5">
                <span className="text-gray-500 dark:text-slate-400 font-bold">Bạn đồng hành phổ biến nhất:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900/60">
                  {topCompanion}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800/80 pb-2.5">
                <span className="text-gray-500 dark:text-slate-400 font-bold">Nơi được chọn nhiều nhất:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-1">
                  <MapPin size={12} /> {topDestination}
                </span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-gray-500 dark:text-slate-400 font-bold">Lịch trình AI tạo:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60 flex items-center gap-1">
                  <Zap size={12} className="fill-amber-400 text-amber-400" /> {aiTripCount} kế hoạch
                </span>
              </div>
            </div>
            <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-xl p-3.5 text-xs leading-relaxed text-purple-900 dark:text-purple-300 font-medium">
              🌤️ Các địa điểm du lịch văn hóa - tự nhiên tại {topDestination} đang được du khách ưu tiên xây dựng lịch trình trải nghiệm theo thời tiết.
            </div>
          </div>
        </div>

        {/* Right column: Recent activities & top places */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Itineraries */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-gray-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" /> Các Lịch trình vừa khởi tạo
              </h3>
              <span className="text-xs font-bold text-gray-400 dark:text-slate-500">{itineraries.length} kế hoạch</span>
            </div>

            {recentItineraries.length === 0 ? (
              <p className="text-gray-400 italic text-xs py-6 text-center">Chưa có lịch trình nào được tạo.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-400 dark:text-slate-500 border-b border-gray-200 dark:border-slate-800 font-bold uppercase tracking-wider">
                      <th className="pb-3">Tên kế hoạch</th>
                      <th className="pb-3">Điểm đến</th>
                      <th className="pb-3">Thời gian khởi hành</th>
                      <th className="pb-3 text-right">Ngân sách</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                    {recentItineraries.map((itinerary) => {
                      const cleanTitle = stripLeadingEmoji(itinerary.title);
                      const formattedDate = formatDate(itinerary.startDate);

                      return (
                        <tr key={itinerary.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 pr-2 font-extrabold text-gray-900 dark:text-slate-100">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-extrabold text-gray-900 dark:text-slate-100">{cleanTitle}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  {itinerary.isGuide ? 'Hướng dẫn' : itinerary.isAi ? 'AI tạo' : 'Chuyến đi'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 text-gray-700 dark:text-slate-300 font-semibold">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded-md">
                              <MapPin size={11} className="text-blue-500" /> {itinerary.destination || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3.5 text-gray-500 dark:text-slate-400 font-medium">
                            {itinerary.days ? `${itinerary.days} ngày` : 'Nhiều ngày'}
                            {formattedDate && <span className="ml-1 text-gray-400 dark:text-slate-500">({formattedDate})</span>}
                          </td>
                          <td className="py-3.5 text-right font-black text-amber-600 dark:text-amber-400">
                            {itinerary.budget ? `${Number(itinerary.budget).toLocaleString('vi-VN')} đ` : 'Tự do'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top rated places */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-gray-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Award size={16} className="text-amber-500" /> Top Địa điểm Đánh giá Cao
              </h3>
              <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Rating &gt;= 4.0 ⭐</span>
            </div>

            {topPlaces.length === 0 ? (
              <p className="text-gray-400 italic text-xs py-6 text-center">Chưa có địa điểm nào được xếp hạng.</p>
            ) : (
              <div className="space-y-3">
                {topPlaces.map((place) => (
                  <div key={place.id} className="flex justify-between items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-950/40 hover:border-blue-400 transition-colors">
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-extrabold text-gray-900 dark:text-slate-100 text-xs truncate">{place.name}</h4>
                      {place.address && (
                        <p className="text-gray-500 dark:text-slate-400 text-[11px] truncate flex items-center gap-1">
                          <MapPin size={11} className="text-blue-500 shrink-0" />
                          {formatAddress(place.address)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold text-xs rounded-xl border border-amber-200 dark:border-amber-900/60 flex items-center gap-1">
                        <Star size={12} fill="#fbbf24" className="text-amber-400" />
                        {(place.rating || 0).toFixed(1)}
                      </span>
                      <span className="text-gray-400 dark:text-slate-500 text-xs font-semibold">
                        ({getReviewCount(place).toLocaleString('vi-VN')} đánh giá)
                      </span>
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
