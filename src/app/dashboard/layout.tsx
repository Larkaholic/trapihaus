import type { ReactNode } from "react";
import Sidebar from "@/app/dashboard/components/Sidebar";
import Header from "@/app/dashboard/components/Header";
import DashboardAuthGuard from "@/app/dashboard/components/DashboardAuthGuard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardAuthGuard>
      <div className="min-h-screen bg-[#F7F8FA] text-[#111827]">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 min-w-0">
            <Header />
            <main className="px-4 md:px-6 lg:px-8 pb-10">{children}</main>
          </div>
        </div>
      </div>
    </DashboardAuthGuard>
  );
}
