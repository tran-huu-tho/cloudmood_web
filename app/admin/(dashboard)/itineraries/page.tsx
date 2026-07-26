"use client";

import React, { useEffect, useState } from 'react';
import {
  Compass,
  BookOpen,
  FileText,
  CheckSquare,
  Search,
  Trash2,
  Calendar,
  Sparkles,
  User,
  X,
  Check,
  Loader2,
  Layers,
  MapPin,
  Eye,
  DollarSign,
  Users,
  Clock,
  Plus,
  Heart,
  FolderPlus,
  Briefcase,
  Edit2,
  Share2,
  Tag,
  Star,
  CheckCircle2,
  Circle,
  ExternalLink,
  ShieldCheck,
  Mail,
  Send,
  AlertCircle
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
  _count?: {
    savedPlaces: number;
    details: number;
    expenses: number;
    members: number;
  };
  expenses?: { amount: number; category?: string }[];
}

interface ExplorePost {
  id: number | string;
  title: string;
  description: string | null;
  coverImage: string | null;
  postType: string;
  destination: string | null;
  status: string;
  viewCount: number;
  author?: CreatorUser;
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

interface ChecklistItem {
  id: number | string;
  categoryId: number | string;
  name: string;
}

interface ChecklistCategory {
  id: number | string;
  name: string;
  tabType: string;
  items: ChecklistItem[];
}

export default function ItinerariesPage() {
  // Helper to remove zip/postal codes (e.g. 94100, 65000, 900000) from address strings
  const formatAddress = (text?: string | null) => {
    if (!text) return '';
    return text.replace(/\s*\b\d{4,6}\b/g, '').trim();
  };

  // Main Tab State
  const [mainTab, setMainTab] = useState<'trips' | 'guides' | 'blogs' | 'checklists'>('trips');

  // Shared Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // ==========================================
  // TAB 1: CHUYẾN ĐI (TRIPS) STATE & LOGIC
  // ==========================================
  const [trips, setTrips] = useState<Itinerary[]>([]);
  const [tripsSearch, setTripsSearch] = useState('');
  const [tripsFilter, setTripsFilter] = useState<'all' | 'manual' | 'ai'>('all');
  const [tripsLoading, setTripsLoading] = useState(false);

  const [isTripDetailOpen, setIsTripDetailOpen] = useState(false);
  const [tripDetailLoading, setTripDetailLoading] = useState(false);
  const [selectedTripDetail, setSelectedTripDetail] = useState<any>(null);
  const [tripDetailActiveTab, setTripDetailActiveTab] = useState<'days' | 'overview' | 'expenses' | 'members'>('days');

  const [isDeleteTripOpen, setIsDeleteTripOpen] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState<number | string | null>(null);
  const [deleteTripLoading, setDeleteTripLoading] = useState(false);

  const fetchTrips = async () => {
    setTripsLoading(true);
    try {
      const res = await fetch('/api/admin/itineraries?type=trip');
      if (!res.ok) throw new Error('Không thể tải danh sách chuyến đi.');
      const data = await res.json();
      setTrips(data || []);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải chuyến đi.', 'error');
    } finally {
      setTripsLoading(false);
    }
  };

  const handleOpenTripDetail = async (id: number | string) => {
    setIsTripDetailOpen(true);
    setTripDetailLoading(true);
    setTripDetailActiveTab('days');
    try {
      const res = await fetch(`/api/admin/itineraries/${id}`);
      if (!res.ok) throw new Error('Lỗi khi lấy thông tin chi tiết chuyến đi.');
      const data = await res.json();
      setSelectedTripDetail(data);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải chi tiết chuyến đi.', 'error');
      setIsTripDetailOpen(false);
    } finally {
      setTripDetailLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!deletingTripId) return;
    setDeleteTripLoading(true);
    try {
      const res = await fetch(`/api/admin/itineraries/${deletingTripId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Không thể xóa chuyến đi.');
      setTrips(trips.filter(t => t.id !== deletingTripId));
      setIsDeleteTripOpen(false);
      showToast('Xóa chuyến đi thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa chuyến đi.', 'error');
    } finally {
      setDeleteTripLoading(false);
      setDeletingTripId(null);
    }
  };

  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.title?.toLowerCase().includes(tripsSearch.toLowerCase()) ||
      t.destination?.toLowerCase().includes(tripsSearch.toLowerCase()) ||
      t.user?.fullName?.toLowerCase().includes(tripsSearch.toLowerCase());
    const isAi = t.isAi === true;
    const matchesType =
      tripsFilter === 'all' ||
      (tripsFilter === 'ai' && isAi) ||
      (tripsFilter === 'manual' && !isAi);
    return matchesSearch && matchesType;
  });

  // ==========================================
  // TAB 2: HƯỚNG DẪN DU LỊCH (GUIDES) STATE & LOGIC
  // ==========================================
  const [guides, setGuides] = useState<Itinerary[]>([]);
  const [guidesSearch, setGuidesSearch] = useState('');
  const [guidesLoading, setGuidesLoading] = useState(false);

  const [isGuideDetailOpen, setIsGuideDetailOpen] = useState(false);
  const [guideDetailLoading, setGuideDetailLoading] = useState(false);
  const [selectedGuideDetail, setSelectedGuideDetail] = useState<any>(null);

  const [isExportBlogOpen, setIsExportBlogOpen] = useState(false);
  const [exportingGuide, setExportingGuide] = useState<Itinerary | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogDescription, setBlogDescription] = useState('');
  const [exportBlogLoading, setExportBlogLoading] = useState(false);

  const fetchGuides = async () => {
    setGuidesLoading(true);
    try {
      const res = await fetch('/api/admin/itineraries?type=guide');
      if (!res.ok) throw new Error('Không thể tải danh sách Hướng dẫn.');
      const data = await res.json();
      setGuides(data || []);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải Hướng dẫn.', 'error');
    } finally {
      setGuidesLoading(false);
    }
  };

  const handleOpenGuideDetail = async (id: number | string) => {
    setIsGuideDetailOpen(true);
    setGuideDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/itineraries/${id}`);
      if (!res.ok) throw new Error('Lỗi khi tải thông tin Hướng dẫn.');
      const data = await res.json();
      setSelectedGuideDetail(data);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải Hướng dẫn.', 'error');
      setIsGuideDetailOpen(false);
    } finally {
      setGuideDetailLoading(false);
    }
  };

  const handleOpenExportBlog = (g: Itinerary) => {
    setExportingGuide(g);
    setBlogTitle(g.title);
    setBlogDescription(`Hướng dẫn du lịch ${g.destination} vô cùng chi tiết từ CloudMood.`);
    setIsExportBlogOpen(true);
  };

  const handleExportBlog = async () => {
    if (!exportingGuide) return;
    setExportBlogLoading(true);
    try {
      const res = await fetch(`/api/admin/guides/${exportingGuide.id}/publish-blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: blogTitle, description: blogDescription }),
      });
      if (!res.ok) throw new Error('Không thể xuất bài viết Blog.');
      showToast('Đã xuất bài Hướng dẫn thành bài viết Blog (ExplorePost) thành công!', 'success');
      setIsExportBlogOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xuất bài Blog.', 'error');
    } finally {
      setExportBlogLoading(false);
    }
  };

  const filteredGuides = guides.filter(g =>
    g.title?.toLowerCase().includes(guidesSearch.toLowerCase()) ||
    g.destination?.toLowerCase().includes(guidesSearch.toLowerCase()) ||
    g.user?.fullName?.toLowerCase().includes(guidesSearch.toLowerCase())
  );

  // ==========================================
  // TAB 3: BÀI VIẾT & BLOG (EXPLORE POSTS) STATE & LOGIC
  // ==========================================
  const [blogs, setBlogs] = useState<ExplorePost[]>([]);
  const [blogsSearch, setBlogsSearch] = useState('');
  const [blogsLoading, setBlogsLoading] = useState(false);

  const [isBlogDetailOpen, setIsBlogDetailOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<ExplorePost | null>(null);

  const [isCreateBlogOpen, setIsCreateBlogOpen] = useState(false);
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogDesc, setNewBlogDesc] = useState('');
  const [newBlogDest, setNewBlogDest] = useState('');
  const [newBlogCover, setNewBlogCover] = useState('');
  const [createBlogLoading, setCreateBlogLoading] = useState(false);

  const [isDeleteBlogOpen, setIsDeleteBlogOpen] = useState(false);
  const [deletingBlogId, setDeletingBlogId] = useState<number | string | null>(null);
  const [deleteBlogLoading, setDeleteBlogLoading] = useState(false);

  const fetchBlogs = async () => {
    setBlogsLoading(true);
    try {
      const res = await fetch('/api/admin/explore-posts');
      if (!res.ok) throw new Error('Không thể tải bài viết Blog.');
      const data = await res.json();
      setBlogs(data || []);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải Blog.', 'error');
    } finally {
      setBlogsLoading(false);
    }
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề bài viết.', 'error');
      return;
    }
    setCreateBlogLoading(true);
    try {
      const res = await fetch('/api/admin/explore-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBlogTitle,
          description: newBlogDesc,
          destination: newBlogDest,
          coverImage: newBlogCover || '/logo-xoanen-cloudmood.png',
          postType: 'BLOG',
          status: 'PUBLISHED',
        }),
      });
      if (!res.ok) throw new Error('Lỗi khi tạo bài Blog.');
      showToast('Tạo bài Blog thành công!', 'success');
      setIsCreateBlogOpen(false);
      setNewBlogTitle('');
      setNewBlogDesc('');
      setNewBlogDest('');
      setNewBlogCover('');
      fetchBlogs();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo Blog.', 'error');
    } finally {
      setCreateBlogLoading(false);
    }
  };

  const handleDeleteBlog = async () => {
    if (!deletingBlogId) return;
    setDeleteBlogLoading(true);
    try {
      const res = await fetch(`/api/admin/explore-posts/${deletingBlogId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Lỗi khi xóa bài Blog.');
      setBlogs(blogs.filter(b => b.id !== deletingBlogId));
      setIsDeleteBlogOpen(false);
      showToast('Đã xóa bài viết thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa bài viết.', 'error');
    } finally {
      setDeleteBlogLoading(false);
      setDeletingBlogId(null);
    }
  };

  const filteredBlogs = blogs.filter(b =>
    b.title?.toLowerCase().includes(blogsSearch.toLowerCase()) ||
    b.destination?.toLowerCase().includes(blogsSearch.toLowerCase()) ||
    b.author?.fullName?.toLowerCase().includes(blogsSearch.toLowerCase())
  );

  // ==========================================
  // TAB 4: CHECKLIST VẬT DỤNG CẦN THIẾT STATE & LOGIC
  // ==========================================
  const [checklists, setChecklists] = useState<ChecklistCategory[]>([]);
  const [checklistsLoading, setChecklistsLoading] = useState(false);

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ChecklistCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catTabType, setCatTabType] = useState('GENERAL');
  const [catLoading, setCatLoading] = useState(false);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<number | string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemLoading, setItemLoading] = useState(false);

  const fetchChecklists = async () => {
    setChecklistsLoading(true);
    try {
      const res = await fetch('/api/admin/checklist-templates');
      if (!res.ok) throw new Error('Không thể tải danh mục vật dụng.');
      const data = await res.json();
      setChecklists(data || []);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải vật dụng mẫu.', 'error');
    } finally {
      setChecklistsLoading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setCatLoading(true);
    try {
      if (editingCat) {
        const res = await fetch(`/api/admin/checklist-templates/categories/${editingCat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catName, tabType: catTabType }),
        });
        if (!res.ok) throw new Error('Lỗi cập nhật danh mục.');
        showToast('Cập nhật danh mục thành công!', 'success');
      } else {
        const res = await fetch('/api/admin/checklist-templates/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catName, tabType: catTabType }),
        });
        if (!res.ok) throw new Error('Lỗi tạo danh mục.');
        showToast('Tạo danh mục mới thành công!', 'success');
      }
      setIsCatModalOpen(false);
      fetchChecklists();
    } catch (err: any) {
      showToast(err.message || 'Thao tác thất bại.', 'error');
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number | string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này cùng toàn bộ vật dụng bên trong không?')) return;
    try {
      const res = await fetch(`/api/admin/checklist-templates/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Lỗi khi xóa danh mục.');
      showToast('Xóa danh mục thành công!', 'success');
      fetchChecklists();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa.', 'error');
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !selectedCatId) return;
    setItemLoading(true);
    try {
      const res = await fetch('/api/admin/checklist-templates/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: selectedCatId, name: itemName }),
      });
      if (!res.ok) throw new Error('Lỗi thêm vật dụng.');
      showToast('Thêm vật dụng thành công!', 'success');
      setIsItemModalOpen(false);
      fetchChecklists();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi thêm vật dụng.', 'error');
    } finally {
      setItemLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number | string) => {
    try {
      const res = await fetch(`/api/admin/checklist-templates/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Lỗi khi xóa vật dụng.');
      showToast('Xóa vật dụng thành công!', 'success');
      fetchChecklists();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa.', 'error');
    }
  };

  // Master Initial Fetch
  useEffect(() => {
    if (mainTab === 'trips') fetchTrips();
    else if (mainTab === 'guides') fetchGuides();
    else if (mainTab === 'blogs') fetchBlogs();
    else if (mainTab === 'checklists') fetchChecklists();
  }, [mainTab]);

  return (
    <div className="space-y-6">
      {/* Toast */}
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Quản lý hành trình
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Hệ thống quản lý tập trung các Chuyến đi (AI & Tự tạo), Hướng dẫn du lịch, Bài viết Blog và Vật dụng cần thiết
        </p>
      </div>

      {/* Main Top Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-xs gap-1">
        <button
          onClick={() => setMainTab('trips')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mainTab === 'trips'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          Chuyến đi (Trips)
        </button>

        <button
          onClick={() => setMainTab('guides')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mainTab === 'guides'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          Hướng dẫn du lịch
        </button>

        <button
          onClick={() => setMainTab('blogs')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mainTab === 'blogs'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          Bài viết & Blog
        </button>

        <button
          onClick={() => setMainTab('checklists')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mainTab === 'checklists'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          Vật dụng cần thiết
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CHUYẾN ĐI (TRIPS) */}
      {/* ========================================================================= */}
      {mainTab === 'trips' && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-xs">
              <span className="text-xs font-semibold uppercase text-indigo-100 block">Tổng chuyến đi</span>
              <span className="text-2xl font-extrabold block mt-1">{trips.length.toLocaleString()}</span>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-xs">
              <span className="text-xs font-semibold uppercase text-blue-100 block">AI tự ren</span>
              <span className="text-2xl font-extrabold block mt-1">
                {trips.filter(t => t.isAi === true).length.toLocaleString()}
              </span>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-xs">
              <span className="text-xs font-semibold uppercase text-emerald-100 block">Tự tạo</span>
              <span className="text-2xl font-extrabold block mt-1">
                {trips.filter(t => !t.isAi).length.toLocaleString()}
              </span>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-xs">
              <span className="text-xs font-semibold uppercase text-amber-100 block">Tổng thực chi ghi nhận</span>
              <span className="text-xl font-extrabold block mt-1">
                {trips.reduce((sum, t) => sum + (t.expenses?.reduce((a, b) => a + (b.amount || 0), 0) || 0), 0).toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm chuyến đi, điểm đến, creator..."
                  value={tripsSearch}
                  onChange={(e) => setTripsSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-hidden text-gray-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-950 p-1 rounded-xl">
                <button
                  onClick={() => setTripsFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${tripsFilter === 'all' ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-xs' : 'text-gray-500'}`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setTripsFilter('manual')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${tripsFilter === 'manual' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500'}`}
                >
                  Tự tạo
                </button>
                <button
                  onClick={() => setTripsFilter('ai')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${tripsFilter === 'ai' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500'}`}
                >
                  AI tự ren
                </button>
              </div>
            </div>

            {tripsLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
                <p className="text-xs text-gray-500 mt-2">Đang tải danh sách chuyến đi...</p>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="py-16 text-center text-gray-400">Không tìm thấy chuyến đi nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-slate-950/50 text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-800">
                      <th className="px-6 py-3.5">Chuyến đi</th>
                      <th className="px-6 py-3.5">Điểm đến</th>
                      <th className="px-6 py-3.5 text-center">Lịch trình</th>
                      <th className="px-6 py-3.5">Dự toán / Thực chi</th>
                      <th className="px-6 py-3.5">Người tạo</th>
                      <th className="px-6 py-3.5">Loại hình</th>
                      <th className="px-6 py-3.5 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-sm">
                    {filteredTrips.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-gray-200 dark:border-slate-700 flex items-center justify-center">
                              {t.coverImage ? (
                                <img src={t.coverImage} alt={t.title} className="w-full h-full object-cover" />
                              ) : (
                                <Compass size={20} className="text-gray-400" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 dark:text-slate-100 block max-w-48 truncate">{t.title}</span>
                              <span className="text-[11px] text-gray-400 block">ID: #{t.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-3.5 font-semibold text-gray-900 dark:text-slate-100">
                          {t.destination}
                        </td>

                        <td className="px-6 py-3.5 text-center">
                          <span className="font-bold block">{t.days ? `${t.days} ngày` : 'Tự do'}</span>
                          <span className="text-xs text-gray-400 block">{t._count?.details || 0} mục lịch trình</span>
                        </td>

                        <td className="px-6 py-3.5 text-xs space-y-0.5">
                          <span className="block text-gray-500">Dự toán: <strong>{t.budget ? `${t.budget.toLocaleString('vi-VN')} đ` : 'Chưa đặt'}</strong></span>
                          <span className="block text-emerald-600 font-semibold">Ghi nhận: {(t.expenses?.reduce((a, b) => a + (b.amount || 0), 0) || 0).toLocaleString('vi-VN')} đ</span>
                        </td>

                        <td className="px-6 py-3.5">
                          <span className="font-semibold text-xs text-gray-900 dark:text-slate-100 block">{t.user?.fullName || 'N/A'}</span>
                          <span className="text-[11px] text-indigo-600 block">{t._count?.members || 1} thành viên</span>
                        </td>

                        <td className="px-6 py-3.5">
                          {t.isAi ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700">
                              <Sparkles size={12} /> AI tự ren
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">
                              <User size={12} /> Tự tạo
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenTripDetail(t.id)}
                              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Xem chi tiết Lịch trình & Chi tiêu"
                            >
                              <Eye size={14} />
                              Xem chi tiết
                            </button>
                            <button
                              onClick={() => { setDeletingTripId(t.id); setIsDeleteTripOpen(true); }}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                              title="Xóa chuyến đi"
                            >
                              <Trash2 size={16} />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HƯỚNG DẪN DU LỊCH (GUIDES) */}
      {/* ========================================================================= */}
      {mainTab === 'guides' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium">
            💡 <strong>Lưu ý nghiệp vụ:</strong> Bài Hướng dẫn du lịch chỉ sử dụng bảng <code>Itinerary</code> và <code>ItinerarySavedPlace</code> (địa điểm lưu tổng quan). Bài Hướng dẫn <strong>không có Lịch trình theo ngày (ItineraryDetail)</strong> và <strong>không có Quản lý chi tiêu (ItineraryExpense)</strong>.
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm bài Hướng dẫn du lịch..."
                  value={guidesSearch}
                  onChange={(e) => setGuidesSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm"
                />
              </div>
            </div>

            {guidesLoading ? (
              <div className="py-16 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></div>
            ) : filteredGuides.length === 0 ? (
              <div className="py-16 text-center text-gray-400">Không tìm thấy bài Hướng dẫn nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-slate-950/50 text-gray-500 text-xs font-bold uppercase border-b border-gray-200 dark:border-slate-800">
                      <th className="px-6 py-3.5">Bài Hướng dẫn</th>
                      <th className="px-6 py-3.5">Điểm đến</th>
                      <th className="px-6 py-3.5 text-center">Địa điểm gợi ý</th>
                      <th className="px-6 py-3.5">Tác giả</th>
                      <th className="px-6 py-3.5 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredGuides.map((g) => (
                      <tr key={g.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20">
                        <td className="px-6 py-3.5 font-bold text-gray-900 dark:text-slate-100">{g.title}</td>
                        <td className="px-6 py-3.5 font-semibold text-gray-900 dark:text-slate-100">{g.destination}</td>
                        <td className="px-6 py-3.5 text-center font-bold">{g._count?.savedPlaces || 0} điểm</td>
                        <td className="px-6 py-3.5 font-semibold text-xs">{g.user?.fullName || 'N/A'}</td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenGuideDetail(g.id)}
                              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={14} />
                              Xem chi tiết
                            </button>
                            <button onClick={() => handleOpenExportBlog(g)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer">Xuất Blog</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BÀI VIẾT & BLOG (EXPLORE POSTS) */}
      {/* ========================================================================= */}
      {mainTab === 'blogs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Danh sách bài viết ExplorePost & Blog</h3>
            <button onClick={() => setIsCreateBlogOpen(true)} className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
              <Plus size={16} /> Tạo Blog mới
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800">
              <input
                type="text"
                placeholder="Tìm bài viết Blog..."
                value={blogsSearch}
                onChange={(e) => setBlogsSearch(e.target.value)}
                className="w-full md:w-96 px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm"
              />
            </div>

            {blogsLoading ? (
              <div className="py-16 text-center"><Loader2 className="animate-spin text-purple-600 mx-auto" size={32} /></div>
            ) : filteredBlogs.length === 0 ? (
              <div className="py-16 text-center text-gray-400">Không có bài viết Blog nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-slate-950/50 text-gray-500 text-xs font-bold uppercase border-b border-gray-200 dark:border-slate-800">
                      <th className="px-6 py-3.5">Bài viết</th>
                      <th className="px-6 py-3.5">Điểm đến</th>
                      <th className="px-6 py-3.5">Nguồn</th>
                      <th className="px-6 py-3.5 text-center">Nội dung / Lượt thích</th>
                      <th className="px-6 py-3.5 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredBlogs.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20">
                        <td className="px-6 py-3.5 font-bold text-gray-900 dark:text-slate-100">{b.title}</td>
                        <td className="px-6 py-3.5 font-semibold">{b.destination || 'Toàn quốc'}</td>
                        <td className="px-6 py-3.5">
                          {b.originalItinerary ? (
                            <span className="text-xs text-indigo-600 font-bold">Từ Hướng dẫn (#{b.originalItinerary.id})</span>
                          ) : (
                            <span className="text-xs text-emerald-600 font-bold">Blog trực tiếp</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-center text-xs font-semibold">
                          {b._count?.items || 0} mục • ❤️ {b._count?.likes || 0}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => { setSelectedBlog(b); setIsBlogDetailOpen(true); }}
                              className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={14} />
                              Xem chi tiết
                            </button>
                            <button onClick={() => { setDeletingBlogId(b.id); setIsDeleteBlogOpen(true); }} className="p-1.5 text-gray-400 hover:text-rose-600"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VẬT DỤNG CẦN THIẾT (CHECKLIST TEMPLATES) */}
      {/* ========================================================================= */}
      {mainTab === 'checklists' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Danh mục & Gợi ý vật dụng hành lý</h3>
            <button onClick={() => { setEditingCat(null); setCatName(''); setCatTabType('GENERAL'); setIsCatModalOpen(true); }} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
              <FolderPlus size={16} /> Thêm danh mục
            </button>
          </div>

          {checklistsLoading ? (
            <div className="py-16 text-center"><Loader2 className="animate-spin text-emerald-600 mx-auto" size={32} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {checklists.map((cat) => (
                <div key={cat.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-slate-100">{cat.name}</h4>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase">{cat.tabType || 'GENERAL'}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingCat(cat); setCatName(cat.name); setCatTabType(cat.tabType); setIsCatModalOpen(true); }} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 text-gray-400 hover:text-rose-600"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="py-3 space-y-1.5 max-h-48 overflow-y-auto">
                      {cat.items?.map((item) => (
                        <div key={item.id} className="px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-950 text-xs font-semibold flex justify-between items-center">
                          <span>{item.name}</span>
                          <button onClick={() => handleDeleteItem(item.id)} className="text-gray-300 hover:text-rose-600 p-0.5"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCatId(cat.id); setItemName(''); setIsItemModalOpen(true); }} className="w-full py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 font-bold text-xs rounded-xl hover:bg-emerald-100 transition-colors">
                    + Thêm vật dụng
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS DETAIL & ACTION */}
      {/* ========================================================================= */}
      
      {/* 1. TRIP FULL DETAIL MODAL */}
      {isTripDetailOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden relative">
            
            {/* Banner & Header */}
            {tripDetailLoading ? (
              <div className="py-24 text-center">
                <Loader2 className="animate-spin text-blue-600 mx-auto" size={36} />
                <p className="text-sm font-semibold text-gray-500 mt-3">Đang tải toàn bộ dữ liệu chuyến đi...</p>
              </div>
            ) : selectedTripDetail ? (
              <>
                <div className="relative h-44 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 overflow-hidden shrink-0">
                  {selectedTripDetail.coverImage && (
                    <img src={selectedTripDetail.coverImage} alt="Cover" className="w-full h-full object-cover opacity-40" />
                  )}
                  <button
                    onClick={() => setIsTripDetailOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer z-10"
                  >
                    <X size={20} />
                  </button>
                  <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end text-white">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white">
                          {selectedTripDetail.isAi ? '⚡ AI tự ren' : '✍️ Tự tạo'}
                        </span>
                        <span className="text-xs text-blue-200 font-semibold flex items-center gap-1">
                          <MapPin size={12} /> {selectedTripDetail.destination}
                        </span>
                      </div>
                      <h2 className="text-2xl font-extrabold tracking-wide drop-shadow-md">
                        {selectedTripDetail.title}
                      </h2>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-300 block">Dự toán chuyến đi</span>
                      <span className="text-lg font-black text-amber-400">
                        {selectedTripDetail.budget ? `${selectedTripDetail.budget.toLocaleString('vi-VN')} đ` : 'Tự do'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub Header info bar */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden shrink-0 border border-blue-200">
                      <img src={selectedTripDetail.user?.avatar || '/default-avatar.jpg'} alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-slate-100 block">{selectedTripDetail.user?.fullName}</span>
                      <span className="text-gray-400 block">{selectedTripDetail.user?.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-gray-600 dark:text-slate-300 font-medium">
                    <span>🗓️ {selectedTripDetail.days ? `${selectedTripDetail.days} ngày` : 'Nhiều ngày'}</span>
                    <span>👥 {selectedTripDetail.members?.length || 1} thành viên</span>
                    <span>💰 Thực chi: <strong>{(selectedTripDetail.expenses?.reduce((a: any, b: any) => a + (b.amount || 0), 0) || 0).toLocaleString('vi-VN')} đ</strong></span>
                  </div>
                </div>

                {/* Modal Sub Tabs */}
                <div className="flex border-b border-gray-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 shrink-0">
                  <button
                    onClick={() => setTripDetailActiveTab('days')}
                    className={`py-3.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                      tripDetailActiveTab === 'days'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    🗓️ Lịch trình chi tiết ngày ({selectedTripDetail.details?.length || 0})
                  </button>
                  <button
                    onClick={() => setTripDetailActiveTab('overview')}
                    className={`py-3.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                      tripDetailActiveTab === 'overview'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    📍 Địa điểm lưu tổng quan ({selectedTripDetail.savedPlaces?.length || 0})
                  </button>
                  <button
                    onClick={() => setTripDetailActiveTab('expenses')}
                    className={`py-3.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                      tripDetailActiveTab === 'expenses'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    💰 Chi tiêu ({selectedTripDetail.expenses?.length || 0})
                  </button>
                  <button
                    onClick={() => setTripDetailActiveTab('members')}
                    className={`py-3.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                      tripDetailActiveTab === 'members'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    👥 Thành viên & Lời mời ({selectedTripDetail.members?.length || 0})
                  </button>
                </div>

                {/* Sub Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* TAB: LỊCH TRÌNH NGÀY */}
                  {tripDetailActiveTab === 'days' && (
                    <div className="space-y-4">
                      {(() => {
                        if (!selectedTripDetail.details || selectedTripDetail.details.length === 0) {
                          return <p className="text-gray-400 italic text-sm text-center py-6">Chưa có lịch trình chi tiết theo ngày.</p>;
                        }

                        const maxDayInDetails = Math.max(...selectedTripDetail.details.map((d: any) => Number(d.day) || 1), 1);
                        const totalDays = Number(selectedTripDetail.days) || maxDayInDetails;

                        const groupedByDay: Record<number, any[]> = {};
                        for (let i = 1; i <= totalDays; i++) {
                          groupedByDay[i] = [];
                        }
                        selectedTripDetail.details.forEach((d: any) => {
                          const dayNum = Number(d.day) > 0 ? Number(d.day) : 1;
                          if (!groupedByDay[dayNum]) {
                            groupedByDay[dayNum] = [];
                          }
                          groupedByDay[dayNum].push(d);
                        });

                        return (
                          <div className="space-y-4">
                            {Object.keys(groupedByDay).map((dayStr) => {
                              const dayNum = Number(dayStr);
                              const dayItems = groupedByDay[dayNum];
                              return (
                                <div key={dayNum} className="border border-gray-200 dark:border-slate-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-slate-950/40 space-y-3">
                                  {/* Day Header */}
                                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="px-3 py-1 bg-blue-600 text-white font-extrabold text-xs rounded-xl">
                                        Ngày {dayNum} {selectedTripDetail.days ? `/ ${selectedTripDetail.days}` : ''}
                                      </span>
                                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                                        {dayItems.length > 0 ? `${dayItems.length} địa điểm` : 'Lịch trình tự do'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Day Items */}
                                  {dayItems.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic py-2">Chưa cập nhật địa điểm cho Ngày {dayNum}.</p>
                                  ) : (
                                    <div className="space-y-2.5">
                                      {dayItems.map((item: any, idx: number) => {
                                        const isPlace = !!item.place;
                                        const isPlaceholderNote = !item.noteText || item.noteText === 'Thêm ghi chú tại đây';
                                        
                                        const title = isPlace 
                                          ? item.place.name 
                                          : (!isPlaceholderNote ? item.noteText : 'Ghi chú / Hoạt động cá nhân');

                                        const subtitle = isPlace 
                                          ? (!isPlaceholderNote ? item.noteText : formatAddress(item.place.address))
                                          : null;

                                        const cleanSubtitle = (subtitle && subtitle !== 'Thêm ghi chú tại đây') ? subtitle : null;

                                        return (
                                          <div key={item.id || idx} className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 shadow-xs">
                                            {isPlace ? (
                                              <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                            ) : (
                                              <FileText size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1 space-y-1">
                                              <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100">
                                                  {title}
                                                </h4>
                                                {item.isVisited && (
                                                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <CheckCircle2 size={12} /> Đã ghé thăm
                                                  </span>
                                                )}
                                              </div>
                                              {cleanSubtitle && (
                                                <p className="text-xs text-gray-500 dark:text-slate-400">{cleanSubtitle}</p>
                                              )}
                                              {(item.startTime || item.endTime) && (
                                                <span className="text-xs font-semibold text-blue-600 dark:bg-blue-400 block pt-0.5">
                                                  ⏰ Thời gian: {item.startTime || '00:00'} - {item.endTime || '00:00'}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* TAB: LƯU TỔNG QUAN */}
                  {tripDetailActiveTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedTripDetail.savedPlaces?.length === 0 ? (
                        <p className="text-gray-400 italic text-sm text-center py-6 col-span-2">Chưa có địa điểm lưu tổng quan.</p>
                      ) : (
                        selectedTripDetail.savedPlaces?.map((sp: any) => {
                          const isPlace = !!sp.place;
                          const isPlaceholderNote = !sp.noteText || sp.noteText === 'Thêm ghi chú tại đây';

                          const title = isPlace 
                            ? sp.place.name 
                            : (!isPlaceholderNote ? sp.noteText : (sp.section || 'Ghi chú tổng quan'));

                          const rawSub = isPlace 
                            ? (!isPlaceholderNote ? sp.noteText : formatAddress(sp.place.address))
                            : null;

                          const cleanSub = (rawSub && rawSub !== 'Thêm ghi chú tại đây') ? rawSub : null;

                          return (
                            <div key={sp.id} className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 flex items-start gap-3">
                              {isPlace ? (
                                <MapPin size={20} className="text-blue-500 shrink-0 mt-0.5" />
                              ) : (
                                <FileText size={20} className="text-amber-500 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <h5 className="font-bold text-sm text-gray-900 dark:text-slate-100">{title}</h5>
                                {cleanSub && <p className="text-xs text-gray-500 mt-1">{cleanSub}</p>}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* TAB: CHI TIÊU */}
                  {tripDetailActiveTab === 'expenses' && (
                    <div className="space-y-3">
                      {selectedTripDetail.expenses?.length === 0 ? (
                        <p className="text-gray-400 italic text-sm text-center py-6">Chưa có thông tin ghi nhận chi tiêu.</p>
                      ) : (
                        selectedTripDetail.expenses?.map((e: any) => (
                          <div key={e.id} className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/20 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-sm text-gray-900 dark:text-slate-100 block">{e.title}</span>
                              <span className="text-xs text-gray-500">Danh mục: <strong>{e.category || 'Khác'}</strong> • Chi bởi: <strong>{e.payer || 'User'}</strong></span>
                            </div>
                            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                              {e.amount?.toLocaleString('vi-VN')} {e.currencySymbol || 'đ'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB: THÀNH VIÊN & LỜI MỜI */}
                  {tripDetailActiveTab === 'members' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thành viên tham gia ({selectedTripDetail.members?.length || 0})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedTripDetail.members?.map((m: any) => (
                          <div key={m.id} className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center shrink-0">
                              <img src={m.user?.avatar || '/default-avatar.jpg'} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="font-bold text-xs text-gray-900 dark:text-slate-100 block">{m.user?.fullName}</span>
                              <span className="text-[11px] text-gray-400 block">{m.user?.email} • Vai trò: <strong className="text-blue-600">{m.role}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedTripDetail.invites?.length > 0 && (
                        <>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Lời mời cộng tác ({selectedTripDetail.invites.length})</h4>
                          <div className="space-y-2">
                            {selectedTripDetail.invites.map((inv: any) => (
                              <div key={inv.id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 text-xs flex justify-between items-center">
                                <span>📧 Lời mời tới: <strong>{inv.email || 'Token Link'}</strong> (Vai trò: {inv.role})</span>
                                <span className="font-bold text-amber-700">{inv.status}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* 2. GUIDE DETAIL MODAL */}
      {isGuideDetailOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden relative">
            {guideDetailLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
                <p className="text-xs text-gray-500 mt-2">Đang tải chi tiết bài Hướng dẫn...</p>
              </div>
            ) : selectedGuideDetail ? (
              <>
                <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-start bg-gray-50/50 dark:bg-slate-950">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md inline-block mb-1">
                      📖 Hướng dẫn du lịch (Travel Guide)
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{selectedGuideDetail.title}</h3>
                    <span className="text-xs text-gray-500 mt-1 block">Điểm đến: <strong>{selectedGuideDetail.destination}</strong> • Tác giả: <strong>{selectedGuideDetail.user?.fullName}</strong></span>
                  </div>
                  <button onClick={() => setIsGuideDetailOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <div className="px-6 py-3 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-amber-600" />
                  Bài Hướng dẫn du lịch chỉ lưu danh sách các địa điểm lưu gợi ý ở tổng quan (ItinerarySavedPlace). Không có phần Lịch trình theo ngày hay Quản lý chi tiêu.
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Danh sách địa điểm lưu gợi ý ({selectedGuideDetail.savedPlaces?.length || 0})</h4>
                  {selectedGuideDetail.savedPlaces?.length === 0 ? (
                    <p className="text-gray-400 italic text-sm text-center py-6">Chưa có địa điểm lưu nào.</p>
                  ) : (
                    selectedGuideDetail.savedPlaces?.map((sp: any) => {
                      const isPlace = !!sp.place;
                      const isPlaceholderNote = !sp.noteText || sp.noteText === 'Thêm ghi chú tại đây';

                      const title = isPlace 
                        ? sp.place.name 
                        : (!isPlaceholderNote ? sp.noteText : (sp.section || 'Ghi chú gợi ý'));

                      const rawSub = isPlace 
                        ? (!isPlaceholderNote ? sp.noteText : formatAddress(sp.place.address))
                        : null;

                      const cleanSub = (rawSub && rawSub !== 'Thêm ghi chú tại đây') ? rawSub : null;

                      return (
                        <div key={sp.id} className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 overflow-hidden shrink-0 flex items-center justify-center border border-indigo-100">
                            {sp.place?.image ? (
                              <img src={sp.place.image} alt="Place" className="w-full h-full object-cover" />
                            ) : isPlace ? (
                              <MapPin size={22} className="text-indigo-500" />
                            ) : (
                              <FileText size={22} className="text-amber-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-sm text-gray-900 dark:text-slate-100">{title}</h5>
                            {cleanSub && <p className="text-xs text-gray-500 mt-1">{cleanSub}</p>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 flex justify-end gap-3">
                  <button onClick={() => setIsGuideDetailOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-xs font-bold rounded-xl text-gray-600">Đóng</button>
                  <button onClick={() => { setIsGuideDetailOpen(false); handleOpenExportBlog(selectedGuideDetail); }} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer">
                    Xuất bài Hướng dẫn này thành Blog
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* 3. BLOG DETAIL MODAL */}
      {isBlogDetailOpen && selectedBlog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden relative">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950">
              <div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md inline-block mb-1">
                  📰 Bài viết Blog Khám phá (ExplorePost)
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{selectedBlog.title}</h3>
              </div>
              <button onClick={() => setIsBlogDetailOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{selectedBlog.description}</p>
              <h4 className="text-xs font-bold text-gray-400 uppercase">Mục nội dung bài viết ({selectedBlog.items?.length || 0})</h4>
              <div className="space-y-2.5">
                {selectedBlog.items?.map((item: any) => {
                  const isHeader = item.itemType === 'SECTION_HEADER';
                  const isNote = item.itemType === 'NOTE';
                  const isPlace = item.itemType === 'PLACE' || !!item.place;

                  const contentText = item.content && item.content !== 'Thêm ghi chú tại đây' ? item.content : null;

                  if (isHeader) {
                    return (
                      <div key={item.id} className="pt-2 pb-1 border-b border-purple-100 dark:border-purple-900/40">
                        <h4 className="font-extrabold text-sm text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                          📌 {contentText || 'Phần nội dung'}
                        </h4>
                      </div>
                    );
                  }

                  if (isNote) {
                    return (
                      <div key={item.id} className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs">
                        <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">📝 Ghi chú bài viết:</span>
                        <p className="text-gray-700 dark:text-slate-300 italic">{contentText || 'Ghi chú thêm từ tác giả'}</p>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 flex items-start gap-3 text-xs">
                      <MapPin size={18} className="text-purple-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-bold text-sm text-gray-900 dark:text-slate-100">{item.place?.name || contentText || 'Địa điểm bài viết'}</h5>
                        {item.place?.address && <p className="text-xs text-gray-500 mt-0.5">{formatAddress(item.place.address)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Export Blog Modal */}
      {isExportBlogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Xuất Hướng dẫn thành bài Blog</h3>
            <div>
              <label className="block text-xs font-bold mb-1">Tiêu đề Blog</label>
              <input type="text" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Mô tả</label>
              <textarea rows={3} value={blogDescription} onChange={(e) => setBlogDescription(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsExportBlogOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Hủy</button>
              <button onClick={handleExportBlog} disabled={exportBlogLoading} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm">
                {exportBlogLoading && <Loader2 size={14} className="animate-spin inline mr-1" />} Xuất Blog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Blog Modal */}
      {isCreateBlogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <form onSubmit={handleCreateBlog} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Tạo bài viết Blog mới</h3>
            <input type="text" required placeholder="Tiêu đề bài viết..." value={newBlogTitle} onChange={(e) => setNewBlogTitle(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
            <input type="text" placeholder="Điểm đến..." value={newBlogDest} onChange={(e) => setNewBlogDest(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
            <textarea rows={3} placeholder="Mô tả bài viết..." value={newBlogDesc} onChange={(e) => setNewBlogDesc(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsCreateBlogOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Hủy</button>
              <button type="submit" disabled={createBlogLoading} className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-sm">Lưu Blog</button>
            </div>
          </form>
        </div>
      )}

      {/* Checklist Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <form onSubmit={handleSaveCategory} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{editingCat ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>
            <input type="text" required placeholder="Tên danh mục..." value={catName} onChange={(e) => setCatName(e.target.value)} className="w-full p-2 border rounded-xl text-sm font-semibold" />
            <input type="text" placeholder="Tab Type (GENERAL, CLOTHES...)" value={catTabType} onChange={(e) => setCatTabType(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsCatModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Hủy</button>
              <button type="submit" disabled={catLoading} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm">Lưu Danh mục</button>
            </div>
          </form>
        </div>
      )}

      {/* Checklist Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <form onSubmit={handleSaveItem} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Thêm vật dụng mới</h3>
            <input type="text" required placeholder="Tên vật dụng..." value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full p-2 border rounded-xl text-sm font-semibold" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Hủy</button>
              <button type="submit" disabled={itemLoading} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm">Thêm</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Trip Confirmation Modal */}
      {isDeleteTripOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsDeleteTripOpen(false)} className="absolute right-4 top-4 text-gray-400"><X size={18} /></button>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><Trash2 size={20} /></div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Xác nhận xóa chuyến đi</h3>
                <p className="text-gray-500 text-sm mt-1">Thao tác này sẽ xóa vĩnh viễn dữ liệu chuyến đi, lịch trình chi tiết và chi tiêu liên quan.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button onClick={() => setIsDeleteTripOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-sm">Hủy</button>
              <button onClick={handleDeleteTrip} disabled={deleteTripLoading} className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-sm flex items-center gap-2">
                {deleteTripLoading && <Loader2 size={16} className="animate-spin" />}
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
