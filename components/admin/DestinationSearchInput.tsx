'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

export interface DestinationSearchResult {
  name: string;
  displayName?: string;
  isFromDb?: boolean;
}

interface DestinationSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  dbPlaces?: any[];
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

// Cần Thơ is strictly #1 at the top of popular destinations
const POPULAR_VIETNAM_DESTINATIONS = [
  'Cần Thơ',
  'Đà Nẵng',
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Phú Quốc',
  'Đà Lạt',
  'Nha Trang',
  'Hội An',
  'Sa Pa',
  'Huế',
  'Quy Nhơn',
  'Vũng Tàu',
  'Phan Thiết',
  'Ninh Bình',
  'Bến Tre',
  'An Giang',
  'Bình Dương',
  'Đồng Nai',
  'Long An',
  'Hải Phòng',
  'Quảng Ninh',
  'Quảng Nam',
  'Lâm Đồng',
  'Kiên Giang',
  'Cần Giờ',
  'Cần Giuộc',
  'Bạc Liêu',
  'Cà Mau',
  'Đồng Tháp',
  'Tiền Giang',
  'Vĩnh Long',
  'Khánh Hòa',
  'Bình Thuận',
  'Thừa Thiên Huế',
];

function isAdministrativeRegion(item: any): boolean {
  const pClass = (item.class || '').toLowerCase();
  const pType = (item.type || '').toLowerCase();

  // Exclude specific venues, buildings, schools, shops, POIs, highways, addresses
  const excludedClasses = [
    'amenity',
    'shop',
    'tourism',
    'building',
    'leisure',
    'craft',
    'office',
    'historic',
    'highway',
    'railway',
    'man_made',
    'landuse',
  ];
  if (excludedClasses.includes(pClass)) return false;

  const excludedTypes = [
    'school',
    'university',
    'kindergarten',
    'college',
    'hospital',
    'clinic',
    'restaurant',
    'hotel',
    'cafe',
    'fast_food',
    'bar',
    'bus_stop',
    'station',
    'bank',
    'atm',
    'pharmacy',
    'supermarket',
    'convenience',
    'house',
    'residential',
    'primary',
    'secondary',
    'road',
    'street',
    'tertiary',
    'unclassified',
    'service',
  ];
  if (excludedTypes.includes(pType)) return false;

  // Must be an administrative division or place (city, town, province, district, region, island, suburb...)
  if (pClass === 'boundary' || pClass === 'place') return true;

  const allowedTypes = [
    'administrative',
    'city',
    'town',
    'province',
    'state',
    'district',
    'county',
    'island',
    'suburb',
    'locality',
    'region',
    'village',
    'municipality',
  ];
  return allowedTypes.includes(pType);
}

export default function DestinationSearchInput({
  value,
  onChange,
  placeholder = 'Nhập tên thành phố/tỉnh (VD: Cần Thơ, Đà Nẵng...)...',
  label = 'Điểm đến',
  required = false,
  dbPlaces = [],
}: DestinationSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<DestinationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const performSearch = useCallback(
    async (query: string) => {
      setIsSearching(true);
      try {
        const trimmed = query.trim();
        const normQuery = removeAccents(trimmed);
        const results: DestinationSearchResult[] = [];
        const seenNames = new Set<string>();

        // 1. Gather ONLY clean region/city candidates (DB place destinations + popular Vietnam regions)
        const localCandidatesSet = new Set<string>();

        // Add Cần Thơ & popular Vietnam cities first
        POPULAR_VIETNAM_DESTINATIONS.forEach((d) => localCandidatesSet.add(d));

        // Add DB place destinations if non-empty
        if (dbPlaces && dbPlaces.length > 0) {
          dbPlaces.forEach((p) => {
            if (p.destination && typeof p.destination === 'string' && p.destination.trim()) {
              localCandidatesSet.add(p.destination.trim());
            }
          });
        }

        // Filter local candidates matching normQuery
        const matchedLocal: DestinationSearchResult[] = [];
        Array.from(localCandidatesSet).forEach((destName) => {
          const normDest = removeAccents(destName);
          if (!normQuery || normDest.includes(normQuery)) {
            const key = destName.toLowerCase();
            if (!seenNames.has(key)) {
              seenNames.add(key);
              matchedLocal.push({
                name: destName,
                displayName: `${destName}, Việt Nam`,
                isFromDb: true,
              });
            }
          }
        });

        // Sort candidates:
        // When query is empty -> Preserve POPULAR_VIETNAM_DESTINATIONS order (Cần Thơ is STRICTLY #1)
        // When query is typed -> Cần Thơ first if matched, then exact prefix matches
        if (!normQuery) {
          matchedLocal.sort((a, b) => {
            const idxA = POPULAR_VIETNAM_DESTINATIONS.indexOf(a.name);
            const idxB = POPULAR_VIETNAM_DESTINATIONS.indexOf(b.name);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.name.localeCompare(b.name, 'vi');
          });
        } else {
          matchedLocal.sort((a, b) => {
            if (a.name === 'Cần Thơ' && removeAccents('Cần Thơ').includes(normQuery)) return -1;
            if (b.name === 'Cần Thơ' && removeAccents('Cần Thơ').includes(normQuery)) return 1;
            const normA = removeAccents(a.name);
            const normB = removeAccents(b.name);
            const startsA = normA.startsWith(normQuery);
            const startsB = normB.startsWith(normQuery);
            if (startsA && !startsB) return -1;
            if (!startsA && startsB) return 1;
            return a.name.localeCompare(b.name, 'vi');
          });
        }

        results.push(...matchedLocal);

        // 2. Fetch real-time locations from OpenStreetMap Nominatim API (Strictly Vietnam + Administrative regions ONLY)
        if (trimmed.length >= 2) {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                trimmed
              )}&countrycodes=vn&accept-language=vi&format=json&addressdetails=1&limit=10`,
              {
                headers: {
                  'User-Agent': 'CloudMoodWeb/1.0',
                },
              }
            );

            if (res.ok) {
              const data = await res.json();
              const filtered = (Array.isArray(data) ? data : []).filter(isAdministrativeRegion);

              filtered.forEach((item: any) => {
                const addr = item.address || {};
                const cleanName = (
                  item.name ||
                  addr.city ||
                  addr.state ||
                  addr.town ||
                  addr.county ||
                  item.display_name.split(',')[0]
                ).trim();
                const key = cleanName.toLowerCase();

                if (cleanName && !seenNames.has(key)) {
                  seenNames.add(key);
                  results.push({
                    name: cleanName,
                    displayName: item.display_name,
                    isFromDb: false,
                  });
                }
              });
            }
          } catch (err) {
            console.error('Lỗi khi tra cứu Nominatim OpenStreetMap:', err);
          }
        }

        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    },
    [dbPlaces]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setIsOpen(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      performSearch(val);
    }, 300);
  };

  const handleFocus = () => {
    setIsOpen(true);
    performSearch(value);
  };

  const handleSelect = (destName: string) => {
    onChange(destName);
    setIsOpen(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          required={required}
          placeholder={placeholder}
          value={value}
          onFocus={handleFocus}
          onChange={handleInputChange}
          className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 p-2 bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-900/60 rounded-xl shadow-xl space-y-1 z-40 max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 dark:border-slate-800 pb-1 mb-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              {value.trim() ? 'Địa điểm tìm kiếm' : 'Gợi ý điểm đến'}
            </span>
            {isSearching && (
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium animate-pulse">
                Đang tìm...
              </span>
            )}
          </div>

          {isSearching && searchResults.length === 0 ? (
            <div className="py-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
              Đang tra cứu địa điểm...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(item.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all flex flex-col justify-center cursor-pointer border ${
                    value === item.name
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200'
                      : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-gray-900 dark:text-slate-100">
                      {item.name}
                    </span>
                  </div>
                  {item.displayName && item.displayName !== item.name && (
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
                      {item.displayName}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-3 text-center text-xs text-gray-400">
              Không tìm thấy địa điểm phù hợp
            </div>
          )}
        </div>
      )}
    </div>
  );
}
