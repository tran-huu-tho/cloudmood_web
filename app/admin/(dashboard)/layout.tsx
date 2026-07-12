"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import TopBar from '@/components/admin/TopBar';
import AIChatSidebar from '@/components/admin/AIChatSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setShowButton(customEvent.detail.show);
      }
    };
    window.addEventListener('toggle-copilot', handleToggle);
    return () => {
      window.removeEventListener('toggle-copilot', handleToggle);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 font-sans relative overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-slate-950 p-4 md:p-6 transition-colors duration-200">
          {children}
        </main>
      </div>

      {/* Floating AI Chat Toggle Button */}
      {showButton && (
        <button
          onClick={() => setIsAIChatOpen(prev => !prev)}
          className="fixed bottom-14 right-14 w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:scale-105 active:scale-95 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all z-[9998] cursor-pointer border border-white/10 p-1.5"
          title="Trợ lý AI CloudBros"
        >
          <img src="/logo-xoanen-cloudmood.png" alt="AI CloudBros" className="w-full h-full object-contain" />
        </button>
      )}

      {/* Collapsible AI Chat Sidebar */}
      <AIChatSidebar isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
    </div>
  );
}
