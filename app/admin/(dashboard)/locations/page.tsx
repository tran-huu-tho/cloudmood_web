"use client";

import React, { useEffect, useState, useTransition, startTransition } from 'react';
import dynamic from 'next/dynamic';
import { Place, Category } from '@/lib/supabase/types';
import { Plus, Edit2, Trash2, Search, X, Loader2, MapPin, ExternalLink, Check, Upload, Star, MessageSquare, Calendar, Clock, Image as ImageIcon, Info } from 'lucide-react';
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
  }, [searchQuery, selectedCategoryFilter, selectedSubCategoryFilter]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showImportHelp, setShowImportHelp] = useState(false);
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
    priceLevel: 'MODERATE',
    subCategories: [],
    subCategoriesInput: '',
    openingHours: {
      monday: ['08:00', '21:00'],
      tuesday: ['08:00', '21:00'],
      wednesday: ['08:00', '21:00'],
      thursday: ['08:00', '21:00'],
      friday: ['08:00', '21:00'],
      saturday: ['08:00', '21:00'],
      sunday: ['08:00', '21:00']
    }
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Tabs State (For Edit Modal)
  const [activeTab, setActiveTab] = useState<'general' | 'reviews' | 'photos'>('general');
  const [placeReviews, setPlaceReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [placePhotos, setPlacePhotos] = useState<any[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  const [newReview, setNewReview] = useState({
    authorName: '',
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
      phone: '',
      website: '',
      priceLevel: 'MODERATE',
      subCategories: [],
      subCategoriesInput: '',
      openingHours: {
        monday: ['08:00', '21:00'],
        tuesday: ['08:00', '21:00'],
        wednesday: ['08:00', '21:00'],
        thursday: ['08:00', '21:00'],
        friday: ['08:00', '21:00'],
        saturday: ['08:00', '21:00'],
        sunday: ['08:00', '21:00']
      }
    });
    setModalType('create');
    setActiveTab('general');
    setModalError(null);
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
      const defaultTime = [place.openTime || '08:00', place.closeTime || '21:00'];
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
      subCategoriesInput: place.subCategories ? (place.subCategories as string[]).join(', ') : '',
      openingHours: parsedOpeningHours,
    });
    setModalType('edit');
    setActiveTab('general');
    setModalError(null);
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
      const defaultTime = [place.openTime || '08:00', place.closeTime || '21:00'];
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
      subCategoriesInput: place.subCategories ? (place.subCategories as string[]).join(', ') : '',
      openingHours: parsedOpeningHours,
    });
    setModalType('edit');
    setActiveTab('reviews');
    setModalError(null);
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
      const defaultTime = [place.openTime || '08:00', place.closeTime || '21:00'];
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
      subCategoriesInput: place.subCategories ? (place.subCategories as string[]).join(', ') : '',
      openingHours: parsedOpeningHours,
    });
    setModalType('edit');
    setActiveTab('photos');
    setModalError(null);
    setIsModalOpen(true);
    
    fetchReviewsAndPhotos(Number(place.id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlace.name?.trim() || !currentPlace.address?.trim() || !currentPlace.categoryId) {
      setModalError('Vui lòng nhập đầy đủ tên, địa chỉ và chọn danh mục.');
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      const monHours = currentPlace.openingHours?.monday;
      const openTimeVal = monHours && monHours[0] ? monHours[0] : '08:00';
      const closeTimeVal = monHours && monHours[1] ? monHours[1] : '21:00';

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
        priceLevel: currentPlace.priceLevel || 'MODERATE',
        openingHours: currentPlace.openingHours || null,
        subCategories: currentPlace.subCategories || [],
        price: "",
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

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa đánh giá.');
      
      setPlaceReviews(prev => prev.filter(r => Number(r.id) !== reviewId));
      showToast('Xóa đánh giá thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa đánh giá.', 'error');
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.authorName.trim() || !newReview.comment.trim()) {
      alert('Vui lòng nhập đầy đủ tên và nhận xét.');
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
        source: 'LOCAL',
        authorAvatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(newReview.authorName)}`
      };
      
      const res = await fetch(`/api/admin/places/${currentPlace.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi thêm đánh giá.');
      
      setPlaceReviews(prev => [data, ...prev]);
      setNewReview({ authorName: '', rating: 5, comment: '', publishedDate: '', authorLocation: '' });
      showToast('Thêm đánh giá thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi thêm đánh giá.', 'error');
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return;
    try {
      const res = await fetch(`/api/admin/places/photos/${photoId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Lỗi khi xóa ảnh.');
      
      setPlacePhotos(prev => prev.filter(p => Number(p.id) !== photoId));
      showToast('Xóa hình ảnh thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa ảnh.', 'error');
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoto.urlOriginal.trim()) {
      alert('Vui lòng nhập URL ảnh.');
      return;
    }
    
    try {
      const payload = {
        urlOriginal: newPhoto.urlOriginal.trim(),
        urlThumbnail: newPhoto.urlThumbnail.trim() || newPhoto.urlOriginal.trim(),
        caption: newPhoto.caption.trim() || null,
        source: 'LOCAL'
      };
      
      const res = await fetch(`/api/admin/places/${currentPlace.id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi thêm hình ảnh.');
      
      setPlacePhotos(prev => [data, ...prev]);
      setNewPhoto({ urlOriginal: '', urlThumbnail: '', caption: '' });
      showToast('Thêm hình ảnh thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi thêm hình ảnh.', 'error');
    }
  };

  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        insideQuote = !insideQuote;
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

          let opHours: any = null;
          if (p.openingHours) {
            if (typeof p.openingHours === 'object') {
              opHours = p.openingHours;
            } else {
              try {
                opHours = JSON.parse(p.openingHours);
              } catch {
                opHours = {
                  monday: ["08:00", "21:00"],
                  tuesday: ["08:00", "21:00"],
                  wednesday: ["08:00", "21:00"],
                  thursday: ["08:00", "21:00"],
                  friday: ["08:00", "21:00"],
                  saturday: ["08:00", "21:00"],
                  sunday: ["08:00", "21:00"]
                };
              }
            }
          } else {
            opHours = {
              monday: [p.openTime || "08:00", p.closeTime || "21:00"],
              tuesday: [p.openTime || "08:00", p.closeTime || "21:00"],
              wednesday: [p.openTime || "08:00", p.closeTime || "21:00"],
              thursday: [p.openTime || "08:00", p.closeTime || "21:00"],
              friday: [p.openTime || "08:00", p.closeTime || "21:00"],
              saturday: [p.openTime || "08:00", p.closeTime || "21:00"],
              sunday: [p.openTime || "08:00", p.closeTime || "21:00"]
            };
          }

          return {
            name: p.name?.toString() || 'Chưa đặt tên',
            description: p.description?.toString() || "",
            latitude: parseFloat(p.latitude) || 10.03022,
            longitude: parseFloat(p.longitude) || 105.78753,
            address: p.address?.toString() || 'Chưa có địa chỉ',
            categoryId: catId,
            image: p.image?.toString() || '',
            phone: p.phone?.toString() || null,
            website: p.website?.toString() || null,
            priceLevel: p.priceLevel || 'MODERATE',
            openingHours: opHours,
            subCategories: subCats,
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
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
        } catch {}
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

    return matchesSearch && matchesCategory && matchesSubCategory;
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
                onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
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
                <tr className="text-gray-500 bg-gray-50 border-b border-gray-200 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Địa điểm</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4">Địa chỉ & Tọa độ</th>
                  <th className="px-6 py-4">Mức giá & Giờ mở</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedPlaces.map((place) => {
                  const cat = categories.find((c) => c.id === place.categoryId);
                  const catName = cat?.name || 'Chưa phân loại';
                  const IconComponent = cat ? getCategoryIcon(cat.iconCode) : null;
                  return (
                    <tr key={place.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                            {place.image ? (
                              <img src={place.image} alt={place.name || ''} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <MapPin size={18} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm truncate">{place.name}</h3>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{place.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${getCategoryBadgeStyle(place.categoryId || 0)}`}>
                          {IconComponent && <IconComponent size={12} className="shrink-0" />}
                          {catName}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-gray-900 text-xs truncate">{cleanAddress(place.address)}</p>
                        <div className="flex items-center gap-1.5 text-gray-500 text-[10px] mt-1 font-mono">
                          <span>Lat: {place.latitude}</span>
                          <span>&bull;</span>
                          <span>Lng: {place.longitude}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="mb-1">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${
                            place.priceLevel === 'FREE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            (place.priceLevel === 'INEXPENSIVE' || place.priceLevel === 'CHEAP') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            place.priceLevel === 'MODERATE' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            place.priceLevel === 'EXPENSIVE' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                            (place.priceLevel === 'VERY_EXPENSIVE' || place.priceLevel === 'VERY_EXP') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {place.priceLevel === 'FREE' ? 'Miễn phí' :
                             (place.priceLevel === 'INEXPENSIVE' || place.priceLevel === 'CHEAP') ? 'Giá rẻ' :
                             place.priceLevel === 'MODERATE' ? 'Trung bình' :
                             place.priceLevel === 'EXPENSIVE' ? 'Cao cấp' :
                             (place.priceLevel === 'VERY_EXPENSIVE' || place.priceLevel === 'VERY_EXP') ? 'Rất cao cấp' : 'Trung bình'}
                          </span>
                        </div>
                        <p className="text-gray-500 text-[10px] mt-1">
                          ⏱️ {displayOpeningHours(place)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1 shrink-0">
                        {place.latitude && place.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                            title="Xem bản đồ"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                         <button
                          onClick={() => handleOpenEdit(place)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Sửa thông tin"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenReviews(place)}
                          className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer inline-flex items-center relative"
                          title="Quản lý Đánh giá"
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenPhotos(place)}
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Quản lý Hình ảnh"
                        >
                          <ImageIcon size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(place.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === page
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
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-6xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-205">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Info size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Hướng dẫn định dạng file import</h3>
              </div>
              <button 
                onClick={() => setShowImportHelp(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-900 mb-1.5">1. Các trường thông tin hỗ trợ:</p>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50 font-semibold text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left">Trường (JSON Key / CSV Header)</th>
                        <th className="px-3 py-2 text-left">Kiểu</th>
                        <th className="px-3 py-2 text-left">Mô tả &amp; Ví dụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white text-gray-600">
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-semibold">name</td>
                        <td className="px-3 py-2">Chuỗi (Bắt buộc)</td>
                        <td className="px-3 py-2">Tên địa điểm. VD: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">Yaki House Buffet</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-semibold">address</td>
                        <td className="px-3 py-2">Chuỗi (Bắt buộc)</td>
                        <td className="px-3 py-2">Địa chỉ. VD: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">123 Đường 3/2, Cần Thơ</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-semibold">categoryName</td>
                        <td className="px-3 py-2">Chuỗi</td>
                        <td className="px-3 py-2">Danh mục chính (trùng khớp trong CSDL). VD: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">Quán ăn</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-semibold">latitude / longitude</td>
                        <td className="px-3 py-2">Số thập phân</td>
                        <td className="px-3 py-2">Tọa độ. VD: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">10.035425</code> / <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">105.779507</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-semibold">phone / website</td>
                        <td className="px-3 py-2">Chuỗi</td>
                        <td className="px-3 py-2">Số điện thoại hoặc website. VD: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">02923890123</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-semibold">priceLevel</td>
                        <td className="px-3 py-2">Chuỗi</td>
                        <td className="px-3 py-2">Mức giá: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-850">FREE</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-850">INEXPENSIVE</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-850">MODERATE</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-850">EXPENSIVE</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-850">VERY_EXPENSIVE</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-semibold">subCategories</td>
                        <td className="px-3 py-2">Mảng/Chuỗi</td>
                        <td className="px-3 py-2">Danh mục phụ, cách bởi dấu phẩy. VD: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">Buffet, Lẩu nướng</code></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600 font-semibold">openTime / closeTime</td>
                        <td className="px-3 py-2">Chuỗi (HH:MM)</td>
                        <td className="px-3 py-2">Giờ mở / đóng cửa mặc định. VD: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">08:00</code> &amp; <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">22:00</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-900 mb-1.5">2. Ví dụ file JSON (.json):</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`[
  {
    "name": "Yaki House Buffet",
    "description": "Buffet lẩu nướng đa dạng món ăn",
    "address": "123 Đường 3/2, Ninh Kiều, Cần Thơ",
    "categoryName": "Quán ăn",
    "latitude": 10.035425,
    "longitude": 105.779507,
    "phone": "02923890123",
    "website": "https://yakihouse.vn",
    "priceLevel": "MODERATE",
    "subCategories": ["Buffet", "Lẩu nướng"],
    "openTime": "08:00",
    "closeTime": "22:00"
  }
]`}
                </pre>
              </div>

              <div>
                <p className="font-semibold text-gray-900 mb-1.5">3. Ví dụ file CSV (.csv):</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`name,description,address,categoryName,latitude,longitude,phone,website,priceLevel,subCategories,openTime,closeTime
Yaki House Buffet,Buffet lẩu nướng,123 Đường 3/2 Cần Thơ,Quán ăn,10.035425,105.779507,02923890123,https://yakihouse.vn,MODERATE,"Buffet, Lẩu nướng",08:00,22:00`}
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl max-w-[96%] xl:max-w-[1500px] w-full shadow-xl overflow-hidden border border-gray-100 my-3">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-150 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">
                {modalType === 'create'
                  ? 'Thêm địa điểm mới'
                  : activeTab === 'general'
                  ? `Chỉnh sửa địa điểm: ${currentPlace.name || ''}`
                  : activeTab === 'reviews'
                  ? `Quản lý Đánh giá: ${currentPlace.name || ''}`
                  : `Quản lý Hình ảnh: ${currentPlace.name || ''}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Tab 1: General Info */}
            {(activeTab === 'general' || modalType === 'create') && (
              <form onSubmit={handleSave} className="p-4 space-y-2.5 max-h-[94vh] overflow-y-auto">
                {modalError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{modalError}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  {/* Column 1: Name, Category, Description, Address, Subcategories & Hours */}
                  <div className="space-y-3 flex flex-col h-full">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 block">
                        Tên địa điểm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập tên địa điểm..."
                        value={currentPlace.name || ''}
                        onChange={(e) => setCurrentPlace({ ...currentPlace, name: e.target.value })}
                        disabled={modalLoading}
                        className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3.5 py-1.5 bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 block">
                        Danh mục <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={currentPlace.categoryId || ''}
                        onChange={(e) => setCurrentPlace({ ...currentPlace, categoryId: Number(e.target.value) })}
                        disabled={modalLoading}
                        className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="" disabled>Select category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 block">Mô tả ngắn</label>
                      <textarea
                        placeholder="Nhập mô tả địa điểm..."
                        value={currentPlace.description || ''}
                        onChange={(e) => setCurrentPlace({ ...currentPlace, description: e.target.value })}
                        disabled={modalLoading}
                        rows={2}
                        className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3.5 py-1.5 bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 block">
                        Địa chỉ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập số nhà, tên đường, quận huyện..."
                        value={currentPlace.address || ''}
                        onChange={(e) => setCurrentPlace({ ...currentPlace, address: e.target.value })}
                        disabled={modalLoading}
                        className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3.5 py-1.5 bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Subcategories (Danh mục phụ) */}
                    <div className="space-y-2 bg-gray-50/50 p-3 rounded-xl border border-gray-200">
                      <label className="text-sm font-bold text-gray-700 block">Danh mục phụ</label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(currentPlace.subCategories || []).map((sub: string) => (
                          <span key={sub} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200">
                            {sub}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (currentPlace.subCategories || []).filter((s: string) => s !== sub);
                                setCurrentPlace({ ...currentPlace, subCategories: updated });
                              }}
                              className="text-blue-500 hover:text-blue-700 font-bold shrink-0 cursor-pointer text-xs"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>

                      {allSubCategories.filter(s => !(currentPlace.subCategories || []).includes(s)).length > 0 && (
                        <div className="space-y-1 mb-2">
                          <span className="text-[11px] font-semibold text-gray-400 block">Gợi ý từ dữ liệu:</span>
                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                            {allSubCategories
                              .filter(s => !(currentPlace.subCategories || []).includes(s))
                              .map((sub: string) => (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(currentPlace.subCategories || []), sub];
                                    setCurrentPlace({ ...currentPlace, subCategories: updated });
                                  }}
                                  className="text-[10px] bg-white hover:bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200 transition-colors cursor-pointer"
                                >
                                  + {sub}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nhập danh mục phụ mới..."
                          value={currentPlace.subCategoriesInput || ''}
                          onChange={(e) => setCurrentPlace({ ...currentPlace, subCategoriesInput: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = currentPlace.subCategoriesInput?.trim();
                              if (val && !(currentPlace.subCategories || []).includes(val)) {
                                setCurrentPlace({
                                  ...currentPlace,
                                  subCategories: [...(currentPlace.subCategories || []), val],
                                  subCategoriesInput: ''
                                });
                              }
                            }
                          }}
                          disabled={modalLoading}
                          className="flex-1 text-xs text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = currentPlace.subCategoriesInput?.trim();
                            if (val && !(currentPlace.subCategories || []).includes(val)) {
                              setCurrentPlace({
                                ...currentPlace,
                                subCategories: [...(currentPlace.subCategories || []), val],
                                subCategoriesInput: ''
                              });
                            }
                          }}
                          className="px-3 py-1.5 bg-gray-150 hover:bg-gray-250 text-gray-705 text-xs font-semibold rounded-lg transition-colors border border-gray-300 cursor-pointer"
                        >
                          Thêm
                        </button>
                      </div>
                    </div>

                    {/* Opening Hours per day */}
                    <div className="space-y-3 bg-gray-50/50 p-3 rounded-xl border border-gray-200">
                      <label className="text-sm font-bold text-gray-700 block flex items-center gap-1.5">
                        <Clock size={16} className="text-gray-500" />
                        Giờ hoạt động chi tiết từng ngày
                      </label>
                      <div className="space-y-2.5 max-w-lg">
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
                          const openTime = isOpen ? dayHours[0] : '08:00';
                          const closeTime = isOpen ? dayHours[1] : '21:00';

                          return (
                            <div key={day.key} className="flex items-center gap-4 text-xs border-b border-gray-100/50 pb-2 last:border-0 last:pb-0">
                              <span className="font-semibold text-gray-700 w-16 shrink-0">{day.label}</span>
                              
                              <label className="flex items-center cursor-pointer select-none shrink-0 w-8">
                                <input
                                  type="checkbox"
                                  checked={isOpen}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    const updatedHours = { ...(currentPlace.openingHours || {}) };
                                    if (checked) {
                                      updatedHours[day.key] = ['08:00', '21:00'];
                                    } else {
                                      updatedHours[day.key] = null;
                                    }
                                    setCurrentPlace({ ...currentPlace, openingHours: updatedHours });
                                  }}
                                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                              </label>

                              <div className="flex items-center gap-2 shrink-0">
                                <input
                                  type="time"
                                  value={openTime}
                                  disabled={!isOpen || modalLoading}
                                  onChange={(e) => {
                                    const updatedHours = { ...(currentPlace.openingHours || {}) };
                                    updatedHours[day.key] = [e.target.value, closeTime];
                                    setCurrentPlace({ ...currentPlace, openingHours: updatedHours });
                                  }}
                                  className="text-[11.5px] text-gray-900 border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:border-blue-500 w-[124px] text-center"
                                />
                                <span className="text-gray-450 text-[10px]">&ndash;</span>
                                <input
                                  type="time"
                                  value={closeTime}
                                  disabled={!isOpen || modalLoading}
                                  onChange={(e) => {
                                    const updatedHours = { ...(currentPlace.openingHours || {}) };
                                    updatedHours[day.key] = [openTime, e.target.value];
                                    setCurrentPlace({ ...currentPlace, openingHours: updatedHours });
                                  }}
                                  className="text-[11.5px] text-gray-900 border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:border-blue-500 w-[124px] text-center"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Coordinates, Details & Map */}
                  <div className="space-y-3 flex flex-col h-full">
                    <div className="grid grid-cols-2 gap-3 shrink-0">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 block">Vĩ độ (Latitude)</label>
                        <input
                          type="number"
                          step="any"
                          value={currentPlace.latitude || ''}
                          onChange={(e) => setCurrentPlace({ ...currentPlace, latitude: parseFloat(e.target.value) || 0 })}
                          disabled={modalLoading}
                          className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3.5 py-1.5 bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 block">Kinh độ (Longitude)</label>
                        <input
                          type="number"
                          step="any"
                          value={currentPlace.longitude || ''}
                          onChange={(e) => setCurrentPlace({ ...currentPlace, longitude: parseFloat(e.target.value) || 0 })}
                          disabled={modalLoading}
                          className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3.5 py-1.5 bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 shrink-0">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 block">Số điện thoại</label>
                        <input
                          type="text"
                          placeholder="VD: 0292 3890..."
                          value={currentPlace.phone || ''}
                          onChange={(e) => setCurrentPlace({ ...currentPlace, phone: e.target.value })}
                          disabled={modalLoading}
                          className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3.5 py-1.5 bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 block">Trang web</label>
                        <input
                          type="text"
                          placeholder="VD: https://cloudmood.com..."
                          value={currentPlace.website || ''}
                          onChange={(e) => setCurrentPlace({ ...currentPlace, website: e.target.value })}
                          disabled={modalLoading}
                          className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3.5 py-1.5 bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 shrink-0">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 block">Mức giá</label>
                        <select
                          value={currentPlace.priceLevel || 'MODERATE'}
                          onChange={(e) => setCurrentPlace({ ...currentPlace, priceLevel: e.target.value })}
                          disabled={modalLoading}
                          className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="FREE">Miễn phí</option>
                          <option value="CHEAP">Giá rẻ</option>
                          <option value="MODERATE">Trung bình</option>
                          <option value="EXPENSIVE">Cao cấp</option>
                          <option value="VERY_EXP">Rất cao cấp</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 block">Ảnh minh họa (Link)</label>
                        <input
                          type="text"
                          placeholder="Link hình ảnh..."
                          value={currentPlace.image || ''}
                          onChange={(e) => setCurrentPlace({ ...currentPlace, image: e.target.value })}
                          disabled={modalLoading}
                          className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3.5 py-1.5 bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Image Preview Box */}
                    {currentPlace.image && (
                      <div className="space-y-1.5 shrink-0">
                        <span className="text-[11px] font-semibold text-gray-500 block">Xem trước ảnh minh họa:</span>
                        <div className="relative w-full h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center group">
                          <img 
                            src={currentPlace.image} 
                            alt="Xem trước địa điểm" 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
                      <label className="text-sm font-semibold text-gray-700 block">Chọn vị trí trên bản đồ</label>
                      <div className="w-full flex-grow flex-1 h-0">
                        <MapPicker
                          lat={Number(currentPlace.latitude) || 10.03022}
                          lng={Number(currentPlace.longitude) || 105.78753}
                          onChange={handleCoordinateChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={modalLoading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer shadow-sm"
                  >
                    {modalLoading && <Loader2 size={16} className="animate-spin" />}
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Reviews */}
            {modalType === 'edit' && activeTab === 'reviews' && (
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="space-y-4">
                  {/* Reviews List */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-base">Danh sách đánh giá</h4>
                    
                    {reviewsLoading ? (
                      <div className="py-10 flex items-center justify-center text-gray-500">
                        <Loader2 className="animate-spin text-blue-500 mr-2" size={24} />
                        <span>Đang tải đánh giá...</span>
                      </div>
                    ) : placeReviews.length === 0 ? (
                      <div className="py-10 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl">
                        Chưa có đánh giá nào cho địa điểm này.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {placeReviews.map((review) => (
                          <div key={review.id} className="p-4 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all flex gap-4 items-start relative group">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                              {review.authorAvatar ? (
                                <img src={review.authorAvatar} alt="" className="object-cover w-full h-full" />
                              ) : (
                                <div className="w-full h-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
                                  {(review.authorName || "A").charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900 text-sm">{review.authorName || 'Ẩn danh'}</span>
                                {review.authorLocation && (
                                  <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    📍 {review.authorLocation}
                                  </span>
                                )}
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                                  review.source === 'TRIPADVISOR' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {review.source || 'LOCAL'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 my-1">
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
                                <span className="text-xs font-semibold text-gray-500">
                                  {review.publishedDate ? new Date(review.publishedDate).toLocaleDateString('vi-VN') : ''}
                                </span>
                              </div>

                              <p className="text-gray-750 text-xs mt-1.5 leading-relaxed bg-white p-2.5 rounded-lg border border-gray-100 italic shadow-inner">
                                {review.comment || '(Không có nhận xét)'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteReview(Number(review.id))}
                              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                              title="Xóa đánh giá"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Photos */}
            {modalType === 'edit' && activeTab === 'photos' && (
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Photo Gallery List */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="font-bold text-gray-900 text-base">Bộ sưu tập ảnh phụ</h4>
                    
                    {photosLoading ? (
                      <div className="py-10 flex items-center justify-center text-gray-500">
                        <Loader2 className="animate-spin text-blue-500 mr-2" size={24} />
                        <span>Đang tải hình ảnh...</span>
                      </div>
                    ) : placePhotos.length === 0 ? (
                      <div className="py-10 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl">
                        Chưa có hình ảnh phụ nào cho địa điểm này.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {placePhotos.map((photo) => (
                          <div key={photo.id} className="relative group border border-gray-250 rounded-xl overflow-hidden bg-gray-50 shadow-xs flex flex-col justify-between">
                            <div className="relative w-full aspect-video">
                              <img 
                                src={photo.urlOriginal} 
                                alt={photo.caption || ""} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            
                            {photo.caption && (
                              <div className="p-2 bg-white text-[11px] text-gray-650 line-clamp-1 border-t border-gray-100">
                                {photo.caption}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(Number(photo.id))}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                              title="Xóa ảnh"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Photo Form */}
                  <form onSubmit={handleAddPhoto} className="p-4 bg-gray-50/50 rounded-xl border border-gray-200 space-y-4 h-fit">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                      <Plus size={16} className="text-blue-600" />
                      Thêm ảnh mới
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-750">Đường dẫn ảnh (Original URL) *</label>
                        <input
                          type="url"
                          required
                          value={newPhoto.urlOriginal}
                          onChange={(e) => setNewPhoto({ ...newPhoto, urlOriginal: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full text-xs text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-gray-750">Đường dẫn thu nhỏ (Thumbnail URL)</label>
                        <input
                          type="url"
                          value={newPhoto.urlThumbnail}
                          onChange={(e) => setNewPhoto({ ...newPhoto, urlThumbnail: e.target.value })}
                          placeholder="Nếu trống sẽ dùng đường dẫn gốc..."
                          className="w-full text-xs text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-gray-750">Chú thích ảnh</label>
                        <input
                          type="text"
                          value={newPhoto.caption}
                          onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                          placeholder="VD: View ngắm hoàng hôn, Không gian trong quán..."
                          className="w-full text-xs text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      Lưu ảnh
                    </button>
                  </form>
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
                Hành động này không thể hoàn tác. Các đánh giá liên quan sẽ bị xóa khỏi cơ sở dữ liệu.
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
