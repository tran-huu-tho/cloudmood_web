"use client";

import React, { useEffect, useState, useRef, useTransition, startTransition } from 'react';
import dynamic from 'next/dynamic';
import { Place, Category } from '@/lib/supabase/types';
import { Plus, Edit2, Trash2, Search, X, Loader2, MapPin, ExternalLink, Check, Upload, Star, MessageSquare, Calendar, Clock, Image as ImageIcon, Info, ArrowRight, ArrowLeft, Layers, AlertCircle, Eye, EyeOff, User } from 'lucide-react';
import { cleanAddress, formatPrice } from '@/lib/utils';
import { getCategoryIcon } from '../categories/page';

const MapPicker = dynamic(() => import('@/components/admin/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center text-gray-400 text-sm">
      Loading picker map...
    </div>
  ),
});

const getCategoryBadgeStyle = (categoryId: number) => {
  const styles = [
    'bg-blue-50 text-blue-700 border-blue-200',      // Blue
    'bg-rose-50 text-rose-700 border-rose-200',      // Red/Rose
    'bg-emerald-50 text-emerald-700 border-emerald-200', // Green
    'bg-amber-50 text-amber-800 border-amber-200',   // Yellow
    'bg-purple-50 text-purple-700 border-purple-200', // Purple
    'bg-orange-50 text-orange-700 border-orange-200', // Orange
    'bg-pink-50 text-pink-700 border-pink-200',      // Pink
  ];
  return styles[categoryId % styles.length];
};

const formatTimeToHHMM = (timeString: any) => {
  if (!timeString) return '';
  if (typeof timeString === 'string' && (timeString.includes('T') || timeString.includes('-'))) {
    try {
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    } catch (e) {
      // Fallback
    }
  }
  if (typeof timeString === 'string') {
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }
  return '';
};

const displayOpeningHours = (place: any) => {
  const open = formatTimeToHHMM(place.openTime);
  const close = formatTimeToHHMM(place.closeTime);

  if (open && close) {
    return `${open} - ${close}`;
  }

  const rawHours = place.opening_hours || place.openingHours;

  if (rawHours) {
    try {
      const hours = typeof rawHours === 'string'
        ? JSON.parse(rawHours)
        : rawHours;

      if (hours && typeof hours === 'object') {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[new Date().getDay()];

        if (hours[currentDay] && Array.isArray(hours[currentDay]) && hours[currentDay].length >= 2) {
          return `${hours[currentDay][0]} - ${hours[currentDay][1]}`;
        }

        for (const day of days) {
          if (hours[day] && Array.isArray(hours[day]) && hours[day].length >= 2) {
            return `${hours[day][0]} - ${hours[day][1]}`;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing openingHours:', e);
    }
  }

  return 'N/A - N/A';
};

export default function LocationsPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startFilterTransition] = useTransition();

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter, selectedSubCategoryFilter, approvalFilter]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [showReviewsImportHelp, setShowReviewsImportHelp] = useState(false);
  const [showPhotosImportHelp, setShowPhotosImportHelp] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [currentPlace, setCurrentPlace] = useState<any>({
    name: '',
    description: '',
    address: '',
    latitude: 10.03022,
    longitude: 105.78753,
    price: '',
    categoryId: null,
    image: '',
    phone: '',
    website: '',
    tripadvisorUrl: '',
    priceLevel: 'MODERATE',
    subCategories: [],
    subCategoriesInput: '',
    openingHours: {
      monday: ['07:00', '23:00'],
      tuesday: ['07:00', '23:00'],
      wednesday: ['07:00', '23:00'],
      thursday: ['07:00', '23:00'],
      friday: ['07:00', '23:00'],
      saturday: ['07:00', '23:00'],
      sunday: ['07:00', '23:00']
    }
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Tabs State (For Modal: basic | extra | reviews | photos)
  const [activeTab, setActiveTab] = useState<'basic' | 'extra' | 'reviews' | 'photos'>('basic');
  const [placeReviews, setPlaceReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [placePhotos, setPlacePhotos] = useState<any[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  const [newReview, setNewReview] = useState({
    authorName: '',
    authorAvatar: '',
    rating: 5,
    comment: '',
    publishedDate: '',
    authorLocation: '',
  });

  const [newPhoto, setNewPhoto] = useState({
    urlOriginal: '',
    urlThumbnail: '',
    caption: '',
  });
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // File Upload Refs & Compressor
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const detailPhotoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const importReviewsInputRef = useRef<HTMLInputElement>(null);
  const importPhotosInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingDetailPhoto, setUploadingDetailPhoto] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const uploadImageToCloudinary = async (base64Str: string, folder = 'cloudmood_places'): Promise<string> => {
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

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(true);
    try {
      showToast('Đang xử lý và tải ảnh lên Cloudinary...', 'success');
      const compressed = await compressImageFile(file, 1200, 0.85);
      if (compressed) {
        const cloudinaryUrl = await uploadImageToCloudinary(compressed, 'cloudmood_places');
        setCurrentPlace((prev: any) => ({ ...prev, image: cloudinaryUrl }));
        showToast('Đã tải ảnh lên Cloudinary thành công! Link đã tự động dán vào ô.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải ảnh từ máy.', 'error');
    } finally {
      setUploadingThumbnail(false);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setReviewError(null);
    try {
      showToast('Đang xử lý và tải avatar lên Cloudinary...', 'success');
      const compressed = await compressImageFile(file, 600, 0.85);
      if (compressed) {
        const cloudinaryUrl = await uploadImageToCloudinary(compressed, 'cloudmood_avatars');
        setNewReview((prev) => ({ ...prev, authorAvatar: cloudinaryUrl }));
        showToast('Đã tải avatar lên Cloudinary thành công!', 'success');
      }
    } catch (err: any) {
      setReviewError(err.message || 'Lỗi khi tải avatar từ máy.');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleDetailPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDetailPhoto(true);
    setPhotoError(null);
    try {
      showToast('Đang xử lý và tải ảnh lên Cloudinary...', 'success');
      const compressed = await compressImageFile(file, 1200, 0.85);
      if (compressed) {
        const cloudinaryUrl = await uploadImageToCloudinary(compressed, 'cloudmood_photos');
        setNewPhoto((prev) => ({ ...prev, urlOriginal: cloudinaryUrl }));
        showToast('Đã tải ảnh lên Cloudinary! Bấm "Thêm ảnh" để lưu.', 'success');
      }
    } catch (err: any) {
      setPhotoError(err.message || 'Lỗi khi đọc file ảnh từ máy.');
    } finally {
      setUploadingDetailPhoto(false);
      if (detailPhotoInputRef.current) detailPhotoInputRef.current.value = '';
    }
  };

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both categories and places
      const [categoriesData, placesData] = await Promise.all([
        fetch('/api/admin/categories').then(r => {
          if (!r.ok) throw new Error('Không thể tải danh sách danh mục.');
          return r.json();
        }),
        fetch('/api/admin/places?limit=10000').then(r => {
          if (!r.ok) throw new Error('Không thể tải danh sách địa điểm.');
          return r.json();
        }),
      ]);

      setCategories(categoriesData || []);
      setPlaces(placesData.places || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi kết nối cơ sở dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewsAndPhotos = async (placeId: number) => {
    setReviewsLoading(true);
    setPhotosLoading(true);
    try {
      const res = await fetch(`/api/admin/places/${placeId}`);
      if (!res.ok) throw new Error('Không thể tải chi tiết địa điểm.');
      const data = await res.json();

      setPlaceReviews(data.reviews || []);
      setPlacePhotos(data.photos || []);
    } catch (err: any) {
      console.error('Error fetching reviews/photos:', err.message);
    } finally {
      setReviewsLoading(false);
      setPhotosLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCurrentPlace({
      name: '',
      description: '',
      address: '',
      latitude: 10.03022,
      longitude: 105.78753,
      price: '',
      categoryId: categories[0]?.id || null,
      image: '',
      priceLevel: 'MODERATE',
      rating: 5.0,
      userRatingCount: 0,
      subCategories: [],
      subCategoriesInput: '',
      isApproved: true,
      openingHours: {
        monday: ['07:00', '23:00'],
        tuesday: ['07:00', '23:00'],
        wednesday: ['07:00', '23:00'],
        thursday: ['07:00', '23:00'],
        friday: ['07:00', '23:00'],
        saturday: ['07:00', '23:00'],
        sunday: ['07:00', '23:00']
      }
    });
    setModalType('create');
    setActiveTab('basic');
    setModalError(null);
    setPhotoError(null);
    setReviewError(null);
    setNewPhoto({ urlOriginal: '', urlThumbnail: '', caption: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (place: Place) => {
    let parsedOpeningHours: any = null;
    if (place.openingHours) {
      try {
        parsedOpeningHours = typeof place.openingHours === 'string'
          ? JSON.parse(place.openingHours)
          : place.openingHours;
      } catch (e) {
        console.error(e);
      }
    }

    // Fallback if openingHours is not set or invalid
    if (!parsedOpeningHours || typeof parsedOpeningHours !== 'object') {
      const defaultTime = [place.openTime || '07:00', place.closeTime || '23:00'];
      parsedOpeningHours = {
        monday: defaultTime,
        tuesday: defaultTime,
        wednesday: defaultTime,
        thursday: defaultTime,
        friday: defaultTime,
        saturday: defaultTime,
        sunday: defaultTime,
      };
    }

    setCurrentPlace({
      ...place,
      phone: place.phone || '',
      website: place.website || '',
      tripadvisorUrl: place.tripadvisorUrl || '',
      priceLevel: place.priceLevel || 'MODERATE',
      rating: place.rating !== undefined && place.rating !== null ? place.rating : null,
      userRatingCount: place.userRatingCount !== undefined && place.userRatingCount !== null ? place.userRatingCount : null,
      subCategories: place.subCategories || [],
      subCategoriesInput: '',
      openingHours: parsedOpeningHours,
      isApproved: place.isApproved === true || place.isApproved == null,
    });
    setModalType('edit');
    setActiveTab('basic');
    setModalError(null);
    setPhotoError(null);
    setReviewError(null);
    setNewPhoto({ urlOriginal: '', urlThumbnail: '', caption: '' });
    setIsModalOpen(true);

    fetchReviewsAndPhotos(Number(place.id));
  };

  const handleOpenReviews = (place: Place) => {
    let parsedOpeningHours: any = null;
    if (place.openingHours) {
      try {
        parsedOpeningHours = typeof place.openingHours === 'string'
          ? JSON.parse(place.openingHours)
          : place.openingHours;
      } catch (e) {
        console.error(e);
      }
    }
    if (!parsedOpeningHours || typeof parsedOpeningHours !== 'object') {
      const defaultTime = [place.openTime || '07:00', place.closeTime || '23:00'];
      parsedOpeningHours = {
        monday: defaultTime,
        tuesday: defaultTime,
        wednesday: defaultTime,
        thursday: defaultTime,
        friday: defaultTime,
        saturday: defaultTime,
        sunday: defaultTime,
      };
    }

    setCurrentPlace({
      ...place,
      phone: place.phone || '',
      website: place.website || '',
      priceLevel: place.priceLevel || 'MODERATE',
      subCategories: place.subCategories || [],
      subCategoriesInput: '',
      openingHours: parsedOpeningHours,
    });
    setModalType('edit');
    setActiveTab('reviews');
    setModalError(null);
    setPhotoError(null);
    setReviewError(null);
    setNewPhoto({ urlOriginal: '', urlThumbnail: '', caption: '' });
    setIsModalOpen(true);

    fetchReviewsAndPhotos(Number(place.id));
  };

  const handleOpenPhotos = (place: Place) => {
    let parsedOpeningHours: any = null;
    if (place.openingHours) {
      try {
        parsedOpeningHours = typeof place.openingHours === 'string'
          ? JSON.parse(place.openingHours)
          : place.openingHours;
      } catch (e) {
        console.error(e);
      }
    }
    if (!parsedOpeningHours || typeof parsedOpeningHours !== 'object') {
      const defaultTime = [place.openTime || '07:00', place.closeTime || '23:00'];
      parsedOpeningHours = {
        monday: defaultTime,
        tuesday: defaultTime,
        wednesday: defaultTime,
        thursday: defaultTime,
        friday: defaultTime,
        saturday: defaultTime,
        sunday: defaultTime,
      };
    }

    setCurrentPlace({
      ...place,
      phone: place.phone || '',
      website: place.website || '',
      priceLevel: place.priceLevel || 'MODERATE',
      subCategories: place.subCategories || [],
      subCategoriesInput: '',
      openingHours: parsedOpeningHours,
    });
    setModalType('edit');
    setActiveTab('photos');
    setModalError(null);
    setPhotoError(null);
    setReviewError(null);
    setNewPhoto({ urlOriginal: '', urlThumbnail: '', caption: '' });
    setIsModalOpen(true);

    fetchReviewsAndPhotos(Number(place.id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingThumbnail || uploadingDetailPhoto || uploadingAvatar) {
      setModalError('Vui lòng đợi hình ảnh/avatar hoàn tất tải lên Cloudinary trước khi lưu.');
      return;
    }

    if (!currentPlace.name?.trim() || !currentPlace.address?.trim() || !currentPlace.categoryId) {
      setModalError('Vui lòng nhập đầy đủ tên, địa chỉ và chọn danh mục.');
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      const monHours = currentPlace.openingHours?.monday;
      const openTimeVal = monHours && monHours[0] ? monHours[0] : '07:00';
      const closeTimeVal = monHours && monHours[1] ? monHours[1] : '23:00';

      let computedRating = currentPlace.rating !== '' && currentPlace.rating != null ? Number(currentPlace.rating) : null;
      if (computedRating !== null && !isNaN(computedRating)) {
        if (computedRating > 5 && computedRating <= 50) computedRating = Number((computedRating / 10).toFixed(1));
        else if (computedRating > 50) computedRating = 5;
        else if (computedRating < 0) computedRating = 0;
        else computedRating = Number(computedRating.toFixed(1));
      }

      const payload = {
        name: currentPlace.name.trim(),
        description: currentPlace.description?.trim() || "",
        address: currentPlace.address.trim(),
        latitude: Number(currentPlace.latitude) || 0,
        longitude: Number(currentPlace.longitude) || 0,
        categoryId: Number(currentPlace.categoryId),
        image: currentPlace.image?.trim() || "",
        phone: currentPlace.phone?.trim() || null,
        website: currentPlace.website?.trim() || null,
        tripadvisorUrl: currentPlace.tripadvisorUrl?.trim() || null,
        priceLevel: currentPlace.priceLevel || 'MODERATE',
        rating: computedRating,
        userRatingCount: currentPlace.userRatingCount !== '' && currentPlace.userRatingCount != null ? Number(currentPlace.userRatingCount) : null,
        openingHours: currentPlace.openingHours || null,
        subCategories: currentPlace.subCategories || [],
        price: "",
        isApproved: currentPlace.isApproved === true || currentPlace.isApproved == null,
      };

      if (modalType === 'create') {
        const res = await fetch('/api/admin/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Lỗi khi lưu thông tin địa điểm.');
        setPlaces([data, ...places]);
        showToast('Thêm địa điểm thành công!', 'success');
      } else {
        const res = await fetch(`/api/admin/places/${currentPlace.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Lỗi khi lưu thông tin địa điểm.');
        setPlaces(places.map((p) => (p.id === currentPlace.id ? data : p)));
        showToast('Cập nhật địa điểm thành công!', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Lỗi khi lưu thông tin địa điểm.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleApprovePlace = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/places/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi duyệt địa điểm.');
      setPlaces(prev => prev.map(p => p.id === id ? { ...p, isApproved: true } : p));
      showToast('Duyệt địa điểm thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi duyệt địa điểm.', 'error');
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    if (modalType === 'create' || !currentPlace.id) {
      setPlaceReviews((prev) => prev.filter((r) => Number(r.id) !== reviewId));
      showToast('Đã xóa đánh giá khỏi danh sách chờ!', 'success');
      return;
    }
    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa đánh giá.');

      setPlaceReviews((prev) => prev.filter((r) => Number(r.id) !== reviewId));
      fetchData();
      showToast('Xóa đánh giá thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa đánh giá.', 'error');
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    if (!newReview.authorName.trim() || !newReview.comment.trim()) {
      setReviewError('Vui lòng nhập đầy đủ tên người đánh giá và nhận xét.');
      return;
    }

    const avatarUrl = newReview.authorAvatar.trim() || null;

    if (modalType === 'create' || !currentPlace.id) {
      const mockReview = {
        id: Date.now(),
        authorName: newReview.authorName.trim(),
        authorAvatar: avatarUrl,
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        publishedDate: newReview.publishedDate ? new Date(newReview.publishedDate).toISOString() : new Date().toISOString(),
        authorLocation: newReview.authorLocation.trim() || null,
        source: 'TRIPADVISOR',
      };
      setPlaceReviews((prev) => [mockReview, ...prev]);
      setNewReview({ authorName: '', authorAvatar: '', rating: 5, comment: '', publishedDate: '', authorLocation: '' });
      setReviewError(null);
      showToast('Đã thêm đánh giá vào danh sách chờ tạo địa điểm!', 'success');
      return;
    }

    try {
      const payload = {
        placeId: Number(currentPlace.id),
        authorName: newReview.authorName.trim(),
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        publishedDate: newReview.publishedDate ? new Date(newReview.publishedDate).toISOString() : new Date().toISOString(),
        authorLocation: newReview.authorLocation.trim() || null,
        source: 'TRIPADVISOR',
        authorAvatar: avatarUrl,
      };

      const res = await fetch(`/api/admin/places/${currentPlace.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi thêm đánh giá.');

      setPlaceReviews((prev) => [data, ...prev]);
      setNewReview({ authorName: '', authorAvatar: '', rating: 5, comment: '', publishedDate: '', authorLocation: '' });
      setReviewError(null);
      fetchData();
      showToast('Thêm đánh giá thành công!', 'success');
    } catch (err: any) {
      setReviewError(err.message || 'Lỗi khi thêm đánh giá.');
      showToast(err.message || 'Lỗi khi thêm đánh giá.', 'error');
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (modalType === 'create' || !currentPlace.id) {
      setPlacePhotos((prev) => prev.filter((p) => Number(p.id) !== photoId));
      showToast('Đã xóa hình ảnh khỏi danh sách chờ!', 'success');
      return;
    }
    try {
      const res = await fetch(`/api/admin/places/photos/${photoId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Lỗi khi xóa ảnh.');

      setPlacePhotos((prev) => prev.filter((p) => Number(p.id) !== photoId));
      showToast('Xóa hình ảnh thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa ảnh.', 'error');
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhotoError(null);
    if (!newPhoto.urlOriginal.trim()) {
      setPhotoError('Vui lòng nhập đường dẫn URL ảnh chi tiết trước khi thêm.');
      return;
    }

    if (newPhoto.urlOriginal.trim().startsWith('blob:')) {
      setPhotoError('Link dạng blob:... chỉ tồn tại tạm thời trong tab Zalo. Vui lòng sử dụng nút "Chọn ảnh từ máy" hoặc dán Link URL web trực tiếp (https://...).');
      return;
    }

    if (modalType === 'create' || !currentPlace.id) {
      const mockPhoto = {
        id: Date.now(),
        urlOriginal: newPhoto.urlOriginal.trim(),
        urlThumbnail: newPhoto.urlThumbnail.trim() || newPhoto.urlOriginal.trim(),
        caption: newPhoto.caption.trim() || null,
        source: 'LOCAL',
      };
      setPlacePhotos((prev) => [mockPhoto, ...prev]);
      setNewPhoto({ urlOriginal: '', urlThumbnail: '', caption: '' });
      setPhotoError(null);
      showToast('Đã thêm ảnh vào bộ sưu tập chờ tạo địa điểm!', 'success');
      return;
    }

    try {
      const payload = {
        urlOriginal: newPhoto.urlOriginal.trim(),
        urlThumbnail: newPhoto.urlThumbnail.trim() || newPhoto.urlOriginal.trim(),
        caption: newPhoto.caption.trim() || null,
        source: 'LOCAL',
      };

      const res = await fetch(`/api/admin/places/${currentPlace.id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi thêm hình ảnh.');

      setPlacePhotos((prev) => [data, ...prev]);
      setNewPhoto({ urlOriginal: '', urlThumbnail: '', caption: '' });
      setPhotoError(null);
      showToast('Thêm hình ảnh thành công!', 'success');
    } catch (err: any) {
      setPhotoError(err.message || 'Lỗi khi thêm hình ảnh.');
      showToast(err.message || 'Lỗi khi thêm hình ảnh.', 'error');
    }
  };

  const handleImportReviewsFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        let parsedReviews: any[] = [];
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          parsedReviews = Array.isArray(json) ? json : json.reviews || [json];
        } else {
          const lines = text.split('\n').filter((l) => l.trim());
          if (lines.length <= 1) throw new Error('File CSV đánh giá rỗng.');
          const headers = parseCSVLine(lines[0]);
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const row: any = {};
            headers.forEach((h, idx) => { row[h] = values[idx]; });
            parsedReviews.push(row);
          }
        }

        const formatted = parsedReviews.map((r: any) => ({
          authorName: r.authorName || r.name || 'Người dùng TripAdvisor',
          authorAvatar: r.authorAvatar || r.avatar || null,
          authorLocation: r.authorLocation || r.location || null,
          rating: parseFloat(r.rating) || 5,
          comment: r.comment || r.content || r.text || '',
          publishedDate: r.publishedDate || r.date || new Date().toISOString(),
          source: r.source || 'TRIPADVISOR',
        })).filter((r) => r.comment || r.authorName);

        if (formatted.length === 0) {
          showToast('Không tìm thấy dữ liệu đánh giá hợp lệ trong file.', 'error');
          return;
        }

        if (modalType === 'create' || !currentPlace.id) {
          setPlaceReviews((prev) => [...formatted.map((f, idx) => ({ id: Date.now() + idx, ...f })), ...prev]);
          showToast(`Đã nạp ${formatted.length} đánh giá vào danh sách chờ tạo địa điểm!`, 'success');
        } else {
          for (const rv of formatted) {
            await fetch(`/api/admin/places/${currentPlace.id}/reviews`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...rv, placeId: Number(currentPlace.id) }),
            });
          }
          fetchReviewsAndPhotos(Number(currentPlace.id));
          showToast(`Import thành công ${formatted.length} đánh giá cho địa điểm!`, 'success');
        }
      } catch (err: any) {
        showToast(err.message || 'Lỗi khi import file đánh giá.', 'error');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleImportPhotosFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        let parsedPhotos: any[] = [];
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          parsedPhotos = Array.isArray(json) ? json : json.photos || [json];
        } else {
          const lines = text.split('\n').filter((l) => l.trim());
          if (lines.length <= 1) throw new Error('File CSV hình ảnh rỗng.');
          const headers = parseCSVLine(lines[0]);
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const row: any = {};
            headers.forEach((h, idx) => { row[h] = values[idx]; });
            parsedPhotos.push(row);
          }
        }

        const formatted = parsedPhotos.map((p: any) => {
          const url = typeof p === 'string' ? p : p.urlOriginal || p.url || p.image || '';
          const caption = typeof p === 'object' ? p.caption || '' : '';
          return { urlOriginal: url, caption, source: 'LOCAL' };
        }).filter((p) => p.urlOriginal);

        if (formatted.length === 0) {
          showToast('Không tìm thấy dữ liệu hình ảnh hợp lệ trong file.', 'error');
          return;
        }

        if (modalType === 'create' || !currentPlace.id) {
          setPlacePhotos((prev) => [...formatted.map((f, idx) => ({ id: Date.now() + idx, ...f })), ...prev]);
          showToast(`Đã nạp ${formatted.length} hình ảnh vào danh sách chờ tạo địa điểm!`, 'success');
        } else {
          for (const ph of formatted) {
            await fetch(`/api/admin/places/${currentPlace.id}/photos`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(ph),
            });
          }
          fetchReviewsAndPhotos(Number(currentPlace.id));
          showToast(`Import thành công ${formatted.length} hình ảnh cho địa điểm!`, 'success');
        }
      } catch (err: any) {
        showToast(err.message || 'Lỗi khi import file hình ảnh.', 'error');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        // Escaped double quotes inside CSV cell (represented as "")
        if (insideQuote && i + 1 < text.length && text[i + 1] === '"') {
          entry += '"';
          i++; // Skip second double quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        result.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    result.push(entry.trim());
    return result;
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      try {
        let placesToImport: any[] = [];
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          placesToImport = Array.isArray(parsed) ? parsed : [parsed];
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
          if (lines.length <= 1) throw new Error('File CSV không có dữ liệu.');

          const headers = parseCSVLine(lines[0]);
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index];
            });
            placesToImport.push(row);
          }
        } else {
          throw new Error('Định dạng file không hỗ trợ. Vui lòng chọn file .json hoặc .csv');
        }

        const validatedPlaces = placesToImport.map((p: any) => {
          let catId = Number(p.categoryId) || null;
          if (!catId && p.categoryName) {
            const matchedCat = categories.find(c => c.name && c.name.toLowerCase() === p.categoryName.toLowerCase());
            if (matchedCat) catId = Number(matchedCat.id);
          }
          if (!catId) {
            catId = categories[0] ? Number(categories[0].id) : null;
          }

          let subCats: string[] = [];
          if (Array.isArray(p.subCategories)) {
            subCats = p.subCategories;
          } else if (typeof p.subCategories === 'string') {
            subCats = p.subCategories.split(',').map((s: string) => s.trim()).filter(Boolean);
          }

          let photosToImport: any[] = [];
          if (Array.isArray(p.photos)) {
            photosToImport = p.photos;
          } else if (typeof p.photos === 'string' && p.photos.trim()) {
            try {
              const parsed = JSON.parse(p.photos);
              if (Array.isArray(parsed)) photosToImport = parsed;
              else photosToImport = [p.photos.trim()];
            } catch {
              photosToImport = p.photos.split(/[;,]/).map((url: string) => url.trim()).filter(Boolean);
            }
          }

          let reviewsToImport: any[] = [];
          if (Array.isArray(p.reviews)) {
            reviewsToImport = p.reviews;
          } else if (typeof p.reviews === 'string' && p.reviews.trim()) {
            const rawRev = p.reviews.trim();
            try {
              const parsed = JSON.parse(rawRev);
              if (Array.isArray(parsed)) reviewsToImport = parsed;
              else if (typeof parsed === 'object') reviewsToImport = [parsed];
            } catch {
              try {
                const fixedJsonStr = rawRev.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
                const parsed = JSON.parse(fixedJsonStr);
                if (Array.isArray(parsed)) reviewsToImport = parsed;
                else if (typeof parsed === 'object') reviewsToImport = [parsed];
              } catch {
                if (rawRev && !rawRev.startsWith('[')) {
                  reviewsToImport = [{ comment: rawRev, rating: 5 }];
                }
              }
            }
          }

          const normalizePriceLevel = (val: any): string => {
            if (!val) return 'MODERATE';
            const str = String(val).trim().toUpperCase();
            if (['FREE', '$', '$$', 'MODERATE', '$$$', '$$ - $$$$', '$$$$'].includes(str)) {
              return str;
            }
            if (str === 'INEXPENSIVE' || str === 'CHEAP' || str === '1') return '$';
            if (str === '2') return '$$';
            if (str === '3') return '$$$';
            if (str === '4') return '$$$$';
            if (str === '$$ - $$$' || str === '$$ - $$$$') return '$$ - $$$$';
            if (str.includes('FREE') || str.includes('MIỄN PHÍ')) return 'FREE';
            return 'MODERATE';
          };

          let opHours: any = null;
          if (p.openingHours) {
            if (typeof p.openingHours === 'object') {
              opHours = p.openingHours;
            } else {
              try {
                opHours = JSON.parse(p.openingHours);
              } catch {
                opHours = {
                  monday: ["07:00", "23:00"],
                  tuesday: ["07:00", "23:00"],
                  wednesday: ["07:00", "23:00"],
                  thursday: ["07:00", "23:00"],
                  friday: ["07:00", "23:00"],
                  saturday: ["07:00", "23:00"],
                  sunday: ["07:00", "23:00"]
                };
              }
            }
          } else {
            opHours = {
              monday: [p.openTime || "07:00", p.closeTime || "23:00"],
              tuesday: [p.openTime || "07:00", p.closeTime || "23:00"],
              wednesday: [p.openTime || "07:00", p.closeTime || "23:00"],
              thursday: [p.openTime || "07:00", p.closeTime || "23:00"],
              friday: [p.openTime || "07:00", p.closeTime || "23:00"],
              saturday: [p.openTime || "07:00", p.closeTime || "23:00"],
              sunday: [p.openTime || "07:00", p.closeTime || "23:00"]
            };
          }

          const firstPhotoUrl = photosToImport.length > 0 ? (typeof photosToImport[0] === 'string' ? photosToImport[0] : photosToImport[0]?.urlOriginal || '') : '';

          return {
            name: p.name?.toString() || 'Chưa đặt tên',
            description: p.description?.toString() || (p.name ? `Địa điểm ${p.name} tuyệt vời tại Cần Thơ` : ''),
            latitude: parseFloat(p.latitude) || 10.03022,
            longitude: parseFloat(p.longitude) || 105.78753,
            address: p.address?.toString() || 'Chưa có địa chỉ',
            categoryId: catId,
            image: p.image?.toString() || firstPhotoUrl,
            phone: p.phone?.toString() || null,
            website: p.website?.toString() || null,
            tripadvisorUrl: p.tripadvisorUrl?.toString() || null,
            priceLevel: normalizePriceLevel(p.priceLevel),
            rating: p.rating !== undefined && p.rating !== null ? parseFloat(p.rating) : null,
            userRatingCount: p.userRatingCount !== undefined && p.userRatingCount !== null ? parseInt(p.userRatingCount) : null,
            openingHours: opHours,
            subCategories: subCats,
            photos: photosToImport,
            reviews: reviewsToImport,
            price: ""
          };
        });

        const res = await fetch('/api/admin/places/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validatedPlaces),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Lỗi khi import file.');

        fetchData();
        showToast(`Import thành công ${data.importedCount} địa điểm!`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Lỗi khi import file.', 'error');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleOpenDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/places/${deletingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi xóa địa điểm.');
      setPlaces(places.filter((p) => p.id !== deletingId));
      setIsDeleteOpen(false);
      showToast('Xóa địa điểm thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa địa điểm.', 'error');
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

  const handleToggleApprove = async (id: number, currentApprovedState: boolean | null | undefined) => {
    const newStatus = currentApprovedState === true ? false : true;
    try {
      const res = await fetch(`/api/admin/places/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: newStatus }),
      });
      if (!res.ok) throw new Error('Không thể cập nhật trạng thái địa điểm.');
      setPlaces((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isApproved: newStatus } : p))
      );
      showToast(
        newStatus
          ? 'Đã duyệt & hiển thị địa điểm lên App Mobile!'
          : 'Đã ẩn địa điểm khỏi App Mobile (Hình ảnh & đánh giá vẫn bảo toàn)!',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật trạng thái.', 'error');
    }
  };

  const handleCoordinateChange = (lat: number, lng: number) => {
    setCurrentPlace((prev: any) => ({
      ...prev,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
    }));
  };

  const allSubCategories = Array.from(
    new Set(
      places.flatMap((p) => {
        if (!p.subCategories) return [];
        if (Array.isArray(p.subCategories)) return p.subCategories;
        try {
          if (typeof p.subCategories === 'string') {
            const parsed = JSON.parse(p.subCategories);
            if (Array.isArray(parsed)) return parsed;
          }
        } catch { }
        return [];
      })
    )
  ).filter(Boolean) as string[];

  const filteredPlaces = places.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === 'all' || p.categoryId === Number(selectedCategoryFilter);

    const subCats = Array.isArray(p.subCategories)
      ? p.subCategories
      : p.subCategories && typeof p.subCategories === 'string'
        ? JSON.parse(p.subCategories)
        : [];
    const matchesSubCategory =
      selectedSubCategoryFilter === 'all' ||
      (Array.isArray(subCats) && subCats.includes(selectedSubCategoryFilter));

    const matchesApproval =
      approvalFilter === 'all' ||
      (approvalFilter === 'approved' && p.isApproved === true) ||
      (approvalFilter === 'pending' && p.isApproved === null) ||
      (approvalFilter === 'hidden' && p.isApproved === false);

    return matchesSearch && matchesCategory && matchesSubCategory && matchesApproval;
  });

  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
  const paginatedPlaces = filteredPlaces.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPageNumbers = () => {
    const maxPageButtons = 5;
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = startPage + maxPageButtons - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-24 right-6 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-[9999] animate-in fade-in slide-in-from-top-4 duration-200 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
          {toast.type === 'success' ? <Check size={20} className="shrink-0" /> : <X size={20} className="shrink-0" />}
          <span className="text-base font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý địa điểm</h1>
          <p className="text-gray-500 text-sm mt-1">Danh sách địa điểm vui chơi, nghỉ dưỡng, ăn uống</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowImportHelp(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-sm text-sm"
            title="Xem hướng dẫn định dạng file import"
          >
            <Info size={16} className="text-blue-500" />
            <span>Định dạng mẫu</span>
          </button>
          <label className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm text-sm">
            <Upload size={16} />
            <span>Import File</span>
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm text-sm"
          >
            <Plus size={18} />
            Thêm địa điểm
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-center gap-4 justify-between bg-gray-50/50">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên hoặc địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white text-gray-900 text-sm rounded-lg pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-blue-500 transition-colors w-full"
              />
            </div>
            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                const val = e.target.value;
                startFilterTransition(() => setSelectedCategoryFilter(val));
              }}
              className="bg-white text-gray-700 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-500 w-full sm:w-64 cursor-pointer font-medium"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {/* Subcategory Filter */}
            <select
              value={selectedSubCategoryFilter}
              onChange={(e) => {
                const val = e.target.value;
                startFilterTransition(() => setSelectedSubCategoryFilter(val));
              }}
              className="bg-white text-gray-700 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-500 w-full sm:w-64 cursor-pointer font-medium"
            >
              <option value="all">Tất cả danh mục phụ</option>
              {allSubCategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
            {/* Approval / Status Filter */}
            <select
              value={approvalFilter}
              onChange={(e) => {
                const val = e.target.value;
                startFilterTransition(() => setApprovalFilter(val));
              }}
              className="bg-white text-gray-700 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-500 w-full sm:w-48 cursor-pointer font-medium shadow-2xs"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="approved">Đã duyệt</option>
              <option value="pending">Chờ duyệt</option>
              <option value="hidden">Đã ẩn</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            {isPending ? 'Đang lọc...' : `Hiển thị: ${filteredPlaces.length} địa điểm`}
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
            <span>Đang tải danh sách địa điểm...</span>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-500">
            <p className="font-semibold">{error}</p>
            <button onClick={fetchData} className="mt-4 text-sm text-blue-600 hover:underline">
              Thử lại
            </button>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="py-20 text-center text-gray-400">Không tìm thấy địa điểm nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10 shadow-2xs">
                  <th className="px-2.5 py-2.5">Địa điểm</th>
                  <th className="px-2 py-2.5">Danh mục</th>
                  <th className="px-2 py-2.5">Đánh giá</th>
                  <th className="px-2.5 py-2.5">Địa chỉ & Tọa độ</th>
                  <th className="px-2 py-2.5">Mức giá & Giờ mở</th>
                  <th className="px-2 py-2.5">Trạng thái</th>
                  <th className="px-2.5 py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {paginatedPlaces.map((place) => {
                  const cat = categories.find((c) => c.id === place.categoryId);
                  const catName = cat?.name || 'Chưa phân loại';
                  const IconComponent = cat ? getCategoryIcon(cat.iconCode) : null;
                  return (
                    <tr key={place.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-2.5 py-2.5 max-w-[170px]">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 shrink-0 border border-gray-200 dark:border-slate-700">
                            {place.image ? (
                              <img src={place.image} alt={place.name || ''} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <MapPin size={15} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-xs truncate" title={place.name || ''}>{place.name}</h3>
                            <p className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-1 mt-0.5">{place.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${getCategoryBadgeStyle(place.categoryId || 0)}`}>
                          {IconComponent && <IconComponent size={11} className="shrink-0" />}
                          {catName}
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex flex-col gap-0.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                            <span className="font-bold text-gray-900 dark:text-slate-100 text-xs">
                              {place.rating != null && place.rating > 0 ? Number(place.rating).toFixed(1) : 'Chưa có'}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                            {(place.userRatingCount ?? place._count?.reviews ?? 0).toLocaleString('vi-VN')} đánh giá
                          </span>
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 max-w-[170px]">
                        <p className="text-gray-900 dark:text-slate-200 text-xs truncate" title={cleanAddress(place.address)}>{cleanAddress(place.address)}</p>
                        <p className="text-gray-400 text-[10px] mt-0.5 font-mono truncate" title={`Lat: ${place.latitude}, Lng: ${place.longitude}`}>
                          Lat: {place.latitude} &bull; Lng: {place.longitude}
                        </p>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="mb-0.5">
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md border whitespace-nowrap ${place.priceLevel === 'FREE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            (place.priceLevel === '$' || place.priceLevel === 'INEXPENSIVE' || place.priceLevel === 'CHEAP') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              (place.priceLevel === '$$' || place.priceLevel === 'MODERATE') ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                place.priceLevel === '$$$' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  place.priceLevel === '$$ - $$$$' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                    (place.priceLevel === '$$$$' || place.priceLevel === 'VERY_EXPENSIVE' || place.priceLevel === 'EXPENSIVE') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                      'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                            {place.priceLevel === 'FREE' ? 'Miễn phí (FREE)' :
                              (place.priceLevel === '$' || place.priceLevel === 'INEXPENSIVE' || place.priceLevel === 'CHEAP') ? 'Giá rẻ ($)' :
                                place.priceLevel === '$$' ? 'Vừa phải ($$)' :
                                  place.priceLevel === 'MODERATE' ? 'Trung bình (MODERATE)' :
                                    place.priceLevel === '$$$' ? 'Cao cấp ($$$)' :
                                      place.priceLevel === '$$ - $$$$' ? 'Tầm trung - cao cấp ($$ - $$$$)' :
                                        (place.priceLevel === '$$$$' || place.priceLevel === 'VERY_EXPENSIVE' || place.priceLevel === 'EXPENSIVE') ? 'Rất cao cấp ($$$$)' : (place.priceLevel || 'MODERATE')}
                          </span>
                        </div>
                        <p className="text-gray-500 dark:text-slate-400 text-[10px] mt-0.5 whitespace-nowrap">
                          ⏱️ {displayOpeningHours(place)}
                        </p>
                      </td>
                      <td className="px-2 py-2.5">
                        {place.isApproved === true ? (
                          <button
                            type="button"
                            onClick={() => handleToggleApprove(Number(place.id), place.isApproved)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                            title="Click để Ẩn địa điểm khỏi App Mobile"
                          >
                            <Eye size={11} />
                            Đã duyệt
                          </button>
                        ) : place.isApproved === false ? (
                          <button
                            type="button"
                            onClick={() => handleToggleApprove(Number(place.id), place.isApproved)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                            title="Click để Mở ẩn & Duyệt địa điểm"
                          >
                            <EyeOff size={11} />
                            Đã ẩn
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleApprove(Number(place.id), place.isApproved)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                            title="Click để Duyệt địa điểm này"
                          >
                            <Check size={11} />
                            Chờ duyệt
                          </button>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 text-right whitespace-nowrap space-x-0.5 shrink-0">
                        {place.isApproved === null && (
                          <button
                            onClick={() => handleToggleApprove(Number(place.id), place.isApproved)}
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                            title="Duyệt địa điểm"
                          >
                            <Check size={15} />
                          </button>
                        )}
                        {place.isApproved === true && (
                          <button
                            onClick={() => handleToggleApprove(Number(place.id), place.isApproved)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                            title="Ẩn địa điểm khỏi App Mobile"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        {place.isApproved === false && (
                          <button
                            onClick={() => handleToggleApprove(Number(place.id), place.isApproved)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                            title="Mở ẩn & Duyệt địa điểm"
                          >
                            <EyeOff size={15} />
                          </button>
                        )}
                        {Boolean(place.name || (place.latitude && place.longitude)) && (
                          <a
                            href={
                              place.name
                                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  `${place.name}${place.address ? ', ' + cleanAddress(place.address) : ''}`
                                )}`
                                : `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                            title={`Xem "${place.name}" trên Google Maps`}
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <button
                          onClick={() => handleOpenEdit(place)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Sửa thông tin"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenReviews(place)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer inline-flex items-center relative"
                          title="Quản lý Đánh giá"
                        >
                          <MessageSquare size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenPhotos(place)}
                          className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Quản lý Hình ảnh"
                        >
                          <ImageIcon size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(place.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
            <div className="text-xs font-semibold text-gray-500">
              Hiển thị từ {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, filteredPlaces.length)} trong tổng số {filteredPlaces.length} địa điểm
            </div>
            <div className="flex items-center gap-1.5 self-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Trang trước
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import File Formatting Guide Modal */}
      {showImportHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-205">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-5xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-205">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Info size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Hướng dẫn định dạng file Import Địa điểm</h3>
              </div>
              <button
                onClick={() => setShowImportHelp(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-600">
              <div>
                <p className="font-bold text-gray-900 mb-2">1. Danh sách các trường thông tin hỗ trợ cho Địa điểm:</p>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50 font-semibold text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left">Cột / Trường (CSV Header hoặc JSON Key)</th>
                        <th className="px-3 py-2 text-left">Kiểu</th>
                        <th className="px-3 py-2 text-left">Mô tả &amp; Ví dụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white text-gray-600 font-medium">
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-bold">name</td>
                        <td className="px-3 py-2">Chuỗi (Bắt buộc)</td>
                        <td className="px-3 py-2">Tên địa điểm. VD: <code className="bg-gray-100 px-1 py-0.5 rounded">Yaki House Buffet</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-bold">address</td>
                        <td className="px-3 py-2">Chuỗi (Bắt buộc)</td>
                        <td className="px-3 py-2">Địa chỉ chi tiết. VD: <code className="bg-gray-100 px-1 py-0.5 rounded">123 Đường 3/2, Ninh Kiều, Cần Thơ</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-bold">categoryName</td>
                        <td className="px-3 py-2">Chuỗi</td>
                        <td className="px-3 py-2">Tên danh mục chính (khớp trong CSDL). VD: <code className="bg-gray-100 px-1 py-0.5 rounded">Quán ăn</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-bold">latitude / longitude</td>
                        <td className="px-3 py-2">Số thập phân</td>
                        <td className="px-3 py-2">Tọa độ vị trí. VD: <code className="bg-gray-100 px-1 py-0.5 rounded">10.035425</code> / <code className="bg-gray-100 px-1 py-0.5 rounded">105.779507</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-bold">priceLevel</td>
                        <td className="px-3 py-2">Chuỗi</td>
                        <td className="px-3 py-2">Mức giá: <code className="bg-gray-100 px-1 py-0.5 rounded">FREE</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">$</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">MODERATE</code> (hoặc <code className="bg-gray-100 px-1 py-0.5 rounded">$$ - $$$$</code>), <code className="bg-gray-100 px-1 py-0.5 rounded">$$$$</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-bold">phone / website / tripadvisorUrl</td>
                        <td className="px-3 py-2">Chuỗi</td>
                        <td className="px-3 py-2">Số điện thoại, website hoặc link TripAdvisor. VD: <code className="bg-gray-100 px-1 py-0.5 rounded">02923890123</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-bold">rating / userRatingCount</td>
                        <td className="px-3 py-2">Số</td>
                        <td className="px-3 py-2">Điểm đánh giá trung bình &amp; Số lượt đánh giá. VD: <code className="bg-gray-100 px-1 py-0.5 rounded">4.5</code> / <code className="bg-gray-100 px-1 py-0.5 rounded">120</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-bold">subCategories</td>
                        <td className="px-3 py-2">Chuỗi / Mảng</td>
                        <td className="px-3 py-2">Danh mục phụ, phân cách bằng dấu phẩy. VD: <code className="bg-gray-100 px-1 py-0.5 rounded">Buffet, Lẩu nướng</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-bold">photos</td>
                        <td className="px-3 py-2">Mảng/Chuỗi</td>
                        <td className="px-3 py-2">Danh sách URL hình ảnh phụ. VD: <code className="bg-gray-100 px-1 py-0.5 rounded">["https://.../photo1.jpg"]</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-bold">reviews</td>
                        <td className="px-3 py-2">Mảng đối tượng</td>
                        <td className="px-3 py-2">Danh sách nhận xét của khách hàng. VD: <code className="bg-gray-100 px-1 py-0.5 rounded">[&#123;"authorName": "A", "rating": 5, "comment": "Tốt"&#125;]</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-bold">openingHours (hoặc openTime / closeTime)</td>
                        <td className="px-3 py-2">JSONB / Chuỗi (HH:MM)</td>
                        <td className="px-3 py-2">Giờ hoạt động. CSDL lưu dạng cột <code className="bg-gray-100 px-1 py-0.5 rounded">openingHours</code> (jsonb). Khi import có thể dùng đối tượng <code className="bg-gray-100 px-1 py-0.5 rounded">openingHours</code> hoặc 2 cột tiện ích <code className="bg-gray-100 px-1 py-0.5 rounded">openTime</code> &amp; <code className="bg-gray-100 px-1 py-0.5 rounded">closeTime</code> (VD: <code className="bg-gray-100 px-1 py-0.5 rounded">08:00</code> &amp; <code className="bg-gray-100 px-1 py-0.5 rounded">22:00</code>)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-2">2. Ví dụ file CSV chuẩn (.csv):</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-gray-800">
                  {`name,address,categoryName,latitude,longitude,phone,website,priceLevel,rating,userRatingCount,subCategories,photos,openTime,closeTime
Yaki House Buffet,123 Đường 3/2 Cần Thơ,Quán ăn,10.035425,105.779507,02923890123,https://yakihouse.vn,$$ - $$$$,4.5,120,"Buffet, Lẩu nướng","https://example.com/photo1.jpg, https://example.com/photo2.jpg",08:00,22:00
Lúa Nếp Restaurant,Khu bãi bồi Ninh Kiều Cần Thơ,Quán ăn,10.029810,105.789120,02923888999,https://luanep.vn,MODERATE,4.8,210,"Đặc sản miền Tây, Sân vườn","https://example.com/photo3.jpg",07:00,23:00`}
                </pre>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-2">3. Ví dụ file JSON tổng hợp chứa cả Ảnh &amp; Đánh giá (.json):</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-gray-800">
                  {`[
  {
    "name": "Yaki House Buffet",
    "address": "123 Đường 3/2, Ninh Kiều, Cần Thơ",
    "categoryName": "Quán ăn",
    "latitude": 10.035425,
    "longitude": 105.779507,
    "priceLevel": "$$ - $$$$",
    "rating": 4.5,
    "userRatingCount": 120,
    "subCategories": ["Buffet", "Lẩu nướng"],
    "photos": [
      "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    ],
    "reviews": [
      {
        "authorName": "Nguyễn Văn A",
        "rating": 5,
        "comment": "Món ăn tuyệt vời, phục vụ tận tình!",
        "publishedDate": "2026-01-20"
      }
    ],
    "openTime": "08:00",
    "closeTime": "22:00"
  }
]`}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowImportHelp(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Import Reviews Formatting Guide Modal */}
      {showReviewsImportHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-4xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-amber-50/50">
              <div className="flex items-center gap-2">
                <Info size={20} className="text-amber-600" />
                <h3 className="text-lg font-bold text-gray-900">Hướng dẫn định dạng file Import Đánh giá</h3>
              </div>
              <button
                onClick={() => setShowReviewsImportHelp(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-900 mb-1.5">1. Các trường hỗ trợ cho Đánh giá (JSON & CSV):</p>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50 font-semibold text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left">Trường (JSON / CSV Header)</th>
                        <th className="px-3 py-2 text-left">Kiểu</th>
                        <th className="px-3 py-2 text-left">Mô tả &amp; Ví dụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white text-gray-600 font-medium">
                      <tr>
                        <td className="px-3 py-2 font-mono text-amber-700 font-bold">authorName</td>
                        <td className="px-3 py-2">Chuỗi (Bắt buộc)</td>
                        <td className="px-3 py-2">Tên người đánh giá. VD: <code className="bg-gray-100 px-1 py-0.5 rounded">Nguyễn Văn A</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-amber-700 font-bold">rating</td>
                        <td className="px-3 py-2">Số (1 - 5)</td>
                        <td className="px-3 py-2">Số sao đánh giá từ 1 đến 5. VD: <code className="bg-gray-100 px-1 py-0.5 rounded">5</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-amber-700 font-bold">comment</td>
                        <td className="px-3 py-2">Chuỗi (Bắt buộc)</td>
                        <td className="px-3 py-2">Nội dung nhận xét. VD: <code className="bg-gray-100 px-1 py-0.5 rounded">Món ăn ngon, phục vụ tận tình</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-amber-700 font-bold">authorAvatar</td>
                        <td className="px-3 py-2">Chuỗi (URL)</td>
                        <td className="px-3 py-2">Link ảnh avatar (Tùy chọn). VD: <code className="bg-gray-100 px-1 py-0.5 rounded">https://.../avatar.jpg</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-amber-700 font-bold">authorLocation</td>
                        <td className="px-3 py-2">Chuỗi</td>
                        <td className="px-3 py-2">Quê quán/Vị trí (Tùy chọn). VD: <code className="bg-gray-100 px-1 py-0.5 rounded">Hà Nội, Việt Nam</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-amber-700 font-bold">source</td>
                        <td className="px-3 py-2">Chuỗi</td>
                        <td className="px-3 py-2">Nguồn: <code className="bg-gray-100 px-1 py-0.5 rounded">TRIPADVISOR</code> hoặc <code className="bg-gray-100 px-1 py-0.5 rounded">LOCAL</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-2">2. Ví dụ file CSV chuẩn (.csv):</p>
                <pre className="bg-gray-900 text-amber-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-gray-800">
                  {`authorName,rating,comment,authorAvatar,authorLocation,source
Nguyễn Văn A,5,"Món ăn tuyệt vời!",https://example.com/avatar.jpg,Hà Nội,TRIPADVISOR
Trần Thị B,4,"Dịch vụ chu đáo",,TP.HCM,LOCAL`}
                </pre>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-2">3. Ví dụ file JSON chuẩn (.json):</p>
                <pre className="bg-gray-900 text-amber-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-gray-800">
                  {`[
  {
    "authorName": "Nguyễn Văn A",
    "authorAvatar": "https://example.com/avatar.jpg",
    "authorLocation": "Hà Nội, Việt Nam",
    "rating": 5,
    "comment": "Món ăn tuyệt vời, không gian cực kỳ đẹp!",
    "publishedDate": "2026-01-20",
    "source": "TRIPADVISOR"
  }
]`}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowReviewsImportHelp(false)}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Photos Formatting Guide Modal */}
      {showPhotosImportHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-4xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-purple-50/50">
              <div className="flex items-center gap-2">
                <Info size={20} className="text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Hướng dẫn định dạng file Import Hình ảnh</h3>
              </div>
              <button
                onClick={() => setShowPhotosImportHelp(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-900 mb-1.5">1. Các trường hỗ trợ cho Hình ảnh (JSON & CSV):</p>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50 font-semibold text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left">Trường (JSON / CSV Header)</th>
                        <th className="px-3 py-2 text-left">Kiểu</th>
                        <th className="px-3 py-2 text-left">Mô tả &amp; Ví dụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white text-gray-600 font-medium">
                      <tr>
                        <td className="px-3 py-2 font-mono text-purple-700 font-bold">urlOriginal</td>
                        <td className="px-3 py-2">Chuỗi (URL Bắt buộc)</td>
                        <td className="px-3 py-2">Đường dẫn ảnh. VD: <code className="bg-gray-100 px-1 py-0.5 rounded">https://res.cloudinary.com/.../photo.jpg</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-purple-700 font-bold">caption</td>
                        <td className="px-3 py-2">Chuỗi (Tùy chọn)</td>
                        <td className="px-3 py-2">Chú thích hình ảnh. VD: <code className="bg-gray-100 px-1 py-0.5 rounded">Không gian tầng 1</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-2">2. Ví dụ file CSV chuẩn (.csv):</p>
                <pre className="bg-gray-900 text-purple-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-gray-800">
                  {`urlOriginal,caption
https://res.cloudinary.com/demo/image/upload/photo1.jpg,Không gian tầng 1
https://res.cloudinary.com/demo/image/upload/photo2.jpg,Món ăn đặc sản`}
                </pre>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-2">3. Ví dụ file JSON chuẩn (.json):</p>
                <pre className="bg-gray-900 text-purple-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-gray-800">
                  {`[
  {
    "urlOriginal": "https://res.cloudinary.com/demo/image/upload/photo1.jpg",
    "caption": "Không gian tầng 1"
  },
  "https://res.cloudinary.com/demo/image/upload/photo2.jpg"
]`}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPhotosImportHelp(false)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-3 backdrop-blur-xs overflow-hidden">
          <div className="bg-white rounded-xl w-[96vw] max-w-[1480px] max-h-[96vh] shadow-2xl overflow-hidden border border-gray-200 flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-2.5 border-b border-gray-200 bg-gray-50/90 shrink-0">
              <h3 className="font-extrabold text-gray-900 text-base sm:text-lg tracking-tight">
                {modalType === 'create'
                  ? 'Thêm địa điểm mới'
                  : `Chỉnh sửa địa điểm: ${currentPlace.name || ''}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-md transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* 4-Tab Switcher Bar */}
            <div className="flex border-b border-gray-200 bg-gray-50/80 px-4 pt-1.5 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-t-lg transition-all cursor-pointer border-t border-x shrink-0 ${activeTab === 'basic'
                  ? 'bg-white border-gray-250 text-blue-600 shadow-2xs -mb-px'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
              >
                <Info size={16} />
                1. Thông tin cơ bản &amp; Vị trí
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('extra')}
                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-t-lg transition-all cursor-pointer border-t border-x shrink-0 ${activeTab === 'extra'
                  ? 'bg-white border-gray-250 text-blue-600 shadow-2xs -mb-px'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
              >
                <Clock size={16} />
                2. Danh mục phụ &amp; Giờ hoạt động
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-t-lg transition-all cursor-pointer border-t border-x shrink-0 ${activeTab === 'reviews'
                  ? 'bg-white border-gray-250 text-amber-600 shadow-2xs -mb-px'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
              >
                <MessageSquare size={16} />
                3. Quản lý Đánh giá {placeReviews.length > 0 && `(${placeReviews.length})`}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-t-lg transition-all cursor-pointer border-t border-x shrink-0 ${activeTab === 'photos'
                  ? 'bg-white border-gray-250 text-purple-600 shadow-2xs -mb-px'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
              >
                <ImageIcon size={16} />
                4. Bộ sưu tập Hình ảnh {placePhotos.length > 0 && `(${placePhotos.length})`}
              </button>
            </div>

            {/* TAB 1 & TAB 2 (Wrapped in Form) */}
            {(activeTab === 'basic' || activeTab === 'extra') && (
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 lg:p-5 flex flex-col justify-between space-y-3">
                {modalError && (
                  <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md p-2.5">{modalError}</div>
                )}

                <div className="flex-1">
                  {/* SUB-TAB 1: Basic Info & Map */}
                  {activeTab === 'basic' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                      {/* Left Column: Essential Fields */}
                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 block">
                            Tên địa điểm <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Nhập tên địa điểm..."
                            value={currentPlace.name || ''}
                            onChange={(e) => setCurrentPlace({ ...currentPlace, name: e.target.value })}
                            disabled={modalLoading}
                            className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 shadow-2xs font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 block">
                            Danh mục <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={currentPlace.categoryId || (categories[0]?.id ? Number(categories[0].id) : '')}
                            onChange={(e) => setCurrentPlace({ ...currentPlace, categoryId: Number(e.target.value) })}
                            disabled={modalLoading}
                            className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 cursor-pointer shadow-2xs font-medium"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 block">Mô tả ngắn</label>
                          <textarea
                            placeholder="Nhập mô tả địa điểm..."
                            value={currentPlace.description || ''}
                            onChange={(e) => setCurrentPlace({ ...currentPlace, description: e.target.value })}
                            disabled={modalLoading}
                            rows={2}
                            className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 shadow-2xs font-medium resize-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 block">
                            Địa chỉ <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Nhập số nhà, tên đường, quận huyện..."
                            value={currentPlace.address || ''}
                            onChange={(e) => setCurrentPlace({ ...currentPlace, address: e.target.value })}
                            disabled={modalLoading}
                            className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 shadow-2xs font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 block">Mức giá</label>
                            <select
                              value={currentPlace.priceLevel || 'MODERATE'}
                              onChange={(e) => setCurrentPlace({ ...currentPlace, priceLevel: e.target.value })}
                              disabled={modalLoading}
                              className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 cursor-pointer shadow-2xs font-medium"
                            >
                              <option value="FREE">Miễn phí (FREE)</option>
                              <option value="$">Giá rẻ ($)</option>
                              <option value="$$">Vừa phải ($$)</option>
                              <option value="MODERATE">Trung bình (MODERATE)</option>
                              <option value="$$$">Cao cấp ($$$)</option>
                              <option value="$$ - $$$$">Tầm trung - cao cấp ($$ - $$$$)</option>
                              <option value="$$$$">Rất cao cấp ($$$$)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 block">Số điện thoại</label>
                            <input
                              type="text"
                              placeholder="VD: 0292 3890..."
                              value={currentPlace.phone || ''}
                              onChange={(e) => setCurrentPlace({ ...currentPlace, phone: e.target.value })}
                              disabled={modalLoading}
                              className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 shadow-2xs font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 block">Đánh giá trung bình (Rating 0-5)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              placeholder="VD: 4.5 (nhập 42 -> 4.2)"
                              value={currentPlace.rating !== undefined && currentPlace.rating !== null ? currentPlace.rating : ''}
                              onChange={(e) => {
                                const valStr = e.target.value;
                                if (valStr === '') {
                                  setCurrentPlace({ ...currentPlace, rating: null });
                                  return;
                                }
                                let num = parseFloat(valStr);
                                if (!isNaN(num)) {
                                  if (num > 5 && num <= 50) {
                                    num = Number((num / 10).toFixed(1));
                                  } else if (num > 50) {
                                    num = 5;
                                  } else if (num < 0) {
                                    num = 0;
                                  }
                                  setCurrentPlace({ ...currentPlace, rating: num });
                                }
                              }}
                              onBlur={() => {
                                if (currentPlace.rating !== null && currentPlace.rating !== undefined) {
                                  let r = Number(currentPlace.rating);
                                  if (r > 5 && r <= 50) r = Number((r / 10).toFixed(1));
                                  else if (r > 5) r = 5;
                                  else if (r < 0) r = 0;
                                  setCurrentPlace({ ...currentPlace, rating: Number(r.toFixed(1)) });
                                }
                              }}
                              disabled={modalLoading}
                              className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 shadow-2xs font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 block">Tổng số lượt đánh giá</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="VD: 120"
                              value={currentPlace.userRatingCount !== undefined && currentPlace.userRatingCount !== null ? currentPlace.userRatingCount : ''}
                              onChange={(e) => setCurrentPlace({ ...currentPlace, userRatingCount: e.target.value === '' ? null : parseInt(e.target.value) })}
                              disabled={modalLoading}
                              className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 shadow-2xs font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 block">Trang web (Website)</label>
                            <input
                              type="text"
                              placeholder="VD: https://cloudmood.com..."
                              value={currentPlace.website || ''}
                              onChange={(e) => setCurrentPlace({ ...currentPlace, website: e.target.value })}
                              disabled={modalLoading}
                              className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 shadow-2xs font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 block">Link TripAdvisor (tripadvisorUrl)</label>
                            <input
                              type="text"
                              placeholder="VD: https://www.tripadvisor.com/..."
                              value={currentPlace.tripadvisorUrl || ''}
                              onChange={(e) => setCurrentPlace({ ...currentPlace, tripadvisorUrl: e.target.value })}
                              disabled={modalLoading}
                              className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 shadow-2xs font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Coordinates & MapPicker */}
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 block">Vĩ độ (Latitude)</label>
                            <input
                              type="number"
                              step="any"
                              value={currentPlace.latitude || ''}
                              onChange={(e) => setCurrentPlace({ ...currentPlace, latitude: parseFloat(e.target.value) || 0 })}
                              disabled={modalLoading}
                              className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 shadow-2xs font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 block">Kinh độ (Longitude)</label>
                            <input
                              type="number"
                              step="any"
                              value={currentPlace.longitude || ''}
                              onChange={(e) => setCurrentPlace({ ...currentPlace, longitude: parseFloat(e.target.value) || 0 })}
                              disabled={modalLoading}
                              className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 shadow-2xs font-medium"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                            <span>Chọn vị trí trên bản đồ</span>
                            <span className="text-[11px] font-medium text-gray-500">Click trên bản đồ để tự động lấy tọa độ</span>
                          </label>
                          <div className="w-full h-[350px] border border-gray-300 rounded-lg overflow-hidden shadow-xs relative bg-gray-50">
                            <MapPicker
                              lat={Number(currentPlace.latitude) || 10.03022}
                              lng={Number(currentPlace.longitude) || 105.78753}
                              onChange={handleCoordinateChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: Subcategories, Opening Hours & Representative Image */}
                  {activeTab === 'extra' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                      {/* Left Column: Subcategories (Spacious & Prominent) */}
                      <div className="space-y-3 bg-gray-50/70 p-4 rounded-lg border border-gray-200 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                            <label className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                              <Layers size={18} className="text-blue-600" />
                              Danh mục phụ (Subcategories)
                            </label>
                            <span className="text-[11px] text-gray-600 font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                              Đã chọn: {(currentPlace.subCategories || []).length} danh mục
                            </span>
                          </div>

                          {/* Selected Subcategories Tags */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-extrabold text-gray-700 block uppercase tracking-wider">Danh mục phụ đã gán:</span>
                            <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 bg-white rounded-md border border-gray-200 shadow-inner">
                              {(currentPlace.subCategories || []).length === 0 ? (
                                <div className="flex items-center gap-2 text-xs text-gray-400 italic py-0.5">
                                  <span>Chưa chọn danh mục phụ nào. Vui lòng chọn từ gợi ý bên dưới hoặc tự nhập thêm.</span>
                                </div>
                              ) : (
                                (currentPlace.subCategories || []).map((sub: string) => (
                                  <span key={sub} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-200 shadow-2xs">
                                    {sub}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = (currentPlace.subCategories || []).filter((s: string) => s !== sub);
                                        setCurrentPlace({ ...currentPlace, subCategories: updated });
                                      }}
                                      className="text-blue-400 hover:text-blue-900 hover:bg-blue-100 p-0.5 rounded transition-colors cursor-pointer text-xs font-black shrink-0"
                                      title="Xóa danh mục này"
                                    >
                                      &times;
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>
                          </div>

                          {/* System Suggestions Grid with Live Search Filter */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold text-gray-700 flex items-center gap-1.5">
                                <span>Gợi ý danh mục phụ từ hệ thống:</span>
                                {currentPlace.subCategoriesInput?.trim() && (
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                    Kết quả: "{currentPlace.subCategoriesInput.trim()}"
                                  </span>
                                )}
                              </span>
                              <span className="text-[11px] text-gray-500">(Click để thêm nhanh)</span>
                            </div>

                            {(() => {
                              const query = (currentPlace.subCategoriesInput || '').trim().toLowerCase();
                              const availableSuggestions = allSubCategories.filter(s => !(currentPlace.subCategories || []).includes(s));
                              const filteredSuggestions = query
                                ? availableSuggestions.filter(s => s.toLowerCase().includes(query))
                                : availableSuggestions;

                              if (filteredSuggestions.length === 0) {
                                return (
                                  <div className="p-3 bg-white rounded-md border border-dashed border-gray-300 text-center text-xs text-gray-500">
                                    {query ? (
                                      <span>Không tìm thấy gợi ý nào khớp với "<strong>{currentPlace.subCategoriesInput}</strong>". Bấm nút <strong className="text-blue-600">+ Thêm</strong> hoặc nhấn <strong className="text-blue-600">Enter</strong> để tạo mới danh mục phụ này!</span>
                                    ) : (
                                      <span>Đã chọn tất cả danh mục phụ gợi ý từ hệ thống.</span>
                                    )}
                                  </div>
                                );
                              }

                              return (
                                <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-2 bg-white rounded-md border border-gray-200 shadow-2xs pr-1">
                                  {filteredSuggestions.map((sub: string) => (
                                    <button
                                      key={sub}
                                      type="button"
                                      onClick={() => {
                                        const updated = [...(currentPlace.subCategories || []), sub];
                                        setCurrentPlace({ ...currentPlace, subCategories: updated, subCategoriesInput: '' });
                                      }}
                                      className="text-xs font-bold bg-gray-50 hover:bg-blue-50 text-gray-800 hover:text-blue-700 px-2.5 py-1 rounded-md border border-gray-200 hover:border-blue-300 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                                    >
                                      <Plus size={12} className="text-blue-600" />
                                      {sub}
                                    </button>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Combined Search & Custom Subcategory Input Bar */}
                        <div className="space-y-1.5 pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-gray-700 block">Tìm kiếm hoặc tự thêm danh mục phụ mới:</span>
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              <input
                                type="text"
                                placeholder="Nhập tìm kiếm hoặc gõ tên danh mục phụ mới..."
                                value={currentPlace.subCategoriesInput || ''}
                                onChange={(e) => setCurrentPlace({ ...currentPlace, subCategoriesInput: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = currentPlace.subCategoriesInput?.trim();
                                    if (!val) return;
                                    const newCats = val.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
                                    const existing = currentPlace.subCategories || [];
                                    const merged = Array.from(new Set([...existing, ...newCats]));
                                    setCurrentPlace({
                                      ...currentPlace,
                                      subCategories: merged,
                                      subCategoriesInput: ''
                                    });
                                  }
                                }}
                                disabled={modalLoading}
                                className="w-full text-xs text-gray-900 border border-gray-300 rounded-md pl-8 pr-7 py-1.5 bg-white focus:outline-none focus:border-blue-600 shadow-2xs font-medium"
                              />
                              {currentPlace.subCategoriesInput && (
                                <button
                                  type="button"
                                  onClick={() => setCurrentPlace({ ...currentPlace, subCategoriesInput: '' })}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                                  title="Xóa tìm kiếm"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const val = currentPlace.subCategoriesInput?.trim();
                                if (!val) return;
                                const newCats = val.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
                                const existing = currentPlace.subCategories || [];
                                const merged = Array.from(new Set([...existing, ...newCats]));
                                setCurrentPlace({
                                  ...currentPlace,
                                  subCategories: merged,
                                  subCategoriesInput: ''
                                });
                              }}
                              disabled={modalLoading || !currentPlace.subCategoriesInput?.trim()}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-md transition-all cursor-pointer shadow-2xs flex items-center gap-1 shrink-0"
                            >
                              <Plus size={14} />
                              Thêm
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Opening Hours & Representative Image */}
                      <div className="space-y-3">
                        {/* Opening Hours */}
                        <div className="space-y-2 bg-gray-50/70 p-3.5 rounded-lg border border-gray-200">
                          <label className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                            <Clock size={18} className="text-blue-600" />
                            Giờ hoạt động chi tiết từng ngày
                          </label>
                          <div className="space-y-1.5">
                            {[
                              { key: 'monday', label: 'Thứ 2' },
                              { key: 'tuesday', label: 'Thứ 3' },
                              { key: 'wednesday', label: 'Thứ 4' },
                              { key: 'thursday', label: 'Thứ 5' },
                              { key: 'friday', label: 'Thứ 6' },
                              { key: 'saturday', label: 'Thứ 7' },
                              { key: 'sunday', label: 'Chủ nhật' },
                            ].map((day) => {
                              const dayHours = currentPlace.openingHours?.[day.key];
                              const isOpen = Array.isArray(dayHours) && dayHours.length >= 2;
                              const openTime = isOpen ? dayHours[0] : '07:00';
                              const closeTime = isOpen ? dayHours[1] : '23:00';

                              return (
                                <div key={day.key} className="flex items-center justify-between text-xs border-b border-gray-200/80 pb-1.5 last:border-0 last:pb-0">
                                  <div className="flex items-center gap-2">
                                    <label className="flex items-center cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={isOpen}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          const updatedHours = { ...(currentPlace.openingHours || {}) };
                                          if (checked) {
                                            updatedHours[day.key] = ['07:00', '23:00'];
                                          } else {
                                            updatedHours[day.key] = null;
                                          }
                                          setCurrentPlace({ ...currentPlace, openingHours: updatedHours });
                                        }}
                                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                      />
                                    </label>
                                    <span className="font-bold text-gray-800 min-w-[75px]">{day.label}</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <input
                                      type="time"
                                      value={openTime}
                                      disabled={!isOpen || modalLoading}
                                      onChange={(e) => {
                                        const updatedHours = { ...(currentPlace.openingHours || {}) };
                                        updatedHours[day.key] = [e.target.value, closeTime];
                                        setCurrentPlace({ ...currentPlace, openingHours: updatedHours });
                                      }}
                                      className="text-xs font-semibold text-gray-900 border border-gray-300 rounded-md px-2 py-1 bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:border-blue-600 w-[105px] text-center"
                                    />
                                    <span className="text-gray-400 text-xs font-bold">&ndash;</span>
                                    <input
                                      type="time"
                                      value={closeTime}
                                      disabled={!isOpen || modalLoading}
                                      onChange={(e) => {
                                        const updatedHours = { ...(currentPlace.openingHours || {}) };
                                        updatedHours[day.key] = [openTime, e.target.value];
                                        setCurrentPlace({ ...currentPlace, openingHours: updatedHours });
                                      }}
                                      className="text-xs font-semibold text-gray-900 border border-gray-300 rounded-md px-2 py-1 bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:border-blue-600 w-[105px] text-center"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Representative Image */}
                        <div className="space-y-2 bg-gray-50/70 p-3.5 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                              <ImageIcon size={18} className="text-blue-600" />
                              Ảnh minh họa đại diện
                            </label>
                            <button
                              type="button"
                              disabled={uploadingThumbnail || modalLoading}
                              onClick={() => thumbnailInputRef.current?.click()}
                              className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {uploadingThumbnail ? (
                                <>
                                  <Loader2 size={12} className="animate-spin text-blue-600" /> Đang tải...
                                </>
                              ) : (
                                <>
                                  <Upload size={12} /> Chọn từ máy...
                                </>
                              )}
                            </button>
                            <input
                              type="file"
                              ref={thumbnailInputRef}
                              accept="image/*"
                              className="hidden"
                              onChange={handleThumbnailFileChange}
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              placeholder="Dán đường dẫn link URL (https://...) hoặc chọn ảnh ở trên"
                              value={currentPlace.image || ''}
                              onChange={(e) => setCurrentPlace({ ...currentPlace, image: e.target.value })}
                              disabled={modalLoading}
                              className="flex-1 text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 shadow-2xs font-medium"
                            />
                            {currentPlace.image && (
                              <div className="w-10 h-10 rounded-md overflow-hidden border border-gray-200 bg-white shrink-0 shadow-xs">
                                <img src={currentPlace.image} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons for Tab 1 & Tab 2 */}
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-200 shrink-0 pr-14 sm:pr-20">
                  <div>
                    {activeTab === 'basic' ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('extra')}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                      >
                        Sang Tab 2: Danh mục phụ &amp; Giờ mở cửa <ArrowRight size={14} />
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('basic')}
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                        >
                          <ArrowLeft size={14} /> Trở lại Tab 1: Thông tin cơ bản
                        </button>
                        {modalType === 'edit' && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('reviews')}
                            className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                          >
                            Sang Tab 3: Quản lý Đánh giá <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={modalLoading}
                      className="px-4 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors text-xs font-bold cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading || uploadingThumbnail || uploadingDetailPhoto || uploadingAvatar}
                      className="flex items-center gap-1.5 px-5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors text-xs font-extrabold cursor-pointer shadow-md"
                    >
                      {(modalLoading || uploadingThumbnail || uploadingDetailPhoto || uploadingAvatar) && <Loader2 size={15} className="animate-spin" />}
                      {uploadingThumbnail || uploadingDetailPhoto || uploadingAvatar
                        ? 'Đang tải ảnh...'
                        : modalLoading
                          ? 'Đang lưu...'
                          : modalType === 'create'
                            ? 'Tạo địa điểm mới'
                            : 'Lưu thay đổi'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 3: REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="flex-1 overflow-y-auto p-4 lg:p-5 flex flex-col justify-between space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start flex-1">
                  {/* Reviews List */}
                  <div className="lg:col-span-2 space-y-3">
                    <h4 className="font-extrabold text-gray-900 text-base flex items-center justify-between border-b border-gray-200 pb-2 flex-wrap gap-2">
                      <span>Danh sách đánh giá</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowReviewsImportHelp(true)}
                          className="flex items-center gap-1.5 bg-white hover:bg-amber-50 text-gray-700 hover:text-amber-800 border border-gray-300 hover:border-amber-300 font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs shadow-2xs"
                          title="Xem hướng dẫn định dạng file import đánh giá"
                        >
                          <Info size={13} className="text-amber-600" />
                          <span>Hướng dẫn mẫu</span>
                        </button>
                        <label className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs shadow-2xs">
                          <Upload size={13} />
                          <span>Import File Đánh giá</span>
                          <input
                            type="file"
                            ref={importReviewsInputRef}
                            accept=".json,.csv"
                            onChange={handleImportReviewsFile}
                            className="hidden"
                          />
                        </label>
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                          {placeReviews.length} nhận xét
                        </span>
                      </div>
                    </h4>

                    {reviewsLoading ? (
                      <div className="py-8 flex items-center justify-center text-gray-500">
                        <Loader2 className="animate-spin text-blue-500 mr-2" size={22} />
                        <span className="text-sm font-semibold">Đang tải đánh giá...</span>
                      </div>
                    ) : placeReviews.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg text-sm">
                        Chưa có đánh giá nào cho địa điểm này.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {placeReviews.map((review) => (
                          <div key={review.id} className="p-3.5 bg-gray-50/70 hover:bg-gray-50 rounded-lg border border-gray-200 transition-all flex gap-3 items-start relative group shadow-2xs">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center text-gray-400">
                              {review.authorAvatar ? (
                                <img src={review.authorAvatar} alt="" className="object-cover w-full h-full" />
                              ) : (
                                <User size={18} />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-gray-900 text-xs sm:text-sm">{review.authorName || 'Ẩn danh'}</span>
                                {review.authorLocation && (
                                  <span className="text-[11px] text-gray-600 bg-gray-200/70 px-1.5 py-0.5 rounded-md font-medium">
                                    📍 {review.authorLocation}
                                  </span>
                                )}
                                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border uppercase shrink-0 ${review.source === 'TRIPADVISOR'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}>
                                  {review.source || 'LOCAL'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5 text-amber-400">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={12}
                                      fill={star <= (review.rating || 0) ? "currentColor" : "none"}
                                      className={star <= (review.rating || 0) ? "text-amber-400" : "text-gray-300"}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] font-bold text-gray-500">
                                  {review.publishedDate ? new Date(review.publishedDate).toLocaleDateString('vi-VN') : ''}
                                </span>
                              </div>

                              <p className="text-gray-800 text-xs mt-1.5 leading-relaxed bg-white p-2.5 rounded-md border border-gray-200 shadow-2xs font-medium">
                                {review.comment || '(Không có nhận xét)'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteReview(Number(review.id))}
                              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-md transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                              title="Xóa đánh giá"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Review Form */}
                  <form onSubmit={handleAddReview} className="p-4 bg-gray-50/70 rounded-lg border border-gray-200 space-y-3 h-fit shadow-xs">
                    <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-200 pb-2">
                      <Plus size={16} className="text-blue-600" />
                      Thêm đánh giá mới
                    </h4>

                    {reviewError && (
                      <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-2.5 flex items-center gap-1.5">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{reviewError}</span>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 text-xs block">Tên người đánh giá *</label>
                        <input
                          type="text"
                          required
                          value={newReview.authorName}
                          onChange={(e) => setNewReview({ ...newReview, authorName: e.target.value })}
                          placeholder="VD: Nguyen Van A"
                          className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 text-xs block">Số sao đánh giá *</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReview({ ...newReview, rating: star })}
                              className="p-0.5 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                size={18}
                                fill={star <= newReview.rating ? "currentColor" : "none"}
                                className={star <= newReview.rating ? "text-amber-400" : "text-gray-300"}
                              />
                            </button>
                          ))}
                          <span className="ml-1.5 font-bold text-gray-800 text-xs">{newReview.rating} sao</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 text-xs block">Quê quán / Vị trí (Tùy chọn)</label>
                        <input
                          type="text"
                          value={newReview.authorLocation}
                          onChange={(e) => setNewReview({ ...newReview, authorLocation: e.target.value })}
                          placeholder="VD: Cần Thơ, TP.HCM..."
                          className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-gray-700 text-xs block">Ảnh đại diện (Link Avatar URL)</label>
                          <button
                            type="button"
                            disabled={uploadingAvatar || modalLoading}
                            onClick={() => avatarInputRef.current?.click()}
                            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            {uploadingAvatar ? (
                              <>
                                <Loader2 size={11} className="animate-spin text-blue-600" /> Đang tải...
                              </>
                            ) : (
                              <>
                                <Upload size={11} /> Chọn ảnh...
                              </>
                            )}
                          </button>
                        </div>
                        <input
                          type="file"
                          ref={avatarInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarFileChange}
                        />
                        <input
                          type="text"
                          value={newReview.authorAvatar}
                          onChange={(e) => setNewReview({ ...newReview, authorAvatar: e.target.value })}
                          placeholder="https://... hoặc chọn ảnh từ máy ở trên"
                          className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 text-xs block">Nội dung nhận xét *</label>
                        <textarea
                          required
                          rows={3}
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          placeholder="Nhập nhận xét chi tiết..."
                          className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 font-medium resize-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-md text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus size={16} /> Thêm đánh giá vào danh sách
                    </button>
                  </form>
                </div>

                {/* Footer Buttons for Tab 3: Reviews */}
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-200 shrink-0 pr-14 sm:pr-20">
                  <button
                    type="button"
                    onClick={() => setActiveTab('extra')}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Trở lại Tab 2: Danh mục phụ
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('photos')}
                    className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                  >
                    Sang Tab 4: Bộ sưu tập Hình ảnh <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: PHOTOS */}
            {activeTab === 'photos' && (
              <div className="flex-1 overflow-y-auto p-4 lg:p-5 flex flex-col justify-between space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start flex-1">
                  {/* Photo Gallery List */}
                  <div className="lg:col-span-2 space-y-3">
                    <h4 className="font-extrabold text-gray-900 text-base flex items-center justify-between border-b border-gray-200 pb-2 flex-wrap gap-2">
                      <span>Bộ sưu tập ảnh chi tiết</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPhotosImportHelp(true)}
                          className="flex items-center gap-1.5 bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-800 border border-gray-300 hover:border-purple-300 font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs shadow-2xs"
                          title="Xem hướng dẫn định dạng file import hình ảnh"
                        >
                          <Info size={13} className="text-purple-600" />
                          <span>Hướng dẫn mẫu</span>
                        </button>
                        <label className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs shadow-2xs">
                          <Upload size={13} />
                          <span>Import File Ảnh (JSON/CSV)</span>
                          <input
                            type="file"
                            ref={importPhotosInputRef}
                            accept=".json,.csv"
                            onChange={handleImportPhotosFile}
                            className="hidden"
                          />
                        </label>
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                          {placePhotos.length} hình ảnh
                        </span>
                      </div>
                    </h4>

                    {photosLoading ? (
                      <div className="py-8 flex items-center justify-center text-gray-500">
                        <Loader2 className="animate-spin text-blue-500 mr-2" size={22} />
                        <span className="text-sm font-semibold">Đang tải hình ảnh...</span>
                      </div>
                    ) : placePhotos.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg text-sm">
                        Chưa có hình ảnh phụ nào cho địa điểm này.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {placePhotos.map((photo) => (
                          <div key={photo.id} className="relative group border border-gray-250 rounded-lg overflow-hidden bg-gray-50 shadow-xs flex flex-col justify-between">
                            <div className="relative w-full aspect-video">
                              <img
                                src={photo.urlOriginal}
                                alt={photo.caption || ""}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.classList.add('flex', 'flex-col', 'items-center', 'justify-center', 'bg-rose-50', 'p-2', 'text-center');
                                    parent.innerHTML = '<div class="text-[11px] text-rose-600 font-bold">⚠️ Link ảnh hỏng</div><div class="text-[10px] text-gray-400 italic">Bấm 🗑️ để xóa</div>';
                                  }
                                }}
                              />
                            </div>

                            {photo.caption && (
                              <div className="p-2 bg-white text-[11px] font-medium text-gray-700 line-clamp-1 border-t border-gray-100">
                                {photo.caption}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(Number(photo.id))}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-md transition-colors cursor-pointer"
                              title="Xóa ảnh"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Photo Form */}
                  <form onSubmit={handleAddPhoto} className="p-4 bg-gray-50/70 rounded-lg border border-gray-200 space-y-3 h-fit shadow-xs">
                    <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-200 pb-2">
                      <Plus size={16} className="text-blue-600" />
                      Thêm ảnh mới
                    </h4>

                    {photoError && (
                      <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-2.5 flex items-center gap-1.5">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{photoError}</span>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {/* Device File Picker Button */}
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 text-xs block">Chọn ảnh từ máy tính</label>
                        <button
                          type="button"
                          disabled={uploadingDetailPhoto || modalLoading}
                          onClick={() => detailPhotoInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold px-3 py-2 rounded-md border border-purple-200 text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                          {uploadingDetailPhoto ? (
                            <>
                              <Loader2 size={14} className="animate-spin text-purple-700" /> Đang tải...
                            </>
                          ) : (
                            <>
                              <Upload size={14} /> Chọn ảnh từ máy...
                            </>
                          )}
                        </button>
                        <input
                          type="file"
                          ref={detailPhotoInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={handleDetailPhotoFileChange}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 text-xs block">Hoặc dán Link URL ảnh *</label>
                        <input
                          type="text"
                          required
                          value={newPhoto.urlOriginal}
                          onChange={(e) => setNewPhoto({ ...newPhoto, urlOriginal: e.target.value })}
                          placeholder="https://images.unsplash.com/... hoặc chọn ảnh ở trên"
                          className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 text-xs block">Chú thích ảnh (Tùy chọn)</label>
                        <input
                          type="text"
                          value={newPhoto.caption}
                          onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                          placeholder="VD: View ngắm hoàng hôn, Không gian trong quán..."
                          className="w-full text-xs text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-md text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus size={16} /> Thêm ảnh vào bộ sưu tập
                    </button>
                  </form>
                </div>

                {/* Footer Buttons for Tab 4: Photos */}
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-200 shrink-0 pr-14 sm:pr-20">
                  <button
                    type="button"
                    onClick={() => setActiveTab('reviews')}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Trở lại Tab 3: Quản lý Đánh giá
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-colors text-xs font-extrabold cursor-pointer shadow-md"
                  >
                    Hoàn tất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Xóa địa điểm?</h3>
              <p className="text-gray-500 text-sm mt-2">
                Hành động này không thể hoàn tác. Tất cả <strong>hình ảnh</strong>, <strong>đánh giá</strong> và <strong>lịch trình liên quan</strong> đến địa điểm này sẽ bị xóa sạch khỏi cơ sở dữ liệu.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                disabled={deleteLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer shadow-sm"
              >
                {deleteLoading && <Loader2 size={16} className="animate-spin" />}
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
