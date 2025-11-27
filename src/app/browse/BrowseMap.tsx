"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AccommodationLocation {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  latitude?: number;
  longitude?: number;
  verified: boolean;
}

interface BrowseMapProps {
  accommodations: AccommodationLocation[];
}

export default function BrowseMap({ accommodations }: BrowseMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const router = useRouter();
  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationLocation | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Filter accommodations with valid coordinates
    const validAccommodations = accommodations.filter(
      acc => acc.latitude && acc.longitude
    );

    if (validAccommodations.length === 0) {
      return;
    }

    // Default center (Baguio City coordinates)
    const defaultCenter: [number, number] = [16.4023, 120.5960];
    
    // Initialize map
    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create custom icon for markers
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: #1078CF;
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          white-space: nowrap;
          cursor: pointer;
          border: 2px solid white;
        ">
          ₱
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    // Add markers for each accommodation
    const markers: L.Marker[] = [];
    validAccommodations.forEach((acc) => {
      if (acc.latitude && acc.longitude) {
        const marker = L.marker([acc.latitude, acc.longitude], { icon: customIcon })
          .addTo(map);

        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <img src="${acc.image}" alt="${acc.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${acc.name}</div>
            <div style="color: #666; font-size: 12px; margin-bottom: 4px;">📍 ${acc.location}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
              <div>
                <span style="font-weight: bold; font-size: 16px;">₱${acc.price.toLocaleString()}</span>
                <span style="color: #666; font-size: 12px;"> per night</span>
              </div>
              <div style="color: #F59E0B; font-size: 12px;">⭐ ${acc.rating}</div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        // Add click event to navigate to property
        marker.on('click', () => {
          setSelectedAccommodation(acc);
        });

        markers.push(marker);
      }
    });

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [accommodations]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full min-h-[600px] rounded-xl overflow-hidden shadow-lg" />
      
      {/* Selected Accommodation Card Overlay */}
      {selectedAccommodation && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full mx-4 z-[1000]">
          <button
            onClick={() => setSelectedAccommodation(null)}
            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative w-full h-40">
            <Image 
              src={selectedAccommodation.image} 
              alt={selectedAccommodation.name} 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            {selectedAccommodation.verified && (
              <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                ✓ Verified
              </div>
            )}
          </div>
          
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 font-lexend">{selectedAccommodation.name}</h3>
              <div className="flex items-center text-yellow-500">
                <span className="text-sm mr-1">⭐</span>
                <span className="text-sm font-medium text-gray-700">{selectedAccommodation.rating}</span>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 font-lexend">📍 {selectedAccommodation.location}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-baseline">
                <span className="text-xl font-bold text-gray-900 font-lexend">₱{selectedAccommodation.price.toLocaleString()}</span>
                <span className="text-gray-500 text-sm ml-1">per night</span>
              </div>
              <button 
                onClick={() => router.push(`/PropertyListing#${selectedAccommodation.id}`)}
                className="bg-[#1078CF] hover:bg-blue-600 text-white px-5 py-2 rounded-xl font-medium transition-colors duration-200 font-lexend"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
