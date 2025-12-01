"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/auth/firebaseClient";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { getUserProfile } from "@/lib/services/userProfile";
import { getHostReservations } from "@/lib/services/reservations";
import { getUserThreads } from "@/lib/services/messages";
import { getHostReviews } from "@/lib/services/reviews";
import Image from "next/image";

interface Notification {
  id: string;
  type: "booking" | "message" | "review";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link?: string;
}

interface NotificationState {
  readIds: string[];
  deletedIds: string[];
}

export default function Header() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("/woman.png");
  const [userId, setUserId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationState, setNotificationState] = useState<NotificationState>({ readIds: [], deletedIds: [] });

  const notificationRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Load notification state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("notificationState");
      if (saved) {
        try {
          setNotificationState(JSON.parse(saved));
        } catch (error) {
          console.error("Failed to parse notification state:", error);
        }
      }
    }
  }, []);

  // Save notification state to localStorage
  const saveNotificationState = (state: NotificationState) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("notificationState", JSON.stringify(state));
      setNotificationState(state);
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Load user data
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserName(profile.displayName || profile.firstName || user.email || "Guest");
            setUserAvatar(profile.photoURL || "/woman.png");
          } else {
            setUserName(user.displayName || user.email || "Guest");
            setUserAvatar(user.photoURL || "/woman.png");
          }
        } catch (error) {
          console.error("Failed to load profile:", error);
          setUserName(user.displayName || user.email || "Guest");
          setUserAvatar(user.photoURL || "/woman.png");
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Load notifications
  useEffect(() => {
    if (!userId) return;

    const loadNotifications = async () => {
      try {
        const newNotifications: Notification[] = [];

        // Fetch pending reservations (booking requests)
        const reservations = await getHostReservations(userId, "pending");
        const recentReservations = reservations.slice(0, 5); // Last 5 pending
        
        recentReservations.forEach((reservation) => {
          newNotifications.push({
            id: `booking-${reservation.id}`,
            type: "booking",
            title: "New Booking Request",
            message: `${reservation.guestFirstName} ${reservation.guestLastName} requested to book ${reservation.propertyName}`,
            time: formatTimeAgo(reservation.createdAt),
            isRead: false,
            link: `/dashboard/reservations`,
          });
        });

        // Fetch recent messages
        const threads = await getUserThreads(userId);
        const recentThreads = threads.slice(0, 5); // Last 5 threads
        
        recentThreads.forEach((thread) => {
          // Only show if last message was not from the current user
          if (thread.lastMessageSenderId && thread.lastMessageSenderId !== userId && thread.lastMessage) {
            const senderName = thread.lastMessageSenderId === thread.guestId ? thread.guestName : thread.hostName;
            newNotifications.push({
              id: `message-${thread.id}`,
              type: "message",
              title: "New Message",
              message: `${senderName}: "${thread.lastMessage.substring(0, 50)}${thread.lastMessage.length > 50 ? "..." : ""}"`,
              time: formatTimeAgo(thread.lastMessageAt),
              isRead: false,
              link: `/dashboard/messages?threadId=${thread.id}`,
            });
          }
        });

        // Fetch recent reviews
        const reviews = await getHostReviews(userId);
        const recentReviews = reviews.slice(0, 5); // Last 5 reviews
        
        recentReviews.forEach((review) => {
          newNotifications.push({
            id: `review-${review.id}`,
            type: "review",
            title: "New Review",
            message: `${review.userName} left a ${review.rating}-star review for ${review.propertyName}`,
            time: formatTimeAgo(review.createdAt),
            isRead: false,
            link: `/dashboard/reviews`,
          });
        });

        // Sort by time (most recent first)
        newNotifications.sort((a, b) => {
          // Extract numeric value from time string for rough sorting
          const getTimeValue = (timeStr: string) => {
            if (timeStr === "Just now") return 0;
            const match = timeStr.match(/(\d+)/);
            if (!match) return 999999;
            const value = parseInt(match[1]);
            if (timeStr.includes("min")) return value;
            if (timeStr.includes("hour")) return value * 60;
            if (timeStr.includes("day")) return value * 1440;
            return value * 10080; // weeks
          };
          return getTimeValue(a.time) - getTimeValue(b.time);
        });

        // Filter out deleted notifications and apply read status
        const filteredNotifications = newNotifications
          .filter((n) => !notificationState.deletedIds.includes(n.id))
          .map((n) => ({
            ...n,
            isRead: notificationState.readIds.includes(n.id),
          }));

        setNotifications(filteredNotifications);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    loadNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId, notificationState.readIds, notificationState.deletedIds]);

  const handleLogout = async () => {
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const newReadIds = Array.from(new Set([...notificationState.readIds, ...allIds]));
    saveNotificationState({ ...notificationState, readIds: newReadIds });
  };

  const markAsRead = (id: string) => {
    if (!notificationState.readIds.includes(id)) {
      const newReadIds = [...notificationState.readIds, id];
      saveNotificationState({ ...notificationState, readIds: newReadIds });
    }
  };

  const clearRead = () => {
    const readIds = notifications.filter((n) => n.isRead).map((n) => n.id);
    const newDeletedIds = Array.from(new Set([...notificationState.deletedIds, ...readIds]));
    saveNotificationState({ ...notificationState, deletedIds: newDeletedIds });
  };

  const deleteNotification = (id: string) => {
    const newDeletedIds = [...notificationState.deletedIds, id];
    saveNotificationState({ ...notificationState, deletedIds: newDeletedIds });
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isNotificationsOpen || isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationsOpen, isUserMenuOpen]);

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-[#E5E7EB] mb-7">
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 h-16">
        <div>
          <h1 className="font-lexend font-semibold text-[18px]">Host Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              aria-label="Notifications"
              className="relative h-9 w-9 rounded-full bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB] transition-colors"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 px-1.5 min-w-[20px] rounded-full bg-[#F68109] text-white text-xs font-lexend font-semibold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-[380px] bg-white rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden z-50">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-lexend font-semibold text-[18px] text-[#1F2937]">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-3 py-1 rounded-full bg-[#F68109] text-white text-xs font-lexend font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={markAllAsRead}
                      className="flex-1 h-9 rounded-lg border border-[#E5E7EB] bg-white text-[#374151] text-sm font-lexend hover:bg-[#F9FAFB] transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Mark all read
                    </button>
                    <button
                      onClick={clearRead}
                      className="flex-1 h-9 rounded-lg border border-[#E5E7EB] bg-white text-[#374151] text-sm font-lexend hover:bg-[#F9FAFB] transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Clear read
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-5 py-8 text-center text-[#9CA3AF] text-sm font-lexend">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-5 py-4 border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors relative group ${
                          !notification.isRead ? "bg-[#F0F9FF]" : ""
                        }`}
                      >
                        <div 
                          onClick={() => {
                            markAsRead(notification.id);
                            if (notification.link) {
                              router.push(notification.link);
                              setIsNotificationsOpen(false);
                            }
                          }}
                          className="cursor-pointer"
                        >
                          {!notification.isRead && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#1078CF]" />
                          )}
                          <h4 className="font-lexend font-semibold text-[15px] text-[#1F2937] mb-1 pr-8">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-[#6B7280] font-lexend mb-2 pr-8">
                            {notification.message}
                          </p>
                          <p className="text-xs text-[#9CA3AF] font-lexend">{notification.time}</p>
                        </div>
                        {/* Delete button - shows on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-lg"
                          aria-label="Delete notification"
                        >
                          <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB]">
                  <button className="w-full text-center text-sm font-lexend text-[#1078CF] hover:text-[#0e6dbb] transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Notification Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push("/dashboard/messages")}
            aria-label="Messages"
            className="h-9 w-9 rounded-full bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB] transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* User Menu */}
          <div className="relative ml-2" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="h-9 px-3 rounded-full bg-[#1078CF] text-white flex items-center gap-2 font-lexend text-sm hover:bg-[#0e6dbb] transition-colors"
            >
              <Image
                src={userAvatar}
                alt={userName}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full object-cover border border-white/20"
              />
              <span className="hidden md:inline">{userName}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#E5E7EB] overflow-hidden z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center gap-3">
                  <Image
                    src={userAvatar}
                    alt={userName}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white"
                  />
                  <div>
                    <p className="font-lexend font-semibold text-[15px] text-[#1F2937]">{userName}</p>
                    <p className="text-xs text-[#6B7280] font-lexend">View Profile</p>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      router.push("/dashboard/account");
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm font-lexend text-[#374151] hover:bg-[#F9FAFB] transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Account
                  </button>
                  <button
                    onClick={() => {
                      router.push("/dashboard/settings");
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm font-lexend text-[#374151] hover:bg-[#F9FAFB] transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Settings
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-[#E5E7EB]">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm font-lexend text-[#EF4444] hover:bg-[#FEF2F2] transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
