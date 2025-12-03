"use client";
import Link from "next/link";
import Image from "next/image";
import { Lexend } from "next/font/google";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getFirebaseAuth } from "@/lib/auth/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getUserProfile } from "@/lib/services/userProfile";

interface User { name: string; avatar: string }

const lexend = Lexend({ subsets: ["latin"], weight: ["100","200","300","400","500","600","700","800","900"] });

export default function Navbar() {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [mounted, setMounted] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const mobileMenuRef = useRef<HTMLDivElement | null>(null);
    const mobileButtonRef = useRef<HTMLButtonElement | null>(null);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const auth = getFirebaseAuth();
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (!fbUser) {
                setUser(null);
                return;
            }
            
            // Load profile from Firestore for real-time updates
            try {
                const profile = await getUserProfile(fbUser.uid);
                if (profile) {
                    setUser({
                        name: profile.displayName || profile.firstName || fbUser.email || "Guest",
                        avatar: profile.photoURL || "/woman.png",
                    });
                } else {
                    // Fallback to Firebase Auth data
                    const name = fbUser.displayName || fbUser.email || "Guest";
                    const avatar = fbUser.photoURL || "/woman.png";
                    setUser({ name, avatar });
                }
            } catch (error) {
                console.error("Failed to load profile:", error);
                // Fallback to Firebase Auth data
                const name = fbUser.displayName || fbUser.email || "Guest";
                const avatar = fbUser.photoURL || "/woman.png";
                setUser({ name, avatar });
            }
        });
        return () => unsub();
    }, []);

    // Close on outside click / Escape for desktop menu
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        }
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMenuOpen(false); }
        if (menuOpen) {
            document.addEventListener("mousedown", onDocClick);
            document.addEventListener("keydown", onKey);
        }
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [menuOpen]);

    // Close mobile menu on outside click / Escape
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!mobileMenuRef.current || !mobileButtonRef.current) return;
            // Don't close if clicking the button or menu
            if (mobileButtonRef.current.contains(e.target as Node) || mobileMenuRef.current.contains(e.target as Node)) return;
            setMobileMenuOpen(false);
        }
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMobileMenuOpen(false); }
        if (mobileMenuOpen) {
            document.addEventListener("mousedown", onDocClick);
            document.addEventListener("keydown", onKey);
        }
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [mobileMenuOpen]);
    
    return (
    <nav className={`${lexend.className} w-full bg-blue-600 rounded-full py-3 shadow-md mt-[24px] relative z-[9999]`}>
            <div className="max-w-6xl mx-auto flex items-center px-4 md:px-0">
                <Link href="/" className="flex items-center flex-none hover:opacity-80 transition-opacity duration-200">
                    <Image src="/logo.png" alt="TrapiHaus" width={120} height={32} className="h-8 cursor-pointer" style={{ width: 'auto', height: 'auto' }} />
                </Link>

                {/* Desktop Navigation */}
                <div className="flex-1 hidden md:flex justify-center space-x-10 text-white text-[16px]">
                        <Link href="/Homescreen/home" className={mounted && pathname === "/Homescreen/home" ? "font-black" : "font-medium"}>Home</Link>
                        <Link href="/browse" className={mounted && pathname === "/browse" ? "font-black" : "font-medium"}>Browse</Link>
                        <Link href="/about" className={mounted && pathname === "/about" ? "font-black" : "font-medium"}>About</Link>
                        <Link href="/List" className={mounted && pathname === "/List" ? "font-black" : "font-medium"}>List Property</Link>
                        <Link href="/Contact" className={mounted && pathname === "/Contact" ? "font-black" : "font-medium"}>Contact</Link>
                </div>

                {/* Mobile Hamburger Button */}
                <div className="flex-1 md:hidden flex justify-end">
                    <button
                        ref={mobileButtonRef}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-white p-2 relative z-[10000]"
                        aria-label="Toggle menu"
                        type="button"
                    >
                        {mobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Desktop User Menu / Auth Buttons */}
                {user ? (
                    <div className="relative pl-4 hidden md:block" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            className="flex items-center gap-2 group"
                        >
                            <Image
                                src={user?.avatar || "/woman.png"}
                                alt={user?.name || "User avatar"}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover border-2 border-white/60 shadow-sm"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white group-hover:opacity-80">
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                            </svg>
                        </button>
                        {menuOpen && (
                            <div role="menu" className="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-lg ring-1 ring-black/5 overflow-hidden z-[9999]">
                                <Link href="/Homescreen/MyTrips" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Trips</Link>
                                <Link href="/List" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">List Property</Link>
                                <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</Link>
                                <div className="h-px bg-gray-100" />
                                <button
                                    onClick={async () => {
                                        try {
                                            await signOut(getFirebaseAuth());
                                            setMenuOpen(false);
                                            router.push("/");
                                        } catch (e) {
                                            console.error("Sign out failed", e);
                                        }
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                                >
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="hidden md:flex items-center gap-3 pl-4">
                        <Link
                            href="/login"
                            className="px-5 py-2 rounded-full bg-[#83C12C] text-white text-sm font-semibold shadow hover:bg-[#6e9f24] transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/Register"
                            className="px-5 py-2 rounded-full bg-[#F68109] text-white text-sm font-semibold shadow hover:bg-[#d96f06] transition-colors"
                        >
                            Register
                        </Link>
                    </div>
                )}
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div 
                    ref={mobileMenuRef}
                    className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 bg-white rounded-2xl shadow-lg overflow-hidden z-[9998]"
                >
                    <div className="py-2">
                        <Link 
                            href="/Homescreen/home" 
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-6 py-3 text-sm ${mounted && pathname === "/Homescreen/home" ? "font-bold text-[#1078CF] bg-blue-50" : "text-gray-700"} hover:bg-gray-50`}
                        >
                            Home
                        </Link>
                        <Link 
                            href="/browse" 
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-6 py-3 text-sm ${mounted && pathname === "/browse" ? "font-bold text-[#1078CF] bg-blue-50" : "text-gray-700"} hover:bg-gray-50`}
                        >
                            Browse
                        </Link>
                        <Link 
                            href="/about" 
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-6 py-3 text-sm ${mounted && pathname === "/about" ? "font-bold text-[#1078CF] bg-blue-50" : "text-gray-700"} hover:bg-gray-50`}
                        >
                            About
                        </Link>
                        <Link 
                            href="/List" 
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-6 py-3 text-sm ${mounted && pathname === "/List" ? "font-bold text-[#1078CF] bg-blue-50" : "text-gray-700"} hover:bg-gray-50`}
                        >
                            List Property
                        </Link>
                        <Link 
                            href="/Contact" 
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-6 py-3 text-sm ${mounted && pathname === "/Contact" ? "font-bold text-[#1078CF] bg-blue-50" : "text-gray-700"} hover:bg-gray-50`}
                        >
                            Contact
                        </Link>

                        {user && (
                            <>
                                <div className="h-px bg-gray-200 my-2" />
                                <Link 
                                    href="/Homescreen/MyTrips" 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-6 py-3 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    My Trips
                                </Link>
                                <Link 
                                    href="/List" 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-6 py-3 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    List Property
                                </Link>
                                <div className="h-px bg-gray-200 my-2" />
                                <button
                                    onClick={async () => {
                                        try {
                                            await signOut(getFirebaseAuth());
                                            setMobileMenuOpen(false);
                                            router.push("/");
                                        } catch (e) {
                                            console.error("Sign out failed", e);
                                        }
                                    }}
                                    className="w-full text-left px-6 py-3 text-sm text-red-600 hover:bg-gray-50"
                                >
                                    Sign out
                                </button>
                            </>
                        )}

                        {!user && (
                            <>
                                <div className="h-px bg-gray-200 my-2" />
                                <div className="px-6 py-3 space-y-2">
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block w-full text-center px-5 py-2 rounded-full bg-[#83C12C] text-white text-sm font-semibold shadow hover:bg-[#6e9f24] transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/Register"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block w-full text-center px-5 py-2 rounded-full bg-[#F68109] text-white text-sm font-semibold shadow hover:bg-[#d96f06] transition-colors"
                                    >
                                        Register
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Login Required Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
                        {/* Close button */}
                        <button
                            onClick={() => setShowLoginModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Close modal"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                            Login Required
                        </h3>
                        <p className="text-gray-600 text-center mb-6">
                            You must be logged in to access the dashboard. Please sign in to continue.
                        </p>

                        {/* Buttons */}
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/login"
                                onClick={() => setShowLoginModal(false)}
                                className="w-full text-center px-5 py-3 rounded-full bg-[#1078CF] text-white font-semibold shadow hover:bg-[#0d5fa8] transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/Register"
                                onClick={() => setShowLoginModal(false)}
                                className="w-full text-center px-5 py-3 rounded-full bg-[#83C12C] text-white font-semibold shadow hover:bg-[#6e9f24] transition-colors"
                            >
                                Create Account
                            </Link>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="w-full text-center px-5 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
