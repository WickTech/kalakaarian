import { Link } from "react-router-dom";
import { Instagram, Twitter, Linkedin } from "lucide-react";

const NAV_LINKS = [
  { label: "Creators", to: "/marketplace" },
  { label: "Feed", to: "/feed" },
  { label: "Contact", to: "/contact" },
];

const LEGAL_LINKS = [
  { label: "Privacy", to: "#" },
  { label: "Terms", to: "#" },
];

export function Footer() {
  return (
    <footer className="bg-obsidian border-t border-white/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start justify-between gap-8">
        <div className="space-y-2">
          <p className="font-display font-bold text-chalk text-lg">K KALAKAARIAN</p>
          <p className="text-sm text-chalk-dim max-w-xs">
            India&apos;s premier influencer marketplace. Real analytics, escrow payments, campaign tracking.
          </p>
        </div>

        <div className="flex flex-wrap gap-8">
          <div className="space-y-2">
            <p className="text-xs text-chalk-faint uppercase tracking-widest font-medium">Platform</p>
            <nav className="flex flex-col gap-1.5">
              {NAV_LINKS.map(({ label, to }) => (
                <Link key={label} to={to} className="text-sm text-chalk-dim hover:text-chalk transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-chalk-faint uppercase tracking-widest font-medium">Legal</p>
            <nav className="flex flex-col gap-1.5">
              {LEGAL_LINKS.map(({ label, to }) => (
                <Link key={label} to={to} className="text-sm text-chalk-dim hover:text-chalk transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-chalk-faint uppercase tracking-widest font-medium">Follow</p>
            <div className="flex gap-2">
              {[
                { icon: Instagram, label: "Instagram" },
                { icon: Twitter, label: "Twitter" },
                { icon: Linkedin, label: "LinkedIn" },
              ].map(({ icon: Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-chalk-dim hover:text-chalk hover:border-white/30 transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 px-4 py-4 text-center text-xs text-chalk-faint">
        © 2026 Kalakaarian. All rights reserved.
      </div>
    </footer>
  );
}
