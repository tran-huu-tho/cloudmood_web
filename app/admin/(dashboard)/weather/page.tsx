"use client";

import React, { useEffect, useState, startTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Wind,
  Droplets,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Info,
  Check,
  X,
  Loader2,
  Calendar,
  Compass,
  ListTodo,
  AlertTriangle,
  GripVertical
} from 'lucide-react';

interface WeatherCacheItem {
  id: number | string;
  cityName: string;
  latitude: number;
  longitude: number;
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon: string;
  updatedAt: string;
}

interface TravelSuggestions {
  source: string;
  mood: string;
  activities: string[];
  categories: string[];
  tips: string[];
  places?: Array<{
    id: string;
    name: string;
    category: string;
    address: string;
    reason: string;
  }>;
}

interface CurrentWeatherResponse {
  cityName: string;
  latitude: number;
  longitude: number;
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon: string;
  updatedAt: string;
  suggestions: TravelSuggestions;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const POPULAR_CITIES = [
  'Cần Thơ',
  'Đà Nẵng',
  'Hà Nội',
  'Hồ Chí Minh',
  'Phú Quốc',
  'Nha Trang',
  'Đà Lạt',
  'Sa Pa'
];

export default function WeatherPage() {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [monitoredList, setMonitoredList] = useState<WeatherCacheItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [searchResult, setSearchResult] = useState<CurrentWeatherResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<any[] | null>(null);
  const [refreshingCityId, setRefreshingCityId] = useState<string | number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Confirm Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModalConfig({ title, message, onConfirm });
    setShowConfirmModal(true);
  };

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Fetch all cached cities from Supabase
  const fetchMonitoredCities = async () => {
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from('WeatherCache')
        .select('*');

      if (error) throw error;

      const savedOrder = localStorage.getItem('weather_monitored_order');
      if (savedOrder && data) {
        const orderArray = JSON.parse(savedOrder) as string[];
        data.sort((a, b) => {
          const indexA = orderArray.indexOf(a.cityName);
          const indexB = orderArray.indexOf(b.cityName);
          if (indexA === -1 && indexB === -1) return a.cityName.localeCompare(b.cityName);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      } else if (data) {
        data.sort((a, b) => a.cityName.localeCompare(b.cityName));
      }

      setMonitoredList(data || []);
    } catch (err: any) {
      console.error('Error fetching weather cache:', err);
      showToast('Không thể tải danh sách thành phố đang giám sát.', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchMonitoredCities();
  }, []);

  // Save search result to DB via supabase client (since backend port 5432 might be blocked)
  const saveToDb = async (weather: any) => {
    try {
      const dbData = {
        cityName: weather.cityName,
        latitude: weather.latitude,
        longitude: weather.longitude,
        temp: weather.temp,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        condition: weather.condition,
        description: weather.description,
        icon: weather.icon,
        rawResponse: {},
        updatedAt: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('WeatherCache')
        .upsert(dbData, { onConflict: 'cityName' });
        
      if (error) throw error;
      fetchMonitoredCities();
    } catch (err) {
      console.error('Failed to save to Supabase from frontend:', err);
    }
  };

  // Search weather for a city (triggers backend fetch and caches the result)
  const handleSearch = async (city: string) => {
    if (!city.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchResult(null);
    setCandidates(null);
    
    try {
      const res = await fetch(`${BACKEND_URL}/weather/current?cityName=${encodeURIComponent(city.trim())}`);
      if (!res.ok) {
        throw new Error('Không thể lấy dữ liệu thời tiết cho thành phố này.');
      }
      const data = await res.json();
      
      if (data.ambiguous) {
        setCandidates(data.candidates);
        showToast(`Tìm thấy nhiều địa điểm trùng khớp cho: ${city.trim()}`, 'success');
      } else {
        setSearchResult(data);
        await saveToDb(data);
        showToast(`Tải thời tiết thành công cho: ${data.cityName}`, 'success');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Đã xảy ra lỗi khi tìm kiếm.');
      showToast('Tìm kiếm thời tiết thất bại.', 'error');
    } finally {
      setSearching(false);
    }
  };

  // Chọn một địa điểm cụ thể từ danh sách các kết quả mơ hồ
  const handleSelectCandidate = async (candidate: { cityName: string; lat: number; lon: number }) => {
    setSearching(true);
    setSearchError(null);
    setCandidates(null);
    setSearchResult(null);
    
    try {
      const url = `${BACKEND_URL}/weather/current?cityName=${encodeURIComponent(candidate.cityName)}&lat=${candidate.lat}&lon=${candidate.lon}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Không thể lấy dữ liệu thời tiết cho địa điểm được chọn.');
      }
      const data = await res.json();
      setSearchResult(data);
      await saveToDb(data);
      showToast(`Tải thời tiết thành công cho: ${data.cityName}`, 'success');
    } catch (err: any) {
      setSearchError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu thời tiết.');
      showToast('Lấy dữ liệu thời tiết thất bại.', 'error');
    } finally {
      setSearching(false);
    }
  };

  // Drag and Drop handlers to sort monitored cities
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedList = [...monitoredList];
    const [draggedItem] = updatedList.splice(draggedIndex, 1);
    updatedList.splice(index, 0, draggedItem);

    setMonitoredList(updatedList);
    setDraggedIndex(null);

    // Save the new sort order to localStorage
    localStorage.setItem('weather_monitored_order', JSON.stringify(updatedList.map(item => item.cityName)));
    showToast('Đã cập nhật thứ tự sắp xếp.', 'success');
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Refresh cache for a specific city via backend
  const handleRefresh = async (cityName: string, id: string | number) => {
    setRefreshingCityId(id);
    try {
      const res = await fetch(`${BACKEND_URL}/weather/current?cityName=${encodeURIComponent(cityName)}`);
      if (!res.ok) throw new Error('Không thể làm mới dữ liệu.');
      
      const refreshedData = await res.json();
      await saveToDb(refreshedData);
      
      // Update local state directly
      setMonitoredList(prev => 
        prev.map(item => item.id === id ? { ...item, ...refreshedData, updatedAt: new Date().toISOString() } : item)
      );

      // If this city is currently selected in search results, update that too
      if (searchResult && searchResult.cityName.toLowerCase() === cityName.toLowerCase()) {
        setSearchResult(refreshedData);
      }

      showToast(`Đã cập nhật thời tiết cho ${cityName}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật thời tiết.', 'error');
    } finally {
      setRefreshingCityId(null);
    }
  };

  // Stop monitoring / delete from cache
  const handleDelete = async (cityName: string, id: string | number) => {
    triggerConfirm(
      'Ngừng giám sát thời tiết',
      `Bạn có chắc chắn muốn ngừng giám sát thời tiết tại ${cityName}?`,
      async () => {
        try {
          const { error } = await supabase
            .from('WeatherCache')
            .delete()
            .eq('id', id);

          if (error) throw error;

          setMonitoredList(prev => prev.filter(item => item.id !== id));
          
          if (searchResult && searchResult.cityName.toLowerCase() === cityName.toLowerCase()) {
            setSearchResult(null);
          }

          showToast(`Đã ngừng giám sát thời tiết cho ${cityName}.`, 'success');
        } catch (err: any) {
          showToast(err.message || 'Lỗi khi xóa giám sát.', 'error');
        }
      }
    );
  };

  const handleDeleteAll = async () => {
    triggerConfirm(
      'Xóa toàn bộ giám sát',
      'Bạn có chắc chắn muốn ngừng giám sát toàn bộ các thành phố trong danh sách? Hành động này sẽ làm sạch danh sách và không thể hoàn tác.',
      async () => {
        setLoadingList(true);
        try {
          const { error } = await supabase
            .from('WeatherCache')
            .delete()
            .neq('id', -1);

          if (error) throw error;

          setMonitoredList([]);
          setSearchResult(null);
          showToast('Đã xóa toàn bộ danh sách thành phố giám sát.', 'success');
        } catch (err: any) {
          showToast(err.message || 'Lỗi khi xóa danh sách.', 'error');
        } finally {
          setLoadingList(false);
        }
      }
    );
  };

  // Helper to map weather condition string to React Icon component
  const getWeatherIcon = (condition: string, size = 32) => {
    const cond = condition.toLowerCase();
    if (cond.includes('clear')) {
      return <Sun className="text-amber-500 animate-[spin_10s_linear_infinite]" size={size} />;
    }
    if (cond.includes('rain') || cond.includes('drizzle')) {
      return <CloudRain className="text-blue-500 animate-[bounce_1.5s_infinite]" size={size} />;
    }
    if (cond.includes('thunderstorm')) {
      return <CloudLightning className="text-yellow-500 animate-pulse" size={size} />;
    }
    if (cond.includes('snow')) {
      return <CloudSnow className="text-sky-300 animate-bounce" size={size} />;
    }
    return <Cloud className="text-slate-400" size={size} />;
  };

  const getRelativeTime = (timeStr: string) => {
    if (!mounted) return '...';
    try {
      let formattedTimeStr = timeStr;
      if (typeof timeStr === 'string') {
        const hasTimezone = timeStr.endsWith('Z') || 
                            timeStr.includes('+') || 
                            (timeStr.includes('T') && timeStr.split('T')[1].includes('-'));
        if (!hasTimezone) {
          formattedTimeStr = timeStr + 'Z';
        }
      }
      const date = new Date(formattedTimeStr);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-24 right-6 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-[9999] animate-in fade-in slide-in-from-top-4 duration-200 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? <Check size={20} className="shrink-0" /> : <X size={20} className="shrink-0" />}
          <span className="text-base font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý & Giám sát Thời tiết</h1>
          <p className="text-gray-500 text-sm mt-1">Xem thông tin thời tiết thời gian thực tại các điểm đến và gợi ý lịch trình du lịch thông minh từ AI (Gemini).</p>
        </div>
      </div>

      {/* Grid Layout: Search Panel (Left/Top) & Monitored Panel (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Search Panel & AI Suggestions (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Search className="text-blue-600" size={22} />
              Tra cứu thời tiết & Đề xuất hành trình
            </h2>

            {/* Search Input Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(searchQuery);
              }}
              className="flex gap-3"
            >
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nhập tên thành phố (VD: Can Tho, Ha Noi, Da Nang...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-base text-gray-900 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-md"
              >
                {searching ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                Tra cứu
              </button>
            </form>

            {/* Popular quick links */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Gợi ý tìm nhanh</span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSearchQuery(city);
                      handleSearch(city);
                    }}
                    className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 text-gray-600 dark:text-white font-semibold rounded-xl text-sm border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Result Card & Suggestions */}
          {searching && (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-sm flex flex-col items-center justify-center text-center">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
              <p className="text-gray-500 font-bold">Đang lấy dữ liệu thời tiết và phân tích đề xuất hành trình...</p>
            </div>
          )}

          {searchError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl p-6 shadow-sm flex items-start gap-4">
              <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="font-bold text-lg">Lỗi truy vấn</h3>
                <p className="text-sm mt-1">{searchError}</p>
                <p className="text-xs text-rose-500 mt-2 font-medium">Lời khuyên: Vui lòng kiểm tra lại tên thành phố nhập bằng tiếng Anh hoặc tiếng Việt không dấu (VD: 'Nha Trang', 'Hanoi').</p>
              </div>
            </div>
          )}

          {candidates && candidates.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Compass className="text-blue-600 animate-pulse" size={20} />
                Địa điểm trùng khớp
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Vui lòng chọn một địa điểm cụ thể để theo dõi thời tiết:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {candidates.map((candidate, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectCandidate(candidate)}
                    className="w-full text-left px-5 py-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-between group"
                  >
                    <span className="font-bold text-slate-700 group-hover:text-blue-700 text-sm truncate pr-2">
                      📍 {candidate.cityName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 bg-white border border-slate-100 px-2.5 py-1 rounded-xl group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                      Chọn
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchResult && (
            <div className="space-y-6">
              
              {/* Detailed Weather Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg space-y-6 relative overflow-hidden border border-slate-700">
                <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-8 translate-y-8">
                  {getWeatherIcon(searchResult.condition, 200)}
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black">{searchResult.cityName}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Thông tin chi tiết tại tọa độ {searchResult.latitude.toFixed(2)}, {searchResult.longitude.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    Thực tế
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="shrink-0 bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-center">
                    {getWeatherIcon(searchResult.condition, 56)}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black">{searchResult.temp.toFixed(1)}</span>
                      <span className="text-2xl font-extrabold text-blue-400">°C</span>
                    </div>
                    <p className="text-slate-300 font-bold capitalize mt-1">{searchResult.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                      <Droplets size={18} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-bold">ĐỘ ẨM</span>
                      <span className="text-slate-200 font-extrabold">{searchResult.humidity}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                      <Wind size={18} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-bold">SỨC GIÓ</span>
                      <span className="text-slate-200 font-extrabold">{searchResult.windSpeed} m/s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggestions Panel */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="text-indigo-600 animate-pulse" size={22} />
                    Gợi ý du lịch thông minh
                  </h3>
                  <div className={`px-3.5 py-1 rounded-full text-xs font-black tracking-wide border ${
                    searchResult.suggestions.source.includes('AI') 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    {searchResult.suggestions.source}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Mood banner */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                      <Compass size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">Tâm trạng đề xuất</span>
                      <span className="text-base font-extrabold text-indigo-950 capitalize">{searchResult.suggestions.mood}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Activities */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-gray-800 flex items-center gap-2 text-sm">
                        🏕️ Hoạt động khuyên chọn
                      </h4>
                      <ul className="space-y-2">
                        {searchResult.suggestions.activities.map((act, index) => (
                          <li key={index} className="text-sm font-semibold text-gray-600 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-100/50 transition-colors">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></span>
                            {act}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Categories and Tips */}
                    <div className="space-y-4">
                      {/* Categories tags */}
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-gray-800 flex items-center gap-2 text-sm">
                          📂 Danh mục địa điểm
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {searchResult.suggestions.categories.map((cat, index) => (
                            <span key={index} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold rounded-xl text-xs">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Travel tips */}
                      <div className="space-y-2.5">
                        <h4 className="font-extrabold text-gray-800 flex items-center gap-2 text-sm">
                          💡 Lời khuyên chuẩn bị
                        </h4>
                        <div className="space-y-2">
                          {searchResult.suggestions.tips.map((tip, index) => (
                            <div key={index} className="text-xs font-semibold text-amber-700 bg-amber-50/50 border border-amber-100/50 p-2.5 rounded-xl flex items-start gap-2">
                              <Info size={14} className="shrink-0 mt-0.5 text-amber-600" />
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real database places recommended */}
                  {searchResult.suggestions.places && searchResult.suggestions.places.length > 0 && (
                    <div className="space-y-3 pt-5 border-t border-slate-100">
                      <h4 className="font-extrabold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                        📍 Đề xuất địa điểm thực tế trong hệ thống
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {searchResult.suggestions.places.map((place: any, index: number) => (
                          <div 
                            key={index} 
                            className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col justify-between hover:border-indigo-400 hover:shadow-xs transition-all duration-200"
                          >
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-start gap-2.5">
                                <span className="font-extrabold text-slate-800 text-sm line-clamp-1">{place.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-extrabold border border-indigo-100 shrink-0">
                                  {place.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2">{place.address}</p>
                            </div>
                            <p className="text-xs text-indigo-900 bg-indigo-50/50 border border-indigo-100/30 p-2.5 rounded-xl mt-3 italic leading-relaxed font-semibold">
                              "{place.reason}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Monitored Cities List (5 Columns) */}
        <div className="lg:col-span-5 space-y-6 self-start">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Cloud className="text-blue-500 animate-pulse" size={22} />
                Thành phố giám sát ({monitoredList.length})
              </h2>
              {monitoredList.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="Xóa toàn bộ danh sách"
                >
                  <Trash2 size={13} />
                  Xóa tất cả
                </button>
              )}
            </div>

            {loadingList ? (
              // Skeletons
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700 flex gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : monitoredList.length === 0 ? (
              // Empty state
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 space-y-3">
                <Cloud size={64} className="text-slate-300 dark:text-slate-700 stroke-[1.5]" />
                <div>
                  <h3 className="font-bold text-gray-700 dark:text-slate-200">Chưa có thành phố nào</h3>
                  <p className="text-xs text-gray-400 dark:text-slate-400 mt-1 max-w-xs mx-auto">Hãy tìm kiếm thành phố bất kỳ ở khung bên trái. Hệ thống sẽ tự động thêm và theo dõi thời tiết tại đó.</p>
                </div>
              </div>
            ) : (
              // List of monitored cities
              <div className="space-y-4 max-h-[740px] overflow-y-auto pr-1">
                {monitoredList.map((item, index) => (
                  <div 
                    key={item.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`weather-monitor-card p-4 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-4 transition-all duration-200 group cursor-grab active:cursor-grabbing select-none ${
                      draggedIndex === index ? 'opacity-40 border-dashed border-blue-300 bg-blue-50/20 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors cursor-grab shrink-0">
                        <GripVertical size={16} />
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                        {getWeatherIcon(item.condition, 24)}
                      </div>
                      <div className="min-w-0">
                        <h4 
                          onClick={() => {
                            setSearchQuery(item.cityName);
                            handleSearch(item.cityName);
                          }}
                          className="font-extrabold text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-base animate-none"
                        >
                          {item.cityName}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-200 font-bold capitalize mt-0.5">{item.description}</p>
                        <span className="text-[10px] text-gray-400 dark:text-slate-300 font-bold block mt-1">Cập nhật: {getRelativeTime(item.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Temperature tag */}
                      <div className="flex items-center gap-0.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/60 text-blue-700 dark:text-white px-2.5 py-1 rounded-xl text-sm font-black">
                        {item.temp.toFixed(1)}°C
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleRefresh(item.cityName, item.id)}
                          disabled={refreshingCityId === item.id}
                          title="Làm mới thời tiết"
                          className="p-2 text-gray-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl cursor-pointer transition-colors active:scale-95 disabled:opacity-50"
                        >
                          <RefreshCw size={16} className={refreshingCityId === item.id ? 'animate-spin' : ''} />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(item.cityName, item.id)}
                          title="Ngừng giám sát"
                          className="p-2 text-gray-500 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl cursor-pointer transition-colors active:scale-95"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Quick stats / note */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={fetchMonitoredCities} 
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-98 transition-all text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold rounded-2xl cursor-pointer text-sm"
              >
                <RefreshCw size={16} className={loadingList ? 'animate-spin' : ''} />
                Làm mới danh sách
              </button>

              <div className="text-xs text-slate-400 dark:text-slate-200 font-semibold leading-relaxed flex gap-2">
                <Info size={16} className="shrink-0 text-blue-500" />
                <span>Dữ liệu thời tiết của các thành phố giám sát trên được lưu trữ đệm trong 15 phút. Nhấn nút xoay để cập nhật ngay.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && confirmModalConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-all duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-5 animate-[scaleIn_0.2s_ease-out]">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-gray-900 leading-tight">
                  {confirmModalConfig.title}
                </h3>
                <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                  {confirmModalConfig.message}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 font-bold rounded-xl text-sm transition-all cursor-pointer border border-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  confirmModalConfig.onConfirm();
                  setShowConfirmModal(false);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm shadow-rose-100"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
