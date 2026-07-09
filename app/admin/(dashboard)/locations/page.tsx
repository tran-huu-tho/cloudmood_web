"use client";

import React, { useEffect, useState, useTransition, startTransition } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { Place, Category } from '@/lib/supabase/types';
import { Plus, Edit2, Trash2, Search, X, Loader2, MapPin, ExternalLink } from 'lucide-react';

const MapPicker = dynamic(() => import('@/components/admin/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center text-gray-400 text-sm">
      Loading picker map...
    </div>
  ),
});

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

export default function LocationsPage() {
  const supabase = createClient();
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startFilterTransition] = useTransition();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [currentPlace, setCurrentPlace] = useState<Partial<Place>>({
    name: '',
    description: '',
    address: '',
    latitude: 10.03022,
    longitude: 105.78753,
    price: '',
    openTime: '08:00',
    closeTime: '21:00',
    categoryId: null,
    image: '',
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

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
      // Fetch both categories and places
      const [categoriesRes, placesRes] = await Promise.all([
        supabase.from('Category').select('*').order('name'),
        supabase.from('Place').select('*').order('id', { ascending: false }),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (placesRes.error) throw placesRes.error;

      setCategories(categoriesRes.data || []);
      setPlaces(placesRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi kết nối cơ sở dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCurrentPlace({
      name: '',
      description: '',
      address: '',
      latitude: 10.03022,
      longitude: 105.78753,
      price: '',
      openTime: '08:00',
      closeTime: '21:00',
      categoryId: categories[0]?.id || null,
      image: '',
    });
    setModalType('create');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (place: Place) => {
    setCurrentPlace(place);
    setModalType('edit');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlace.name?.trim() || !currentPlace.address?.trim() || !currentPlace.categoryId) {
      setModalError('Vui lòng nhập đầy đủ tên, địa chỉ và chọn danh mục.');
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      const payload = {
        name: currentPlace.name.trim(),
        description: currentPlace.description?.trim() || null,
        address: currentPlace.address.trim(),
        latitude: Number(currentPlace.latitude) || 0,
        longitude: Number(currentPlace.longitude) || 0,
        price: currentPlace.price?.trim() || null,
        openTime: currentPlace.openTime?.trim() || null,
        closeTime: currentPlace.closeTime?.trim() || null,
        categoryId: Number(currentPlace.categoryId),
        image: currentPlace.image?.trim() || null,
      };

      if (modalType === 'create') {
        const { data, error } = await supabase.from('Place').insert([payload]).select();
        if (error) throw error;
        if (data) setPlaces([data[0], ...places]);
      } else {
        const { data, error } = await supabase
          .from('Place')
          .update(payload)
          .eq('id', currentPlace.id!)
          .select();
        if (error) throw error;
        const updatedRow = (data && data.length > 0) ? data[0] : { ...currentPlace, ...payload } as Place;
        setPlaces(places.map((p) => (p.id === currentPlace.id ? updatedRow : p)));
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Lỗi khi lưu thông tin địa điểm.');
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
      const { error } = await supabase.from('Place').delete().eq('id', deletingId);
      if (error) throw error;
      setPlaces(places.filter((p) => p.id !== deletingId));
      setIsDeleteOpen(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa địa điểm.');
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

  const handleCoordinateChange = (lat: number, lng: number) => {
    setCurrentPlace((prev) => ({
      ...prev,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
    }));
  };

  const filteredPlaces = places.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === 'all' || p.categoryId === Number(selectedCategoryFilter);
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
  const paginatedPlaces = filteredPlaces.slice(
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý địa điểm</h1>
          <p className="text-gray-500 text-sm mt-1">Danh sách địa điểm vui chơi, nghỉ dưỡng, ăn uống</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm text-sm"
        >
          <Plus size={18} />
          Thêm địa điểm
        </button>
      </div>

      {/* Main Panel */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-center gap-4 justify-between bg-gray-50/50">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên hoặc địa chỉ..."
                value={searchQuery}
                onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
                className="bg-white text-gray-900 text-sm rounded-lg pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-blue-500 transition-colors w-full"
              />
            </div>
            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                const val = e.target.value;
                startFilterTransition(() => setSelectedCategoryFilter(val));
              }}
              className="bg-white text-gray-700 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-500 w-full sm:w-48 cursor-pointer font-medium"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            {isPending ? 'Đang lọc...' : `Hiển thị: ${filteredPlaces.length} địa điểm`}
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
            <span>Đang tải danh sách địa điểm...</span>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-500">
            <p className="font-semibold">{error}</p>
            <button onClick={fetchData} className="mt-4 text-sm text-blue-600 hover:underline">
              Thử lại
            </button>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="py-20 text-center text-gray-400">Không tìm thấy địa điểm nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 bg-gray-50 border-b border-gray-200 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Địa điểm</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4">Địa chỉ & Tọa độ</th>
                  <th className="px-6 py-4">Giá & Giờ mở</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedPlaces.map((place) => {
                  const catName = categories.find((c) => c.id === place.categoryId)?.name || 'Chưa phân loại';
                  return (
                    <tr key={place.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                            {place.image ? (
                              <img src={place.image} alt={place.name || ''} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <MapPin size={18} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm truncate">{place.name}</h3>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{place.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${getCategoryBadgeStyle(place.categoryId || 0)}`}>
                          {catName}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-gray-900 text-xs truncate">{place.address}</p>
                        <div className="flex items-center gap-1.5 text-gray-500 text-[10px] mt-1 font-mono">
                          <span>Lat: {place.latitude}</span>
                          <span>&bull;</span>
                          <span>Lng: {place.longitude}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 text-xs font-medium">{place.price || 'N/A'}</p>
                        <p className="text-gray-500 text-[10px] mt-1">
                          ⏱️ {place.openTime ? place.openTime.slice(0, 5) : 'N/A'} - {place.closeTime ? place.closeTime.slice(0, 5) : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1 shrink-0">
                        {place.latitude && place.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                            title="Xem bản đồ"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <button
                          onClick={() => handleOpenEdit(place)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(place.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Xóa"
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
              Hiển thị từ {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, filteredPlaces.length)} trong tổng số {filteredPlaces.length} địa điểm
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl max-w-5xl w-full shadow-xl overflow-hidden border border-gray-100 my-8">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-150 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">
                {modalType === 'create' ? 'Thêm địa điểm mới' : 'Chỉnh sửa địa điểm'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{modalError}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">
                      Tên địa điểm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên địa điểm..."
                      value={currentPlace.name || ''}
                      onChange={(e) => setCurrentPlace({ ...currentPlace, name: e.target.value })}
                      disabled={modalLoading}
                      className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">
                      Danh mục <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentPlace.categoryId || ''}
                      onChange={(e) => setCurrentPlace({ ...currentPlace, categoryId: Number(e.target.value) })}
                      disabled={modalLoading}
                      className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="" disabled>Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">Mô tả ngắn</label>
                    <textarea
                      placeholder="Nhập mô tả địa điểm..."
                      value={currentPlace.description || ''}
                      onChange={(e) => setCurrentPlace({ ...currentPlace, description: e.target.value })}
                      disabled={modalLoading}
                      rows={3}
                      className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập số nhà, tên đường, quận huyện..."
                      value={currentPlace.address || ''}
                      onChange={(e) => setCurrentPlace({ ...currentPlace, address: e.target.value })}
                      disabled={modalLoading}
                      className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 block">Giá cả/Vé vào</label>
                      <input
                        type="text"
                        placeholder="VD: Miễn phí, 50.000đ..."
                        value={currentPlace.price || ''}
                        onChange={(e) => setCurrentPlace({ ...currentPlace, price: e.target.value })}
                        disabled={modalLoading}
                        className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 block">Ảnh minh họa (Link)</label>
                      <input
                        type="text"
                        placeholder="Link hình ảnh..."
                        value={currentPlace.image || ''}
                        onChange={(e) => setCurrentPlace({ ...currentPlace, image: e.target.value })}
                        disabled={modalLoading}
                        className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 block">Giờ mở cửa</label>
                      <input
                        type="text"
                        placeholder="VD: 07:00"
                        value={currentPlace.openTime || ''}
                        onChange={(e) => setCurrentPlace({ ...currentPlace, openTime: e.target.value })}
                        disabled={modalLoading}
                        className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 block">Giờ đóng cửa</label>
                      <input
                        type="text"
                        placeholder="VD: 22:00"
                        value={currentPlace.closeTime || ''}
                        onChange={(e) => setCurrentPlace({ ...currentPlace, closeTime: e.target.value })}
                        disabled={modalLoading}
                        className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Coordinate & Map Picker */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 block">Vĩ độ (Latitude)</label>
                      <input
                        type="number"
                        step="any"
                        value={currentPlace.latitude || ''}
                        onChange={(e) => setCurrentPlace({ ...currentPlace, latitude: parseFloat(e.target.value) || 0 })}
                        disabled={modalLoading}
                        className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 block">Kinh độ (Longitude)</label>
                      <input
                        type="number"
                        step="any"
                        value={currentPlace.longitude || ''}
                        onChange={(e) => setCurrentPlace({ ...currentPlace, longitude: parseFloat(e.target.value) || 0 })}
                        disabled={modalLoading}
                        className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">Chọn vị trí trên bản đồ</label>
                    <MapPicker
                      lat={Number(currentPlace.latitude) || 10.03022}
                      lng={Number(currentPlace.longitude) || 105.78753}
                      onChange={handleCoordinateChange}
                    />
                  </div>
                </div>
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

      {/* Delete Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Xóa địa điểm?</h3>
              <p className="text-gray-500 text-sm mt-2">
                Hành động này không thể hoàn tác. Các đánh giá liên quan sẽ bị xóa khỏi cơ sở dữ liệu.
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
