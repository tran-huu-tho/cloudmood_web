"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardMap from '@/components/admin/DashboardMap';
import { Users, MapPin, Map as MapIcon, MessageSquare, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';



const mockReviews = [
  { 
    id: 1, 
    userId: 1, 
    placeId: 1, 
    rating: 5, 
    comment: 'Trải nghiệm tuyệt vời! Dịch vụ du lịch rất chu đáo và thông tin thời tiết cực kỳ chính xác giúp mình chuẩn bị tốt chuyến đi.', 
    user: { fullName: 'Nguyễn Thanh Nam', avatar: null, email: 'nam.nt@gmail.com' },
    place: { name: 'Chợ Nổi Cái Răng, Cần Thơ' }
  },
  { 
    id: 2, 
    userId: 2, 
    placeId: 2, 
    rating: 4, 
    comment: 'Bến Ninh Kiều buổi tối rất đẹp và nhộn nhịp. Ứng dụng gợi ý địa điểm ăn uống rất hợp lý.', 
    user: { fullName: 'Lê Thị Thu Thảo', avatar: null, email: 'thao.ltt@yahoo.com' },
    place: { name: 'Bến Ninh Kiều, Cần Thơ' }
  },
  { 
    id: 3, 
    userId: 3, 
    placeId: 3, 
    rating: 5, 
    comment: 'Giao diện thân thiện, dễ sử dụng. Mình rất thích phần theo dõi thời tiết thực tế tại điểm đến.', 
    user: { fullName: 'Trần Hoàng Bách', avatar: null, email: 'bach.th@hotmail.com' },
    place: { name: 'Thiền Viện Trúc Lâm Phương Nam' }
  }
];

export default function AdminDashboard() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic counts state
  const [userCount, setUserCount] = useState<number | null>(null);
  const [placeCount, setPlaceCount] = useState<number | null>(null);
  const [itineraryCount, setItineraryCount] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const [reviewsRes, usersRes, placesRes, itinerariesCountRes, reviewsCountRes] = await Promise.all([
          supabase.from('Review').select('*').order('id', { ascending: false }).limit(3),
          supabase.from('User').select('id, fullName, email, avatar'),
          supabase.from('Place').select('id, name'),
          supabase.from('Itinerary').select('*', { count: 'exact', head: true }),
          supabase.from('Review').select('*', { count: 'exact', head: true }),
        ]);

        if (usersRes.data) {
          setUsers(usersRes.data);
          setUserCount(usersRes.data.length);
        }
        if (placesRes.data) {
          setPlaces(placesRes.data);
          setPlaceCount(placesRes.data.length);
        }
        if (reviewsRes.data) {
          setReviews(reviewsRes.data);
        }
        if (itinerariesCountRes.count !== null) {
          setItineraryCount(itinerariesCountRes.count);
        }
        if (reviewsCountRes.count !== null) {
          setReviewCount(reviewsCountRes.count);
        }
      } catch (err) {
        console.error('Error fetching dashboard reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            fill={star <= rating ? "currentColor" : "none"}
            className={star <= rating ? "text-amber-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  // Determine which reviews to display
  const displayReviews = reviews.length > 0 ? reviews.map(r => {
    const user = users.find(u => u.id === r.userId);
    const place = places.find(p => p.id === r.placeId);
    return {
      ...r,
      user: user || { fullName: 'Ẩn danh', avatar: null, email: '' },
      place: place || { name: 'Địa điểm không rõ' }
    };
  }) : mockReviews;

  const stats = [
    { 
      label: 'Số người dùng', 
      value: userCount !== null ? userCount.toLocaleString() : '...', 
      icon: Users, 
      cardBg: 'bg-[#eef2ff]', 
      iconBg: 'bg-[#e0e7ff]', 
      iconColor: 'text-[#4f46e5]', 
      textColor: 'text-[#6366f1]', 
      valColor: 'text-[#3730a3]' 
    },
    { 
      label: 'Số địa điểm', 
      value: placeCount !== null ? placeCount.toLocaleString() : '...', 
      icon: MapPin, 
      cardBg: 'bg-[#fef3c7]', 
      iconBg: 'bg-[#fde68a]', 
      iconColor: 'text-[#d97706]', 
      textColor: 'text-[#b45309]', 
      valColor: 'text-[#78350f]' 
    },
    { 
      label: 'Số plan đã lên', 
      value: itineraryCount !== null ? itineraryCount.toLocaleString() : '...', 
      icon: MapIcon, 
      cardBg: 'bg-[#e0f2fe]', 
      iconBg: 'bg-[#bae6fd]', 
      iconColor: 'text-[#0284c7]', 
      textColor: 'text-[#0369a1]', 
      valColor: 'text-[#075985]' 
    },
    { 
      label: 'Số góp ý và cmt', 
      value: reviewCount !== null ? reviewCount.toLocaleString() : '...', 
      icon: MessageSquare, 
      cardBg: 'bg-[#ffe4e6]', 
      iconBg: 'bg-[#fecdd3]', 
      iconColor: 'text-[#e11d48]', 
      textColor: 'text-[#be123c]', 
      valColor: 'text-[#881337]' 
    },
  ];

  return (
    <div className="space-y-6">

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className={`rounded-2xl p-6 flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:shadow-md duration-200 ${stat.cardBg}`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.iconBg} mb-4 shrink-0`}>
              <stat.icon size={26} className={stat.iconColor} />
            </div>
            <p className={`${stat.textColor} text-sm font-semibold mb-1`}>{stat.label}</p>
            <h3 className={`${stat.valColor} text-3xl font-extrabold`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Map Section */}
      <DashboardMap />

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Address Card (Left) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-1 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Địa chỉ</h2>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-950 font-bold">Cần Thơ (Trụ sở chính)</p>
                  <p className="text-sm text-gray-800 font-semibold mt-0.5">Đại học Kỹ Thuật - Công Nghệ Cần Thơ</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-950 font-bold">Email</p>
                  <p className="text-sm text-gray-800 font-semibold mt-0.5">cloudmood@contact.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Đánh giá của người dùng (Right) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-2 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Đánh giá từ người dùng</h2>
              </div>
              <Link href="/admin/reviews" className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors">
                Xem tất cả &rarr;
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                // Skeleton Loader
                [1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-5/6" />
                    </div>
                  </div>
                ))
              ) : (
                displayReviews.map((review, idx) => (
                  <div key={review.id || idx} className="p-4 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all flex gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 text-sm">
                      {review.user?.avatar ? (
                        <img src={review.user.avatar} alt={review.user.fullName || ""} className="object-cover w-full h-full" />
                      ) : (
                        <span>{(review.user?.fullName || "A").charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                        <div>
                          <span className="font-bold text-gray-955 text-sm mr-2">{review.user?.fullName || 'Ẩn danh'}</span>
                          <span className="text-xs text-gray-500">tại <span className="font-semibold text-gray-700">{review.place?.name}</span></span>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating || 5)}
                        </div>
                      </div>
                      <p className="text-gray-700 italic text-xs leading-relaxed line-clamp-2">
                        "{review.comment || 'Không có nhận xét'}"
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
