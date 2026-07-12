"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Search, Bell, Settings, User as UserIcon, LogOut, AlertTriangle, CheckCircle2, KeyRound, Sparkles, Trash2, Menu } from 'lucide-react';

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  interface NotificationItem {
    id: number;
    type: 'warning' | 'rotation' | 'info';
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;
  }

  const [adminName, setAdminName] = useState('Admin');
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  const [localToast, setLocalToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' }>({ show: false, message: '', type: 'success' });

  // Settings states synced with LocalStorage
  const [enableCoPilot, setEnableCoPilot] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const triggerLocalToast = (message: string, type: 'success' | 'info' = 'success') => {
    setLocalToast({ show: true, message, type });
    setTimeout(() => setLocalToast(prev => ({ ...prev, show: false })), 3000);
  };

  const getRelativeTime = (dateStr: string | Date) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return `${diffDays} ngày trước`;
    } catch {
      return 'Vài phút trước';
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        const unreads = data.filter((n: any) => !n.isRead).length;
        setUnreadCount(unreads);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Load preferences from localStorage on mount & Fetch Notifications
  useEffect(() => {
    const savedCoPilot = localStorage.getItem('enable_copilot');
    if (savedCoPilot !== null) {
      const parsedVal = savedCoPilot === 'true';
      setEnableCoPilot(parsedVal);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('toggle-copilot', { detail: { show: parsedVal } }));
      }, 100);
    }

    const savedDark = localStorage.getItem('dark_mode');
    if (savedDark !== null) {
      const isDark = savedDark === 'true';
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchMe = () => {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.user?.fullName) {
            setAdminName(data.user.fullName);
          }
          if (data.user?.avatar) {
            setAdminAvatar(data.user.avatar);
          } else {
            setAdminAvatar(null);
          }
        })
        .catch((err) => console.error('Error fetching me in topbar:', err));
    };

    fetchMe();
    window.addEventListener('profile-updated', fetchMe);
    return () => {
      window.removeEventListener('profile-updated', fetchMe);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/admin/login';
      }
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const handleToggleCoPilot = (checked: boolean) => {
    setEnableCoPilot(checked);
    localStorage.setItem('enable_copilot', String(checked));
    triggerLocalToast(checked ? 'Đã kích hoạt Trợ lý AI CloudBros!' : 'Đã ẩn Trợ lý AI CloudBros!');
    window.dispatchEvent(new CustomEvent('toggle-copilot', { detail: { show: checked } }));
  };

  const handleToggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    localStorage.setItem('dark_mode', String(checked));
    if (checked) {
      document.documentElement.classList.add('dark');
      triggerLocalToast('Đã kích hoạt Giao diện tối!');
    } else {
      document.documentElement.classList.remove('dark');
      triggerLocalToast('Đã kích hoạt Giao diện sáng!');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/admin/notifications/read-all', { method: 'POST' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        triggerLocalToast('Đã đánh dấu tất cả là đã đọc.');
      }
    } catch (err) {
      console.error('Error marking read all:', err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications', { method: 'DELETE' });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        triggerLocalToast('Đã xóa sạch thông báo lịch sử.');
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 relative">
      {/* Local floating toast */}
      {localToast.show && (
        <div className="absolute top-22 right-8 z-[9999] bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 animate-[slideIn_0.2s_ease-out]">
          <CheckCircle2 size={14} className={localToast.type === 'success' ? 'text-emerald-400' : 'text-blue-400'} />
          <span>{localToast.message}</span>
        </div>
      )}

      {/* Left placeholder / Menu trigger */}
      <button 
        onClick={onMenuClick}
        className="lg:hidden p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100 border border-transparent hover:border-slate-200/60 cursor-pointer mr-4"
        title="Mở menu"
      >
        <Menu size={22} />
      </button>
      <div className="w-80 hidden lg:block"></div>
 
      {/* Search Bar centered */}
      <div className="flex-1 max-w-2xl mx-auto">
        <div className="relative w-full">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm..."
            className="w-full bg-gray-50 text-gray-900 text-base rounded-xl pl-12 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>
 
      {/* Right controls */}
      <div className="flex items-center gap-5 text-gray-500 w-80 justify-end shrink-0">
        
        {/* Notifications Bell */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsSettingsOpen(false);
              setIsDropdownOpen(false);
              // Optimistically mark as read on open if there are unreads
              if (unreadCount > 0) {
                handleMarkAllAsRead();
              }
            }}
            className="hover:text-gray-900 transition-colors relative cursor-pointer p-1.5 hover:bg-slate-50 rounded-xl animate-[pulse_3s_infinite_ease-in-out]"
            title="Thông báo hệ thống"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-2">
              <div className="px-4 pb-2 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-extrabold text-gray-900 dark:text-slate-100 text-sm">Thông báo mới</span>
                <div className="flex gap-2 items-center">
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-extrabold cursor-pointer"
                  >
                    Đọc tất cả
                  </button>
                  <span className="text-[9px] text-gray-300 dark:text-slate-700">|</span>
                  <button 
                    onClick={handleClearNotifications}
                    className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-extrabold cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800/50 px-2">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 dark:text-slate-500 font-medium">Không có thông báo nào.</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors flex gap-3 items-start cursor-pointer ${!n.isRead ? 'bg-blue-50/20 dark:bg-blue-500/5' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        n.type === 'warning' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' :
                        n.type === 'rotation' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' :
                        'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                      }`}>
                        {n.type === 'warning' && <AlertTriangle size={15} />}
                        {n.type === 'rotation' && <KeyRound size={15} />}
                        {n.type === 'info' && <Sparkles size={15} />}
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 dark:text-slate-200 leading-tight flex items-center gap-1.5 justify-between">
                          <span className="truncate">{n.title}</span>
                          {!n.isRead && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></span>}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-relaxed break-words">{n.message}</p>
                        <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold block pt-1">
                          {getRelativeTime(n.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings Gear */}
        <div className="relative" ref={settingsRef}>
          <button 
            onClick={() => {
              setIsSettingsOpen(!isSettingsOpen);
              setIsNotificationsOpen(false);
              setIsDropdownOpen(false);
            }}
            className="hover:text-gray-900 transition-colors cursor-pointer p-1.5 hover:bg-slate-50 rounded-xl"
            title="Cài đặt hệ thống"
          >
            <Settings size={22} />
          </button>

          {isSettingsOpen && (
            <div className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl py-3.5 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
              <span className="font-extrabold text-gray-900 dark:text-slate-100 text-sm block border-b border-gray-100 dark:border-slate-800 pb-2">Cấu hình nhanh</span>
              
              <div className="space-y-3">
                {/* Toggle AI */}
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">Trợ lý AI CloudBros</span>
                    <span className="text-[9px] text-gray-400 dark:text-slate-400 block">Bật hộp thoại AI Chat bên góc</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={enableCoPilot}
                    onChange={(e) => handleToggleCoPilot(e.target.checked)}
                    className="w-8 h-4 bg-gray-200 dark:bg-slate-800 rounded-full appearance-none checked:bg-blue-600 relative before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:transition-all checked:before:translate-x-4 cursor-pointer border border-gray-300 dark:border-slate-700"
                  />
                </label>

                {/* Toggle Dark Mode */}
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">Giao diện tối (Dark Mode)</span>
                    <span className="text-[9px] text-gray-400 dark:text-slate-400 block">Thay đổi giao diện màu tối</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={darkMode}
                    onChange={(e) => handleToggleDarkMode(e.target.checked)}
                    className="w-8 h-4 bg-gray-200 dark:bg-slate-800 rounded-full appearance-none checked:bg-blue-600 relative before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:transition-all checked:before:translate-x-4 cursor-pointer border border-gray-300 dark:border-slate-700"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 ml-1 relative" ref={dropdownRef}>
          <span className="text-base font-semibold text-gray-800 hidden sm:inline-block whitespace-nowrap">{adminName}</span>
          <button 
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setIsNotificationsOpen(false);
              setIsSettingsOpen(false);
            }}
            className="p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-400 rounded-full hover:shadow transition-shadow cursor-pointer shrink-0"
          >
            <div className="bg-white rounded-full p-[2px] w-12 h-12 overflow-hidden flex items-center justify-center">
              {adminAvatar ? (
                <img src={adminAvatar} alt="Admin Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-14 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <Link 
                href="/admin/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left font-medium"
              >
                <UserIcon size={16} className="text-gray-500" />
                Hồ sơ cá nhân
              </Link>
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left font-semibold cursor-pointer"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
