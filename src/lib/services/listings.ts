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
	limit as firestoreLimit
} from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/firestore";
import type { PropertyListing, CreateListingData, UpdateListingData } from "@/types/listing";

const LISTINGS_COLLECTION = "listings";

/**
 * Create a new property listing
 * @param userId - Owner's Firebase Auth UID
 * @param data - Listing data from the form
 * @returns The created listing ID
 */
export async function createListing(
	userId: string,
	data: CreateListingData
): Promise<string> {
	const db = getFirestoreClient();
	const listingsRef = collection(db, LISTINGS_COLLECTION);
	const newListingRef = doc(listingsRef);

	const listing: Omit<PropertyListing, "id" | "createdAt" | "updatedAt"> = {
		userId,
		status: "draft", // Start as draft, change to "pending" when submitted for review
		
		// Host Information
		hostEmail: data.hostEmail,
		hostFirstName: data.hostFirstName,
		hostLastName: data.hostLastName,
		hostPhone: data.hostPhone,
		hostPhoneCountry: data.hostPhoneCountry,

		// Property Details
		propertyType: data.propertyType,
		propertyName: data.propertyName,
		description: data.description,
		city: data.city,
		barangay: data.barangay,
		streetAddress: data.streetAddress,
		landmark: data.landmark,
		...(data.latitude !== undefined && { latitude: data.latitude }),
		...(data.longitude !== undefined && { longitude: data.longitude }),

		// Property Specifications
		bedrooms: data.bedrooms,
		guests: data.guests,
		bathrooms: data.bathrooms,
		size: data.size,

		// Pricing
		rate: data.rate,
		ratePeriod: data.ratePeriod as PropertyListing["ratePeriod"],

		// Amenities & Rules
		amenities: data.amenities || [],
		houseRules: data.houseRules,

		// Photos
		photos: data.photos || [],
		...(data.photos && data.photos.length > 0 ? { coverPhoto: data.photos[0] } : {}),

		// Availability
		availability: data.availability as PropertyListing["availability"],
		minStay: data.minStay,
		maxStay: data.maxStay,

		// Optional statistics
		totalBookings: 0,
		averageRating: 0,
		reviewCount: 0,
	};

	await setDoc(newListingRef, {
		...listing,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	});

	return newListingRef.id;
}

/**
 * Get a specific listing by ID
 * @param listingId - Listing document ID
 * @returns PropertyListing or null if not found
 */
export async function getListing(listingId: string): Promise<PropertyListing | null> {
	const db = getFirestoreClient();
	const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
	const listingSnap = await getDoc(listingRef);

	if (!listingSnap.exists()) {
		return null;
	}

	const data = listingSnap.data();
	return {
		id: listingSnap.id,
		...data,
		createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
		updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
	} as PropertyListing;
}

/**
 * Get all listings for a specific user
 * @param userId - Owner's Firebase Auth UID
 * @returns Array of PropertyListing
 */
export async function getUserListings(userId: string): Promise<PropertyListing[]> {
	const db = getFirestoreClient();
	const listingsRef = collection(db, LISTINGS_COLLECTION);
	const q = query(
		listingsRef, 
		where("userId", "==", userId),
		orderBy("createdAt", "desc")
	);

	const querySnapshot = await getDocs(q);
	const listings: PropertyListing[] = [];

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		listings.push({
			id: doc.id,
			...data,
			createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
			updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
		} as PropertyListing);
	});

	return listings;
}

/**
 * Update an existing listing
 * @param listingId - Listing document ID
 * @param userId - Owner's Firebase Auth UID (for verification)
 * @param data - Partial listing data to update
 */
export async function updateListing(
	listingId: string,
	userId: string,
	data: UpdateListingData
): Promise<void> {
	const db = getFirestoreClient();
	const listingRef = doc(db, LISTINGS_COLLECTION, listingId);

	// Verify ownership
	const listingSnap = await getDoc(listingRef);
	if (!listingSnap.exists()) {
		throw new Error("Listing not found");
	}

	const listingData = listingSnap.data();
	if (listingData.userId !== userId) {
		throw new Error("Unauthorized: You can only update your own listings");
	}

	// Update the listing
	await updateDoc(listingRef, {
		...data,
		updatedAt: serverTimestamp(),
	});
}

/**
 * Submit a listing for review (change status from draft to pending)
 * @param listingId - Listing document ID
 * @param userId - Owner's Firebase Auth UID (for verification)
 */
export async function submitListingForReview(
	listingId: string,
	userId: string
): Promise<void> {
	await updateListing(listingId, userId, { status: "pending" });
}

/**
 * Get all approved listings (for public browsing)
 * @param limitCount - Maximum number of listings to return
 * @returns Array of approved PropertyListing
 */
export async function getApprovedListings(limitCount?: number): Promise<PropertyListing[]> {
	const db = getFirestoreClient();
	const listingsRef = collection(db, LISTINGS_COLLECTION);
	
	let q = query(
		listingsRef,
		where("status", "==", "approved"),
		orderBy("createdAt", "desc")
	);

	if (limitCount) {
		q = query(q, firestoreLimit(limitCount));
	}

	const querySnapshot = await getDocs(q);
	const listings: PropertyListing[] = [];

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		listings.push({
			id: doc.id,
			...data,
			createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
			updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
		} as PropertyListing);
	});

	return listings;
}

/**
 * Search listings by city or barangay
 * @param searchTerm - City or barangay to search for
 * @returns Array of matching approved listings
 */
export async function searchListings(searchTerm: string): Promise<PropertyListing[]> {
	const db = getFirestoreClient();
	const listingsRef = collection(db, LISTINGS_COLLECTION);

	// Search in both city and barangay fields
	const cityQuery = query(
		listingsRef,
		where("status", "==", "approved"),
		where("city", "==", searchTerm),
		orderBy("createdAt", "desc")
	);

	const barangayQuery = query(
		listingsRef,
		where("status", "==", "approved"),
		where("barangay", "==", searchTerm),
		orderBy("createdAt", "desc")
	);

	const [citySnapshot, barangaySnapshot] = await Promise.all([
		getDocs(cityQuery),
		getDocs(barangayQuery)
	]);

	const listings: PropertyListing[] = [];
	const seenIds = new Set<string>();

	// Combine results, avoiding duplicates
	[citySnapshot, barangaySnapshot].forEach((snapshot) => {
		snapshot.forEach((doc) => {
			if (!seenIds.has(doc.id)) {
				seenIds.add(doc.id);
				const data = doc.data();
				listings.push({
					id: doc.id,
					...data,
					createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
					updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
				} as PropertyListing);
			}
		});
	});

	return listings;
}

/**
 * Mark a listing as temporarily unavailable (booked)
 * Single accommodations are automatically marked unavailable when booked
 * @param listingId - Listing document ID
 */
export async function markListingUnavailable(listingId: string): Promise<void> {
	const db = getFirestoreClient();
	const listingRef = doc(db, LISTINGS_COLLECTION, listingId);

	await updateDoc(listingRef, {
		availability: "Temporarily Unavailable",
		updatedAt: serverTimestamp(),
	});
}

/**
 * Mark a listing as available again
 * @param listingId - Listing document ID
 */
export async function markListingAvailable(listingId: string): Promise<void> {
	const db = getFirestoreClient();
	const listingRef = doc(db, LISTINGS_COLLECTION, listingId);

	await updateDoc(listingRef, {
		availability: "Available for Booking",
		updatedAt: serverTimestamp(),
	});
}
