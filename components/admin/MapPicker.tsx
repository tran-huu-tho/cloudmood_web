"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ lat, lng, onChange }: MapPickerProps) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return lat && lng ? <Marker position={[lat, lng]} /> : null;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  useEffect(() => {
    // Fix for missing marker icons in leaflet with Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  const defaultCenter: [number, number] = lat && lng ? [lat, lng] : [10.03022, 105.78753]; // default to Can Tho

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200 shadow-inner relative z-10">
      <MapContainer 
        center={defaultCenter} 
        zoom={lat && lng ? 14 : 10} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <LocationMarker lat={lat} lng={lng} onChange={onChange} />
      </MapContainer>
      <div className="absolute bottom-2 right-2 bg-white/95 px-2 py-1 rounded text-[10px] text-gray-500 font-medium z-[1000] border border-gray-200 shadow-sm pointer-events-none">
        Click map to pick coordinates
      </div>
    </div>
  );
}
