"use client";

interface MissionVisionProps {
  missionText: string;
  visionText: string;
  missionImage?: string;
  visionImage?: string;
}

export default function MissionVision({ 
  missionText, 
  visionText,
  missionImage = "/mission_image.jpg",
  visionImage = "/vision_image.jpg"
}: MissionVisionProps) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-full mx-auto px-6 space-y-16">
        
        {/* Mission Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-lexend">
              Our <span className="text-[#1078CF]">Mission</span>
            </h2>
            <p className="text-lg font-lexend leading-relaxed text-[#83C12C] font-bold text-[24px]">
              To connect travelers with safe and affordable accommodations <span className="text-black"> while supporting compliant local hosts. We strive to create a marketplace where trust, transparency, and community values are at the forefront of every interaction.</span>
            </p>
          </div>
          
          <div className="relative">
            <div 
              className="w-full h-80 rounded-2xl shadow-lg bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${missionImage})` }}
            >
            </div>
          </div>
        </div>

        {/* Vision Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative lg:order-1">
            <div 
              className="w-full h-80 rounded-2xl shadow-lg bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${visionImage})` }}
            >
            </div>
          </div>
          
          <div className="lg:order-2">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-lexend">
              Our <span className="text-[#1078CF]">Vision</span>
            </h2>
            <p className="text-[#F68109] text-lg font-lexend leading-relaxed font-bold text-[24px]">
              To become the most trusted local accommodation marketplace across the Philippines.<span className="text-black"> We envision a future where every Filipino city has access to our platform, connecting quality accommodations with travelers while fostering economic growth in local communities.</span>
            </p>
          </div>
        </div>
        
      </div>
    </section>
  );
}