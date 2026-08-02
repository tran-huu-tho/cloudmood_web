'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MapPin, X, Plus, Image as ImageIcon, GripVertical, Eye, ChevronDown, ChevronRight } from 'lucide-react';

interface AttachedPlacesManagerProps {
  selectedPlaces: any[];
  onSelectedPlacesChange: (places: any[]) => void;
  allPlaces: any[];
  onFetchPlaces: () => void;
  destination?: string;
  coverImage?: string;
  onCoverImageChange?: (url: string) => void;
}

function removeAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function parseChecklist(content: any) {
  if (!content) return null;
  if (typeof content === 'object' && content !== null) return content;
  if (typeof content === 'string' && content.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(content);
      if (parsed && (parsed.title || Array.isArray(parsed.items))) return parsed;
    } catch (e) {
      return null;
    }
  }
  return null;
}

function getDestinationKeywords(dest: string): string[] {
  const norm = removeAccents(dest);
  if (!norm) return [];
  const keywords = [norm];

  if (norm.includes('can tho')) {
    keywords.push('ninh kieu', 'cai rang', 'binh thuy', 'o mon', 'thot not', 'phong dien', 'co do', 'thoi lai', 'vinh thanh', 'can tho');
  } else if (norm.includes('da nang')) {
    keywords.push('hai chau', 'thanh khe', 'son tra', 'ngu hanh son', 'lien chieu', 'cam le', 'hoa vang', 'da nang');
  } else if (norm.includes('ho chi minh') || norm.includes('sai gon')) {
    keywords.push('quan 1', 'quan 3', 'quan 5', 'quan 7', 'thu duc', 'go vap', 'tan binh', 'binh thanh', 'can gio', 'sai gon', 'ho chi minh');
  } else if (norm.includes('ha noi')) {
    keywords.push('hoan kiem', 'ba dinh', 'tay ho', 'cau giay', 'dong da', 'hai ba trung', 'ha noi');
  }

  return keywords;
}

const MAIN_CATEGORIES = [
  'Tất cả',
  'Nhà hàng',
  'Quán ăn',
  'Cà phê',
  'Tham quan',
  'Khách sạn',
  'Check-in',
  'Mua sắm',
  'Bảo tàng',
];

const SUB_CATEGORIES_MAP: Record<string, string[]> = {
  'Tất cả': ['Tất cả phụ', 'Hải sản', 'Lẩu & Nướng', 'Đặc sản', 'Sân vườn', 'View đẹp', 'Chùa / Tâm linh', 'Resort / Homestay'],
  'Nhà hàng': ['Tất cả phụ', 'Hải sản', 'Buffet', 'Lẩu & Nướng', 'Món Việt', 'Món Âu / Á', 'Sang trọng'],
  'Quán ăn': ['Tất cả phụ', 'Quán lẩu', 'Đặc sản miền Tây', 'Ăn vặt', 'Bình dân', 'Bún / Phở / Cơm'],
  'Cà phê': ['Tất cả phụ', 'Sân vườn', 'View sông / Đêm', 'Trà sữa', 'Cà phê sách', 'Acoustic'],
  'Tham quan': ['Tất cả phụ', 'Chùa / Tâm linh', 'Chợ nổi / Sông nước', 'Bảo tàng / Lịch sử', 'Công viên', 'Di tích'],
  'Khách sạn': ['Tất cả phụ', 'Resort', 'Homestay', 'Khách sạn 3-5 sao', 'Nhà nghỉ'],
  'Check-in': ['Tất cả phụ', 'View sông', 'Kiến trúc cổ', 'Sống ảo', 'Bờ kè'],
  'Mua sắm': ['Tất cả phụ', 'Chợ đêm', 'Đặc sản làm quà', 'TTTM / Mall'],
  'Bảo tàng': ['Tất cả phụ', 'Lịch sử', 'Văn hóa', 'Quân sự'],
};

export default function AttachedPlacesManager({
  selectedPlaces,
  onSelectedPlacesChange,
  allPlaces,
  onFetchPlaces,
  destination = '',
  coverImage = '',
  onCoverImageChange,
}: AttachedPlacesManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Tất cả phụ');

  // Place Detail Modal State
  const [viewingPlaceDetail, setViewingPlaceDetail] = useState<any | null>(null);

  // Flutter ReorderableListView style drag state
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [dragPointerPos, setDragPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [draggedCardRect, setDraggedCardRect] = useState<{ width: number; offsetX: number } | null>(null);

  const selectedContainerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto fetch places when component mounts or focuses
  useEffect(() => {
    onFetchPlaces();
  }, [onFetchPlaces]);

  // Sub-category options list based on selected main category + place tags
  const subCategoryOptions = useMemo(() => {
    const defaultList = SUB_CATEGORIES_MAP[selectedCategory] || SUB_CATEGORIES_MAP['Tất cả'];
    const dynamicSet = new Set<string>(defaultList);

    // Extract any unique subCategories stored in allPlaces
    allPlaces.forEach((p) => {
      if (Array.isArray(p.subCategories)) {
        p.subCategories.forEach((sc: any) => {
          if (typeof sc === 'string' && sc.trim()) dynamicSet.add(sc.trim());
        });
      } else if (typeof p.subCategories === 'string' && p.subCategories.trim()) {
        try {
          const parsed = JSON.parse(p.subCategories);
          if (Array.isArray(parsed)) {
            parsed.forEach((sc) => typeof sc === 'string' && dynamicSet.add(sc.trim()));
          }
        } catch {
          p.subCategories.split(',').forEach((sc: string) => {
            if (sc.trim()) dynamicSet.add(sc.trim());
          });
        }
      }
    });

    return Array.from(dynamicSet);
  }, [selectedCategory, allPlaces]);

  // Filtered available places
  const filteredPlaces = useMemo(() => {
    if (!allPlaces || allPlaces.length === 0) return [];

    const destKeywords = getDestinationKeywords(destination);

    return allPlaces.filter((p) => {
      const pDest = removeAccents(p.destination || '');
      const pAddr = removeAccents(p.address || '');
      const pName = removeAccents(p.name || '');
      const pDesc = removeAccents(p.description || '');
      const pCat = removeAccents(p.category?.name || p.categoryName || p.category || '');

      // 1. Auto filter by Destination (strictly checking address or destination contains destination name)
      if (destination.trim()) {
        const normDest = removeAccents(destination.trim());
        const isDestMatch = pDest.includes(normDest) || pAddr.includes(normDest);
        if (!isDestMatch) return false;
      }

      // 2. Filter by Search Query
      if (searchQuery.trim()) {
        const q = removeAccents(searchQuery.trim());
        if (!pName.includes(q) && !pAddr.includes(q) && !pDest.includes(q)) {
          return false;
        }
      }

      // 2. Filter by Main Category tab
      if (selectedCategory !== 'Tất cả') {
        const normMainCat = removeAccents(selectedCategory);
        if (!pCat.includes(normMainCat) && !pName.includes(normMainCat) && !pDesc.includes(normMainCat)) {
          return false;
        }
      }

      // 3. Filter by Sub Category tag
      if (selectedSubCategory !== 'Tất cả phụ') {
        const normSub = removeAccents(selectedSubCategory);
        
        let pSubStr = '';
        if (Array.isArray(p.subCategories)) {
          pSubStr = removeAccents(p.subCategories.join(' '));
        } else if (typeof p.subCategories === 'string') {
          pSubStr = removeAccents(p.subCategories);
        }

        const matchesSub =
          pSubStr.includes(normSub) ||
          pName.includes(normSub) ||
          pAddr.includes(normSub) ||
          pDesc.includes(normSub) ||
          pCat.includes(normSub);

        if (!matchesSub) return false;
      }

      return true;
    });
  }, [allPlaces, destination, selectedCategory, selectedSubCategory, searchQuery]);

  const handleAddPlace = (place: any) => {
    const isSelected = selectedPlaces.some((sp) => sp.id === place.id);
    if (!isSelected) {
      const newSelected = [...selectedPlaces, place];
      onSelectedPlacesChange(newSelected);
      if (onCoverImageChange && !coverImage && place.image) {
        onCoverImageChange(place.image);
      }
    }
  };

  const handleAddAllFiltered = () => {
    const unselected = filteredPlaces.filter(
      (p) => !selectedPlaces.some((sp) => sp.id === p.id)
    );
    if (unselected.length > 0) {
      const newSelected = [...selectedPlaces, ...unselected];
      onSelectedPlacesChange(newSelected);
      if (onCoverImageChange && !coverImage && unselected[0]?.image) {
        onCoverImageChange(unselected[0].image);
      }
    }
  };

  const handleRemovePlace = (placeId: any) => {
    onSelectedPlacesChange(selectedPlaces.filter((p) => p.id !== placeId));
  };

  // Flutter ReorderableListView style pointer drag engine
  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    if (e.button !== 0) return; // Only primary click
    e.preventDefault();

    // Measure exact width and pointer offset of the dragged item card
    const cardEl = itemRefs.current[index];
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      setDraggedCardRect({
        width: rect.width,
        offsetX: e.clientX - rect.left,
      });
    }

    setStartIndex(index);
    setTargetIndex(index);
    setDragPointerPos({ x: e.clientX, y: e.clientY });

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startIndex === null) return;
    setDragPointerPos({ x: e.clientX, y: e.clientY });

    // Auto-scroll container when near top or bottom edges
    if (selectedContainerRef.current) {
      const container = selectedContainerRef.current;
      const rect = container.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      if (offsetY < 40) {
        container.scrollTop -= 10;
      } else if (offsetY > rect.height - 40) {
        container.scrollTop += 10;
      }
    }

    // Determine target drop index gap like Flutter ReorderableListView
    const mouseY = e.clientY;
    let newTarget = startIndex;

    for (let i = 0; i < selectedPlaces.length; i++) {
      const el = itemRefs.current[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        const middleY = rect.top + rect.height / 2;
        if (mouseY > middleY) {
          newTarget = i;
        }
      }
    }

    if (newTarget !== targetIndex) {
      setTargetIndex(newTarget);
    }
  };

  // Collapse / Expand state for Section Headers
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const reorderPlacesGroup = (list: any[], srcIdx: number, dstIdx: number) => {
    if (srcIdx === dstIdx) return list;
    const item = list[srcIdx];
    if (!item) return list;

    const isSec = item.itemType === 'SECTION_HEADER';
    let gEnd = srcIdx + 1;
    if (isSec) {
      while (gEnd < list.length && list[gEnd]?.itemType !== 'SECTION_HEADER') {
        gEnd++;
      }
    }

    if (dstIdx >= srcIdx && dstIdx < gEnd) return list;

    const group = list.slice(srcIdx, gEnd);
    const remaining = [...list.slice(0, srcIdx), ...list.slice(gEnd)];

    const targetItem = list[dstIdx];
    let insertAt = remaining.indexOf(targetItem);

    if (insertAt === -1) {
      if (dstIdx >= list.length) insertAt = remaining.length;
      else insertAt = 0;
    } else if (dstIdx > srcIdx) {
      insertAt += 1;
    }

    const result = [...remaining];
    result.splice(insertAt, 0, ...group);
    return result;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (startIndex !== null && targetIndex !== null) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}

      if (startIndex !== targetIndex) {
        const updated = reorderPlacesGroup(selectedPlaces, startIndex, targetIndex);
        onSelectedPlacesChange(updated);
      }
      setStartIndex(null);
      setTargetIndex(null);
      setDragPointerPos(null);
      setDraggedCardRect(null);
    }
  };

  const formatAddress = (addr?: string) => {
    if (!addr) return 'Chưa cập nhật địa chỉ';
    return addr.length > 60 ? addr.substring(0, 60) + '...' : addr;
  };

  const activeDragItem = startIndex !== null ? selectedPlaces[startIndex] : null;

  return (
    <div className="flex flex-col gap-0 text-xs h-full">

      {/* 2-Column Layout */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* LEFT: Search & Add Places */}
        <div className="flex flex-col gap-2.5 w-[45%] min-w-0 shrink-0 min-h-0">

          {/* Header */}
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-1.5">
            <h4 className="font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Search size={13} /> Tìm & Thêm Địa điểm
            </h4>
          </div>

          {/* Search + Filter */}
          <div className="grid grid-cols-12 gap-1.5 items-center">
            <div className="col-span-12 relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder={
                  destination.trim()
                    ? `Tìm địa điểm tại ${destination}...`
                    : 'Gõ tên/địa chỉ địa điểm...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-6 py-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none truncate"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="col-span-6">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubCategory('Tất cả phụ');
                }}
                className="w-full px-2 py-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer truncate"
              >
                {MAIN_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="text-gray-900 dark:text-slate-100 font-medium">
                    {cat === 'Tất cả' ? '📁 Danh mục chính' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-6">
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer truncate"
              >
                {subCategoryOptions.map((subCat) => (
                  <option key={subCat} value={subCat} className="text-gray-900 dark:text-slate-100 font-medium">
                    {subCat === 'Tất cả phụ' ? '🏷️ Danh mục phụ' : subCat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Available Places */}
          <div className="border border-purple-200/70 dark:border-purple-900/50 rounded-2xl bg-white dark:bg-slate-900 p-2.5 space-y-2 shadow-xs overflow-hidden flex flex-col" style={{maxHeight: 'calc(100vh - 320px)'}}>
            <div className="flex items-center justify-between px-1 shrink-0">
              <span className="text-[11px] font-bold text-gray-600 dark:text-slate-300">
                {filteredPlaces.length > 0
                  ? `Tìm thấy ${filteredPlaces.length} địa điểm ${destination.trim() ? `tại ${destination}` : ''}`
                  : 'Không tìm thấy địa điểm phù hợp'}
              </span>
              {filteredPlaces.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddAllFiltered}
                  className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Thêm tất cả ({filteredPlaces.length})
                </button>
              )}
            </div>
            <div className="overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 pr-1" style={{maxHeight: 'calc(100vh - 380px)'}}>
              {filteredPlaces.length > 0 ? (
                filteredPlaces.slice(0, 50).map((p, pIdx) => {
                  const isSelected = selectedPlaces.some((sp) => sp.id === p.id);
                  const catName = p.category?.name || p.categoryName || p.category || '';
                  return (
                    <div
                      key={`avail-${p.id}-${pIdx}`}
                      onClick={() => setViewingPlaceDetail(p)}
                      className="py-1.5 px-1 flex items-center justify-between hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors rounded-lg text-xs cursor-pointer group"
                      title="Click để xem chi tiết địa điểm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-slate-800"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                            <MapPin size={15} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-gray-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors truncate">
                              {p.name}
                            </span>
                            {catName && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-medium shrink-0">
                                {catName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            {p.rating && <span className="text-amber-500 font-bold">⭐ {p.rating}</span>}
                            <span className="truncate">{formatAddress(p.address)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setViewingPlaceDetail(p)}
                          className="p-1 text-gray-400 hover:text-purple-600 transition-colors cursor-pointer"
                          title="Xem chi tiết địa điểm"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={isSelected}
                          onClick={() => handleAddPlace(p)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-2xs'
                          }`}
                        >
                          {isSelected ? 'Đã chọn' : '+ Thêm'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-5 text-center text-xs text-gray-400">
                  {allPlaces.length === 0
                    ? 'Đang tải dữ liệu địa điểm...'
                    : 'Thử chọn danh mục khác hoặc gõ từ khóa tìm kiếm'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Structure & Selected Places List */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {/* Selected Places Header */}

          <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400">
            Cấu trúc & Địa điểm bài viết ({selectedPlaces.length})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const newSec = {
                  id: `sec-${Date.now()}`,
                  itemType: 'SECTION_HEADER',
                  name: 'Mục nội dung mới',
                  customContent: 'Phần nội dung mới',
                };
                onSelectedPlacesChange([...selectedPlaces, newSec]);
              }}
              className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer"
            >
              + Thêm Mục
            </button>

            <button
              type="button"
              onClick={() => {
                const newNote = {
                  id: `note-${Date.now()}`,
                  itemType: 'NOTE',
                  name: 'Ghi chú',
                  customContent: '',
                };
                onSelectedPlacesChange([...selectedPlaces, newNote]);
              }}
              className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-lg hover:bg-amber-200 transition-colors cursor-pointer"
            >
              + Ghi chú
            </button>

            <button
              type="button"
              onClick={() => {
                const defaultChecklist = {
                  title: 'Danh sách công việc / hành lý mới',
                  items: [
                    { done: false, text: 'Chuẩn bị giấy tờ cá nhân' },
                    { done: false, text: 'Sạc điện thoại & pin dự phòng' },
                  ],
                };
                const newChk = {
                  id: `chk-${Date.now()}`,
                  itemType: 'CHECKLIST',
                  name: 'Danh mục công việc',
                  customContent: JSON.stringify(defaultChecklist),
                  content: JSON.stringify(defaultChecklist),
                };
                onSelectedPlacesChange([...selectedPlaces, newChk]);
              }}
              className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 transition-colors cursor-pointer"
            >
              + Checklist
            </button>

            {selectedPlaces.length > 0 && (
              <button
                type="button"
                onClick={() => onSelectedPlacesChange([])}
                className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer ml-1"
              >
                Xóa tất cả
              </button>
            )}
          </div>
        </div>

        {selectedPlaces.length > 0 ? (
          <div
            ref={selectedContainerRef}
            className="space-y-2 overflow-y-auto pr-1 transition-all"
            style={{maxHeight: 'calc(100vh - 320px)'}}
          >
            {(() => {
              let placeCounter = 0;

              return selectedPlaces.map((p, idx) => {
                const isPicked = startIndex === idx;
                let isShiftedUp = false;
                let isShiftedDown = false;

                if (startIndex !== null && targetIndex !== null) {
                  if (startIndex < targetIndex && idx > startIndex && idx <= targetIndex) {
                    isShiftedUp = true;
                  } else if (startIndex > targetIndex && idx < startIndex && idx >= targetIndex) {
                    isShiftedDown = true;
                  }
                }

                const isPlaceItem = !p.itemType || p.itemType === 'PLACE';
                if (isPlaceItem) {
                  placeCounter++;
                }
                const currentPlaceNum = placeCounter;

                // Check if item is nested under a Section Header
                let isInsideSection = false;
                let parentSectionKey: string | null = null;
                for (let k = idx - 1; k >= 0; k--) {
                  if (selectedPlaces[k]?.itemType === 'SECTION_HEADER') {
                    isInsideSection = true;
                    parentSectionKey = selectedPlaces[k].id || `sec_key_${k}`;
                    break;
                  }
                }

                // If parent section is collapsed, hide child item
                if (p.itemType !== 'SECTION_HEADER' && parentSectionKey && collapsedSections[parentSectionKey]) {
                  return null;
                }

                // SECTION HEADER ITEM (PROMINENT CONTAINER HEADER - WITH COLLAPSE TOGGLE)
                if (p.itemType === 'SECTION_HEADER') {
                  const secKey = p.id || `sec_key_${idx}`;
                  const isCollapsed = !!collapsedSections[secKey];
                  
                  let childCount = 0;
                  for (let j = idx + 1; j < selectedPlaces.length; j++) {
                    if (selectedPlaces[j]?.itemType === 'SECTION_HEADER') break;
                    childCount++;
                  }

                  return (
                    <div
                      key={secKey}
                      ref={(el) => { itemRefs.current[idx] = el; }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-transform duration-200 ease-out select-none cursor-pointer group bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white border-purple-800 shadow-md mt-2 ${
                        isPicked ? 'opacity-30' : ''
                      } ${
                        isShiftedUp ? '-translate-y-2' : isShiftedDown ? 'translate-y-2' : 'translate-y-0'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCollapsedSections((prev) => ({
                              ...prev,
                              [secKey]: !prev[secKey],
                            }));
                          }}
                          className="p-1 text-purple-300 hover:text-white transition-colors cursor-pointer shrink-0 rounded-lg hover:bg-white/10"
                          title={isCollapsed ? "Mở rộng mục này" : "Thu gọn mục này"}
                        >
                          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <div
                          onPointerDown={(e) => handlePointerDown(e, idx)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          className="cursor-grab active:cursor-grabbing p-1 text-purple-300 hover:text-white shrink-0 touch-none"
                          title="Nắm giữ để kéo thả cả Mục lớn và các mục con"
                        >
                          <GripVertical size={16} />
                        </div>


                        <input
                          type="text"
                          placeholder="Nhập tên mục (VD: Ngày 1: Tham quan trung tâm)..."
                          value={p.customContent || p.name || ''}
                          onChange={(e) => {
                            const updated = [...selectedPlaces];
                            updated[idx] = { ...updated[idx], customContent: e.target.value, name: e.target.value };
                            onSelectedPlacesChange(updated);
                          }}
                          className="flex-1 px-2.5 py-1 bg-white/15 border border-white/20 rounded-lg text-xs font-black text-white placeholder:text-purple-300 focus:ring-1 focus:ring-purple-400 focus:outline-none"
                        />

                        {childCount > 0 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setCollapsedSections((prev) => ({
                                ...prev,
                                [secKey]: !prev[secKey],
                              }));
                            }}
                            className="text-[10px] font-extrabold bg-purple-700/80 hover:bg-purple-600 text-purple-100 px-2 py-0.5 rounded-md shrink-0 cursor-pointer shadow-xs border border-purple-500/50"
                          >
                            {childCount} mục con {isCollapsed ? '►' : '▼'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePlace(p.id)}
                        className="p-1 text-purple-300 hover:text-rose-400 cursor-pointer transition-colors ml-1"
                        title="Xóa mục lớn này"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                }

              // NOTE ITEM
              if (p.itemType === 'NOTE') {
                return (
                  <div
                    key={`note-${p.id || 'n'}-${idx}`}
                    ref={(el) => { itemRefs.current[idx] = el; }}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-transform duration-200 ease-out select-none cursor-pointer group ${
                      isInsideSection ? 'border-l-4 border-l-purple-500 ml-2' : ''
                    } ${
                      isPicked
                        ? 'border-2 border-dashed border-amber-400 bg-amber-100/30 dark:bg-amber-950/20 opacity-30'
                        : 'border-amber-300 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 shadow-2xs'
                    } ${
                      isShiftedUp ? '-translate-y-2' : isShiftedDown ? 'translate-y-2' : 'translate-y-0'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        onPointerDown={(e) => handlePointerDown(e, idx)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="cursor-grab active:cursor-grabbing p-1 text-amber-700 dark:text-amber-300 hover:text-amber-900 shrink-0 touch-none"
                        title="Nắm giữ để kéo thả đổi thứ tự"
                      >
                        <GripVertical size={16} />
                      </div>
                      <span className="font-extrabold text-xs text-amber-900 dark:text-amber-200 shrink-0">
                        📝 Ghi chú:
                      </span>
                      <input
                        type="text"
                        placeholder="Nhập nội dung ghi chú..."
                        value={p.customContent || p.content || ''}
                        onChange={(e) => {
                          const updated = [...selectedPlaces];
                          updated[idx] = { ...updated[idx], customContent: e.target.value, content: e.target.value };
                          onSelectedPlacesChange(updated);
                        }}
                        className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-gray-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePlace(p.id)}
                      className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer transition-colors ml-1"
                      title="Xóa ghi chú"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              }

              const jsonChecklist = parseChecklist(p.customContent || p.content || p.name);

              // CHECKLIST ITEM (WITH FULL INTERACTIVE TASK EDITOR)
              if (p.itemType === 'CHECKLIST' || jsonChecklist) {
                const currentData = jsonChecklist || { title: 'Danh mục công việc mới', items: [] };
                const title = currentData.title || 'Danh mục chuẩn bị / công việc';
                const itemsList = Array.isArray(currentData.items) ? currentData.items : [];

                const updateChkData = (newData: any) => {
                  const updated = [...selectedPlaces];
                  const str = JSON.stringify(newData);
                  updated[idx] = {
                    ...updated[idx],
                    customContent: str,
                    content: str,
                  };
                  onSelectedPlacesChange(updated);
                };

                return (
                  <div
                    key={`chk-${p.id || 'c'}-${idx}`}
                    ref={(el) => { itemRefs.current[idx] = el; }}
                    className={`p-2.5 rounded-xl border flex flex-col gap-2 text-xs transition-transform duration-200 ease-out select-none cursor-pointer group ${
                      isInsideSection ? 'border-l-4 border-l-purple-500 ml-2' : ''
                    } ${
                      isPicked
                        ? 'border-2 border-dashed border-indigo-400 bg-indigo-100/30 opacity-30'
                        : 'border-indigo-300 dark:border-indigo-800/60 bg-indigo-50/70 dark:bg-indigo-950/30 shadow-2xs'
                    } ${
                      isShiftedUp ? '-translate-y-2' : isShiftedDown ? 'translate-y-2' : 'translate-y-0'
                    }`}
                  >
                    {/* Header: Title + Add Task Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          onPointerDown={(e) => handlePointerDown(e, idx)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          className="cursor-grab active:cursor-grabbing p-1 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 shrink-0 touch-none"
                          title="Nắm giữ để kéo thả đổi thứ tự"
                        >
                          <GripVertical size={16} />
                        </div>
                        <span className="font-extrabold text-xs text-indigo-900 dark:text-indigo-200 shrink-0">
                          ☑️ Checklist:
                        </span>
                        <input
                          type="text"
                          value={title}
                          placeholder="Tên danh mục..."
                          onChange={(e) => {
                            updateChkData({ ...currentData, title: e.target.value });
                          }}
                          className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 rounded-lg text-xs font-bold text-indigo-900 dark:text-indigo-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...itemsList, { done: false, text: 'Công việc mới' }];
                            updateChkData({ ...currentData, items: newItems });
                          }}
                          className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors cursor-pointer"
                          title="Thêm công việc mới vào danh mục"
                        >
                          + Thêm việc
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePlace(p.id)}
                          className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer transition-colors ml-1"
                          title="Xóa danh mục này"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Task Lines */}
                    {itemsList.length > 0 && (
                      <div className="space-y-1 pl-7 border-t border-indigo-200/60 dark:border-indigo-900/40 pt-1.5">
                        {itemsList.map((item: any, cIdx: number) => (
                          <div key={cIdx} className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...itemsList];
                                newItems[cIdx] = { ...newItems[cIdx], done: !newItems[cIdx].done };
                                updateChkData({ ...currentData, items: newItems });
                              }}
                              className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold shrink-0 cursor-pointer ${
                                item.done
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-transparent'
                              }`}
                            >
                              ✓
                            </button>
                            <input
                              type="text"
                              value={item.text || ''}
                              onChange={(e) => {
                                const newItems = [...itemsList];
                                newItems[cIdx] = { ...newItems[cIdx], text: e.target.value };
                                updateChkData({ ...currentData, items: newItems });
                              }}
                              className={`flex-1 px-2 py-0.5 bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-slate-800 rounded-md text-[11px] text-gray-900 dark:text-slate-100 ${
                                item.done ? 'line-through text-gray-400' : 'font-semibold'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = itemsList.filter((_: any, i: number) => i !== cIdx);
                                updateChkData({ ...currentData, items: newItems });
                              }}
                              className="p-0.5 text-gray-400 hover:text-rose-600 cursor-pointer"
                              title="Xóa công việc này"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // PLACE ITEM (DEFAULT)
              return (
                <div
                  key={`place-${p.id || 'p'}-${idx}`}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  onClick={() => setViewingPlaceDetail(p)}
                  className={`p-2 rounded-xl border flex flex-col gap-1 text-xs transition-transform duration-200 ease-out select-none cursor-pointer group ${
                    isInsideSection ? 'border-l-4 border-l-purple-500 ml-2' : ''
                  } ${
                    isPicked
                      ? 'border-2 border-dashed border-purple-400 bg-purple-100/30 dark:bg-purple-950/20 opacity-30'
                      : 'border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 hover:border-purple-300 shadow-2xs'
                  } ${
                    isShiftedUp
                      ? '-translate-y-2 border-purple-300 dark:border-purple-800'
                      : isShiftedDown
                      ? 'translate-y-2 border-purple-300 dark:border-purple-800'
                      : 'translate-y-0'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Drag Grip Handle */}
                      <div
                        onPointerDown={(e) => handlePointerDown(e, idx)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-purple-600 shrink-0 touch-none transition-colors"
                        title="Nắm giữ để kéo thả đổi thứ tự"
                      >
                        <GripVertical size={16} />
                      </div>

                      {/* Sequence Number */}
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                        {currentPlaceNum}
                      </span>

                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-7 h-7 rounded-lg object-cover shrink-0 border border-purple-200"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                          <MapPin size={13} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-gray-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors truncate block">
                          {p.name}
                        </span>
                        {p.rating && (
                          <span className="text-amber-500 font-bold text-[10px]">⭐ {p.rating}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* View Detail Eye Button */}
                      <button
                        type="button"
                        title="Xem chi tiết địa điểm"
                        onClick={() => setViewingPlaceDetail(p)}
                        className="p-1 text-gray-400 hover:text-purple-600 cursor-pointer transition-colors"
                      >
                        <Eye size={13} />
                      </button>

                      {/* Set Cover Button */}
                      {onCoverImageChange && p.image && coverImage !== p.image && (
                        <button
                          type="button"
                          title="Đặt ảnh địa điểm này làm ảnh bìa"
                          onClick={() => onCoverImageChange(p.image)}
                          className="px-2 py-0.5 text-[10px] font-bold bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-md hover:bg-purple-100 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <ImageIcon size={10} /> Ảnh bìa
                        </button>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemovePlace(p.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer transition-colors"
                        title="Xóa địa điểm khỏi bài"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Custom Content Note Input for this place */}
                  <div className="pl-7 pr-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      placeholder={
                        p.description
                          ? `Nội dung riêng (Mặc định: ${p.description.substring(0, 35)}...)`
                          : 'Nhập mô tả/nội dung riêng cho địa điểm này...'
                      }
                      value={p.customContent || ''}
                      onChange={(e) => {
                        const updated = [...selectedPlaces];
                        updated[idx] = { ...updated[idx], customContent: e.target.value };
                        onSelectedPlacesChange(updated);
                      }}
                      className="w-full px-2.5 py-1 bg-white dark:bg-slate-950 border border-purple-200 dark:border-purple-900/40 rounded-lg text-[11px] text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              );
            });
          })()}
          </div>
        ) : (
          <div className="p-3 rounded-xl border border-dashed border-gray-200 dark:border-slate-800 text-center text-xs text-gray-400">
            Chưa có cấu trúc hay địa điểm nào trong bài viết.
          </div>
        )}

        {/* Floating Drag Proxy Card - Exact 1:1 Match with List Item Cards */}
        {startIndex !== null && activeDragItem && dragPointerPos && (
          <div
            className="fixed pointer-events-none z-[99999] p-2 rounded-xl border-2 border-purple-600 bg-white dark:bg-slate-900 shadow-2xl flex items-center justify-between text-xs opacity-95 transition-none backdrop-blur-xs"
            style={{
              left: `${dragPointerPos.x - (draggedCardRect?.offsetX || 30)}px`,
              top: `${dragPointerPos.y - 20}px`,
              width: draggedCardRect?.width ? `${draggedCardRect.width}px` : 'auto',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 text-purple-600 shrink-0">
                <GripVertical size={16} />
              </div>
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                {(targetIndex !== null ? targetIndex : startIndex) + 1}
              </span>
              {activeDragItem.image ? (
                <img
                  src={activeDragItem.image}
                  alt={activeDragItem.name}
                  className="w-7 h-7 rounded-lg object-cover shrink-0 border border-purple-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                  <MapPin size={13} />
                </div>
              )}
              <div className="min-w-0">
                <span className="font-bold text-xs text-gray-900 dark:text-slate-100 truncate block">
                  {activeDragItem.name}
                </span>
                {activeDragItem.rating && (
                  <span className="text-amber-500 font-bold text-[10px]">⭐ {activeDragItem.rating}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onCoverImageChange && activeDragItem.image && coverImage !== activeDragItem.image && (
                <div className="px-2 py-0.5 text-[10px] font-bold bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-md flex items-center gap-1">
                  <ImageIcon size={10} /> Ảnh bìa
                </div>
              )}
              <div className="p-1 text-gray-400">
                <X size={14} />
              </div>
            </div>
          </div>
        )}
      </div>{/* end right column */}
      </div>{/* end flex row */}

      {/* Place Detail Modal */}
      {viewingPlaceDetail && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-200 cursor-default"
          onClick={() => setViewingPlaceDetail(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Image */}
            <div className="relative h-48 bg-purple-100 dark:bg-purple-950 shrink-0">
              {viewingPlaceDetail.image ? (
                <img
                  src={viewingPlaceDetail.image}
                  alt={viewingPlaceDetail.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-purple-400">
                  <MapPin size={40} />
                  <span className="text-xs font-bold mt-1">Chưa có hình ảnh địa điểm</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setViewingPlaceDetail(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
              {(viewingPlaceDetail.category?.name || viewingPlaceDetail.categoryName || viewingPlaceDetail.category) && (
                <span className="absolute top-3 left-3 px-3 py-1 bg-purple-600/90 text-white font-bold text-[10px] rounded-xl backdrop-blur-xs shadow-xs">
                  {typeof viewingPlaceDetail.category === 'object'
                    ? viewingPlaceDetail.category?.name
                    : viewingPlaceDetail.categoryName || viewingPlaceDetail.category}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-3.5 overflow-y-auto">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-extrabold text-base text-gray-900 dark:text-slate-100">
                  {viewingPlaceDetail.name}
                </h3>
                {viewingPlaceDetail.rating && (
                  <span className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs shrink-0">
                    ⭐ {viewingPlaceDetail.rating}
                    {viewingPlaceDetail.userRatingCount && (
                      <span className="text-[10px] opacity-75 font-normal">
                        ({viewingPlaceDetail.userRatingCount})
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* Address */}
              {viewingPlaceDetail.address && (
                <div className="flex items-start gap-2 text-gray-600 dark:text-slate-300">
                  <MapPin size={15} className="text-purple-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{viewingPlaceDetail.address}</span>
                </div>
              )}

              {/* Phone & Website & Google Maps */}
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-gray-100 dark:border-slate-800 text-[11px]">
                {viewingPlaceDetail.phone && (
                  <a
                    href={`tel:${viewingPlaceDetail.phone}`}
                    className="text-purple-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    📞 {viewingPlaceDetail.phone}
                  </a>
                )}
                {viewingPlaceDetail.website && (
                  <a
                    href={viewingPlaceDetail.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-semibold hover:underline flex items-center gap-1 truncate max-w-[200px]"
                  >
                    🌐 Website
                  </a>
                )}
                {viewingPlaceDetail.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      viewingPlaceDetail.name + ' ' + viewingPlaceDetail.address
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    🗺️ Xem trên Google Maps
                  </a>
                )}
              </div>

              {/* Description */}
              {viewingPlaceDetail.description && (
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                  <h5 className="font-bold text-gray-700 dark:text-slate-300 mb-1 text-[11px] uppercase tracking-wider">
                    Mô tả địa điểm
                  </h5>
                  <p className="text-gray-600 dark:text-slate-400 leading-relaxed text-xs whitespace-pre-line">
                    {viewingPlaceDetail.description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 flex justify-end items-center gap-2 shrink-0">
              {selectedPlaces.some((sp) => sp.id === viewingPlaceDetail.id) ? (
                <button
                  type="button"
                  onClick={() => {
                    handleRemovePlace(viewingPlaceDetail.id);
                    setViewingPlaceDetail(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Xóa khỏi bài viết
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleAddPlace(viewingPlaceDetail);
                    setViewingPlaceDetail(null);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  + Thêm vào bài viết
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingPlaceDetail(null)}
                className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-slate-900 cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
