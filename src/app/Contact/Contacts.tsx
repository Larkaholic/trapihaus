"use client";
import React from "react";

interface ContactItem {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const items: ContactItem[] = [
  {
    label: "Email",
    value: "support@trapihaus.com",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M4 6h16v12H4z" />
        <path d="M4 6l8 7 8-7" />
      </svg>
    ),
  },
  {
    label: "Contact Number",
    value: "+63 912 3456 789",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.08 4.18 2 2 0 014.06 2h3a2 2 0 012 1.72 12.6 12.6 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.6 12.6 0 002.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
  {
    label: "Location",
    value: "Baguio City, Philippines",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z" />
        <circle cx="12" cy="11" r="2.5" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    value: "/trapihaus",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
  },
];

export default function Contacts() {
  return (
    <section className="px-8 mt-20">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 rounded-[32px] border border-[#E5E7EB] bg-white px-6 py-6 md:py-7 shadow-sm hover:shadow transition-shadow"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3FD] text-[#1078CF]">
              {item.icon}
            </div>
            <div className="flex flex-col">
              <h3 className="text-[24px] font-bold font-lexend text-[#111827] tracking-tight">{item.label}</h3>
              <p className="text-[16px] font-lexend text-[#374151] leading-snug">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
