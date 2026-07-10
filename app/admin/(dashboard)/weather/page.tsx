"use client";

import React from 'react';

export default function WeatherPage() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 min-h-[500px] flex flex-col items-center justify-center text-center shadow-sm">
      <div className="text-6xl mb-4">🌤️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý thời tiết</h1>
      <p className="text-sm text-gray-500 max-w-sm">
        Tính năng quản lý và cấu hình thời tiết đang được phát triển. Dữ liệu hiện đang để trống.
      </p>
    </div>
  );
}
