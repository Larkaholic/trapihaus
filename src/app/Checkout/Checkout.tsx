"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppImage from "../components/ui/AppImage";
import { getFirebaseAuth } from "@/lib/auth/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { createReservation } from "@/lib/services/reservations";
import type { CreateReservationData } from "@/types/reservation";
import { markListingUnavailable, getListing } from "@/lib/services/listings";

export default function Checkout() {
	const searchParams = useSearchParams();
	const router = useRouter();
	
	// get booking details from URL params (passed from PropertyListing page)
	const urlCheckIn = searchParams.get('checkIn');
	const urlCheckOut = searchParams.get('checkOut');
	const urlGuests = searchParams.get('guests');
	const urlPricePerNight = searchParams.get('pricePerNight');
	const urlServiceFee = searchParams.get('serviceFee');
	const urlPropertyName = searchParams.get('propertyName');
	const urlPropertyLocation = searchParams.get('propertyLocation');
	const urlPropertyImage = searchParams.get('propertyImage');
	const urlPropertyType = searchParams.get('propertyType');
	const urlVerified = searchParams.get('verified');
	const urlListingId = searchParams.get('listingId');
	const urlHostId = searchParams.get('hostId');
	const urlHostName = searchParams.get('hostName');
	const urlHostEmail = searchParams.get('hostEmail');
	
	// use URL params if available, otherwise use defaults
	const PRICE_PER_NIGHT = urlPricePerNight ? parseFloat(urlPricePerNight) : 2500;
	const SERVICE_FEE = urlServiceFee ? parseFloat(urlServiceFee) : 500;
	const VAT_RATE = 0.12; // 12%
	
	// property details
	const propertyName = urlPropertyName || 'Loakan Heights Residences';
	const propertyLocation = urlPropertyLocation || 'Baguio City';
	const propertyImage = urlPropertyImage || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=320&q=60';
	const propertyType = urlPropertyType || 'Transient';
	const isVerified = urlVerified === 'true';

	// Use URL params if available, otherwise use defaults
	const [checkIn, setCheckIn] = useState<string>(urlCheckIn || new Date().toISOString().slice(0, 10));
	const [checkOut, setCheckOut] = useState<string>(urlCheckOut || new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10));
	const [guests, setGuests] = useState<number>(urlGuests ? parseInt(urlGuests) : 2);

	// Update state when URL params change
	useEffect(() => {
		if (urlCheckIn) setCheckIn(urlCheckIn);
		if (urlCheckOut) setCheckOut(urlCheckOut);
		if (urlGuests) setGuests(parseInt(urlGuests));
	}, [urlCheckIn, urlCheckOut, urlGuests]);

	// Guest details form
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [request, setRequest] = useState("");

	// Payment
	type Method = "card" | "cash" | "gcash";
	const [method, setMethod] = useState<Method>("card");
	const [cardName, setCardName] = useState("Juan Dela Cruz");
	const [cardNumber, setCardNumber] = useState("");
	const [expiry, setExpiry] = useState("");
	const [cvv, setCvv] = useState("");
	const [agree, setAgree] = useState(true);
	const [promo, setPromo] = useState("");
	const [confirmed, setConfirmed] = useState(false);
	const [userId, setUserId] = useState<string | null>(null);
	const [processing, setProcessing] = useState(false);
	const [listingData, setListingData] = useState<{maxGuests?: number; bedrooms?: number} | null>(null);
	const [loadingListing, setLoadingListing] = useState(true);

	const CURRENCY = String.fromCharCode(0x20b1);

	// Auth listener
	useEffect(() => {
		const auth = getFirebaseAuth();
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setUserId(user.uid);
				// Autofill user info if available
				if (!firstName && user.displayName) {
					const names = user.displayName.split(' ');
					setFirstName(names[0] || '');
					setLastName(names.slice(1).join(' ') || '');
				}
				if (!email && user.email) {
					setEmail(user.email);
				}
			} else {
				router.push('/login?redirect=/Checkout');
			}
		});
		return () => unsubscribe();
	}, [router, firstName, email]);

	// Fetch listing data for validation
	useEffect(() => {
		async function fetchListing() {
			if (!urlListingId) {
				setLoadingListing(false);
				return;
			}
			try {
				const listing = await getListing(urlListingId);
				if (listing) {
					setListingData({
						maxGuests: listing.guests,
						bedrooms: listing.bedrooms
					});
				}
			} catch (error) {
				console.error("Failed to fetch listing:", error);
			} finally {
				setLoadingListing(false);
			}
		}
		fetchListing();
	}, [urlListingId]);

	const nights = useMemo(() => {
		const ci = new Date(checkIn);
		const co = new Date(checkOut);
		const ms = co.getTime() - ci.getTime();
		return Math.max(1, Math.ceil(ms / 86400000));
	}, [checkIn, checkOut]);

	const subtotal = nights * PRICE_PER_NIGHT;
	const vat = Math.round(subtotal * VAT_RATE);
	const total = subtotal + SERVICE_FEE + vat;

	const formatDate = (iso: string) =>
		new Date(iso).toLocaleDateString(undefined, {
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
		});

	// Booking reference (will be generated by backend)
	const [bookingRef, setBookingRef] = useState("");

	const handlePayment = async () => {
		if (!userId) {
			alert("Please log in to complete your booking");
			router.push('/login');
			return;
		}

		if (!firstName || !lastName || !email || !phone) {
			alert("Please fill in all guest details");
			return;
		}

		if (!urlListingId || !urlHostId || !urlHostName || !urlHostEmail) {
			alert("Missing property information. Please go back and try again.");
			return;
		}

		// Validate guest count against property limits
		if (listingData?.maxGuests && guests > listingData.maxGuests) {
			alert(`This property can only accommodate ${listingData.maxGuests} ${listingData.maxGuests === 1 ? 'guest' : 'guests'}. Please adjust your booking.`);
			return;
		}

		try {
			setProcessing(true);

			const reservationData: CreateReservationData = {
				userId,
				listingId: urlListingId,
				
				checkInDate: new Date(checkIn),
				checkOutDate: new Date(checkOut),
				guests,

				guestFirstName: firstName,
				guestLastName: lastName,
				guestEmail: email,
				guestPhone: phone,

				propertyName,
				propertyLocation,
				propertyImage,
				propertyType,
				isVerified,

				pricePerNight: PRICE_PER_NIGHT,
				serviceFee: SERVICE_FEE,
				vat,

				paymentMethod: method,

				hostId: urlHostId,
				hostName: urlHostName,
				hostEmail: urlHostEmail,
			};

			// Add optional fields only if they have values
			if (request) reservationData.specialRequest = request;

			const reservationId = await createReservation(reservationData);
			console.log("✅ Reservation created:", reservationId);
			
			// Mark accommodation as unavailable (single accommodation booking)
			await markListingUnavailable(urlListingId);
			console.log("✅ Listing marked as unavailable:", urlListingId);
			
			// Generate display reference
			const d = new Date();
			const pad = (n: number) => String(n).padStart(2, "0");
			setBookingRef(`TH-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${reservationId.substring(0, 6).toUpperCase()}`);
			
			setConfirmed(true);
		} catch (error) {
			console.error("❌ Error creating reservation:", error);
			alert("Failed to create reservation. Please try again.");
		} finally {
			setProcessing(false);
		}
	};

	if (confirmed) {
		return (
			<main className="max-w-full mx-auto px-6 py-10 bg-[#F5F5F5]">
				{/* Success banner */}
				<div className="mb-6 rounded-[24px] bg-white border border-[#F3F4F6] p-6 flex items-center gap-3">
					<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white">
						<svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
							<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.071 7.07a1 1 0 01-1.415 0L3.293 9.95a1 1 0 011.414-1.414l3.1 3.1 6.364-6.364a1 1 0 011.536.021z" clipRule="evenodd" />
						</svg>
					</span>
					<div>
						<h1 className="text-2xl md:text-3xl font-extrabold font-lexend">You’re Booked!</h1>
						<p className="text-gray-500 text-sm">Booking reference {bookingRef}. A receipt and itinerary were sent to your email.</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Booking Summary Card */}
					<div className="bg-white rounded-[24px] p-6 border border-[#F3F4F6] shadow-sm">
						<h2 className="text-lg font-semibold mb-4">Booking Summary</h2>
						<div className="flex items-center gap-4 mb-4">
							<div className="relative w-24 h-20 rounded-xl overflow-hidden">
								<AppImage src={propertyImage} alt="Room thumbnail" fillParent className="object-cover" />
							</div>
							<div className="flex-1">
								<p className="font-semibold">{propertyName}</p>
								<p className="text-xs text-gray-500">{propertyLocation} • {propertyType}</p>
								{isVerified && (
									<span className="mt-1 inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
										<svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.071 7.07a1 1 0 01-1.415 0L3.293 9.95a1 1 0 011.414-1.414l3.1 3.1 6.364-6.364a1 1 0 011.536.021z" clipRule="evenodd" />
										</svg>
										Verified
									</span>
								)}
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
							<div>
								<p className="text-gray-500">Check-in</p>
								<div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-gray-50">
									<CalendarIcon />
									<span>{formatDate(new Date(checkIn).toISOString())}</span>
								</div>
							</div>
							<div>
								<p className="text-gray-500">Check-out</p>
								<div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-gray-50">
									<CalendarIcon />
									<span>{formatDate(new Date(checkOut).toISOString())}</span>
								</div>
							</div>
						<div>
							<p className="text-gray-500">Guests</p>
							<div className={`mt-1 flex items-center gap-2 rounded-lg border px-3 py-2 ${listingData?.maxGuests && guests > listingData.maxGuests ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
								<UserIcon />
								<span>{guests} Adults</span>
								{listingData?.maxGuests && guests > listingData.maxGuests && (
									<span className="ml-auto text-xs text-red-600 font-medium">Exceeds limit ({listingData.maxGuests} max)</span>
								)}
							</div>
						</div>
						</div>
						<div className="mt-5 flex flex-wrap gap-3">
							<button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white">
								<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-7-8-3z"/></svg>
								Open in Maps
							</button>
							<button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white">
								<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
								Message Host
							</button>
						</div>
					</div>

					{/* Receipt */}
					<div className="bg-white rounded-[24px] p-6 border border-[#F3F4F6] shadow-sm">
						<h2 className="text-lg font-semibold mb-4">Receipt</h2>
						<div className="space-y-2 text-sm">
							<Row label={`${CURRENCY}${PRICE_PER_NIGHT.toLocaleString()} x ${nights} nights`} value={`${CURRENCY}${subtotal.toLocaleString(undefined,{minimumFractionDigits:2})}`} />
							<Row label="Cleaning Fee" value={`${CURRENCY}${SERVICE_FEE.toLocaleString(undefined,{minimumFractionDigits:2})}`} />
							<Row label={`VAT (${Math.round(VAT_RATE*100)}%)`} value={`${CURRENCY}${vat.toLocaleString(undefined,{minimumFractionDigits:2})}`} />
							<div className="my-2 h-px bg-gray-100" />
							<div className="flex items-center justify-between text-base font-semibold">
								<span>Total Paid</span>
								<span>{`${CURRENCY}${total.toLocaleString(undefined,{minimumFractionDigits:2})}`}</span>
							</div>
						</div>
						<button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2">
							<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l6 6-8 8H4V10l8-8z"/></svg>
							PDF
						</button>
						<button className="mt-3 w-full bg-gray-100 text-gray-500 py-2.5 rounded-xl font-medium">Back to Homescreen</button>
					</div>
				</div>

				{/* Next Steps */}
				<div className="mt-6 bg-white rounded-[24px] p-6 border border-[#F3F4F6] shadow-sm">
					<h2 className="text-lg font-semibold mb-4">Next Steps</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="rounded-2xl border border-gray-200 p-5">
							<p className="font-semibold">Share Itinerary</p>
							<p className="text-sm text-gray-500">Send trip details to your companions</p>
							<button className="mt-4 px-5 py-2 rounded-xl bg-blue-600 text-white font-medium">Share</button>
						</div>
						<div className="rounded-2xl border border-gray-200 p-5">
							<p className="font-semibold">Download Receipt</p>
							<p className="text-sm text-gray-500">PDF copy for reimbursement or visa.</p>
							<button className="mt-4 px-5 py-2 rounded-xl bg-blue-600 text-white font-medium">Download</button>
						</div>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="max-w-full mx-auto px-6 py-10 bg-[#F5F5F5]">
			<header className="mb-6">
				<h1 className="text-3xl font-extrabold font-lexend">Complete your Booking</h1>
				<p className="text-gray-500 mt-1">You’re just a few steps away from your perfect stay</p>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
				{/* Left: Forms */}
				<section className="space-y-6">
					{/* Guest Details */}
					<div className="bg-white rounded-[24px] p-6 border border-[#F3F4F6] shadow-sm">
						<h2 className="text-xl font-semibold mb-5">Guest Details</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="text-sm text-gray-600">First Name</label>
								<input value={firstName} onChange={(e)=>setFirstName(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" placeholder="Juan" />
							</div>
							<div>
								<label className="text-sm text-gray-600">Last Name</label>
								<input value={lastName} onChange={(e)=>setLastName(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" placeholder="Dela Cruz" />
							</div>
							<div>
								<label className="text-sm text-gray-600">Email</label>
								<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" placeholder="jdelacruz@email.com" />
							</div>
							<div>
								<label className="text-sm text-gray-600">Mobile Number</label>
								<input value={phone} onChange={(e)=>setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" placeholder="+63" />
							</div>
							<div className="md:col-span-2">
								<label className="text-sm text-gray-600">Special Request (optional)</label>
								<input value={request} onChange={(e)=>setRequest(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" placeholder="Example: Late check-in, parking, etc" />
							</div>
						</div>
					</div>

					{/* Payment Method */}
					<div className="bg-white rounded-[24px] p-6 border border-[#F3F4F6] shadow-sm">
						<h2 className="text-xl font-semibold mb-5">Payment Method</h2>
						<div className="space-y-3">
							<label className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 ${method==='card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
								<span className="flex items-center gap-2 text-sm">
									<input type="radio" name="pm" checked={method==='card'} onChange={()=>setMethod('card')} />
									Debit/Credit Card
								</span>
								<span className="text-gray-300">▢</span>
							</label>
							<label className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 ${method==='cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
								<span className="flex items-center gap-2 text-sm">
									<input type="radio" name="pm" checked={method==='cash'} onChange={()=>setMethod('cash')} />
									Cash
								</span>
								<span className="text-gray-300">▢</span>
							</label>
							<label className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 ${method==='gcash' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
								<span className="flex items-center gap-2 text-sm">
									<input type="radio" name="pm" checked={method==='gcash'} onChange={()=>setMethod('gcash')} />
									GCash
								</span>
								<span className="text-gray-300">▢</span>
							</label>
						</div>

						{/* Card fields */}
						{method === 'card' && (
							<div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="md:col-span-3">
									<label className="text-sm text-gray-600">Cardholder Name</label>
									<input value={cardName} onChange={(e)=>setCardName(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" placeholder="Juan Dela Cruz" />
								</div>
								<div className="md:col-span-3">
									<label className="text-sm text-gray-600">Card Number</label>
									<input value={cardNumber} onChange={(e)=>setCardNumber(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" placeholder="4000 1234 5678 9010" />
								</div>
								<div>
									<label className="text-sm text-gray-600">Expiry</label>
									<input value={expiry} onChange={(e)=>setExpiry(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" placeholder="MM/YY" />
								</div>
								<div>
									<label className="text-sm text-gray-600">CVV</label>
									<input value={cvv} onChange={(e)=>setCvv(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" placeholder="123" />
								</div>
							</div>
						)}
					</div>
				</section>

				{/* Right: Booking Summary */}
				<aside className="space-y-6">
					<div className="bg-white rounded-[24px] p-6 border border-[#F3F4F6] shadow-sm">
						<h2 className="text-lg font-semibold mb-4">Booking Summary</h2>

						<div className="flex items-center gap-3 mb-4">
							<div className="relative w-20 h-16 rounded-xl overflow-hidden">
								<AppImage src={propertyImage} alt="Room thumbnail" fillParent className="object-cover" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-semibold">{propertyName}</p>
								<p className="text-xs text-gray-500">{propertyLocation} • {propertyType}</p>
								{isVerified && (
									<span className="mt-1 inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
										<svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.071 7.07a1 1 0 01-1.415 0L3.293 9.95a1 1 0 011.414-1.414l3.1 3.1 6.364-6.364a1 1 0 011.536.021z" clipRule="evenodd" />
										</svg>
										Verified
									</span>
								)}
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3 text-sm">
							<div>
								<p className="text-gray-500">Check-in</p>
								<div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-gray-50">
									<CalendarIcon />
									<span>{formatDate(checkIn)}</span>
								</div>
							</div>
							<div>
								<p className="text-gray-500">Check-out</p>
								<div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-gray-50">
									<CalendarIcon />
									<span>{formatDate(checkOut)}</span>
								</div>
							</div>
							<div className="col-span-2">
								<p className="text-gray-500">Guests</p>
								<div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-gray-50">
									<UserIcon />
									<span>{guests} Adults</span>
								</div>
							</div>
						</div>

						<div className="my-4 h-px bg-gray-100" />

						{/* Pricing */}
						<div className="space-y-2 text-sm">
							<Row label={`${CURRENCY}${PRICE_PER_NIGHT.toLocaleString()} x ${nights} nights`} value={`${CURRENCY}${subtotal.toLocaleString(undefined,{minimumFractionDigits:2})}`} strong={false} />
							<Row label="Service Fee" value={`${CURRENCY}${SERVICE_FEE.toLocaleString(undefined,{minimumFractionDigits:2})}`} strong={false} />
							<Row label={`VAT (${Math.round(VAT_RATE*100)}%)`} value={`${CURRENCY}${vat.toLocaleString(undefined,{minimumFractionDigits:2})}`} strong={false} />
							<div className="my-2 h-px bg-gray-100" />
							<Row label="Total" value={`${CURRENCY}${total.toLocaleString(undefined,{minimumFractionDigits:2})}`} strong />
						</div>

						{/* Promo */}
						<div className="mt-4 flex gap-2">
							<input value={promo} onChange={(e)=>setPromo(e.target.value)} placeholder="Promo/Voucher" className="flex-1 rounded-xl border border-gray-200 px-3 py-2" />
							<button className="px-4 py-2 rounded-xl border border-gray-200 text-sm">Apply</button>
						</div>
					</div>

					<div className="bg-white rounded-[24px] p-6 border border-[#F3F4F6] shadow-sm">
						<label className="flex items-start gap-3 text-sm">
							<input type="checkbox" checked={agree} onChange={(e)=>setAgree(e.target.checked)} className="mt-1" />
							<span>
								By clicking this, I agree to Trapihaus <a className="text-blue-600 hover:underline" href="#">Terms & Conditions</a> and <a className="text-blue-600 hover:underline" href="#">Privacy Policy</a>
							</span>
						</label>
						<button 
							disabled={!agree || processing} 
							onClick={handlePayment} 
							className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold"
						>
							{processing ? "Processing..." : "Pay My Booking"}
						</button>
						<p className="mt-2 text-[11px] text-gray-400">Listings are vetted for safety and compliance (Mayor&apos;s permit / DOT: Tourist Inn / Transient accreditation where applicable).</p>
					</div>
				</aside>
			</div>
		</main>
	);
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
	return (
		<div className={`flex items-center justify-between ${strong ? 'text-base font-semibold' : ''}`}>
			<span>{label}</span>
			<span>{value}</span>
		</div>
	);
}

function CalendarIcon() {
	return (
		<svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
			<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
			<line x1="16" y1="2" x2="16" y2="6"/>
			<line x1="8" y1="2" x2="8" y2="6"/>
			<line x1="3" y1="10" x2="21" y2="10"/>
		</svg>
	);
}

function UserIcon() {
	return (
		<svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
			<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
			<circle cx="12" cy="7" r="4" />
		</svg>
	);
}

