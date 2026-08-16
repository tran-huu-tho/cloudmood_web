"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  Star, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  MapPin, 
  Globe, 
  Phone, 
  ArrowUp,
  Coffee,
  Hotel,
  Edit3,
  Sparkles,
  RotateCcw,
  ChevronRight,
  Info
} from 'lucide-react';
import { getCategoryIcon } from '@/app/admin/(dashboard)/categories/page';

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  widgets?: any[];
}

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ToastNotificationState {
  isOpen: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

const INITIAL_WELCOME_TEXT = `👋 **Xin chào Admin! Em là CloudBros** - Trợ lý AI đồng hành thông minh quản trị hệ thống **CloudMood Cần Thơ**.

Em được kết nối trực tiếp với cơ sở dữ liệu thời gian thực và sẵn sàng hỗ trợ Admin thực hiện các tác vụ quản trị:

• 📊 **Thống kê & Báo cáo:** Tra cứu số lượng địa điểm, người dùng, đánh giá và tỷ lệ phân bố theo từng danh mục.
• 🔍 **Tra cứu Địa điểm:** Tìm kiếm quán cà phê, nhà hàng, khách sạn, điểm check-in Cần Thơ theo tên, địa chỉ hoặc danh mục.
• ⭐ **Rà soát & Quản lý Đánh giá:** Lọc nhận xét 1 sao - 2 sao tiêu cực, kiểm duyệt nội dung và hỗ trợ xóa nhận xét vi phạm trực tiếp.
• ✏️ **Cập nhật CSDL Tức thì:** Sửa thông tin địa điểm (giờ mở cửa, hotline, địa chỉ, website, mức giá...) nhanh chóng bằng câu lệnh tự nhiên.
• 💡 **Tư vấn & Vận hành:** Đề xuất gợi ý tối ưu dữ liệu và hỗ trợ giải đáp mọi thắc mắc về nền tảng CloudMood.

👇 *Admin có thể bấm vào các câu hỏi gợi ý bên dưới hoặc nhập yêu cầu trực tiếp để bắt đầu nhé:*`;

const SUGGESTED_PROMPTS = [
  {
    id: 'stats',
    category: '📊 Thống kê',
    title: 'Thống kê tổng quan hệ thống',
    description: 'Xem số lượng địa điểm, người dùng, đánh giá & cơ cấu danh mục',
    prompt: 'Báo cáo thống kê tổng quan số liệu hệ thống CloudMood',
    icon: BarChart3,
    badgeColor: 'bg-blue-50 text-blue-600 border-blue-200/80',
    hoverBorder: 'hover:border-blue-400 hover:bg-blue-50/40',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'reviews-1star',
    category: '⭐ Đánh giá',
    title: 'Lọc đánh giá 1 sao gần đây',
    description: 'Tìm kiếm các nhận xét 1 sao tiêu cực cần xử lý & kiểm duyệt',
    prompt: 'Lọc danh sách các nhận xét và đánh giá 1 sao cần xử lý',
    icon: Star,
    badgeColor: 'bg-amber-50 text-amber-600 border-amber-200/80',
    hoverBorder: 'hover:border-amber-400 hover:bg-amber-50/40',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    id: 'cafe',
    category: '☕ Cà phê Cần Thơ',
    title: 'Tìm quán cà phê nổi bật',
    description: 'Tra cứu danh sách các quán cà phê đẹp và phổ biến tại Cần Thơ',
    prompt: 'Tìm các quán cà phê view đẹp và nổi bật ở Cần Thơ',
    icon: Coffee,
    badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    hoverBorder: 'hover:border-emerald-400 hover:bg-emerald-50/40',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    id: 'hotels',
    category: '🏨 Lưu trú',
    title: 'Khách sạn & Homestay',
    description: 'Tìm kiếm danh sách khách sạn, khu nghỉ dưỡng và homestay Cần Thơ',
    prompt: 'Tìm danh sách khách sạn và homestay tại Cần Thơ',
    icon: Hotel,
    badgeColor: 'bg-purple-50 text-purple-600 border-purple-200/80',
    hoverBorder: 'hover:border-purple-400 hover:bg-purple-50/40',
    iconBg: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'checkin',
    category: '📍 Điểm đến',
    title: 'Tra cứu Bến Ninh Kiều',
    description: 'Xem chi tiết thông tin, địa chỉ, giờ mở cửa của Bến Ninh Kiều',
    prompt: 'Tra cứu thông tin chi tiết về Bến Ninh Kiều Cần Thơ',
    icon: MapPin,
    badgeColor: 'bg-rose-50 text-rose-600 border-rose-200/80',
    hoverBorder: 'hover:border-rose-400 hover:bg-rose-50/40',
    iconBg: 'bg-rose-100 text-rose-600',
  },
  {
    id: 'update-guide',
    category: '✏️ Cập nhật CSDL',
    title: 'Hướng dẫn sửa dữ liệu',
    description: 'Cách yêu cầu AI cập nhật giờ mở cửa, hotline hoặc thông tin địa điểm',
    prompt: 'Làm thế nào để yêu cầu CloudBros cập nhật giờ mở cửa hoặc số điện thoại của một địa điểm?',
    icon: Edit3,
    badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
    hoverBorder: 'hover:border-indigo-400 hover:bg-indigo-50/40',
    iconBg: 'bg-indigo-100 text-indigo-600',
  },
];

export default function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: INITIAL_WELCOME_TEXT
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom Modal & Toast States
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [toast, setToast] = useState<ToastNotificationState>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ isOpen: true, type, title, message });
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, isOpen: false }));
    }, 3800);
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: INITIAL_WELCOME_TEXT
      }
    ]);
    setInput('');
    triggerToast('info', 'Làm mới cuộc trò chuyện', 'Đã khởi động lại phiên trò chuyện mới cùng CloudBros.');
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMsg = messageText.trim();
    setInput('');
    
    const userMessageId = Math.random().toString();
    const updatedMessages = [...messages, { id: userMessageId, role: 'user' as const, text: userMsg }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Map message history to backend format
      const history = updatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const res = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMsg,
          history
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: 'model',
        text: data.text,
        widgets: data.widgets || []
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: 'model',
        text: `⚠️ **Lỗi kết nối:** Không thể gửi tin nhắn đến server AI (${err.message}). Vui lòng kiểm tra xem backend NestJS đang chạy ở port 3000 hay chưa.`
      }]);
      triggerToast('error', 'Lỗi kết nối', err.message || 'Không thể kết nối đến máy chủ AI');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  // Helper to parse markdown formatting like **bold**, `code`, lists and newlines
  const renderFormattedLine = (line: string, index: number) => {
    if (!line.trim()) {
      return <div key={index} className="h-1.5" />;
    }

    // Check if line is a bullet item
    const isBullet = /^(\s*[-*•]|\s*\d+\.)\s+/.test(line);
    const content = isBullet ? line.replace(/^(\s*[-*•]|\s*\d+\.)\s+/, '') : line;

    // Parse **bold** and `code`
    const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    const formattedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={pIdx}
            className="px-1.5 py-0.5 mx-0.5 text-xs font-mono bg-slate-100 text-blue-600 rounded border border-slate-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={index} className="flex items-start gap-2 my-1 text-slate-700 pl-1">
          <span className="text-blue-500 font-bold mt-0.5 shrink-0">•</span>
          <div className="flex-1 leading-relaxed">{formattedParts}</div>
        </div>
      );
    }

    return (
      <p key={index} className="leading-relaxed text-slate-700 my-0.5">
        {formattedParts}
      </p>
    );
  };

  // Custom confirmation dialog for deleting reviews
  const promptDeleteReview = (reviewId: string, authorName: string, placeName: string, messageId: string, widgetIndex: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa nhận xét',
      message: `Bạn có chắc chắn muốn xóa nhận xét của "${authorName || 'người dùng'}" tại "${placeName || 'địa điểm'}"? Hành động này sẽ gỡ bỏ dữ liệu vĩnh viễn khỏi hệ thống CSDL.`,
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/admin/ai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `Xóa nhận xét có ID ${reviewId}`,
              history: []
            })
          });

          if (!res.ok) throw new Error('Xóa đánh giá thất bại');
          
          // Update state to show review has been deleted
          setMessages(prev => prev.map(m => {
            if (m.id === messageId && m.widgets) {
              const updatedWidgets = [...m.widgets];
              const w = updatedWidgets[widgetIndex];
              if (w.toolName === 'searchReviews') {
                w.result.reviews = w.result.reviews.filter((r: any) => r.id !== reviewId);
              }
              return { ...m, widgets: updatedWidgets };
            }
            return m;
          }));
          
          triggerToast('success', 'Đã xóa thành công', `Nhận xét ID #${reviewId} đã được gỡ bỏ khỏi hệ thống.`);
        } catch (err: any) {
          triggerToast('error', 'Lỗi khi xóa nhận xét', err.message || 'Không thể xóa nhận xét. Vui lòng thử lại.');
        }
      }
    });
  };

  const renderWidget = (widget: any, messageId: string, widgetIndex: number) => {
    const { toolName, result } = widget;
    if (!result || result.error) {
      return (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs flex items-center gap-2">
          <AlertCircle size={14} />
          <span>Lỗi xử lý: {result?.error || 'Không có dữ liệu trả về'}</span>
        </div>
      );
    }

    switch (toolName) {
      case 'getDatabaseStats': {
        const { totalPlaces, totalReviews, totalUsers, categoryStats } = result;
        const maxVal = Math.max(...(categoryStats || []).map((c: any) => c.count), 1);

        return (
          <div className="mt-3 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-4 shadow-sm max-w-2xl">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
              <BarChart3 size={15} className="text-blue-500" />
              <span>Số liệu thống kê hệ thống CloudMood</span>
            </div>
            
            {/* Quick Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-center shadow-xs">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Địa điểm</div>
                <div className="text-2xl font-black text-blue-600 mt-1">{totalPlaces}</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-center shadow-xs">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đánh giá</div>
                <div className="text-2xl font-black text-amber-500 mt-1">{totalReviews}</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-center shadow-xs">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Người dùng</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{totalUsers}</div>
              </div>
            </div>

            {/* Custom Horizontal Bar Chart */}
            <div className="space-y-2.5 pt-1 bg-white p-3.5 rounded-xl border border-slate-200/80">
              <div className="text-xs text-slate-700 font-bold mb-2">Cơ cấu danh mục địa điểm:</div>
              {(categoryStats || []).map((cat: any, i: number) => {
                const percent = (cat.count / maxVal) * 100;
                const IconComponent = getCategoryIcon(cat.iconCode);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 items-center">
                      <span className="flex items-center gap-1.5">
                        <IconComponent size={13} className="shrink-0 text-slate-400" />
                        {cat.name}
                      </span>
                      <span className="font-bold text-slate-800">{cat.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'searchPlaces': {
        const { places } = result;
        if (!places || places.length === 0) return null;
        return (
          <div className="mt-3 space-y-2.5 w-full">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kết quả tìm thấy ({places.length})</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-1">
              {places.map((place: any, i: number) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition-all duration-200 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-bold text-slate-800 text-sm line-clamp-1">{place.name}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold border border-blue-100 shrink-0">
                        {place.category}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-500 flex items-start gap-1">
                      <MapPin size={12} className="shrink-0 mt-0.5 text-slate-400" />
                      <span className="line-clamp-2">{place.address}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-slate-100 text-xs text-slate-400">
                    {place.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={10} /> {place.phone}
                      </span>
                    )}
                    {place.website && (
                      <a href={place.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline font-medium">
                        <Globe size={10} /> Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'searchReviews': {
        const { reviews } = result;
        if (!reviews || reviews.length === 0) {
          return <div className="mt-3 text-xs text-slate-400 italic">Tất cả nhận xét phù hợp đã được xử lý.</div>;
        }
        return (
          <div className="mt-3 space-y-2.5 w-full">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nhận xét được tìm thấy ({reviews.length})</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {reviews.map((rev: any, i: number) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-rose-200 transition-all duration-200">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="text-xs">
                        <span className="font-bold text-slate-800">{rev.authorName}</span>
                        <span className="text-slate-400"> ({rev.authorLocation})</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                        <Star size={11} fill="currentColor" />
                        <span className="text-xs font-bold">{rev.rating}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 italic leading-relaxed">
                      "{rev.comment}"
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                    <span className="text-slate-400 font-semibold truncate max-w-[200px]" title={rev.placeName}>Tại: {rev.placeName}</span>
                    <button 
                      onClick={() => promptDeleteReview(rev.id, rev.authorName, rev.placeName, messageId, widgetIndex)}
                      className="text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 shrink-0 ml-2 cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 size={12} /> Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'updatePlaceDetails': {
        const { placeId, updatedName } = result;
        return (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs flex items-center gap-2 max-w-md">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
            <div>
              <span className="font-bold">Cập nhật thành công:</span> Thay đổi trên địa điểm <strong className="font-bold">"{updatedName}"</strong> (ID: {placeId}) đã được lưu lại trong CSDL.
            </div>
          </div>
        );
      }

      case 'deleteReview': {
        const { reviewId } = result;
        return (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs flex items-center gap-2 max-w-md">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
            <div>
              <span className="font-bold">Đã xóa thành công:</span> Nhận xét ID <strong className="font-bold">#{reviewId}</strong> đã được gỡ bỏ khỏi hệ thống.
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const isInitialState = messages.length === 1;

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-[9999] flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />
      
      {/* Toast Notification Box */}
      {toast.isOpen && (
        <div className="absolute top-6 right-6 z-[10002] animate-in slide-in-from-top-3 fade-in duration-250 max-w-md w-full shadow-2xl">
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 backdrop-blur-md shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-50/98 border-emerald-200 text-emerald-800 shadow-emerald-500/10'
              : toast.type === 'error'
              ? 'bg-rose-50/98 border-rose-200 text-rose-800 shadow-rose-500/10'
              : 'bg-blue-50/98 border-blue-200 text-blue-800 shadow-blue-500/10'
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              toast.type === 'success' 
                ? 'bg-emerald-500 text-white' 
                : toast.type === 'error' 
                ? 'bg-rose-500 text-white' 
                : 'bg-blue-500 text-white'
            }`}>
              {toast.type === 'success' && <CheckCircle2 size={16} />}
              {toast.type === 'error' && <AlertCircle size={16} />}
              {toast.type === 'info' && <Info size={16} />}
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="font-bold text-xs">{toast.title}</div>
              <div className="text-xs opacity-90 leading-snug">{toast.message}</div>
            </div>
            <button 
              onClick={() => setToast(prev => ({ ...prev, isOpen: false }))}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal Box */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[10001] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200/90 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/70 shadow-xs">
                <Trash2 size={22} />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-bold text-slate-900 text-base">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                {confirmModal.cancelText || 'Hủy bỏ'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>{confirmModal.confirmText || 'Xác nhận xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Box Container */}
      <div className="relative w-full max-w-5xl h-[88vh] bg-gradient-to-b from-slate-50/98 to-white/98 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-[0_24px_70px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center p-2 shadow-md shadow-blue-500/20 shrink-0 border border-white/30">
              <img src="/logo-xoanen-cloudmood.png" alt="AI Avatar" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span>Trợ lý AI CloudBros</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-200/60">
                  CloudMood Admin
                </span>
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 
                <span>Đang hoạt động • Sẵn sàng hỗ trợ quản trị CSDL</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetChat}
              title="Làm mới cuộc trò chuyện"
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border border-transparent hover:border-slate-200/60 flex items-center gap-1 text-xs font-medium"
            >
              <RotateCcw size={15} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <button 
              onClick={onClose} 
              title="Đóng cửa sổ"
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border border-transparent hover:border-slate-200/60"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/40">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 w-full ${
                msg.role === 'model' ? 'justify-start' : 'justify-end'
              }`}
            >
              {msg.role === 'model' && (
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center p-1.5 shrink-0 shadow-sm border border-white/30 mt-0.5">
                  <img src="/logo-xoanen-cloudmood.png" alt="AI" className="w-full h-full object-contain" />
                </div>
              )}
              
              <div className={`flex flex-col ${msg.role === 'model' ? 'items-start w-full max-w-[95%]' : 'items-end max-w-[75%]'}`}>
                <div 
                  className={`p-4 sm:p-5 rounded-3xl text-sm leading-relaxed ${
                    msg.role === 'model' 
                      ? 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-sm shadow-xs max-w-3xl'
                      : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow-md shadow-blue-500/10'
                  }`}
                >
                  {msg.role === 'model' ? (
                    <div className="space-y-1 break-words text-slate-700">
                      {msg.text.split('\n').map((line, i) => renderFormattedLine(line, i))}
                    </div>
                  ) : (
                    <p className="break-words font-medium">{msg.text}</p>
                  )}
                </div>

                {/* Render Suggested Prompt Grid when only the initial welcome message is present */}
                {msg.id === 'welcome' && isInitialState && (
                  <div className="mt-4 w-full max-w-3xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                      <Sparkles size={13} className="text-amber-500" />
                      <span>Câu hỏi & Tác vụ mẫu gợi ý (Bấm để thử ngay)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {SUGGESTED_PROMPTS.map((item) => {
                        const IconComp = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => sendMessage(item.prompt)}
                            disabled={loading}
                            className={`group p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md ${item.hoverBorder} transition-all duration-200 text-left flex flex-col justify-between space-y-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                                  {item.category}
                                </span>
                                <div className={`w-6 h-6 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                                  <IconComp size={12} />
                                </div>
                              </div>
                              <div className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                                {item.description}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                              <span>Thử ngay</span>
                              <ChevronRight size={12} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Render any widgets associated with the message */}
                {msg.widgets && msg.widgets.map((widget, i) => (
                  <div key={i} className="w-full">
                    {renderWidget(widget, msg.id, i)}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 self-start animate-in fade-in duration-150">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center p-1.5 shrink-0 shadow-sm border border-white/30">
                <img src="/logo-xoanen-cloudmood.png" alt="AI" className="w-full h-full object-contain animate-pulse" />
              </div>
              <div className="flex items-center gap-2.5 text-slate-500 text-xs font-medium bg-white border border-slate-200/80 px-4 py-3 rounded-2xl shadow-xs">
                <Loader2 className="animate-spin text-blue-600" size={15} />
                <span>CloudBros đang tra cứu & xử lý thông tin hệ thống...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 bg-white border-t border-slate-200/80">
          <form onSubmit={handleSend} className="w-full flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 transition-all shadow-inner">
            <input
              ref={inputRef}
              type="text"
              placeholder="Nhập câu hỏi: hỏi số liệu, tra cứu địa điểm Cần Thơ, lọc đánh giá 1 sao, cập nhật CSDL..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-transparent text-slate-800 border-none outline-none px-3.5 py-2 text-sm disabled:opacity-50 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 text-white w-9 h-9 rounded-full transition-all shrink-0 shadow-md shadow-blue-500/10 disabled:shadow-none flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
