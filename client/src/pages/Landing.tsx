import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, Target, TrendingUp, Sparkles } from "lucide-react";
import { HeroText } from "@/components/HeroText";
import { BrandCarousel } from "@/components/BrandCarousel";

export default function Landing() {
  const whyKalakaarian = [
    { icon: Users,      title: "Creator Connectivity",    description: "Connect with countless creators in a single click, with zero margins." },
    { icon: Target,     title: "Fast Campaign Delivery",  description: "Get your campaign ready within 24 hours with the lowest platform fee." },
    { icon: TrendingUp, title: "Track & Navigate",        description: "Track your payments and navigate your campaigns seamlessly." },
    { icon: Sparkles,   title: "AI Profile Suggestions",  description: "Use AI to find creators with 100% compatibility for your target audience." },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-obsidian">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-fuchsia-600/10 to-pink-600/10" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium mb-16">
            <Sparkles className="h-3 w-3" />
            India&apos;s First AI-Powered Marketplace of Kalakaar (Creators)
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight" style={{ fontFamily: "Oswald, sans-serif" }}>
            <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Influence. Impact.
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Growth.
            </span>
          </h1>

          <HeroText />

          <p className="text-lg md:text-xl text-chalk-dim max-w-2xl mx-auto">
            Bridge the gap between brands and influencers. Discover authentic partnerships
            that drive real results for your marketing campaigns.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/brand-register">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                Start as Brand
              </Button>
            </Link>
            <Link to="/influencer-register">
              <Button size="lg" variant="outline">
                Join as Creator
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Carousel */}
      <BrandCarousel />

      {/* Why Kalakaarian */}
      <section className="py-16 px-4 bg-charcoal/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-oswald tracking-tight mb-4 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Why Kalakaarian?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyKalakaarian.map((feature) => (
              <Card key={feature.title} className="bg-charcoal border-white/8">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-2 text-chalk">{feature.title}</h3>
                  <p className="text-sm text-chalk-dim">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-fuchsia-600/10 to-pink-600/10" />
        <div className="absolute top-0 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Contact Us</h2>
          <p className="text-chalk-dim mb-8 max-w-2xl mx-auto">
            Have questions? We&apos;d love to hear from you. Reach out to us and we&apos;ll get back to you soon.
          </p>
          <Link to="/contact">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 gap-2">
              Get in Touch
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5 bg-obsidian">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-chalk-dim">
            <Link to="/terms" className="hover:text-chalk transition-colors">Terms &amp; Conditions</Link>
            <Link to="/refund-policy" className="hover:text-chalk transition-colors">Refund Policy</Link>
            <Link to="/privacy-policy" className="hover:text-chalk transition-colors">Privacy Policy</Link>
          </div>
          <p className="text-sm text-chalk-dim">&copy; 2026 Kalakaarian. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
