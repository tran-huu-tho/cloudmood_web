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
  ChevronDown,
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
  Upload,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Ship,
  Plane,
  Landmark,
  Receipt,
  Zap,
  Edit3,
  Wallet,
  MessageSquare,
  Maximize2
} from 'lucide-react';
import DestinationSearchInput from '@/components/admin/DestinationSearchInput';
import AttachedPlacesManager from '@/components/admin/AttachedPlacesManager';

interface CreatorUser {
  id: number | string;
  fullName: string;
  email: string;
  avatar: string | null;
  role?: boolean;
}

const checkIsRegularUserPost = (u?: CreatorUser | null, postType?: string) => {
  if (!u) return false;
  if (postType === 'PLATFORM_CURATION') return false;
  if (u.role === true || (u.email && u.email.toLowerCase().includes('admin'))) return false;
  if (u.fullName === 'CloudMood' || u.fullName === 'Biên tập viên Admin') return false;
  return true;
};

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
  platformName?: string | null;
  platformLogo?: string | null;
  platformUrl?: string | null;
  viewCount: number;
  likeCount?: number;
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

  // Helper to remove raw emojis from start of string
  const stripLeadingEmoji = (text?: string | null) => {
    if (!text) return '';
    return text.replace(/^[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\s]+/gu, '').trim();
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
      } catch (_) { }
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
      } catch (_) { }
    }
    return [];
  };

  // Helper to get privacy status badge info (Công khai, Bạn bè, Riêng tư)
  const getPrivacyBadgeInfo = (item?: any, trip?: any) => {
    const obj = item || trip || {};
    
    // Check explicit boolean isPublic first
    if (obj.isPublic === true) {
      return {
        key: 'public',
        label: 'Công khai',
        icon: <Globe size={13} className="text-sky-600 dark:text-sky-400 shrink-0" />,
        badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-900/60',
        bannerBadgeClass: 'bg-sky-600/90 text-white border-sky-400/30'
      };
    }
    if (obj.isPublic === false) {
      return {
        key: 'private',
        label: 'Riêng tư',
        icon: <Lock size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />,
        badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/60',
        bannerBadgeClass: 'bg-rose-600/90 text-white border-rose-400/30'
      };
    }

    const raw = (
      obj.privacy ||
      obj.privacyLevel ||
      obj.visibility ||
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
    // Default to 'Riêng tư' if isPublic is false/null for user trips
    return {
      key: 'private',
      label: 'Riêng tư',
      icon: <Lock size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />,
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/60',
      bannerBadgeClass: 'bg-rose-600/90 text-white border-rose-400/30'
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
        try { configs = JSON.parse(configs); } catch (_) { }
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
        {customNote && customNote.trim() !== '' && (
          <p className="text-xs text-gray-600 dark:text-slate-300 font-medium py-1">
            "{customNote}"
          </p>
        )}

        {/* Action / Specs Badges Row */}
        {(item.startTime || item.endTime || expenseAmount || reactions.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-800/80 text-xs">
            {/* Giờ */}
            {(item.startTime || item.endTime) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 font-bold rounded-xl border transition-colors bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900/60 shadow-2xs">
                <Clock size={13} className="text-blue-600" />
                {`${item.startTime || '00:00'} - ${item.endTime || '00:00'}`}
              </span>
            )}

            {/* Chi phí / Giá */}
            {expenseAmount && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-extrabold rounded-xl border border-purple-200 dark:border-purple-900/60">
                <DollarSign size={13} className="text-purple-600" />
                {expenseAmount}
              </span>
            )}

            {/* Emojis / Reactions */}
            {reactions.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 rounded-full border border-amber-200 dark:border-amber-900 text-xs">
                {reactions.map((r: any) => (typeof r === 'string' ? r : r.emoji || '😊')).join(' ')}
              </span>
            )}
          </div>
        )}

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
  const [tripDetailActiveTab, setTripDetailActiveTab] = useState<'days' | 'expenses' | 'members'>('days');
  const [guideDetailActiveTab, setGuideDetailActiveTab] = useState<'overview' | 'members'>('overview');

  // Cover Image Lightbox Preview State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

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
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Lỗi (${res.status}): Không thể lấy thông tin chuyến đi.`);
      }
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

  // Delete Guide state
  const [isDeleteGuideOpen, setIsDeleteGuideOpen] = useState(false);
  const [deletingGuideId, setDeletingGuideId] = useState<number | string | null>(null);
  const [deleteGuideLoading, setDeleteGuideLoading] = useState(false);

  const handleOpenDeleteGuide = (id: number | string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingGuideId(id);
    setIsDeleteGuideOpen(true);
  };

  const handleDeleteGuide = async () => {
    if (!deletingGuideId) return;
    setDeleteGuideLoading(true);
    try {
      const res = await fetch(`/api/admin/itineraries/${deletingGuideId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Không thể xóa bài Hướng dẫn du lịch.');
      showToast('Đã xóa bài Hướng dẫn du lịch thành công!', 'success');
      setIsDeleteGuideOpen(false);
      setDeletingGuideId(null);
      fetchGuides();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa bài Hướng dẫn.', 'error');
    } finally {
      setDeleteGuideLoading(false);
    }
  };

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
    setGuideDetailActiveTab('overview');
    try {
      const res = await fetch(`/api/admin/itineraries/${id}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Lỗi (${res.status}): Không thể tải thông tin Hướng dẫn.`);
      }
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
  const [blogDetailActiveTab, setBlogDetailActiveTab] = useState<'overview' | 'info'>('overview');

  const [isCreateBlogOpen, setIsCreateBlogOpen] = useState(false);
  const [selectedImportGuideId, setSelectedImportGuideId] = useState<string>('');
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogDesc, setNewBlogDesc] = useState('');
  const [newBlogDest, setNewBlogDest] = useState('');
  const [newBlogCover, setNewBlogCover] = useState('');
  const [newBlogNote, setNewBlogNote] = useState('');
  const [selectedPlacesForBlog, setSelectedPlacesForBlog] = useState<any[]>([]);
  const [allPlaces, setAllPlaces] = useState<any[]>([]);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placesLoading, setPlacesLoading] = useState(false);
  const [createBlogLoading, setCreateBlogLoading] = useState(false);
  const [blogModalError, setBlogModalError] = useState<string>('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [fullCoverPreviewUrl, setFullCoverPreviewUrl] = useState<string | null>(null);
  const [platformName, setPlatformName] = useState('CloudMood');
  const [platformLogo, setPlatformLogo] = useState('/favicon.ico');
  const [platformUrl, setPlatformUrl] = useState('');

  const [editingBlogId, setEditingBlogId] = useState<number | string | null>(null);
  const [editingBlogAuthor, setEditingBlogAuthor] = useState<CreatorUser | null>(null);
  const [modalBlogTab, setModalBlogTab] = useState<'info' | 'places'>('info');

  const handleOpenCreateBlogModal = () => {
    setEditingBlogId(null);
    setEditingBlogAuthor(null);
    setSelectedImportGuideId('');
    setNewBlogTitle('');
    setNewBlogDesc('');
    setNewBlogDest('');
    setNewBlogCover('');
    setNewBlogNote('');
    setPlatformName('CloudMood');
    setPlatformLogo('/favicon.ico');
    setPlatformUrl('');
    setSelectedPlacesForBlog([]);
    setModalBlogTab('info');
    setBlogModalError('');
    setIsCreateBlogOpen(true);
  };

  const handleEditBlogClick = (b: ExplorePost) => {
    setEditingBlogId(b.id);
    const rawAuthor = b.author || (b as any).user || null;
    const isUser = checkIsRegularUserPost(rawAuthor, b.postType);
    const author = isUser ? rawAuthor : null;
    setEditingBlogAuthor(author);
    setSelectedImportGuideId('');
    setNewBlogTitle(b.title || '');
    setNewBlogDesc(b.description || '');
    setNewBlogDest(b.destination || '');
    setNewBlogCover(b.coverImage || '');

    if (author) {
      setPlatformName(author.fullName || b.platformName || '');
      setPlatformLogo(author.avatar || b.platformLogo || '');
      setPlatformUrl('');
    } else {
      setPlatformName(b.platformName || 'CloudMood');
      setPlatformLogo(b.platformLogo || '/favicon.ico');
      setPlatformUrl(b.platformUrl || '');
    }

    const allItems = (b.items || []).map((i: any, index: number) => {
      const rawType = (i.itemType || '').toUpperCase();
      if (rawType === 'SECTION_HEADER') {
        return {
          id: `sec-${i.id || index}-${Date.now()}`,
          itemType: 'SECTION_HEADER',
          name: i.content || 'Phần nội dung',
          customContent: i.content || '',
        };
      }
      if (rawType === 'NOTE') {
        return {
          id: `note-${i.id || index}-${Date.now()}`,
          itemType: 'NOTE',
          name: 'Ghi chú',
          customContent: i.content || '',
          content: i.content || '',
        };
      }
      if (rawType === 'CHECKLIST') {
        return {
          id: `chk-${i.id || index}-${Date.now()}`,
          itemType: 'CHECKLIST',
          name: 'Danh mục công việc',
          customContent: i.content || '',
          content: i.content || '',
        };
      }
      // If no placeId and no place object → fallback to SECTION_HEADER (not a place)
      if (!i.placeId && !i.place) {
        return {
          id: `sec-${i.id || index}-${Date.now()}`,
          itemType: 'SECTION_HEADER',
          name: i.content || 'Phần nội dung',
          customContent: i.content || '',
        };
      }
      return {
        ...(i.place || {}),
        id: i.place?.id || i.placeId || `place-${index}-${Date.now()}`,
        placeId: i.place?.id || i.placeId,
        itemType: 'PLACE',
        name: i.place?.name || i.content || 'Địa điểm bài viết',
        customContent: (i.content && i.content !== i.place?.description && i.content !== i.place?.name) ? i.content : '',
      };
    });

    setSelectedPlacesForBlog(allItems);
    setModalBlogTab('info');
    setBlogModalError('');
    setIsCreateBlogOpen(true);
  };

  const fetchPlaces = async () => {
    if (allPlaces.length > 0) return;
    setPlacesLoading(true);
    try {
      const res = await fetch('/api/admin/places?limit=10000');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.places || [];
        setAllPlaces(list);
      }
    } catch (e) {
      console.error('Lỗi khi tải địa điểm:', e);
    } finally {
      setPlacesLoading(false);
    }
  };

  const compressImageFile = (file: File, maxWidth = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const uploadImageToCloudinary = async (base64Str: string, folder = 'cloudmood_blogs'): Promise<string> => {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Str, folder }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Lỗi khi tải ảnh lên Cloudinary.');
    }
    const data = await res.json();
    if (!data.url) throw new Error('Không nhận được link ảnh từ Cloudinary.');
    return data.url;
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      showToast('Đang tải ảnh bìa từ máy tính...', 'success');
      const compressed = await compressImageFile(file, 1200, 0.85);
      if (compressed) {
        const url = await uploadImageToCloudinary(compressed, 'cloudmood_blogs');
        setNewBlogCover(url);
        showToast('Đã tải ảnh bìa từ máy tính thành công!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Tải ảnh bìa thất bại.', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const moveSelectedPlace = (index: number, direction: 'up' | 'down') => {
    const list = [...selectedPlacesForBlog];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setSelectedPlacesForBlog(list);
  };

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

  const handleDeleteBlog = async () => {
    if (!deletingBlogId) return;
    setDeleteBlogLoading(true);
    try {
      const res = await fetch(`/api/admin/explore-posts/${deletingBlogId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Lỗi khi xóa bài viết Blog.');
      }
      setBlogs(blogs.filter((p) => p.id !== deletingBlogId));
      setIsDeleteBlogOpen(false);
      showToast('Đã xóa bài viết Blog thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa bài viết.', 'error');
    } finally {
      setDeleteBlogLoading(false);
      setDeletingBlogId(null);
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
      let res: Response;
      if (selectedImportGuideId) {
        // Method 1: Import / Export from Guide
        res = await fetch(`/api/admin/guides/${selectedImportGuideId}/publish-blog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newBlogTitle,
            description: newBlogDesc,
            coverImage: newBlogCover || undefined,
          }),
        });
      } else {
        // Method 2: Custom creation with Intro Note + Selected Places
        const items: any[] = [];
        if (newBlogNote.trim()) {
          items.push({
            itemType: 'NOTE',
            content: newBlogNote.trim(),
          });
        }
        selectedPlacesForBlog.forEach((p) => {
          if (p.itemType === 'SECTION_HEADER') {
            items.push({
              itemType: 'SECTION_HEADER',
              content: (p.customContent && p.customContent.trim()) ? p.customContent.trim() : (p.name || 'Phần nội dung'),
            });
          } else if (p.itemType === 'NOTE') {
            items.push({
              itemType: 'NOTE',
              content: (p.customContent && p.customContent.trim()) ? p.customContent.trim() : (p.content || ''),
            });
          } else if (p.itemType === 'CHECKLIST') {
            items.push({
              itemType: 'CHECKLIST',
              content: p.customContent || p.content || '',
            });
          } else {
            items.push({
              itemType: 'PLACE',
              placeId: p.placeId || p.id,
              content: (p.customContent && p.customContent.trim()) ? p.customContent.trim() : (p.description || p.name || ''),
            });
          }
        });

        if (editingBlogId) {
          res = await fetch(`/api/admin/explore-posts/${editingBlogId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: newBlogTitle,
              description: newBlogDesc,
              destination: newBlogDest,
              coverImage: newBlogCover || selectedPlacesForBlog[0]?.image || '/logo-xoanen-cloudmood.png',
              postType: 'BLOG',
              status: 'PUBLISHED',
              platformName: editingBlogAuthor ? (editingBlogAuthor.fullName || null) : (platformName.trim() || null),
              platformLogo: editingBlogAuthor ? (editingBlogAuthor.avatar || null) : (platformLogo.trim() || null),
              platformUrl: editingBlogAuthor ? null : (platformUrl.trim() || null),
              items,
            }),
          });
        } else {
          res = await fetch('/api/admin/explore-posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: newBlogTitle,
              description: newBlogDesc,
              destination: newBlogDest,
              coverImage: newBlogCover || selectedPlacesForBlog[0]?.image || '/logo-xoanen-cloudmood.png',
              postType: 'BLOG',
              status: 'PUBLISHED',
              platformName: platformName.trim() || null,
              platformLogo: platformLogo.trim() || null,
              platformUrl: platformUrl.trim() || null,
              items,
            }),
          });
        }
      }

      if (!res.ok) throw new Error('Lỗi khi tạo/xuất bài Blog.');
      showToast(
        editingBlogId
          ? 'Đã cập nhật bài viết Blog thành công!'
          : selectedImportGuideId
            ? 'Đã xuất Hướng dẫn du lịch thành bài viết Blog thành công!'
            : 'Tạo bài Blog mới thành công!',
        'success'
      );
      setIsCreateBlogOpen(false);
      setEditingBlogId(null);
      setEditingBlogAuthor(null);
      setSelectedImportGuideId('');
      setNewBlogTitle('');
      setNewBlogDesc('');
      setNewBlogDest('');
      setNewBlogCover('');
      setNewBlogNote('');
      setPlatformName('CloudMood');
      setPlatformLogo('/favicon.ico');
      setPlatformUrl('');
      setSelectedPlacesForBlog([]);
      setPlaceSearchQuery('');
      fetchBlogs();
    } catch (err: any) {
      const msg = err.message || 'Lỗi khi tạo Blog.';
      showToast(msg, 'error');
      setBlogModalError(msg);
    } finally {
      setCreateBlogLoading(false);
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
  const [isTabTypeDropdownOpen, setIsTabTypeDropdownOpen] = useState(false);
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

  const [isDeleteCatOpen, setIsDeleteCatOpen] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<number | string | null>(null);
  const [deleteCatLoading, setDeleteCatLoading] = useState(false);

  const handleDeleteCategory = (id: number | string) => {
    setDeletingCatId(id);
    setIsDeleteCatOpen(true);
  };

  const executeDeleteCategory = async () => {
    if (!deletingCatId) return;
    setDeleteCatLoading(true);
    try {
      const res = await fetch(`/api/admin/checklist-templates/categories/${deletingCatId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Lỗi khi xóa danh mục.');
      showToast('Xóa danh mục thành công!', 'success');
      setIsDeleteCatOpen(false);
      setDeletingCatId(null);
      fetchChecklists();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa.', 'error');
    } finally {
      setDeleteCatLoading(false);
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
        <div className={`fixed top-6 right-6 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[999999] animate-in fade-in slide-in-from-top-4 duration-200 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
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
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${mainTab === 'trips'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
        >
          Chuyến đi (Trips)
        </button>

        <button
          onClick={() => setMainTab('guides')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${mainTab === 'guides'
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
        >
          Hướng dẫn du lịch
        </button>

        <button
          onClick={() => setMainTab('blogs')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${mainTab === 'blogs'
            ? 'bg-purple-600 text-white shadow-md'
            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
        >
          Bài viết & Blog
        </button>

        <button
          onClick={() => setMainTab('checklists')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${mainTab === 'checklists'
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
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-gray-400">ID: #{t.id}</span>
                                <span className="text-gray-300 dark:text-slate-700">&bull;</span>
                                {(() => {
                                  const priv = getPrivacyBadgeInfo(null, t);
                                  return (
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${priv.badgeClass}`}>
                                      {priv.icon} {priv.label}
                                    </span>
                                  );
                                })()}
                              </div>
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
                          <div className="flex items-center gap-2">
                            {t.user?.avatar ? (
                              <img
                                src={t.user.avatar}
                                alt={t.user.fullName}
                                className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-slate-800 shadow-2xs"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {(t.user?.fullName || 'D')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-xs text-gray-900 dark:text-slate-100 block">{t.user?.fullName || 'N/A'}</span>
                              <span className="text-[11px] text-indigo-600 block">{t._count?.members || 1} thành viên</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-3.5">
                          {t.isAi ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 shadow-2xs">
                              <Sparkles size={12} /> AI tạo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
                              <User size={12} /> Tự tạo
                            </span>
                          )}
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
                      <th className="px-6 py-3.5">Bạn đồng hành</th>
                      <th className="px-6 py-3.5">Tác giả</th>
                      <th className="px-6 py-3.5 text-center">Trạng thái</th>
                      <th className="px-6 py-3.5 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredGuides.map((g) => (
                      <tr key={g.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            {g.coverImage ? (
                              <img
                                src={g.coverImage}
                                alt={g.title}
                                className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-slate-800 shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-2xs font-bold text-sm">
                                📖
                              </div>
                            )}
                            <div>
                              <span className="font-extrabold text-sm text-gray-900 dark:text-slate-100 block leading-snug">
                                {g.title}
                              </span>
                              <span className="text-[11px] text-gray-400 font-medium">
                                #{g.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-gray-900 dark:text-slate-100">{g.destination}</td>
                        <td className="px-6 py-3.5 text-center font-bold">{g._count?.savedPlaces || 0} điểm</td>
                        <td className="px-6 py-3.5 font-semibold text-xs">
                          {g.companion ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold rounded-lg text-[11px]">
                              👥 {g.companion}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-normal">Chưa chọn</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-xs">
                          <div className="flex items-center gap-2">
                            {g.user?.avatar ? (
                              <img
                                src={g.user.avatar}
                                alt={g.user.fullName}
                                className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-slate-800 shadow-2xs"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {(g.user?.fullName || 'D')[0].toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold text-xs text-gray-900 dark:text-slate-100">
                              {g.user?.fullName || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          {(() => {
                            const priv = getPrivacyBadgeInfo(null, g);
                            return (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${priv.badgeClass}`}>
                                {priv.icon} {priv.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenGuideDetail(g.id)}
                              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={14} />
                              Xem chi tiết
                            </button>
                            <button
                              onClick={(e) => handleOpenDeleteGuide(g.id, e)}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors cursor-pointer"
                              title="Xóa bài Hướng dẫn du lịch"
                            >
                              <Trash2 size={15} />
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
            <button onClick={handleOpenCreateBlogModal} className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
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
              <div className="w-full">
                <table className="w-full text-left border-collapse text-xs table-fixed">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-slate-950/50 text-gray-500 text-[11px] font-bold uppercase border-b border-gray-200 dark:border-slate-800">
                      <th className="pl-4 pr-3 py-3 w-[24%]">Bài viết Blog</th>
                      <th className="px-3 py-3 w-[11%]">Điểm đến</th>
                      <th className="px-3 py-3 w-[13%]">Nguồn</th>
                      <th className="px-3 py-3 text-center w-[11%]">Địa điểm gợi ý</th>
                      <th className="px-3 py-3 text-center w-[13%]">Tương tác</th>
                      <th className="px-3 py-3 w-[14%]">Tác giả</th>
                      <th className="px-3 py-3 text-center w-[7%]">Trạng thái</th>
                      <th className="pl-2 pr-5 py-3 text-center w-[7%]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredBlogs.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="pl-4 pr-3 py-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {b.coverImage ? (
                              <img
                                src={b.coverImage}
                                alt={b.title}
                                className="w-9 h-9 rounded-lg object-cover border border-gray-200 dark:border-slate-800 shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 font-bold text-xs shrink-0">
                                Blog
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-extrabold text-xs text-gray-900 dark:text-slate-100 block truncate leading-snug">
                                {b.title}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium block truncate">
                                #{b.id} {b.description ? `• ${b.description}` : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-2.5 font-semibold text-gray-900 dark:text-slate-100">
                          <span className="truncate text-xs block">{b.destination || 'Toàn quốc'}</span>
                        </td>

                        <td className="px-3 py-2.5">
                          {b.originalItinerary ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 truncate max-w-full">
                              Từ Hướng dẫn #{b.originalItinerary.id}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40 truncate">
                              Blog trực tiếp
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2.5 text-center">
                          <span className="font-bold text-xs text-gray-900 dark:text-slate-100">
                            {b._count?.items || 0} địa điểm
                          </span>
                        </td>

                        <td className="px-3 py-2.5 text-center text-xs font-medium text-gray-600 dark:text-slate-400">
                          <span>{b.viewCount || 0} xem • {b._count?.likes || 0} thích</span>
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            {b.author?.avatar ? (
                              <img
                                src={b.author.avatar}
                                alt={b.author.fullName || 'Tác giả'}
                                className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {(b.author?.fullName || 'A')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-gray-900 dark:text-slate-100 block truncate">
                                {b.author?.fullName || 'Admin'}
                              </span>
                              <span className="text-[10px] text-gray-400 block truncate">
                                {b.author?.email || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                            Công khai
                          </span>
                        </td>

                        <td className="pl-2 pr-5 py-2.5 text-center">
                          <div className="flex justify-center items-center gap-1">
                            <button
                              onClick={() => { setSelectedBlog(b); setIsBlogDetailOpen(true); }}
                              className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Xem chi tiết Blog"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => handleEditBlogClick(b)}
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Chỉnh sửa bài viết Blog"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => { setDeletingBlogId(b.id); setIsDeleteBlogOpen(true); }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa bài viết"
                            >
                              <Trash2 size={15} />
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
                {(() => {
                  const coverUrl = selectedTripDetail.coverImage || selectedTripDetail.savedPlaces?.find((sp: any) => sp.place?.image)?.place?.image;
                  return (
                    <div className="relative h-48 bg-slate-900 overflow-hidden shrink-0 group">
                      {coverUrl ? (
                        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-black/20" />
                      {coverUrl && (
                        <button
                          type="button"
                          onClick={() => setFullCoverPreviewUrl(coverUrl)}
                          className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full text-xs font-extrabold flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all cursor-pointer z-10 shadow-md hover:scale-105"
                        >
                          <Maximize2 size={13} /> Xem ảnh bìa
                        </button>
                      )}
                      <button
                        onClick={() => setIsTripDetailOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer z-10"
                      >
                        <X size={20} />
                      </button>
                      <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end text-white z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white flex items-center gap-1 shadow-xs">
                          {selectedTripDetail.isAi ? <><Zap size={12} className="text-amber-400 fill-amber-400" /> AI tạo</> : <><Edit2 size={12} /> Tự tạo</>}
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
                        {selectedTripDetail.companion && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-500/80 text-white backdrop-blur-xs border border-purple-300/30 flex items-center gap-1">
                            <Users size={11} /> {selectedTripDetail.companion === 'Riêng tư' ? 'Đi một mình' : selectedTripDetail.companion}
                          </span>
                        )}
                        {selectedTripDetail.pace && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/80 text-white backdrop-blur-xs border border-indigo-300/30 flex items-center gap-1">
                            <Compass size={11} /> {selectedTripDetail.pace}
                          </span>
                        )}
                        <span className="text-xs text-blue-200 font-semibold flex items-center gap-1">
                          <MapPin size={12} /> {selectedTripDetail.destination}
                        </span>
                      </div>
                      <h2 className="text-2xl font-extrabold tracking-wide drop-shadow-md">
                        {selectedTripDetail.title}
                      </h2>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-300 block">Dự toán chuyến đi</span>
                      <span className="text-lg font-black text-amber-400">
                        {selectedTripDetail.budget ? `${selectedTripDetail.budget.toLocaleString('vi-VN')} ${selectedTripDetail.currencySymbol || 'đ'}` : 'Tự do'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

                {/* Sub Header info bar */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 overflow-hidden shrink-0 border border-blue-200 dark:border-blue-800">
                      <img src={selectedTripDetail.user?.avatar || '/default-avatar.svg'} alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-slate-100 block">{selectedTripDetail.user?.fullName}</span>
                      <span className="text-gray-400 block">{selectedTripDetail.user?.email}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-gray-600 dark:text-slate-300 font-medium">
                    <span className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800">
                      <Calendar size={13} className="text-blue-500" /> {selectedTripDetail.days ? `${selectedTripDetail.days} ngày` : 'Nhiều ngày'}
                    </span>

                    {selectedTripDetail.startDate && (
                      <span className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800">
                        <Calendar size={13} className="text-emerald-500" /> Khởi hành: {new Date(selectedTripDetail.startDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}

                    <span className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800">
                      <Users size={13} className="text-indigo-500" /> {selectedTripDetail.members?.length || 1} thành viên
                    </span>

                    <span className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800">
                      <Wallet size={13} className="text-amber-500" /> Thực chi: <strong className="text-gray-900 dark:text-slate-100">{Math.round(selectedTripDetail.expenses?.reduce((a: any, b: any) => a + convertExpenseToItineraryCurrency(b, selectedTripDetail), 0) || 0).toLocaleString('vi-VN')} {selectedTripDetail.currencySymbol || 'đ'}</strong>
                    </span>
                  </div>
                </div>

                {/* Modal Sub Tabs */}
                <div className="flex border-b border-gray-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 shrink-0">
                  <button
                    onClick={() => setTripDetailActiveTab('days')}
                    className={`py-3.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${tripDetailActiveTab === 'days'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                  >
                    <Calendar size={14} /> Lịch trình chi tiết ({selectedTripDetail.details?.length || 0})
                  </button>

                  <button
                    onClick={() => setTripDetailActiveTab('expenses')}
                    className={`py-3.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${tripDetailActiveTab === 'expenses'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                  >
                    <Receipt size={14} /> Chi tiêu ({selectedTripDetail.expenses?.length || 0})
                  </button>
                  <button
                    onClick={() => setTripDetailActiveTab('members')}
                    className={`py-3.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${tripDetailActiveTab === 'members'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                  >
                    <Users size={14} /> Thành viên & Lời mời ({selectedTripDetail.members?.length || 0})
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
                                  } catch (_) { }
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
                                                {e.date && <span className="flex items-center gap-1"><Calendar size={11} className="text-gray-400" /> {e.date}</span>}
                                              </div>
                                            </div>
                                          </div>

                                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                                            {e.amount?.toLocaleString('vi-VN')} {e.currencySymbol || currSym}
                                          </span>
                                        </div>

                                        {/* Detail attributes: Payer, Share, Linked Place */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-300">
                                          <div className="flex items-center gap-1">
                                            <User size={13} className="text-gray-400" />
                                            <span className="text-gray-400">Người thanh toán: </span>
                                            <strong className="text-gray-800 dark:text-slate-200">{e.payer || 'Không rõ'}</strong>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Users size={13} className="text-gray-400" />
                                            <span className="text-gray-400">Phân chia: </span>
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
                                            <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                                              <Receipt size={12} /> Lịch sử quyết toán khoản này ({e.settlements.length}):
                                            </span>
                                            {e.settlements.map((s: any) => (
                                              <div key={s.id} className="flex justify-between items-center text-purple-900 dark:text-purple-200 font-medium">
                                                <span className="flex items-center gap-1">
                                                  <User size={12} className="text-purple-400" /> <strong>{s.fromName}</strong> ➔ <strong>{s.toName}</strong>
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
                                  <Receipt size={14} className="text-purple-500" /> Lịch sử quyết toán nhóm ({settlementsList.length})
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
                                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                            <Clock size={11} /> {new Date(s.date).toLocaleDateString('vi-VN')} {new Date(s.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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
                          <div key={m.id} className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 overflow-hidden flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                                <img src={m.user?.avatar || '/default-avatar.svg'} alt="Avatar" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <span className="font-bold text-xs text-gray-900 dark:text-slate-100 block">{m.user?.fullName}</span>
                                <span className="text-[11px] text-gray-400 block">{m.user?.email}</span>
                                {m.joinedAt && (
                                  <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                    <Clock size={10} /> Tham gia: {new Date(m.joinedAt).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg text-xs font-bold shrink-0">
                              {m.role}
                            </span>
                          </div>
                        ))}
                      </div>

                      {selectedTripDetail.invites?.length > 0 && (
                        <>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Lời mời cộng tác ({selectedTripDetail.invites.length})</h4>
                          <div className="space-y-2">
                            {selectedTripDetail.invites.map((inv: any) => (
                              <div key={inv.id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 text-xs flex justify-between items-center">
                                <div>
                                  <span className="font-bold text-gray-900 dark:text-slate-100 block">
                                    Lời mời tới: {inv.email || 'Link liên kết'}
                                  </span>
                                  <span className="text-gray-500 text-[11px]">
                                    Vai trò: <strong>{inv.role}</strong>
                                    {inv.createdAt && ` • Gửi ngày ${new Date(inv.createdAt).toLocaleDateString('vi-VN')}`}
                                    {inv.expiresAt && ` • Hết hạn ${new Date(inv.expiresAt).toLocaleDateString('vi-VN')}`}
                                  </span>
                                </div>
                                <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold rounded-lg text-xs shrink-0">
                                  {inv.status}
                                </span>
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
                {(() => {
                  const coverUrl = selectedGuideDetail.coverImage || selectedGuideDetail.savedPlaces?.find((sp: any) => sp.place?.image)?.place?.image;
                  return (
                    <div className="relative h-48 bg-slate-900 overflow-hidden shrink-0 group">
                      {coverUrl ? (
                        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-black/20" />
                      {coverUrl && (
                        <button
                          type="button"
                          onClick={() => setFullCoverPreviewUrl(coverUrl)}
                          className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full text-xs font-extrabold flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all cursor-pointer z-10 shadow-md hover:scale-105"
                        >
                          <Maximize2 size={13} /> Xem ảnh bìa
                        </button>
                      )}
                      <button
                        onClick={() => setIsGuideDetailOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer z-10"
                      >
                        <X size={20} />
                      </button>
                      <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end text-white z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-600 text-white flex items-center gap-1 shadow-xs">
                          <BookOpen size={12} /> Hướng dẫn du lịch
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
                        {selectedGuideDetail.companion && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-500/80 text-white backdrop-blur-xs border border-purple-300/30 flex items-center gap-1">
                            <Users size={11} /> {selectedGuideDetail.companion === 'Riêng tư' ? 'Đi một mình' : selectedGuideDetail.companion}
                          </span>
                        )}
                        {selectedGuideDetail.pace && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/80 text-white backdrop-blur-xs border border-indigo-300/30 flex items-center gap-1">
                            <Compass size={11} /> {selectedGuideDetail.pace}
                          </span>
                        )}
                        <span className="text-xs text-indigo-200 font-semibold flex items-center gap-1">
                          <MapPin size={12} /> {selectedGuideDetail.destination}
                        </span>
                      </div>
                      <h2 className="text-2xl font-extrabold tracking-wide drop-shadow-md">
                        {selectedGuideDetail.title}
                      </h2>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-300 block">Địa điểm gợi ý</span>
                      <span className="text-lg font-black text-amber-400">
                        {selectedGuideDetail.savedPlaces?.length || 0} địa điểm
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

                {/* Sub Header info bar */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 overflow-hidden shrink-0 border border-indigo-200">
                      <img src={selectedGuideDetail.user?.avatar || '/default-avatar.svg'} alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-slate-100 block">{selectedGuideDetail.user?.fullName || 'Tác giả'}</span>
                      <span className="text-gray-400 block">{selectedGuideDetail.user?.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-600 dark:text-slate-300 font-medium">
                    <span className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800">
                      <MapPin size={13} className="text-indigo-500" /> {selectedGuideDetail.destination}
                    </span>
                    <span className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800">
                      <Layers size={13} className="text-purple-500" /> {selectedGuideDetail.savedPlaces?.length || 0} địa điểm gợi ý
                    </span>
                    <button
                      onClick={() => {
                        const guideId = selectedGuideDetail.id;
                        setIsGuideDetailOpen(false);
                        handleOpenDeleteGuide(guideId);
                      }}
                      className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-rose-200 dark:border-rose-900/50 ml-2"
                    >
                      <Trash2 size={13} />
                      Xóa Hướng dẫn
                    </button>
                  </div>
                </div>

                {/* Sub Tabs Bar */}
                <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-100/50 dark:bg-slate-950/50 px-6 pt-2 text-xs font-bold gap-2">
                  <button
                    onClick={() => setGuideDetailActiveTab('overview')}
                    className={`px-4 py-2.5 rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${guideDetailActiveTab === 'overview'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                      }`}
                  >
                    <Layers size={14} />
                    Danh sách địa điểm & Nội dung gợi ý ({selectedGuideDetail.savedPlaces?.length || 0})
                  </button>
                  <button
                    onClick={() => setGuideDetailActiveTab('members')}
                    className={`px-4 py-2.5 rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${guideDetailActiveTab === 'members'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                      }`}
                  >
                    <Users size={14} />
                    Thành viên & Lời mời ({(selectedGuideDetail.members?.length || 0) + 1})
                  </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                  {guideDetailActiveTab === 'overview' && (
                    <>
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
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 ${isChecklist
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
                    </>
                  )}

                  {/* TAB 2: THÀNH VIÊN & LỜI MỜI */}
                  {guideDetailActiveTab === 'members' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Tác giả & Thành viên tham gia ({(selectedGuideDetail.members?.length || 0) + 1})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Author */}
                        <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center shrink-0 border border-indigo-300">
                            <img src={selectedGuideDetail.user?.avatar || '/default-avatar.svg'} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-gray-900 dark:text-slate-100 block">{selectedGuideDetail.user?.fullName || 'Tác giả'}</span>
                            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block font-semibold">{selectedGuideDetail.user?.email || 'N/A'} • Tác giả (Owner)</span>
                          </div>
                        </div>

                        {/* Other Members */}
                        {selectedGuideDetail.members?.filter((m: any) => m.userId !== selectedGuideDetail.userId).map((m: any) => (
                          <div key={m.id} className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center shrink-0">
                              <img src={m.user?.avatar || '/default-avatar.svg'} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="font-bold text-xs text-gray-900 dark:text-slate-100 block">{m.user?.fullName}</span>
                              <span className="text-[11px] text-gray-400 block">{m.user?.email} • Vai trò: <strong className="text-blue-600">{m.role}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedGuideDetail.invites?.length > 0 && (
                        <>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Lời mời cộng tác ({selectedGuideDetail.invites.length})</h4>
                          <div className="space-y-2">
                            {selectedGuideDetail.invites.map((inv: any) => (
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

                <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 flex justify-end gap-3">
                  <button onClick={() => setIsGuideDetailOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-xs font-bold rounded-xl text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors cursor-pointer">Đóng</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* 3. BLOG DETAIL MODAL (Matching Guide Detail Layout) */}
      {isBlogDetailOpen && selectedBlog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden relative">

            {/* Banner Header with Image or Gradient */}
            {(() => {
              const coverUrl = selectedBlog.coverImage || selectedBlog.items?.find((i: any) => i.place?.image)?.place?.image;
              return (
                <div className="relative h-48 bg-slate-900 overflow-hidden shrink-0 group">
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-black/20" />
                  {coverUrl && (
                    <button
                      type="button"
                      onClick={() => setFullCoverPreviewUrl(coverUrl)}
                      className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full text-xs font-extrabold flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all cursor-pointer z-10 shadow-md hover:scale-105"
                    >
                      <Maximize2 size={13} /> Xem ảnh bìa
                    </button>
                  )}
                  <button
                    onClick={() => setIsBlogDetailOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer z-10"
                  >
                    <X size={20} />
                  </button>
                  <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end text-white z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-600 text-white flex items-center gap-1 shadow-xs">
                      <BookOpen size={12} /> Bài viết Blog (ExplorePost)
                    </span>
                    {selectedBlog.originalItinerary ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/80 text-white backdrop-blur-xs border border-indigo-300/30 flex items-center gap-1">
                        <BookOpen size={11} /> Từ Hướng dẫn (#{selectedBlog.originalItinerary.id})
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/80 text-white backdrop-blur-xs border border-emerald-300/30 flex items-center gap-1">
                        <Edit2 size={11} /> Blog trực tiếp
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-800/80 text-slate-200 border border-slate-700 flex items-center gap-1">
                      {selectedBlog.status === 'PUBLISHED' || selectedBlog.status === 'Công khai' ? <><CheckCircle2 size={11} className="text-emerald-400" /> Công khai</> : <><Clock size={11} className="text-amber-400" /> Bản nháp</>}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-wide drop-shadow-md text-white">
                    {stripLeadingEmoji(selectedBlog.title)}
                  </h2>
                </div>

                {selectedBlog.destination && (
                  <div className="text-right shrink-0">
                    <span className="text-xs text-purple-200 block font-medium">Điểm đến</span>
                    <span className="text-sm font-bold text-white flex items-center gap-1 justify-end">
                      <MapPin size={14} className="text-purple-300" /> {selectedBlog.destination}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

            {/* Sub Header info bar */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 overflow-hidden shrink-0 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-bold text-xs text-purple-600 dark:text-purple-300">
                  {selectedBlog.author?.avatar ? (
                    <img src={selectedBlog.author.avatar} alt="Author" className="w-full h-full object-cover" />
                  ) : (
                    (selectedBlog.author?.fullName || 'A')[0].toUpperCase()
                  )}
                </div>
                <div>
                  <span className="font-bold text-gray-900 dark:text-slate-100 block">
                    {selectedBlog.author?.fullName || 'Biên tập viên Admin'}
                  </span>
                  <span className="text-gray-400 block">{selectedBlog.author?.email || 'admin@cloudmood.com'}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-gray-600 dark:text-slate-300 font-medium">
                <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800">
                  <Eye size={14} className="text-purple-500" /> {selectedBlog.viewCount || 0} lượt xem
                </span>
                <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-bold">
                  <Heart size={14} fill="currentColor" /> {selectedBlog._count?.likes || selectedBlog.likeCount || 0} lượt thích
                </span>
                <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Share2 size={14} /> {(selectedBlog as any).shareCount || 0} chia sẻ
                </span>
                {(selectedBlog as any).createdAt && (
                  <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-500">
                    <Calendar size={14} className="text-blue-500" /> {new Date((selectedBlog as any).createdAt).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
            </div>

            {/* Sub Tabs Bar (Matching Guide Detail) */}
            <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-100/50 dark:bg-slate-950/50 px-6 pt-2 text-xs font-bold gap-2">
              <button
                onClick={() => setBlogDetailActiveTab('overview')}
                className={`px-4 py-2.5 rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${blogDetailActiveTab === 'overview'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                  }`}
              >
                <Layers size={14} />
                Địa điểm & Lịch trình ({selectedBlog.items?.length || 0})
              </button>
              <button
                onClick={() => setBlogDetailActiveTab('info')}
                className={`px-4 py-2.5 rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${blogDetailActiveTab === 'info'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                  }`}
              >
                <Users size={14} />
                Tác giả & Thông tin bài viết
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-white dark:bg-slate-900">
              {blogDetailActiveTab === 'overview' && (
                <>
                  {selectedBlog.description && selectedBlog.description !== 'public' && selectedBlog.description !== 'draft' && selectedBlog.description.trim().length > 3 && (
                    <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-xs text-gray-700 dark:text-slate-300 leading-relaxed italic relative">
                      <span className="font-bold text-purple-700 dark:text-purple-400 non-italic flex items-center gap-1.5 mb-1">
                        <MessageSquare size={14} /> Mô tả bài viết:
                      </span>
                      "{stripLeadingEmoji(selectedBlog.description)}"
                    </div>
                  )}

                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Danh sách địa điểm & Nội dung gợi ý bài viết ({selectedBlog.items?.length || 0})
                  </h4>

                  {(() => {
                    // Group items by section headers
                    const sections: Array<{ name: string; items: any[] }> = [];
                    let currentSecName = 'Mục tổng quan';
                    let currentItems: any[] = [];

                    (selectedBlog.items || []).forEach((item: any) => {
                      if (item.itemType === 'SECTION_HEADER') {
                        if (currentItems.length > 0 || sections.length > 0) {
                          sections.push({ name: currentSecName, items: currentItems });
                        }
                        currentSecName = item.content && item.content !== 'Thêm ghi chú tại đây' ? item.content : 'Phần nội dung';
                        currentItems = [];
                      } else {
                        currentItems.push(item);
                      }
                    });

                    if (currentItems.length > 0 || sections.length === 0) {
                      sections.push({ name: currentSecName, items: currentItems });
                    }

                    if (sections.length === 0 || selectedBlog.items?.length === 0) {
                      return <p className="text-gray-400 italic text-sm text-center py-6">Chưa có nội dung bài viết.</p>;
                    }

                    return sections.map((sec, idx) => (
                      <div key={idx} className="border border-gray-200 dark:border-slate-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-slate-950/40 space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                              <Layers size={15} />
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100">{stripLeadingEmoji(sec.name)}</h4>
                          </div>
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-2.5 py-1 rounded-xl">
                            {sec.items.length} mục
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {sec.items.map((item: any, iIdx: number) => {
                            const isNote = item.itemType === 'NOTE';
                            const contentText = item.content && item.content !== 'Thêm ghi chú tại đây' ? item.content : null;

                            let jsonChecklist: any = null;
                            if (contentText && typeof contentText === 'string' && contentText.trim().startsWith('{')) {
                              try {
                                const parsed = JSON.parse(contentText);
                                if (parsed && (parsed.title || Array.isArray(parsed.items))) jsonChecklist = parsed;
                              } catch (e) { }
                            }

                            if (isNote) {
                              return (
                                <div key={item.id || iIdx} className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs shadow-2xs">
                                  <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 mb-1">
                                    <Sparkles size={15} />
                                    <span>Ghi chú & Mẹo từ bài viết</span>
                                  </div>
                                  <p className="text-gray-700 dark:text-slate-300 italic leading-relaxed pl-5 border-l-2 border-amber-300">
                                    {contentText || 'Ghi chú thêm từ tác giả'}
                                  </p>
                                </div>
                              );
                            }

                            if (jsonChecklist) {
                              return (
                                <div key={item.id || iIdx} className="p-4 rounded-2xl border border-purple-200/80 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 text-xs space-y-2.5">
                                  <div className="flex items-center gap-2 font-bold text-sm text-purple-900 dark:text-purple-200">
                                    <CheckSquare size={18} className="text-purple-600 shrink-0" />
                                    <span>{jsonChecklist.title || 'Danh sách gợi ý / công việc'}</span>
                                  </div>
                                  {Array.isArray(jsonChecklist.items) && jsonChecklist.items.length > 0 && (
                                    <div className="space-y-1.5 pl-6 pt-2 border-t border-purple-100 dark:border-purple-900/30">
                                      {jsonChecklist.items.map((chk: any, cIdx: number) => (
                                        <div key={cIdx} className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                          {chk.done ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" /> : <Circle size={15} className="text-gray-400 shrink-0" />}
                                          <span className={chk.done ? 'line-through text-gray-400 font-normal' : 'font-semibold'}>{chk.text}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            const place = item.place;
                            const review = item.featuredReview;

                            return (
                              <div key={item.id || iIdx} className="p-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 transition-all text-xs shadow-2xs space-y-2.5">
                                <div className="flex items-start gap-3">
                                  {place?.image ? (
                                    <img src={place.image} alt={place.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-slate-800" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 font-bold">
                                      <MapPin size={20} />
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <h5 className="font-bold text-sm text-gray-900 dark:text-slate-100 truncate">
                                          {place?.name || contentText || 'Địa điểm bài viết'}
                                        </h5>
                                        {place?.category?.name && (
                                          <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-[10px] rounded-md shrink-0 border border-purple-200/50">
                                            {place.category.name}
                                          </span>
                                        )}
                                      </div>
                                      {place?.rating && (
                                        <span className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-200/50 text-[11px] shrink-0">
                                          <Star size={12} fill="currentColor" /> {place.rating} {place.userRatingCount ? `(${place.userRatingCount})` : ''}
                                        </span>
                                      )}
                                    </div>

                                    {(place?.address || place?.description) && (
                                      <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">
                                        {formatAddress(place?.address) || place?.description}
                                      </p>
                                    )}

                                    <div className="flex items-center gap-3 pt-0.5 text-[11px] text-gray-400">
                                      {place?.phone && <span className="flex items-center gap-1"><Phone size={11} /> {place.phone}</span>}
                                      {place?.website && <a href={place.website} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline flex items-center gap-0.5"><Globe size={11} /> Website <ExternalLink size={10} /></a>}
                                    </div>
                                  </div>
                                </div>

                                {/* Render Featured Review Card if available */}
                                {review && (
                                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl space-y-1 text-xs">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 overflow-hidden flex items-center justify-center font-bold text-[10px] text-amber-800 shrink-0">
                                          {review.authorAvatar ? <img src={review.authorAvatar} alt="Avatar" className="w-full h-full object-cover" /> : (review.authorName || 'R')[0].toUpperCase()}
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-slate-100 text-[11px]">{review.authorName || 'Đánh giá từ du khách'}</span>
                                      </div>
                                      {review.rating && (
                                        <span className="flex items-center gap-1 font-bold text-amber-500 text-[11px]">
                                          <Star size={11} fill="currentColor" /> {review.rating}/5
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-600 dark:text-slate-300 italic pl-7 text-[11px] leading-relaxed">
                                      "{review.comment}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </>
              )}

              {blogDetailActiveTab === 'info' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông tin Tác giả & Bài viết</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 overflow-hidden flex items-center justify-center shrink-0 border border-purple-300 font-bold text-sm text-purple-600 dark:text-purple-300">
                        {selectedBlog.author?.avatar ? (
                          <img src={selectedBlog.author.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          (selectedBlog.author?.fullName || 'A')[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-900 dark:text-slate-100 block">{selectedBlog.author?.fullName || 'Biên tập viên Admin'}</span>
                        <span className="text-[11px] text-purple-600 dark:text-purple-400 block font-semibold">{selectedBlog.author?.email || 'admin@cloudmood.com'} • Biên tập viên</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 space-y-1.5 text-xs">
                      <span className="font-bold text-gray-900 dark:text-slate-100 block mb-1">Thống kê tương tác & Thời gian</span>
                      <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-slate-300">
                        <span className="flex items-center gap-1"><Eye size={13} className="text-purple-500" /> Xem: <strong>{selectedBlog.viewCount || 0}</strong></span>
                        <span className="flex items-center gap-1"><Heart size={13} className="text-rose-500" /> Thích: <strong>{selectedBlog._count?.likes || selectedBlog.likeCount || 0}</strong></span>
                        <span className="flex items-center gap-1"><Share2 size={13} className="text-emerald-500" /> Chia sẻ: <strong>{(selectedBlog as any).shareCount || 0}</strong></span>
                        {(selectedBlog as any).createdAt && <span className="flex items-center gap-1"><Calendar size={13} className="text-blue-500" /> Ngày: <strong>{new Date((selectedBlog as any).createdAt).toLocaleDateString('vi-VN')}</strong></span>}
                      </div>
                    </div>
                  </div>

                  {selectedBlog.originalItinerary && (
                    <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-indigo-900 block">📖 Xuất từ bài Hướng dẫn du lịch:</span>
                        <span className="text-indigo-700 font-semibold">{selectedBlog.originalItinerary.title} (#{selectedBlog.originalItinerary.id})</span>
                      </div>
                      <button
                        onClick={() => {
                          setIsBlogDetailOpen(false);
                          handleOpenGuideDetail(selectedBlog.originalItinerary!.id);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 transition-colors cursor-pointer"
                      >
                        Xem Hướng dẫn gốc
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 flex justify-end">
              <button
                onClick={() => setIsBlogDetailOpen(false)}
                className="px-5 py-2 border border-gray-200 dark:border-slate-800 text-xs font-bold rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Đóng
              </button>
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

      {/* Upgraded Create Blog Modal */}
      {isCreateBlogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCreateBlog} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-7xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden relative">

            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-300 block mb-0.5">Biên tập nội dung</span>
                <h3 className="text-xl font-black tracking-wide flex items-center gap-2">
                  <Sparkles className="text-purple-400" size={22} />
                  {editingBlogId ? 'Chỉnh sửa Bài đăng Blog' : 'Tạo Bài đăng Blog mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateBlogOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="px-6 pt-2 pb-0 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setModalBlogTab('info')}
                className={`px-5 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${modalBlogTab === 'info'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-md'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                  }`}
              >
                <FileText size={14} /> Thông tin bài viết
              </button>
              <button
                type="button"
                onClick={() => setModalBlogTab('places')}
                className={`px-5 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${modalBlogTab === 'places'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-md'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                  }`}
              >
                <MapPin size={14} /> Cấu trúc & Địa điểm
                {selectedPlacesForBlog.length > 0 && (
                  <span className="bg-purple-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {selectedPlacesForBlog.filter((p: any) => !p.itemType || p.itemType === 'PLACE').length}
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body - Tab Content */}
            <div className="flex flex-col flex-1 min-h-0 text-xs">

              {/* TAB 1: Thông tin cơ bản */}
              {modalBlogTab === 'info' && (
                <div className="p-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

                    {/* LEFT: Form thông tin */}
                    <div className="space-y-4">
                      <h4 className="font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                        <FileText size={15} /> Thông tin cơ bản
                      </h4>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                          Tiêu đề Blog *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: TOP 10 địa điểm không thể bỏ lỡ tại Cần Thơ..."
                          value={newBlogTitle}
                          onChange={(e) => setNewBlogTitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>

                      <DestinationSearchInput
                        value={newBlogDest}
                        onChange={setNewBlogDest}
                        dbPlaces={allPlaces}
                        placeholder="Nhập tên thành phố/tỉnh (VD: Cần Thơ, Đà Nẵng...)..."
                      />

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                          Mô tả Blog
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Nhập nội dung mô tả bài viết Blog chi tiết..."
                          value={newBlogDesc}
                          onChange={(e) => setNewBlogDesc(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-y"
                        />
                      </div>

                      {/* Platform / Source Section */}
                      {editingBlogAuthor ? (
                        <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-3">
                          <label className="block text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <User size={14} /> Tác giả bài viết (Người dùng)
                            </span>
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Giữ nguyên thông tin người dùng làm nguồn</span>
                          </label>

                          <div className="flex items-center gap-3 p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-xl">
                            {editingBlogAuthor.avatar ? (
                              <img
                                src={editingBlogAuthor.avatar}
                                alt={editingBlogAuthor.fullName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-purple-200 shadow-2xs shrink-0"
                                onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-purple-200 dark:bg-purple-900 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-sm border-2 border-purple-300 shrink-0">
                                {editingBlogAuthor.fullName?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                                {editingBlogAuthor.fullName}
                                {editingBlogAuthor.email && (
                                  <span className="text-[10px] font-normal text-gray-400 dark:text-slate-500 truncate">
                                    ({editingBlogAuthor.email})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                                Bài đăng của người dùng - Nguồn bài viết hiển thị tên và avatar của tác giả.
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-3">
                          <label className="block text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Globe size={14} /> Nguồn bài viết (Source Platform)
                            </span>
                            <span className="text-[10px] text-gray-400 font-normal">Tự điền hoặc chọn mẫu có sẵn</span>
                          </label>

                          <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-0.5">
                            {[
                              { name: 'CloudMood', logo: '/favicon.ico' },
                              { name: 'Google', logo: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' },
                              { name: 'Facebook', logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968764.png' },
                              { name: 'YouTube', logo: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' },
                              { name: 'TikTok', logo: 'https://cdn-icons-png.flaticon.com/512/3046/3046124.png' },
                              { name: 'TripAdvisor', logo: 'https://cdn-icons-png.flaticon.com/512/2504/2504944.png' },
                            ].map((p) => (
                              <button
                                key={p.name}
                                type="button"
                                onClick={() => {
                                  setPlatformName(p.name);
                                  setPlatformLogo(p.logo);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${platformName === p.name
                                    ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-950 dark:text-purple-300 shadow-2xs'
                                    : 'bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:border-purple-300'
                                  }`}
                              >
                                <img src={p.logo} alt={p.name} className="w-3.5 h-3.5 object-contain" />
                                {p.name}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                            <div>
                              <input
                                type="text"
                                placeholder="Tên Nguồn (VD: Facebook...)"
                                value={platformName}
                                onChange={(e) => setPlatformName(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                              />
                            </div>
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                placeholder="URL Avatar / Logo Nguồn..."
                                value={platformLogo}
                                onChange={(e) => setPlatformLogo(e.target.value)}
                                className="w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                              />
                              {platformLogo && (
                                <img
                                  src={platformLogo}
                                  alt="Avatar Preview"
                                  className="absolute right-2 w-5 h-5 object-contain rounded-full border border-purple-200 bg-white p-0.5 shrink-0"
                                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                                />
                              )}
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Link Nguồn (https://...)"
                                value={platformUrl}
                                onChange={(e) => setPlatformUrl(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Ảnh bìa */}
                    <div className="space-y-4">
                      <h4 className="font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                        <ImageIcon size={15} /> Ảnh bìa bài viết
                      </h4>

                      <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                            <ImageIcon size={14} /> Cover Image
                          </label>
                          <label className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs">
                            {uploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            {uploadingCover ? 'Đang tải lên...' : 'Tải ảnh từ máy'}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingCover}
                              onChange={handleCoverFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <input
                          type="text"
                          placeholder="Hoặc dán URL ảnh bìa (https://...)..."
                          value={newBlogCover}
                          onChange={(e) => setNewBlogCover(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:outline-none"
                        />

                        {newBlogCover ? (
                          <div className="relative w-56 h-56 rounded-2xl overflow-hidden border-2 border-purple-300 dark:border-purple-800 group shadow-sm bg-slate-900 mx-auto">
                            <img
                              src={newBlogCover}
                              alt="Cover Preview"
                              className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                              onClick={() => setFullCoverPreviewUrl(newBlogCover)}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 pointer-events-none group-hover:pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => setFullCoverPreviewUrl(newBlogCover)}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-md transition-all"
                              >
                                <Eye size={13} /> Xem full ảnh
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewBlogCover('')}
                                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-md transition-all"
                              >
                                <X size={13} /> Xóa ảnh
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-56 h-56 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800 flex flex-col items-center justify-center gap-2 text-purple-300 bg-purple-50/30 dark:bg-purple-950/10 mx-auto">
                            <ImageIcon size={36} />
                            <span className="text-[11px] font-medium text-gray-400">Chưa có ảnh bìa</span>
                            <span className="text-[10px] text-gray-300">Tải lên hoặc dán URL ảnh bìa bên trên</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}


              {/* TAB 2: Địa điểm & Cấu trúc */}
              {modalBlogTab === 'places' && (
                <div className="p-6 flex-1 min-h-0 overflow-hidden flex flex-col">
                  <AttachedPlacesManager
                    selectedPlaces={selectedPlacesForBlog}
                    onSelectedPlacesChange={setSelectedPlacesForBlog}
                    allPlaces={allPlaces}
                    onFetchPlaces={fetchPlaces}
                    destination={newBlogDest}
                    coverImage={newBlogCover}
                    onCoverImageChange={(url) => {
                      setNewBlogCover(url);
                      showToast('Đã đặt ảnh địa điểm làm ảnh bìa bài Blog!', 'success');
                    }}
                  />
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-950 flex flex-col gap-2 shrink-0">
              {blogModalError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{blogModalError}</span>
                  <button type="button" onClick={() => setBlogModalError('')} className="ml-auto text-rose-400 hover:text-rose-600 cursor-pointer">
                    <X size={13} />
                  </button>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateBlogOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 dark:border-slate-800 font-bold rounded-xl text-xs text-gray-600 dark:text-slate-400 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createBlogLoading || uploadingCover}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {(createBlogLoading || uploadingCover) && <Loader2 size={15} className="animate-spin" />}
                  {editingBlogId ? '🚀 Cập nhật Bài Blog' : '🚀 Lưu Bài Blog'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Delete Blog Confirmation Modal */}
      {isDeleteBlogOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsDeleteBlogOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                  Xác nhận xóa bài viết Blog
                </h3>
                <p className="text-gray-500 dark:text-slate-400 text-xs mt-1">
                  Bạn có chắc chắn muốn xóa bài viết Blog này không? Thao tác này không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteBlogOpen(false)}
                className="px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteBlog}
                disabled={deleteBlogLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteBlogLoading && <Loader2 size={14} className="animate-spin" />}
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Guide Confirmation Modal */}
      {isDeleteGuideOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsDeleteGuideOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                  Xác nhận xóa Hướng dẫn du lịch
                </h3>
                <p className="text-gray-500 dark:text-slate-400 text-xs mt-1">
                  Bạn có chắc chắn muốn xóa bài Hướng dẫn du lịch này không? Thao tác này sẽ xóa vĩnh viễn dữ liệu trên hệ thống.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteGuideOpen(false)}
                className="px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteGuide}
                disabled={deleteGuideLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteGuideLoading && <Loader2 size={14} className="animate-spin" />}
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <form onSubmit={handleSaveCategory} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{editingCat ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Tên danh mục *</label>
              <input
                type="text"
                required
                placeholder="Tên danh mục..."
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-sm font-semibold border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                Phân loại (Tab Type) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Chọn hoặc nhập Tab Type (VD: PACKING, TODO...)"
                  value={catTabType}
                  onFocus={() => setIsTabTypeDropdownOpen(true)}
                  onChange={(e) => {
                    setCatTabType(e.target.value.toUpperCase());
                    setIsTabTypeDropdownOpen(true);
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-bold text-gray-900 dark:text-slate-100 pr-10 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setIsTabTypeDropdownOpen(!isTabTypeDropdownOpen)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
                >
                  <ChevronDown size={16} className={`transition-transform duration-200 ${isTabTypeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Custom Combobox Dropdown */}
              {isTabTypeDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[10000]"
                    onClick={() => setIsTabTypeDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl z-[10001] max-h-48 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                    {Array.from(new Set([
                      'GENERAL', 'PACKING', 'TODO', 'PREPARATION', 'MEDICAL', 'DOCUMENTS', 'FINANCE',
                      ...checklists.map((c: any) => c.tabType?.toUpperCase()).filter(Boolean)
                    ]))
                      .filter((t) => !catTabType || t.includes(catTabType.toUpperCase()))
                      .map((t) => (
                        <div
                          key={t}
                          onClick={() => {
                            setCatTabType(t);
                            setIsTabTypeDropdownOpen(false);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors flex justify-between items-center ${catTabType.toUpperCase() === t
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold'
                              : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                        >
                          <span>{t}</span>
                          {catTabType.toUpperCase() === t && <Check size={14} className="text-emerald-600" />}
                        </div>
                      ))}

                    {catTabType && !Array.from(new Set([
                      'GENERAL', 'PACKING', 'TODO', 'PREPARATION', 'MEDICAL', 'DOCUMENTS', 'FINANCE',
                      ...checklists.map((c: any) => c.tabType?.toUpperCase()).filter(Boolean)
                    ])).includes(catTabType.toUpperCase()) && (
                        <div
                          onClick={() => setIsTabTypeDropdownOpen(false)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus size={13} /> Tạo phân loại mới: "<span className="font-extrabold">{catTabType}</span>"
                        </div>
                      )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={catLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {catLoading ? 'Đang lưu...' : 'Lưu Danh mục'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Checklist Category Modal */}
      {isDeleteCatOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base">Xác nhận xóa danh mục</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Hành động này sẽ xóa danh mục và vật dụng bên trong</p>
              </div>
            </div>

            <p className="text-xs font-medium text-gray-700 dark:text-slate-300 leading-relaxed bg-rose-50/60 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
              Bạn có chắc chắn muốn xóa danh mục này cùng toàn bộ vật dụng bên trong không?
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteCatOpen(false);
                  setDeletingCatId(null);
                }}
                disabled={deleteCatLoading}
                className="px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={executeDeleteCategory}
                disabled={deleteCatLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteCatLoading && <Loader2 size={14} className="animate-spin" />}
                Xác nhận xóa
              </button>
            </div>
          </div>
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
                  className={`p-6 border-b flex items-start justify-between ${isTodoItem
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40'
                    : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${isTodoItem ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                        }`}
                    >
                      {isTodoItem ? <CheckSquare size={20} /> : <FileText size={20} />}
                    </div>
                    <div className="space-y-1">
                      <span
                        className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg inline-block ${isTodoItem
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
                            className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${todo.done
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


                    {/* Giờ */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 font-bold rounded-xl border transition-colors ${selectedPlaceItem.startTime || selectedPlaceItem.endTime
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900/60 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-800'
                        }`}
                    >
                      <Clock size={14} className={selectedPlaceItem.startTime || selectedPlaceItem.endTime ? 'text-blue-600' : 'opacity-40'} />
                      {selectedPlaceItem.startTime || selectedPlaceItem.endTime
                        ? `${selectedPlaceItem.startTime || '00:00'} - ${selectedPlaceItem.endTime || '00:00'}`
                        : 'Thêm giờ'}
                    </span>

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
                          const authorAvatar = rev.authorAvatar || rev.user?.avatar || '/default-avatar.svg';
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

      {/* Full Cover Image Preview Lightbox Modal */}
      {fullCoverPreviewUrl && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setFullCoverPreviewUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-12 right-0 flex items-center gap-3 text-white">
              <a
                href={fullCoverPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <ExternalLink size={13} /> Mở tab mới
              </a>
              <button
                type="button"
                onClick={() => setFullCoverPreviewUrl(null)}
                className="p-1.5 bg-white/20 hover:bg-rose-600 rounded-full text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <img
              src={fullCoverPreviewUrl}
              alt="Full Cover Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

    </div>
  );
}
