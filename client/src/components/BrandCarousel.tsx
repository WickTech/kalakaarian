const BRANDS = [
  { name: "Rummyverse",       domain: "rummyverse.com" },
  { name: "Gameskraft",       domain: "gameskraft.com" },
  { name: "Coca-Cola",        domain: "coca-cola.com" },
  { name: "Pepsi",            domain: "pepsi.com" },
  { name: "Lakmé",            domain: "lakmeindia.com" },
  { name: "L'Oréal",          domain: "loreal.com" },
  { name: "PokerBaazi",       domain: "pokerbaazi.com" },
  { name: "Junglee Games",    domain: "jungleegames.com" },
  { name: "Van Heusen",       domain: "vanheusenindia.com" },
  { name: "Allen Solly",      domain: "allensolly.com" },
  { name: "Gucci",            domain: "gucci.com" },
  { name: "Armani Exchange",  domain: "armaniexchange.com" },
  { name: "Zara",             domain: "zara.com" },
  { name: "Adidas",           domain: "adidas.com" },
  { name: "Nike",             domain: "nike.com" },
  { name: "Oppo",             domain: "oppo.com" },
  { name: "Vivo",             domain: "vivo.com" },
  { name: "Nothing",          domain: "nothing.tech" },
  { name: "Motorola",         domain: "motorola.com" },
  { name: "Tanishq",          domain: "tanishq.co.in" },
  { name: "Kalyan Jewellers", domain: "kalyanjewellers.net" },
];

function BrandLogo({ name, domain }: { name: string; domain: string }) {
  return (
    <div className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-border bg-card hover:border-purple-500 transition-colors shrink-0 h-14 min-w-[110px]">
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={name}
        loading="lazy"
        className="max-h-7 max-w-[90px] object-contain grayscale hover:grayscale-0 transition-all"
        onError={(e) => {
          const img = e.currentTarget;
          img.style.display = "none";
          const span = img.nextElementSibling as HTMLElement | null;
          if (span) span.style.display = "block";
        }}
      />
      <span className="hidden text-xs font-medium text-muted-foreground">{name}</span>
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
      <div className="relative group">
        <div className="flex gap-6 animate-marquee-left group-hover:[animation-play-state:paused] whitespace-nowrap">
          {doubled.map((brand, i) => (
            <BrandLogo key={i} name={brand.name} domain={brand.domain} />
          ))}
        </div>
      </div>
    </section>
  );
}
