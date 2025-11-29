"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faHouse,
  faListUl,
  faCalendarDays,
  faPesoSign,
  faComments,
  faStar,
  faGear,
  faCircleQuestion,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

const nav: { href: string; label: string; icon: IconDefinition }[] = [
  { href: "/dashboard", label: "Dashboard", icon: faHouse },
  { href: "/dashboard/listings", label: "My Listings", icon: faListUl },
  { href: "/dashboard/reservations", label: "Reservations", icon: faCalendarDays },
  { href: "/dashboard/earnings", label: "Earnings", icon: faPesoSign },
  { href: "/dashboard/messages", label: "Messages", icon: faComments },
  { href: "/dashboard/reviews", label: "Reviews", icon: faStar },
  { href: "/dashboard/settings", label: "Settings", icon: faGear },
  { href: "/dashboard/helpCenter", label: "Help Center", icon: faCircleQuestion },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-[#E5E7EB] min-h-screen p-4">
      <div className="mb-6">
      <Link href="/">
        <Image
        src="/mainLogo.png"
        alt="Trapihaus main logo"
        width={160}
        height={50}
        className="h-[40px] w-auto cursor-pointer"
        priority
        />
      </Link>
      </div>
      <nav className="flex-1 space-y-[4px]">
      {nav.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        return (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-4 px-3 py-2 rounded-xl font-lexend text-sm transition-colors ${
          active ? "bg-[#1078CF] text-white" : "text-[#374151] hover:bg-[#F3F4F6]"
          }`}
        >
          <FontAwesomeIcon icon={item.icon} className="text-lg" aria-hidden />
          <span>{item.label}</span>
        </Link>
        );
      })}
      </nav>
      <Link 
      href="/ListProperty"
      className="mt-4 inline-flex items-center justify-center h-11 rounded-xl bg-[#F68109] text-white font-lexend text-sm font-semibold shadow px-4 gap-2 hover:bg-[#e67508] transition-colors"
      >
      <FontAwesomeIcon icon={faPlus} aria-hidden />
      <span>Add New Property</span>
      </Link>
    </aside>
  );
}
