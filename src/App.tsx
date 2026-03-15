import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/CartDrawer";
import LoginPage from "./pages/LoginPage";
import InfluencerRegisterPage from "./pages/InfluencerRegisterPage";
import BrandCampaignPage from "./pages/BrandCampaignPage";
import Landing from "./pages/Landing";
import Marketplace from "./pages/Marketplace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { dark, toggle } = useTheme();
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/influencer/register" element={<InfluencerRegisterPage />} />
            <Route path="/brand/campaign" element={<BrandCampaignPage />} />
            <Route
              path="/landing"
              element={
                <Landing
                  dark={dark}
                  toggleTheme={toggle}
                  cartCount={cart.count}
                  onCartOpen={() => setCartOpen(true)}
                />
              }
            />
            <Route
              path="/marketplace"
              element={
                <Marketplace
                  dark={dark}
                  toggleTheme={toggle}
                  cartCount={cart.count}
                  onCartOpen={() => setCartOpen(true)}
                  isInCart={cart.isInCart}
                  addToCart={cart.addToCart}
                />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CartDrawer
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            items={cart.items}
            removeFromCart={cart.removeFromCart}
            clearCart={cart.clearCart}
            total={cart.total}
          />
          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
