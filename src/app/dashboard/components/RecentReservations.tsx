type Reservation = {
  id: string;
  guest: string;
  property: string;
  checkIn: string;
  status: "Confirmed" | "Pending" | "Cancelled";
  amount: string;
};

interface RecentReservationsProps { items?: Reservation[] }

export default function RecentReservations({ items }: RecentReservationsProps) {
  const badge = (s: Reservation["status"]) => {
    const map = {
      Confirmed: "bg-[#EAF6EE] text-[#22C55E]",
      Pending: "bg-[#FFF7E6] text-[#F59E0B]",
      Cancelled: "bg-[#F3F4F6] text-[#6B7280]",
    } as const;
    return <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${map[s]}`}>{s}</span>;
  };

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
      <h3 className="font-lexend font-semibold">Recent Reservations</h3>
      <p className="text-sm text-[#6B7280]">Latest Booking Activity</p>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-[#6B7280]">
            <tr>
              <th className="py-2 pr-4">Guest</th>
              <th className="py-2 pr-4">Property</th>
              <th className="py-2 pr-4">Check-in</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {!items || items.length === 0 ? (
              <tr className="border-t border-[#F3F4F6]">
                <td colSpan={5} className="py-6 text-center text-[#9CA3AF]">No reservations yet</td>
              </tr>
            ) : (
              items.map((r, index) => (
                <tr key={r.id || `reservation-${index}`} className="border-t border-[#F3F4F6]">
                  <td className="py-3 pr-4 font-medium text-[#111827]">{r.guest}</td>
                  <td className="py-3 pr-4">{r.property}</td>
                  <td className="py-3 pr-4">{r.checkIn}</td>
                  <td className="py-3 pr-4">{badge(r.status)}</td>
                  <td className="py-3 pr-4 text-right">{r.amount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
