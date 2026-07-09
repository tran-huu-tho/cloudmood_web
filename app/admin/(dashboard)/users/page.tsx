"use client";

import React, { useEffect, useState, startTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserRow } from '@/lib/supabase/types';
import { Search, X, Loader2, Shield, Eye, Lock, Unlock, Calendar, Mail, Check } from 'lucide-react';

export default function UsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  useEffect(() => {
    const initialize = async () => {
      try {
        // Fetch current admin details to filter ourselves out
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user?.email) {
          setCurrentAdminEmail(data.user.email);
        }
      } catch (err) {
        console.error('Error fetching current admin:', err);
      }
      fetchUsers();
    };
    initialize();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle user Lock/Unlock state
  const handleToggleLock = async (user: UserRow) => {
    const newBlockedState = !user.isBlocked;
    try {
      const { error } = await supabase
        .from('User')
        .update({ isBlocked: newBlockedState } as any)
        .eq('id', user.id);

      if (error) {
        if (error.message.includes('column') && error.message.includes('isBlocked')) {
          throw new Error('Cột isBlocked chưa được cấu hình trên Supabase. Vui lòng nhấp vào nút "+" ở bảng User trên Supabase Dashboard và thêm cột "isBlocked" (kiểu bool, mặc định false).');
        }
        throw error;
      }

      setUsers(users.map((u) => (u.id === user.id ? { ...u, isBlocked: newBlockedState } : u)));
      showToast(`${newBlockedState ? 'Khóa' : 'Mở khóa'} tài khoản thành công!`, 'success');
      
      // Sync modal view details if open
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, isBlocked: newBlockedState });
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi thay đổi trạng thái khóa.', 'error');
    }
  };

  const handleOpenView = (user: UserRow) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const getFormattedDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Filter out current logged in admin
  const filteredUsers = users.filter(
    (u) =>
      u.email !== currentAdminEmail &&
      (u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
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

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-500 text-sm mt-1">Danh sách tài khoản thành viên trong hệ thống (Không bao gồm tài khoản admin của bạn)</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center gap-4 justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng bằng tên, email..."
              value={searchQuery}
              onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
              className="bg-white text-gray-900 text-sm rounded-lg pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-blue-500 transition-colors w-full"
            />
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Tổng cộng: {filteredUsers.length} tài khoản
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
            <span>Đang tải danh sách người dùng...</span>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-500">
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            Không tìm thấy người dùng nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 bg-gray-50 border-b border-gray-200 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Người dùng</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-400 rounded-full shrink-0">
                          <div className="bg-white rounded-full p-[1.5px] w-10 h-10 overflow-hidden flex items-center justify-center text-sm">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.fullName || 'User'}
                                className="object-cover w-full h-full rounded-full"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-105 flex items-center justify-center text-gray-400 rounded-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">
                            {user.fullName || 'Chưa đặt tên'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role ? (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
                          <Shield size={12} />
                          Quản trị viên
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                          Thành viên
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-650 font-semibold">
                      {getFormattedDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-200">
                          Đã khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                          Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenView(user)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleLock(user)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer inline-flex items-center ${
                          user.isBlocked
                            ? 'text-emerald-600 hover:text-emerald-750 hover:bg-emerald-50'
                            : 'text-rose-600 hover:text-rose-750 hover:bg-rose-50'
                        }`}
                        title={user.isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                      >
                        {user.isBlocked ? <Unlock size={16} /> : <Lock size={16} />}
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
              Hiển thị từ {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, filteredUsers.length)} trong tổng số {filteredUsers.length} tài khoản
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

      {/* Read-Only View Modal */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">Thông tin tài khoản</h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex flex-col items-center">
              {/* Avatar circle */}
              <div className="p-[3px] bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-400 rounded-full shadow-md shrink-0">
                <div className="bg-white rounded-full p-[2.5px] w-24 h-24 overflow-hidden flex items-center justify-center border border-gray-100">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.fullName || 'User'}
                      className="object-cover w-full h-full rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-105 flex items-center justify-center text-gray-400 rounded-full">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Email */}
              <div className="text-center space-y-1">
                <h4 className="font-bold text-xl text-gray-900">{selectedUser.fullName || 'Thành viên CloudMood'}</h4>
                <p className="text-sm text-gray-500 font-semibold">{selectedUser.email}</p>
              </div>

              {/* Badges Status */}
              <div className="flex gap-2">
                {selectedUser.role ? (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                    <Shield size={12} />
                    Quản trị viên
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">
                    Thành viên
                  </span>
                )}

                {selectedUser.isBlocked ? (
                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-full border border-rose-200">
                    <Lock size={12} />
                    Bị khóa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                    <Unlock size={12} />
                    Hoạt động
                  </span>
                )}
              </div>

              {/* List Details */}
              <div className="w-full border-t border-gray-100 pt-4 space-y-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-semibold flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" /> Địa chỉ Email
                  </span>
                  <span className="text-gray-900 font-bold break-all text-right">{selectedUser.email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-semibold flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" /> Ngày tham gia
                  </span>
                  <span className="text-gray-900 font-bold">{getFormattedDate(selectedUser.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-semibold flex items-center gap-2">
                    <Shield size={16} className="text-gray-400" /> Cấp độ tài khoản
                  </span>
                  <span className="text-gray-900 font-bold">{selectedUser.role ? 'Quản trị hệ thống' : 'Thành viên'}</span>
                </div>
              </div>

              {/* Modal controls */}
              <div className="w-full pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleLock(selectedUser)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-bold text-sm transition-colors cursor-pointer ${
                    selectedUser.isBlocked
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  {selectedUser.isBlocked ? (
                    <>
                      <Unlock size={14} /> Mở khóa
                    </>
                  ) : (
                    <>
                      <Lock size={14} /> Khóa tài khoản
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
