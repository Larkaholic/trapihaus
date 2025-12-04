"use client";
import Image from "next/image";

interface Stat {
  label: string;
  value: string;
  color: string; // border/text color accent
  textColor?: string;
}

const stats: Stat[] = [
  { value: "200+", label: "Active Hosts", color: "border-blue-300", textColor: "text-blue-600" },
  { value: "95%", label: "Active Booking", color: "border-orange-300", textColor: "text-orange-500" },
  { value: "₱3,100", label: "Average Earnings", color: "border-green-300", textColor: "text-green-600" }
];

export default function ListHero() {
  return (
    <section className="max-w-full mx-auto px-6 py-16">
      <div className="grid md:grid-cols-2 gap-2 items-center">
        {/* Left */}
        <div>
          <h1 className="text-4xl md:text-[72px] lg:text-[72px] font-extrabold leading-tight font-lexend mb-6">
            List your Property
            <br />
            on <span className="text-blue-600">Trapihaus</span>
          </h1>
          <p className="text-gray-600 text-lg md:text-xl font-lexend mb-8 max-w-xl leading-relaxed">
            Turn your space into income. Connect with travelers looking for safe, quality, and affordable accommodations in Baguio City and beyond.
          </p>
          <div className="flex flex-wrap gap-4 mb-8">
            <a
              href="/ListProperty"
              className="inline-block bg-[#83C12C] hover:bg-green-600 text-white font-semibold px-10 py-4 rounded-2xl text-lg transition-colors font-lexend shadow-sm"
            >
              Get Started
            </a>
          </div>
          <hr />
          <div className="mt-11 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
            {stats.map(s => (
              <div key={s.label} className={`border ${s.color} rounded-xl p-2 text-center bg-white/50 backdrop-blur-sm`}>
                <p className={`text-[32px] font-bold font-lexend mb-1 ${s.textColor ?? 'text-blue-600'}`}>{s.value}</p>
                <p className="text-gray-600 text-sm font-lexend">{s.label}</p>
              </div>
            ))}
          </div>
          
        </div>

        {/* Right Image */}
        <div className="relative w-full h-[420px] md:h-[520px] rounded-[48px] overflow-hidden shadow-sm ring-1 ring-gray-200">
          <Image
            src="/listpropertyHero.jpg" // TODO: replace with real marketing image
            alt="Modern living space"
            fill
            priority={false}
            className="object-cover"
            sizes="(max-width:768px) 100vw, 50vw"
          />
          {/* Optional overlay tint */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/10 via-transparent to-white/5" />
        </div>
      </div>
    </section>
  );
}
