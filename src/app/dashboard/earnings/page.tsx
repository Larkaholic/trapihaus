"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/auth/firebaseClient";
import { getHostReservations } from "@/lib/services/reservations";
import type { Reservation } from "@/types/reservation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faPesoSign,
  faWallet,
  faSackDollar,
  faUserGroup,
  faDownload,
  faChevronDown,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";

type TabKey = "overview" | "transactions" | "settings";

function Stat({ icon, label, value, tint, valueColor }: { icon: IconDefinition; label: string; value: string; tint: string; valueColor: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white border border-[#E5E7EB] h-[92px] px-5">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tint}`} aria-hidden>
        <FontAwesomeIcon icon={icon} className="text-[18px]" />
      </div>
      <div>
        <div className={`text-[18px] md:text-[20px] font-lexend font-bold ${valueColor}`}>{value}</div>
        <div className="text-sm text-[#6B7280] font-lexend">{label}</div>
      </div>
    </div>
  );
}

function LineChart({ points }: { points: number[] }) {
  // Simple line chart using SVG (8 points like the mock)
  const width = 560;
  const height = 220;
  const padding = 24;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(1, max - min);
  const stepX = (width - padding * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((p - min) / range) * (height - padding * 2);
    return [x, y] as const;
  });
  const path = coords.map((c) => c.join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
      {/* grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={padding} x2={width - padding} y1={padding + i * ((height - padding * 2) / 4)} y2={padding + i * ((height - padding * 2) / 4)} stroke="#E5E7EB" strokeWidth={1} />
      ))}
      {/* path */}
      <polyline points={path} fill="none" stroke="#3B82F6" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {/* dots */}
      {coords.map(([x, y], idx) => (
        <circle key={idx} cx={x} cy={y} r={4} fill="#3B82F6" />
      ))}
    </svg>
  );
}

export default function EarningsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("overview");
  const [period] = useState("This Year");
  const [hostId, setHostId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const points = [9000, 9500, 12000, 9800, 14000, 15000, 18000, 18500];

  // Auth state listener
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setHostId(currentUser.uid);
      } else {
        setHostId(null);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch host reservations
  useEffect(() => {
    if (!hostId) return;

    const fetchReservations = async () => {
      try {
        setLoading(true);
        const allReservations = await getHostReservations(hostId);
        // Filter only confirmed and completed reservations for earnings
        const paidReservations = allReservations.filter(
          (r) => r.status === "confirmed" || r.status === "checked-in" || r.status === "completed"
        );
        setReservations(paidReservations);
      } catch (error) {
        console.error("❌ Error fetching reservations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [hostId]);

  // Calculate total earnings
  const total = useMemo(() => {
    return reservations.reduce((sum, r) => sum + r.total, 0);
  }, [reservations]);

  // Calculate today's earnings
  const todays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return reservations
      .filter((r) => {
        const createdAt = r.createdAt;
        return createdAt >= today && createdAt < tomorrow;
      })
      .reduce((sum, r) => sum + r.total, 0);
  }, [reservations]);

  // Calculate average daily earnings
  const avgDaily = useMemo(() => {
    if (reservations.length === 0) return 0;
    
    // Get date range from oldest to newest reservation
    const dates = reservations.map((r) => r.createdAt.getTime());
    const oldestDate = new Date(Math.min(...dates));
    const newestDate = new Date(Math.max(...dates));
    
    const daysDiff = Math.max(1, Math.ceil((newestDate.getTime() - oldestDate.getTime()) / 86400000));
    
    return Math.round(total / daysDiff);
  }, [reservations, total]);

  // Calculate occupancy rate
  const occupancy = useMemo(() => {
    if (reservations.length === 0) return 0;
    
    // Count total nights booked
    const totalNightsBooked = reservations.reduce((sum, r) => sum + r.nights, 0);
    
    // Estimate total available nights (assuming 365 days for the year)
    const totalAvailableNights = 365;
    
    return Math.min(1, totalNightsBooked / totalAvailableNights);
  }, [reservations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-[22px] md:text-[24px] font-lexend font-semibold text-[#111827]">Earnings</h1>
        <p className="text-[#6B7280] text-sm mt-1 font-lexend">Track your revenue and manage payouts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={faPesoSign} label="Total Earnings" value={`₱${total.toLocaleString()}`} tint="bg-[#ECFDF5] text-[#15803D]" valueColor="text-[#15803D]" />
        <Stat icon={faWallet} label="Today's Earnings" value={`₱${todays.toLocaleString()}`} tint="bg-[#EFF6FF] text-[#1D4ED8]" valueColor="text-[#1D4ED8]" />
        <Stat icon={faSackDollar} label="Avg. Daily Earnings" value={`₱${avgDaily.toLocaleString()}`} tint="bg-[#FFF7ED] text-[#A16207]" valueColor="text-[#A16207]" />
        <Stat icon={faUserGroup} label="Occupancy Rate" value={`${Math.round(occupancy * 100)}%`} tint="bg-[#F5F3FF] text-[#6D28D9]" valueColor="text-[#6D28D9]" />
      </div>

      {/* Tabs + Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {([
            { key: "overview", label: "Overview" },
            { key: "transactions", label: "Transactions" },
            { key: "settings", label: "Settings" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 h-10 rounded-full text-sm font-lexend ${
                tab === t.key ? "bg-[#E5F0FF] text-[#1078CF]" : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="h-10 px-4 rounded-xl bg-white border border-[#E5E7EB] text-sm font-lexend inline-flex items-center gap-2">
            {period}
            <FontAwesomeIcon icon={faChevronDown} />
          </button>
          <button className="h-10 px-4 rounded-xl bg-white border border-[#E5E7EB] text-sm font-lexend inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faDownload} />
            Export
          </button>
        </div>
      </div>

      {/* Overview content */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
            <h3 className="font-lexend font-semibold">Earnings Trend</h3>
            <p className="text-sm text-[#6B7280]">Your earnings over the past 8 months</p>
            <div className="mt-4">
              <LineChart points={points} />
              <div className="mt-2 flex items-center justify-between text-xs text-[#6B7280] font-lexend">
                {months.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </section>
          <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm min-h-[280px]" />
        </div>
      )}

      {tab === "transactions" && (
        <section className="bg-white border border-[#E5E7EB] rounded-2xl p-0 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h3 className="font-lexend font-semibold text-[#111827]">Earnings Trend</h3>
            <a className="text-xs text-[#1078CF] underline font-lexend cursor-pointer">Your earnings over the past 8 months</a>
          </div>

          {/* Table header */}
          <div className="px-6">
            <div className="grid grid-cols-12 text-xs text-[#6B7280] font-lexend py-2">
              <div className="col-span-3">Transaction ID</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Property</div>
              <div className="col-span-1">Guest</div>
              <div className="col-span-1">Method</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1 text-right">Amount</div>
            </div>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {[
              {
                id: "TXN-2024-001",
                date: "Oct 14, 2024",
                property: "Loakan Heights Residences",
                guest: "Maria D.",
                method: "GCash",
                status: "Completed" as const,
                amount: 3600,
              },
              {
                id: "TXN-2024-002",
                date: "Oct 12, 2024",
                property: "Burnham View Hotel",
                guest: "Carlos M.",
                method: "Bank Transfer",
                status: "Completed" as const,
                amount: 2500,
              },
              {
                id: "TXN-2024-003",
                date: "Oct 10, 2024",
                property: "Pinecrest Transient",
                guest: "John R.",
                method: "GCash",
                status: "Pending" as const,
                amount: 1200,
              },
              {
                id: "TXN-2024-004",
                date: "Oct 8, 2024",
                property: "Loakan Heights Residences",
                guest: "Sarah L.",
                method: "PayMaya",
                status: "Completed" as const,
                amount: 3600,
              },
              {
                id: "TXN-2024-005",
                date: "Oct 5, 2024",
                property: "Burnham View Hotel",
                guest: "Miguel T.",
                method: "Bank Transfer",
                status: "Completed" as const,
                amount: 2500,
              },
            ].map((t) => (
              <div key={t.id} className="px-6 py-3">
                <div className="grid grid-cols-12 items-center text-sm">
                  <div className="col-span-3">
                    <a href="#" className="text-[#1078CF] hover:underline font-lexend">{t.id}</a>
                  </div>
                  <div className="col-span-2 text-[#111827] font-lexend">{t.date}</div>
                  <div className="col-span-3 text-[#111827] font-lexend">{t.property}</div>
                  <div className="col-span-1 text-[#111827] font-lexend">{t.guest}</div>
                  <div className="col-span-1 text-[#111827] font-lexend flex items-center gap-2">
                    {/* method indicator */}
                    <span className="inline-flex h-4 w-4 rounded-[4px] bg-[#E5E7EB] items-center justify-center" aria-hidden>
                      <svg viewBox="0 0 20 20" className="w-3 h-3 text-[#111827]" fill="currentColor">
                        <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293A1 1 0 003.293 10.707l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                      </svg>
                    </span>
                    {t.method}
                  </div>
                  <div className="col-span-1">
                    {t.status === "Completed" ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-lexend font-semibold bg-[#EAF7EE] text-[#166534]">
                        <span className="h-2 w-2 rounded-full bg-[#22C55E]" aria-hidden />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-lexend font-semibold bg-[#FFF3D6] text-[#A16207]">
                        <span className="h-2 w-2 rounded-full bg-[#F59E0B]" aria-hidden />
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 text-right text-[#111827] font-lexend">₱{t.amount.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <div className="text-sm text-[#6B7280] font-lexend">Showing 5 of 127 transactions</div>
            <button className="h-10 px-4 rounded-xl bg-white border border-[#E5E7EB] text-sm font-lexend">View All</button>
          </div>
        </section>
      )}

      {tab === "settings" && (
        <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-lexend font-semibold text-[#111827]">Payment Methods</h3>
            <p className="text-sm text-[#6B7280] font-lexend">Manage how you receive your earnings</p>
          </div>

          <PaymentMethods />
        </section>
      )}
    </div>
  );
}

type PayoutMethod = {
  id: string;
  type: "GCash" | "Bank Transfer";
  details: string; // masked details
};

function PaymentMethods() {
  const [primaryId, setPrimaryId] = useState<string>("gcash");
  const [methods] = useState<PayoutMethod[]>([
    { id: "gcash", type: "GCash", details: "0917*****34" },
    { id: "bank", type: "Bank Transfer", details: "BDO - ****5678" },
  ]);

  const setAsPrimary = (id: string) => setPrimaryId(id);

  return (
    <div className="space-y-3">
      {methods.map((m) => {
        const isPrimary = m.id === primaryId;
        return (
          <div
            key={m.id}
            className={`flex items-center justify-between rounded-xl border px-4 py-4 ${
              isPrimary ? "bg-[#F5FAFF] border-[#3B82F6] ring-1 ring-[#93C5FD]" : "bg-white border-[#E5E7EB]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`h-10 w-10 rounded-lg flex items-center justify-center ${isPrimary ? "bg-white text-[#1078CF] border border-[#BFDBFE]" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
                <FontAwesomeIcon icon={faCreditCard} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-[#111827] font-lexend font-medium">{m.type}</div>
                </div>
                <div className="text-sm text-[#6B7280] font-lexend">{m.details}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPrimary && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#EAF7EE] text-[#166534] font-lexend">Primary</span>
              )}
              {!isPrimary ? (
                <button
                  onClick={() => setAsPrimary(m.id)}
                  className="h-9 px-3 rounded-xl bg-white border border-[#E5E7EB] text-sm font-lexend"
                >
                  Set as Primary
                </button>
              ) : null}
              <button className="h-9 px-3 rounded-xl bg-white border border-[#E5E7EB] text-sm font-lexend">
                Edit
              </button>
            </div>
          </div>
        );
      })}

      <button className="w-full h-11 rounded-xl border border-[#E5E7EB] text-[#6B7280] bg-white hover:bg-[#F9FAFB] inline-flex items-center justify-center gap-2 text-sm font-lexend mt-2">
        <FontAwesomeIcon icon={faCreditCard} />
        Add Payment Method
      </button>
    </div>
  );
}
