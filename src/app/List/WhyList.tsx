"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag, faMoneyBill, faHandshake } from "@fortawesome/free-solid-svg-icons";

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  bg: string;
}

const features: Feature[] = [
  {
    title: "Built for Filipino Hosts",
    description: "Trapihaus is the first hyperlocal accommodation marketplace designed with Filipino property owners and travelers in mind.",
    icon: <FontAwesomeIcon icon={faFlag} className="text-blue-600" style={{ fontSize: '80px' }} />,
    bg: "bg-blue-50"
  },
  {
    title: "Easy to List, Easy to Earn",
    description: "From creating your listing to receiving payments, Trapihaus makes hosting seamless and stress-free.",
    icon: <FontAwesomeIcon icon={faMoneyBill} className="text-green-600" style={{ fontSize: '80px' }} />,
    bg: "bg-green-50"
  },
  {
    title: "Hosting You Can Trust",
    description: "Every property is verified for safety and compliance, giving both hosts and guests peace of mind.",
    icon: <FontAwesomeIcon icon={faHandshake} className="text-orange-500" style={{ fontSize: '80px' }} />,
    bg: "bg-orange-50"
  }
];

export default function WhyList() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold font-lexend mb-4">
          Why List with <span className="text-blue-600">Trapihaus?</span>
        </h2>
        <p className="text-gray-600 text-lg font-lexend mb-16 max-w-2xl mx-auto">
          A trusted platform built for local hosts and Filipino travelers.
        </p>

        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {features.map(f => (
            <div key={f.title} className="flex flex-col items-center">
              <div className={`w-44 h-44 rounded-3xl ${f.bg} flex items-center justify-center mb-6`}>
                {f.icon}
              </div>
              <h3 className="font-lexend font-bold text-[24px] mb-3 text-black">{f.title}</h3>
              <p className="text-[#9E9E9E] text-[18px] font-lexend leading-relaxed max-w-xs">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
