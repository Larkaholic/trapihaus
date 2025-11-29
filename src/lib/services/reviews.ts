import {
	doc,
	setDoc,
	collection,
	query,
	where,
	getDocs,
	serverTimestamp,
	Timestamp,
	orderBy,
	limit,
	updateDoc,
} from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/firestore";
import type { Review, CreateReviewData } from "@/types/review";

const REVIEWS_COLLECTION = "reviews";
const LISTINGS_COLLECTION = "listings";

/**
 * Create a new review
 * @param data - Review data
 * @returns The created review ID
 */
export async function createReview(data: CreateReviewData): Promise<string> {
	const db = getFirestoreClient();
	const reviewsRef = collection(db, REVIEWS_COLLECTION);
	const newReviewRef = doc(reviewsRef);

	// Check if user already reviewed this listing
	const existingReviewQuery = query(
		reviewsRef,
		where("userId", "==", data.userId),
		where("listingId", "==", data.listingId)
	);
	const existingReviews = await getDocs(existingReviewQuery);
	
	if (!existingReviews.empty) {
		throw new Error("You have already reviewed this property");
	}

	// Create the review
	await setDoc(newReviewRef, {
		...data,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	});

	// Update listing's average rating and review count
	await updateListingRating(data.listingId);

	return newReviewRef.id;
}

/**
 * Get all reviews for a listing
 * @param listingId - Property listing ID
 * @returns Array of Review
 */
export async function getListingReviews(listingId: string): Promise<Review[]> {
	const db = getFirestoreClient();
	const reviewsRef = collection(db, REVIEWS_COLLECTION);
	
	const q = query(
		reviewsRef,
		where("listingId", "==", listingId),
		orderBy("createdAt", "desc")
	);

	const querySnapshot = await getDocs(q);
	const reviews: Review[] = [];

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		reviews.push({
			id: doc.id,
			...data,
			createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
			updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
		} as Review);
	});

	return reviews;
}

/**
 * Get top reviews (4.5+ stars) for displaying in testimonials
 * @param limitCount - Maximum number of reviews to fetch
 * @returns Array of Review
 */
export async function getTopReviews(limitCount: number = 16): Promise<Review[]> {
	const db = getFirestoreClient();
	const reviewsRef = collection(db, REVIEWS_COLLECTION);
	
	const q = query(
		reviewsRef,
		where("rating", ">=", 4.5),
		orderBy("rating", "desc"),
		orderBy("createdAt", "desc"),
		limit(limitCount)
	);

	const querySnapshot = await getDocs(q);
	const reviews: Review[] = [];

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		reviews.push({
			id: doc.id,
			...data,
			createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
			updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
		} as Review);
	});

	return reviews;
}

/**
 * Check if user has reviewed a listing
 * @param userId - User's Firebase Auth UID
 * @param listingId - Property listing ID
 * @returns boolean
 */
export async function hasUserReviewedListing(userId: string, listingId: string): Promise<boolean> {
	const db = getFirestoreClient();
	const reviewsRef = collection(db, REVIEWS_COLLECTION);
	
	const q = query(
		reviewsRef,
		where("userId", "==", userId),
		where("listingId", "==", listingId),
		limit(1)
	);

	const querySnapshot = await getDocs(q);
	return !querySnapshot.empty;
}

/**
 * Update listing's average rating based on all reviews
 * @param listingId - Property listing ID
 */
async function updateListingRating(listingId: string): Promise<void> {
	const db = getFirestoreClient();
	
	// Get all reviews for this listing
	const reviews = await getListingReviews(listingId);
	
	if (reviews.length === 0) return;

	// Calculate average rating
	const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
	const averageRating = totalRating / reviews.length;

	// Update the listing
	const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
	await updateDoc(listingRef, {
		averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
		reviewCount: reviews.length,
	});
}

/**
 * Get user's review for a listing
 * @param userId - User's Firebase Auth UID
 * @param listingId - Property listing ID
 * @returns Review or null
 */
export async function getUserReviewForListing(userId: string, listingId: string): Promise<Review | null> {
	const db = getFirestoreClient();
	const reviewsRef = collection(db, REVIEWS_COLLECTION);
	
	const q = query(
		reviewsRef,
		where("userId", "==", userId),
		where("listingId", "==", listingId),
		limit(1)
	);

	const querySnapshot = await getDocs(q);
	
	if (querySnapshot.empty) return null;

	const doc = querySnapshot.docs[0];
	const data = doc.data();
	
	return {
		id: doc.id,
		...data,
		createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
		updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
	} as Review;
}

/**
 * Get all reviews for properties owned by a host
 * @param hostId - Host's Firebase Auth UID
 * @returns Array of Review with listing info
 */
export async function getHostReviews(hostId: string): Promise<Review[]> {
	const db = getFirestoreClient();
	
	// First, get all listings for this host
	const listingsRef = collection(db, LISTINGS_COLLECTION);
	const listingsQuery = query(
		listingsRef,
		where("userId", "==", hostId)
	);
	
	const listingsSnapshot = await getDocs(listingsQuery);
	const listingIds = listingsSnapshot.docs.map(doc => doc.id);
	
	if (listingIds.length === 0) return [];
	
	// Then get all reviews for these listings
	const reviewsRef = collection(db, REVIEWS_COLLECTION);
	const allReviews: Review[] = [];
	
	// Firestore 'in' queries support up to 10 items, so batch if needed
	const batchSize = 10;
	for (let i = 0; i < listingIds.length; i += batchSize) {
		const batch = listingIds.slice(i, i + batchSize);
		const reviewsQuery = query(
			reviewsRef,
			where("listingId", "in", batch),
			orderBy("createdAt", "desc")
		);
		
		const reviewsSnapshot = await getDocs(reviewsQuery);
		reviewsSnapshot.forEach((doc) => {
			const data = doc.data();
			allReviews.push({
				id: doc.id,
				...data,
				createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
				updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
			} as Review);
		});
	}
	
	// Sort by date descending
	return allReviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
