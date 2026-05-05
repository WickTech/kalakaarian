const BRANDS = [
  { name: "Myntra", domain: "myntra.com" },
  { name: "Nykaa", domain: "nykaa.com" },
  { name: "Mamaearth", domain: "mamaearth.in" },
  { name: "boAt", domain: "boat-lifestyle.com" },
  { name: "Zomato", domain: "zomato.com" },
  { name: "Swiggy", domain: "swiggy.com" },
  { name: "WOW Skin Science", domain: "wowskinscience.com" },
  { name: "MCaffeine", domain: "mcaffeine.in" },
  { name: "Noise", domain: "gonoise.com" },
  { name: "Lakme", domain: "lakmeindia.com" },
  { name: "Sugar Cosmetics", domain: "sugarcosmetics.com" },
  { name: "Plum", domain: "plumgoodness.com" },
  { name: "Minimalist", domain: "beminimalist.co" },
  { name: "Dot & Key", domain: "dotandkey.com" },
  { name: "Beardo", domain: "beardo.in" },
  { name: "Man Matters", domain: "manmatters.com" },
  { name: "Wakefit", domain: "wakefit.co" },
  { name: "Sleepy Owl", domain: "sleepyowl.coffee" },
  { name: "The Man Company", domain: "themancompany.com" },
];

function BrandLogo({ name, domain }: { name: string; domain: string }) {
  return (
    <div className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-border bg-card hover:border-purple-500 transition-colors shrink-0 h-14 min-w-[100px]">
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={name}
        className="max-h-7 max-w-[90px] object-contain grayscale hover:grayscale-0 transition-all"
        onError={(e) => {
          const img = e.currentTarget;
          img.style.display = "none";
          const span = img.nextElementSibling as HTMLElement | null;
          if (span) span.style.display = "block";
        }}
      />
      <span className="hidden text-sm font-medium text-muted-foreground">{name}</span>
    </div>
  );
}

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
            <BrandLogo key={i} name={brand.name} domain={brand.domain} />
          ))}
        </div>
      </div>
    </section>
  );
}
