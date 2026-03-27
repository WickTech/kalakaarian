import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, Target, TrendingUp, Shield, Sparkles } from "lucide-react";

interface LandingProps {
  dark: boolean;
  toggleTheme: () => void;
  cartCount: number;
  onCartOpen: () => void;
}

const features = [
  {
    icon: Users,
    title: "Creator Connectivity",
    description: "Connect with N number of creators in a single click, with zero margins.",
  },
  {
    icon: Target,
    title: "Fast Campaign Delivery",
    description: "Get your campaign ready within 24 hours with the lowest platform fee.",
  },
  {
    icon: TrendingUp,
    title: "Track & Navigate",
    description: "Track your payments and navigate your campaigns with ease.",
  },
  {
    icon: Sparkles,
    title: "AI Profile Suggestions",
    description: "Use AI to get 100% compatible creators matched to your target audience.",
  },
];

const tiers = [
  {
    key: "nano",
    label: "Nano Creator",
    range: "2K - 25K Followers",
    desc: "INVENTORY: 30 ASSETS",
    color: "border-terminal",
  },
  {
    key: "micro",
    label: "Micro Creator",
    range: "26K - 250K Followers",
    desc: "INVENTORY: 30 ASSETS",
    color: "border-terminal",
  },
  {
    key: "macro",
    label: "Macro Creator",
    range: "251K - 3M Followers",
    desc: "INVENTORY: 30 ASSETS",
    color: "border-terminal",
  },
  {
    key: "celebrity",
    label: "Celebrity",
    range: "3M+ Followers",
    desc: "INVENTORY: 10 ASSETS",
    color: "border-destructive",
  },
];

export default function Landing({ dark, toggleTheme, cartCount, onCartOpen }: LandingProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-sm uppercase tracking-[0.3em] font-bold">
            <span className="text-terminal">■</span> KALAKAARIAN
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle dark={dark} toggle={toggleTheme} />
          <Link to="/login">
            <Button variant="outline" size="sm">Login</Button>
          </Link>
          <Link to="/role-select">
            <Button size="sm">Get Started</Button>
          </Link>
          <button onClick={onCartOpen} className="border border-border p-2 hover:border-terminal transition-colors relative">
            <span className="font-mono text-xs">CART</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-terminal text-primary-foreground font-mono text-[10px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-fuchsia-600/10 to-pink-600/10" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            India&apos;s First AI-Powered Marketplace of Kalakaar (Creators)
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Influence. Impact.
            </span>
            <br />
            <span className="text-foreground">Growth.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Bridge the gap between brands and influencers. Discover authentic partnerships 
            that drive real results for your marketing campaigns.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/role-select">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 gap-2">
                Start as Brand
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/role-select">
              <Button size="lg" variant="outline" className="gap-2">
                Join as Influencer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tier Grid - Second Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-oswald tracking-tight mb-4">Explore Creators</h2>
            <p className="text-muted-foreground">
              Find the perfect influencer tier for your budget and campaign goals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.key}
                onClick={() => navigate(`/marketplace?tier=${tier.key}`)}
                className="border-2 border-border rounded-xl p-8 cursor-pointer group hover:border-purple-500 transition-all relative bg-card"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/5 group-hover:to-pink-600/5 transition-all" />
                <span className="text-sm font-oswald font-medium text-muted-foreground mb-3 block">
                  {tier.range}
                </span>
                <h3 className="text-3xl font-oswald font-bold mb-3 group-hover:text-purple-600 transition-colors">
                  {tier.label}
                </h3>
                <p className="text-sm text-muted-foreground">{tier.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Experience the Influencers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Connect with creators who understand your vision and amplify your brand&apos;s message
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-purple-500/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Diverse Categories</h3>
                <p className="text-sm text-muted-foreground">
                  Find influencers across fashion, tech, food, fitness, and more niches tailored to your brand
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-purple-500/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Authentic Engagement</h3>
                <p className="text-sm text-muted-foreground">
                  Work with creators who have genuine connections with their audience for better results
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-purple-500/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Measurable Impact</h3>
                <p className="text-sm text-muted-foreground">
                  Track campaign performance and ROI with detailed analytics and reporting tools
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Kalakaarian? Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Why Kalakaarian?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide everything you need to run successful influencer marketing campaigns
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-purple-500/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Experience the Influencers Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Experience the Influencers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Connect with creators who understand your vision and amplify your brand&apos;s message
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-purple-500/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Diverse Categories</h3>
                <p className="text-sm text-muted-foreground">
                  Find influencers across fashion, tech, food, fitness, and more niches tailored to your brand
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-purple-500/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Authentic Engagement</h3>
                <p className="text-sm text-muted-foreground">
                  Work with creators who have genuine connections with their audience for better results
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-purple-500/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Measurable Impact</h3>
                <p className="text-sm text-muted-foreground">
                  Track campaign performance and ROI with detailed analytics and reporting tools
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Reach out to us and we'll get back to you soon.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/role-select">
              <Button size="lg" variant="secondary" className="gap-2">
                Get in Touch
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Kalakaarian. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
