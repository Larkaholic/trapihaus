"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getApprovedListings } from '@/lib/services/listings';
import type { PropertyListing } from '@/types/listing';

interface Listing {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  verified: boolean;
  type: 'apartment' | 'transient' | 'hotel';
}

const PropertyTypeTab = ({ 
  label, 
  icon, 
  isActive, 
  onClick 
}: { 
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-3 rounded-full text-[14px] md:text-[18px] font-medium transition-all duration-300 group ${
      isActive
        ? 'bg-blue-100 text-[#1078CF] scale-105 shadow-md'
        : 'bg-gray-100 text-black hover:bg-gray-200 hover:scale-105'
    }`}
  >
    <span className={`transition-transform duration-300 ${
      isActive ? 'scale-110 rotate-12' : 'group-hover:scale-110 group-hover:rotate-12'
    }`}>
      {icon}
    </span>
    {label}
  </button>
);

const PropertyCard = ({ listing, index }: { listing: Listing; index?: number }) => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, (index || 0) * 150);
    return () => clearTimeout(timer);
  }, [index]);
  
  const handleViewDetails = () => {
    router.push(`/PropertyListing#${listing.id}`);
  };
  
  return (
    <div className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 border border-gray-100 group cursor-pointer ${
      isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
    }`}>
      {/* Image Container */}
      <div className="relative h-48 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 p-[16px]">
          <div className="relative w-full h-full rounded-3xl overflow-hidden">
            <Image
              src={listing.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=640&h=480&fit=crop&crop=center'}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width:768px) 100vw, 25vw"
            />
            {/* Image overlay on hover */}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </div>
        </div>
        {/* Verified Badge */}
        {listing.verified && (
          <div className="absolute top-5 right-5 bg-[#83C12C] text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
            <Image src="/Vector (1).png" alt="Verified checkmark" width={16} height={16} className="w-4 h-4" />
            Verified
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-900 font-lexend group-hover:text-blue-600 transition-colors duration-300">{listing.title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0 ml-3">
            <svg className="w-4 h-4 text-yellow-400 fill-current transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-gray-900 text-base font-semibold">{listing.rating}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-blue-500 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-gray-500 text-sm font-lexend group-hover:text-gray-700 transition-colors duration-300">{listing.location}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900 font-lexend group-hover:text-blue-600 transition-all duration-300 group-hover:scale-105">₱{listing.price.toLocaleString()}</span>
            <span className="text-gray-500 text-sm font-lexend">per night</span>
          </div>
          <button 
            onClick={handleViewDetails}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 font-lexend text-sm hover:scale-105 hover:shadow-lg"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TopPicks() {
  const [activeTab, setActiveTab] = useState<'apartment' | 'transient' | 'hotel'>('apartment');
  const [lastPressed, setLastPressed] = useState<'prev' | 'next' | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    setHeaderVisible(true);
  }, []);

  useEffect(() => {
    const fetchTopRatedListings = async () => {
      try {
        setLoading(true);
        const approvedListings = await getApprovedListings();
        
        // Transform PropertyListing to Listing interface
        const transformedListings: Listing[] = approvedListings.map((listing: PropertyListing) => ({
          id: listing.id,
          title: listing.propertyName,
          location: `${listing.barangay}, ${listing.city}`,
          price: parseInt(listing.rate.replace(/[^0-9]/g, "")) || 0,
          rating: listing.averageRating || 4.5,
          image: listing.coverPhoto || listing.photos?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=640&h=480&fit=crop&crop=center',
          verified: listing.status === "approved",
          type: (listing.propertyType?.toLowerCase() || 'hotel') as 'apartment' | 'transient' | 'hotel',
        }));

        // Sort by rating (highest first) and take top listings
        const sortedByRating = transformedListings.sort((a, b) => b.rating - a.rating);
        
        setListings(sortedByRating);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch top rated listings:", err);
        setError("Failed to load listings");
      } finally {
        setLoading(false);
      }
    };

    fetchTopRatedListings();
  }, []);

  const tabOrder: ('apartment' | 'transient' | 'hotel')[] = ['apartment', 'transient', 'hotel'];

  const handlePrevious = () => {
    setLastPressed('prev');
    const currentIndex = tabOrder.indexOf(activeTab);
    const prevIndex = currentIndex === 0 ? tabOrder.length - 1 : currentIndex - 1;
    setActiveTab(tabOrder[prevIndex]);
  };

  const handleNext = () => {
    setLastPressed('next');
    const currentIndex = tabOrder.indexOf(activeTab);
    const nextIndex = currentIndex === tabOrder.length - 1 ? 0 : currentIndex + 1;
    setActiveTab(tabOrder[nextIndex]);
  };

  // Filter listings by active tab
  const filteredListings = listings.filter(listing => listing.type === activeTab);

  return (
    <section className="py-12 md:py-20 bg-[#FBFBFB] px-4 md:px-6">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4 md:gap-0">
          <div>
            <h2 className={`text-2xl md:text-4xl font-bold text-black mb-1 md:mb-2 font-lexend transition-all duration-700 delay-100 ${
              headerVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}>
              Top Picks for
            </h2>
            <h3 className={`text-2xl md:text-4xl font-bold text-blue-600 font-lexend transition-all duration-700 delay-300 ${
              headerVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}>
              Students & Travelers
            </h3>
          </div>

          {/* Property Type Tabs */}
          <div className={`flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3 transition-all duration-700 delay-500 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <PropertyTypeTab
              label="Apartment"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              isActive={activeTab === 'apartment'}
              onClick={() => setActiveTab('apartment')}
            />
            <PropertyTypeTab
              label="Transient"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
              isActive={activeTab === 'transient'}
              onClick={() => setActiveTab('transient')}
            />
            <PropertyTypeTab
              label="Hotel"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              }
              isActive={activeTab === 'hotel'}
              onClick={() => setActiveTab('hotel')}
            />
            
            {/* Navigation Arrows */}
            <div className="flex items-center gap-2 ml-auto md:ml-4">
              <button 
                onClick={handlePrevious}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  lastPressed === 'prev' 
                    ? 'bg-green-500 hover:bg-green-600 shadow-lg' 
                    : 'bg-gray-100 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                <svg 
                  className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 hover:-translate-x-1 ${lastPressed === 'prev' ? 'text-white' : 'text-gray-600'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={handleNext}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  lastPressed === 'next' 
                    ? 'bg-green-500 hover:bg-green-600 shadow-lg' 
                    : 'bg-gray-100 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                <svg 
                  className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 hover:translate-x-1 ${lastPressed === 'next' ? 'text-white' : 'text-gray-600'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1078CF]"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-600 font-lexend">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredListings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 font-lexend">No {activeTab} listings available yet.</p>
          </div>
        )}

        {/* Property Grid */}
        {!loading && !error && filteredListings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {filteredListings.slice(0, 6).map((listing, index) => (
              <PropertyCard key={listing.id} listing={listing} index={index} />
            ))}
          </div>
        )}

        {/* View All Link */}
        <div className="text-center">
          <a href="/browse" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2 text-base md:text-lg transition-all duration-300 hover:gap-3 hover:scale-105 group">
            View All Listings
            <svg className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
