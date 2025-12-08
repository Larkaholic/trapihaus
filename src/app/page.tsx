"use client";

import Navbar from "./components/layout/Navbar";
import Hero from "./components/sections/Hero";
import TopPicks from "./components/sections/TopPicks";
import WhyChoose from "./components/sections/WhyChoose";
import Cats from "./components/sections/Cats";
import HowItWorks from "./components/sections/HowItWorks";
import JoinUs from "./components/sections/JoinUs";
import Lastt from "./components/sections/Lastt";
import Footerr from "./components/layout/Footerr";
import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Create intersection observer for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    // Observe all sections
    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((section) => {
      observerRef.current?.observe(section);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const getSectionClasses = (sectionId: string) => {
    const isVisible = visibleSections.has(sectionId);
    return `transition-all duration-1000 ${
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
    }`;
  };

  return (
    <main className="min-h-screen bg-white max-w-full overflow-hidden">
      <div className="animate-fade-in">
        <Navbar />
      </div>
      
      <div 
        id="hero-section" 
        data-section
        className={getSectionClasses("hero-section")}
      >
        <Hero />
      </div>
      
      <div 
        id="why-choose-section" 
        data-section
        className={`mt-40 md:mt-0 ${getSectionClasses("why-choose-section")}`}
      >
        <WhyChoose />
      </div>
      
      <div 
        id="top-picks-section" 
        data-section
        className={getSectionClasses("top-picks-section")}
      >
        <TopPicks />
      </div>
      
      <div 
        id="cats-section" 
        data-section
        className={getSectionClasses("cats-section")}
      >
        <Cats />
      </div>
      
      <div 
        id="how-it-works-section" 
        data-section
        className={getSectionClasses("how-it-works-section")}
      >
        <HowItWorks />
      </div>
      
      <div 
        id="join-us-section" 
        data-section
        className={getSectionClasses("join-us-section")}
      >
        <JoinUs />
      </div>
      
      <div 
        id="lastt-section" 
        data-section
        className={getSectionClasses("lastt-section")}
      >
        <Lastt />
      </div>
      
      <div 
        id="footer-section" 
        data-section
        className={getSectionClasses("footer-section")}
      >
        <Footerr />
      </div>
    </main>
  );
}
