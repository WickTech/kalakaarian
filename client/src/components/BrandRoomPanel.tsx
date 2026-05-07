export function BrandRoomPanel() {
  return (
    <div className="bento-card membership-gold p-6 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🏠</span>
        <h2 className="font-display font-bold text-chalk text-xl">Your Room</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 ml-auto">₹999/month</span>
      </div>
      <p className="text-chalk-dim text-sm mb-4">Premium workspace for power brands</p>
      <ul className="space-y-2 text-sm text-chalk-dim mb-6">
        {["Save creator lists", "Schedule campaigns", "Payment integration", "Advanced analytics", "Priority notifications", "Dedicated support"].map(f => (
          <li key={f} className="flex items-center gap-2"><span className="text-gold">✓</span> {f}</li>
        ))}
      </ul>
      <button className="gold-pill px-6 py-2.5 text-sm">Activate Your Room →</button>
    </div>
  );
}
