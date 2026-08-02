"use client";

import React, { useEffect, useState, startTransition } from 'react';
import { UserRow } from '@/lib/supabase/types';
import { Search, X, Loader2, Shield, Eye, EyeOff, Lock, Unlock, Calendar, Mail, Check, Plus, User, MessageSquare, Bot, Sparkles, Trash2, MapPin, Clock, RefreshCw } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: false,
  });

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

  // Chat History Modal State
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatUser, setChatUser] = useState<UserRow | null>(null);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const handleOpenChatHistory = (user: UserRow) => {
    setChatUser(user);
    setIsChatModalOpen(true);
    setSelectedSessionId(null);
    setSessionDetails(null);
    fetchUserChatSessions(user.id);
  };

  const fetchUserChatSessions = async (userId: string | number) => {
    setSessionsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/chat-sessions`);
      if (!res.ok) throw new Error('Lỗi khi tải lịch sử chat.');
      const data = await res.json();
      setChatSessions(data || []);
      if (Array.isArray(data) && data.length > 0) {
        handleSelectChatSession(data[0].id);
      }
    } catch (err: any) {
      showToast(err.message || 'Không thể tải cuộc hội thoại.', 'error');
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleSelectChatSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/admin/chat-sessions/${sessionId}/messages`);
      if (!res.ok) throw new Error('Lỗi khi tải tin nhắn hội thoại.');
      const data = await res.json();
      setSessionDetails(data);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải tin nhắn hội thoại.', 'error');
    } finally {
      setMessagesLoading(false);
    }
  };

  // Confirm Delete Modal State
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    show: boolean;
    type: 'single' | 'all';
    sessionId?: string;
    title?: string;
  }>({
    show: false,
    type: 'all',
  });

  const handleDeleteChatSession = (sessionId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteModal({
      show: true,
      type: 'single',
      sessionId,
      title: `Bạn có chắc chắn muốn xóa cuộc hội thoại "${title}" không?`,
    });
  };

  const executeDeleteChatSession = async (sessionId: string) => {
    setDeletingSessionId(sessionId);
    try {
      const res = await fetch(`/api/admin/chat-sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Lỗi khi xóa cuộc hội thoại.');
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setSessionDetails(null);
      }
      showToast('Đã xóa cuộc hội thoại thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa cuộc hội thoại.', 'error');
    } finally {
      setDeletingSessionId(null);
    }
  };

  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleDeleteAllChatSessions = () => {
    if (!chatUser) return;
    setConfirmDeleteModal({
      show: true,
      type: 'all',
      title: `Bạn có chắc chắn muốn XÓA TẤT CẢ ${chatSessions.length} cuộc hội thoại của người dùng "${chatUser.fullName || chatUser.email}" không? Hành động này sẽ xóa vĩnh viễn khỏi hệ thống backend.`,
    });
  };

  const executeDeleteAllChatSessions = async () => {
    if (!chatUser) return;
    setIsDeletingAll(true);
    try {
      const res = await fetch(`/api/admin/users/${chatUser.id}/chat-sessions`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Lỗi khi xóa tất cả cuộc hội thoại.');
      setChatSessions([]);
      setSelectedSessionId(null);
      setSessionDetails(null);
      showToast('Đã xóa tất cả cuộc hội thoại thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa tất cả cuộc hội thoại.', 'error');
    } finally {
      setIsDeletingAll(false);
    }
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
      const res = await fetch('/api/admin/users?limit=10000');
      if (!res.ok) throw new Error('Không thể tải danh sách người dùng.');
      const data = await res.json();
      setUsers(data.users || []);
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
      const res = await fetch(`/api/admin/users/${user.id}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isBlocked: newBlockedState }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Lỗi khi thay đổi trạng thái khóa.');
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.fullName.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      setModalError('Vui lòng điền đầy đủ họ tên, email và mật khẩu.');
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: newUser.fullName.trim(),
          email: newUser.email.trim().toLowerCase(),
          password: newUser.password.trim(),
          role: newUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi lưu thông tin người dùng.');
      }

      setUsers(prev => [data, ...prev]);
      showToast('Thêm tài khoản người dùng thành công!', 'success');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Lỗi khi lưu thông tin người dùng.');
    } finally {
      setModalLoading(false);
    }
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

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return '/default-avatar.svg';
    if (avatarUrl.includes('photo-1534528741775-53994a69daeb') || avatarUrl.includes('default-avatar.jpg')) {
      return '/default-avatar.svg';
    }
    return avatarUrl;
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
        <button
          onClick={() => {
            setNewUser({
              fullName: '',
              email: '',
              password: '',
              role: false,
            });
            setShowPassword(false);
            setModalError(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-md cursor-pointer text-sm"
        >
          <Plus size={18} />
          Thêm người dùng
        </button>
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
                <tr className="text-gray-500 bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-400 rounded-full shrink-0">
                          <div className="bg-white dark:bg-slate-900 rounded-full p-[1.5px] w-9 h-9 overflow-hidden flex items-center justify-center text-sm">
                            <img
                              src={getAvatarUrl(user.avatar)}
                              alt={user.fullName || 'User'}
                              className="object-cover w-full h-full rounded-full"
                            />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                            {user.fullName || 'Chưa đặt tên'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.role ? (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900">
                          <Shield size={12} />
                          Quản trị viên
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200 dark:border-slate-700">
                          Thành viên
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-650 dark:text-slate-300 font-semibold">
                      {getFormattedDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900">
                          Đã khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                          Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenChatHistory(user)}
                        className="p-2 text-purple-600 hover:text-purple-750 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                        title="Xem lịch sử Chat AI"
                      >
                        <MessageSquare size={16} />
                      </button>
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
                  <img
                    src={getAvatarUrl(selectedUser.avatar)}
                    alt={selectedUser.fullName || 'User'}
                    className="object-cover w-full h-full rounded-full"
                  />
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
              <div className="w-full pt-4 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenChatHistory(selectedUser);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  <MessageSquare size={14} /> Lịch sử Chat AI
                </button>
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

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-250 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-150 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg">Thêm người dùng mới</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser}>
              <div className="p-6 space-y-4">
                {modalError && (
                  <div className="text-xs text-red-650 bg-red-50 border border-red-200 rounded-lg p-3">
                    {modalError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 block">Họ và tên <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nhập họ và tên..."
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      disabled={modalLoading}
                      required
                      className="bg-white text-gray-900 text-sm rounded-lg pl-9 pr-4 py-2 border border-gray-300 focus:outline-none focus:border-blue-500 transition-colors w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 block">Địa chỉ Email <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      disabled={modalLoading}
                      required
                      className="bg-white text-gray-900 text-sm rounded-lg pl-9 pr-4 py-2 border border-gray-300 focus:outline-none focus:border-blue-500 transition-colors w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 block">Mật khẩu <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu..."
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      disabled={modalLoading}
                      required
                      className="bg-white text-gray-900 text-sm rounded-lg pl-9 pr-10 py-2 border border-gray-300 focus:outline-none focus:border-blue-500 transition-colors w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-450 hover:text-gray-600 transition-colors p-0.5 rounded focus:outline-none cursor-pointer"
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-sm font-semibold text-gray-750 block">Quyền Quản trị viên (Admin)</span>
                      <span className="text-[10px] text-gray-500 block">Cho phép truy cập trang quản lý Admin Dashboard</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.checked })}
                        className="sr-only peer cursor-pointer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal controls */}
              <div className="px-6 py-4 border-t border-gray-150 bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={modalLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    'Lưu tài khoản'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Chat History Modal */}
      {isChatModalOpen && chatUser && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-5xl w-full h-[85vh] shadow-2xl overflow-hidden border border-gray-200 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-0.5 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full shrink-0">
                  <img
                    src={getAvatarUrl(chatUser.avatar)}
                    alt={chatUser.fullName || 'User'}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">
                      {chatUser.fullName || 'Thành viên CloudMood'}
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                      <Sparkles size={11} /> Quản lý Chat AI
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{chatUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchUserChatSessions(chatUser.id)}
                  disabled={sessionsLoading}
                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-white rounded-xl transition-colors cursor-pointer border border-gray-200/60 bg-white/80 shadow-xs"
                  title="Làm mới cuộc hội thoại"
                >
                  <RefreshCw size={16} className={sessionsLoading ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsChatModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-colors cursor-pointer border border-gray-200/60 bg-white/80 shadow-xs"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content: 2 Columns */}
            <div className="flex-1 flex min-h-0 overflow-hidden bg-gray-50/50">
              {/* Left Column: Chat Sessions List */}
              <div className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0">
                <div className="p-3.5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <MessageSquare size={13} /> Danh sách cuộc chat ({chatSessions.length})
                  </span>
                  {chatSessions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteAllChatSessions}
                      disabled={isDeletingAll}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                      title="Xóa toàn bộ cuộc hội thoại của người dùng"
                    >
                      {isDeletingAll ? (
                        <Loader2 size={12} className="animate-spin text-rose-600" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      {isDeletingAll ? 'Đang xóa...' : 'Xóa tất cả'}
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
                  {sessionsLoading ? (
                    <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
                      <Loader2 size={24} className="animate-spin text-purple-600" />
                      <span className="text-xs">Đang tải các đoạn chat...</span>
                    </div>
                  ) : chatSessions.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 space-y-2 p-4">
                      <Bot size={32} className="mx-auto text-gray-300" />
                      <p className="text-xs font-semibold text-gray-600">Chưa có cuộc trò chuyện AI nào</p>
                      <p className="text-[11px] text-gray-400">Người dùng chưa tạo đoạn chat trợ lý AI.</p>
                    </div>
                  ) : (
                    chatSessions.map((s) => {
                      const isSelected = selectedSessionId === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleSelectChatSession(s.id)}
                          className={`p-3 rounded-xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-purple-50/80 border-purple-300 shadow-2xs'
                              : 'bg-white hover:bg-gray-50 border-transparent hover:border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className={`text-xs font-bold truncate flex-1 ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                              {s.title}
                            </h4>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteChatSession(s.id, s.title, e)}
                              disabled={deletingSessionId === s.id}
                              className="text-gray-300 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer shrink-0"
                              title="Xóa đoạn chat"
                            >
                              {deletingSessionId === s.id ? (
                                <Loader2 size={13} className="animate-spin text-rose-500" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </div>

                          {s.destination && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 mb-1.5">
                              <MapPin size={10} /> {s.destination}
                            </div>
                          )}

                          {s.lastMessage && (
                            <p className="text-[11px] text-gray-500 line-clamp-1 mb-2 italic">
                              "{s.lastMessage}"
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium border-t border-gray-100/60 pt-1.5">
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> {getFormattedDate(s.updatedAt || s.createdAt)}
                            </span>
                            <span className="px-1.5 py-0.2 bg-gray-100 rounded-full text-gray-600 font-bold">
                              {s.messageCount} tin
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Chat Messages View */}
              <div className="flex-1 flex flex-col min-w-0 bg-white">
                {selectedSessionId && sessionDetails ? (
                  <>
                    {/* Session Header */}
                    <div className="px-6 py-3.5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          <Bot size={16} className="text-purple-600" />
                          {sessionDetails.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                          {sessionDetails.destination && (
                            <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                              <MapPin size={11} /> {sessionDetails.destination}
                            </span>
                          )}
                          <span>Tạo ngày: {getFormattedDate(sessionDetails.createdAt)}</span>
                          <span>({sessionDetails.messages?.length || 0} tin nhắn)</span>
                        </div>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                      {messagesLoading ? (
                        <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-2">
                          <Loader2 size={28} className="animate-spin text-purple-600" />
                          <span className="text-xs">Đang tải tin nhắn...</span>
                        </div>
                      ) : sessionDetails.messages?.length === 0 ? (
                        <div className="py-20 text-center text-gray-400">
                          Chưa có tin nhắn nào trong cuộc trò chuyện này.
                        </div>
                      ) : (
                        sessionDetails.messages.map((m: any) => {
                          const isUserRole = m.role === 'USER' || m.role === 'user';
                          return (
                            <div
                              key={m.id}
                              className={`flex gap-3 ${isUserRole ? 'justify-end' : 'justify-start'}`}
                            >
                              {!isUserRole && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs mt-1">
                                  <Sparkles size={14} />
                                </div>
                              )}

                              <div className={`max-w-[75%] space-y-1 ${isUserRole ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-center gap-2 text-[10px] font-bold text-gray-400 ${isUserRole ? 'justify-end' : 'justify-start'}`}>
                                  <span>{isUserRole ? (chatUser.fullName || 'Người dùng') : 'Trợ lý CloudMood AI'}</span>
                                  <span>•</span>
                                  <span>{getFormattedDate(m.createdAt)}</span>
                                </div>

                                <div
                                  className={`p-3.5 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-xs ${
                                    isUserRole
                                      ? 'bg-blue-600 text-white rounded-tr-xs font-medium'
                                      : 'bg-white border border-gray-200 text-gray-900 rounded-tl-xs'
                                  }`}
                                >
                                  {m.content}
                                </div>
                              </div>

                              {isUserRole && (
                                <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 shadow-xs mt-1 overflow-hidden">
                                  <img
                                    src={getAvatarUrl(chatUser.avatar)}
                                    alt={chatUser.fullName || 'User'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-400">
                      <MessageSquare size={32} />
                    </div>
                    <p className="text-sm font-bold text-gray-700">Chọn một cuộc trò chuyện ở cột bên trái</p>
                    <p className="text-xs text-gray-400 max-w-sm text-center">
                      Xem toàn bộ nội dung câu hỏi của người dùng và phản hồi của trợ lý AI.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirm Delete Modal */}
      {confirmDeleteModal.show && (
        <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-gray-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Xác nhận xóa cuộc trò chuyện</h3>
                <p className="text-xs text-gray-500">Hành động này sẽ xóa dữ liệu trên hệ thống</p>
              </div>
            </div>

            <p className="text-xs font-medium text-gray-700 leading-relaxed bg-rose-50/60 p-3 rounded-xl border border-rose-100">
              {confirmDeleteModal.title}
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal({ show: false, type: 'all' })}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-xl font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteModal({ show: false, type: 'all' });
                  if (confirmDeleteModal.type === 'all') {
                    executeDeleteAllChatSessions();
                  } else if (confirmDeleteModal.sessionId) {
                    executeDeleteChatSession(confirmDeleteModal.sessionId);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
