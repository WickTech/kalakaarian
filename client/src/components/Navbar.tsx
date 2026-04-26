import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-obsidian/90 backdrop-blur-md border-b border-white/8"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="font-display text-xl font-bold text-chalk tracking-tight">
          K KALAKAARIAN
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-chalk-dim">
          <Link to="/marketplace" className="hover:text-chalk transition-colors">Creators</Link>
          <Link to="/feed" className="hover:text-chalk transition-colors">Feed</Link>
          <Link to="/contact" className="hover:text-chalk transition-colors">Contact</Link>
        </nav>

        <div className="flex items-center gap-2 relative">
          {user ? (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-chalk-dim hover:text-chalk text-sm transition-colors"
              >
                Dashboard
              </button>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-9 h-9 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center"
                >
                  {(user.name || "U")[0].toUpperCase()}
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-11 w-40 bento-card p-2 shadow-xl">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-3 py-2 text-sm text-chalk-dim hover:text-chalk rounded-lg hover:bg-white/5 transition-colors"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); navigate("/"); }}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 rounded-lg hover:bg-red-400/5 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/brand-register")}
                className="hidden sm:flex px-4 py-2 rounded-full border border-white/20 text-chalk text-sm hover:border-white/40 transition-colors"
              >
                Start as Brand
              </button>
              <button
                onClick={() => navigate("/login")}
                className="purple-pill px-4 py-2 text-sm"
              >
                Join as Creator
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
