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
  Circle,
  BookOpen,
  Star,
  Upload,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon
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
  likeCount?: number;
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
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'info'>('overview');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [guides, setGuides] = useState<any[]>([]);
  const [selectedImportGuideId, setSelectedImportGuideId] = useState<string>('');
  const [createLoading, setCreateLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState(false);
  const [newCoverImage, setNewCoverImage] = useState('');
  const [newNote, setNewNote] = useState('');
  const [selectedPlaces, setSelectedPlaces] = useState<any[]>([]);
  const [allPlaces, setAllPlaces] = useState<any[]>([]);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placesLoading, setPlacesLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const POPULAR_DESTINATIONS = [
    'Cần Thơ',
    'Đà Nẵng',
    'Hà Nội',
    'TP. Hồ Chí Minh',
    'Phú Quốc',
    'Đà Lạt',
    'Nha Trang',
    'Hội An',
    'Sapa',
    'Huế',
    'Quy Nhơn',
    'Vũng Tàu',
    'Phan Thiết',
  ];

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const res = await fetch('/api/admin/itineraries?type=guide');
      if (res.ok) {
        const data = await res.json();
        setGuides(data || []);
      }
    } catch (_) { }
  };

  const fetchPlaces = async () => {
    if (allPlaces.length > 0) return;
    setPlacesLoading(true);
    try {
      const res = await fetch('/api/admin/places?limit=10000');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.places || [];
        setAllPlaces(list);
      }
    } catch (e) {
      console.error('Lỗi khi tải địa điểm:', e);
    } finally {
      setPlacesLoading(false);
    }
  };

  const compressImageFile = (file: File, maxWidth = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const uploadImageToCloudinary = async (base64Str: string, folder = 'cloudmood_blogs'): Promise<string> => {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Str, folder }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Lỗi khi tải ảnh lên Cloudinary.');
    }
    const data = await res.json();
    if (!data.url) throw new Error('Không nhận được link ảnh từ Cloudinary.');
    return data.url;
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      showToast('Đang tải ảnh bìa từ máy tính...', 'success');
      const compressed = await compressImageFile(file, 1200, 0.85);
      if (compressed) {
        const url = await uploadImageToCloudinary(compressed, 'cloudmood_blogs');
        setNewCoverImage(url);
        showToast('Đã tải ảnh bìa từ máy tính thành công!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Tải ảnh bìa thất bại.', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const moveSelectedPlace = (index: number, direction: 'up' | 'down') => {
    const list = [...selectedPlaces];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setSelectedPlaces(list);
  };

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
      let res: Response;
      if (selectedImportGuideId) {
        res = await fetch(`/api/admin/guides/${selectedImportGuideId}/publish-blog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle,
            description: newDescription,
            coverImage: newCoverImage || undefined,
          }),
        });
      } else {
        const items: any[] = [];
        if (newNote.trim()) {
          items.push({
            itemType: 'NOTE',
            content: newNote.trim(),
          });
        }
        selectedPlaces.forEach((p) => {
          items.push({
            itemType: 'PLACE',
            placeId: p.id,
            content: p.name,
          });
        });

        res = await fetch('/api/admin/explore-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle,
            description: newDescription,
            destination: newDestination,
            coverImage: newCoverImage || selectedPlaces[0]?.image || '/logo-xoanen-cloudmood.png',
            postType: 'BLOG',
            status: 'PUBLISHED',
            items,
          }),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Lỗi khi tạo/xuất bài viết.');
      showToast(
        selectedImportGuideId
          ? 'Đã xuất bài Hướng dẫn thành bài viết Blog thành công!'
          : 'Tạo bài viết Blog mới thành công!',
        'success'
      );
      setIsCreateOpen(false);
      setSelectedImportGuideId('');
      setNewTitle('');
      setNewDescription('');
      setNewDestination('');
      setNewCoverImage('');
      setNewNote('');
      setSelectedPlaces([]);
      setPlaceSearchQuery('');
      fetchPosts();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo Blog.', 'error');
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
        <div className={`fixed top-24 right-6 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[9999] animate-in fade-in duration-200 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
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
          <div className="w-full">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-950/50 text-gray-500 dark:text-slate-400 text-[11px] font-bold uppercase border-b border-gray-200 dark:border-slate-800">
                  <th className="pl-4 pr-3 py-3 w-[24%]">Bài viết Blog</th>
                  <th className="px-3 py-3 w-[11%]">Điểm đến</th>
                  <th className="px-3 py-3 w-[13%]">Nguồn gốc</th>
                  <th className="px-3 py-3 text-center w-[11%]">Địa điểm gợi ý</th>
                  <th className="px-3 py-3 text-center w-[13%]">Tương tác</th>
                  <th className="px-3 py-3 w-[14%]">Tác giả</th>
                  <th className="px-3 py-3 text-center w-[7%]">Trạng thái</th>
                  <th className="pl-2 pr-5 py-3 text-center w-[7%]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-xs">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="pl-4 pr-3 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 font-bold text-xs">
                          {post.coverImage ? (
                            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                          ) : (
                            'Blog'
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-xs text-gray-900 dark:text-slate-100 block truncate leading-snug">
                            {post.title}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium block truncate">
                            #{post.id} {post.description ? `• ${post.description}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 font-semibold text-gray-900 dark:text-slate-100">
                      <span className="truncate text-xs block">{post.destination || 'Toàn quốc'}</span>
                    </td>

                    <td className="px-3 py-2.5">
                      {post.originalItinerary ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 truncate max-w-full">
                          Từ Hướng dẫn #{post.originalItinerary.id}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40 truncate">
                          Blog trực tiếp
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      <span className="font-bold text-xs text-gray-900 dark:text-slate-100">
                        {post._count?.items || 0} địa điểm
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-center text-xs font-medium text-gray-600 dark:text-slate-400">
                      <span>{post.viewCount || 0} xem • {post._count?.likes || 0} thích</span>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {post.author?.avatar ? (
                          <img
                            src={post.author.avatar}
                            alt={post.author.fullName || 'Tác giả'}
                            className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {(post.author?.fullName || 'A')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-gray-900 dark:text-slate-100 block truncate">
                            {post.author?.fullName || 'Admin'}
                          </span>
                          <span className="text-[10px] text-gray-400 block truncate">
                            {post.author?.email || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                        Công khai
                      </span>
                    </td>

                    <td className="pl-2 pr-5 py-2.5 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Xem chi tiết Blog"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(post.id);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa bài viết"
                        >
                          <Trash2 size={15} />
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
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden relative">

            {/* Banner Header with Image or Gradient */}
            <div className="relative h-44 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 overflow-hidden shrink-0">
              {(selectedPost.coverImage || selectedPost.items?.find((i: any) => i.place?.image)?.place?.image) && (
                <img
                  src={selectedPost.coverImage || selectedPost.items?.find((i: any) => i.place?.image)?.place?.image}
                  alt="Cover"
                  className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                />
              )}
              <button
                onClick={() => setIsDetailOpen(false)}
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer z-10"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end text-white">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-600 text-white flex items-center gap-1 shadow-xs">
                      <BookOpen size={12} /> Bài viết Blog (ExplorePost)
                    </span>
                    {selectedPost.originalItinerary ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/80 text-white backdrop-blur-xs border border-indigo-300/30">
                        📖 Từ Hướng dẫn (#{selectedPost.originalItinerary.id})
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/80 text-white backdrop-blur-xs border border-emerald-300/30">
                        ✍️ Blog trực tiếp
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-800/80 text-slate-200 border border-slate-700">
                      {selectedPost.status === 'PUBLISHED' || selectedPost.status === 'Công khai' ? '🟢 Công khai' : '🟡 Nháp'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-wide drop-shadow-md text-white">
                    {selectedPost.title}
                  </h2>
                </div>

                {selectedPost.destination && (
                  <div className="text-right shrink-0">
                    <span className="text-xs text-purple-200 block font-medium">Điểm đến</span>
                    <span className="text-sm font-bold text-white flex items-center gap-1 justify-end">
                      <MapPin size={14} className="text-purple-300" /> {selectedPost.destination}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sub Header info bar */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 overflow-hidden shrink-0 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-bold text-xs text-purple-600 dark:text-purple-300">
                  {selectedPost.author?.avatar ? (
                    <img src={selectedPost.author.avatar} alt="Author" className="w-full h-full object-cover" />
                  ) : (
                    (selectedPost.author?.fullName || 'A')[0].toUpperCase()
                  )}
                </div>
                <div>
                  <span className="font-bold text-gray-900 dark:text-slate-100 block">
                    {selectedPost.author?.fullName || 'Biên tập viên Admin'}
                  </span>
                  <span className="text-gray-400 block">{selectedPost.author?.email || 'admin@cloudmood.com'}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-gray-600 dark:text-slate-300 font-medium">
                <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800">
                  <Eye size={14} className="text-purple-500" /> {selectedPost.viewCount || 0} lượt xem
                </span>
                <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-bold">
                  <Heart size={14} fill="currentColor" /> {selectedPost._count?.likes || selectedPost.likeCount || 0} lượt thích
                </span>
                <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800">
                  <Layers size={14} className="text-indigo-500" /> {selectedPost.items?.length || 0} mục nội dung
                </span>
              </div>
            </div>

            {/* Sub Tabs Bar (Matching Guide Detail) */}
            <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-100/50 dark:bg-slate-950/50 px-6 pt-2 text-xs font-bold gap-2">
              <button
                onClick={() => setActiveDetailTab('overview')}
                className={`px-4 py-2.5 rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${activeDetailTab === 'overview'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                  }`}
              >
                <Layers size={14} />
                Địa điểm & Lịch trình ({selectedPost.items?.length || 0})
              </button>
              <button
                onClick={() => setActiveDetailTab('info')}
                className={`px-4 py-2.5 rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${activeDetailTab === 'info'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                  }`}
              >
                <User size={14} />
                Tác giả & Thông tin bài viết
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-white dark:bg-slate-900">
              {activeDetailTab === 'overview' && (
                <>
                  {selectedPost.description && (
                    <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-xs text-gray-700 dark:text-slate-300 leading-relaxed italic relative">
                      <span className="font-bold text-purple-700 dark:text-purple-400 non-italic block mb-1">💬 Mô tả bài viết:</span>
                      "{selectedPost.description}"
                    </div>
                  )}

                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Danh sách địa điểm & Nội dung gợi ý bài viết ({selectedPost.items?.length || 0})
                  </h4>

                  {(() => {
                    const sections: Array<{ name: string; items: any[] }> = [];
                    let currentSecName = 'Mục tổng quan';
                    let currentItems: any[] = [];

                    (selectedPost.items || []).forEach((item: any) => {
                      if (item.itemType === 'SECTION_HEADER') {
                        if (currentItems.length > 0 || sections.length > 0) {
                          sections.push({ name: currentSecName, items: currentItems });
                        }
                        currentSecName = item.content && item.content !== 'Thêm ghi chú tại đây' ? item.content : 'Phần nội dung';
                        currentItems = [];
                      } else {
                        currentItems.push(item);
                      }
                    });

                    if (currentItems.length > 0 || sections.length === 0) {
                      sections.push({ name: currentSecName, items: currentItems });
                    }

                    if (sections.length === 0 || selectedPost.items?.length === 0) {
                      return <p className="text-gray-400 italic text-sm text-center py-6">Chưa có nội dung bài viết.</p>;
                    }

                    return sections.map((sec, idx) => (
                      <div key={idx} className="border border-gray-200 dark:border-slate-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-slate-950/40 space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                              <Layers size={15} />
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100">{sec.name}</h4>
                          </div>
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-2.5 py-1 rounded-xl">
                            {sec.items.length} mục
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {sec.items.map((item: any, iIdx: number) => {
                            const isNote = item.itemType === 'NOTE';
                            const contentText = item.content && item.content !== 'Thêm ghi chú tại đây' ? item.content : null;

                            let jsonChecklist: any = null;
                            if (contentText && typeof contentText === 'string' && contentText.trim().startsWith('{')) {
                              try {
                                const parsed = JSON.parse(contentText);
                                if (parsed && (parsed.title || Array.isArray(parsed.items))) jsonChecklist = parsed;
                              } catch (e) { }
                            }

                            if (isNote) {
                              return (
                                <div key={item.id || iIdx} className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs shadow-2xs">
                                  <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 mb-1">
                                    <Sparkles size={15} />
                                    <span>Ghi chú & Mẹo từ bài viết</span>
                                  </div>
                                  <p className="text-gray-700 dark:text-slate-300 italic leading-relaxed pl-5 border-l-2 border-amber-300">
                                    {contentText || 'Ghi chú thêm từ tác giả'}
                                  </p>
                                </div>
                              );
                            }

                            if (jsonChecklist) {
                              return (
                                <div key={item.id || iIdx} className="p-4 rounded-2xl border border-purple-200/80 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 text-xs space-y-2.5">
                                  <div className="flex items-center gap-2 font-bold text-sm text-purple-900 dark:text-purple-200">
                                    <CheckSquare size={18} className="text-purple-600 shrink-0" />
                                    <span>{jsonChecklist.title || 'Danh sách gợi ý / công việc'}</span>
                                  </div>
                                  {Array.isArray(jsonChecklist.items) && jsonChecklist.items.length > 0 && (
                                    <div className="space-y-1.5 pl-6 pt-2 border-t border-purple-100 dark:border-purple-900/30">
                                      {jsonChecklist.items.map((chk: any, cIdx: number) => (
                                        <div key={cIdx} className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                          {chk.done ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" /> : <Circle size={15} className="text-gray-400 shrink-0" />}
                                          <span className={chk.done ? 'line-through text-gray-400 font-normal' : 'font-semibold'}>{chk.text}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            const place = item.place;
                            return (
                              <div key={item.id || iIdx} className="p-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 transition-all flex items-start gap-3 text-xs shadow-2xs">
                                {place?.image ? (
                                  <img src={place.image} alt={place.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-slate-800" />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 font-bold">
                                    <MapPin size={20} />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <h5 className="font-bold text-sm text-gray-900 dark:text-slate-100 truncate">
                                      {place?.name || contentText || 'Địa điểm bài viết'}
                                    </h5>
                                    {place?.rating && (
                                      <span className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-200/50 text-[11px] shrink-0">
                                        <Star size={12} fill="currentColor" /> {place.rating}
                                      </span>
                                    )}
                                  </div>

                                  {(place?.address || place?.description) && (
                                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">
                                      {place?.address || place?.description}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-3 pt-0.5 text-[11px] text-gray-400">
                                    {place?.phone && <span>📞 {place.phone}</span>}
                                    {place?.website && <a href={place.website} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline flex items-center gap-0.5">🌐 Website <ExternalLink size={10} /></a>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </>
              )}

              {activeDetailTab === 'info' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông tin Tác giả & Bài viết</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 overflow-hidden flex items-center justify-center shrink-0 border border-purple-300 font-bold text-sm text-purple-600 dark:text-purple-300">
                        {selectedPost.author?.avatar ? (
                          <img src={selectedPost.author.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          (selectedPost.author?.fullName || 'A')[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-900 dark:text-slate-100 block">{selectedPost.author?.fullName || 'Biên tập viên Admin'}</span>
                        <span className="text-[11px] text-purple-600 dark:text-purple-400 block font-semibold">{selectedPost.author?.email || 'admin@cloudmood.com'} • Biên tập viên</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 space-y-1 text-xs">
                      <span className="font-bold text-gray-900 dark:text-slate-100 block">Thống kê tương tác</span>
                      <span className="text-gray-500 block">👁️ Lượt xem: <strong>{selectedPost.viewCount || 0}</strong></span>
                      <span className="text-gray-500 block">❤️ Lượt thích: <strong>{selectedPost._count?.likes || selectedPost.likeCount || 0}</strong></span>
                    </div>
                  </div>

                  {selectedPost.originalItinerary && (
                    <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-indigo-900 block">📖 Xuất từ bài Hướng dẫn du lịch:</span>
                        <span className="text-indigo-700 font-semibold">{selectedPost.originalItinerary.title} (#{selectedPost.originalItinerary.id})</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 border border-gray-200 dark:border-slate-800 text-xs font-bold rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgraded Create Blog Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCreateBlog} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden relative">

            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-300 block mb-0.5">Biên tập nội dung</span>
                <h3 className="text-xl font-black tracking-wide flex items-center gap-2">
                  <Sparkles className="text-purple-400" size={22} />
                  Tạo Bài đăng Blog mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - 2 Column Layout */}
            <div className="p-6 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column (col-span-6): Basic Info & Cover Image */}
                <div className="lg:col-span-6 space-y-4">
                  <h4 className="font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                    <FileText size={15} /> 1. Thông tin cơ bản bài viết
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Tiêu đề Blog *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: TOP 10 địa điểm không thể bỏ lỡ tại Cần Thơ..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Điểm đến
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên thành phố/tỉnh (VD: Cần Thơ, Đà Nẵng...)..."
                      value={newDestination}
                      onFocus={() => setIsDestDropdownOpen(true)}
                      onChange={(e) => {
                        setNewDestination(e.target.value);
                        setIsDestDropdownOpen(true);
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />

                    {/* Popular Destinations Chip Pills */}
                    {isDestDropdownOpen && (
                      <div className="mt-2 p-2.5 bg-white dark:bg-slate-950 border border-purple-200 dark:border-purple-900/60 rounded-xl shadow-lg space-y-1.5 z-20">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">Gợi ý địa điểm phổ biến:</span>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                          {POPULAR_DESTINATIONS.filter(d => d.toLowerCase().includes(newDestination.toLowerCase())).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                setNewDestination(d);
                                setIsDestDropdownOpen(false);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${newDestination === d
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                                }`}
                            >
                              📍 {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Mô tả Blog
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Nhập nội dung mô tả bài viết Blog chi tiết..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-y"
                    />
                  </div>

                  {/* Cover Image Upload & URL Section */}
                  <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <ImageIcon size={15} /> Ảnh bìa bài viết (Cover Image)
                      </label>

                      {/* File Upload Button */}
                      <label className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs">
                        {uploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {uploadingCover ? 'Đang tải lên...' : 'Tải ảnh từ máy'}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingCover}
                          onChange={handleCoverFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="Hoặc dán URL ảnh bìa (https://...)..."
                      value={newCoverImage}
                      onChange={(e) => setNewCoverImage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:outline-none"
                    />

                    {/* Live Cover Preview */}
                    {newCoverImage && (
                      <div className="relative h-36 rounded-xl overflow-hidden border border-purple-200 dark:border-purple-800 group shadow-xs">
                        <img src={newCoverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setNewCoverImage('')}
                            className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <X size={14} /> Xóa ảnh bìa
                          </button>
                        </div>
                        <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                          Xem trước ảnh bìa
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (col-span-6): Attached Places List */}
                <div className="lg:col-span-6 space-y-4 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-2">
                    <h4 className="font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <MapPin size={15} /> 2. Danh sách Địa điểm đính kèm ({selectedPlaces.length})
                    </h4>
                    {selectedPlaces.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedPlaces([])}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Xóa tất cả ({selectedPlaces.length})
                      </button>
                    )}
                  </div>

                  {/* Search Place Input */}
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Gõ tên địa điểm để tìm kiếm từ DB (VD: Cần Thơ, Bánh Căn...)..."
                      value={placeSearchQuery}
                      onFocus={fetchPlaces}
                      onChange={(e) => {
                        setPlaceSearchQuery(e.target.value);
                        fetchPlaces();
                      }}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-medium text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {placeSearchQuery.trim() !== '' && (
                    <div className="max-h-56 overflow-y-auto border border-purple-200 dark:border-purple-900/50 rounded-2xl bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800 text-xs shadow-xl">
                      {allPlaces
                        .filter(
                          (p) =>
                            p.name?.toLowerCase().includes(placeSearchQuery.toLowerCase()) ||
                            p.address?.toLowerCase().includes(placeSearchQuery.toLowerCase())
                        )
                        .slice(0, 15)
                        .map((p) => {
                          const isSelected = selectedPlaces.some((sp) => sp.id === p.id);
                          return (
                            <div
                              key={p.id}
                              className="p-2.5 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {p.image ? (
                                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                                    <MapPin size={18} />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span className="font-bold text-gray-900 dark:text-slate-100 block truncate">{p.name}</span>
                                  <span className="text-[10px] text-gray-400 block truncate">{p.address || p.description}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={isSelected}
                                onClick={() => {
                                  if (!isSelected) {
                                    setSelectedPlaces([...selectedPlaces, p]);
                                    if (!newCoverImage && p.image) {
                                      setNewCoverImage(p.image);
                                    }
                                  }
                                }}
                                className={`px-3 py-1 rounded-lg font-bold text-xs shrink-0 cursor-pointer ${isSelected
                                  ? 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-2xs'
                                  }`}
                              >
                                {isSelected ? 'Đã chọn' : '+ Thêm'}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Selected Places List */}
                  {selectedPlaces.length > 0 ? (
                    <div className="space-y-2 pt-1 max-h-[380px] overflow-y-auto pr-1">
                      {selectedPlaces.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="p-3 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between text-xs transition-all hover:border-purple-300 shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {idx + 1}
                            </span>
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-purple-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                                <MapPin size={16} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-gray-900 dark:text-slate-100 truncate block">{p.name}</span>
                              {p.rating && (
                                <span className="text-amber-500 font-bold text-[11px]">⭐ {p.rating}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Quick Set Cover Button */}
                            {p.image && newCoverImage !== p.image && (
                              <button
                                type="button"
                                title="Đặt ảnh địa điểm này làm ảnh bìa bài Blog"
                                onClick={() => {
                                  setNewCoverImage(p.image);
                                  showToast(`Đã lấy ảnh "${p.name}" làm ảnh bìa Blog!`, 'success');
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
                              >
                                🖼️ Đặt bìa
                              </button>
                            )}

                            {/* Reorder Up / Down Buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveSelectedPlace(idx, 'up')}
                                className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === selectedPlaces.length - 1}
                                onClick={() => moveSelectedPlace(idx, 'down')}
                                className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown size={13} />
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => setSelectedPlaces(selectedPlaces.filter((sp) => sp.id !== p.id))}
                              className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-center text-gray-400 space-y-1">
                      <MapPin size={28} className="mx-auto text-purple-300" />
                      <p className="font-semibold text-xs text-gray-500">Chưa có địa điểm nào được đính kèm.</p>
                      <p className="text-[11px] text-gray-400">Gõ từ khóa ở trên để chọn thêm địa điểm vào bài Blog.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-950 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-5 py-2.5 border border-gray-200 dark:border-slate-800 font-bold rounded-xl text-xs text-gray-600 dark:text-slate-400 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={createLoading || uploadingCover}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {(createLoading || uploadingCover) && <Loader2 size={15} className="animate-spin" />}
                🚀 Lưu Bài Blog
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
