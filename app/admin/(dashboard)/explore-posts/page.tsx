"use client";

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Trash2,
  Plus,
  Eye,
  Heart,
  User,
  X,
  Check,
  Loader2,
  Sparkles,
  Layers,
  MapPin,
  ExternalLink,
  CheckSquare,
  CheckCircle2,
  Circle
} from 'lucide-react';

interface ExplorePost {
  id: number | string;
  title: string;
  description: string | null;
  coverImage: string | null;
  postType: string;
  destination: string | null;
  status: string;
  viewCount: number;
  author?: {
    id: number | string;
    fullName: string;
    email: string;
    avatar: string | null;
  };
  originalItinerary?: {
    id: number | string;
    title: string;
    isGuide: boolean;
  };
  _count?: {
    items: number;
    likes: number;
  };
  items?: any[];
}

export default function ExplorePostsPage() {
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ExplorePost | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newCoverImage, setNewCoverImage] = useState('');

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/explore-posts');
      if (!res.ok) throw new Error('Không thể tải danh sách bài viết Blog.');
      const data = await res.json();
      setPosts(data || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách bài viết.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề bài viết.', 'error');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch('/api/admin/explore-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          destination: newDestination,
          coverImage: newCoverImage || '/logo-xoanen-cloudmood.png',
          postType: 'BLOG',
          status: 'PUBLISHED',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi tạo bài viết.');
      showToast('Tạo bài viết Blog mới thành công!', 'success');
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewDestination('');
      setNewCoverImage('');
      fetchPosts();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo bài viết.', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/explore-posts/${deletingId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Lỗi khi xóa bài viết.');
      setPosts(posts.filter(p => p.id !== deletingId));
      setIsDeleteOpen(false);
      showToast('Đã xóa bài viết thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa bài viết.', 'error');
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

  const filteredPosts = posts.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.author?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-24 right-6 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[9999] animate-in fade-in duration-200 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2.5">
            <FileText className="text-blue-600 dark:text-blue-400" size={28} />
            Quản lý Bài viết & Blog (ExplorePost)
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Quản lý các bài viết trên trang Khám phá, bài viết chuyển đổi từ Hướng dẫn du lịch hoặc Blog do Admin tạo
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          Tạo bài Blog mới
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <FileText size={120} />
          </div>
          <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider block">Tổng bài viết Blog</span>
          <span className="text-3xl font-extrabold block mt-2">{posts.length.toLocaleString()}</span>
          <span className="text-xs text-blue-200 mt-1 block">Bài đăng công khai trên Explore</span>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <Heart size={120} />
          </div>
          <span className="text-xs font-semibold text-rose-100 uppercase tracking-wider block">Tổng lượt thích (Like)</span>
          <span className="text-3xl font-extrabold block mt-2">
            {posts.reduce((acc, curr) => acc + (curr._count?.likes || 0), 0).toLocaleString()}
          </span>
          <span className="text-xs text-rose-200 mt-1 block">Tương tác từ người dùng</span>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <Eye size={120} />
          </div>
          <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider block">Tổng lượt xem</span>
          <span className="text-3xl font-extrabold block mt-2">
            {posts.reduce((acc, curr) => acc + (curr.viewCount || 0), 0).toLocaleString()}
          </span>
          <span className="text-xs text-amber-200 mt-1 block">Lượt truy cập bài viết</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Search Bar */}
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

        {/* Content Table */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
            <p className="text-gray-500 text-sm mt-2">Đang tải danh sách bài viết...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center text-gray-400">Không tìm thấy bài viết nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-950/50 text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-800">
                  <th className="px-6 py-4">Bài viết</th>
                  <th className="px-6 py-4">Điểm đến</th>
                  <th className="px-6 py-4">Nguồn gốc</th>
                  <th className="px-6 py-4 text-center">Nội dung / Lượt thích</th>
                  <th className="px-6 py-4">Tác giả</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-sm">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-gray-200 dark:border-slate-700 flex items-center justify-center">
                          {post.coverImage ? (
                            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                          ) : (
                            <FileText size={22} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 dark:text-slate-100 block max-w-56 truncate">
                            {post.title}
                          </span>
                          <span className="text-xs text-gray-400 block max-w-56 truncate">
                            {post.description || 'Chưa có mô tả'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-blue-500 shrink-0" />
                        <span className="font-semibold text-gray-900 dark:text-slate-100">{post.destination || 'Toàn quốc'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {post.originalItinerary ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
                          📖 Từ Hướng dẫn (#{post.originalItinerary.id})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                          ✍️ Admin / Blog trực tiếp
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="space-y-0.5 text-xs">
                        <span className="font-bold text-gray-900 dark:text-slate-100 block">{post._count?.items || 0} mục nội dung</span>
                        <span className="text-rose-600 font-semibold block flex items-center justify-center gap-1">
                          <Heart size={12} fill="currentColor" /> {post._count?.likes || 0} thích
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {post.author ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden border border-gray-200 dark:border-slate-700 flex items-center justify-center">
                            {post.author.avatar ? (
                              <img src={post.author.avatar} alt={post.author.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <User size={12} className="text-gray-400" />
                            )}
                          </div>
                          <span className="font-semibold text-xs text-gray-900 dark:text-slate-100">
                            {post.author.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">System / Admin</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setIsDetailOpen(true);
                          }}
                          className="p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                          title="Xem nội dung chi tiết bài viết"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(post.id);
                            setIsDeleteOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Xóa bài viết"
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

      {/* Detail Modal */}
      {isDetailOpen && selectedPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col relative animate-in scale-in-95 duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{selectedPost.title}</h3>
              <button onClick={() => setIsDetailOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{selectedPost.description}</p>
              <h4 className="text-xs font-bold text-gray-400 uppercase">Mục nội dung bài viết ({selectedPost.items?.length || 0})</h4>
              <div className="space-y-2.5">
                {selectedPost.items?.map((item: any) => {
                  let jsonChecklist: any = null;
                  if (item.content && typeof item.content === 'string' && item.content.trim().startsWith('{')) {
                    try {
                      const parsed = JSON.parse(item.content);
                      if (parsed && (parsed.title || Array.isArray(parsed.items))) {
                        jsonChecklist = parsed;
                      }
                    } catch (e) {}
                  }

                  if (jsonChecklist) {
                    return (
                      <div key={item.id} className="p-3.5 rounded-xl border border-purple-200/80 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-bold text-sm text-purple-800 dark:text-purple-300">
                          <CheckSquare size={16} className="text-purple-600 shrink-0" />
                          <span>{jsonChecklist.title || 'Danh sách công việc'}</span>
                        </div>
                        {Array.isArray(jsonChecklist.items) && jsonChecklist.items.length > 0 && (
                          <div className="space-y-1.5 pl-6 pt-1 border-t border-purple-100 dark:border-purple-900/30">
                            {jsonChecklist.items.map((chk: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                {chk.done ? (
                                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle size={14} className="text-gray-400 shrink-0" />
                                )}
                                <span className={chk.done ? 'line-through text-gray-400 font-normal' : 'font-medium'}>
                                  {chk.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-xs">
                      <span className="font-bold text-blue-600 block mb-1">Loại: {item.itemType}</span>
                      <p className="text-gray-800 dark:text-slate-200">{item.content || item.place?.name || 'Mục hình ảnh/địa điểm'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCreateBlog} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="text-blue-600" size={20} />
                Tạo bài Blog mới
              </h3>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Tiêu đề Blog *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bí kíp du lịch Đà Nẵng 3 ngày 2 đêm tự túc..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Điểm đến</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đà Nẵng"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Ảnh bìa (URL)</label>
                <input
                  type="text"
                  placeholder="https://example.com/cover.jpg"
                  value={newCoverImage}
                  onChange={(e) => setNewCoverImage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Mô tả bài viết</label>
                <textarea
                  rows={3}
                  placeholder="Nhập mô tả tóm tắt..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border border-gray-200 dark:border-slate-800 font-semibold rounded-xl text-sm text-gray-600 dark:text-slate-400"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                {createLoading && <Loader2 size={16} className="animate-spin" />}
                Tạo Bài Blog
              </button>
            </div>
          </form>
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
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Xác nhận xóa bài viết Blog</h3>
                <p className="text-gray-500 text-sm mt-1">Bạn có chắc chắn muốn xóa bài viết này không?</p>
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
