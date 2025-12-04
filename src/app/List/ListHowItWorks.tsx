"use client";

import Image from "next/image";

export default function ListHowItWorks() {
  const steps = [
    {
      title: 'Register for Free',
      subtitle: 'Step 1',
      desc: 'Sign up with your email and set up your host profile.',
      iconSrc: '/step1.png'
    },
    {
      title: 'Create Your Listing',
      subtitle: 'Step 2',
      desc: 'Upload photos, add details, and set your price in minutes.',
      iconSrc: '/step2.png'
    },
    {
      title: 'Get Verified',
      subtitle: 'Step 3',
      desc: "Trapihaus checks your property for safety and trust.",
      iconSrc: '/step3.png'
    },
    {
      title: 'Start Hosting & Earning',
      subtitle: 'Step 4',
      desc: "Accept bookings, welcome guests, and enjoy reliable payouts.",
      iconSrc: '/step4.png'
    }
  ];

  return (
    <section style={{ backgroundColor: '#F6FBEA' }} className="py-16">
      <div className="max-w-full mx-auto px-6 text-center">
        <h2 className="text-[48px] font-extrabold mb-2 font-lexend">How it <span className="text-green-600">Works</span></h2>
        <p className="text-gray-600 mb-10 font-lexend text-[20px]">Get started in four simple steps</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s) => (
            <div key={s.title} className="bg-white rounded-3xl p-8 shadow-sm flex flex-col items-center justify-start text-center min-h-[280px]">
              <div className="mb-6">
                <Image 
                  src={s.iconSrc} 
                  alt={s.title}
                  width={64}
                  height={64}
                  className="w-16 h-16"
                />
              </div>
              <p className="text-sm text-[#F68109] font-semibold mb-3">{s.subtitle}</p>
              <h3 className="text-xl font-bold mb-3 font-lexend text-gray-900">{s.title}</h3>
              <p className="text-gray-600 text-sm font-lexend leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
