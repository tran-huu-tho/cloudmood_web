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
      
      {/* Left Panel: Carousel (Takes 60% of the screen width, clean layout with no top/bottom text) */}
      <div className="hidden md:flex md:w-[60%] bg-[#f8fafc] flex-col justify-center items-center p-16 lg:p-24 border-r border-gray-100 relative h-full">
        
        {/* Style block for smooth fade in animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideFadeIn {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: slideFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}} />

        {/* Carousel Container (Static flow to prevent overlap - 1.2x scale optimized) */}
        <div className="my-auto py-8 flex flex-col items-center justify-center w-full">
          <div
            key={activeSlide}
            className="flex flex-col items-center justify-center w-full animate-fadeIn"
          >
            {/* Enlarged image wrapper (1.2x scale: max-w-580px/620px, width=620) */}
            <div className="w-full max-w-[580px] lg:max-w-[620px] mb-10">
              <Image 
                src={SLIDES[activeSlide].image} 
                alt={SLIDES[activeSlide].title} 
                width={620} 
                height={480} 
                className="object-contain mx-auto drop-shadow-md hover:scale-102 transition-transform duration-500"
                priority
              />
            </div>

            <div className="text-center max-w-xl mx-auto px-4 mt-4">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight lg:text-4xl">
                {SLIDES[activeSlide].title}
              </h2>
              <p className="text-base lg:text-lg text-gray-500 font-semibold leading-relaxed mt-4 px-6">
                {SLIDES[activeSlide].description}
              </p>
            </div>
          </div>

          {/* Slide Indicators (Dots) positioned relatively below the slide content */}
          <div className="flex justify-center gap-3 mt-12 z-10">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 cursor-pointer ${
                  index === activeSlide ? 'bg-blue-600 w-10' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form (Takes 40% of the screen width, centered) */}
      <div className="w-full md:w-[40%] bg-white flex flex-col justify-between p-8 sm:p-16 lg:p-24 h-full overflow-y-auto">
        
        {/* Form Body - Extra Large Layout & Centered Brand Logo */}
        <div className="my-auto w-full max-w-[460px] mx-auto py-10">
          
          {/* Logo centered above login */}
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-28 h-28 rounded-[32px] overflow-hidden bg-white shadow-2xl flex items-center justify-center border border-gray-100 shrink-0 mb-4">
              <Image 
                src="/logo-cloudmood.png" 
                alt="Cloudmood Logo" 
                width={100} 
                height={100} 
                className="object-cover"
              />
            </div>
            <span className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight leading-none mb-2">CloudMood</span>
            <span className="text-sm text-gray-400 font-bold uppercase tracking-widest">Hệ thống quản trị</span>
          </div>

          {/* Centered Login Title & Subtitle */}
          <div className="space-y-4 mb-10 text-center">
            <h2 className="text-6xl font-black text-gray-950 tracking-tight leading-none">Đăng nhập</h2>
            <p className="text-lg text-gray-500 font-semibold">Vui lòng nhập tài khoản admin để tiếp tục</p>
          </div>

          {error && (
            <div className="mb-8 text-base font-semibold text-red-600 bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-center gap-3 animate-pulse">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-lg font-bold text-gray-800 block">Tên đăng nhập / Email</label>
              <input
                type="email"
                required
                placeholder="VD: admin@cloudmood.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full text-xl text-gray-950 border border-gray-300 rounded-2xl px-6 py-5 bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all placeholder-gray-400 font-medium"
              />
            </div>

            <div className="space-y-3">
              <label className="text-lg font-bold text-gray-800 block">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full text-xl text-gray-950 border border-gray-300 rounded-2xl pl-6 pr-16 py-5 bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all placeholder-gray-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-3 text-lg text-gray-600 font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                Ghi nhớ thiết bị này
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer text-xl mt-6"
            >
              {loading && <Loader2 size={24} className="animate-spin" />}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-sm text-gray-400 font-medium text-center pt-8">
          &copy; 2026 CloudMood. Tất cả quyền được bảo lưu.
        </div>
      </div>

    </div>
  );
}
