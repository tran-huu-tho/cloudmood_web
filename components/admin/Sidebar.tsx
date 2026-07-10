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
  Cloud
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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-80 bg-white text-gray-600 min-h-screen flex flex-col border-r border-gray-200 shrink-0">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-8 border-b border-gray-200">
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
        <span className="text-gray-900 font-bold text-2xl tracking-wide">CloudMood</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-6 space-y-4 overflow-y-auto">

        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
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
  );
}
