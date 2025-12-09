"use client";
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

interface StepProps {
  number: string;
  title: string;
  description: string;
  bgColor: string;
  textColor: string;
  delay?: number;
}

const Step = ({ number, title, description, bgColor, textColor, delay = 0 }: StepProps) => {
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
      className={`flex items-start gap-4 mb-8 transition-all duration-700 group cursor-pointer ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Number Circle */}
      <div className={`w-16 h-16 ${bgColor} ${textColor} rounded-full flex items-center justify-center text-xl font-bold font-lexend flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${
        isHovered ? 'animate-pulse' : ''
      }`}>
        {number}
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900 mb-2 font-lexend transition-all duration-300 group-hover:text-blue-600 group-hover:translate-x-2">{title}</h3>
        <p className="text-gray-600 font-lexend transition-all duration-300 group-hover:text-gray-800">{description}</p>
      </div>

      {/* Arrow indicator on hover */}
      <div className={`flex items-center transition-all duration-300 ${
        isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      }`}>
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [imageHovered, setImageHovered] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
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

  return (
    <section ref={sectionRef} className="py-16 bg-white mb-[100px]">
      <div className="max-w-full mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Images Section */}
          <div className={`relative transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            {/* Main Top Image */}
            <div 
              className="relative group"
              onMouseEnter={() => setImageHovered(true)}
              onMouseLeave={() => setImageHovered(false)}
            >
              <div className={`w-full h-[480px] relative rounded-2xl overflow-hidden transition-all duration-500 ${
                imageHovered ? 'shadow-2xl scale-105' : 'shadow-lg'
              }`}>
                <Image
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=640&fit=crop&crop=center"
                  alt="Modern apartment interior"
                  fill
                  className={`object-cover transition-transform duration-700 ${
                    imageHovered ? 'scale-110' : 'scale-100'
                  }`}
                  sizes="(max-width:768px) 100vw, 50vw"
                  priority={false}
                />
                {/* Overlay on hover */}
                <div className={`absolute inset-0 bg-blue-600 mix-blend-multiply transition-opacity duration-500 ${
                  imageHovered ? 'opacity-10' : 'opacity-0'
                }`}></div>
              </div>
              
              {/* Floating Bottom Image - Positioned on bottom right */}
              <div className={`absolute -bottom-16 -right-8 w-2/3 h-48 transition-all duration-700 delay-300 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}>
                <div className={`w-full h-[242px] relative rounded-2xl shadow-lg border-8 border-white overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 ${
                  imageHovered ? 'border-blue-100' : 'border-white'
                }`}>
                  <Image
                    src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=640&h=480&fit=crop&crop=center"
                    alt="Cozy apartment living area"
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-110"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div>
            <h2 className={`text-4xl md:text-5xl font-bold mb-2 font-lexend mt-18 md:mt-0 transition-all duration-1000 ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
            }`}>
              How it <span className="text-blue-600 inline-block transition-all duration-700 delay-200 hover:scale-110">Works</span>
            </h2>
            <p className={`text-gray-600 text-lg mb-8 font-lexend transition-all duration-1000 delay-300 ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              Finding your perfect stay in Baguio City is simple with our three-step process
            </p>

            {/* Steps */}
            <div>
              <Step
                number="1"
                title="Browse Verified Listings"
                description="Search through our curated collection of safe and compliant accommodations in Baguio City."
                bgColor="bg-blue-600"
                textColor="text-white"
                delay={400}
              />
              
              <Step
                number="2"
                title="Book Securely"
                description="Reserve your chosen accommodation with our secure booking system and flexible payment options."
                bgColor="bg-green-500"
                textColor="text-white"
                delay={600}
              />
              
              <Step
                number="3"
                title="Stay with Confidence"
                description="Enjoy your stay knowing you're in a verified, safe accommodation with 24/7 support available."
                bgColor="bg-orange-500"
                textColor="text-white"
                delay={800}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
