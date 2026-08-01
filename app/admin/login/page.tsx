"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const SLIDES = [
  {
    image: '/weather-travel.png',
    title: 'Dự báo du lịch thông minh',
    description: 'Tự động gợi ý hành trình và đề xuất các địa điểm tham quan, ăn uống phù hợp nhất với điều kiện thời tiết thực tế.'
  },
  {
    image: '/stats-analytics.png',
    title: 'Thống kê số liệu thời gian thực',
    description: 'Theo dõi trực quan và chính xác số lượng người dùng, lượt tương tác, đánh giá nhận xét và kế hoạch hành trình.'
  },
  {
    image: '/interactive-map.png',
    title: 'Bản đồ tương tác trực quan',
    description: 'Tìm kiếm, xác định vị trí và tinh chỉnh tọa độ địa điểm chính xác trực tiếp trên bản đồ số Google Maps.'
  }
];

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Automatic slide rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ địa chỉ email và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Email hoặc mật khẩu không chính xác.');
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      setError('Đã xảy ra lỗi kết nối mạng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col md:flex-row overflow-hidden bg-white font-sans select-none">
      
      {/* Left Panel: Carousel (Takes 55% of screen width) */}
      <div className="hidden md:flex md:w-[55%] bg-[#f8fafc] flex-col justify-center items-center p-8 lg:p-12 border-r border-gray-100 relative h-full overflow-hidden">
        
        {/* Style block for smooth fade in animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideFadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: slideFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}} />

        {/* Carousel Container */}
        <div className="my-auto flex flex-col items-center justify-center w-full max-w-xl">
          <div
            key={activeSlide}
            className="flex flex-col items-center justify-center w-full animate-fadeIn"
          >
            {/* Image wrapper */}
            <div className="w-full max-w-[420px] lg:max-w-[460px] mb-6">
              <Image 
                src={SLIDES[activeSlide].image} 
                alt={SLIDES[activeSlide].title} 
                width={460} 
                height={340} 
                className="object-contain mx-auto drop-shadow-md hover:scale-102 transition-transform duration-500 max-h-[320px]"
                priority
              />
            </div>

            <div className="text-center max-w-lg mx-auto px-4">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight lg:text-3xl">
                {SLIDES[activeSlide].title}
              </h2>
              <p className="text-sm lg:text-base text-gray-500 font-semibold leading-relaxed mt-2.5 px-4">
                {SLIDES[activeSlide].description}
              </p>
            </div>
          </div>

          {/* Slide Indicators (Dots) */}
          <div className="flex justify-center gap-2.5 mt-8 z-10">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  index === activeSlide ? 'bg-blue-600 w-8' : 'bg-gray-300 hover:bg-gray-400 w-2.5'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form (Takes 45% of screen width) */}
      <div className="w-full md:w-[45%] bg-white flex flex-col justify-between p-6 sm:p-10 lg:p-12 h-full overflow-hidden">
        
        {/* Form Body - Centered & Compact */}
        <div className="my-auto w-full max-w-[380px] mx-auto py-2">
          
          {/* Logo centered above login */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-lg flex items-center justify-center border border-gray-100 shrink-0 mb-2.5">
              <Image 
                src="/logo-cloudmood.png" 
                alt="Cloudmood Logo" 
                width={60} 
                height={60} 
                className="object-cover"
              />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight leading-none mb-1">CloudMood</span>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Hệ thống quản trị</span>
          </div>

          {/* Centered Login Title & Subtitle */}
          <div className="space-y-1 mb-6 text-center">
            <h2 className="text-3xl font-black text-gray-950 tracking-tight leading-none">Đăng nhập</h2>
            <p className="text-xs text-gray-500 font-semibold">Vui lòng nhập tài khoản admin để tiếp tục</p>
          </div>

          {error && (
            <div className="mb-4 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center justify-center gap-2 animate-pulse">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-800 block">Tên đăng nhập / Email</label>
              <input
                type="email"
                required
                placeholder="VD: admin@cloudmood.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full text-sm text-gray-950 border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-50 transition-all placeholder-gray-400 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-800 block">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full text-sm text-gray-950 border border-gray-300 rounded-xl pl-4 pr-12 py-3 bg-white focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-50 transition-all placeholder-gray-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 text-xs text-gray-600 font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                Ghi nhớ thiết bị này
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm mt-3"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-[11px] text-gray-400 font-medium text-center pt-2">
          &copy; 2026 CloudMood. Tất cả quyền được bảo lưu.
        </div>
      </div>

    </div>
  );
}
