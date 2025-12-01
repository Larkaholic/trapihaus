import {
	collection,
	query,
	where,
	getDocs,
	Timestamp,
	orderBy,
	limit,
} from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/firestore";
import type { Reservation } from "@/types/reservation";
import type { Review } from "@/types/review";

/**
 * Get dashboard statistics for a host
 */
export async function getDashboardStats(userId: string) {
	const db = getFirestoreClient();
	
	// Get active listings count
	const listingsRef = collection(db, "listings");
	const activeListingsQuery = query(
		listingsRef,
		where("userId", "==", userId),
		where("status", "==", "approved")
	);
	const activeListingsSnapshot = await getDocs(activeListingsQuery);
	const activeListings = activeListingsSnapshot.size;

	// Get reservations for this month
	const now = new Date();
	const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

	const reservationsRef = collection(db, "reservations");
	const thisMonthQuery = query(
		reservationsRef,
		where("hostId", "==", userId),
		where("checkInDate", ">=", Timestamp.fromDate(firstDayOfMonth)),
		where("checkInDate", "<=", Timestamp.fromDate(lastDayOfMonth))
	);
	const thisMonthSnapshot = await getDocs(thisMonthQuery);
	const reservationsThisMonth = thisMonthSnapshot.size;

	// Get last month reservations for comparison
	const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
	
	const lastMonthQuery = query(
		reservationsRef,
		where("hostId", "==", userId),
		where("checkInDate", ">=", Timestamp.fromDate(firstDayOfLastMonth)),
		where("checkInDate", "<=", Timestamp.fromDate(lastDayOfLastMonth))
	);
	const lastMonthSnapshot = await getDocs(lastMonthQuery);
	const reservationsLastMonth = lastMonthSnapshot.size;

	const reservationChange = reservationsLastMonth > 0
		? Math.round(((reservationsThisMonth - reservationsLastMonth) / reservationsLastMonth) * 100)
		: 0;

	// Get total earnings (sum of all completed reservations)
	const completedQuery = query(
		reservationsRef,
		where("hostId", "==", userId),
		where("status", "==", "completed")
	);
	const completedSnapshot = await getDocs(completedQuery);
	
	let totalEarnings = 0;
	completedSnapshot.forEach((doc) => {
		const data = doc.data();
		totalEarnings += data.total || 0;
	});

	return {
		activeListings,
		reservationsThisMonth,
		reservationsChangeText: reservationChange > 0 
			? `+${reservationChange}% from last month` 
			: reservationChange < 0 
			? `${reservationChange}% from last month`
			: "No change from last month",
		totalEarnings: Math.round(totalEarnings),
		earningsChangeText: "+0% from yesterday", // This would require daily tracking
	};
}

/**
 * Get revenue data for the last 3 months
 */
export async function getRevenueData(userId: string) {
	const db = getFirestoreClient();
	const now = new Date();
	const reservationsRef = collection(db, "reservations");

	const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	const revenueData = [];

	// Get last 3 months
	for (let i = 2; i >= 0; i--) {
		const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const monthLabel = monthNames[monthDate.getMonth()];
		const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
		const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

		const monthQuery = query(
			reservationsRef,
			where("hostId", "==", userId),
			where("status", "==", "completed"),
			where("checkOutDate", ">=", Timestamp.fromDate(firstDay)),
			where("checkOutDate", "<=", Timestamp.fromDate(lastDay))
		);

		const monthSnapshot = await getDocs(monthQuery);
		let monthlyRevenue = 0;

		monthSnapshot.forEach((doc) => {
			const data = doc.data();
			monthlyRevenue += data.total || 0;
		});

		revenueData.push({
			label: monthLabel,
			value: Math.round(monthlyRevenue),
		});
	}

	return revenueData;
}

/**
 * Get recent reservations for a host
 */
export async function getRecentReservations(userId: string, limitCount: number = 5) {
	const db = getFirestoreClient();
	const reservationsRef = collection(db, "reservations");

	const recentQuery = query(
		reservationsRef,
		where("hostId", "==", userId),
		orderBy("createdAt", "desc"),
		limit(limitCount)
	);

	const snapshot = await getDocs(recentQuery);
	const reservations: Array<{
		id: string;
		guest: string;
		property: string;
		checkIn: string;
		status: "Confirmed" | "Pending" | "Cancelled";
		amount: string;
	}> = [];

	snapshot.forEach((doc) => {
		const data = doc.data() as Reservation;
		const guestName = data.guestFirstName && data.guestLastName
			? `${data.guestFirstName} ${data.guestLastName}`
			: "Guest";

		let displayStatus: "Confirmed" | "Pending" | "Cancelled" = "Pending";
		if (data.status === "completed" || data.status === "confirmed" || data.status === "checked-in") {
			displayStatus = "Confirmed";
		} else if (data.status === "cancelled" || data.status === "declined") {
			displayStatus = "Cancelled";
		}

		reservations.push({
			id: doc.id,
			guest: guestName,
			property: data.propertyName || "Property",
			checkIn: data.checkInDate instanceof Timestamp
				? data.checkInDate.toDate().toLocaleDateString()
				: new Date(data.checkInDate).toLocaleDateString(),
			status: displayStatus,
			amount: `₱${(data.total || 0).toLocaleString()}`,
		});
	});

	return reservations;
}

/**
 * Get latest reviews for host's properties
 */
export async function getLatestReviews(userId: string, limitCount: number = 5) {
	const db = getFirestoreClient();

	// First, get the host's listing IDs
	const listingsRef = collection(db, "listings");
	const listingsQuery = query(listingsRef, where("userId", "==", userId));
	const listingsSnapshot = await getDocs(listingsQuery);

	const listingIds: string[] = [];
	listingsSnapshot.forEach((doc) => {
		listingIds.push(doc.id);
	});

	if (listingIds.length === 0) {
		return [];
	}

	// Get reviews for these listings
	const reviewsRef = collection(db, "reviews");
	const reviews: Array<{
		id: string;
		name: string;
		rating: number;
		quote: string;
		room?: string;
	}> = [];

	// Firestore doesn't support 'in' queries with more than 10 items, so we batch
	const batchSize = 10;
	for (let i = 0; i < listingIds.length; i += batchSize) {
		const batch = listingIds.slice(i, i + batchSize);
		const reviewsQuery = query(
			reviewsRef,
			where("listingId", "in", batch),
			orderBy("createdAt", "desc"),
			limit(limitCount)
		);

		const reviewsSnapshot = await getDocs(reviewsQuery);
		reviewsSnapshot.forEach((doc) => {
			const data = doc.data() as Review;
			reviews.push({
				id: doc.id,
				name: data.userName,
				rating: data.rating,
				quote: data.comment,
				room: undefined, // We don't have property name in review, could join if needed
			});
		});
	}

	// Sort by most recent and limit
	return reviews.slice(0, limitCount);
}
