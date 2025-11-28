"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/auth/firebaseClient";
import Navbar from "../../components/layout/Navbar";
import Footerr from "../../components/layout/Footerr";
import AppImage from "../../components/ui/AppImage";
import ReviewModal from "../../components/ui/ReviewModal";
import {
	getUpcomingReservations,
	getPastReservations,
	getCancelledReservations,
	cancelReservation,
} from "@/lib/services/reservations";
import type { Reservation } from "@/types/reservation";
import { hasUserReviewedListing } from "@/lib/services/reviews";

type TabType = "upcoming" | "past" | "cancelled";

export default function MyTrips() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<TabType>("upcoming");
	const [userId, setUserId] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	
	const [upcomingTrips, setUpcomingTrips] = useState<Reservation[]>([]);
	const [pastTrips, setPastTrips] = useState<Reservation[]>([]);
	const [cancelledTrips, setCancelledTrips] = useState<Reservation[]>([]);
	
	const [reviewModalOpen, setReviewModalOpen] = useState(false);
	const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
	const [reviewedListings, setReviewedListings] = useState<Set<string>>(new Set());

	// Auth state listener
	useEffect(() => {
		const auth = getFirebaseAuth();
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			if (currentUser) {
				setUserId(currentUser.uid);
				setUser(currentUser);
			} else {
				setUserId(null);
				setUser(null);
				router.push("/login");
			}
		});

		return () => unsubscribe();
	}, [router]);

	// Fetch reservations when user is authenticated
	useEffect(() => {
		if (!userId) return;

		const fetchReservations = async () => {
			try {
				setLoading(true);
				const [upcoming, past, cancelled] = await Promise.all([
					getUpcomingReservations(userId),
					getPastReservations(userId),
					getCancelledReservations(userId),
				]);

				console.log("🔍 Upcoming trips:", upcoming.length, upcoming);
				console.log("🔍 Past trips:", past.length, past);
				console.log("🔍 Cancelled trips:", cancelled.length, cancelled);

				setUpcomingTrips(upcoming);
				setPastTrips(past);
				setCancelledTrips(cancelled);

				// Check which listings have been reviewed
				const reviewedSet = new Set<string>();
				for (const trip of past) {
					const hasReviewed = await hasUserReviewedListing(userId, trip.listingId);
					if (hasReviewed) {
						reviewedSet.add(trip.listingId);
					}
				}
				setReviewedListings(reviewedSet);
			} catch (error) {
				console.error("❌ Error fetching reservations:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchReservations();
	}, [userId]);

	const handleCancelTrip = async (reservationId: string) => {
		if (!userId) return;
		
		const confirmed = window.confirm(
			"Are you sure you want to cancel this reservation? This action cannot be undone."
		);
		
		if (!confirmed) return;

		try {
			await cancelReservation(reservationId, userId, "Cancelled by guest");
			
			// Refresh the reservations
			const [upcoming, cancelled] = await Promise.all([
				getUpcomingReservations(userId),
				getCancelledReservations(userId),
			]);
			
			setUpcomingTrips(upcoming);
			setCancelledTrips(cancelled);
		} catch (error) {
			console.error("Error cancelling reservation:", error);
			alert("Failed to cancel reservation. Please try again.");
		}
	};

	const getCurrentTrips = (): Reservation[] => {
		switch (activeTab) {
			case "upcoming":
				return upcomingTrips;
			case "past":
				return pastTrips;
			case "cancelled":
				return cancelledTrips;
			default:
				return [];
		}
	};

	const currentTrips = getCurrentTrips();

	return (
		<main className="min-h-screen bg-white max-w-full overflow-hidden">
			<Navbar />
			
			<section className="max-w-6xl mx-auto px-4 py-12">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-black font-lexend text-blue-600 mb-2">My Trips</h1>
					<p className="text-gray-600">Manage your bookings and travel history</p>
				</div>

				{/* Tabs */}
				<div className="flex gap-4 border-b border-gray-200 mb-8">
					<button
						onClick={() => setActiveTab("upcoming")}
						className={`px-6 py-3 font-semibold transition-colors relative ${
							activeTab === "upcoming"
								? "text-blue-600"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Upcoming
						{activeTab === "upcoming" && (
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
						)}
						{upcomingTrips.length > 0 && (
							<span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
								{upcomingTrips.length}
							</span>
						)}
					</button>
					
					<button
						onClick={() => setActiveTab("past")}
						className={`px-6 py-3 font-semibold transition-colors relative ${
							activeTab === "past"
								? "text-blue-600"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Past
						{activeTab === "past" && (
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
						)}
					</button>
					
					<button
						onClick={() => setActiveTab("cancelled")}
						className={`px-6 py-3 font-semibold transition-colors relative ${
							activeTab === "cancelled"
								? "text-blue-600"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Cancelled
						{activeTab === "cancelled" && (
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
						)}
					</button>
				</div>

				{/* Content */}
				{loading ? (
					<div className="flex items-center justify-center py-20">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
					</div>
				) : currentTrips.length === 0 ? (
					<EmptyState tab={activeTab} />
				) : (
					<div className="grid grid-cols-1 gap-6">
						{currentTrips.map((trip) => (
							<TripCard
								key={trip.id}
								trip={trip}
								tab={activeTab}
								onCancel={handleCancelTrip}
								onReview={(reservation) => {
									setSelectedReservation(reservation);
									setReviewModalOpen(true);
								}}
								hasReviewed={reviewedListings.has(trip.listingId)}
							/>
						))}
					</div>
				)}
			</section>
			
			{/* Review Modal */}
			{user && selectedReservation && (
				<ReviewModal
					isOpen={reviewModalOpen}
					onClose={() => {
						setReviewModalOpen(false);
						setSelectedReservation(null);
					}}
					reservationId={selectedReservation.id}
					listingId={selectedReservation.listingId}
					propertyName={selectedReservation.propertyName}
					propertyLocation={selectedReservation.propertyLocation}
					userId={user.uid}
					userName={user.displayName || selectedReservation.guestFirstName + " " + selectedReservation.guestLastName}
					userEmail={user.email || selectedReservation.guestEmail}
					userAvatar={user.photoURL || undefined}
					onSuccess={async () => {
						// Refresh past trips and mark as reviewed
						if (userId && selectedReservation) {
							const past = await getPastReservations(userId);
							setPastTrips(past);
							// Mark this listing as reviewed
							setReviewedListings(prev => new Set(prev).add(selectedReservation.listingId));
						}
						alert("Thank you for your review!");
					}}
				/>
			)}
			
			<Footerr />
		</main>
	);
}

function EmptyState({ tab }: { tab: TabType }) {
	const messages = {
		upcoming: {
			title: "No Upcoming Trips",
			description: "You don't have any upcoming trips. Start exploring and book your next adventure!",
		},
		past: {
			title: "No Past Trips",
			description: "You haven't completed any trips yet. Your travel history will appear here.",
		},
		cancelled: {
			title: "No Cancelled Trips",
			description: "You don't have any cancelled bookings.",
		},
	};

	return (
		<div className="text-center py-20">
			<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
				<svg
					className="w-8 h-8 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
					/>
				</svg>
			</div>
			<h3 className="text-xl font-bold text-gray-900 mb-2">{messages[tab].title}</h3>
			<p className="text-gray-600 max-w-md mx-auto">{messages[tab].description}</p>
			{tab === "upcoming" && (
				<button
					onClick={() => (window.location.href = "/browse")}
					className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
				>
					Explore Properties
				</button>
			)}
		</div>
	);
}

interface TripCardProps {
	trip: Reservation;
	tab: TabType;
	onCancel: (reservationId: string) => void;
	onReview: (reservation: Reservation) => void;
	hasReviewed?: boolean;
}

function TripCard({ trip, onCancel, onReview, hasReviewed }: TripCardProps) {
	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	const isUpcoming = trip.status === "pending" || trip.status === "confirmed" || trip.status === "checked-in";
	const isOngoing = trip.status === "checked-in";
	const isPast = trip.status === "completed";
	const isCancelled = trip.status === "cancelled" || trip.status === "declined";

	return (
		<div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
			<div className="flex flex-col md:flex-row">
				{/* Image */}
				<div className="relative w-full md:w-64 h-48 md:h-auto">
					<AppImage
						src={trip.propertyImage}
						alt={trip.propertyName}
						fillParent
						className="object-cover"
					/>
					{isOngoing && (
						<div className="absolute top-4 left-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
							Ongoing
						</div>
					)}
					{isCancelled && (
						<div className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
							Cancelled
						</div>
					)}
				</div>

				{/* Content */}
				<div className="flex-1 p-6">
					<div className="flex items-start justify-between mb-4">
						<div>
							<h3 className="text-xl font-bold text-gray-900 mb-1">
								{trip.propertyName}
							</h3>
							<p className="text-sm text-gray-600 mb-2">
								{trip.propertyLocation} • {trip.propertyType}
							</p>
							{trip.isVerified && (
								<span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">
									<svg
										className="w-3 h-3"
										viewBox="0 0 20 20"
										fill="currentColor"
										aria-hidden
									>
										<path
											fillRule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-7.071 7.07a1 1 0 01-1.415 0L3.293 9.95a1 1 0 011.414-1.414l3.1 3.1 6.364-6.364a1 1 0 011.536.021z"
											clipRule="evenodd"
										/>
									</svg>
									Verified
								</span>
							)}
						</div>
						<div className="text-right">
							<p className="text-2xl font-bold text-gray-900">
								₱{trip.total.toLocaleString()}
							</p>
							<p className="text-xs text-gray-500">Total</p>
						</div>
					</div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
						<div>
							<p className="text-gray-500 mb-1">Check-in</p>
							<p className="font-semibold">{formatDate(trip.checkInDate)}</p>
						</div>
						<div>
							<p className="text-gray-500 mb-1">Check-out</p>
							<p className="font-semibold">{formatDate(trip.checkOutDate)}</p>
						</div>
						<div>
							<p className="text-gray-500 mb-1">Guests</p>
							<p className="font-semibold">{trip.guests} Adults</p>
						</div>
						<div>
							<p className="text-gray-500 mb-1">Booking Ref</p>
							<p className="font-semibold text-blue-600">{trip.bookingReference}</p>
						</div>
					</div>

					<div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
						<div className="flex items-start gap-3">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600 mt-0.5">
								<path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
							</svg>
							<div>
								<p className="text-sm font-semibold text-gray-900 mb-1">Guest Information</p>
								<p className="text-sm text-gray-700">
									<span className="font-medium">{trip.guestFirstName} {trip.guestLastName}</span>
								</p>
								<p className="text-xs text-gray-600 mt-1">{trip.guestEmail}</p>
								{trip.guestPhone && (
									<p className="text-xs text-gray-600">{trip.guestPhone}</p>
								)}
							</div>
						</div>
					</div>					{isCancelled && trip.cancellationReason && (
						<div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
							<p className="text-sm text-red-700">
								<span className="font-semibold">Reason: </span>
								{trip.cancellationReason}
							</p>
						</div>
					)}

					{/* Actions */}
					<div className="flex flex-wrap gap-3">
						{isUpcoming && (
							<>
								<button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 11l19-9-9 19-2-7-8-3z"
										/>
									</svg>
									Get Directions
								</button>
								<button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors">
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
										/>
									</svg>
									Message Host
								</button>
								<button
									onClick={() => onCancel(trip.id)}
									className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
								>
									Cancel Booking
								</button>
							</>
						)}
						
						{isPast && (
							<>
								<button 
									onClick={() => onReview(trip)}
									disabled={hasReviewed}
									className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
										hasReviewed 
											? 'bg-gray-400 cursor-not-allowed text-white' 
											: 'bg-blue-600 hover:bg-blue-700 text-white'
									}`}
								>
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
											/>
										</svg>
									{hasReviewed ? 'Already Reviewed' : 'Leave a Review'}
								</button>
								<button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors">
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										/>
									</svg>
									Download Receipt
								</button>
							</>
						)}

						{isCancelled && (
							<button
								onClick={() => (window.location.href = "/browse")}
								className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
							>
								Book Again
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
