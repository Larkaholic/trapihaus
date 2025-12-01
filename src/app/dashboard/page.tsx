"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/auth/firebaseClient";
import SummaryCards from "@/app/dashboard/components/SummaryCards";
import RevenueChart from "@/app/dashboard/components/RevenueChart";
import RecentReservations from "@/app/dashboard/components/RecentReservations";
import LatestReviews from "@/app/dashboard/components/LatestReviews";
import {
  getDashboardStats,
  getRevenueData,
  getRecentReservations,
  getLatestReviews,
} from "@/lib/services/dashboard";

interface DashboardStats {
  activeListings: number;
  reservationsThisMonth: number;
  reservationsChangeText: string;
  totalEarnings: number;
  earningsChangeText: string;
}

interface RevenueDataPoint {
  label: string;
  value: number;
}

interface ReservationItem {
  id: string;
  guest: string;
  property: string;
  checkIn: string;
  status: "Confirmed" | "Pending" | "Cancelled";
  amount: string;
}

interface ReviewItem {
  id: string;
  name: string;
  rating: number;
  quote: string;
  room?: string;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("User");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueDataPoint[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserName(user.displayName || user.email?.split("@")[0] || "User");

        try {
          // Fetch all dashboard data in parallel
          const [statsData, revenueData, reservationsData, reviewsData] = await Promise.all([
            getDashboardStats(user.uid),
            getRevenueData(user.uid),
            getRecentReservations(user.uid, 5),
            getLatestReviews(user.uid, 3),
          ]);

          setStats(statsData);
          setRevenue(revenueData);
          setReservations(reservationsData);
          setReviews(reviewsData);
        } catch (error) {
          console.error("Error loading dashboard data:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[65%_35%] gap-6">
        <SummaryCards userName={userName} stats={stats || undefined} />
        <RevenueChart data={revenue} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <RecentReservations items={reservations} />
        <LatestReviews reviews={reviews} />
      </div>
    </div>
  );
} 