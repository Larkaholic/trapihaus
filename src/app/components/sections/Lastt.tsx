"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/auth/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';

export default function Lastt() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleBrowseClick = () => {
    router.push('/browse');
  };

  const handleBecomeHostClick = () => {
    if (isLoggedIn) {
      router.push('/ListProperty');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  const closeModal = () => {
    setShowLoginModal(false);
  };

  return (
    <>
      <section className="relative pt-24 pb-40 overflow-hidden rounded-t-[40px] mx-[24px] translate-y-2 z-0">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/lastbg.jpg"
          alt="Baguio mountains landscape"
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-lexend leading-tight">
          Ready to Experience<br />
          Trapihaus?
        </h2>
        
        <p className="text-lg md:text-xl mb-8 font-lexend opacity-90 max-w-2xl mx-auto">
          Whether you&apos;re looking for a safe, budget-friendly stay or want to earn as a host,<br />
          Trapihaus makes it simple.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handleBrowseClick}
            className="bg-[#83C12C] hover:bg-green-600 text-white font-semibold py-4 px-8 rounded-2xl transition-colors duration-200 font-lexend text-lg min-w-[200px]"
          >
            Browse Accommodations
          </button>
          
          <button 
            onClick={handleBecomeHostClick}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-2xl transition-colors duration-200 font-lexend text-lg min-w-[200px]"
          >
            Become a Host
          </button>
        </div>
      </div>
    </section>

    {/* Login Required Modal */}
    {showLoginModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 font-lexend">Login Required</h3>
            <p className="text-gray-600 font-lexend">
              You need to be logged in to become a host and list your property.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleLoginRedirect}
              className="w-full bg-[#1078CF] hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 font-lexend"
            >
              Go to Login
            </button>
            <button
              onClick={closeModal}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200 font-lexend"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}