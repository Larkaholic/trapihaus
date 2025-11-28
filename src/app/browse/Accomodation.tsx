"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import AppImage from '../components/ui/AppImage';
import { getApprovedListings } from '@/lib/services/listings';
import type { PropertyListing } from '@/types/listing';
import type { SearchParams } from './page';

// Dynamically import BrowseMap to avoid SSR issues with Leaflet
const BrowseMap = dynamic(() => import('./BrowseMap'), { ssr: false });

interface AccommodationCardProps {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  verified: boolean;
  guests: number;
  propertyType: string;
  minStay?: string;
  maxStay?: string;
  amenities?: string[];
  bedrooms?: number;
  bathrooms?: number;
  availability?: string;
  latitude?: number;
  longitude?: number;
}

const AccommodationCard = ({ id, name, location, price, rating, image, verified }: AccommodationCardProps) => {
  const router = useRouter();
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative w-full h-48">
        <AppImage src={image} alt={name} fillParent className="object-cover" />
        {verified && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            ✓ Verified
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 font-lexend">{name}</h3>
          <div className="flex items-center text-yellow-500">
            <span className="text-sm mr-1">⭐</span>
            <span className="text-sm font-medium text-gray-700">{rating}</span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 font-lexend">📍 {location}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900 font-lexend">₱{price.toLocaleString()}</span>
            <span className="text-gray-500 text-sm ml-1">per night</span>
          </div>
          <button 
            onClick={() => router.push(`/PropertyListing#${id}`)}
            className="bg-[#1078CF] hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-medium transition-colors duration-200 font-lexend"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

interface AccommodationProps {
  searchParams: SearchParams;
}

export default function Accommodation({ searchParams }: AccommodationProps) {
  const [selectedPropertyType, setSelectedPropertyType] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [rooms, setRooms] = useState(0);
  const [beds, setBeds] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [bookingOptions, setBookingOptions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Fetch listings from Firestore
  const [accommodations, setAccommodations] = useState<AccommodationCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const listings = await getApprovedListings();
        
        // Transform PropertyListing to AccommodationCardProps
        const transformed: AccommodationCardProps[] = listings.map((listing: PropertyListing) => ({
          id: listing.id,
          name: listing.propertyName,
          location: `${listing.barangay}, ${listing.city}`,
          price: parseInt(listing.rate.replace(/[^0-9]/g, "")) || 0,
          rating: listing.averageRating || 4.5,
          latitude: listing.latitude,
          longitude: listing.longitude,
          image: listing.coverPhoto || listing.photos?.[0] || '/placeholder-image.jpg',
          verified: listing.status === "approved",
          guests: listing.guests || 1,
          propertyType: listing.propertyType || 'hotel',
          minStay: listing.minStay,
          maxStay: listing.maxStay,
          amenities: listing.amenities || [],
          bedrooms: listing.bedrooms || 0,
          bathrooms: listing.bathrooms || 0,
          availability: listing.availability || 'Available for Booking',
        }));
        
        setAccommodations(transformed);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
        setError("Failed to load accommodations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Filter accommodations based on search params AND sidebar filters
  const filteredAccommodations = useMemo(() => {
    if (!accommodations.length) return [];

    return accommodations.filter((accommodation) => {
      // Filter by property type from search params (only when search is performed)
      if (searchParams.propertyType) {
        const searchType = searchParams.propertyType.toLowerCase();
        const accomType = (accommodation.propertyType || 'hotel').toLowerCase();
        
        // Map plural search terms to singular property types
        const typeMapping: Record<string, string[]> = {
          'hotel': ['hotels', 'hotel'],
          'apartment': ['apartments', 'apartment'],
          'transient': ['transients', 'transient']
        };
        
        // Check if accommodation type matches search type
        let typeMatches = false;
        for (const [key, values] of Object.entries(typeMapping)) {
          if (values.includes(searchType) && accomType === key) {
            typeMatches = true;
            break;
          }
        }
        
        if (!typeMatches) return false;
      }

      // Filter by sidebar property type selection (independent of search)
      if (selectedPropertyType !== 'All') {
        const sidebarType = selectedPropertyType.toLowerCase();
        const accomType = (accommodation.propertyType || 'hotel').toLowerCase();
        if (accomType !== sidebarType) return false;
      }

      // Filter by location (search in location string)
      if (searchParams.location) {
        const locationLower = accommodation.location.toLowerCase();
        const searchLower = searchParams.location.toLowerCase();
        if (!locationLower.includes(searchLower)) return false;
      }

      // Filter by number of guests
      if (searchParams.guests) {
        // Handle "5+" guests option
        let guestCount = 0;
        if (searchParams.guests === '5+') {
          guestCount = 5;
        } else {
          guestCount = parseInt(searchParams.guests) || 0;
        }
        if (accommodation.guests < guestCount) return false;
      }

      // Filter by check-in and check-out dates (validate date range)
      if (searchParams.checkIn && searchParams.checkOut) {
        const checkInDate = new Date(searchParams.checkIn);
        const checkOutDate = new Date(searchParams.checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day

        // Validate dates are in the future and check-out is after check-in
        if (checkInDate < today || checkOutDate <= checkInDate) {
          return false;
        }

        // Calculate stay duration in nights
        const stayDuration = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

        // Parse minStay and maxStay from accommodation data
        // Examples: "1 Night", "3 Days", "1 Week", "1 Month"
        const parseStayDuration = (stayStr: string): number => {
          const match = stayStr.match(/(\d+)\s*(night|day|week|month)/i);
          if (!match) return 0;
          
          const value = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          
          if (unit === 'night' || unit === 'day') return value;
          if (unit === 'week') return value * 7;
          if (unit === 'month') return value * 30;
          
          return 0;
        };

        // Check if the stay duration is within min/max constraints
        // Note: These fields might not exist on all listings yet
        // We'll make this check optional
        const minNights = accommodation.minStay ? parseStayDuration(accommodation.minStay) : 0;
        const maxNights = accommodation.maxStay ? parseStayDuration(accommodation.maxStay) : 365; // Default to 1 year max

        if (stayDuration < minNights || stayDuration > maxNights) {
          return false;
        }
      }

      // Filter by price range
      if (accommodation.price < priceRange[0] || accommodation.price > priceRange[1]) {
        return false;
      }

      // Filter by minimum rating
      if (minRating > 0 && accommodation.rating < minRating) {
        return false;
      }

      // Filter by rooms (bedrooms), beds, bathrooms
      if (rooms > 0 && (accommodation.bedrooms || 0) < rooms) {
        return false;
      }
      if (beds > 0 && (accommodation.bedrooms || 0) < beds) {
        return false;
      }
      if (bathrooms > 0 && (accommodation.bathrooms || 0) < bathrooms) {
        return false;
      }

      // Filter by selected amenities (all must be present)
      if (selectedAmenities.length > 0) {
        const accomAmenities = (accommodation.amenities || []).map(a => a.toLowerCase());
        const hasAllAmenities = selectedAmenities.every(selectedAmenity => 
          accomAmenities.some(accomAmenity => 
            accomAmenity.includes(selectedAmenity.toLowerCase())
          )
        );
        if (!hasAllAmenities) return false;
      }

      // Filter by booking options
      if (bookingOptions.length > 0) {
        // Instant Booking: Check if property is immediately available
        if (bookingOptions.includes('Instant Booking')) {
          if (accommodation.availability !== 'Available for Booking') return false;
        }
        
        // Free Cancellation: For now, assume all approved listings have free cancellation
        // This could be enhanced with a dedicated field in the listing data
        if (bookingOptions.includes('Free Cancellation')) {
          // All approved listings currently have free cancellation for 24 hours
          // No filter needed as it's a standard feature
        }
        
        // Online Payment: Check if property accepts online payment
        // For now, assume all properties accept online payment
        if (bookingOptions.includes('Online Payment')) {
          // All listings support online payment
          // No filter needed
        }
        
        // Early check-in available: Filter could be based on custom field
        // For now, we'll treat this as available for all properties
        if (bookingOptions.includes('Early check-in available')) {
          // This could be enhanced with a dedicated field in future
          // No filter needed currently
        }
      }

      return true;
    });
  }, [accommodations, searchParams, selectedPropertyType, priceRange, minRating, rooms, beds, bathrooms, selectedAmenities, bookingOptions]);

  const propertyTypes = ['All', 'Hotel', 'Apartment', 'Transient'];
  const amenities = [
    { name: 'Wi-Fi', icon: '📶' },
    { name: 'Parking', icon: '🅿️' },
    { name: 'Pool', icon: '🏊' },
    { name: 'Air Conditioning', icon: '❄️' },
    { name: 'Heating', icon: '🔥' },
    { name: 'Pet Friendly', icon: '🐕' },
    { name: 'Kitchen', icon: '🍳' },
    { name: 'TV', icon: '📺' },
    { name: 'Refrigerator', icon: '🧊' },
    { name: 'Hot tub', icon: '🛁' },
    { name: 'Washing Machine', icon: '🧺' },
    { name: 'Breakfast', icon: '🍳' },
    { name: 'Room service', icon: '🛎️' }
  ];
  const ratings = [5, 4, 3, 2, 1];
  const bookingOptionsList = ['Instant Booking', 'Free Cancellation', 'Online Payment', 'Early check-in available'];

  const toggleAmenity = (amenityName: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityName) 
        ? prev.filter(a => a !== amenityName)
        : [...prev, amenityName]
    );
  };

  const toggleBookingOption = (option: string) => {
    setBookingOptions(prev => 
      prev.includes(option) 
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  return (
    <div className="bg-gray-50">
      <div className="max-full mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Results Section */}
          <div className="lg:col-span-3 lg:order-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[40px] font-extrabold text-[#1078CF] font-lexend">
                  {loading ? "Loading..." : `${filteredAccommodations.length} accommodation${filteredAccommodations.length !== 1 ? 's' : ''} found`}
                </h1>
                <p className="text-[#9E9E9E] font-lexend text-[24px]">Stays in Baguio City with trusted local hosts</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 border rounded-lg font-lexend transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-[#1078CF] text-white border-[#1078CF]' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  📋 List
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 border rounded-lg font-lexend transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-[#1078CF] text-white border-[#1078CF]' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  🗺️ Map
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {/* {(searchParams.location || searchParams.checkIn || searchParams.checkOut || searchParams.guests) && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-2 font-lexend">Active Filters:</h3>
                <div className="flex flex-wrap gap-2">
                  {searchParams.location && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-sm font-medium text-gray-700 border border-blue-300 font-lexend">
                      📍 {searchParams.location}
                    </span>
                  )}
                  {searchParams.checkIn && searchParams.checkOut && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-sm font-medium text-gray-700 border border-blue-300 font-lexend">
                      📅 {new Date(searchParams.checkIn).toLocaleDateString()} - {new Date(searchParams.checkOut).toLocaleDateString()}
                      {(() => {
                        const checkInDate = new Date(searchParams.checkIn);
                        const checkOutDate = new Date(searchParams.checkOut);
                        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
                        return ` (${nights} night${nights !== 1 ? 's' : ''})`;
                      })()}
                    </span>
                  )}
                  {searchParams.guests && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-sm font-medium text-gray-700 border border-blue-300 font-lexend">
                      👥 {searchParams.guests === '5+' ? '5+ guests' : `${searchParams.guests} guest${searchParams.guests !== '1' ? 's' : ''}`}
                    </span>
                  )}
                </div>
              </div>
            )} */}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1078CF]"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 font-lexend">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredAccommodations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-lexend font-semibold text-gray-900 mb-2">No accommodations found</h3>
                <p className="text-sm text-gray-600 font-lexend">
                  {accommodations.length > 0 
                    ? "Try adjusting your search filters to see more results."
                    : "No listings available. Check back later."}
                </p>
              </div>
            )}

            {/* Accommodations Grid or Map View */}
            {!loading && !error && filteredAccommodations.length > 0 && (
              viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredAccommodations.map((accommodation) => (
                    <AccommodationCard key={accommodation.id} {...accommodation} />
                  ))}
                </div>
              ) : (
                <div className="w-full">
                  <BrowseMap accommodations={filteredAccommodations} />
                </div>
              )
            )}
          </div>

          {/* Filters Sidebar */}
          <div className="lg:col-span-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-6 font-lexend">Filter by:</h2>
              
              {/* Property Type */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4 font-lexend">Property Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {propertyTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedPropertyType(type)}
                      className={`px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 font-lexend ${
                        selectedPropertyType === type
                          ? 'bg-[#83C12C] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Range */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4 font-lexend">Your Budget For Per Night</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #83C12C 0%, #83C12C ${(priceRange[1] / 10000) * 100}%, #e5e7eb ${(priceRange[1] / 10000) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <div 
                      className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-[#83C12C] rounded-full border-4 border-white shadow-lg pointer-events-none"
                      style={{ left: `calc(${(priceRange[1] / 10000) * 100}% - 12px)` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Min Price ₱"
                        value={priceRange[0] || ''}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-lexend placeholder-gray-400 focus:ring-2 focus:ring-[#83C12C] focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Max Price ₱"
                        value={priceRange[1] || ''}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-lexend placeholder-gray-400 focus:ring-2 focus:ring-[#83C12C] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rooms, Beds, Bathrooms */}
              <div className="mb-6 space-y-4">
                {[
                  { label: 'Rooms', value: rooms, setter: setRooms },
                  { label: 'Beds', value: beds, setter: setBeds },
                  { label: 'Bathrooms', value: bathrooms, setter: setBathrooms }
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold font-lexend">{label}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setter(Math.max(0, value - 1))}
                          className="w-10 h-10 border border-gray-300 rounded-[10px] flex items-center justify-center hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-lexend">{value}</span>
                        <button
                          onClick={() => setter(value + 1)}
                          className="w-10 h-10 border border-gray-300 rounded-[10px] flex items-center justify-center hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4 font-lexend">Amenities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {amenities.map(amenity => (
                    <button
                      key={amenity.name}
                      onClick={() => toggleAmenity(amenity.name)}
                      className={`flex items-center gap-2 px-3 py-3 rounded-full text-sm font-medium transition-all duration-200 font-lexend ${
                        selectedAmenities.includes(amenity.name)
                          ? 'bg-[#83C12C] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-base">{amenity.icon}</span>
                      <span className="truncate">{amenity.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum Rating */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 font-lexend">Minimum Rating</h3>
                <div className="space-y-2">
                  {ratings.map(rating => (
                    <label key={rating} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={minRating === rating}
                        onChange={(e) => setMinRating(parseInt(e.target.value))}
                        className="mr-3 text-[#1078CF]"
                      />
                      <div className="flex items-center">
                        <span className="font-lexend">{rating} stars</span>
                        <span className="ml-2 text-yellow-500">{'⭐'.repeat(rating)}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Booking Options */}
              <div className="mb-96">
                <h3 className="font-semibold mb-4 font-lexend">Booking Options</h3>
                <div className="grid grid-cols-1 gap-2">
                  {bookingOptionsList.map(option => (
                    <button
                      key={option}
                      onClick={() => toggleBookingOption(option)}
                      className={`px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 font-lexend text-left ${
                        bookingOptions.includes(option)
                          ? 'bg-[#83C12C] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
