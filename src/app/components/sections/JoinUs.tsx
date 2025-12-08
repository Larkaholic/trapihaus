"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getTopReviews } from '@/lib/services/reviews';
import { Review } from '@/types/review';

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
}

const TestimonialCard = ({ quote, name, role, avatar, rating }: TestimonialProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, Math.random() * 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-700 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`}>
      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-200'} fill-current`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <p className="text-gray-700 text-sm mb-6 font-lexend leading-relaxed">&quot;{quote}&quot;</p>

      {/* User Info */}
      
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden">
          <Image src={avatar} alt={name} fill className="object-cover" sizes="40px" unoptimized />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm font-lexend">{name}</h4>
          <p className="text-gray-500 text-xs font-lexend">{role}</p>
        </div>
      </div>
    </div>
  );
};

export default function JoinUs() {
  const [currentPage, setCurrentPage] = useState(0);
  const [lastPressed, setLastPressed] = useState<'prev' | 'next' | null>(null);
  const [allTestimonials, setAllTestimonials] = useState<TestimonialProps[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviews = await getTopReviews(16); // Fetch 16 reviews for 4 pages
        
        // Transform Review[] to TestimonialProps[]
        const testimonials = reviews.map((review: Review) => ({
          quote: review.comment,
          name: review.userName,
          role: 'Guest', // Default role since we don't track this in reviews
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=random&size=100`,
          rating: review.rating
        }));

        // Split into pages of 4 testimonials each
        const pages: TestimonialProps[][] = [];
        for (let i = 0; i < testimonials.length; i += 4) {
          pages.push(testimonials.slice(i, i + 4));
        }

        setAllTestimonials(pages.length > 0 ? pages : []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setAllTestimonials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const fallbackTestimonials: TestimonialProps[][] = [
    // Page 1
    [
      {
        quote: "Trapihaus made it so easy to find a safe and affordable transient near my university. The booking was quick, and I felt secure knowing the place was verified.",
        name: "Andrea P.",
        role: "Student",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=100&h=100&fit=crop&crop=face",
        rating: 5
      },
      {
        quote: "Ang dali lang maghanap ng transient sa Trapihaus! Sakto sa student budget ko, tapos safe at verified pa yung place.",
        name: "Cecilia N.",
        role: "Student",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        rating: 5
      },
      {
        quote: "Mas mura talaga yung mga nakita kong options sa Trapihaus kumpara sa ibang apps. Magayos yung stay namin, at madaling mag-book.",
        name: "Ramon A.",
        role: "Tourist",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        rating: 5
      },
      {
        quote: "Nag-book kami ng barkada ko sa Trapihaus for our Baguio trip. Sulit na, obar-okay, at kung ano yung nasa pictures, yun din yung actual.",
        name: "Marvin F.",
        role: "Tourist",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        rating: 5
      }
    ],
    // Page 2
    [
      {
        quote: "Perfect for budget travelers! Found a cozy place near Session Road through Trapihaus. The host was responsive and the place was exactly as described.",
        name: "Sarah M.",
        role: "Tourist",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
        rating: 5
      },
      {
        quote: "As a working student, Trapihaus helped me find affordable monthly rentals near campus. Hassle-free process and legitimate listings.",
        name: "Miguel R.",
        role: "Student",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
        rating: 4
      },
      {
        quote: "Maganda yung customer service nila. May issue kami sa first booking pero na-resolve agad. Professional and reliable talaga.",
        name: "Jennifer L.",
        role: "Tourist",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
        rating: 5
      },
      {
        quote: "Been using Trapihaus for 6 months now. Consistent quality ng mga listings and very transparent yung pricing. Highly recommended!",
        name: "Carlos D.",
        role: "Student",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
        rating: 5
      }
    ],
    // Page 3
    [
      {
        quote: "Family trip namin sa Baguio, perfect yung apartment na nakuha namin through Trapihaus. Spacious and clean, plus maganda yung view.",
        name: "Maria S.",
        role: "Tourist",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
        rating: 5
      },
      {
        quote: "Freshman ako and hindi familiar sa Baguio. Trapihaus made it so much easier to find safe housing near my school. Peace of mind for my parents too!",
        name: "Jake T.",
        role: "Student",
        avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop&crop=face",
        rating: 4
      },
      {
        quote: "Quick booking process and responsive hosts. Na-experience namin yung quality service from start to finish ng stay namin.",
        name: "Lisa W.",
        role: "Tourist",
        avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop&crop=face",
        rating: 5
      },
      {
        quote: "Sobrang helpful ng platform especially for students like me. Verified listings give me confidence na safe yung place na book ko.",
        name: "David G.",
        role: "Student",
        avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&crop=face",
        rating: 5
      }
    ],
    // Page 4
    [
      {
        quote: "Best decision to use Trapihaus for our group trip. Nakakuha namin ng malaking apartment na perfect for 8 people. Sulit na sulit!",
        name: "Anna C.",
        role: "Tourist",
        avatar: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=face",
        rating: 5
      },
      {
        quote: "Three years na ako gumagamit ng Trapihaus for my Baguio accommodations. Never ako na-disappoint sa quality ng mga listings nila.",
        name: "Robert K.",
        role: "Student",
        avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop&crop=face",
        rating: 5
      },
      {
        quote: "Convenient booking system and transparent pricing. No hidden fees unlike other platforms. Definitely my go-to for Baguio stays.",
        name: "Emma V.",
        role: "Tourist",
        avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=100&h=100&fit=crop&crop=face",
        rating: 4
      },
      {
        quote: "Napaka-organized ng platform nila. Easy to filter based on budget and location. Perfect for students na may limited budget like me.",
        name: "Kevin L.",
        role: "Student",
        avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=face",
        rating: 5
      }
    ]
  ];

  const handlePrevious = () => {
    setLastPressed('prev');
    const testimonials = allTestimonials.length > 0 ? allTestimonials : fallbackTestimonials;
    setCurrentPage((prev) => prev === 0 ? testimonials.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setLastPressed('next');
    const testimonials = allTestimonials.length > 0 ? allTestimonials : fallbackTestimonials;
    setCurrentPage((prev) => prev === testimonials.length - 1 ? 0 : prev + 1);
  };

  const displayTestimonials = allTestimonials.length > 0 ? allTestimonials : fallbackTestimonials;

  if (loading) {
    return (
      <section className="py-12 bg-gray-50 mb-[100px]">
        <div className="max-w-full mx-auto px-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600 font-lexend">Loading reviews...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50 mb-[100px]">
      <div className="max-w-full mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2 font-lexend">
              Trusted by Our <span className="text-blue-600">Community</span>
            </h2>
            <p className="text-gray-600 font-lexend">
              See what students, tourists, and hosts have to say about their Trapihaus experience
            </p>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevious}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                lastPressed === 'prev' 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <svg 
                className={`w-5 h-5 ${lastPressed === 'prev' ? 'text-white' : 'text-gray-600'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={handleNext}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                lastPressed === 'next' 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <svg 
                className={`w-5 h-5 ${lastPressed === 'next' ? 'text-white' : 'text-gray-600'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayTestimonials[currentPage]?.map((testimonial, index) => (
            <TestimonialCard key={`${currentPage}-${index}`} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}