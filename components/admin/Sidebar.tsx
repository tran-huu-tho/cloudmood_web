"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  MapPin,
  FolderTree,
  BarChart3,
  MessageSquare,
  Cloud,
  X
} from 'lucide-react';

const navItems = [
  { name: 'Trang chủ', path: '/admin', icon: Home },
  { name: 'Quản lý người dùng', path: '/admin/users', icon: Users },
  { name: 'Quản lý địa điểm', path: '/admin/locations', icon: MapPin },
  { name: 'Quản lý danh mục', path: '/admin/categories', icon: FolderTree },
  { name: 'Quản lý thời tiết', path: '/admin/weather', icon: Cloud },
  { name: 'Thống kê', path: '/admin/statistics', icon: BarChart3 },
  { name: 'Quản lý đánh giá', path: '/admin/reviews', icon: MessageSquare },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/45 backdrop-blur-xs z-[9990] lg:hidden cursor-pointer animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static top-0 left-0 h-screen w-80 bg-white dark:bg-slate-900 text-gray-600 min-h-screen flex flex-col border-r border-gray-200 dark:border-slate-800 shrink-0 z-[9995] lg:z-auto transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-gray-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded overflow-hidden flex items-center justify-center mr-4 shrink-0">
              <Image 
                src="/logo-cloudmood.png" 
                alt="CloudMood Icon" 
                width={48} 
                height={48}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <span className="text-gray-900 dark:text-slate-100 font-bold text-2xl tracking-wide">CloudMood</span>
          </div>

          {/* Close button inside drawer for mobile */}
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 border border-transparent hover:border-slate-200/60 cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-6 space-y-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onClose} // Auto-close drawer on link click on mobile
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors ${isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <item.icon size={22} className={isActive ? "text-blue-600" : "text-gray-500"} />
                <span className="text-base font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
