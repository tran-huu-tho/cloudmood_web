"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  MapPin,
  FolderTree,
  BarChart3,
  MessageSquare,
  LogOut
} from 'lucide-react';

const navItems = [
  { name: 'Trang chủ', path: '/admin', icon: Home },
  { name: 'Quản lý người dùng', path: '/admin/users', icon: Users },
  { name: 'Quản lý địa điểm', path: '/admin/locations', icon: MapPin },
  { name: 'Quản lý danh mục', path: '/admin/categories', icon: FolderTree },
  { name: 'Thống kê', path: '/admin/statistics', icon: BarChart3 },
  { name: 'Quản lý đánh giá', path: '/admin/reviews', icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside className="w-64 bg-white text-gray-600 min-h-screen flex flex-col border-r border-gray-200">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center mr-3 shrink-0">
          <Image 
            src="/logo-cloudmood.png" 
            alt="CloudMood Icon" 
            width={32} 
            height={32}
            className="object-cover w-full h-full"
            priority
          />
        </div>
        <span className="text-gray-900 font-semibold text-lg tracking-wide">CloudMood</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1">
        <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 mt-2">
          Workspace
        </p>

        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <item.icon size={18} className={isActive ? "text-blue-600" : "text-gray-500"} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout bottom */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-red-50 hover:text-red-600 w-full text-left"
        >
          <LogOut size={18} className="text-gray-500" />
          <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

