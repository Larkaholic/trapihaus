"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import AppImage from "../components/ui/AppImage";
import { getListing } from "@/lib/services/listings";
import { getListingReviews } from "@/lib/services/reviews";
import { getUserProfile } from "@/lib/services/userProfile";
import type { PropertyListing } from "@/types/listing";
import type { Review } from "@/types/review";
import type { UserProfile } from "@/types/user";

// Dynamically import PropertyMap to avoid SSR issues with Leaflet
const PropertyMap = dynamic(() => import("./PropertyMap"), { ssr: false });

export default function Listing() {
	const router = useRouter();
	const [guests, setGuests] = useState(0);
	const [checkIn, setCheckIn] = useState("");
	const [checkOut, setCheckOut] = useState("");
	const [quote, setQuote] = useState<null | { nights: number; subtotal: number; total: number }>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [listingData, setListingData] = useState<PropertyListing | null>(null);
	const [loading, setLoading] = useState(true);
	const [listingId, setListingId] = useState<string | null>(null);
	const [reviews, setReviews] = useState<Review[]>([]);
	const [reviewsLoading, setReviewsLoading] = useState(false);
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [hostProfile, setHostProfile] = useState<UserProfile | null>(null);

	// Get today's date in YYYY-MM-DD format for min date validation
	const today = new Date().toISOString().split('T')[0];

	// Get listing ID from URL hash
	useEffect(() => {
		const hash = window.location.hash.slice(1); // Remove the # symbol
		if (hash) {
			setListingId(hash);
		} else {
			setLoading(false);
		}
	}, []);

	// Fetch full listing details from Firebase
	useEffect(() => {
		async function fetchListingDetails() {
			if (!listingId) {
				setLoading(false);
				return;
			}

			try {
				const data = await getListing(listingId);
				setListingData(data);

				// Fetch host profile
				if (data?.userId) {
					try {
						const profile = await getUserProfile(data.userId);
						setHostProfile(profile);
					} catch (profileError) {
						console.error("Failed to fetch host profile:", profileError);
					}
				}

				// Fetch reviews for this listing
				if (data?.id) {
					setReviewsLoading(true);
					try {
						const listingReviews = await getListingReviews(data.id);
						setReviews(listingReviews);
					} catch (reviewError) {
						console.error("Failed to fetch reviews:", reviewError);
					} finally {
						setReviewsLoading(false);
					}
				}
			} catch (error) {
				console.error("Failed to fetch listing details:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchListingDetails();
	}, [listingId]);

	// Use Firebase data with sensible defaults
	const displayTitle = listingData?.propertyName || 'Property Listing';
	const displayLocation = listingData ? `${listingData.barangay}, ${listingData.city}` : 'Baguio City';
	const displayPrice = listingData ? parseFloat(listingData.rate.replace(/[^0-9]/g, "")) : 2500;
	const displayRating = listingData?.averageRating || 0;
	const displayImage = listingData?.coverPhoto || listingData?.photos?.[0] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1600&q=80";
	const displayVerified = listingData?.status === "approved";
	const displayDescription = listingData?.description || "No description available for this property.";
	const displayAmenities = listingData?.amenities || [];
	const displayHostName = listingData ? `${listingData.hostFirstName} ${listingData.hostLastName}` : "Host";
	const displayRatePeriod = listingData?.ratePeriod || 'per night';

	const CURRENCY = String.fromCharCode(0x20b1);
	const PRICE_PER_NIGHT = displayPrice;
	const SERVICE_FEE = 750;

	// Bedroom images from Unsplash to match the provided visuals
	const mainImage = displayImage;
	const thumbs = [
		displayImage,
		...(listingData?.photos?.slice(1, 4) || [
			"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
			"https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
			"https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80",
		])
	];

	// Combine all images for lightbox
	const allImages = [mainImage, ...thumbs];

	// Amenity icon mapping
	const getAmenityIcon = (amenityKey: string) => {
		const iconMap: Record<string, React.ReactNode> = {
			wifi: (
				<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
					<path d="M5 12a10 10 0 0114 0" />
					<path d="M8.5 15.5a6 6 0 016 0" />
					<path d="M12 19h.01" />
				</svg>
			),
			parking: (
				<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
					<rect x="3" y="3" width="18" height="18" rx="2" />
					<path d="M9 17V7h4a3 3 0 110 6H9" />
				</svg>
			),
			kitchen: (
				<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
					<path d="M3 10h14a4 4 0 010 8H3z" />
					<path d="M17 10V6a3 3 0 013-3h1v7" />
				</svg>
			),
			tv: (
				<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
					<rect x="2" y="6" width="20" height="14" rx="2" />
					<path d="M12 2l4 4M12 2L8 6" />
				</svg>
			),
			aircon: (
				<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
					<path d="M12 2v20M2 12h20" />
					<path d="M4 4l4 4M20 4l-4 4M4 20l4-4M20 20l-4-4" />
				</svg>
			),
			heating: (
				<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
					<path d="M12 3v8a4 4 0 104 4" />
				</svg>
			),
			hotwater: (
				<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
					<path d="M12 2v10" />
					<path d="M12 18v4" />
					<path d="M7.5 7.5L12 12l4.5-4.5" />
				</svg>
			),
		};

		return iconMap[amenityKey] || (
			<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
				<circle cx="12" cy="12" r="10" />
				<path d="M12 8v4M12 16h.01" />
			</svg>
		);
	};

	// Amenity label mapping
	const getAmenityLabel = (amenityKey: string) => {
		const labelMap: Record<string, string> = {
			wifi: "Wi-Fi",
			parking: "Parking",
			kitchen: "Kitchen",
			tv: "TV",
			aircon: "Air Conditioning",
			heating: "Heating",
			hotwater: "Hot Water",
		};
		return labelMap[amenityKey] || amenityKey.charAt(0).toUpperCase() + amenityKey.slice(1);
	};

	// Helper to get initials from name
	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map(n => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	// Helper to format date
	const formatReviewDate = (date: Date) => {
		return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	};

	return (
		<main className="max-w-full mx-auto px-6 py-10 bg-[#F5F5F5] mb-[80px]">
			{loading ? (
				<div className="flex items-center justify-center py-12">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1078CF]"></div>
				</div>
			) : (
				<>
			{/* Page header */}
			<header className="mb-6 flex items-start justify-between gap-4 bg-white px-7 py-5 rounded-[40]">
				<div>
					<h1 className="text-3xl md:text-[32px] leading-tight font-extrabold font-lexend">{displayTitle}</h1>
					<div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
						{displayVerified && (
							<span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">
								{/* check icon */}
								<svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.071 7.07a1 1 0 01-1.415 0L3.293 9.95a1 1 0 011.414-1.414l3.1 3.1 6.364-6.364a1 1 0 011.536.021z" clipRule="evenodd" />
								</svg>
								Verified
							</span>
						)}
						<span className="inline-flex items-center gap-2">
							<svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
								<path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
							</svg>
							{displayLocation}
						</span>
						<span className="inline-flex items-center gap-1 text-xs">
							<svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
								<rect x="3" y="3" width="7" height="7"/>
								<rect x="14" y="3" width="7" height="7"/>
								<rect x="14" y="14" width="7" height="7"/>
								<rect x="3" y="14" width="7" height="7"/>
							</svg>
							{listingData?.bedrooms || 1} {listingData?.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
						</span>
						<span className="inline-flex items-center gap-1 text-xs">
							<svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
								<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
								<circle cx="9" cy="7" r="4"/>
								<path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
								<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
							</svg>
							Max {listingData?.guests || 2} {listingData?.guests === 1 ? 'Guest' : 'Guests'}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<button className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50">
						<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
							<path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/>
							<path d="M16 6l-4-4-4 4"/>
							<path d="M12 2v14"/>
						</svg>
						Share
					</button>
					<button className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50">
						<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
							<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
						</svg>
						Save
					</button>
				</div>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-10 items-start">
				{/* Left Sidebar (Booking Card) */}
				<aside className="space-y-6">
					<div className="bg-white rounded-[28px] p-6 shadow-md border border-[#F3F4F6] top-8 transition-transform duration-300 will-change-transform"
						style={{
							transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
						}}
					>
						<div className="flex items-center justify-between bg-[#F9FAFB] p-5 rounded-[20px] mb-5">
							<div>
								<div className="text-2xl font-bold font-lexend">{CURRENCY}{PRICE_PER_NIGHT.toLocaleString()}</div>
								<div className="text-xs text-gray-500">{displayRatePeriod}</div>
							</div>
							<div className="text-sm text-yellow-500 flex items-center gap-2">
								<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
									<path d="M12 .587l3.668 7.431L23.4 9.748l-5.7 5.556L18.82 24 12 19.897 5.18 24l1.12-8.696L.6 9.748l7.732-1.73z" />
								</svg>
								<span className="font-medium text-gray-700">{displayRating.toFixed(1)}</span>
								<span className="text-gray-400 text-xs">({listingData?.reviewCount || 0} Reviews)</span>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3 mb-3">
							<label className="text-xs text-gray-600">Check-in</label>
							<label className="text-xs text-gray-600">Check-out</label>
							<div className="relative">
								<svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
									<line x1="16" y1="2" x2="16" y2="6"/>
									<line x1="8" y1="2" x2="8" y2="6"/>
									<line x1="3" y1="10" x2="21" y2="10"/>
								</svg>
							<input
								type="date"
								value={checkIn}
								min={today}
								onChange={(e) => {
									setCheckIn(e.target.value);
									// Reset checkout if it's before new check-in
									if (checkOut && e.target.value && new Date(checkOut) <= new Date(e.target.value)) {
										setCheckOut('');
									}
								}}
								placeholder="mm/dd/yyyy"
								className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm"
							/>
							</div>
							<div className="relative">
								<svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
									<line x1="16" y1="2" x2="16" y2="6"/>
									<line x1="8" y1="2" x2="8" y2="6"/>
									<line x1="3" y1="10" x2="21" y2="10"/>
								</svg>
							<input
								type="date"
								value={checkOut}
								min={checkIn || today}
								onChange={(e) => setCheckOut(e.target.value)}
								placeholder="mm/dd/yyyy"
								className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm"
							/>
							</div>
						</div>

						<div className="mb-4">
							<div className="text-xs text-gray-600 mb-1">Guest</div>
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-2 border border-gray-200 rounded-full px-2 py-1">
									<button
										type="button"
										aria-label="decrease guests"
										onClick={() => setGuests((g) => Math.max(0, g - 1))}
										className="w-7 h-7 rounded-md bg-gray-100"
									>
										-
									</button>
									<div className="w-8 text-center text-sm font-medium">{guests}</div>
									<button
										type="button"
										aria-label="increase guests"
										onClick={() => {
											const maxGuests = listingData?.guests || 2;
											setGuests((g) => Math.min(maxGuests, g + 1));
										}}
										className="w-7 h-7 rounded-md bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
										disabled={guests >= (listingData?.guests || 2)}
									>
										+
									</button>
								</div>
								<button
									onClick={() => {
										// Validate inputs and compute nights
										try {
										const ci = checkIn ? new Date(checkIn) : null;
										const co = checkOut ? new Date(checkOut) : null;
										if (!ci || !co) {
											setErrorMsg("Please select check‑in and check‑out dates.");
											setQuote(null);
											return;
										}
										const todayDate = new Date();
										todayDate.setHours(0, 0, 0, 0);
										if (ci < todayDate) {
											setErrorMsg("Check-in date cannot be in the past.");
											setQuote(null);
											return;
										}
										if (co <= ci) {
											setErrorMsg("Check-out date must be after check-in date.");
											setQuote(null);
											return;
										}
										const ms = co.getTime() - ci.getTime();
										const nights = Math.ceil(ms / (1000 * 60 * 60 * 24));
										if (Number.isNaN(nights) || nights <= 0) {
											setErrorMsg("Please choose a valid date range.");
											setQuote(null);
											return;
										}
											if (guests <= 0) {
												setErrorMsg("Please select at least 1 guest.");
												setQuote(null);
												return;
											}
											const maxGuests = listingData?.guests || 2;
											if (guests > maxGuests) {
												setErrorMsg(`This property can accommodate a maximum of ${maxGuests} ${maxGuests === 1 ? 'guest' : 'guests'}.`);
												setQuote(null);
												return;
											}
											const subtotal = nights * PRICE_PER_NIGHT;
											const total = subtotal + SERVICE_FEE;
											setQuote({ nights, subtotal, total });
											setErrorMsg(null);
										} catch {
											setErrorMsg("Something went wrong. Try again.");
											setQuote(null);
										}
									}}
									className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium"
								>
									Check Availability
								</button>
							</div>

							{errorMsg && (
								<p className="mt-2 text-xs text-red-500">{errorMsg}</p>
							)}

							{/* Quote breakdown once user checks availability */}
							{quote && (
								<div className="mt-4">
									<hr className="border-t border-gray-100" />
									<div className="py-4 space-y-3">
										<div className="flex items-center justify-between text-sm">
											<span className="font-semibold text-gray-700">{CURRENCY}{PRICE_PER_NIGHT.toLocaleString()} × {quote.nights} Nights</span>
											<span className="font-medium">{CURRENCY}{quote.subtotal.toLocaleString()}</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className="text-gray-700">Service Fee</span>
											<span className="font-medium">{CURRENCY}{SERVICE_FEE.toLocaleString()}</span>
										</div>
										<hr className="border-t border-gray-100" />
										<div className="flex items-center justify-between text-base font-semibold">
											<span>Total</span>
											<span>{CURRENCY}{quote.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
										</div>
										<button
											className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
											onClick={() => {
												const params = new URLSearchParams({
													checkIn,
													checkOut,
													guests: String(guests),
													nights: String(quote.nights),
													pricePerNight: String(PRICE_PER_NIGHT),
													serviceFee: String(SERVICE_FEE),
													subtotal: String(quote.subtotal),
													total: String(quote.total),
													propertyName: displayTitle,
													propertyLocation: displayLocation,
													propertyImage: displayImage,
													propertyType: listingData?.propertyType || 'Transient',
													verified: String(displayVerified),
													// Add required fields for reservation creation
													listingId: listingData?.id || '',
													hostId: listingData?.userId || '',
													hostName: listingData ? `${listingData.hostFirstName} ${listingData.hostLastName}` : 'Property Host',
													hostEmail: listingData?.hostEmail || '',
												});
												router.push(`/Checkout?${params.toString()}`);
											}}
										>
											Reserve
										</button>
										<p className="mt-2 text-center text-xs text-gray-400">You won’t be charged yet</p>
										<div className="mt-2 w-full flex justify-center">
											<span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 text-xs px-5 py-1">Free cancellation for 24 hours</span>
										</div>
									</div>
								</div>
							)}
						</div>
						<div className="border-t border-gray-100 pt-4">
							<div className="flex items-center gap-3">
								{hostProfile?.photoURL ? (
									<AppImage 
										src={hostProfile.photoURL} 
										alt={`Photo of host, ${displayHostName}`} 
										width={48} 
										height={48} 
										className="rounded-full object-cover" 
										style={{ width: '48px', height: '48px' }} 
									/>
								) : (
									<div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
										{getInitials(displayHostName)}
									</div>
								)}
								<div>
									<div className="text-sm font-semibold">Hosted by {displayHostName}</div>
									<div className="text-xs text-gray-500">Verified Host</div>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-[28px] p-6 shadow-md border border-[#F3F4F6]">
						<h3 className="text-lg font-semibold mb-3">About the Accommodation</h3>
						<p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
							{displayDescription}
						</p>
					</div>

					{/* What this place offers */}
					<div className="bg-white rounded-[28px] p-6 shadow-md border border-[#F3F4F6]">
						<h3 className="text-lg font-semibold mb-4">What this place offers</h3>
						{displayAmenities.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{displayAmenities.map((amenity) => (
									<span key={amenity} className="inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] text-gray-700 text-xs px-3 py-2 border border-gray-100">
										{getAmenityIcon(amenity)}
										{getAmenityLabel(amenity)}
									</span>
								))}
							</div>
						) : (
							<p className="text-sm text-gray-500">No amenities listed for this property.</p>
						)}
					</div>

					{/* Where you'll be section */}
					<div className="bg-white rounded-[28px] p-6 shadow-md border border-[#F3F4F6]">
						<h3 className="text-lg font-semibold mb-4">Where you&apos;ll be</h3>
						<div className="mb-4 inline-flex items-center gap-2 text-gray-600 text-sm">
							<svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
								<path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
							</svg>
							<span>{displayLocation}</span>
						</div>
						{listingData?.latitude && listingData?.longitude ? (
							<PropertyMap 
								latitude={listingData.latitude} 
								longitude={listingData.longitude}
								propertyName={displayTitle}
							/>
						) : (
							<div className="h-64 rounded-2xl border border-gray-200 bg-[#F3F4F6] flex items-center justify-center text-gray-400 text-sm">
								<div className="text-center">
									<svg className="w-12 h-12 mx-auto mb-2 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
										<path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
									</svg>
									<p>Location map unavailable</p>
									<p className="text-xs mt-1">Host hasn&apos;t pinned exact location yet</p>
								</div>
							</div>
						)}
					</div>

					{/* Reviews */}
					<div className="bg-white rounded-[28px] p-6 shadow-md border border-[#F3F4F6]">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold">Reviews</h3>
							<div className="flex items-center gap-2 text-sm">
								<svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
									<path d="M12 .587l3.668 7.431L23.4 9.748l-5.7 5.556L18.82 24 12 19.897 5.18 24l1.12-8.696L.6 9.748l7.732-1.73z" />
								</svg>
								<span className="font-medium">{displayRating.toFixed(1)}</span>
								<span className="text-gray-400 text-xs">({listingData?.reviewCount || 0} Reviews)</span>
							</div>
						</div>
						<div className="mt-4 divide-y divide-gray-100">
							{reviewsLoading ? (
								<div className="py-8 text-center text-gray-500">
									<p>Loading reviews...</p>
								</div>
							) : reviews.length === 0 ? (
								<div className="py-8 text-center text-gray-500">
									<p>No reviews yet. Be the first to review this property!</p>
								</div>
							) : (
								reviews.map((r) => (
								<div key={r.id} className="py-5">
									<div className="flex items-start gap-3 mb-2">
										{r.userAvatar ? (
											<AppImage 
												src={r.userAvatar} 
												alt={r.userName}
												width={40}
												height={40}
												className="rounded-full object-cover"
												style={{ width: '40px', height: '40px' }}
											/>
										) : (
											<div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold">
												{getInitials(r.userName)}
											</div>
										)}
										<div className="flex-1">
											<div className="flex items-center justify-between">
												<p className="text-sm font-medium">{r.userName}</p>
												<p className="text-xs text-gray-500">{formatReviewDate(r.createdAt)}</p>
											</div>
											<div className="flex items-center gap-1 text-yellow-500 my-1">
												{Array.from({ length: r.rating }).map((_, i) => (
													<svg key={i} className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
														<path d="M12 .587l3.668 7.431L23.4 9.748l-5.7 5.556L18.82 24 12 19.897 5.18 24l1.12-8.696L.6 9.748l7.732-1.73z" />
													</svg>
												))}
											</div>
											<p className="text-sm text-gray-600 leading-relaxed">&quot;{r.comment}&quot;</p>
										</div>
									</div>
								</div>
								))
							)}
						</div>
					</div>
				</aside>

				{/* Right: Gallery */}
				<section>
					<div className="bg-white rounded-[28px] p-6 shadow-lg border border-[#F3F4F6]">
						<div className="flex flex-col gap-6">
				{/* Big image on top */}
						<div 
							className="relative w-full h-[480px] rounded-[28px] overflow-hidden shadow-sm cursor-pointer group"
							onClick={() => { setCurrentImageIndex(0); setLightboxOpen(true); }}
						>
							<AppImage
								src={mainImage}
								alt="Cozy bedroom with single bed, warm lighting, and window view"
								fillParent
								priority={true}
								sizes="(max-width: 768px) 100vw, 60vw"
								className="object-cover rounded-[28px] group-hover:scale-105 transition-transform duration-300"
							/>
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-[28px] flex items-center justify-center">
								<svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
								</svg>
							</div>
						</div>				{/* Thumbnails below (square, dynamic) */}
						<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
							{thumbs.map((t, i) => (
								<div 
									key={t} 
									className="relative overflow-hidden rounded-[18px] aspect-square cursor-pointer group"
									onClick={() => { setCurrentImageIndex(i + 1); setLightboxOpen(true); }}
								>
									<AppImage src={t} alt={`Bedroom thumbnail ${i + 1}`} fillParent className="object-cover rounded-[18px] group-hover:scale-110 transition-transform duration-300" />
									{i === thumbs.length - 1 && (
										<div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 flex items-center justify-center text-white text-sm font-medium rounded-[18px] transition-colors duration-300">View all Photos</div>
									)}
								</div>
							))}
						</div>
						</div>
					</div>
				</section>
			</div>

			{/* Lightbox Modal */}
			{lightboxOpen && (
				<div 
					className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
					onClick={() => setLightboxOpen(false)}
				>
					{/* Close button */}
					<button
						className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
						onClick={() => setLightboxOpen(false)}
						aria-label="Close lightbox"
					>
						<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>

					{/* Previous button */}
					{currentImageIndex > 0 && (
						<button
							className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 hover:bg-black/70 rounded-full p-3"
							onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev - 1); }}
							aria-label="Previous image"
						>
							<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
					)}

					{/* Next button */}
					{currentImageIndex < allImages.length - 1 && (
						<button
							className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 hover:bg-black/70 rounded-full p-3"
							onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev + 1); }}
							aria-label="Next image"
						>
							<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							</svg>
						</button>
					)}

					{/* Image container */}
					<div 
						className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center px-16"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="relative w-full h-full flex items-center justify-center">
							<AppImage
								src={allImages[currentImageIndex]}
								alt={`Property image ${currentImageIndex + 1}`}
								width={1200}
								height={800}
								className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
							/>
						</div>
						{/* Image counter */}
						<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
							{currentImageIndex + 1} / {allImages.length}
						</div>
					</div>
				</div>
			)}
			</>
			)}
		</main>
	);
}

