"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Hero() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSearchClick = () => {
    router.push("/browse");
  };

  return (
    <section className="relative bg-white mt-4 md:mt-[24px] mb-16 md:mb-20">
      {/* Background Image */}
      <div
        className="h-[400px] md:h-[600px] bg-cover bg-center flex items-center justify-center rounded-[20px] md:rounded-[40px] relative overflow-hidden mx-4 md:mx-[24px]"
        style={{ backgroundImage: "url('/trapihaus-hero.jpg')" }}
      >
        <div className="absolute inset-0 bg-black opacity-40 pointer-events-none" />
        <div className="text-center text-white max-w-4xl px-4 relative z-10">
          <h1 className={`text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 font-lexend transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
          }`}>
            Find Safe & Affordable Stays in Baguio
          </h1>
          <p className={`text-base md:text-lg lg:text-xl mb-8 md:mb-12 font-lexend transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Browse verified apartments, transients, and hotels — trusted by students, tourists, and locals.
          </p>
        </div>
      </div>

      {/* Search bar positioned halfway hanging at the bottom */}
      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4 md:px-6 z-20 transition-all duration-1000 delay-700 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <div className="bg-white rounded-[24px] md:rounded-[48px] p-4 mt-20 md:mt-0 md:p-6 shadow-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-start">
            <div className="flex items-start text-center md:border-r-2 border-gray-300 pb-4 md:pb-0 border-b md:border-b-0">
              <svg className="w-8 h-8 md:w-10 md:h-10 text-[#83C12C] mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex flex-col text-left">
                <label className="text-base md:text-lg font-semibold text-black">Location</label>
                <p className="text-gray-500 text-xs md:text-sm">Where are you going?</p>
              </div>
            </div>
            
            <div className="flex items-start text-center md:border-r-2 border-gray-300 pb-4 md:pb-0 border-b md:border-b-0">
              <svg className="w-8 h-8 md:w-10 md:h-10 text-[#83C12C] mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="flex flex-col text-left">
                <label className="text-base md:text-lg font-semibold text-black">Check in</label>
                <p className="text-gray-500 text-xs md:text-sm">Add date</p>
              </div>
            </div>
            
            <div className="flex items-start text-center md:border-r-2 border-gray-300 pb-4 md:pb-0 border-b md:border-b-0">
              <svg className="w-8 h-8 md:w-10 md:h-10 text-[#83C12C] mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="flex flex-col text-left">
                <label className="text-base md:text-lg font-semibold text-black">Check out</label>
                <p className="text-gray-500 text-xs md:text-sm">Add date</p>
              </div>
            </div>
            
            <div className="flex items-start justify-between">
              <div className="flex items-start text-center">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-[#83C12C] mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="flex flex-col text-left">
                  <label className="text-base md:text-lg font-semibold text-black">Guests</label>
                  <p className="text-gray-500 text-xs md:text-sm">Add guests</p>
                </div>
              </div>
              <button 
                onClick={handleSearchClick}
                className="ml-4 md:ml-6 w-12 h-12 md:w-14 md:h-14 bg-[#83C12C] hover:bg-green-600 text-white rounded-full font-semibold shadow-lg transition-colors duration-200 flex items-center justify-center flex-shrink-0"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
