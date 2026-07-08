"use client";

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function ScrollHandler({ isCtrlDown }: { isCtrlDown: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (isCtrlDown) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  }, [isCtrlDown, map]);
  return null;
}

export default function Map() {
  const [isCtrlDown, setIsCtrlDown] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fix for missing marker icons in leaflet with Next.js/Webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setIsCtrlDown(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setIsCtrlDown(false);
    };
    const handleBlur = () => {
      setIsCtrlDown(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) {
      setShowMessage(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShowMessage(false), 1500);
    }
  };

  // Default center (e.g., Riga as in the design)
  const position: [number, number] = [56.9496, 24.1052];

  return (
    <div className="relative w-full h-full" onWheel={handleWheel}>
      <div 
        className={`absolute inset-0 bg-black/40 z-[1000] flex items-center justify-center text-white text-3xl font-normal transition-opacity duration-300 pointer-events-none ${showMessage ? 'opacity-100' : 'opacity-0'}`}
      >
        Use ctrl + scroll to zoom the map
      </div>
      <MapContainer 
        center={position} 
        zoom={11} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      >
        <ScrollHandler isCtrlDown={isCtrlDown} />
        {/* Light theme tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <Marker position={position}>
          <Popup>
            <div className="text-gray-800">
              <strong>Adminator HQ</strong><br />
              Riga, Latvia
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
