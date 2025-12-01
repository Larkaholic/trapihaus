type Review = {
  id: string;
  name: string;
  rating: number; // 1..5
  quote: string;
  room?: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={`w-4 h-4 ${i <= rating ? "text-[#F59E0B]" : "text-[#E5E7EB]"}`} fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10.5 14.347a1 1 0 00-1.175 0L6.615 16.283c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

interface LatestReviewsProps { reviews?: Review[] }

export default function LatestReviews({ reviews }: LatestReviewsProps) {
  const hasData = Array.isArray(reviews) && reviews.length > 0;
  const skeletons = new Array(2).fill(0);

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
      <h3 className="font-lexend font-semibold">Latest Reviews</h3>
      <p className="text-sm text-[#6B7280]">Recent Guest Feedback</p>

      <div className="mt-4 space-y-4">
        {hasData
          ? reviews!.map((r, index) => (
              <div key={r.id || `review-${index}`} className="rounded-xl border border-[#F3F4F6] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[#111827]">{r.name}</p>
                  <Stars rating={r.rating} />
                </div>
                <p className="text-sm text-[#374151] mt-2">“{r.quote}”</p>
                {r.room ? <p className="text-xs text-[#9CA3AF] mt-1">{r.room}</p> : null}
              </div>
            ))
          : skeletons.map((_, i) => (
              <div key={i} className="rounded-xl border border-[#F3F4F6] p-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 bg-[#F3F4F6] rounded animate-pulse" />
                  <div className="flex gap-1">
                    {new Array(5).fill(0).map((_, s) => (
                      <div key={s} className="w-4 h-4 rounded bg-[#F3F4F6] animate-pulse" />
                    ))}
                  </div>
                </div>
                <div className="h-4 w-3/4 bg-[#F3F4F6] rounded mt-3 animate-pulse" />
                <div className="h-3 w-24 bg-[#F3F4F6] rounded mt-2 animate-pulse" />
              </div>
            ))}
      </div>
    </section>
  );
}
