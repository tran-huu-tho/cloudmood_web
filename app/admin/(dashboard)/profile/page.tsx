"use client";

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { 
  Mail, MapPin, Camera, Edit3, Loader2, X, 
  Wallet, Map as MapIcon, Check, Calendar, Shield,
  Eye, EyeOff
} from 'lucide-react';

export default function ProfilePage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal Edit Profile state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });
  
  // Password visibility states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setAdminUser(data.user);
        setEditForm({
          fullName: data.user.fullName || '',
          email: data.user.email || '',
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.error('Error loading profile admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Avatar Upload Logic
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 256;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((img.width * maxDim) / img.height);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const base64String = await compressImage(file);
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: adminUser.fullName,
          avatarUrl: base64String
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi cập nhật ảnh đại diện.');

      setAdminUser((prev: any) => prev ? { ...prev, avatar: base64String } : null);
      window.dispatchEvent(new Event('profile-updated'));
      showToast('Cập nhật ảnh đại diện thành công!', 'success');
    } catch (err) {
      console.error('Error uploading avatar image:', err);
      showToast('Lỗi tải ảnh đại diện lên cơ sở dữ liệu.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
    return () => clearTimeout(timer);
  };

  // Edit Profile Logic via Server API
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) return;

    // Client-side Password Validations
    const hasPasswordInput = editForm.oldPassword || editForm.newPassword || editForm.confirmPassword;
    if (hasPasswordInput) {
      if (!editForm.oldPassword || !editForm.newPassword || !editForm.confirmPassword) {
        showToast('Vui lòng điền đầy đủ: Mật khẩu cũ, Mật khẩu mới và Xác nhận mật khẩu mới.', 'error');
        return;
      }
      if (editForm.newPassword !== editForm.confirmPassword) {
        showToast('Xác nhận mật khẩu mới không khớp.', 'error');
        return;
      }
      if (editForm.newPassword.length < 6) {
        showToast('Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
        return;
      }
    }

    setUpdateLoading(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editForm.fullName,
          oldPassword: editForm.oldPassword,
          newPassword: editForm.newPassword,
          confirmPassword: editForm.confirmPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi cập nhật hồ sơ');
      }

      await loadProfile();
      window.dispatchEvent(new Event('profile-updated'));
      showToast('Cập nhật hồ sơ thành công!', 'success');
      closeModal();
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      showToast(err.message || 'Lỗi khi cập nhật hồ sơ cá nhân.', 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const closeModal = () => {
    setIsEditModalOpen(false);
    setEditForm(prev => ({
      ...prev,
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const getFormattedDate = (dateStr: string | null) => {
    if (!dateStr) return '09/07/2026';
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

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-gray-500">
        <span className="animate-pulse font-semibold">Đang tải hồ sơ cá nhân...</span>
      </div>
    );
  }

  const defaultAvatarChar = (adminUser?.fullName || 'A').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
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

      {/* Banner & Header Details Card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm relative">
        {/* Banner Cover Image (New Cats Image) */}
        <div className="relative h-80 w-full bg-slate-100 overflow-hidden">
          <Image 
            src="/profile-cats.png" 
            alt="Profile Banner" 
            fill
            priority
            className="object-cover w-full h-full"
          />
        </div>

        {/* Profile Details Block */}
        <div className="px-8 pb-8 pt-2 flex flex-col items-center">
          {/* Avatar overlapping the banner */}
          <div className="flex flex-col items-center -mt-16 relative z-10">
            {/* Avatar circle with hover-upload overlay */}
            <div 
              onClick={handleAvatarClick}
              className="group p-[3px] bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-400 rounded-full shadow-md relative cursor-pointer"
              title="Lia chuột vào ảnh để tải ảnh lên"
            >
              <div className="bg-white rounded-full p-[3px] w-32 h-32 overflow-hidden relative flex items-center justify-center">
                {uploadingAvatar ? (
                  <Loader2 size={32} className="animate-spin text-blue-600" />
                ) : adminUser?.avatar ? (
                  <img src={adminUser.avatar} alt="Profile Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full bg-gray-105 flex items-center justify-center text-gray-400 rounded-full">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                
                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
                  <Camera size={22} className="mb-0.5" />
                  <span className="text-[10px] font-bold tracking-wide">Tải ảnh lên</span>
                </div>
              </div>
            </div>
            
            {/* Hidden file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarChange} 
            />

            <h2 className="text-2xl font-bold text-gray-900 mt-4 text-center">{adminUser?.fullName || 'Admin CloudMood'}</h2>
          </div>

          {/* Edit Profile Button */}
          <div className="mt-4">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-sm transition-all hover:shadow cursor-pointer flex items-center gap-2"
            >
              <Edit3 size={16} />
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm grid grid-cols-3 gap-6 text-center">
        <div className="flex flex-col items-center py-2">
          <MapPin size={22} className="text-blue-500 mb-1" />
          <span className="font-extrabold text-gray-900 text-2xl">15</span>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Địa điểm đã đi</span>
        </div>
        <div className="flex flex-col items-center py-2 border-x border-gray-100">
          <MapIcon size={22} className="text-blue-500 mb-1" />
          <span className="font-extrabold text-gray-900 text-2xl">8</span>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Plan đã lên</span>
        </div>
        <div className="flex flex-col items-center py-2">
          <Wallet size={22} className="text-blue-500 mb-1" />
          <span className="font-extrabold text-gray-900 text-2xl">12.5M</span>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Tiền đã chi</span>
        </div>
      </div>

      {/* Personal Information Section Card (No bio text) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-gray-900 text-center">Thông tin tài khoản</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3.5 text-gray-700 font-bold justify-center">
            <Mail size={18} className="text-gray-400 shrink-0" />
            <span className="text-sm break-all">{adminUser?.email || 'admin@123.com'}</span>
          </div>
          <div className="flex items-center gap-3.5 text-gray-700 font-bold justify-center border-y md:border-y-0 md:border-x border-gray-100 py-3 md:py-0">
            <Shield size={18} className="text-gray-400 shrink-0" />
            <span className="text-sm">Vai trò: {adminUser?.role ? 'Quản trị viên hệ thống' : 'Quản trị viên'}</span>
          </div>
          <div className="flex items-center gap-3.5 text-gray-700 font-bold justify-center">
            <Calendar size={18} className="text-gray-400 shrink-0" />
            <span className="text-sm">Ngày tạo: {getFormattedDate(adminUser?.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">Chỉnh sửa hồ sơ</h3>
              <button 
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tên hiển thị</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email liên hệ (Không thể thay đổi)</label>
                <input
                  type="email"
                  disabled
                  value={editForm.email}
                  className="w-full text-sm text-gray-400 bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 font-semibold cursor-not-allowed"
                />
              </div>

              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Mật khẩu cũ (Bắt buộc để đổi mật khẩu)</label>
                <div className="relative w-full">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={editForm.oldPassword}
                    onChange={(e) => setEditForm({ ...editForm, oldPassword: e.target.value })}
                    className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-11 py-2.5 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer p-1"
                  >
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Mật khẩu mới</label>
                <div className="relative w-full">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-11 py-2.5 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer p-1"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Xác nhận mật khẩu mới</label>
                <div className="relative w-full">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                    className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-11 py-2.5 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer p-1"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={updateLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer"
                >
                  {updateLoading && <Loader2 size={16} className="animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
