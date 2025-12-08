"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <div 
      onClick={onClick}
      className={`relative rounded-3xl overflow-hidden group cursor-pointer transition-all duration-700 ${className} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {/* Background Image */}
      <div className="relative h-64 md:h-80">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, 50vw"
          priority={false}
        />
        {/* Gradient Overlay - Black to Transparent from bottom to top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
      </div>
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h3 className="text-2xl font-bold mb-2 font-lexend">{title}</h3>
        <p className="text-sm opacity-90 font-lexend">{description}</p>
      </div>
    </div>
  );
};

export default function Categories() {
  const router = useRouter();

  const handleCategoryClick = (category: string) => {
    router.push(`/browse?category=${category.toLowerCase()}`);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-full mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-[48px] font-bold mb-4 font-lexend">
            <span className="text-blue-600">Find the Stay</span> That Fits You
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto font-lexend">
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
