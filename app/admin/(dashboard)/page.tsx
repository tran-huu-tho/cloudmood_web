"use client";

import React from 'react';
import DashboardMap from '@/components/admin/DashboardMap';
import { Users, MapPin, Map as MapIcon, MessageSquare } from 'lucide-react';

const stats = [
  { label: 'Số người dùng', value: '12,450', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Số địa điểm', value: '842', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { label: 'Số plan đã lên', value: '3,210', icon: MapIcon, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { label: 'Số góp ý và cmt', value: '5,892', icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-500/10' },
];

const locations = [
  { city: 'Hà Nội, VN', team: 'HQ · 32', status: 'Open', statusColor: 'text-emerald-500', bg: 'bg-emerald-500/20' },
  { city: 'Hồ Chí Minh, VN', team: 'Sales · 8', status: 'Open', statusColor: 'text-emerald-500', bg: 'bg-emerald-500/20' },
  { city: 'Đà Nẵng, VN', team: 'Eng · 14', status: 'Open', statusColor: 'text-emerald-500', bg: 'bg-emerald-500/20' },
  { city: 'Nha Trang, VN', team: 'Support · 6', status: 'Hybrid', statusColor: 'text-orange-500', bg: 'bg-orange-500/20' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">

      {/* Map Section */}
      <DashboardMap />

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Details Section mimicking the Adminator layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Address Card (Left) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-1 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Address</h4>
            <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 text-xs font-semibold">HQ</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">HQ · Hà Nội</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-sm text-gray-900 font-medium">CloudMood HQ</p>
                <p className="text-sm text-gray-500 mt-1">123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội, Việt Nam</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <MessageSquare size={16} />
              </div>
              <div>
                <p className="text-sm text-gray-900 font-medium">Email</p>
                <p className="text-sm text-gray-500 mt-1">contact@cloudmood.vn</p>
              </div>
            </div>
          </div>
        </div>

        {/* All Offices / Locations (Right) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-2 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">All Offices</h4>
              <h2 className="text-lg font-bold text-gray-900">Other locations</h2>
            </div>
            <button className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors">
              View all &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">CITY</th>
                  <th className="pb-3 font-medium">TEAM</th>
                  <th className="pb-3 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc, idx) => (
                  <tr key={idx} className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-4 text-gray-900 font-medium">{loc.city}</td>
                    <td className="py-4 text-gray-600">{loc.team}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${loc.bg} border border-current ${loc.statusColor}`}></span>
                        <span className={loc.statusColor}>{loc.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
