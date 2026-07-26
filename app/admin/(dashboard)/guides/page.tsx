"use client";

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Search,
  Trash2,
  Calendar,
  User,
  X,
  Check,
  Loader2,
  Layers,
  MapPin,
  Eye,
  Share2,
  FileText,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface CreatorUser {
  id: number | string;
  fullName: string;
  email: string;
  avatar: string | null;
}

interface GuideItem {
  id: number | string;
  title: string;
  startDate: string;
  userId: number | string;
  destination: string;
  categories: string[];
  isGuide: boolean | null;
  coverImage: string | null;
  user?: CreatorUser;
  _count?: {
    savedPlaces: number;
  };
}

export default function GuidesPage() {
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Detail Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedGuideDetail, setSelectedGuideDetail] = useState<any>(null);

  // Export Blog Modal State
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [exportingGuide, setExportingGuide] = useState<GuideItem | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogDescription, setBlogDescription] = useState('');
  const [blogLoading, setBlogLoading] = useState(false);

  useEffect(() => {
    fetchGuides();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const fetchGuides = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/itineraries?type=guide');
      if (!res.ok) throw new Error('Không thể tải danh sách Hướng dẫn du lịch.');
      const data = await res.json();
      setGuides(data || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách Hướng dẫn.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id: number | string) => {
    setIsDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/itineraries/${id}`);
      if (!res.ok) throw new Error('Không thể lấy chi tiết Hướng dẫn.');
      const data = await res.json();
      setSelectedGuideDetail(data);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải chi tiết Hướng dẫn.', 'error');
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenExportBlog = (guide: GuideItem) => {
    setExportingGuide(guide);
    setBlogTitle(guide.title);
    setBlogDescription(`Hướng dẫn du lịch ${guide.destination} vô cùng hấp dẫn và chi tiết từ CloudMood.`);
    setIsBlogModalOpen(true);
  };

  const handleExportBlog = async () => {
    if (!exportingGuide) return;
    setBlogLoading(true);
    try {
      const res = await fetch(`/api/admin/guides/${exportingGuide.id}/publish-blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: blogTitle,
          description: blogDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể xuất bài viết Blog.');
      showToast('Đã xuất bài Hướng dẫn thành bài viết Blog (ExplorePost) thành công!', 'success');
      setIsBlogModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xuất bài Blog.', 'error');
    } finally {
      setBlogLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/itineraries/${deletingId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Không thể xóa bài Hướng dẫn.');
      setGuides(guides.filter(g => g.id !== deletingId));
      setIsDeleteOpen(false);
      showToast('Đã xóa Hướng dẫn du lịch thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa Hướng dẫn.', 'error');
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

  // Search filter
  const filteredGuides = guides.filter(g =>
    g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredGuides.length / itemsPerPage);
  const paginatedGuides = filteredGuides.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-24 right-6 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[9999] animate-in fade-in slide-in-from-top-4 duration-200 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2.5">
          <BookOpen className="text-indigo-600 dark:text-indigo-400" size={28} />
          Quản lý Hướng dẫn du lịch (Travel Guides)
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Quản lý các bài Hướng dẫn (chỉ gồm tổng quan & địa điểm lưu, không dùng Lịch trình ngày và Chi tiêu). Có thể xuất thành bài viết Blog!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <BookOpen size={120} />
          </div>
          <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider block">Tổng số Hướng dẫn</span>
          <span className="text-3xl font-extrabold block mt-2">{guides.length.toLocaleString()}</span>
          <span className="text-xs text-indigo-200 mt-1 block">Bài viết Hướng dẫn chia sẻ</span>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <MapPin size={120} />
          </div>
          <span className="text-xs font-semibold text-purple-100 uppercase tracking-wider block">Tổng Địa điểm Gợi ý</span>
          <span className="text-3xl font-extrabold block mt-2">
            {guides.reduce((acc, curr) => acc + (curr._count?.savedPlaces || 0), 0).toLocaleString()}
          </span>
          <span className="text-xs text-purple-200 mt-1 block">Trong các bảng ItinerarySavedPlace</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <FileText size={120} />
          </div>
          <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">Sẵn sàng xuất Blog</span>
          <span className="text-3xl font-extrabold block mt-2">{guides.length.toLocaleString()}</span>
          <span className="text-xs text-emerald-200 mt-1 block">Chuyển sang ExplorePost dạng Blog</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Control Bar */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, điểm đến, tác giả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-hidden text-gray-900 dark:text-slate-100 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
            <p className="text-gray-500 text-sm mt-2">Đang tải danh sách Hướng dẫn...</p>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="py-20 text-center text-gray-400">Không tìm thấy Hướng dẫn du lịch nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-950/50 text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-800">
                  <th className="px-6 py-4">Bài Hướng dẫn</th>
                  <th className="px-6 py-4">Điểm đến</th>
                  <th className="px-6 py-4 text-center">Địa điểm gợi ý</th>
                  <th className="px-6 py-4">Tác giả</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-sm">
                {paginatedGuides.map((guide) => (
                  <tr key={guide.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-gray-200 dark:border-slate-700 flex items-center justify-center">
                          {guide.coverImage ? (
                            <img src={guide.coverImage} alt={guide.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen size={22} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 dark:text-slate-100 block max-w-56 truncate">
                            {guide.title}
                          </span>
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold block">
                            📖 Hướng dẫn du lịch
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-indigo-500 shrink-0" />
                        <span className="font-semibold text-gray-900 dark:text-slate-100">{guide.destination}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-slate-100">
                      {guide._count?.savedPlaces || 0} điểm
                    </td>

                    <td className="px-6 py-4">
                      {guide.user ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden border border-gray-200 dark:border-slate-700 flex items-center justify-center">
                            {guide.user.avatar ? (
                              <img src={guide.user.avatar} alt={guide.user.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <User size={12} className="text-gray-400" />
                            )}
                          </div>
                          <span className="font-semibold text-xs text-gray-900 dark:text-slate-100">
                            {guide.user.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">N/A</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenExportBlog(guide)}
                          className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:from-indigo-500 hover:to-blue-500 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Xuất thành bài viết Blog (ExplorePost)"
                        >
                          <FileText size={14} />
                          Xuất Blog
                        </button>
                        <button
                          onClick={() => handleOpenDetail(guide.id)}
                          className="p-2 text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Xem địa điểm gợi ý trong Hướng dẫn"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(guide.id);
                            setIsDeleteOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                          title="Xóa bài Hướng dẫn"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guide Saved Places Detail Modal */}
      {isDetailOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col relative animate-in scale-in-95 duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-950/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                  {selectedGuideDetail?.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Danh sách địa điểm lưu gợi ý trong bài Hướng dẫn</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {selectedGuideDetail?.savedPlaces?.length === 0 ? (
                <p className="text-gray-400 italic text-sm">Chưa có địa điểm gợi ý.</p>
              ) : (
                selectedGuideDetail?.savedPlaces?.map((sp: any) => (
                  <div key={sp.id} className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 flex items-start gap-3">
                    <MapPin size={20} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-sm text-gray-900 dark:text-slate-100">{sp.place?.name || 'Mục ghi chú'}</h5>
                      <p className="text-xs text-gray-500 mt-1">{sp.noteText || sp.place?.address || 'Không có ghi chú thêm'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export to Blog Modal */}
      {isBlogModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative animate-in scale-in-95 duration-200 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="text-indigo-600" size={20} />
                Xuất bài Hướng dẫn thành Blog
              </h3>
              <button onClick={() => setIsBlogModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Tiêu đề bài viết Blog</label>
                <input
                  type="text"
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Mô tả tóm tắt</label>
                <textarea
                  rows={3}
                  value={blogDescription}
                  onChange={(e) => setBlogDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBlogModalOpen(false)}
                className="px-4 py-2 border border-gray-200 dark:border-slate-800 font-semibold rounded-xl text-sm text-gray-600 dark:text-slate-400"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExportBlog}
                disabled={blogLoading}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                {blogLoading && <Loader2 size={16} className="animate-spin" />}
                Xác nhận Xuất Blog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsDeleteOpen(false)} className="absolute right-4 top-4 text-gray-400"><X size={18} /></button>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><Trash2 size={20} /></div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Xác nhận xóa bài Hướng dẫn</h3>
                <p className="text-gray-500 text-sm mt-1">Bạn có chắc chắn muốn xóa bài Hướng dẫn du lịch này không?</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-sm">Hủy</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-sm flex items-center gap-2">
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
