import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu, ShoppingCart, LogOut, User, LayoutDashboard,
  Bell, Settings, FileText, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/contexts/CartContext";
import { NotificationBell } from "@/components/NotificationBell";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface GlobalHeaderProps {
  onCartOpen: () => void;
}

const NAV_LINKS = [
  { to: "/", label: "Home", exact: true },
  { to: "/marketplace", label: "Marketplace", exact: false },
  { to: "/campaigns", label: "Campaigns", exact: false },
  { to: "/contact", label: "Contact", exact: false },
];

export function GlobalHeader({ onCartOpen }: GlobalHeaderProps) {
  const { user, loading, logout } = useAuth();
  const cart = useCartContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (y < 60 || y < lastScrollY.current) {
        setVisible(true);
      } else if (y > lastScrollY.current + 5) {
        setVisible(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const dashboardHref =
    user?.role === "brand" ? "/brand/dashboard" :
    user?.role === "influencer" ? "/influencer/dashboard" :
    "/dashboard";

  const isActive = ({ to, exact }: { to: string; exact: boolean }) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      } ${
        scrolled
          ? "bg-obsidian/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/30"
          : "bg-obsidian/70 backdrop-blur-sm border-b border-white/5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/k-logo-no-bg.png" alt="Kalakaarian" className="h-8 w-auto" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] font-bold hidden sm:block text-chalk">
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
        <div className="flex items-center gap-1.5">
          {loading ? (
            <Skeleton className="h-8 w-20 rounded-full" />
          ) : user ? (
            <>
              <NotificationBell className="hidden sm:flex" />

              <button
                onClick={onCartOpen}
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
                      {(user.name || "U")[0].toUpperCase()}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-80" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-sm font-semibold truncate">{user.name || "User"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to={dashboardHref} className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "brand" && (
                    <DropdownMenuItem asChild>
                      <Link to="/brand/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <FileText className="w-4 h-4" /> Campaigns
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "influencer" && (
                    <DropdownMenuItem asChild>
                      <Link to="/campaigns" className="flex items-center gap-2 cursor-pointer">
                        <FileText className="w-4 h-4" /> Browse Campaigns
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="flex items-center gap-2 cursor-pointer">
                      <Bell className="w-4 h-4" /> Notifications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile/edit" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" /> Settings
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
                    <span className="font-mono text-xs uppercase tracking-[0.25em] font-bold">KALAKAARIAN</span>
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
                      <Link to={dashboardHref} onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors flex items-center gap-2">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <Link to="/notifications" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Notifications
                      </Link>
                      <Link to="/profile/edit" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Settings
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
                        Become a Creator
                      </Link>
                    </>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
