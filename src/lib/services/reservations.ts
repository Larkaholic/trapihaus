import {
	doc,
	getDoc,
	setDoc,
	updateDoc,
	collection,
	query,
	where,
	getDocs,
	serverTimestamp,
	Timestamp,
	orderBy,
} from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/firestore";
import type { Reservation, CreateReservationData, UpdateReservationData } from "@/types/reservation";

const RESERVATIONS_COLLECTION = "reservations";

/**
 * Generate a unique booking reference
 */
function generateBookingReference(): string {
	const d = new Date();
	const pad = (n: number) => String(n).padStart(2, "0");
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	return `TH-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${random}`;
}

/**
 * Calculate number of nights between two dates
 */
function calculateNights(checkIn: Date, checkOut: Date): number {
	const ms = checkOut.getTime() - checkIn.getTime();
	return Math.max(1, Math.ceil(ms / 86400000));
}

/**
 * Determine reservation status based on dates
 */
// Note: Status is now manually managed through host actions:
// pending → confirmed → checked-in → completed
// or pending → declined
// or any status → cancelled (by guest)

/**
 * Create a new reservation
 * @param data - Reservation data
 * @returns The created reservation ID
 */
export async function createReservation(data: CreateReservationData): Promise<string> {
	const db = getFirestoreClient();
	const reservationsRef = collection(db, RESERVATIONS_COLLECTION);
	const newReservationRef = doc(reservationsRef);

	const nights = calculateNights(data.checkInDate, data.checkOutDate);
	const subtotal = nights * data.pricePerNight;
	const total = subtotal + data.serviceFee + data.vat;
	const bookingReference = generateBookingReference();

	const reservation: Record<string, unknown> = {
		userId: data.userId,
		listingId: data.listingId,
		status: "pending", // All new bookings start as pending, awaiting host confirmation
		
		// Booking Details
		checkInDate: data.checkInDate,
		checkOutDate: data.checkOutDate,
		guests: data.guests,
		nights,

		// Guest Information
		guestFirstName: data.guestFirstName,
		guestLastName: data.guestLastName,
		guestEmail: data.guestEmail,
		guestPhone: data.guestPhone,

		// Property Snapshot
		propertyName: data.propertyName,
		propertyLocation: data.propertyLocation,
		propertyImage: data.propertyImage,
		propertyType: data.propertyType,

		// Pricing
		pricePerNight: data.pricePerNight,
		subtotal,
		serviceFee: data.serviceFee,
		vat: data.vat,
		total,

		// Payment
		paymentMethod: data.paymentMethod,
		paymentStatus: "pending",
		bookingReference,

		// Host Information
		hostId: data.hostId,
		hostName: data.hostName,
		hostEmail: data.hostEmail,
	};

	// Add optional fields only if they exist
	if (data.specialRequest) reservation.specialRequest = data.specialRequest;
	if (data.isVerified !== undefined) reservation.isVerified = data.isVerified;
	if (data.hostPhone) reservation.hostPhone = data.hostPhone;

	await setDoc(newReservationRef, {
		...reservation,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	});

	return newReservationRef.id;
}

/**
 * Get a specific reservation by ID
 * @param reservationId - Reservation document ID
 * @returns Reservation or null if not found
 */
export async function getReservation(reservationId: string): Promise<Reservation | null> {
	const db = getFirestoreClient();
	const reservationRef = doc(db, RESERVATIONS_COLLECTION, reservationId);
	const reservationSnap = await getDoc(reservationRef);

	if (!reservationSnap.exists()) {
		return null;
	}

	const data = reservationSnap.data();
	return {
		id: reservationSnap.id,
		...data,
		checkInDate: data.checkInDate instanceof Timestamp ? data.checkInDate.toDate() : new Date(data.checkInDate),
		checkOutDate: data.checkOutDate instanceof Timestamp ? data.checkOutDate.toDate() : new Date(data.checkOutDate),
		createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
		updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
		cancelledAt: data.cancelledAt instanceof Timestamp ? data.cancelledAt.toDate() : undefined,
	} as Reservation;
}

/**
 * Get all reservations for a specific user
 * @param userId - Guest's Firebase Auth UID
 * @param status - Optional status filter
 * @returns Array of Reservation
 */
export async function getUserReservations(
	userId: string,
	status?: Reservation["status"]
): Promise<Reservation[]> {
	const db = getFirestoreClient();
	const reservationsRef = collection(db, RESERVATIONS_COLLECTION);
	
	let q = query(
		reservationsRef,
		where("userId", "==", userId),
		orderBy("checkInDate", "desc")
	);

	if (status) {
		q = query(
			reservationsRef,
			where("userId", "==", userId),
			where("status", "==", status),
			orderBy("checkInDate", "desc")
		);
	}

	const querySnapshot = await getDocs(q);
	const reservations: Reservation[] = [];

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		reservations.push({
			id: doc.id,
			...data,
			checkInDate: data.checkInDate instanceof Timestamp ? data.checkInDate.toDate() : new Date(data.checkInDate),
			checkOutDate: data.checkOutDate instanceof Timestamp ? data.checkOutDate.toDate() : new Date(data.checkOutDate),
			createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
			updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
			cancelledAt: data.cancelledAt instanceof Timestamp ? data.cancelledAt.toDate() : undefined,
		} as Reservation);
	});

	return reservations;
}

/**
 * Get upcoming and ongoing reservations for a user
 * @param userId - Guest's Firebase Auth UID
 * @returns Array of upcoming/ongoing Reservation
 */
export async function getUpcomingReservations(userId: string): Promise<Reservation[]> {
	const db = getFirestoreClient();
	const reservationsRef = collection(db, RESERVATIONS_COLLECTION);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	// Get all non-cancelled and non-declined reservations
	const upcomingQuery = query(
		reservationsRef,
		where("userId", "==", userId),
		orderBy("checkInDate", "asc")
	);

	const querySnapshot = await getDocs(upcomingQuery);
	const reservations: Reservation[] = [];

	querySnapshot.forEach((docSnap) => {
		const data = docSnap.data();
		const checkInDate = data.checkInDate instanceof Timestamp ? data.checkInDate.toDate() : new Date(data.checkInDate);
		const checkOutDate = data.checkOutDate instanceof Timestamp ? data.checkOutDate.toDate() : new Date(data.checkOutDate);
		
		// Filter: only include if check-out date hasn't passed and not cancelled/declined/completed
		if (checkOutDate >= today && data.status !== "cancelled" && data.status !== "declined" && data.status !== "completed") {
			reservations.push({
				id: docSnap.id,
				...data,
				checkInDate,
				checkOutDate,
				createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
				updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
				cancelledAt: data.cancelledAt instanceof Timestamp ? data.cancelledAt.toDate() : undefined,
			} as Reservation);
		}
	});

	return reservations;
}

/**
 * Get past (completed) reservations for a user
 * @param userId - Guest's Firebase Auth UID
 * @returns Array of completed Reservation
 */
export async function getPastReservations(userId: string): Promise<Reservation[]> {
	const db = getFirestoreClient();
	const reservationsRef = collection(db, RESERVATIONS_COLLECTION);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	// Get all reservations
	const allQuery = query(
		reservationsRef,
		where("userId", "==", userId),
		orderBy("checkInDate", "desc")
	);

	const querySnapshot = await getDocs(allQuery);
	const completedReservations: Reservation[] = [];

	querySnapshot.forEach((docSnap) => {
		const data = docSnap.data();
		const checkInDate = data.checkInDate instanceof Timestamp ? data.checkInDate.toDate() : new Date(data.checkInDate);
		const checkOutDate = data.checkOutDate instanceof Timestamp ? data.checkOutDate.toDate() : new Date(data.checkOutDate);
		
		// Filter: only include if check-out date has passed and not cancelled/declined
		if (checkOutDate < today && data.status !== "cancelled" && data.status !== "declined") {
			completedReservations.push({
				id: docSnap.id,
				...data,
				checkInDate,
				checkOutDate,
				createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
				updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
				cancelledAt: data.cancelledAt instanceof Timestamp ? data.cancelledAt.toDate() : undefined,
			} as Reservation);
		}
	});

	return completedReservations;
}

/**
 * Get cancelled reservations for a user
 * @param userId - Guest's Firebase Auth UID
 * @returns Array of cancelled Reservation
 */
export async function getCancelledReservations(userId: string): Promise<Reservation[]> {
	return getUserReservations(userId, "cancelled");
}

/**
 * Update a reservation
 * @param reservationId - Reservation document ID
 * @param userId - Guest's Firebase Auth UID (for verification)
 * @param data - Partial reservation data to update
 */
export async function updateReservation(
	reservationId: string,
	userId: string,
	data: UpdateReservationData
): Promise<void> {
	const db = getFirestoreClient();
	const reservationRef = doc(db, RESERVATIONS_COLLECTION, reservationId);

	// Verify ownership
	const reservationSnap = await getDoc(reservationRef);
	if (!reservationSnap.exists()) {
		throw new Error("Reservation not found");
	}

	const reservationData = reservationSnap.data();
	if (reservationData.userId !== userId) {
		throw new Error("Unauthorized: You can only update your own reservations");
	}

	// Update the reservation
	await updateDoc(reservationRef, {
		...data,
		updatedAt: serverTimestamp(),
	});
}

/**
 * Cancel a reservation
 * @param reservationId - Reservation document ID
 * @param userId - Guest's Firebase Auth UID (for verification)
 * @param reason - Cancellation reason
 */
export async function cancelReservation(
	reservationId: string,
	userId: string,
	reason?: string
): Promise<void> {
	await updateReservation(reservationId, userId, {
		status: "cancelled",
		cancellationReason: reason,
	});

	// Also update the cancelledAt timestamp
	const db = getFirestoreClient();
	const reservationRef = doc(db, RESERVATIONS_COLLECTION, reservationId);
	await updateDoc(reservationRef, {
		cancelledAt: serverTimestamp(),
	});
}

/**
 * Get all reservations for a specific listing (for hosts)
 * @param listingId - Property listing ID
 * @param hostId - Host's Firebase Auth UID (for verification)
 * @returns Array of Reservation
 */
export async function getListingReservations(
	listingId: string,
	hostId: string
): Promise<Reservation[]> {
	const db = getFirestoreClient();
	const reservationsRef = collection(db, RESERVATIONS_COLLECTION);

	const q = query(
		reservationsRef,
		where("listingId", "==", listingId),
		where("hostId", "==", hostId),
		orderBy("checkInDate", "desc")
	);

	const querySnapshot = await getDocs(q);
	const reservations: Reservation[] = [];

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		reservations.push({
			id: doc.id,
			...data,
			checkInDate: data.checkInDate instanceof Timestamp ? data.checkInDate.toDate() : new Date(data.checkInDate),
			checkOutDate: data.checkOutDate instanceof Timestamp ? data.checkOutDate.toDate() : new Date(data.checkOutDate),
			createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
			updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
			cancelledAt: data.cancelledAt instanceof Timestamp ? data.cancelledAt.toDate() : undefined,
		} as Reservation);
	});

	return reservations;
}

/**
 * Get all reservations for a host (across all their listings)
 * @param hostId - Host's Firebase Auth UID
 * @param status - Optional status filter
 * @returns Array of Reservation
 */
export async function getHostReservations(
	hostId: string,
	status?: Reservation["status"]
): Promise<Reservation[]> {
	const db = getFirestoreClient();
	const reservationsRef = collection(db, RESERVATIONS_COLLECTION);
	
	let q = query(
		reservationsRef,
		where("hostId", "==", hostId),
		orderBy("createdAt", "desc")
	);

	if (status) {
		q = query(
			reservationsRef,
			where("hostId", "==", hostId),
			where("status", "==", status),
			orderBy("createdAt", "desc")
		);
	}

	const querySnapshot = await getDocs(q);
	const reservations: Reservation[] = [];

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		reservations.push({
			id: doc.id,
			...data,
			checkInDate: data.checkInDate instanceof Timestamp ? data.checkInDate.toDate() : new Date(data.checkInDate),
			checkOutDate: data.checkOutDate instanceof Timestamp ? data.checkOutDate.toDate() : new Date(data.checkOutDate),
			createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
			updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
			cancelledAt: data.cancelledAt instanceof Timestamp ? data.cancelledAt.toDate() : undefined,
		} as Reservation);
	});

	return reservations;
}

/**
 * Host accepts a pending reservation
 * @param reservationId - Reservation document ID
 * @param hostId - Host's Firebase Auth UID (for verification)
 */
export async function acceptReservation(
	reservationId: string,
	hostId: string
): Promise<void> {
	const db = getFirestoreClient();
	const reservationRef = doc(db, RESERVATIONS_COLLECTION, reservationId);

	const reservationSnap = await getDoc(reservationRef);
	if (!reservationSnap.exists()) {
		throw new Error("Reservation not found");
	}

	const reservationData = reservationSnap.data();
	if (reservationData.hostId !== hostId) {
		throw new Error("Unauthorized: You can only manage your own listings' reservations");
	}

	if (reservationData.status !== "pending") {
		throw new Error("Can only accept pending reservations");
	}

	await updateDoc(reservationRef, {
		status: "confirmed",
		updatedAt: serverTimestamp(),
	});
}

/**
 * Host declines a pending reservation
 * @param reservationId - Reservation document ID
 * @param hostId - Host's Firebase Auth UID (for verification)
 * @param reason - Decline reason
 */
export async function declineReservation(
	reservationId: string,
	hostId: string,
	reason?: string
): Promise<void> {
	const db = getFirestoreClient();
	const reservationRef = doc(db, RESERVATIONS_COLLECTION, reservationId);

	const reservationSnap = await getDoc(reservationRef);
	if (!reservationSnap.exists()) {
		throw new Error("Reservation not found");
	}

	const reservationData = reservationSnap.data();
	if (reservationData.hostId !== hostId) {
		throw new Error("Unauthorized: You can only manage your own listings' reservations");
	}

	if (reservationData.status !== "pending") {
		throw new Error("Can only decline pending reservations");
	}

	const updateData: {
		status: string;
		updatedAt: ReturnType<typeof serverTimestamp>;
		declineReason?: string;
	} = {
		status: "declined",
		updatedAt: serverTimestamp(),
	};
	if (reason) updateData.declineReason = reason;

	await updateDoc(reservationRef, updateData);
}

/**
 * Host marks a confirmed reservation as checked-in
 * @param reservationId - Reservation document ID
 * @param hostId - Host's Firebase Auth UID (for verification)
 */
export async function checkInReservation(
	reservationId: string,
	hostId: string
): Promise<void> {
	const db = getFirestoreClient();
	const reservationRef = doc(db, RESERVATIONS_COLLECTION, reservationId);

	const reservationSnap = await getDoc(reservationRef);
	if (!reservationSnap.exists()) {
		throw new Error("Reservation not found");
	}

	const reservationData = reservationSnap.data();
	if (reservationData.hostId !== hostId) {
		throw new Error("Unauthorized: You can only manage your own listings' reservations");
	}

	if (reservationData.status !== "confirmed") {
		throw new Error("Can only check in confirmed reservations");
	}

	await updateDoc(reservationRef, {
		status: "checked-in",
		updatedAt: serverTimestamp(),
	});
}

/**
 * Host marks a checked-in reservation as completed
 * @param reservationId - Reservation document ID
 * @param hostId - Host's Firebase Auth UID (for verification)
 */
export async function completeReservation(
	reservationId: string,
	hostId: string
): Promise<void> {
	const db = getFirestoreClient();
	const reservationRef = doc(db, RESERVATIONS_COLLECTION, reservationId);

	const reservationSnap = await getDoc(reservationRef);
	if (!reservationSnap.exists()) {
		throw new Error("Reservation not found");
	}

	const reservationData = reservationSnap.data();
	if (reservationData.hostId !== hostId) {
		throw new Error("Unauthorized: You can only manage your own listings' reservations");
	}

	if (reservationData.status !== "checked-in") {
		throw new Error("Can only complete checked-in reservations");
	}

	await updateDoc(reservationRef, {
		status: "completed",
		updatedAt: serverTimestamp(),
	});
}
