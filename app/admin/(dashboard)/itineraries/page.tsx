"use client";

import React, { useEffect, useState } from 'react';
import {
  Compass,
  BookOpen,
  FileText,
  CheckSquare,
  Search,
  Trash2,
  Calendar,
  Sparkles,
  User,
  X,
  Check,
  Loader2,
  Layers,
  MapPin,
  Eye,
  DollarSign,
  Users,
  Clock,
  Plus,
  Heart,
  FolderPlus,
  Briefcase,
  Edit2,
  Share2,
  Tag,
  Star,
  CheckCircle2,
  Circle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Phone,
  Globe,
  Lock,
  Paperclip,
  Smile,
  Utensils,
  Hotel,
  Camera,
  Coffee,
  ShoppingBag,
  Ship,
  Plane,
  Landmark,
  Receipt
} from 'lucide-react';

interface CreatorUser {
  id: number | string;
  fullName: string;
  email: string;
  avatar: string | null;
}

interface Itinerary {
  id: number | string;
  title: string;
  startDate: string;
  days: number | null;
  budget: number | null;
  userId: number | string;
  destination: string;
  companion: string | null;
  pace: string | null;
  categories: string[];
  amenities: string[];
  isGuide: boolean | null;
  isAi: boolean | null;
  coverImage: string | null;
  currencySymbol?: string | null;
  currencyCode?: string | null;
  user?: CreatorUser;
  _count?: {
    savedPlaces: number;
    details: number;
    expenses: number;
    members: number;
  };
  expenses?: { amount: number; category?: string }[];
  settlements?: any[];
}

interface ExplorePost {
  id: number | string;
  title: string;
  description: string | null;
  coverImage: string | null;
  postType: string;
  destination: string | null;
  status: string;
  viewCount: number;
  author?: CreatorUser;
  originalItinerary?: {
    id: number | string;
    title: string;
    isGuide: boolean;
  };
  _count?: {
    items: number;
    likes: number;
  };
  items?: any[];
}

interface ChecklistItem {
  id: number | string;
  categoryId: number | string;
  name: string;
}

interface ChecklistCategory {
  id: number | string;
  name: string;
  tabType: string;
  items: ChecklistItem[];
}

const CURRENCY_RATES: Record<string, number> = {
  VND: 1.0,
  USD: 26320.01,
  EUR: 28500.0,
  JPY: 165.0,
  KRW: 19.5,
  THB: 720.0,
  CNY: 3620.0,
  GBP: 33500.0,
  SGD: 19400.0,
};

function convertExpenseToItineraryCurrency(exp: any, itinerary: any): number {
  if (!exp) return 0;
  const amt = Number(exp.amount) || 0;
  if (amt <= 0) return 0;

  let targetCode = (itinerary?.currencyCode || '').toString().trim().toUpperCase();
  const targetSymbol = (itinerary?.currencySymbol || '').toString().trim();

  if (!targetCode || targetCode === 'VND') {
    if (targetSymbol.includes('$') || targetSymbol.toUpperCase().includes('USD')) targetCode = 'USD';
    else if (targetSymbol.includes('€') || targetSymbol.toUpperCase().includes('EUR')) targetCode = 'EUR';
    else if (targetSymbol.includes('¥') || targetSymbol.toUpperCase().includes('JPY') || targetSymbol.toUpperCase().includes('CNY')) targetCode = 'JPY';
    else if (targetSymbol.includes('₩') || targetSymbol.toUpperCase().includes('KRW')) targetCode = 'KRW';
    else if (targetSymbol.includes('£') || targetSymbol.toUpperCase().includes('GBP')) targetCode = 'GBP';
    else if (targetSymbol.includes('฿') || targetSymbol.toUpperCase().includes('THB')) targetCode = 'THB';
    else targetCode = 'VND';
  }

  let expCode = (exp.currencyCode || exp.currency || '').toString().trim().toUpperCase();
  const expSymbol = (exp.currencySymbol || '').toString().trim();

  if (!expCode || expCode === 'VND') {
    if (expSymbol.includes('$') || expSymbol.toUpperCase().includes('USD')) expCode = 'USD';
    else if (expSymbol.includes('€') || expSymbol.toUpperCase().includes('EUR')) expCode = 'EUR';
    else if (expSymbol.includes('¥') || expSymbol.toUpperCase().includes('JPY') || expSymbol.toUpperCase().includes('CNY')) expCode = 'JPY';
    else if (expSymbol.includes('₩') || expSymbol.toUpperCase().includes('KRW')) expCode = 'KRW';
    else if (expSymbol.includes('£') || expSymbol.toUpperCase().includes('GBP')) expCode = 'GBP';
    else if (expSymbol.includes('฿') || expSymbol.toUpperCase().includes('THB')) expCode = 'THB';
    else if (expSymbol.includes('đ') || expSymbol.includes('₫') || expSymbol.toUpperCase().includes('VND')) expCode = 'VND';
    else if (amt < 1000 && targetCode === 'VND') {
      // Smart fallback: amounts < 1000 in a VND itinerary are USD expenses
      expCode = 'USD';
    }
  }

  if (expCode === targetCode) return amt;

  const expRate = CURRENCY_RATES[expCode] || 1.0;
  const targetRate = CURRENCY_RATES[targetCode] || 1.0;

  return (amt * expRate) / targetRate;
}

export default function ItinerariesPage() {
  // Helper to remove zip/postal codes (e.g. 94100, 65000, 900000) from address strings
  const formatAddress = (text?: string | null) => {
    if (!text) return '';
    return text.replace(/\s*\b\d{4,6}\b/g, '').trim();
  };

  // Helper to group saved places by section (ItinerarySection)
  const groupSavedPlacesBySection = (sections: any[] = [], savedPlaces: any[] = []) => {
    const sectionMap = new Map<string, { section: any; items: any[] }>();

    // 1. Add explicitly defined sections from ItinerarySection
    if (sections && Array.isArray(sections) && sections.length > 0) {
      sections.forEach((sec: any) => {
        const secName = sec.name && sec.name.trim() !== '' ? sec.name : 'Tổng quan';
        if (!sectionMap.has(secName)) {
          sectionMap.set(secName, {
            section: sec,
            items: [],
          });
        }
      });
    }

    // 2. Distribute savedPlaces into sectionMap
    if (savedPlaces && Array.isArray(savedPlaces) && savedPlaces.length > 0) {
      savedPlaces.forEach((sp: any) => {
        const secName = sp.section && sp.section.trim() !== '' ? sp.section : 'Tổng quan';
        if (!sectionMap.has(secName)) {
          sectionMap.set(secName, {
            section: { name: secName, subTitle: null, sectionType: 'LIST' },
            items: [],
          });
        }
        sectionMap.get(secName)!.items.push(sp);
      });
    }

    // Sort items inside each section by sortOrder ascending
    sectionMap.forEach((entry) => {
      entry.items.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    });

    return Array.from(sectionMap.values());
  };

  // Helper to parse todo/checklist items from JSON column (todoItems)
  const parseTodoItems = (rawTodo: any): Array<{ text: string; done: boolean }> => {
    if (!rawTodo) return [];
    let list: any[] = [];
    if (Array.isArray(rawTodo)) {
      list = rawTodo;
    } else if (typeof rawTodo === 'string') {
      try {
        const parsed = JSON.parse(rawTodo);
        if (Array.isArray(parsed)) list = parsed;
      } catch (_) {}
    }
    return list
      .map((item: any) => ({
        text: typeof item === 'string' ? item : item.text || item.title || item.name || '',
        done: !!item.done,
      }))
      .filter((t) => t.text.trim() !== '');
  };

  // Helper to parse ARGB decimal int or hex color string into a valid CSS color
  const parseSectionColor = (colorCode?: string | null) => {
    if (!colorCode) return null;
    const str = colorCode.toString().trim();
    if (/^\d+$/.test(str)) {
      const num = Number(str);
      const hex = num.toString(16).padStart(8, '0');
      return `#${hex.slice(2)}`;
    }
    if (str.startsWith('0x') || str.startsWith('0X')) {
      const hex = str.slice(2).padStart(8, '0');
      return `#${hex.slice(2)}`;
    }
    if (str.startsWith('#')) return str;
    return str;
  };

  // Helper to format opening hours
  const displayOpeningHours = (place: any) => {
    if (!place) return null;
    const rawHours = place.openingHours || place.opening_hours;
    if (typeof rawHours === 'string') return rawHours;
    if (rawHours && typeof rawHours === 'object') {
      if (rawHours.weekday_text && Array.isArray(rawHours.weekday_text)) {
        return rawHours.weekday_text[0];
      }
    }
    return null;
  };

  // Helper to parse JSON array columns
  const parseJsonArray = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
    return [];
  };

  // Helper to get privacy status badge info (Công khai, Bạn bè, Riêng tư)
  const getPrivacyBadgeInfo = (item?: any, trip?: any) => {
    const raw = (
      item?.privacy ||
      item?.privacyLevel ||
      item?.visibility ||
      trip?.companion ||
      trip?.privacy ||
      trip?.privacyLevel ||
      ''
    ).toString().toLowerCase().trim();

    if (raw.includes('công khai') || raw.includes('public')) {
      return {
        key: 'public',
        label: 'Công khai',
        icon: <Globe size={13} className="text-sky-600 dark:text-sky-400 shrink-0" />,
        badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-900/60',
        bannerBadgeClass: 'bg-sky-600/90 text-white border-sky-400/30'
      };
    } else if (raw.includes('riêng tư') || raw.includes('private') || raw.includes('lock')) {
      return {
        key: 'private',
        label: 'Riêng tư',
        icon: <Lock size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />,
        badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/60',
        bannerBadgeClass: 'bg-rose-600/90 text-white border-rose-400/30'
      };
    }
    // Default to 'Bạn bè' (Friends)
    return {
      key: 'friends',
      label: 'Bạn bè',
      icon: <Users size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />,
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60',
      bannerBadgeClass: 'bg-amber-600/90 text-white border-amber-400/30'
    };
  };

  // Helper to render icon component based on iconCode string or category name
  const renderIconFromCode = (iconCode?: string | number | null, fallback?: any) => {
    if (!iconCode) return fallback || <MapPin size={18} />;
    const str = iconCode.toString().toLowerCase().trim();

    if (
      str.includes('boat') ||
      str.includes('ship') ||
      str.includes('river') ||
      str.includes('tour') ||
      str.includes('bến') ||
      str.includes('thuyền') ||
      str.includes('sông') ||
      str === '58696' ||
      str === '0xe548' ||
      str === '58695'
    ) {
      return <Ship size={18} />;
    }
    if (
      str.includes('restaurant') ||
      str.includes('food') ||
      str.includes('eat') ||
      str.includes('utensil') ||
      str.includes('quán ăn') ||
      str.includes('nhà hàng') ||
      str.includes('ẩm thực') ||
      str === '58751' ||
      str.includes('0xe57f')
    ) {
      return <Utensils size={18} />;
    }
    if (
      str.includes('hotel') ||
      str.includes('bed') ||
      str.includes('stay') ||
      str.includes('khách sạn') ||
      str.includes('lưu trú') ||
      str === '58136' ||
      str.includes('0xe318')
    ) {
      return <Hotel size={18} />;
    }
    if (
      str.includes('flight') ||
      str.includes('plane') ||
      str.includes('chuyến bay') ||
      str === '58356'
    ) {
      return <Plane size={18} />;
    }
    if (
      str.includes('camera') ||
      str.includes('photo') ||
      str.includes('see') ||
      str.includes('tham quan') ||
      str.includes('điểm đến') ||
      str.includes('0xe412')
    ) {
      return <Camera size={18} />;
    }
    if (str.includes('coffee') || str.includes('cafe') || str.includes('cà phê') || str.includes('đồ uống')) {
      return <Coffee size={18} />;
    }
    if (str.includes('shopping') || str.includes('bag') || str.includes('store') || str.includes('mua sắm')) {
      return <ShoppingBag size={18} />;
    }
    if (str.includes('check') || str.includes('task') || str.includes('todo') || str.includes('checklist')) {
      return <CheckSquare size={18} />;
    }
    if (str.includes('compass') || str.includes('guide') || str.includes('hướng dẫn')) {
      return <Compass size={18} />;
    }
    if (str.includes('file') || str.includes('note') || str.includes('ghi chú')) {
      return <FileText size={18} />;
    }

    return fallback || <MapPin size={18} />;
  };

  // Unified renderer for Itinerary Item Cards (both in Days tab and Overview tab)
  const renderItineraryItemCard = (item: any, cardIdx: number, sectionColor?: string | null) => {
    const isPlace = !!item.place;
    const isPlaceholderNote = !item.noteText || item.noteText === 'Thêm ghi chú tại đây';

    // Lookup section color and iconCode if not directly passed
    const itemSection = item.section && selectedTripDetail?.sections
      ? selectedTripDetail.sections.find((s: any) => s.name === item.section)
      : null;

    const dayNum = Number(item.day);
    const dayConfig = dayNum > 0 && selectedTripDetail?.dayConfigs ? (() => {
      let configs = selectedTripDetail.dayConfigs;
      if (typeof configs === 'string') {
        try { configs = JSON.parse(configs); } catch (_) {}
      }
      return configs && typeof configs === 'object' ? (configs[dayNum.toString()] || configs[dayNum] || null) : null;
    })() : null;

    const itemSectionColor =
      sectionColor ||
      (itemSection ? parseSectionColor(itemSection.colorCode) : null) ||
      (dayConfig?.color ? parseSectionColor(dayConfig.color) : null);

    const itemIconCode =
      itemSection?.iconCode ||
      dayConfig?.iconCode ||
      dayConfig?.icon ||
      item.place?.category?.iconCode ||
      item.place?.category?.name;

    const rawTitle = isPlace
      ? item.place.name
      : !isPlaceholderNote
      ? item.noteText
      : 'Ghi chú / Hoạt động cá nhân';

    const todos = parseTodoItems(item.todoItems);
    const attachments = parseJsonArray(item.attachments);
    const reactions = parseJsonArray(item.reactions);
    const isTodoItem = todos.length > 0 || (rawTitle && rawTitle.startsWith('[TODO]'));
    const title = rawTitle ? rawTitle.replace(/^\[TODO\]\s*/i, '') : rawTitle;

    const customNote = isPlace && !isPlaceholderNote ? item.noteText : null;
    const openingHoursStr = isPlace ? displayOpeningHours(item.place) : null;
    const placePhoto = isPlace ? (item.place.image || item.place.photos?.[0]?.urlThumbnail || item.place.photos?.[0]?.urlOriginal) : null;
    const expenseAmount = item.expense ? `${item.expense.amount.toLocaleString('vi-VN')} ${item.expense.currencySymbol || 'đ'}` : null;

    // Render Note / Todo item (!isPlace) -> icon + title + todo items
    if (!isPlace) {
      return (
        <div
          key={item.id || cardIdx}
          onClick={() => handleOpenPlaceDetail(item)}
          className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 shadow-xs cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
        >
          {isTodoItem ? (
            <CheckSquare size={18} className="text-amber-500 shrink-0 mt-0.5" />
          ) : (
            <FileText size={18} className="text-amber-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100">
                {title}
              </h4>
              {item.isVisited && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 size={12} /> Đã ghé
                </span>
              )}
            </div>

            {/* Todo Checklist items list */}
            {todos.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800 space-y-1 pl-1">
                {todos.map((todo, tIdx) => (
                  <div key={tIdx} className="flex items-center gap-2 text-xs">
                    {todo.done ? (
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Circle size={13} className="text-gray-300 dark:text-slate-600 shrink-0" />
                    )}
                    <span className={todo.done ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-700 dark:text-slate-200'}>
                      {todo.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Render Place Item Card (matching user's reference design)
    return (
      <div
        key={item.id || cardIdx}
        onClick={() => handleOpenPlaceDetail(item)}
        className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs cursor-pointer hover:border-blue-400 hover:shadow-md transition-all space-y-3"
      >
        {/* Top row: Icon Badge + Title + Opening Hours + Category Badge & Image Thumbnail on Right */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 flex-1">
            <div
              className="w-10 h-10 rounded-full text-white font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-xs"
              style={{ backgroundColor: itemSectionColor || '#2196F3' }}
            >
              {renderIconFromCode(itemIconCode, <MapPin size={18} />)}
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-slate-100 leading-snug">
                {title}
              </h4>
              {openingHoursStr && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 font-medium">
                  <Clock size={12} className="shrink-0 text-gray-400" />
                  <span>{openingHoursStr}</span>
                </div>
              )}
              {item.place.category?.name && (
                <span className="inline-block px-2.5 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-[11px] font-bold rounded-lg mt-0.5">
                  {item.place.category.name}
                </span>
              )}
            </div>
          </div>
          {placePhoto && (
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-gray-100 dark:border-slate-800 bg-gray-100 dark:bg-slate-800 shadow-2xs">
              <img src={placePhoto} alt={title} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Custom note by user */}
        {customNote && (
          <p className="text-xs text-gray-600 dark:text-slate-300 italic font-medium bg-gray-50/80 dark:bg-slate-950 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
            "{customNote}"
          </p>
        )}

        {/* Action / Specs Badges Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-800/80 text-xs">
          {/* Ghé thăm */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-bold rounded-xl border transition-colors ${
              item.isVisited
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                : 'bg-gray-50 text-gray-400 dark:bg-slate-800/60 dark:text-slate-500 border-gray-100 dark:border-slate-800'
            }`}
          >
            <CheckCircle2 size={13} className={item.isVisited ? 'text-emerald-600' : 'opacity-40'} />
            {item.isVisited ? 'Đã ghé thăm' : 'Đánh dấu ghé thăm'}
          </span>

          {/* Giờ */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-bold rounded-xl border transition-colors ${
              item.startTime || item.endTime
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                : 'bg-gray-50 text-gray-400 dark:bg-slate-800/60 dark:text-slate-500 border-gray-100 dark:border-slate-800'
            }`}
          >
            <Clock size={13} className={item.startTime || item.endTime ? 'text-blue-600' : 'opacity-40'} />
            {item.startTime || item.endTime ? `${item.startTime || '00:00'} - ${item.endTime || '00:00'}` : 'Thêm giờ'}
          </span>

          {/* Đính kèm */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-bold rounded-xl border transition-colors ${
              attachments.length > 0
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60'
                : 'bg-gray-50 text-gray-400 dark:bg-slate-800/60 dark:text-slate-500 border-gray-100 dark:border-slate-800'
            }`}
          >
            <Paperclip size={13} className={attachments.length > 0 ? 'text-indigo-600' : 'opacity-40'} />
            {attachments.length > 0 ? `Đính kèm (${attachments.length})` : 'Đính kèm'}
          </span>

          {/* Chi phí / Giá */}
          {expenseAmount && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-extrabold rounded-xl border border-purple-200 dark:border-purple-900/60">
              <DollarSign size={13} className="text-purple-600" />
              {expenseAmount}
            </span>
          )}

          {/* Emojis / Reactions */}
          {reactions.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 rounded-full border border-amber-200 dark:border-amber-900 text-xs">
              {reactions.map((r: any) => typeof r === 'string' ? r : (r.emoji || '😊')).join(' ')}
            </span>
          ) : (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-50 dark:bg-slate-800 text-gray-400 border border-gray-100 dark:border-slate-800">
              <Smile size={14} className="opacity-40" />
            </span>
          )}
        </div>

        {/* Todo Checklist items list if any */}
        {todos.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-1 pl-1">
            {todos.map((todo, tIdx) => (
              <div key={tIdx} className="flex items-center gap-2 text-xs">
                {todo.done ? (
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                ) : (
                  <Circle size={13} className="text-gray-300 dark:text-slate-600 shrink-0" />
                )}
                <span className={todo.done ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-700 dark:text-slate-200'}>
                  {todo.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Main Tab State
  const [mainTab, setMainTab] = useState<'trips' | 'guides' | 'blogs' | 'checklists'>('trips');

  // Shared Toast State
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

  // ==========================================
  // TAB 1: CHUYẾN ĐI (TRIPS) STATE & LOGIC
  // ==========================================
  const [trips, setTrips] = useState<Itinerary[]>([]);
  const [tripsSearch, setTripsSearch] = useState('');
  const [tripsFilter, setTripsFilter] = useState<'all' | 'manual' | 'ai'>('all');
  const [tripsLoading, setTripsLoading] = useState(false);

  const [isTripDetailOpen, setIsTripDetailOpen] = useState(false);
  const [tripDetailLoading, setTripDetailLoading] = useState(false);
  const [selectedTripDetail, setSelectedTripDetail] = useState<any>(null);
  const [tripDetailActiveTab, setTripDetailActiveTab] = useState<'days' | 'overview' | 'expenses' | 'members'>('days');

  // Place Detail Modal State
  const [selectedPlaceItem, setSelectedPlaceItem] = useState<any>(null);
  const [isPlaceDetailOpen, setIsPlaceDetailOpen] = useState(false);

  const handleOpenPlaceDetail = (item: any) => {
    setSelectedPlaceItem(item);
    setIsPlaceDetailOpen(true);
  };



  const [isDeleteTripOpen, setIsDeleteTripOpen] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState<number | string | null>(null);
  const [deleteTripLoading, setDeleteTripLoading] = useState(false);

  const fetchTrips = async () => {
    setTripsLoading(true);
    try {
      const res = await fetch('/api/admin/itineraries?type=trip');
      if (!res.ok) throw new Error('Không thể tải danh sách chuyến đi.');
      const data = await res.json();
      setTrips(data || []);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải chuyến đi.', 'error');
    } finally {
      setTripsLoading(false);
    }
  };

  const handleOpenTripDetail = async (id: number | string) => {
    setIsTripDetailOpen(true);
    setTripDetailLoading(true);
    setTripDetailActiveTab('days');
    try {
      const res = await fetch(`/api/admin/itineraries/${id}`);
      if (!res.ok) throw new Error('Lỗi khi lấy thông tin chi tiết chuyến đi.');
      const data = await res.json();
      setSelectedTripDetail(data);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải chi tiết chuyến đi.', 'error');
      setIsTripDetailOpen(false);
    } finally {
      setTripDetailLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!deletingTripId) return;
    setDeleteTripLoading(true);
    try {
      const res = await fetch(`/api/admin/itineraries/${deletingTripId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Không thể xóa chuyến đi.');
      setTrips(trips.filter(t => t.id !== deletingTripId));
      setIsDeleteTripOpen(false);
      showToast('Xóa chuyến đi thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa chuyến đi.', 'error');
    } finally {
      setDeleteTripLoading(false);
      setDeletingTripId(null);
    }
  };

  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.title?.toLowerCase().includes(tripsSearch.toLowerCase()) ||
      t.destination?.toLowerCase().includes(tripsSearch.toLowerCase()) ||
      t.user?.fullName?.toLowerCase().includes(tripsSearch.toLowerCase());
    const isAi = t.isAi === true;
    const matchesType =
      tripsFilter === 'all' ||
      (tripsFilter === 'ai' && isAi) ||
      (tripsFilter === 'manual' && !isAi);
    return matchesSearch && matchesType;
  });

  // ==========================================
  // TAB 2: HƯỚNG DẪN DU LỊCH (GUIDES) STATE & LOGIC
  // ==========================================
  const [guides, setGuides] = useState<Itinerary[]>([]);
  const [guidesSearch, setGuidesSearch] = useState('');
  const [guidesLoading, setGuidesLoading] = useState(false);

  const [isGuideDetailOpen, setIsGuideDetailOpen] = useState(false);
  const [guideDetailLoading, setGuideDetailLoading] = useState(false);
  const [selectedGuideDetail, setSelectedGuideDetail] = useState<any>(null);

  const [isExportBlogOpen, setIsExportBlogOpen] = useState(false);
  const [exportingGuide, setExportingGuide] = useState<Itinerary | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogDescription, setBlogDescription] = useState('');
  const [exportBlogLoading, setExportBlogLoading] = useState(false);

  const fetchGuides = async () => {
    setGuidesLoading(true);
    try {
      const res = await fetch('/api/admin/itineraries?type=guide');
      if (!res.ok) throw new Error('Không thể tải danh sách Hướng dẫn.');
      const data = await res.json();
      setGuides(data || []);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải Hướng dẫn.', 'error');
    } finally {
      setGuidesLoading(false);
    }
  };

  const handleOpenGuideDetail = async (id: number | string) => {
    setIsGuideDetailOpen(true);
    setGuideDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/itineraries/${id}`);
      if (!res.ok) throw new Error('Lỗi khi tải thông tin Hướng dẫn.');
      const data = await res.json();
      setSelectedGuideDetail(data);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải Hướng dẫn.', 'error');
      setIsGuideDetailOpen(false);
    } finally {
      setGuideDetailLoading(false);
    }
  };

  const handleOpenExportBlog = (g: Itinerary) => {
    setExportingGuide(g);
    setBlogTitle(g.title);
    setBlogDescription(`Hướng dẫn du lịch ${g.destination} vô cùng chi tiết từ CloudMood.`);
    setIsExportBlogOpen(true);
  };

  const handleExportBlog = async () => {
    if (!exportingGuide) return;
    setExportBlogLoading(true);
    try {
      const res = await fetch(`/api/admin/guides/${exportingGuide.id}/publish-blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: blogTitle, description: blogDescription }),
      });
      if (!res.ok) throw new Error('Không thể xuất bài viết Blog.');
      showToast('Đã xuất bài Hướng dẫn thành bài viết Blog (ExplorePost) thành công!', 'success');
      setIsExportBlogOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xuất bài Blog.', 'error');
    } finally {
      setExportBlogLoading(false);
    }
  };

  const filteredGuides = guides.filter(g =>
    g.title?.toLowerCase().includes(guidesSearch.toLowerCase()) ||
    g.destination?.toLowerCase().includes(guidesSearch.toLowerCase()) ||
    g.user?.fullName?.toLowerCase().includes(guidesSearch.toLowerCase())
  );

  // ==========================================
  // TAB 3: BÀI VIẾT & BLOG (EXPLORE POSTS) STATE & LOGIC
  // ==========================================
  const [blogs, setBlogs] = useState<ExplorePost[]>([]);
  const [blogsSearch, setBlogsSearch] = useState('');
  const [blogsLoading, setBlogsLoading] = useState(false);

  const [isBlogDetailOpen, setIsBlogDetailOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<ExplorePost | null>(null);

  const [isCreateBlogOpen, setIsCreateBlogOpen] = useState(false);
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogDesc, setNewBlogDesc] = useState('');
  const [newBlogDest, setNewBlogDest] = useState('');
  const [newBlogCover, setNewBlogCover] = useState('');
  const [createBlogLoading, setCreateBlogLoading] = useState(false);

  const [isDeleteBlogOpen, setIsDeleteBlogOpen] = useState(false);
  const [deletingBlogId, setDeletingBlogId] = useState<number | string | null>(null);
  const [deleteBlogLoading, setDeleteBlogLoading] = useState(false);

  const fetchBlogs = async () => {
    setBlogsLoading(true);
    try {
      const res = await fetch('/api/admin/explore-posts');
      if (!res.ok) throw new Error('Không thể tải bài viết Blog.');
      const data = await res.json();
      setBlogs(data || []);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải Blog.', 'error');
    } finally {
      setBlogsLoading(false);
    }
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề bài viết.', 'error');
      return;
    }
    setCreateBlogLoading(true);
    try {
      const res = await fetch('/api/admin/explore-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBlogTitle,
          description: newBlogDesc,
          destination: newBlogDest,
          coverImage: newBlogCover || '/logo-xoanen-cloudmood.png',
          postType: 'BLOG',
          status: 'PUBLISHED',
        }),
      });
      if (!res.ok) throw new Error('Lỗi khi tạo bài Blog.');
      showToast('Tạo bài Blog thành công!', 'success');
      setIsCreateBlogOpen(false);
      setNewBlogTitle('');
      setNewBlogDesc('');
      setNewBlogDest('');
      setNewBlogCover('');
      fetchBlogs();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo Blog.', 'error');
    } finally {
      setCreateBlogLoading(false);
    }
  };

  const handleDeleteBlog = async () => {
    if (!deletingBlogId) return;
    setDeleteBlogLoading(true);
    try {
      const res = await fetch(`/api/admin/explore-posts/${deletingBlogId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Lỗi khi xóa bài Blog.');
      setBlogs(blogs.filter(b => b.id !== deletingBlogId));
      setIsDeleteBlogOpen(false);
      showToast('Đã xóa bài viết thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa bài viết.', 'error');
    } finally {
      setDeleteBlogLoading(false);
      setDeletingBlogId(null);
    }
  };

  const filteredBlogs = blogs.filter(b =>
    b.title?.toLowerCase().includes(blogsSearch.toLowerCase()) ||
    b.destination?.toLowerCase().includes(blogsSearch.toLowerCase()) ||
    b.author?.fullName?.toLowerCase().includes(blogsSearch.toLowerCase())
  );

  // ==========================================
  // TAB 4: CHECKLIST VẬT DỤNG CẦN THIẾT STATE & LOGIC
  // ==========================================
  const [checklists, setChecklists] = useState<ChecklistCategory[]>([]);
  const [checklistsLoading, setChecklistsLoading] = useState(false);

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ChecklistCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catTabType, setCatTabType] = useState('GENERAL');
  const [catLoading, setCatLoading] = useState(false);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<number | string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemLoading, setItemLoading] = useState(false);

  const fetchChecklists = async () => {
    setChecklistsLoading(true);
    try {
      const res = await fetch('/api/admin/checklist-templates');
      if (!res.ok) throw new Error('Không thể tải danh mục vật dụng.');
      const data = await res.json();
      setChecklists(data || []);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải vật dụng mẫu.', 'error');
    } finally {
      setChecklistsLoading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setCatLoading(true);
    try {
      if (editingCat) {
        const res = await fetch(`/api/admin/checklist-templates/categories/${editingCat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catName, tabType: catTabType }),
        });
        if (!res.ok) throw new Error('Lỗi cập nhật danh mục.');
        showToast('Cập nhật danh mục thành công!', 'success');
      } else {
        const res = await fetch('/api/admin/checklist-templates/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catName, tabType: catTabType }),
        });
        if (!res.ok) throw new Error('Lỗi tạo danh mục.');
        showToast('Tạo danh mục mới thành công!', 'success');
      }
      setIsCatModalOpen(false);
      fetchChecklists();
    } catch (err: any) {
      showToast(err.message || 'Thao tác thất bại.', 'error');
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number | string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này cùng toàn bộ vật dụng bên trong không?')) return;
    try {
      const res = await fetch(`/api/admin/checklist-templates/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Lỗi khi xóa danh mục.');
      showToast('Xóa danh mục thành công!', 'success');
      fetchChecklists();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa.', 'error');
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !selectedCatId) return;
    setItemLoading(true);
    try {
      const res = await fetch('/api/admin/checklist-templates/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: selectedCatId, name: itemName }),
      });
      if (!res.ok) throw new Error('Lỗi thêm vật dụng.');
      showToast('Thêm vật dụng thành công!', 'success');
      setIsItemModalOpen(false);
      fetchChecklists();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi thêm vật dụng.', 'error');
    } finally {
      setItemLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number | string) => {
    try {
      const res = await fetch(`/api/admin/checklist-templates/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Lỗi khi xóa vật dụng.');
      showToast('Xóa vật dụng thành công!', 'success');
      fetchChecklists();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa.', 'error');
    }
  };

  // Master Initial Fetch
  useEffect(() => {
    if (mainTab === 'trips') fetchTrips();
    else if (mainTab === 'guides') fetchGuides();
    else if (mainTab === 'blogs') fetchBlogs();
    else if (mainTab === 'checklists') fetchChecklists();
  }, [mainTab]);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-24 right-6 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[9999] animate-in fade-in slide-in-from-top-4 duration-200 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Quản lý hành trình
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Hệ thống quản lý tập trung các Chuyến đi (AI & Tự tạo), Hướng dẫn du lịch, Bài viết Blog và Vật dụng cần thiết
        </p>
      </div>

      {/* Main Top Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-xs gap-1">
        <button
          onClick={() => setMainTab('trips')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mainTab === 'trips'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          Chuyến đi (Trips)
        </button>

        <button
          onClick={() => setMainTab('guides')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mainTab === 'guides'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          Hướng dẫn du lịch
        </button>

        <button
          onClick={() => setMainTab('blogs')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mainTab === 'blogs'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          Bài viết & Blog
        </button>

        <button
          onClick={() => setMainTab('checklists')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mainTab === 'checklists'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          Vật dụng cần thiết
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CHUYẾN ĐI (TRIPS) */}
      {/* ========================================================================= */}
      {mainTab === 'trips' && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-xs">
              <span className="text-xs font-semibold uppercase text-indigo-100 block">Tổng chuyến đi</span>
              <span className="text-2xl font-extrabold block mt-1">{trips.length.toLocaleString()}</span>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-xs">
              <span className="text-xs font-semibold uppercase text-blue-100 block">AI tạo</span>
              <span className="text-2xl font-extrabold block mt-1">
                {trips.filter(t => t.isAi === true).length.toLocaleString()}
              </span>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-xs">
              <span className="text-xs font-semibold uppercase text-emerald-100 block">Tự tạo</span>
              <span className="text-2xl font-extrabold block mt-1">
                {trips.filter(t => !t.isAi).length.toLocaleString()}
              </span>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-xs">
              <span className="text-xs font-semibold uppercase text-amber-100 block">Tổng thực chi ghi nhận</span>
              <span className="text-xl font-extrabold block mt-1">
                {Math.round(trips.reduce((sum, t) => sum + (t.expenses?.reduce((a: number, b: any) => a + convertExpenseToItineraryCurrency(b, t), 0) || 0), 0)).toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm chuyến đi, điểm đến, creator..."
                  value={tripsSearch}
                  onChange={(e) => setTripsSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-hidden text-gray-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-950 p-1 rounded-xl">
                <button
                  onClick={() => setTripsFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${tripsFilter === 'all' ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-xs' : 'text-gray-500'}`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setTripsFilter('manual')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${tripsFilter === 'manual' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500'}`}
                >
                  Tự tạo
                </button>
                <button
                  onClick={() => setTripsFilter('ai')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${tripsFilter === 'ai' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500'}`}
                >
                  AI tạo
                </button>
              </div>
            </div>

            {tripsLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
                <p className="text-xs text-gray-500 mt-2">Đang tải danh sách chuyến đi...</p>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="py-16 text-center text-gray-400">Không tìm thấy chuyến đi nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-slate-950/50 text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-800">
                      <th className="px-6 py-3.5">Chuyến đi</th>
                      <th className="px-6 py-3.5">Điểm đến</th>
                      <th className="px-6 py-3.5 text-center">Lịch trình</th>
                      <th className="px-6 py-3.5">Dự toán / Thực chi</th>
                      <th className="px-6 py-3.5">Người tạo</th>
                      <th className="px-6 py-3.5">Loại hình</th>
                      <th className="px-6 py-3.5 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-sm">
                    {filteredTrips.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-gray-200 dark:border-slate-700 flex items-center justify-center">
                              {t.coverImage ? (
                                <img src={t.coverImage} alt={t.title} className="w-full h-full object-cover" />
                              ) : (
                                <Compass size={20} className="text-gray-400" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 dark:text-slate-100 block max-w-48 truncate">{t.title}</span>
                              <span className="text-[11px] text-gray-400 block">ID: #{t.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-3.5 font-semibold text-gray-900 dark:text-slate-100">
                          {t.destination}
                        </td>

                        <td className="px-6 py-3.5 text-center">
                          <span className="font-bold block">{t.days ? `${t.days} ngày` : 'Tự do'}</span>
                          <span className="text-xs text-gray-400 block">{t._count?.details || 0} mục lịch trình</span>
                        </td>

                        <td className="px-6 py-3.5 text-xs space-y-0.5">
                          <span className="block text-gray-500">Dự toán: <strong>{t.budget ? `${t.budget.toLocaleString('vi-VN')} ${t.currencySymbol || 'đ'}` : 'Chưa đặt'}</strong></span>
                          <span className="block text-emerald-600 font-semibold">Ghi nhận: {Math.round(t.expenses?.reduce((a: number, b: any) => a + convertExpenseToItineraryCurrency(b, t), 0) || 0).toLocaleString('vi-VN')} {t.currencySymbol || 'đ'}</span>
                        </td>

                        <td className="px-6 py-3.5">
                          <span className="font-semibold text-xs text-gray-900 dark:text-slate-100 block">{t.user?.fullName || 'N/A'}</span>
                          <span className="text-[11px] text-indigo-600 block">{t._count?.members || 1} thành viên</span>
                        </td>

                        <td className="px-6 py-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            {t.isAi ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700">
                                <Sparkles size={12} /> AI tạo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">
                                <User size={12} /> Tự tạo
                              </span>
                            )}
                            {(() => {
                              const priv = getPrivacyBadgeInfo(null, t);
                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${priv.badgeClass}`}>
                                  {priv.icon} {priv.label}
                                </span>
                              );
                            })()}
                          </div>
                        </td>

                        <td className="px-6 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenTripDetail(t.id)}
                              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Xem chi tiết Lịch trình & Chi tiêu"
                            >
                              <Eye size={14} />
                              Xem chi tiết
                            </button>
                            <button
                              onClick={() => { setDeletingTripId(t.id); setIsDeleteTripOpen(true); }}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                              title="Xóa chuyến đi"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HƯỚNG DẪN DU LỊCH (GUIDES) */}
      {/* ========================================================================= */}
      {mainTab === 'guides' && (
        <div className="space-y-6">

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm bài Hướng dẫn du lịch..."
                  value={guidesSearch}
                  onChange={(e) => setGuidesSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm"
                />
              </div>
            </div>

            {guidesLoading ? (
              <div className="py-16 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></div>
            ) : filteredGuides.length === 0 ? (
              <div className="py-16 text-center text-gray-400">Không tìm thấy bài Hướng dẫn nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-slate-950/50 text-gray-500 text-xs font-bold uppercase border-b border-gray-200 dark:border-slate-800">
                      <th className="px-6 py-3.5">Bài Hướng dẫn</th>
                      <th className="px-6 py-3.5">Điểm đến</th>
                      <th className="px-6 py-3.5 text-center">Địa điểm gợi ý</th>
                      <th className="px-6 py-3.5">Tác giả</th>
                      <th className="px-6 py-3.5 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredGuides.map((g) => (
                      <tr key={g.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20">
                        <td className="px-6 py-3.5 font-bold text-gray-900 dark:text-slate-100">{g.title}</td>
                        <td className="px-6 py-3.5 font-semibold text-gray-900 dark:text-slate-100">{g.destination}</td>
                        <td className="px-6 py-3.5 text-center font-bold">{g._count?.savedPlaces || 0} điểm</td>
                        <td className="px-6 py-3.5 font-semibold text-xs">{g.user?.fullName || 'N/A'}</td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenGuideDetail(g.id)}
                              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={14} />
                              Xem chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BÀI VIẾT & BLOG (EXPLORE POSTS) */}
      {/* ========================================================================= */}
      {mainTab === 'blogs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Danh sách bài viết ExplorePost & Blog</h3>
            <button onClick={() => setIsCreateBlogOpen(true)} className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
              <Plus size={16} /> Tạo Blog mới
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800">
              <input
                type="text"
                placeholder="Tìm bài viết Blog..."
                value={blogsSearch}
                onChange={(e) => setBlogsSearch(e.target.value)}
                className="w-full md:w-96 px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm"
              />
            </div>

            {blogsLoading ? (
              <div className="py-16 text-center"><Loader2 className="animate-spin text-purple-600 mx-auto" size={32} /></div>
            ) : filteredBlogs.length === 0 ? (
              <div className="py-16 text-center text-gray-400">Không có bài viết Blog nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-slate-950/50 text-gray-500 text-xs font-bold uppercase border-b border-gray-200 dark:border-slate-800">
                      <th className="px-6 py-3.5">Bài viết</th>
                      <th className="px-6 py-3.5">Điểm đến</th>
                      <th className="px-6 py-3.5">Nguồn</th>
                      <th className="px-6 py-3.5 text-center">Nội dung / Lượt thích</th>
                      <th className="px-6 py-3.5 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredBlogs.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20">
                        <td className="px-6 py-3.5 font-bold text-gray-900 dark:text-slate-100">{b.title}</td>
                        <td className="px-6 py-3.5 font-semibold">{b.destination || 'Toàn quốc'}</td>
                        <td className="px-6 py-3.5">
                          {b.originalItinerary ? (
                            <span className="text-xs text-indigo-600 font-bold">Từ Hướng dẫn (#{b.originalItinerary.id})</span>
                          ) : (
                            <span className="text-xs text-emerald-600 font-bold">Blog trực tiếp</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-center text-xs font-semibold">
                          {b._count?.items || 0} mục • ❤️ {b._count?.likes || 0}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => { setSelectedBlog(b); setIsBlogDetailOpen(true); }}
                              className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={14} />
                              Xem chi tiết
                            </button>
                            <button onClick={() => { setDeletingBlogId(b.id); setIsDeleteBlogOpen(true); }} className="p-1.5 text-gray-400 hover:text-rose-600"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VẬT DỤNG CẦN THIẾT (CHECKLIST TEMPLATES) */}
      {/* ========================================================================= */}
      {mainTab === 'checklists' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Danh mục & Gợi ý vật dụng hành lý</h3>
            <button onClick={() => { setEditingCat(null); setCatName(''); setCatTabType('GENERAL'); setIsCatModalOpen(true); }} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
              <FolderPlus size={16} /> Thêm danh mục
            </button>
          </div>

          {checklistsLoading ? (
            <div className="py-16 text-center"><Loader2 className="animate-spin text-emerald-600 mx-auto" size={32} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {checklists.map((cat) => (
                <div key={cat.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-slate-100">{cat.name}</h4>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase">{cat.tabType || 'GENERAL'}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingCat(cat); setCatName(cat.name); setCatTabType(cat.tabType); setIsCatModalOpen(true); }} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 text-gray-400 hover:text-rose-600"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="py-3 space-y-1.5 max-h-48 overflow-y-auto">
                      {cat.items?.map((item) => (
                        <div key={item.id} className="px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-950 text-xs font-semibold flex justify-between items-center">
                          <span>{item.name}</span>
                          <button onClick={() => handleDeleteItem(item.id)} className="text-gray-300 hover:text-rose-600 p-0.5"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCatId(cat.id); setItemName(''); setIsItemModalOpen(true); }} className="w-full py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 font-bold text-xs rounded-xl hover:bg-emerald-100 transition-colors">
                    + Thêm vật dụng
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS DETAIL & ACTION */}
      {/* ========================================================================= */}
      
      {/* 1. TRIP FULL DETAIL MODAL */}
      {isTripDetailOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden relative">
            
            {/* Banner & Header */}
            {tripDetailLoading ? (
              <div className="py-24 text-center">
                <Loader2 className="animate-spin text-blue-600 mx-auto" size={36} />
                <p className="text-sm font-semibold text-gray-500 mt-3">Đang tải toàn bộ dữ liệu chuyến đi...</p>
              </div>
            ) : selectedTripDetail ? (
              <>
                <div className="relative h-44 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 overflow-hidden shrink-0">
                  {selectedTripDetail.coverImage && (
                    <img src={selectedTripDetail.coverImage} alt="Cover" className="w-full h-full object-cover opacity-50" />
                  )}
                  <button
                    onClick={() => setIsTripDetailOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer z-10"
                  >
                    <X size={20} />
                  </button>
                  <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end text-white">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white">
                          {selectedTripDetail.isAi ? '⚡ AI tạo' : '✍️ Tự tạo'}
                        </span>
                        {(() => {
                          const priv = getPrivacyBadgeInfo(null, selectedTripDetail);
                          return (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border flex items-center gap-1 backdrop-blur-xs ${priv.bannerBadgeClass}`}>
                              {priv.icon}
                              {priv.label}
                            </span>
                          );
                        })()}
                        <span className="text-xs text-blue-200 font-semibold flex items-center gap-1">
                          <MapPin size={12} /> {selectedTripDetail.destination}
                        </span>
                      </div>
                      <h2 className="text-2xl font-extrabold tracking-wide drop-shadow-md">
                        {selectedTripDetail.title}
                      </h2>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-300 block">Dự toán chuyến đi</span>
                      <span className="text-lg font-black text-amber-400">
                        {selectedTripDetail.budget ? `${selectedTripDetail.budget.toLocaleString('vi-VN')} ${selectedTripDetail.currencySymbol || 'đ'}` : 'Tự do'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub Header info bar */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden shrink-0 border border-blue-200">
                      <img src={selectedTripDetail.user?.avatar || '/default-avatar.jpg'} alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-slate-100 block">{selectedTripDetail.user?.fullName}</span>
                      <span className="text-gray-400 block">{selectedTripDetail.user?.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-gray-600 dark:text-slate-300 font-medium">
                    <span>🗓️ {selectedTripDetail.days ? `${selectedTripDetail.days} ngày` : 'Nhiều ngày'}</span>
                    <span>👥 {selectedTripDetail.members?.length || 1} thành viên</span>
                    <span>💰 Thực chi: <strong>{Math.round(selectedTripDetail.expenses?.reduce((a: any, b: any) => a + convertExpenseToItineraryCurrency(b, selectedTripDetail), 0) || 0).toLocaleString('vi-VN')} {selectedTripDetail.currencySymbol || 'đ'}</strong></span>
                  </div>
                </div>

                {/* Modal Sub Tabs */}
                <div className="flex border-b border-gray-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 shrink-0">
                  <button
                    onClick={() => setTripDetailActiveTab('days')}
                    className={`py-3.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                      tripDetailActiveTab === 'days'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    🗓️ Lịch trình chi tiết ngày ({selectedTripDetail.details?.length || 0})
                  </button>
                  <button
                    onClick={() => setTripDetailActiveTab('overview')}
                    className={`py-3.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                      tripDetailActiveTab === 'overview'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    📍 Địa điểm lưu tổng quan ({selectedTripDetail.savedPlaces?.length || 0})
                  </button>
                  <button
                    onClick={() => setTripDetailActiveTab('expenses')}
                    className={`py-3.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                      tripDetailActiveTab === 'expenses'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    💰 Chi tiêu ({selectedTripDetail.expenses?.length || 0})
                  </button>
                  <button
                    onClick={() => setTripDetailActiveTab('members')}
                    className={`py-3.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                      tripDetailActiveTab === 'members'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    👥 Thành viên & Lời mời ({selectedTripDetail.members?.length || 0})
                  </button>
                </div>

                {/* Sub Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* TAB: LỊCH TRÌNH NGÀY */}
                  {tripDetailActiveTab === 'days' && (
                    <div className="space-y-4">
                      {(() => {
                        if (!selectedTripDetail.details || selectedTripDetail.details.length === 0) {
                          return <p className="text-gray-400 italic text-sm text-center py-6">Chưa có lịch trình chi tiết theo ngày.</p>;
                        }

                        const maxDayInDetails = Math.max(...selectedTripDetail.details.map((d: any) => Number(d.day) || 1), 1);
                        const totalDays = Number(selectedTripDetail.days) || maxDayInDetails;

                        const groupedByDay: Record<number, any[]> = {};
                        for (let i = 1; i <= totalDays; i++) {
                          groupedByDay[i] = [];
                        }
                        selectedTripDetail.details.forEach((d: any) => {
                          const dayNum = Number(d.day) > 0 ? Number(d.day) : 1;
                          if (!groupedByDay[dayNum]) {
                            groupedByDay[dayNum] = [];
                          }
                          groupedByDay[dayNum].push(d);
                        });

                        return (
                          <div className="space-y-4">
                            {Object.keys(groupedByDay).map((dayStr) => {
                              const dayNum = Number(dayStr);
                              const dayItems = groupedByDay[dayNum];
                              dayItems.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

                              // Extract dayConfig for this day from selectedTripDetail.dayConfigs
                              const dayConfig = (() => {
                                if (!selectedTripDetail?.dayConfigs) return null;
                                let configs = selectedTripDetail.dayConfigs;
                                if (typeof configs === 'string') {
                                  try {
                                    configs = JSON.parse(configs);
                                  } catch (_) {}
                                }
                                if (configs && typeof configs === 'object') {
                                  return configs[dayNum.toString()] || configs[dayNum] || null;
                                }
                                return null;
                              })();

                              const dayColor = dayConfig?.color ? parseSectionColor(dayConfig.color) : null;
                              const dayIconCode = dayConfig?.iconCode || dayConfig?.icon || dayConfig?.icon_code || null;
                              const dayTitle = dayConfig?.title || dayConfig?.subTitle || dayConfig?.name || null;

                              return (
                                <div
                                  key={dayNum}
                                  className="border border-gray-200 dark:border-slate-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-slate-950/40 space-y-3"
                                >
                                  {/* Day Header */}
                                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="px-3 py-1 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs"
                                        style={{ backgroundColor: dayColor || '#2563eb' }}
                                      >
                                        {dayIconCode && renderIconFromCode(dayIconCode, null)}
                                        <span>Ngày {dayNum} {selectedTripDetail.days ? `/ ${selectedTripDetail.days}` : ''}</span>
                                      </span>
                                      {dayTitle && (
                                        <span className="text-xs font-extrabold text-gray-800 dark:text-slate-200">
                                          • {dayTitle}
                                        </span>
                                      )}
                                      <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
                                        ({dayItems.length > 0 ? `${dayItems.length} địa điểm` : 'Lịch trình tự do'})
                                      </span>
                                    </div>
                                  </div>

                                  {/* Day Items */}
                                  {dayItems.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic py-2">Chưa cập nhật địa điểm cho Ngày {dayNum}.</p>
                                  ) : (
                                    <div className="space-y-2.5">
                                      {dayItems.map((item: any, idx: number) => renderItineraryItemCard(item, idx, dayColor))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* TAB: LƯU TỔNG QUAN */}
                  {tripDetailActiveTab === 'overview' && (
                    <div className="space-y-4">
                      {(() => {
                        const grouped = groupSavedPlacesBySection(
                          selectedTripDetail.sections,
                          selectedTripDetail.savedPlaces
                        );

                        if (grouped.length === 0 || selectedTripDetail.savedPlaces?.length === 0) {
                          return (
                            <p className="text-gray-400 italic text-sm text-center py-6">
                              Chưa có địa điểm lưu tổng quan.
                            </p>
                          );
                        }

                        return grouped.map(({ section, items }, idx) => {
                          const isChecklist = section.sectionType === 'CHECKLIST';
                          const sectionColor = parseSectionColor(section.colorCode);

                          return (
                            <div
                              key={section.id || section.name || idx}
                              className="border border-gray-200 dark:border-slate-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-slate-950/40 space-y-3 shadow-2xs"
                            >
                              {/* Section Header (ItinerarySection) */}
                              <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 text-white"
                                    style={{
                                      backgroundColor: sectionColor || (isChecklist ? '#d97706' : '#2563eb'),
                                    }}
                                  >
                                    {isChecklist ? <CheckSquare size={15} /> : <Layers size={15} />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4
                                        className="font-bold text-sm text-gray-900 dark:text-slate-100"
                                        style={{ color: sectionColor || undefined }}
                                      >
                                        {section.name}
                                      </h4>
                                      {isChecklist && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-md">
                                          Checklist
                                        </span>
                                      )}
                                    </div>
                                    {section.subTitle && (
                                      <p className="text-xs text-gray-500 dark:text-slate-400">
                                        {section.subTitle}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-2.5 py-1 rounded-xl">
                                  {items.length} địa điểm
                                </span>
                              </div>

                              {/* Section Child Items (ItinerarySavedPlace) */}
                              {items.length === 0 ? (
                                <p className="text-xs text-gray-400 italic py-2">
                                  Chưa có địa điểm hoặc ghi chú nào trong mục này.
                                </p>
                              ) : (
                                <div className="space-y-2.5">
                                  {items.map((sp: any, idx: number) => renderItineraryItemCard(sp, idx, sectionColor))}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {/* TAB: CHI TIÊU & QUYẾT TOÁN */}
                  {tripDetailActiveTab === 'expenses' && (
                    <div className="space-y-5">
                      {/* Summary Stat Cards */}
                      {(() => {
                        const expensesList = selectedTripDetail.expenses || [];
                        const directSettlements = selectedTripDetail.settlements || [];
                        const expenseSettlements = (selectedTripDetail.expenses || []).flatMap((e: any) => e.settlements || []);
                        const settlementsMap = new Map();
                        [...directSettlements, ...expenseSettlements].forEach((st: any) => {
                          if (st && st.id) settlementsMap.set(st.id.toString(), st);
                        });
                        const settlementsList = Array.from(settlementsMap.values());

                        const totalSpent = Math.round(expensesList.reduce((acc: number, curr: any) => acc + convertExpenseToItineraryCurrency(curr, selectedTripDetail), 0));
                        const totalSettled = settlementsList.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
                        const currSym = selectedTripDetail.currencySymbol || 'đ';
                        const budget = selectedTripDetail.budget;
                        const remaining = budget ? budget - totalSpent : null;

                        return (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Dự toán */}
                              <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                                <span className="text-xs font-bold text-gray-500 block mb-1">Dự toán ngân sách</span>
                                <span className="text-lg font-black text-amber-500">
                                  {budget ? `${budget.toLocaleString('vi-VN')} ${currSym}` : 'Tự do'}
                                </span>
                              </div>

                              {/* Thực chi */}
                              <div className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-2xs">
                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block mb-1">Tổng đã chi</span>
                                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                  {totalSpent.toLocaleString('vi-VN')} {currSym}
                                </span>
                              </div>

                              {/* Còn lại */}
                              <div className="p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 shadow-2xs">
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block mb-1">
                                  {remaining !== null && remaining < 0 ? 'Vượt dự toán' : 'Còn lại'}
                                </span>
                                <span className={`text-lg font-black ${remaining !== null && remaining < 0 ? 'text-rose-600' : 'text-blue-600 dark:text-blue-400'}`}>
                                  {remaining !== null ? `${remaining.toLocaleString('vi-VN')} ${currSym}` : 'Không giới hạn'}
                                </span>
                              </div>
                            </div>

                            {/* List 1: Danh sách Khoản chi (ItineraryExpense) */}
                            <div className="space-y-3 pt-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Receipt size={14} className="text-emerald-500" /> Danh sách khoản chi ({expensesList.length})
                                </h4>
                              </div>

                              {expensesList.length === 0 ? (
                                <p className="text-gray-400 italic text-xs text-center py-4 bg-gray-50 dark:bg-slate-950 rounded-2xl">
                                  Chưa có ghi nhận khoản chi tiêu nào.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {expensesList.map((e: any) => {
                                    const linkedPlaceName = e.savedPlace?.place?.name || e.detail?.place?.name;
                                    const hasSettlements = e.settlements && e.settlements.length > 0;

                                    return (
                                      <div
                                        key={e.id}
                                        className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
                                      >
                                        {/* Top Header Row */}
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                              {renderIconFromCode(e.category, <Receipt size={18} />)}
                                            </div>
                                            <div>
                                              <h5 className="font-extrabold text-sm text-gray-900 dark:text-slate-100">
                                                {e.title}
                                              </h5>
                                              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded-md font-bold text-[11px] text-gray-700 dark:text-slate-300">
                                                  {e.category || 'Khác'}
                                                </span>
                                                {e.date && <span>• 🗓️ {e.date}</span>}
                                              </div>
                                            </div>
                                          </div>

                                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                                            {e.amount?.toLocaleString('vi-VN')} {e.currencySymbol || currSym}
                                          </span>
                                        </div>

                                        {/* Detail attributes: Payer, Share, Linked Place */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-300">
                                          <div>
                                            <span className="text-gray-400">👤 Người thanh toán: </span>
                                            <strong className="text-gray-800 dark:text-slate-200">{e.payer || 'Không rõ'}</strong>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">👥 Phân chia: </span>
                                            <strong className="text-gray-800 dark:text-slate-200">{e.share || 'Không chia'}</strong>
                                          </div>
                                          {linkedPlaceName && (
                                            <div className="col-span-1 sm:col-span-2 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                                              <MapPin size={12} /> Gắn với địa điểm: <strong>{linkedPlaceName}</strong>
                                            </div>
                                          )}
                                        </div>

                                        {/* Linked Settlements */}
                                        {hasSettlements && (
                                          <div className="p-3 bg-purple-50/60 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30 text-xs space-y-1.5">
                                            <span className="font-bold text-purple-700 dark:text-purple-300 block text-[11px] uppercase tracking-wider">
                                              💸 Lịch sử quyết toán khoản này ({e.settlements.length}):
                                            </span>
                                            {e.settlements.map((s: any) => (
                                              <div key={s.id} className="flex justify-between items-center text-purple-900 dark:text-purple-200 font-medium">
                                                <span>
                                                  👤 <strong>{s.fromName}</strong> ➔ <strong>{s.toName}</strong>
                                                </span>
                                                <span className="font-extrabold text-purple-600 dark:text-purple-400">
                                                  {s.amount?.toLocaleString('vi-VN')} {currSym}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* List 2: Danh sách Quyết toán nhóm (ItinerarySettlement) */}
                            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Receipt size={14} className="text-purple-500" /> Lịch sử quyết toán nhóm (ItinerarySettlement) ({settlementsList.length})
                                </h4>
                              </div>

                              {settlementsList.length === 0 ? (
                                <p className="text-gray-400 italic text-xs text-center py-4 bg-gray-50 dark:bg-slate-950 rounded-2xl">
                                  Chưa có giao dịch quyết toán nhóm nào.
                                </p>
                              ) : (
                                <div className="space-y-2.5">
                                  {settlementsList.map((s: any) => (
                                    <div
                                      key={s.id}
                                      className="p-3.5 rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between text-xs"
                                    >
                                      <div className="space-y-0.5">
                                        <div className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                                          <span className="text-purple-600 dark:text-purple-400 font-extrabold">{s.fromName}</span>
                                          <span className="text-gray-400">chuyển cho</span>
                                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{s.toName}</span>
                                        </div>
                                        {s.date && (
                                          <span className="text-[11px] text-gray-400 block">
                                            ⏱️ {new Date(s.date).toLocaleDateString('vi-VN')} {new Date(s.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-sm font-black text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-3 py-1 rounded-xl">
                                        {s.amount?.toLocaleString('vi-VN')} {currSym}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* TAB: THÀNH VIÊN & LỜI MỜI */}
                  {tripDetailActiveTab === 'members' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thành viên tham gia ({selectedTripDetail.members?.length || 0})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedTripDetail.members?.map((m: any) => (
                          <div key={m.id} className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center shrink-0">
                              <img src={m.user?.avatar || '/default-avatar.jpg'} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="font-bold text-xs text-gray-900 dark:text-slate-100 block">{m.user?.fullName}</span>
                              <span className="text-[11px] text-gray-400 block">{m.user?.email} • Vai trò: <strong className="text-blue-600">{m.role}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedTripDetail.invites?.length > 0 && (
                        <>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Lời mời cộng tác ({selectedTripDetail.invites.length})</h4>
                          <div className="space-y-2">
                            {selectedTripDetail.invites.map((inv: any) => (
                              <div key={inv.id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 text-xs flex justify-between items-center">
                                <span>📧 Lời mời tới: <strong>{inv.email || 'Token Link'}</strong> (Vai trò: {inv.role})</span>
                                <span className="font-bold text-amber-700">{inv.status}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* 2. GUIDE DETAIL MODAL */}
      {isGuideDetailOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden relative">
            {guideDetailLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
                <p className="text-xs text-gray-500 mt-2">Đang tải chi tiết bài Hướng dẫn...</p>
              </div>
            ) : selectedGuideDetail ? (
              <>
                {/* Banner & Header */}
                <div className="relative h-44 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 overflow-hidden shrink-0">
                  {selectedGuideDetail.coverImage && (
                    <img src={selectedGuideDetail.coverImage} alt="Cover" className="w-full h-full object-cover opacity-50" />
                  )}
                  <button
                    onClick={() => setIsGuideDetailOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer z-10"
                  >
                    <X size={20} />
                  </button>
                  <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end text-white">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-600 text-white">
                          📖 Hướng dẫn du lịch
                        </span>
                        {(() => {
                          const priv = getPrivacyBadgeInfo(null, selectedGuideDetail);
                          return (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border flex items-center gap-1 backdrop-blur-xs ${priv.bannerBadgeClass}`}>
                              {priv.icon}
                              {priv.label}
                            </span>
                          );
                        })()}
                        <span className="text-xs text-indigo-200 font-semibold flex items-center gap-1">
                          <MapPin size={12} /> {selectedGuideDetail.destination}
                        </span>
                      </div>
                      <h2 className="text-2xl font-extrabold tracking-wide drop-shadow-md">
                        {selectedGuideDetail.title}
                      </h2>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-300 block">Địa điểm gợi ý</span>
                      <span className="text-lg font-black text-amber-400">
                        {selectedGuideDetail.savedPlaces?.length || 0} địa điểm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub Header info bar */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 overflow-hidden shrink-0 border border-indigo-200">
                      <img src={selectedGuideDetail.user?.avatar || '/default-avatar.jpg'} alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-slate-100 block">{selectedGuideDetail.user?.fullName || 'Tác giả'}</span>
                      <span className="text-gray-400 block">{selectedGuideDetail.user?.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-gray-600 dark:text-slate-300 font-medium">
                    <span>📍 {selectedGuideDetail.destination}</span>
                    <span>📌 {selectedGuideDetail.savedPlaces?.length || 0} địa điểm gợi ý</span>
                  </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Danh sách địa điểm lưu gợi ý ({selectedGuideDetail.savedPlaces?.length || 0})
                  </h4>
                  {(() => {
                    const grouped = groupSavedPlacesBySection(
                      selectedGuideDetail.sections,
                      selectedGuideDetail.savedPlaces
                    );

                    if (grouped.length === 0 || selectedGuideDetail.savedPlaces?.length === 0) {
                      return (
                        <p className="text-gray-400 italic text-sm text-center py-6">
                          Chưa có địa điểm lưu nào.
                        </p>
                      );
                    }

                    return grouped.map(({ section, items }, idx) => {
                      const isChecklist = section.sectionType === 'CHECKLIST';
                      const sectionColor = parseSectionColor(section.colorCode);

                      return (
                        <div
                          key={section.id || section.name || idx}
                          className="border border-gray-200 dark:border-slate-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-slate-950/40 space-y-3"
                        >
                          {/* Section Header */}
                          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                                  isChecklist
                                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                                    : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                                }`}
                              >
                                {isChecklist ? <CheckSquare size={15} /> : <Layers size={15} />}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100">
                                  {section.name}
                                </h4>
                                {section.subTitle && (
                                  <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {section.subTitle}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-2.5 py-1 rounded-xl">
                              {items.length} địa điểm
                            </span>
                          </div>

                          {/* Section Items */}
                          {items.length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-2">
                              Chưa có địa điểm trong mục này.
                            </p>
                          ) : (
                            <div className="space-y-2.5">
                              {items.map((sp: any, iIdx: number) => renderItineraryItemCard(sp, iIdx, sectionColor))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 flex justify-end gap-3">
                  <button onClick={() => setIsGuideDetailOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-xs font-bold rounded-xl text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors cursor-pointer">Đóng</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* 3. BLOG DETAIL MODAL */}
      {isBlogDetailOpen && selectedBlog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden relative">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950">
              <div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md inline-block mb-1">
                  📰 Bài viết Blog Khám phá (ExplorePost)
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{selectedBlog.title}</h3>
              </div>
              <button onClick={() => setIsBlogDetailOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{selectedBlog.description}</p>
              <h4 className="text-xs font-bold text-gray-400 uppercase">Mục nội dung bài viết ({selectedBlog.items?.length || 0})</h4>
              <div className="space-y-2.5">
                {selectedBlog.items?.map((item: any) => {
                  const isHeader = item.itemType === 'SECTION_HEADER';
                  const isNote = item.itemType === 'NOTE';
                  const isPlace = item.itemType === 'PLACE' || !!item.place;

                  const contentText = item.content && item.content !== 'Thêm ghi chú tại đây' ? item.content : null;

                  if (isHeader) {
                    return (
                      <div key={item.id} className="pt-2 pb-1 border-b border-purple-100 dark:border-purple-900/40">
                        <h4 className="font-extrabold text-sm text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                          📌 {contentText || 'Phần nội dung'}
                        </h4>
                      </div>
                    );
                  }

                  if (isNote) {
                    return (
                      <div key={item.id} className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs">
                        <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">📝 Ghi chú bài viết:</span>
                        <p className="text-gray-700 dark:text-slate-300 italic">{contentText || 'Ghi chú thêm từ tác giả'}</p>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 flex items-start gap-3 text-xs">
                      <MapPin size={18} className="text-purple-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-bold text-sm text-gray-900 dark:text-slate-100">{item.place?.name || contentText || 'Địa điểm bài viết'}</h5>
                        {item.place?.address && <p className="text-xs text-gray-500 mt-0.5">{formatAddress(item.place.address)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Export Blog Modal */}
      {isExportBlogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Xuất Hướng dẫn thành bài Blog</h3>
            <div>
              <label className="block text-xs font-bold mb-1">Tiêu đề Blog</label>
              <input type="text" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Mô tả</label>
              <textarea rows={3} value={blogDescription} onChange={(e) => setBlogDescription(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsExportBlogOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Hủy</button>
              <button onClick={handleExportBlog} disabled={exportBlogLoading} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm">
                {exportBlogLoading && <Loader2 size={14} className="animate-spin inline mr-1" />} Xuất Blog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Blog Modal */}
      {isCreateBlogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <form onSubmit={handleCreateBlog} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Tạo bài viết Blog mới</h3>
            <input type="text" required placeholder="Tiêu đề bài viết..." value={newBlogTitle} onChange={(e) => setNewBlogTitle(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
            <input type="text" placeholder="Điểm đến..." value={newBlogDest} onChange={(e) => setNewBlogDest(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
            <textarea rows={3} placeholder="Mô tả bài viết..." value={newBlogDesc} onChange={(e) => setNewBlogDesc(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsCreateBlogOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Hủy</button>
              <button type="submit" disabled={createBlogLoading} className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-sm">Lưu Blog</button>
            </div>
          </form>
        </div>
      )}

      {/* Checklist Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <form onSubmit={handleSaveCategory} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{editingCat ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>
            <input type="text" required placeholder="Tên danh mục..." value={catName} onChange={(e) => setCatName(e.target.value)} className="w-full p-2 border rounded-xl text-sm font-semibold" />
            <input type="text" placeholder="Tab Type (GENERAL, CLOTHES...)" value={catTabType} onChange={(e) => setCatTabType(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsCatModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Hủy</button>
              <button type="submit" disabled={catLoading} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm">Lưu Danh mục</button>
            </div>
          </form>
        </div>
      )}

      {/* Checklist Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <form onSubmit={handleSaveItem} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Thêm vật dụng mới</h3>
            <input type="text" required placeholder="Tên vật dụng..." value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full p-2 border rounded-xl text-sm font-semibold" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Hủy</button>
              <button type="submit" disabled={itemLoading} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm">Thêm</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Trip Confirmation Modal */}
      {isDeleteTripOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsDeleteTripOpen(false)} className="absolute right-4 top-4 text-gray-400"><X size={18} /></button>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><Trash2 size={20} /></div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Xác nhận xóa chuyến đi</h3>
                <p className="text-gray-500 text-sm mt-1">Thao tác này sẽ xóa vĩnh viễn dữ liệu chuyến đi, lịch trình chi tiết và chi tiêu liên quan.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button onClick={() => setIsDeleteTripOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-sm">Hủy</button>
              <button onClick={handleDeleteTrip} disabled={deleteTripLoading} className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-sm flex items-center gap-2">
                {deleteTripLoading && <Loader2 size={16} className="animate-spin" />}
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHI TIẾT ĐỊA ĐIỂM / GHI CHÚ / CONG VIEC (DETAIL MODAL) */}
      {isPlaceDetailOpen && selectedPlaceItem && (() => {
        const isPlace = !!selectedPlaceItem.place;

        // RENDER DEDICATED MODAL FOR NOTE OR TODO CHECKLIST ITEM
        if (!isPlace) {
          const rawTitle = selectedPlaceItem.noteText || 'Ghi chú / Công việc';
          const todos = parseTodoItems(selectedPlaceItem.todoItems);
          const isTodoItem = todos.length > 0 || (rawTitle && rawTitle.startsWith('[TODO]'));
          const title = rawTitle ? rawTitle.replace(/^\[TODO\]\s*/i, '') : rawTitle;
          const doneCount = todos.filter((t: any) => t.done).length;
          const totalCount = todos.length;
          const attachments = parseJsonArray(selectedPlaceItem.attachments);
          const reactions = parseJsonArray(selectedPlaceItem.reactions);

          return (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[85vh] my-auto">
                {/* Header Bar */}
                <div
                  className={`p-6 border-b flex items-start justify-between ${
                    isTodoItem
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40'
                      : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                        isTodoItem ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {isTodoItem ? <CheckSquare size={20} /> : <FileText size={20} />}
                    </div>
                    <div className="space-y-1">
                      <span
                        className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg inline-block ${
                          isTodoItem
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {isTodoItem ? '☑️ Danh sách công việc (Checklist)' : '📝 Ghi chú riêng (Note)'}
                      </span>
                      <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 leading-snug">
                        {title}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPlaceDetailOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full transition-colors cursor-pointer shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  {/* Meta Info (Section & Day) */}
                  <div className="flex flex-wrap items-center gap-3 text-xs bg-gray-50 dark:bg-slate-950 p-3 rounded-2xl border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400">
                    {selectedPlaceItem.section && (
                      <div>
                        Mục (Section): <strong className="text-gray-900 dark:text-slate-100">{selectedPlaceItem.section}</strong>
                      </div>
                    )}
                    {selectedPlaceItem.day && (
                      <div>
                        • Lịch trình: <strong className="text-gray-900 dark:text-slate-100">Ngày {selectedPlaceItem.day}</strong>
                      </div>
                    )}
                  </div>

                  {/* Content Display */}
                  {isTodoItem ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-500">Các mục cần hoàn thành ({doneCount}/{totalCount})</span>
                        <span className={doneCount === totalCount && totalCount > 0 ? 'text-emerald-600 font-extrabold' : 'text-blue-600'}>
                          {totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                          style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                      {/* Todos list */}
                      <div className="space-y-2 pt-1">
                        {todos.map((todo: any, tIdx: number) => (
                          <div
                            key={tIdx}
                            className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${
                              todo.done
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                                : 'bg-gray-50/50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-800 dark:text-slate-200'
                            }`}
                          >
                            {todo.done ? (
                              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <Circle size={16} className="text-gray-400 shrink-0 mt-0.5" />
                            )}
                            <span className={todo.done ? 'line-through opacity-80 font-medium' : 'font-semibold'}>
                              {todo.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Nội dung ghi chú</span>
                      <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs leading-relaxed text-gray-800 dark:text-slate-200 font-medium italic">
                        "{title}"
                      </div>
                    </div>
                  )}

                  {/* Attachments / Expense / Reactions Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs">
                    {/* Visited Status */}
                    {selectedPlaceItem.isVisited && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                        <CheckCircle2 size={14} className="text-emerald-600" /> Đã hoàn thành
                      </span>
                    )}

                    {/* Attachments */}
                    {attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 font-bold rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs">
                        <Paperclip size={14} className="text-indigo-600" /> Đính kèm ({attachments.length})
                      </span>
                    )}

                    {/* Expense */}
                    {selectedPlaceItem.expense && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 font-extrabold rounded-xl border border-purple-200 text-xs">
                        <span className="text-purple-600 font-bold">$</span>
                        {selectedPlaceItem.expense.amount?.toLocaleString('vi-VN')} {selectedPlaceItem.expense.currencySymbol || selectedTripDetail?.currencySymbol || 'đ'}
                      </span>
                    )}

                    {/* Reactions */}
                    {reactions.length > 0 && (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                        <Smile size={14} className="text-amber-500 shrink-0" />
                        <span className="font-bold text-amber-700">{reactions.join(' ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-950/80 flex justify-end">
                  <button
                    onClick={() => setIsPlaceDetailOpen(false)}
                    className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-xs font-bold rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-900 cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // RENDER STANDARD PLACE DETAIL MODAL IF IT IS A PLACE
        return (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[90vh] my-auto">
              {/* Modal Banner Header */}
              <div className="relative h-56 w-full bg-slate-900 overflow-hidden shrink-0">
                {selectedPlaceItem.place?.image || selectedPlaceItem.place?.photos?.[0]?.urlOriginal ? (
                  <img
                    src={selectedPlaceItem.place?.image || selectedPlaceItem.place?.photos?.[0]?.urlOriginal}
                    alt={selectedPlaceItem.place?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-900 text-white font-bold text-lg">
                    <MapPin size={48} className="opacity-40" />
                  </div>
                )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={() => setIsPlaceDetailOpen(false)}
                className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-xs cursor-pointer z-10"
              >
                <X size={18} />
              </button>

              {/* Category & Tag Badges */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div>
                  {selectedPlaceItem.place?.category?.name && (
                    <span className="px-2.5 py-1 bg-blue-600/90 text-white font-extrabold text-[11px] rounded-lg inline-block mb-1 shadow-sm backdrop-blur-xs">
                      📍 {selectedPlaceItem.place.category.name}
                    </span>
                  )}
                  <h3 className="text-xl font-extrabold text-white drop-shadow-md">
                    {selectedPlaceItem.place?.name || (selectedPlaceItem.noteText ? selectedPlaceItem.noteText.replace(/^\[TODO\]\s*/i, '') : 'Chi tiết địa điểm')}
                  </h3>
                </div>
                {selectedPlaceItem.place?.rating && (
                  <div className="flex items-center gap-1 bg-amber-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg shrink-0 shadow-sm">
                    <Star size={14} className="fill-white" />
                    <span>{selectedPlaceItem.place.rating}</span>
                    {selectedPlaceItem.place.userRatingCount && (
                      <span className="text-[10px] font-normal opacity-90">({selectedPlaceItem.place.userRatingCount})</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Body Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Thông tin do người dùng lưu trong hành trình */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-3">
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} /> Thông tin lưu trong chuyến đi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedPlaceItem.section && (
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Mục (Section): </span>
                      <strong className="text-gray-800 dark:text-slate-200">{selectedPlaceItem.section}</strong>
                    </div>
                  )}
                  {selectedPlaceItem.day && (
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Lịch trình: </span>
                      <strong className="text-gray-800 dark:text-slate-200">Ngày {selectedPlaceItem.day}</strong>
                    </div>
                  )}
                </div>

                {/* Custom note by user */}
                {selectedPlaceItem.noteText && selectedPlaceItem.noteText !== selectedPlaceItem.place?.name && (
                  <div className="text-xs">
                    <span className="text-gray-500 dark:text-slate-400 block mb-0.5 font-semibold">Ghi chú riêng của bạn:</span>
                    <p className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-blue-900/30 text-gray-800 dark:text-slate-200 italic font-medium">
                      "{selectedPlaceItem.noteText.replace(/^\[TODO\]\s*/i, '')}"
                    </p>
                  </div>
                )}

                {/* Action / Specs Badges Row (User custom info matching item card bar) */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-blue-100 dark:border-blue-900/40 text-xs">
                  {/* Ghé thăm */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 font-bold rounded-xl border transition-colors ${
                      selectedPlaceItem.isVisited
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-800'
                    }`}
                  >
                    <CheckCircle2 size={14} className={selectedPlaceItem.isVisited ? 'text-emerald-600' : 'opacity-40'} />
                    {selectedPlaceItem.isVisited ? 'Đã ghé thăm' : 'Đánh dấu ghé thăm'}
                  </span>

                  {/* Giờ */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 font-bold rounded-xl border transition-colors ${
                      selectedPlaceItem.startTime || selectedPlaceItem.endTime
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900/60 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-800'
                    }`}
                  >
                    <Clock size={14} className={selectedPlaceItem.startTime || selectedPlaceItem.endTime ? 'text-blue-600' : 'opacity-40'} />
                    {selectedPlaceItem.startTime || selectedPlaceItem.endTime
                      ? `${selectedPlaceItem.startTime || '00:00'} - ${selectedPlaceItem.endTime || '00:00'}`
                      : 'Thêm giờ'}
                  </span>

                  {/* Đính kèm */}
                  {(() => {
                    const atts = parseJsonArray(selectedPlaceItem.attachments);
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 font-bold rounded-xl border transition-colors ${
                          atts.length > 0
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60 shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-800'
                        }`}
                      >
                        <Paperclip size={14} className={atts.length > 0 ? 'text-indigo-600' : 'opacity-40'} />
                        {atts.length > 0 ? `Đính kèm (${atts.length})` : 'Đính kèm'}
                      </span>
                    );
                  })()}

                  {/* Chi phí do người dùng thêm */}
                  {selectedPlaceItem.expense && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-extrabold rounded-xl border border-purple-200 dark:border-purple-900/60 shadow-2xs">
                      <span className="text-purple-600 font-bold">$</span>
                      {selectedPlaceItem.expense.amount?.toLocaleString('vi-VN')} {selectedPlaceItem.expense.currencySymbol || selectedTripDetail?.currencySymbol || 'đ'}
                    </span>
                  )}

                  {/* Cảm xúc / Reactions / Emojis */}
                  {(() => {
                    const reactArr = parseJsonArray(selectedPlaceItem.reactions);
                    if (reactArr.length === 0) return null;
                    return (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs">
                        <Smile size={14} className="text-amber-500 shrink-0" />
                        <span className="font-bold text-amber-700 dark:text-amber-300">{reactArr.join(' ')}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Thông tin chi tiết địa điểm */}
              {selectedPlaceItem.place && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông tin địa điểm</h4>
                  <div className="space-y-2.5 text-xs">
                    {selectedPlaceItem.place.address && (
                      <div className="flex items-start gap-2.5 text-gray-700 dark:text-slate-300">
                        <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block">Địa chỉ:</span>
                          <span>{formatAddress(selectedPlaceItem.place.address)}</span>
                        </div>
                      </div>
                    )}
                    {selectedPlaceItem.place.price && (
                      <div className="flex items-center gap-2.5 text-gray-700 dark:text-slate-300">
                        <DollarSign size={16} className="text-emerald-500 shrink-0" />
                        <span>Mức giá: <strong>{selectedPlaceItem.place.price}</strong> {selectedPlaceItem.place.priceLevel && `(${selectedPlaceItem.place.priceLevel})`}</span>
                      </div>
                    )}
                    {selectedPlaceItem.place.phone && (
                      <div className="flex items-center gap-2.5 text-gray-700 dark:text-slate-300">
                        <Phone size={16} className="text-indigo-500 shrink-0" />
                        <span>Điện thoại: <strong>{selectedPlaceItem.place.phone}</strong></span>
                      </div>
                    )}
                    {selectedPlaceItem.place.website && (
                      <div className="flex items-center gap-2.5 text-gray-700 dark:text-slate-300">
                        <Globe size={16} className="text-sky-500 shrink-0" />
                        <span>Website: </span>
                        <a href={selectedPlaceItem.place.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-semibold truncate max-w-xs">
                          {selectedPlaceItem.place.website} <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                    {(selectedPlaceItem.place.tripadvisorUrl || selectedPlaceItem.place.tripadvisor_url) && (
                      <div className="flex items-center gap-2.5 text-gray-700 dark:text-slate-300">
                        <Compass size={16} className="text-emerald-500 shrink-0" />
                        <span>TripAdvisor: </span>
                        <a
                          href={selectedPlaceItem.place.tripadvisorUrl || selectedPlaceItem.place.tripadvisor_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold truncate max-w-xs"
                        >
                          Xem chi tiết trên TripAdvisor <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mô tả địa điểm */}
              {selectedPlaceItem.place?.description && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Giới thiệu</h4>
                  <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed bg-gray-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-800">
                    {selectedPlaceItem.place.description}
                  </p>
                </div>
              )}

              {/* Bộ sưu tập ảnh địa điểm (Photo gallery) */}
              {selectedPlaceItem.place?.photos && selectedPlaceItem.place.photos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hình ảnh ({selectedPlaceItem.place.photos.length})</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {selectedPlaceItem.place.photos.map((photo: any, pIdx: number) => (
                      <div key={pIdx} className="h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-800">
                        <img src={photo.urlThumbnail || photo.urlOriginal} alt="Photo" className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Danh sách Đánh giá (Reviews) */}
              {selectedPlaceItem.place && (
                <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      Đánh giá ({selectedPlaceItem.place.reviews?.length || selectedPlaceItem.place.userRatingCount || 0})
                    </h4>
                    {selectedPlaceItem.place.rating && (
                      <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900/60 flex items-center gap-1">
                        <Star size={12} className="fill-amber-500" /> {selectedPlaceItem.place.rating} / 5.0
                      </span>
                    )}
                  </div>

                  {selectedPlaceItem.place.reviews && selectedPlaceItem.place.reviews.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPlaceItem.place.reviews.map((rev: any, rIdx: number) => {
                        const authorName = rev.authorName || rev.user?.fullName || 'Người dùng CloudMood';
                        const authorAvatar = rev.authorAvatar || rev.user?.avatar || '/default-avatar.jpg';
                        const revDate = rev.publishedDate ? new Date(rev.publishedDate).toLocaleDateString('vi-VN') : null;
                        const ratingVal = Number(rev.rating) || 5;

                        return (
                          <div
                            key={rev.id || rIdx}
                            className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-slate-950/80 border border-gray-200 dark:border-slate-800/80 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden shrink-0 border border-gray-200 dark:border-slate-800">
                                  <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <span className="font-bold text-xs text-gray-900 dark:text-slate-100 block">
                                    {authorName}
                                  </span>
                                  {revDate && (
                                    <span className="text-[10px] text-gray-400 block">{revDate}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={12}
                                    className={star <= ratingVal ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-slate-700'}
                                  />
                                ))}
                              </div>
                            </div>
                            {rev.comment && (
                              <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-normal pl-1">
                                "{rev.comment}"
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 text-center border border-gray-200 dark:border-slate-800">
                      <p className="text-xs text-gray-400 italic">Chưa có bài đánh giá chi tiết nào từ cộng đồng cho địa điểm này.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-950/80 flex items-center justify-between shrink-0">
              <button
                onClick={() => setIsPlaceDetailOpen(false)}
                className="px-4 py-2.5 border border-gray-200 dark:border-slate-800 text-xs font-bold rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <div className="flex items-center gap-2">
                {(selectedPlaceItem.place?.tripadvisorUrl || selectedPlaceItem.place?.tripadvisor_url) && (
                  <a
                    href={selectedPlaceItem.place.tripadvisorUrl || selectedPlaceItem.place.tripadvisor_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Compass size={14} /> TripAdvisor <ExternalLink size={12} />
                  </a>
                )}
                {selectedPlaceItem.place?.name && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((selectedPlaceItem.place.name || '') + ' ' + (selectedPlaceItem.place.address || ''))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <MapPin size={14} /> Xem trên Google Maps <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })()}

    </div>
  );
}
