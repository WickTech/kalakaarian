import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu, ShoppingCart, Wallet, LogOut, User,
  Bell, Settings, ChevronDown, BarChart2, ShieldCheck, LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/contexts/CartContext";
import { NotificationBell } from "@/components/NotificationBell";
import { WalletModal } from "@/components/WalletModal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface GlobalHeaderProps {
  onCartOpen: () => void;
}

const BRAND_NAV = [
  { to: "/", label: "Home", exact: true },
  { to: "/marketplace", label: "Marketplace", exact: false },
  { to: "/brand/dashboard?tab=campaigns", label: "Campaigns", exact: false },
  { to: "/contact", label: "Contact", exact: false },
];
const CREATOR_NAV = [
  { to: "/", label: "Home", exact: true },
  { to: "/influencer/dashboard", label: "Dashboard", exact: false },
  { to: "/campaigns", label: "My Campaigns", exact: false },
  { to: "/contact", label: "Contact", exact: false },
];
const DEFAULT_NAV = [
  { to: "/", label: "Home", exact: true },
  { to: "/contact", label: "Contact", exact: false },
];

export function GlobalHeader({ onCartOpen }: GlobalHeaderProps) {
  const { user, loading, logout, isSuperAdmin, viewAs, setViewAs } = useAuth();
  const cart = useCartContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const dashboardHref =
    user?.role === "brand" ? "/brand/dashboard" :
    user?.role === "influencer" ? "/influencer/dashboard" :
    "/dashboard";

  const isActive = ({ to, exact }: { to: string; exact: boolean }) => {
    const path = to.split("?")[0];
    return exact ? location.pathname === path : location.pathname.startsWith(path);
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const NAV_LINKS =
    user?.role === "brand" ? BRAND_NAV :
    user?.role === "influencer" ? CREATOR_NAV :
    DEFAULT_NAV;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-300 ${
        scrolled
          ? "bg-obsidian/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/30"
          : "bg-obsidian/70 backdrop-blur-sm border-b border-white/5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/k-logo-no-bg.png" alt="Kalakaarian" className="h-8 w-auto" />
          <span className="font-oswald text-base uppercase tracking-[0.3em] font-bold hidden sm:block text-chalk">
            KALAKAARIAN
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive(link)
                  ? "bg-purple-600/15 text-purple-400"
                  : "text-chalk-dim hover:text-chalk hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {loading ? (
            <Skeleton className="h-8 w-20 rounded-full" />
          ) : user ? (
            <>
              <NotificationBell className="hidden sm:flex" />

              {user?.role === "influencer" ? (
                <button
                  onClick={() => setWalletOpen(true)}
                  aria-label="Open wallet"
                  className="p-2 rounded-md border border-white/10 hover:bg-white/5 transition-colors"
                  title="Wallet"
                >
                  <Wallet className="w-4 h-4 text-gold" />
                </button>
              ) : (
                <button
                  onClick={() => user?.role === "brand" ? navigate("/cart") : onCartOpen()}
                  aria-label="Open cart"
                  className="relative p-2 rounded-md border border-white/10 hover:bg-white/5 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {cart.count > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[9px] font-bold flex items-center justify-center px-1">
                      {cart.count > 9 ? "9+" : cart.count}
                    </span>
                  )}
                </button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
                      {(user.name || "U")[0].toUpperCase()}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-80" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate flex-1">{user.name || "User"}</p>
                      {isSuperAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold font-bold shrink-0">Founder</span>}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {isSuperAdmin ? `Admin · ${viewAs} view` : user.role}
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <>
                      <div className="px-3 py-2 space-y-1.5 border-b border-border mb-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">View as</p>
                        <div className="flex gap-1">
                          {(["admin", "brand", "creator"] as const).map((v) => (
                            <button key={v} onClick={() => setViewAs(v)}
                              className={`flex-1 py-1 rounded text-[11px] font-medium transition-all capitalize ${viewAs === v ? "bg-purple-600 text-white" : "bg-white/5 text-chalk-dim hover:bg-white/10"}`}>
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <ShieldCheck className="w-4 h-4 text-gold" /> Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "brand" && (
                    <DropdownMenuItem asChild>
                      <Link to="/brand/dashboard?tab=campaigns" className="flex items-center gap-2 cursor-pointer">
                        <BarChart2 className="w-4 h-4" /> Current Campaign
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "influencer" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/influencer/dashboard" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="w-4 h-4" /> My Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/account/payments" className="flex items-center gap-2 cursor-pointer">
                          <Wallet className="w-4 h-4 text-gold" /> Wallet
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="flex items-center gap-2 cursor-pointer">
                      <Bell className="w-4 h-4" /> Notifications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" /> Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-500 focus:text-red-500 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-sm font-medium text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/brand-register"
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden p-2 rounded-md border border-white/10 hover:bg-white/5 transition-colors ml-1"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="px-4 py-4 border-b border-border">
                  <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                    <img src="/k-logo-no-bg.png" alt="Kalakaarian" className="h-7 w-auto" />
                    <span className="font-oswald text-base uppercase tracking-[0.25em] font-bold">KALAKAARIAN</span>
                  </Link>
                </div>
                <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive(link)
                          ? "bg-purple-600/15 text-purple-400"
                          : "text-chalk-dim hover:text-chalk hover:bg-white/5"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t border-border my-2" />
                  {user ? (
                    <>
                      {isSuperAdmin && (
                        <>
                          <div className="px-4 py-2 space-y-1.5">
                            <p className="text-[10px] text-chalk-faint uppercase tracking-wide">View as</p>
                            <div className="flex gap-1">
                              {(["admin", "brand", "creator"] as const).map((v) => (
                                <button key={v} onClick={() => { setViewAs(v); setMobileOpen(false); }}
                                  className={`flex-1 py-1.5 rounded text-xs font-medium capitalize transition-all ${viewAs === v ? "bg-purple-600 text-white" : "bg-white/5 text-chalk-dim"}`}>
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                          <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-gold hover:bg-gold/10 transition-colors flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Admin Dashboard
                          </Link>
                          <div className="border-t border-border my-1" />
                        </>
                      )}
                      <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors flex items-center gap-2">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      {user.role === "brand" && (
                        <Link to="/brand/dashboard?tab=campaigns" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors flex items-center gap-2">
                          <BarChart2 className="w-4 h-4" /> Campaign Tracker
                        </Link>
                      )}
                      {user.role === "influencer" && (
                        <>
                          <Link to="/influencer/dashboard" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4" /> My Dashboard
                          </Link>
                          <Link to="/account/payments" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-gold hover:bg-gold/10 transition-colors flex items-center gap-2">
                            <Wallet className="w-4 h-4" /> Wallet
                          </Link>
                        </>
                      )}
                      <Link to="/notifications" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Notifications
                      </Link>
                      <Link to="/account" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Account
                      </Link>
                      <button
                        onClick={() => { handleLogout(); setMobileOpen(false); }}
                        className="px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors">
                        Login
                      </Link>
                      <Link to="/brand-register" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors">
                        Become a Brand
                      </Link>
                      <Link to="/influencer-register" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors">
                        Become a Kalakaar
                      </Link>
                    </>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {user?.role === "influencer" && (
        <WalletModal open={walletOpen} onClose={() => setWalletOpen(false)} />
      )}
    </header>
  );
}
