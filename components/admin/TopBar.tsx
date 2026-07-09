"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Search, Bell, Settings, User as UserIcon, LogOut } from 'lucide-react';

export default function TopBar() {
  const [adminName, setAdminName] = useState('Admin');
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
      {/* Left placeholder to balance the layout and keep the search centered */}
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
      <div className="flex items-center gap-6 text-gray-500 w-80 justify-end shrink-0">
        <button className="hover:text-gray-900 transition-colors relative cursor-pointer p-1">
          <Bell size={24} />
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="hover:text-gray-900 transition-colors cursor-pointer p-1">
          <Settings size={24} />
        </button>
        <div className="flex items-center gap-3 ml-2 relative" ref={dropdownRef}>
          <span className="text-base font-semibold text-gray-800 hidden sm:inline-block whitespace-nowrap">{adminName}</span>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-400 rounded-full hover:shadow transition-shadow cursor-pointer shrink-0"
          >
            <div className="bg-white rounded-full p-[2px] w-12 h-12 overflow-hidden flex items-center justify-center">
              {adminAvatar ? (
                <img src={adminAvatar} alt="Admin Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full bg-gray-105 flex items-center justify-center text-gray-400 rounded-full">
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
