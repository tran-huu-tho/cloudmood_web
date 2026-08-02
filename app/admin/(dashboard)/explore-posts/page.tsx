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
  Image as ImageIcon,
  Globe,
  Edit2,
  Clock,
  Share2,
  Calendar,
  Maximize2
} from 'lucide-react';
import DestinationSearchInput from '@/components/admin/DestinationSearchInput';
import AttachedPlacesManager from '@/components/admin/AttachedPlacesManager';

interface ExplorePost {
  id: number | string;
  title: string;
  description: string | null;
  coverImage: string | null;
  postType: string;
  destination: string | null;
  status: string;
  platformName?: string | null;
  platformLogo?: string | null;
  platformUrl?: string | null;
  viewCount: number;
  likeCount?: number;
  author?: {
    id: number | string;
    fullName: string;
    email: string;
    avatar: string | null;
    role?: boolean;
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
  const formatAddress = (text?: string | null) => {
    if (!text) return '';
    return text.replace(/\s*\b\d{4,6}\b/g, '').trim();
  };

  const stripLeadingEmoji = (text?: string | null) => {
    if (!text) return '';
    return text.replace(/^[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\s]+/gu, '').trim();
  };

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
  const [newCoverImage, setNewCoverImage] = useState('');
  const [newNote, setNewNote] = useState('');
  const [selectedPlaces, setSelectedPlaces] = useState<any[]>([]);
  const [allPlaces, setAllPlaces] = useState<any[]>([]);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placesLoading, setPlacesLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [fullCoverPreviewUrl, setFullCoverPreviewUrl] = useState<string | null>(null);

  const [platformName, setPlatformName] = useState('CloudMood');
  const [platformLogo, setPlatformLogo] = useState('/favicon.ico');
  const [platformUrl, setPlatformUrl] = useState('');

  const [editingBlogId, setEditingBlogId] = useState<number | string | null>(null);
  const [editingPostAuthor, setEditingPostAuthor] = useState<{ id: number | string; fullName: string; email: string; avatar: string | null } | null>(null);
  const [modalTab, setModalTab] = useState<'info' | 'places'>('info');

  const handleOpenCreateModal = () => {
    setEditingBlogId(null);
    setEditingPostAuthor(null);
    setSelectedImportGuideId('');
    setNewTitle('');
    setNewDescription('');
    setNewDestination('');
    setNewCoverImage('');
    setNewNote('');
    setPlatformName('CloudMood');
    setPlatformLogo('/favicon.ico');
    setPlatformUrl('');
    setSelectedPlaces([]);
    setModalTab('info');
    setIsCreateOpen(true);
  };

  const handleEditPostClick = (post: ExplorePost) => {
    setEditingBlogId(post.id);
    const rawAuthor = post.author || null;
    const isUser = (rawAuthor && rawAuthor.role !== true && !rawAuthor.email?.toLowerCase().includes('admin') && rawAuthor.fullName !== 'CloudMood' && rawAuthor.fullName !== 'Biên tập viên Admin' && post.postType !== 'PLATFORM_CURATION') ? rawAuthor : null;
    const author = isUser;
    setEditingPostAuthor(author);
    setSelectedImportGuideId('');
    setNewTitle(post.title || '');
    setNewDescription(post.description || '');
    setNewDestination(post.destination || '');
    setNewCoverImage(post.coverImage || '');

    if (author) {
      setPlatformName(author.fullName || post.platformName || '');
      setPlatformLogo(author.avatar || post.platformLogo || '');
      setPlatformUrl('');
    } else {
      setPlatformName(post.platformName || 'CloudMood');
      setPlatformLogo(post.platformLogo || '/favicon.ico');
      setPlatformUrl(post.platformUrl || '');
    }

    const allItems = (post.items || []).map((i: any, index: number) => {
      if (i.itemType === 'SECTION_HEADER') {
        return {
          id: `sec-${i.id || index}-${Date.now()}`,
          itemType: 'SECTION_HEADER',
          name: i.content || 'Phần nội dung',
          customContent: i.content || '',
        };
      }
      if (i.itemType === 'NOTE') {
        return {
          id: `note-${i.id || index}-${Date.now()}`,
          itemType: 'NOTE',
          name: 'Ghi chú',
          customContent: i.content || '',
          content: i.content || '',
        };
      }
      if (i.itemType === 'CHECKLIST') {
        return {
          id: `chk-${i.id || index}-${Date.now()}`,
          itemType: 'CHECKLIST',
          name: 'Danh mục công việc',
          customContent: i.content || '',
          content: i.content || '',
        };
      }
      return {
        ...(i.place || {}),
        id: i.place?.id || i.placeId || `place-${index}-${Date.now()}`,
        placeId: i.place?.id || i.placeId,
        itemType: 'PLACE',
        name: i.place?.name || i.content || 'Địa điểm bài viết',
        customContent: (i.content && i.content !== i.place?.description && i.content !== i.place?.name) ? i.content : '',
      };
    });

    setSelectedPlaces(allItems);
    setModalTab('info');
    setIsCreateOpen(true);
  };

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
          if (p.itemType === 'SECTION_HEADER') {
            items.push({
              itemType: 'SECTION_HEADER',
              content: (p.customContent && p.customContent.trim()) ? p.customContent.trim() : (p.name || 'Phần nội dung'),
            });
          } else if (p.itemType === 'NOTE') {
            items.push({
              itemType: 'NOTE',
              content: (p.customContent && p.customContent.trim()) ? p.customContent.trim() : (p.content || ''),
            });
          } else if (p.itemType === 'CHECKLIST') {
            items.push({
              itemType: 'CHECKLIST',
              content: p.customContent || p.content || '',
            });
          } else {
            items.push({
              itemType: 'PLACE',
              placeId: p.placeId || p.id,
              content: (p.customContent && p.customContent.trim()) ? p.customContent.trim() : (p.description || p.name || ''),
            });
          }
        });

        if (editingBlogId) {
          res = await fetch(`/api/admin/explore-posts/${editingBlogId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: newTitle,
              description: newDescription,
              destination: newDestination,
              coverImage: newCoverImage || selectedPlaces[0]?.image || '/logo-xoanen-cloudmood.png',
              postType: 'BLOG',
              status: 'PUBLISHED',
              platformName: editingPostAuthor ? (editingPostAuthor.fullName || null) : (platformName.trim() || null),
              platformLogo: editingPostAuthor ? (editingPostAuthor.avatar || null) : (platformLogo.trim() || null),
              platformUrl: editingPostAuthor ? null : (platformUrl.trim() || null),
              items,
            }),
          });
        } else {
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
              platformName: platformName.trim() || null,
              platformLogo: platformLogo.trim() || null,
              platformUrl: platformUrl.trim() || null,
              items,
            }),
          });
        }
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Lỗi khi tạo/xuất bài viết.');
      showToast(
        editingBlogId
          ? 'Đã cập nhật bài viết Blog thành công!'
          : selectedImportGuideId
          ? 'Đã xuất bài Hướng dẫn thành bài viết Blog thành công!'
          : 'Tạo bài viết Blog mới thành công!',
        'success'
      );
      setIsCreateOpen(false);
      setEditingBlogId(null);
      setEditingPostAuthor(null);
      setSelectedImportGuideId('');
      setNewTitle('');
      setNewDescription('');
      setNewDestination('');
      setNewCoverImage('');
      setNewNote('');
      setPlatformName('CloudMood');
      setPlatformLogo('/favicon.ico');
      setPlatformUrl('');
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
          onClick={handleOpenCreateModal}
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
                          onClick={() => handleEditPostClick(post)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa bài viết"
                        >
                          <Edit2 size={15} />
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
            {(() => {
              const coverUrl = selectedPost.coverImage || selectedPost.items?.find((i: any) => i.place?.image)?.place?.image;
              return (
                <div className="relative h-48 bg-slate-900 overflow-hidden shrink-0 group">
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-black/20" />
                  {coverUrl && (
                    <button
                      type="button"
                      onClick={() => setFullCoverPreviewUrl(coverUrl)}
                      className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full text-xs font-extrabold flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all cursor-pointer z-10 shadow-md hover:scale-105"
                    >
                      <Maximize2 size={13} /> Xem ảnh bìa
                    </button>
                  )}
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer z-10"
                  >
                    <X size={20} />
                  </button>
                  <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end text-white z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-600 text-white flex items-center gap-1 shadow-xs">
                          <BookOpen size={12} /> Bài viết Blog (ExplorePost)
                        </span>
                        {selectedPost.originalItinerary ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/80 text-white backdrop-blur-xs border border-indigo-300/30 flex items-center gap-1">
                            <BookOpen size={11} /> Từ Hướng dẫn (#{selectedPost.originalItinerary.id})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/80 text-white backdrop-blur-xs border border-emerald-300/30 flex items-center gap-1">
                            <Edit2 size={11} /> Blog trực tiếp
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-800/80 text-slate-200 border border-slate-700 flex items-center gap-1">
                          {selectedPost.status === 'PUBLISHED' || selectedPost.status === 'Công khai' ? <><CheckCircle2 size={11} className="text-emerald-400" /> Công khai</> : <><Clock size={11} className="text-amber-400" /> Bản nháp</>}
                        </span>
                      </div>
                      <h2 className="text-2xl font-extrabold tracking-wide drop-shadow-md text-white">
                        {stripLeadingEmoji(selectedPost.title)}
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
              );
            })()}

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

              <div className="flex flex-wrap items-center gap-3 text-gray-600 dark:text-slate-300 font-medium">
                <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800">
                  <Eye size={14} className="text-purple-500" /> {selectedPost.viewCount || 0} lượt xem
                </span>
                <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-bold">
                  <Heart size={14} fill="currentColor" /> {selectedPost._count?.likes || selectedPost.likeCount || 0} lượt thích
                </span>
                <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Share2 size={14} /> {(selectedPost as any).shareCount || 0} chia sẻ
                </span>
                {(selectedPost as any).createdAt && (
                  <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-500">
                    <Calendar size={14} className="text-blue-500" /> {new Date((selectedPost as any).createdAt).toLocaleDateString('vi-VN')}
                  </span>
                )}
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
                  {selectedPost.description && selectedPost.description !== 'public' && selectedPost.description !== 'draft' && selectedPost.description.trim().length > 3 && (
                    <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-xs text-gray-700 dark:text-slate-300 leading-relaxed italic relative">
                      <span className="font-bold text-purple-700 dark:text-purple-400 non-italic flex items-center gap-1.5 mb-1">
                        <FileText size={14} /> Mô tả bài viết:
                      </span>
                      "{stripLeadingEmoji(selectedPost.description)}"
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
                            <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100">{stripLeadingEmoji(sec.name)}</h4>
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
                            const review = item.featuredReview;

                            return (
                              <div key={item.id || iIdx} className="p-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 transition-all text-xs shadow-2xs space-y-2.5">
                                <div className="flex items-start gap-3">
                                  {place?.image ? (
                                    <img src={place.image} alt={place.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-slate-800" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 font-bold">
                                      <MapPin size={20} />
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <h5 className="font-bold text-sm text-gray-900 dark:text-slate-100 truncate">
                                          {place?.name || contentText || 'Địa điểm bài viết'}
                                        </h5>
                                        {place?.category?.name && (
                                          <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-[10px] rounded-md shrink-0 border border-purple-200/50">
                                            {place.category.name}
                                          </span>
                                        )}
                                      </div>
                                      {place?.rating && (
                                        <span className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-200/50 text-[11px] shrink-0">
                                          <Star size={12} fill="currentColor" /> {place.rating} {place.userRatingCount ? `(${place.userRatingCount})` : ''}
                                        </span>
                                      )}
                                    </div>

                                    {(place?.address || place?.description) && (
                                      <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">
                                        {formatAddress(place?.address) || place?.description}
                                      </p>
                                    )}

                                    <div className="flex items-center gap-3 pt-0.5 text-[11px] text-gray-400">
                                      {place?.phone && <span className="flex items-center gap-1"><Globe size={11} /> {place.phone}</span>}
                                      {place?.website && <a href={place.website} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline flex items-center gap-0.5"><Globe size={11} /> Website <ExternalLink size={10} /></a>}
                                    </div>
                                  </div>
                                </div>

                                {/* Featured Review Card */}
                                {review && (
                                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl space-y-1 text-xs">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 overflow-hidden flex items-center justify-center font-bold text-[10px] text-amber-800 shrink-0">
                                          {review.authorAvatar ? <img src={review.authorAvatar} alt="Avatar" className="w-full h-full object-cover" /> : (review.authorName || 'R')[0].toUpperCase()}
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-slate-100 text-[11px]">{review.authorName || 'Đánh giá từ du khách'}</span>
                                      </div>
                                      {review.rating && (
                                        <span className="flex items-center gap-1 font-bold text-amber-500 text-[11px]">
                                          <Star size={11} fill="currentColor" /> {review.rating}/5
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-600 dark:text-slate-300 italic pl-7 text-[11px] leading-relaxed">
                                      "{review.comment}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </>
              )}

              {activeDetailTab === 'info' && (() => {
                const isExternalSource = selectedPost.platformName && selectedPost.platformName !== 'CloudMood';

                return (
                  <div className="space-y-4">
                    {/* Header title */}
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {isExternalSource ? 'Nguồn & Bài viết gốc' : 'Thông tin Tác giả & Bài viết'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Author Card */}
                      <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 overflow-hidden flex items-center justify-center shrink-0 border border-purple-300 font-bold text-sm text-purple-600 dark:text-purple-300">
                          {selectedPost.author?.avatar ? (
                            <img src={selectedPost.author.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            (selectedPost.author?.fullName || 'A')[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-gray-900 dark:text-slate-100 block">
                            {selectedPost.author?.fullName || 'Biên tập viên Admin'}
                          </span>
                          <span className="text-[11px] text-purple-600 dark:text-purple-400 block font-semibold">
                            {selectedPost.author?.email || 'admin@cloudmood.com'} • Biên tập viên
                          </span>
                        </div>
                      </div>

                      {/* Interaction Stats */}
                      <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 space-y-1.5 text-xs">
                        <span className="font-bold text-gray-900 dark:text-slate-100 block mb-1">Thống kê tương tác & Thời gian</span>
                        <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-slate-300">
                          <span className="flex items-center gap-1"><Eye size={13} className="text-purple-500" /> Xem: <strong>{selectedPost.viewCount || 0}</strong></span>
                          <span className="flex items-center gap-1"><Heart size={13} className="text-rose-500" /> Thích: <strong>{selectedPost._count?.likes || selectedPost.likeCount || 0}</strong></span>
                          <span className="flex items-center gap-1"><Share2 size={13} className="text-emerald-500" /> Chia sẻ: <strong>{(selectedPost as any).shareCount || 0}</strong></span>
                          {(selectedPost as any).createdAt && <span className="flex items-center gap-1"><Calendar size={13} className="text-blue-500" /> Ngày: <strong>{new Date((selectedPost as any).createdAt).toLocaleDateString('vi-VN')}</strong></span>}
                        </div>
                      </div>
                    </div>

                    {/* External Source Card / User Author Card */}
                    {selectedPost.author ? (
                      <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 flex items-center gap-3">
                        {selectedPost.author.avatar ? (
                          <img src={selectedPost.author.avatar} alt={selectedPost.author.fullName} className="w-8 h-8 object-cover rounded-full border border-purple-200 shrink-0" />
                        ) : (
                          <User size={18} className="text-purple-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-gray-900 dark:text-slate-100 block">
                            Nguồn bài viết (Tác giả): {selectedPost.author.fullName}
                          </span>
                          {selectedPost.author.email && (
                            <span className="text-[11px] text-gray-500 dark:text-slate-400 block truncate">
                              {selectedPost.author.email}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (selectedPost.platformName || selectedPost.platformUrl) && (
                      <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {selectedPost.platformLogo ? (
                              <img src={selectedPost.platformLogo} alt="Platform Logo" className="w-6 h-6 object-contain rounded-full border border-purple-200 bg-white p-0.5 shrink-0" />
                            ) : (
                              <Globe size={18} className="text-purple-600 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-gray-900 dark:text-slate-100 block">
                                Nguồn bài viết: {selectedPost.platformName || 'Bên ngoài'}
                              </span>
                              {selectedPost.platformUrl && (
                                <span className="text-[11px] text-purple-600 dark:text-purple-400 truncate block">
                                  {selectedPost.platformUrl}
                                </span>
                              )}
                            </div>
                          </div>

                          {selectedPost.platformUrl && (
                            <a
                              href={selectedPost.platformUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
                            >
                              <ExternalLink size={13} /> Xem bài viết gốc
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedPost.originalItinerary && (
                      <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-indigo-900 block">📖 Xuất từ bài Hướng dẫn du lịch:</span>
                          <span className="text-indigo-700 font-semibold">{selectedPost.originalItinerary.title} (#{selectedPost.originalItinerary.id})</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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
          <form onSubmit={handleCreateBlog} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-7xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden relative">

            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-300 block mb-0.5">Biên tập nội dung</span>
                <h3 className="text-xl font-black tracking-wide flex items-center gap-2">
                  <Sparkles className="text-purple-400" size={22} />
                  {editingBlogId ? 'Chỉnh sửa Bài đăng Blog' : 'Tạo Bài đăng Blog mới'}
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

            {/* Tab Navigation */}
            <div className="px-6 pt-2 pb-0 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('info')}
                className={`px-5 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'info'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-md'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileText size={14} /> Thông tin bài viết
              </button>
              <button
                type="button"
                onClick={() => setModalTab('places')}
                className={`px-5 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'places'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-md'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <MapPin size={14} /> Cấu trúc & Địa điểm
                {selectedPlaces.length > 0 && (
                  <span className="bg-purple-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {selectedPlaces.filter((p: any) => !p.itemType || p.itemType === 'PLACE').length}
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body - Tab Content */}
            <div className="overflow-y-auto flex-1 text-xs">

              {/* TAB 1: Thông tin cơ bản */}
              {modalTab === 'info' && (
              <div className="p-6 space-y-4">
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

                  <DestinationSearchInput
                    value={newDestination}
                    onChange={setNewDestination}
                    dbPlaces={allPlaces}
                    placeholder="Nhập tên thành phố/tỉnh (VD: Cần Thơ, Đà Nẵng...)..."
                  />

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

                  {/* Platform / Source Section */}
                  {editingPostAuthor ? (
                    <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-3">
                      <label className="block text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <User size={14} /> Tác giả bài viết (Người dùng)
                        </span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Giữ nguyên thông tin người dùng làm nguồn</span>
                      </label>

                      <div className="flex items-center gap-3 p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-xl">
                        {editingPostAuthor.avatar ? (
                          <img
                            src={editingPostAuthor.avatar}
                            alt={editingPostAuthor.fullName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-purple-200 shadow-2xs shrink-0"
                            onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-200 dark:bg-purple-900 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-sm border-2 border-purple-300 shrink-0">
                            {editingPostAuthor.fullName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                            {editingPostAuthor.fullName}
                            {editingPostAuthor.email && (
                              <span className="text-[10px] font-normal text-gray-400 dark:text-slate-500 truncate">
                                ({editingPostAuthor.email})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                            Bài đăng của người dùng - Nguồn bài viết hiển thị tên và avatar của tác giả.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-3">
                      <label className="block text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Globe size={14} /> Nguồn bài viết (Source Platform)
                        </span>
                        <span className="text-[10px] text-gray-400 font-normal">Tự điền hoặc chọn mẫu có sẵn</span>
                      </label>

                      {/* Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: 'CloudMood', logo: '/favicon.ico' },
                          { name: 'Google', logo: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' },
                          { name: 'Facebook', logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968764.png' },
                          { name: 'YouTube', logo: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' },
                          { name: 'TikTok', logo: 'https://cdn-icons-png.flaticon.com/512/3046/3046124.png' },
                          { name: 'TripAdvisor', logo: 'https://cdn-icons-png.flaticon.com/512/2504/2504944.png' },
                        ].map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => {
                              setPlatformName(p.name);
                              setPlatformLogo(p.logo);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                              platformName === p.name
                                ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-950 dark:text-purple-300 shadow-2xs'
                                : 'bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:border-purple-300'
                            }`}
                          >
                            <img src={p.logo} alt={p.name} className="w-3.5 h-3.5 object-contain" />
                            {p.name}
                          </button>
                        ))}
                      </div>

                      {/* 3 Explicit Inputs: Tên Nguồn, Avatar URL, Link URL */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                        <div>
                          <input
                            type="text"
                            placeholder="Tên Nguồn (VD: Facebook...)"
                            value={platformName}
                            onChange={(e) => setPlatformName(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            placeholder="URL Avatar / Logo Nguồn..."
                            value={platformLogo}
                            onChange={(e) => setPlatformLogo(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                          {platformLogo && (
                            <img
                              src={platformLogo}
                              alt="Avatar Preview"
                              className="absolute right-2 w-5 h-5 object-contain rounded-full border border-purple-200 bg-white p-0.5 shrink-0"
                              onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                            />
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Link Nguồn (https://...)"
                            value={platformUrl}
                            onChange={(e) => setPlatformUrl(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

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

                    {/* Live Cover Preview (Clean Square Format) */}
                    {newCoverImage && (
                      <div className="flex items-center gap-4 pt-1">
                        <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-purple-300 dark:border-purple-800 group shadow-sm shrink-0 bg-slate-900">
                          <img
                            src={newCoverImage}
                            alt="Cover Preview"
                            className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                            onClick={() => setFullCoverPreviewUrl(newCoverImage)}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 pointer-events-none group-hover:pointer-events-auto">
                            <button
                              type="button"
                              onClick={() => setFullCoverPreviewUrl(newCoverImage)}
                              className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-md transition-all"
                            >
                              <Eye size={13} /> Full ảnh
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewCoverImage('')}
                              className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-md transition-all"
                            >
                              <X size={13} /> Xóa ảnh
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-slate-300 space-y-1">
                          <p className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                            <Sparkles size={14} className="text-amber-500" /> Khung xem trước vuông (1:1)
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400">
                            Ảnh bìa bài viết hiển thị chuẩn định dạng vuông bo góc hiện đại trên App & Web.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
              </div>
              )}

              {/* TAB 2: Địa điểm & Cấu trúc */}
              {modalTab === 'places' && (
              <div className="p-6 h-full">
                <AttachedPlacesManager
                  selectedPlaces={selectedPlaces}
                  onSelectedPlacesChange={setSelectedPlaces}
                  allPlaces={allPlaces}
                  onFetchPlaces={fetchPlaces}
                  destination={newDestination}
                  coverImage={newCoverImage}
                  onCoverImageChange={(url) => {
                    setNewCoverImage(url);
                    showToast('Đã đặt ảnh địa điểm làm ảnh bìa bài viết!', 'success');
                  }}
                />
              </div>
              )}

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
                {editingBlogId ? '🚀 Cập nhật Bài Blog' : '🚀 Lưu Bài Blog'}
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
      {/* Full Cover Image Preview Lightbox Modal */}
      {fullCoverPreviewUrl && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setFullCoverPreviewUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-12 right-0 flex items-center gap-3 text-white">
              <a
                href={fullCoverPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <ExternalLink size={13} /> Mở tab mới
              </a>
              <button
                type="button"
                onClick={() => setFullCoverPreviewUrl(null)}
                className="p-1.5 bg-white/20 hover:bg-rose-600 rounded-full text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <img
              src={fullCoverPreviewUrl}
              alt="Full Cover Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

    </div>
  );
}
