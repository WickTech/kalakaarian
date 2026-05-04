const BRANDS = [
  "Myntra", "Nykaa", "Mamaearth", "boAt", "Zomato", "Swiggy",
  "WOW Skin Science", "MCaffeine", "Noise", "Lakme", "Sugar Cosmetics",
  "Plum", "Minimalist", "Dot & Key", "mCaffeine", "Beardo", "Man Matters",
  "Wakefit", "Sleepy Owl", "The Man Company",
];

export function BrandCarousel() {
  const doubled = [...BRANDS, ...BRANDS];
  return (
    <section className="py-10 px-4 border-y border-border overflow-hidden bg-muted/20">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
        Trusted by India's leading brands
      </p>
      <div className="relative">
        <div className="flex gap-8 animate-marquee-left whitespace-nowrap">
          {doubled.map((brand, i) => (
            <span
              key={i}
              className="inline-flex items-center px-5 py-2 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-purple-500 transition-colors shrink-0"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
