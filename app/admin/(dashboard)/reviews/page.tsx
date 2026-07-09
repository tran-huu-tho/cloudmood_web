"use client";

import React, { useEffect, useState, startTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Review } from '@/lib/supabase/types';
import { Trash2, Search, Loader2, Star, MessageSquare } from 'lucide-react';

interface ReviewUser {
  id: number;
  fullName: string | null;
  email: string | null;
  avatar: string | null;
}

interface ReviewPlace {
  id: number;
  name: string | null;
}

export default function ReviewsPage() {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<ReviewUser[]>([]);
  const [places, setPlaces] = useState<ReviewPlace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, ratingFilter]);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewsRes, usersRes, placesRes] = await Promise.all([
        supabase.from('Review').select('*').order('id', { ascending: false }),
        supabase.from('User').select('id, fullName, email, avatar'),
        supabase.from('Place').select('id, name'),
      ]);

      if (reviewsRes.error) throw reviewsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (placesRes.error) throw placesRes.error;

      setReviews(reviewsRes.data || []);
      setUsers(usersRes.data || []);
      setPlaces(placesRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from('Review').delete().eq('id', deletingId);
      if (error) throw error;
      setReviews(reviews.filter((r) => r.id !== deletingId));
      setIsDeleteOpen(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa đánh giá.');
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

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

  const filteredReviews = reviews.filter((r) => {
    const user = users.find((u) => u.id === r.userId);
    const place = places.find((p) => p.id === r.placeId);

    const matchesSearch =
      r.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating = ratingFilter === 'all' || r.rating === Number(ratingFilter);

    return matchesSearch && matchesRating;
  });

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPageNumbers = () => {
    const maxPageButtons = 5;
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = startPage + maxPageButtons - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá và góp ý</h1>
        <p className="text-gray-500 text-sm mt-1">Kiểm duyệt các bình luận và điểm xếp hạng từ người dùng</p>
      </div>

      {/* Main Panel */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-center gap-4 justify-between bg-gray-50/50">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo nhận xét, người dùng, địa điểm..."
                value={searchQuery}
                onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
                className="bg-white text-gray-900 text-sm rounded-lg pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-blue-500 transition-colors w-full"
              />
            </div>
            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => {
                const val = e.target.value;
                startTransition(() => setRatingFilter(val));
              }}
              className="bg-white text-gray-700 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-500 w-full sm:w-44 cursor-pointer font-medium"
            >
              <option value="all">Tất cả đánh giá</option>
              <option value="5">5 Sao ⭐⭐⭐⭐⭐</option>
              <option value="4">4 Sao ⭐⭐⭐⭐</option>
              <option value="3">3 Sao ⭐⭐⭐</option>
              <option value="2">2 Sao ⭐⭐</option>
              <option value="1">1 Sao ⭐</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Hiển thị: {filteredReviews.length} đánh giá
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
            <span>Đang tải danh sách đánh giá...</span>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-500">
            <p className="font-semibold">{error}</p>
            <button onClick={fetchData} className="mt-4 text-sm text-blue-600 hover:underline">
              Thử lại
            </button>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-20 text-center text-gray-400">Không có đánh giá nào phù hợp.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 bg-gray-50 border-b border-gray-200 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Người đánh giá</th>
                  <th className="px-6 py-4">Địa điểm</th>
                  <th className="px-6 py-4">Điểm & Nhận xét</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedReviews.map((review) => {
                  const user = users.find((u) => u.id === review.userId);
                  const place = places.find((p) => p.id === review.placeId);
                  return (
                    <tr key={review.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-[2.5px] bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-400 rounded-full shrink-0">
                            <div className="bg-white rounded-full p-[1.5px] w-9 h-9 overflow-hidden flex items-center justify-center text-gray-500 text-xs">
                              {user?.avatar ? (
                                <img src={user.avatar} alt="" className="object-cover w-full h-full rounded-full" />
                              ) : (
                                <div className="w-full h-full bg-gray-105 flex items-center justify-center text-gray-400 rounded-full">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{user?.fullName || 'Ẩn danh'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 text-sm max-w-[200px] truncate">
                        {place?.name || 'Địa điểm không tồn tại'}
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="flex items-center gap-2 mb-1">
                          {renderStars(review.rating || 0)}
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {review.rating}.0
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 mt-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 shadow-inner">
                          <MessageSquare size={14} className="text-gray-400 shrink-0 mt-0.5" />
                          <p className="text-gray-700 italic text-xs leading-relaxed">{review.comment || '(Không có nhận xét)'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenDelete(review.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Xóa đánh giá"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
            <div className="text-xs font-semibold text-gray-500">
              Hiển thị từ {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, filteredReviews.length)} trong tổng số {filteredReviews.length} đánh giá
            </div>
            <div className="flex items-center gap-1.5 self-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Trang trước
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Xóa đánh giá này?</h3>
              <p className="text-gray-500 text-sm mt-2">
                Nhận xét và điểm số này sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                disabled={deleteLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer shadow-sm"
              >
                {deleteLoading && <Loader2 size={16} className="animate-spin" />}
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
