"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Loader2, X, MapPin } from 'lucide-react';

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

function cleanLocationName(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .replace(/\s*\(?\b\d{4,6}\b\)?\s*,?/gi, '')
    .replace(/,\s*,/g, ',')
    .replace(/^,\s*|\s*,$/g, '')
    .trim();
}

function LocationMarker({ lat, lng, onChange }: MapPickerProps) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return lat && lng ? <Marker position={[lat, lng]} /> : null;
}

function MapCenterController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 16, { animate: true, duration: 1 });
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // Fix for missing marker icons in leaflet with Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // Debounced auto-search on typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=vi`
      );
      const data = await res.json();
      setSearchResults(data || []);
      setShowResults((data || []).length > 0);
    } catch (err) {
      console.error('Lỗi tìm kiếm địa điểm:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (item: any) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);
    if (!isNaN(newLat) && !isNaN(newLng)) {
      setMapCenter([newLat, newLng]);
      onChange(newLat, newLng);
      setShowResults(false);
      setSearchQuery(cleanLocationName(item.display_name).split(',')[0]);
    }
  };

  const defaultCenter: [number, number] = lat && lng ? [lat, lng] : [10.03022, 105.78753]; // default to Can Tho

  if (!isMounted) {
    return (
      <div className="w-full h-full min-h-[260px] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
        Đang tải bản đồ...
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[260px] rounded-lg overflow-hidden border border-gray-200 shadow-inner relative z-10">
      {/* Floating Search Bar positioned on top-right */}
      <div className="absolute top-2.5 right-2.5 z-[1000] w-64 sm:w-72">
        <div className="relative flex items-center bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 overflow-hidden px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm địa điểm, tên đường..."
            className="w-full text-xs text-gray-800 bg-transparent focus:outline-none placeholder:text-gray-400"
          />
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0 ml-1" />
          ) : searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowResults(false);
              }}
              className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 shrink-0 ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectResult(item)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-start gap-2 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span className="text-gray-700 line-clamp-2">{cleanLocationName(item.display_name)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <MapContainer 
        key={`map-container-${defaultCenter[0]}-${defaultCenter[1]}`}
        center={defaultCenter} 
        zoom={lat && lng ? 14 : 10} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />
        <LocationMarker lat={lat} lng={lng} onChange={onChange} />
        <MapCenterController center={mapCenter} />
      </MapContainer>
      <div className="absolute bottom-2 right-2 bg-white/95 px-2 py-1 rounded text-[10px] text-gray-500 font-medium z-[1000] border border-gray-200 shadow-sm pointer-events-none">
        Click bản đồ để ghim vị trí chính xác
      </div>
    </div>
  );
}
