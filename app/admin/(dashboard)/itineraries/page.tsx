"use client";

import React, { useEffect, useState } from 'react';
import {
  Compass,
  Search,
  Trash2,
  Calendar,
  Sparkles,
  User,
  X,
  Check,
  Loader2,
  Layers,
  MapPin
} from 'lucide-react';

interface CreatorUser {
  id: number | string;
  fullName: string;
  email: string;
  avatar: string | null;
}

interface Itinerary {
  id: number | string;
  title: string;
  startDate: string;
  days: number | null;
  budget: number | null;
  userId: number | string;
  destination: string;
  companion: string | null;
  pace: string | null;
  categories: string[];
  amenities: string[];
  isGuide: boolean | null;
  isAi: boolean | null;
  coverImage: string | null;
  user?: CreatorUser;
}

export default function ItinerariesPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'manual' | 'ai'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchItineraries();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const fetchItineraries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/itineraries');
      if (!res.ok) throw new Error('Không thể tải danh sách hành trình.');
      const data = await res.json();
      setItineraries(data || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách hành trình.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (id: number | string) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/itineraries/${deletingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi xóa hành trình.');
      }
      setItineraries(itineraries.filter((i) => i.id !== deletingId));
      setIsDeleteOpen(false);
      showToast('Xóa hành trình thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa hành trình.', 'error');
      setIsDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

  // Filter and search logic
  const filteredItineraries = itineraries.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const isAiItinerary = item.isAi === true;
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'ai' && isAiItinerary) ||
      (typeFilter === 'manual' && !isAiItinerary);

    return matchesSearch && matchesType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredItineraries.length / itemsPerPage);
  const paginatedItineraries = filteredItineraries.slice(
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

  // Stats calculation
  const totalCount = itineraries.length;
  const aiCount = itineraries.filter(i => i.isAi === true).length;
  const manualCount = totalCount - aiCount;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-24 right-6 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[9999] animate-in fade-in slide-in-from-top-4 duration-200 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? (
            <Check size={18} className="shrink-0" />
          ) : (
            <X size={18} className="shrink-0" />
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Quản lý hành trình
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Quản lý và giám sát các lịch trình du lịch được tạo bởi người dùng hoặc hệ thống AI
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Stats Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <Compass size={140} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-indigo-100 uppercase tracking-wider">Tổng hành trình</span>
            <span className="p-2 bg-white/10 rounded-xl"><Layers size={20} /></span>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold">{totalCount.toLocaleString()}</span>
          </div>
          <div className="text-xs text-indigo-200 mt-2 font-medium">Tất cả hành trình trên hệ thống</div>
        </div>

        {/* AI Stats Card */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden animate-in fade-in duration-300 delay-75">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <Sparkles size={140} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-100 uppercase tracking-wider">Hành trình nhờ AI tạo</span>
            <span className="p-2 bg-white/10 rounded-xl"><Sparkles size={20} /></span>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold">{aiCount.toLocaleString()}</span>
          </div>
          <div className="text-xs text-blue-200 mt-2 font-medium">Tạo tự động bằng mô hình AI Gemini</div>
        </div>

        {/* Manual Stats Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden animate-in fade-in duration-300 delay-150">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <User size={140} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-emerald-100 uppercase tracking-wider">Hành trình tự tạo</span>
            <span className="p-2 bg-white/10 rounded-xl"><User size={20} /></span>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-extrabold">{manualCount.toLocaleString()}</span>
          </div>
          <div className="text-xs text-emerald-200 mt-2 font-medium">Người dùng tự lên lịch trình thủ công</div>
        </div>
      </div>

      {/* Filters and Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls Header */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên chuyến đi, địa điểm hoặc creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 dark:focus:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-all"
            />
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-950 p-1.5 rounded-xl self-end md:self-auto">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setTypeFilter('manual')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === 'manual'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Tự tạo
            </button>
            <button
              onClick={() => setTypeFilter('ai')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === 'ai'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              AI tạo
            </button>
          </div>
        </div>

        {/* Loading and Empty states */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-blue-600 dark:text-blue-500" size={32} />
            <span className="text-gray-500 text-sm font-medium">Đang tải danh sách hành trình...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </div>
        ) : filteredItineraries.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-slate-400 font-medium">
            Không tìm thấy hành trình phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-950/50 text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-800">
                  <th className="px-6 py-4">Hành trình</th>
                  <th className="px-6 py-4">Địa điểm</th>
                  <th className="px-6 py-4 text-center">Thời gian (Ngày)</th>
                  <th className="px-6 py-4">Chi phí ước tính</th>
                  <th className="px-6 py-4">Người tạo</th>
                  <th className="px-6 py-4">Loại hình</th>
                  <th className="px-6 py-4">Ngày bắt đầu</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-sm text-gray-700 dark:text-slate-300">
                {paginatedItineraries.map((itinerary) => {
                  const isAi = itinerary.isAi === true;
                  const formattedBudget = itinerary.budget
                    ? `${Number(itinerary.budget).toLocaleString('vi-VN')} đ`
                    : 'Chưa cập nhật';

                  const formattedDate = itinerary.startDate
                    ? new Date(itinerary.startDate).toLocaleDateString('vi-VN')
                    : 'Chưa đặt';

                  return (
                    <tr key={itinerary.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Title & Cover image */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                            {itinerary.coverImage ? (
                              <img
                                src={itinerary.coverImage}
                                alt={itinerary.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/logo-xoanen-cloudmood.png';
                                }}
                              />
                            ) : (
                              <Compass size={20} className="text-gray-400 dark:text-slate-500" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-slate-100 block max-w-48 truncate">
                              {itinerary.title}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-slate-500 block">ID: #{itinerary.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={16} className="text-gray-400 dark:text-slate-500" />
                          <span className="font-medium text-gray-900 dark:text-slate-100">{itinerary.destination}</span>
                        </div>
                      </td>

                      {/* Days */}
                      <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-slate-100">
                        {itinerary.days ? itinerary.days : '-'}
                      </td>

                      {/* Budget */}
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-slate-100">
                        {formattedBudget}
                      </td>

                      {/* Creator */}
                      <td className="px-6 py-4">
                        {itinerary.user ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden border border-gray-200 dark:border-slate-700 flex items-center justify-center">
                              {itinerary.user.avatar ? (
                                <img
                                  src={itinerary.user.avatar}
                                  alt={itinerary.user.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={14} className="text-gray-400" />
                              )}
                            </div>
                            <div className="text-xs">
                              <span className="font-semibold text-gray-900 dark:text-slate-100 block max-w-36 truncate">
                                {itinerary.user.fullName}
                              </span>
                              <span className="text-gray-400 dark:text-slate-500 block max-w-36 truncate">
                                {itinerary.user.email}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500 text-xs italic">N/A</span>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="px-6 py-4">
                        {isAi ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60 shadow-xs">
                            <Sparkles size={12} className="shrink-0" />
                            AI tạo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60 shadow-xs">
                            <User size={12} className="shrink-0" />
                            Tự tạo
                          </span>
                        )}
                      </td>

                      {/* Start Date */}
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400 dark:text-slate-500" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenDelete(itinerary.id)}
                          className="p-2 text-gray-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-100 dark:hover:border-rose-950/40"
                          title="Xóa hành trình"
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

        {/* Pagination Footer */}
        {!loading && filteredItineraries.length > 0 && (
          <div className="p-5 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredItineraries.length)} của {filteredItineraries.length} hành trình
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold rounded-lg disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Trước
              </button>
              {getPageNumbers().map(num => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    currentPage === num
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold rounded-lg disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-in scale-in-95 duration-200">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/30">
                <Trash2 size={20} />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Xác nhận xóa hành trình</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">
                  Bạn có chắc chắn muốn xóa hành trình này không? Hành động này sẽ xóa vĩnh viễn hành trình cùng với toàn bộ các chi tiết địa điểm, phần quản lý chi tiêu và các bài đăng liên quan. Thao tác này không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold rounded-xl text-sm text-gray-600 dark:text-slate-400 cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-sm shadow-rose-600/10 active:scale-95 transition-all"
              >
                {deleteLoading && <Loader2 size={16} className="animate-spin" />}
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
