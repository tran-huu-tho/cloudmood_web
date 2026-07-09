"use client";

import dynamic from 'next/dynamic';
import React from 'react';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center text-gray-500">
      Đang tải bản đồ...
    </div>
  )
});

export default function DashboardMap() {
  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200 shadow-md">
      <Map />
    </div>
  );
}
