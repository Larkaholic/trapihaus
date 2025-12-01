"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/auth/firebaseClient";
import { getHostReviews } from "@/lib/services/reviews";
import type { Review } from "@/types/review";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Image from "next/image";
import {
  faStar,
  faMagnifyingGlass,
  faEllipsisVertical,
  faReply,
  faCheckCircle,
  faCommentDots,
} from "@fortawesome/free-solid-svg-icons";

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

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const stars = Array.from({ length: 5 }).map((_, i) => (
    <FontAwesomeIcon key={i} icon={faStar} className={`${i < full ? "text-[#F59E0B]" : "text-[#E5E7EB]"} w-3.5 h-3.5`} />
  ));
  return <div className="flex items-center gap-1">{stars}</div>;
}

function formatReviewDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ReviewCard({ review }: { review: Review }) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative">
            {review.userAvatar ? (
              <Image
                src={review.userAvatar}
                alt={review.userName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                {getInitials(review.userName)}
              </div>
            )}
          </div>

          <div>
            <div className="text-[13px] font-lexend text-[#111827] font-semibold">{review.userName}</div>
            <div className="flex items-center gap-2 text-[12px] text-[#6B7280] font-lexend">
              <Stars value={review.rating} />
              <span>•</span>
              <span>{formatReviewDate(review.createdAt)}</span>
            </div>
            <div className="text-[11px] text-[#6B7280] font-lexend">{review.propertyName}</div>
          </div>
        </div>
        <button className="h-8 w-8 rounded-full text-[#6B7280] hover:bg-[#F3F4F6]">
          <FontAwesomeIcon icon={faEllipsisVertical} />
        </button>
      </div>

      <p className="mt-3 text-[13px] text-[#111827] leading-relaxed">
        {review.comment}
      </p>

      <div className="mt-4">
        <button className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-[#CCE0FF] text-[#1078CF] bg-[#F5FAFF] text-[13px] font-lexend hover:bg-[#E5F0FF] transition-colors">
          <FontAwesomeIcon icon={faReply} />
          Respond to Review
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[#6B7280] font-lexend">
        <div className="text-[#1078CF] cursor-pointer hover:underline">{review.propertyLocation}</div>
        <div>Reservation: {review.reservationId.substring(0, 12)}</div>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All Ratings");
  const [hostId, setHostId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [query]);

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

  // Fetch host reviews
  useEffect(() => {
    if (!hostId) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const allReviews = await getHostReviews(hostId);
        setReviews(allReviews);
      } catch (error) {
        console.error("❌ Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [hostId]);

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return "0.0";
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  // Total reviews count
  const totalReviews = reviews.length;

  // Response rate (placeholder - would need to track responses)
  const responseRate = useMemo(() => {
    // For now, return 0% - would need a 'hasResponse' field on reviews
    return "0";
  }, []);

  // Awaiting response count (all reviews for now)
  const awaitingResponse = totalReviews;

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      // Search filter
      const matchesSearch =
        debouncedQuery === "" ||
        review.userName.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        review.propertyName.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        review.comment.toLowerCase().includes(debouncedQuery.toLowerCase());

      // Rating filter
      const matchesRating =
        ratingFilter === "All Ratings" ||
        (ratingFilter === "5 Stars" && review.rating === 5) ||
        (ratingFilter === "4 Stars" && review.rating === 4) ||
        (ratingFilter === "3 Stars" && review.rating === 3) ||
        (ratingFilter === "2 Stars" && review.rating === 2) ||
        (ratingFilter === "1 Star" && review.rating === 1);

      return matchesSearch && matchesRating;
    });
  }, [reviews, debouncedQuery, ratingFilter]);

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
        <h1 className="text-[22px] md:text-[24px] font-lexend font-semibold text-[#111827]">Reviews</h1>
        <p className="text-[#6B7280] text-sm mt-1 font-lexend">Monitor guest feedback and respond to reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={faStar} label="Average Rating" value={averageRating} tint="bg-[#FFFBEB] text-[#F59E0B]" valueColor="text-[#F59E0B]" />
        <Stat icon={faCommentDots} label="Total Reviews" value={totalReviews.toString()} tint="bg-[#EFF6FF] text-[#1D4ED8]" valueColor="text-[#1D4ED8]" />
        <Stat icon={faCheckCircle} label="Response Rate" value={`${responseRate}%`} tint="bg-[#FFF7ED] text-[#A16207]" valueColor="text-[#A16207]" />
        <Stat icon={faReply} label="Awaiting Response" value={awaitingResponse.toString()} tint="bg-[#F5F3FF] text-[#6D28D9]" valueColor="text-[#6D28D9]" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-12 rounded-full bg-white border border-[#E5E7EB] px-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[#6B7280]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 outline-none bg-transparent text-sm font-lexend"
            placeholder="Search Reviews"
          />
        </div>
        <select
          className="h-12 px-4 rounded-xl bg-white border border-[#E5E7EB] text-sm font-lexend"
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
        >
          <option>All Ratings</option>
          <option>5 Stars</option>
          <option>4 Stars</option>
          <option>3 Stars</option>
          <option>2 Stars</option>
          <option>1 Star</option>
        </select>
      </div>

      {/* Review list */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <FontAwesomeIcon icon={faCommentDots} className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {debouncedQuery || ratingFilter !== "All Ratings"
              ? "No reviews match your filters. Try adjusting your search."
              : "You haven't received any reviews yet. Reviews will appear here after guests complete their stays."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
