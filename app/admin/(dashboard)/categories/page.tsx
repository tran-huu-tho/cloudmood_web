"use client";

import React, { useEffect, useState, startTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Category } from '@/lib/supabase/types';
import { Plus, Edit2, Trash2, Search, X, Loader2, Check } from 'lucide-react';

const getCategoryBadgeStyle = (categoryId: number) => {
  const styles = [
    'bg-blue-50 text-blue-700 border-blue-200',      // Blue
    'bg-rose-50 text-rose-700 border-rose-200',      // Red/Rose
    'bg-emerald-50 text-emerald-700 border-emerald-200', // Green
    'bg-amber-50 text-amber-800 border-amber-200',   // Yellow
    'bg-purple-50 text-purple-700 border-purple-200', // Purple
    'bg-orange-50 text-orange-700 border-orange-200', // Orange
    'bg-pink-50 text-pink-700 border-pink-200',      // Pink
  ];
  return styles[categoryId % styles.length];
};

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toast notification state
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({ name: '' });
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('Category')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách danh mục.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCurrentCategory({ name: '' });
    setModalType('create');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setCurrentCategory(category);
    setModalType('edit');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory.name?.trim()) {
      setModalError('Tên danh mục không được để trống.');
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      if (modalType === 'create') {
        const { data, error } = await supabase
          .from('Category')
          .insert([{ name: currentCategory.name.trim() }])
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          setCategories([...categories, data[0]]);
          showToast('Thêm danh mục thành công!', 'success');
        }
      } else {
        const { data, error } = await supabase
          .from('Category')
          .update({ name: currentCategory.name.trim() })
          .eq('id', currentCategory.id!)
          .select();

        if (error) throw error;
        const updatedRow = (data && data.length > 0) ? data[0] : { id: currentCategory.id!, name: currentCategory.name.trim() } as Category;
        setCategories(
          categories.map((c) => (c && c.id === currentCategory.id ? updatedRow : c))
        );
        showToast('Cập nhật danh mục thành công!', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Có lỗi xảy ra khi lưu.');
    } finally {
      setModalLoading(false);
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
      // Safety check: count linked places in database
      const { count, error: countError } = await supabase
        .from('Place')
        .select('*', { count: 'exact', head: true })
        .eq('categoryId', deletingId);

      if (countError) throw countError;

      if (count && count > 0) {
        showToast(`Không thể xóa! Danh mục này đang được liên kết bởi ${count} địa điểm.`, 'error');
        setIsDeleteOpen(false);
        return;
      }

      // Safe to delete
      const { error } = await supabase
        .from('Category')
        .delete()
        .eq('id', deletingId);

      if (error) throw error;
      setCategories(categories.filter((c) => c.id !== deletingId));
      setIsDeleteOpen(false);
      showToast('Xóa danh mục thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa danh mục.', 'error');
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c && c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý các loại hình địa điểm du lịch</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm text-sm"
        >
          <Plus size={18} />
          Thêm danh mục
        </button>
      </div>

      {/* Main Workspace */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center gap-4 justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm danh mục..."
              value={searchQuery}
              onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
              className="bg-white text-gray-900 text-sm rounded-lg pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-blue-500 transition-colors w-full"
            />
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Tổng cộng: {filteredCategories.length} danh mục
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
            <span>Đang tải danh sách danh mục...</span>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-500">
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchCategories}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            Không tìm thấy danh mục nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 bg-gray-50 border-b border-gray-200 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Mã số (ID)</th>
                  <th className="px-6 py-4">Tên danh mục</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-gray-500">
                      #{category.id}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1.5 rounded-full border ${getCategoryBadgeStyle(category.id)}`}>
                        {category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDelete(category.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
            <div className="text-xs font-semibold text-gray-500">
              Hiển thị từ {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, filteredCategories.length)} trong tổng số {filteredCategories.length} danh mục
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden border border-gray-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-150 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">
                {modalType === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {modalError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {modalError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên danh mục (ví dụ: Địa điểm vui chơi, Nhà hàng...)"
                  value={currentCategory.name || ''}
                  onChange={(e) =>
                    setCurrentCategory({ ...currentCategory, name: e.target.value })
                  }
                  disabled={modalLoading}
                  className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer shadow-sm"
                >
                  {modalLoading && <Loader2 size={16} className="animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Xóa danh mục?</h3>
              <p className="text-gray-500 text-sm mt-2">
                Hành động này không thể hoàn tác. Các địa điểm thuộc danh mục này sẽ cần được cập nhật.
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
