"use client";
import Image from 'next/image';
interface WhoWeAreProps {
  title: string;
  paragraphs: string[];
  image?: string;
}

export default function WhoWeAre({ 
  title, 
  paragraphs, 
  image = "/whoweare.jpg" 
}: WhoWeAreProps) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-full mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="rounded-2xl shadow-lg overflow-hidden">
              <div className="relative w-full h-[618px]">
                <Image src={image} alt={title} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-lexend">
              WHO <span className="text-[#1078CF]">WE ARE</span>
            </h2>
            {paragraphs.map((paragraph, index) => (
              <p 
                key={index} 
                className={`text-[#212121] text-lg font-lexend leading-relaxed ${
                  index < paragraphs.length - 1 ? 'mb-6' : ''
                }`}
                dangerouslySetInnerHTML={{ __html: paragraph }}
              />
            ))}
            
            {/* Contact Information */}
            {/* Contact Information */}
            {/* Contact Information */}
            <div className="flex flex-col sm:flex-row gap-6 mt-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#83C12C] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 font-lexend">Baguio City, Philippines</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#F68109] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-lexend">Trapihaus@Email.Com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}