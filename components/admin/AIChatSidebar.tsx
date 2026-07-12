"use client";

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { MessageSquare, X, Send, Loader2, Star, Trash2, CheckCircle2, AlertCircle, BarChart3, MapPin, Globe, Phone, ArrowUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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

export default function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Xin chào! Mình là **CloudBros** - Trợ lý AI đồng hành quản trị hệ thống CloudMood. Bạn cần **CloudBros** hỗ trợ gì hôm nay?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    
    const userMessageId = Math.random().toString();
    setMessages(prev => [...prev, { id: userMessageId, role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Map message history to backend format
      const history = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const res = await fetch('/admin/ai/chat', {
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
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse simple markdown formatting like **bold** and newlines
  const renderFormattedText = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Custom widget handlers
  const handleDeleteReview = async (reviewId: string, messageId: string, widgetIndex: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhận xét này không?')) return;
    try {
      const res = await fetch(`/admin/ai/chat`, {
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
      
      alert('Đã xóa đánh giá thành công!');
    } catch (err: any) {
      alert(`Lỗi khi xóa: ${err.message}`);
    }
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
          <div className="mt-3 p-4 bg-slate-50/70 border border-slate-200/60 rounded-2xl space-y-4 shadow-sm max-w-xl">
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs uppercase tracking-wider">
              <BarChart3 size={14} className="text-blue-500" />
              <span>Số liệu thống kê</span>
            </div>
            
            {/* Quick Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-xs">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Địa điểm</div>
                <div className="text-xl font-bold text-slate-800 mt-1">{totalPlaces}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-xs">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Đánh giá</div>
                <div className="text-xl font-bold text-slate-800 mt-1">{totalReviews}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-xs">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">User</div>
                <div className="text-xl font-bold text-slate-800 mt-1">{totalUsers}</div>
              </div>
            </div>

            {/* Custom Horizontal Bar Chart */}
            <div className="space-y-2.5 pt-1">
              <div className="text-xs text-slate-500 font-bold mb-1">Cơ cấu danh mục địa điểm:</div>
              {(categoryStats || []).map((cat: any, i: number) => {
                const percent = (cat.count / maxVal) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>{cat.name}</span>
                      <span>{cat.count}</span>
                    </div>
                    <div className="w-full bg-slate-200/75 h-2 rounded-full overflow-hidden">
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
                      onClick={() => handleDeleteReview(rev.id, messageId, widgetIndex)}
                      className="text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 shrink-0 ml-2 cursor-pointer transition-colors"
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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />
      
      {/* Chat Box Container */}
      <div className="relative w-full max-w-6xl h-[82vh] bg-gradient-to-b from-slate-50/95 to-white/98 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-[0_24px_70px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white/50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center p-1.5 shadow-md shadow-blue-500/10 shrink-0 border border-white/20">
              <img src="/logo-xoanen-cloudmood.png" alt="AI Avatar" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">Trợ lý AI CloudBros</div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang hoạt động
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border border-transparent hover:border-slate-200/60"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/30">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 w-full ${
                msg.role === 'model' ? 'justify-start' : 'justify-end'
              }`}
            >
              {msg.role === 'model' && (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center p-1 shrink-0 shadow-sm border border-white/20 mt-0.5">
                  <img src="/logo-xoanen-cloudmood.png" alt="AI" className="w-full h-full object-contain" />
                </div>
              )}
              
              <div className={`flex flex-col ${msg.role === 'model' ? 'items-start w-full max-w-[90%]' : 'items-end max-w-[70%]'}`}>
                <div 
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'model' 
                      ? 'bg-white border border-slate-200/60 text-slate-800 rounded-tl-none shadow-xs max-w-2xl'
                      : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-blue-500/10'
                  }`}
                >
                  {msg.role === 'model' ? (
                    <div className="space-y-1 break-words">
                      {msg.text.split('\n').map((line, i) => (
                        <p key={i}>{renderFormattedText(line)}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="break-words">{msg.text}</p>
                  )}
                </div>

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
            <div className="flex items-center gap-3 self-start">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center p-1 shrink-0 shadow-sm border border-white/20">
                <img src="/logo-xoanen-cloudmood.png" alt="AI" className="w-full h-full object-contain animate-pulse" />
              </div>
              <div className="flex items-center gap-2.5 text-slate-400 text-xs italic bg-white border border-slate-200/60 px-3.5 py-2.5 rounded-2xl shadow-xs">
                <Loader2 className="animate-spin text-blue-500" size={14} />
                <span>MoodBros đang tra cứu thông tin hệ thống...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-slate-200/80 bg-white">
          <form onSubmit={handleSend} className="w-full flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 transition-all shadow-inner">
            <input
              type="text"
              placeholder="Nhập yêu cầu: hỏi số liệu, tìm quán cà phê, lọc đánh giá 1 sao..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-transparent text-slate-800 border-none outline-none px-3.5 py-2 text-sm disabled:opacity-50"
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
