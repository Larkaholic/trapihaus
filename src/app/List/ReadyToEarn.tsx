"use client";

import Iridescence from "../browse/Iridescence";
import Link from "next/link";

export default function ReadyToEarn() {
  return (
    <div className="px-8">
        <section className="relative w-full h-[290px] md:h-[430px] lg:h-[461px] overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 mb-[100px]">
        {/* Animated background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <Iridescence color={[0.06, 0.47, 0.91]} speed={0.8} amplitude={0.08} mouseReact={true} />
        </div>

        <div className="relative z-10 flex items-center justify-center h-full backdrop-blur-[1px]">
            <div className="max-w-4xl w-full text-center px-6">
            <h2 className="text-3xl md:text-4xl lg:text-[72px] font-bold text-white font-lexend mb-3">
                Ready to Earn From
                <br />
                Your Property?
            </h2>
            <p className="text-white/90 mb-6 font-lexend">Join Trapihaus today and connect with thousands of travelers</p>

            <div className="flex items-center justify-center">
                <Link href="/ListProperty/create" className="inline-block bg-[#83C12C] hover:bg-green-600 text-white font-semibold px-6 py-4 rounded-2xl shadow-lg transition">
                List Your Property Now
                </Link>
            </div>
            </div>
        </div>

        {/* Decorative rounded blue overlay mimic: subtle border to match design */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-0" />
        </section>
    </div>
  );
}
