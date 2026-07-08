"use client";

import React from 'react';
import { Search, Bell, Settings, User } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center text-gray-500 text-sm">
        <span>Admin</span>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-600">Dashboard</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-gray-50 text-gray-900 text-sm rounded-md pl-10 pr-4 py-1.5 border border-gray-200 focus:outline-none focus:border-blue-500 transition-colors w-64"
          />
        </div>
        
        <div className="flex items-center gap-4 text-gray-500">
          <button className="hover:text-gray-900 transition-colors relative">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="hover:text-gray-900 transition-colors">
            <Settings size={18} />
          </button>
          <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-500 hover:text-white transition-colors">
            <User size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
