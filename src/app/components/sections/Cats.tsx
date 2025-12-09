"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface CategoryCardProps {
  title: string;
  description: string;
  image: string;
  className?: string;
  onClick: () => void;
  delay?: number;
}

const CategoryCard = ({ title, description, image, className = "", onClick, delay = 0 }: CategoryCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-3xl overflow-hidden group cursor-pointer transition-all duration-700 hover:scale-105 hover:shadow-2xl ${className} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {/* Background Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className={`object-cover transition-transform duration-700 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
          sizes="(max-width:768px) 100vw, 50vw"
          priority={false}
        />
        {/* Gradient Overlay - Black to Transparent from bottom to top */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent transition-all duration-500 ${
          isHovered ? 'from-black/90 via-black/40' : 'from-black via-black/20'
        }`}></div>
        
        {/* Animated border on hover */}
        <div className={`absolute inset-0 border-4 border-white rounded-3xl transition-all duration-300 ${
          isHovered ? 'opacity-30 scale-95' : 'opacity-0 scale-100'
        }`}></div>
      </div>
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h3 className={`text-2xl font-bold mb-2 font-lexend transition-all duration-300 ${
          isHovered ? 'transform translate-y-0 scale-105' : 'transform translate-y-0'
        }`}>{title}</h3>
        <p className={`text-sm opacity-90 font-lexend transition-all duration-500 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-90 translate-y-2'
        }`}>{description}</p>
        
        {/* Hover indicator arrow */}
        <div className={`mt-3 flex items-center gap-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
        }`}>
          <span className="text-sm font-semibold">Explore</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default function Categories() {
  const router = useRouter();
  const [headerVisible, setHeaderVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHeaderVisible(true);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px',
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const handleCategoryClick = (category: string) => {
    router.push(`/browse?category=${category.toLowerCase()}`);
  };

  return (
    <section ref={sectionRef} className="py-16 bg-gray-50">
      <div className="max-w-full mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className={`text-4xl md:text-[48px] font-bold mb-4 font-lexend transition-all duration-1000 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
          }`}>
            <span className="text-blue-600 inline-block transition-all duration-700 delay-200">Find the Stay</span>{' '}
            <span className="inline-block transition-all duration-700 delay-400">That Fits You</span>
          </h2>
          <p className={`text-gray-600 text-lg max-w-3xl mx-auto font-lexend transition-all duration-1000 delay-500 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Choose from budget-friendly apartments, flexible transient houses, or trusted hotels for your Baguio experience.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategoryCard
            title="Apartments"
            description="A comfortable space built for longer stays."
            image="/apartments.jpg"
            onClick={() => handleCategoryClick("apartment")}
            delay={0}
          />
            
            <CategoryCard
            title="Transients"
            description="Affordable short stays, perfect for quick trips."
            image="/transients.jpg"
            onClick={() => handleCategoryClick("transient")}
            delay={200}
            />
          {/* Bottom Row - Hotels spanning full width */}
          <CategoryCard
            title="Hotels"
            description="Full service comfort with modern convenience."
            image="/hotels.jpg"
            className="md:col-span-2"
            onClick={() => handleCategoryClick("hotel")}
            delay={400}
          />
        </div>
      </div>
    </section>
  );
}
