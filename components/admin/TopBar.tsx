"use client";

import React, { useEffect, useState } from 'react';
import { Search, Bell, User as UserIcon } from 'lucide-react';

export default function TopBar() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user?.email) setEmail(d.user.email); });
  }, []);

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
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <UserIcon size={16} />
            </div>
            {email && <span className="text-sm text-gray-700 hidden md:block">{email}</span>}
          </div>
        </div>
      </div>
    </header>
  );
}

