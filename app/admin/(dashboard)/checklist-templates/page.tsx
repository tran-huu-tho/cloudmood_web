"use client";

import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Loader2,
  Layers,
  FolderPlus,
  Tag,
  Briefcase,
  ChevronDown
} from 'lucide-react';

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

export default function ChecklistTemplatesPage() {
  const [categories, setCategories] = useState<ChecklistCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Modal Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ChecklistCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryTabType, setCategoryTabType] = useState('GENERAL');
  const [isTabTypeDropdownOpen, setIsTabTypeDropdownOpen] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Modal Item
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<number | string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemLoading, setItemLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/checklist-templates');
      if (!res.ok) throw new Error('Không thể tải danh mục vật dụng.');
      const data = await res.json();
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu vật dụng.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryTabType('GENERAL');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: ChecklistCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryTabType(cat.tabType || 'GENERAL');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      showToast('Vui lòng nhập tên danh mục.', 'error');
      return;
    }

    setCategoryLoading(true);
    try {
      if (editingCategory) {
        // Edit category
        const res = await fetch(`/api/admin/checklist-templates/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryName, tabType: categoryTabType }),
        });
        if (!res.ok) throw new Error('Không thể cập nhật danh mục.');
        showToast('Cập nhật danh mục thành công!', 'success');
      } else {
        // Create category
        const res = await fetch('/api/admin/checklist-templates/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryName, tabType: categoryTabType }),
        });
        if (!res.ok) throw new Error('Không thể tạo danh mục mới.');
        showToast('Tạo danh mục mới thành công!', 'success');
      }
      setIsCategoryModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      showToast(err.message || 'Thao tác thất bại.', 'error');
    } finally {
      setCategoryLoading(false);
    }
  };

  const [isDeleteCatOpen, setIsDeleteCatOpen] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<number | string | null>(null);
  const [deleteCatLoading, setDeleteCatLoading] = useState(false);

  const handleDeleteCategory = (id: number | string) => {
    setDeletingCatId(id);
    setIsDeleteCatOpen(true);
  };

  const executeDeleteCategory = async () => {
    if (!deletingCatId) return;
    setDeleteCatLoading(true);
    try {
      const res = await fetch(`/api/admin/checklist-templates/categories/${deletingCatId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Lỗi khi xóa danh mục.');
      showToast('Xóa danh mục thành công!', 'success');
      setIsDeleteCatOpen(false);
      setDeletingCatId(null);
      fetchTemplates();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa.', 'error');
    } finally {
      setDeleteCatLoading(false);
    }
  };

  const handleOpenAddItem = (catId: number | string) => {
    setSelectedCatId(catId);
    setItemName('');
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !selectedCatId) {
      showToast('Vui lòng nhập tên vật dụng.', 'error');
      return;
    }

    setItemLoading(true);
    try {
      const res = await fetch('/api/admin/checklist-templates/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: selectedCatId, name: itemName }),
      });
      if (!res.ok) throw new Error('Lỗi khi thêm vật dụng.');
      showToast('Thêm vật dụng mới thành công!', 'success');
      setIsItemModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi thêm vật dụng.', 'error');
    } finally {
      setItemLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number | string) => {
    try {
      const res = await fetch(`/api/admin/checklist-templates/items/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Lỗi khi xóa vật dụng.');
      showToast('Xóa vật dụng thành công!', 'success');
      fetchTemplates();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa vật dụng.', 'error');
    }
  };

  const totalItemsCount = categories.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-24 right-6 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[9999] animate-in fade-in duration-200 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2.5">
            <CheckSquare className="text-emerald-600 dark:text-emerald-400" size={28} />
            Quản lý Vật dụng Cần thiết (Checklist Templates)
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Quản lý danh mục hành lý mẫu (Giấy tờ, Y tế, Điện tử, Trang phục...) và các gợi ý vật dụng sẵn cho chuyến đi
          </p>
        </div>

        <button
          onClick={handleOpenCreateCategory}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all self-start sm:self-auto"
        >
          <FolderPlus size={18} />
          Thêm danh mục mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <Layers size={120} />
          </div>
          <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">Danh mục vật dụng</span>
          <span className="text-3xl font-extrabold block mt-2">{categories.length.toLocaleString()}</span>
          <span className="text-xs text-emerald-200 mt-1 block">ChecklistTemplateCategory</span>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <Briefcase size={120} />
          </div>
          <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider block">Tổng số vật dụng gợi ý</span>
          <span className="text-3xl font-extrabold block mt-2">{totalItemsCount.toLocaleString()}</span>
          <span className="text-xs text-blue-200 mt-1 block">ChecklistTemplateItem</span>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin text-emerald-600 mx-auto" size={32} />
          <p className="text-gray-500 text-sm mt-2">Đang tải danh sách vật dụng...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="py-20 text-center text-gray-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl">
          Chưa có danh mục vật dụng nào. Bấm nút "Thêm danh mục mới" để bắt đầu!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between"
            >
              {/* Category Header */}
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <CheckSquare size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base">{cat.name}</h3>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                      Phân loại: {cat.tabType || 'GENERAL'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditCategory(cat)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                    title="Sửa danh mục"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="Xóa danh mục"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 flex-1 space-y-2 overflow-y-auto max-h-64">
                {cat.items?.length === 0 ? (
                  <p className="text-gray-400 text-xs italic py-3 text-center">Chưa có vật dụng gợi ý nào.</p>
                ) : (
                  cat.items?.map((item) => (
                    <div
                      key={item.id}
                      className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 flex items-center justify-between group"
                    >
                      <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                        {item.name}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-gray-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                        title="Xóa vật dụng"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Item Footer */}
              <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-950/30">
                <button
                  onClick={() => handleOpenAddItem(cat.id)}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  Thêm vật dụng mới
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <form onSubmit={handleSaveCategory} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                {editingCategory ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục mới'}
              </h3>
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giấy tờ & Giấy tờ tùy thân..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-slate-100"
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Mã phân loại (tabType) *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Chọn hoặc nhập Tab Type (VD: PACKING, TODO...)"
                    value={categoryTabType}
                    onFocus={() => setIsTabTypeDropdownOpen(true)}
                    onChange={(e) => {
                      setCategoryTabType(e.target.value.toUpperCase());
                      setIsTabTypeDropdownOpen(true);
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-bold text-gray-900 dark:text-slate-100 pr-10 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setIsTabTypeDropdownOpen(!isTabTypeDropdownOpen)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isTabTypeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Custom Combobox Dropdown */}
                {isTabTypeDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[10000]"
                      onClick={() => setIsTabTypeDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl z-[10001] max-h-48 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                      {Array.from(new Set([
                        'GENERAL', 'PACKING', 'TODO', 'PREPARATION', 'MEDICAL', 'DOCUMENTS', 'FINANCE',
                        ...categories.map((c: any) => c.tabType?.toUpperCase()).filter(Boolean)
                      ]))
                      .filter((t) => !categoryTabType || t.includes(categoryTabType.toUpperCase()))
                      .map((t) => (
                        <div
                          key={t}
                          onClick={() => {
                            setCategoryTabType(t);
                            setIsTabTypeDropdownOpen(false);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors flex justify-between items-center ${
                            categoryTabType.toUpperCase() === t
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold'
                              : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{t}</span>
                          {categoryTabType.toUpperCase() === t && <Check size={14} className="text-emerald-600" />}
                        </div>
                      ))}

                      {categoryTabType && !Array.from(new Set([
                        'GENERAL', 'PACKING', 'TODO', 'PREPARATION', 'MEDICAL', 'DOCUMENTS', 'FINANCE',
                        ...categories.map((c: any) => c.tabType?.toUpperCase()).filter(Boolean)
                      ])).includes(categoryTabType.toUpperCase()) && (
                        <div
                          onClick={() => setIsTabTypeDropdownOpen(false)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus size={13} /> Tạo phân loại mới: "<span className="font-extrabold">{categoryTabType}</span>"
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 border border-gray-200 dark:border-slate-800 font-semibold rounded-xl text-sm text-gray-600 dark:text-slate-400"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={categoryLoading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                {categoryLoading && <Loader2 size={16} className="animate-spin" />}
                Lưu Danh mục
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <form onSubmit={handleSaveItem} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                Thêm vật dụng gợi ý mới
              </h3>
              <button type="button" onClick={() => setIsItemModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Tên vật dụng *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Căn cước công dân, Thuốc cảm, Sạc dự phòng..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 border border-gray-200 dark:border-slate-800 font-semibold rounded-xl text-sm text-gray-600 dark:text-slate-400"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={itemLoading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                {itemLoading && <Loader2 size={16} className="animate-spin" />}
                Thêm vật dụng
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Delete Checklist Category Modal */}
      {isDeleteCatOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base">Xác nhận xóa danh mục</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Hành động này sẽ xóa danh mục và vật dụng bên trong</p>
              </div>
            </div>

            <p className="text-xs font-medium text-gray-700 dark:text-slate-300 leading-relaxed bg-rose-50/60 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
              Bạn có chắc chắn muốn xóa danh mục này cùng toàn bộ vật dụng bên trong không?
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteCatOpen(false);
                  setDeletingCatId(null);
                }}
                disabled={deleteCatLoading}
                className="px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={executeDeleteCategory}
                disabled={deleteCatLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteCatLoading && <Loader2 size={14} className="animate-spin" />}
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
