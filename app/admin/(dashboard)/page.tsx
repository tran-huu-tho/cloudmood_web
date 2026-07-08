import React from 'react';
import DashboardMap from '@/components/admin/DashboardMap';
import { createClient } from '@/lib/supabase/server';
import { Users, MapPin, Map as MapIcon, MessageSquare } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: placeCount },
    { count: itineraryCount },
    { count: reviewCount },
  ] = await Promise.all([
    supabase.from('User').select('*', { count: 'exact', head: true }),
    supabase.from('Place').select('*', { count: 'exact', head: true }),
    supabase.from('Itinerary').select('*', { count: 'exact', head: true }),
    supabase.from('Review').select('*', { count: 'exact', head: true }),
  ]);

  const { data: recentPlaces } = await supabase
    .from('Place')
    .select('id, name, address, price, openTime, closeTime')
    .limit(5);

  const stats = [
    { label: 'Số người dùng', value: userCount ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Số địa điểm', value: placeCount ?? 0, icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Số plan đã lên', value: itineraryCount ?? 0, icon: MapIcon, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Số góp ý và cmt', value: reviewCount ?? 0, icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-6">
      <DashboardMap />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</h3>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Places */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Địa điểm gần đây</h4>
            <h2 className="text-lg font-bold text-gray-900">Danh sách địa điểm</h2>
          </div>
          <a href="/admin/locations" className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors">
            Xem tất cả &rarr;
          </a>
        </div>
        {recentPlaces && recentPlaces.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">TÊN ĐỊA ĐIỂM</th>
                  <th className="pb-3 font-medium">ĐỊA CHỈ</th>
                  <th className="pb-3 font-medium">GIÁ</th>
                  <th className="pb-3 font-medium">GIỜ MỞ CỬA</th>
                </tr>
              </thead>
              <tbody>
                {recentPlaces.map((place) => (
                  <tr key={place.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-gray-900 font-medium">{place.name}</td>
                    <td className="py-3 text-gray-600 max-w-xs truncate">{place.address ?? '—'}</td>
                    <td className="py-3 text-gray-600">{place.price ?? '—'}</td>
                    <td className="py-3 text-gray-600">
                      {place.openTime && place.closeTime
                        ? `${place.openTime} – ${place.closeTime}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Chưa có địa điểm nào. <a href="/admin/locations" className="text-blue-600 hover:underline">Thêm ngay</a></p>
        )}
      </div>
    </div>
  );
}
