import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useCart } from "@/hooks/useCart";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CartDrawer } from "@/components/CartDrawer";
import Landing from "./pages/Landing";
import Marketplace from "./pages/Marketplace";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RoleSelectPage from "./pages/RoleSelectPage";
import InfluencerRegisterPage from "./pages/InfluencerRegisterPage";
import BrandRegisterPage from "./pages/BrandRegisterPage";
import BrandCampaignPage from "./pages/BrandCampaignPage";
import Dashboard from "./pages/Dashboard";
import BrandDashboard from "./pages/BrandDashboard";
import CreateCampaign from "./pages/CreateCampaign";
import InfluencerDashboard from "./pages/InfluencerDashboard";
import BrowseCampaigns from "./pages/BrowseCampaigns";
import CampaignDetails from "./pages/CampaignDetails";
import SubmitProposal from "./pages/SubmitProposal";
import MyProfile from "./pages/MyProfile";
import EditInfluencerProfile from "./pages/EditInfluencerProfile";
import EditBrandProfile from "./pages/EditBrandProfile";
import Messages from "./pages/Messages";
import InfluencerProfile from "./pages/InfluencerProfile";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function BrandRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "brand") {
    return <Navigate to="/role-select" replace />;
  }

  return <>{children}</>;
}

function InfluencerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "influencer") {
    return <Navigate to="/role-select" replace />;
  }

  return <>{children}</>;
}

function EditProfileWrapper() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "influencer") {
    return <EditInfluencerProfile />;
  }

  return <EditBrandProfile />;
}

const App = () => {
  const { dark, toggle } = useTheme();
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <Landing
                    dark={dark}
                    toggleTheme={toggle}
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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/role-select" element={<RoleSelectPage />} />
              <Route
                path="/influencer-register"
                element={<InfluencerRegisterPage />}
              />
              <Route
                path="/brand-register"
                element={<BrandRegisterPage />}
              />
              <Route
                path="/brand-campaign"
                element={
                  <ProtectedRoute>
                    <BrandCampaignPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/brand/dashboard"
                element={
                  <BrandRoute>
                    <BrandDashboard />
                  </BrandRoute>
                }
              />
              <Route
                path="/brand/create-campaign"
                element={
                  <BrandRoute>
                    <CreateCampaign />
                  </BrandRoute>
                }
              />
              <Route
                path="/influencer/dashboard"
                element={
                  <ProtectedRoute>
                    <InfluencerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns"
                element={
                  <InfluencerRoute>
                    <BrowseCampaigns />
                  </InfluencerRoute>
                }
              />
              <Route
                path="/campaign/:id"
                element={
                  <InfluencerRoute>
                    <CampaignDetails />
                  </InfluencerRoute>
                }
              />
              <Route
                path="/campaign/:id/propose"
                element={
                  <InfluencerRoute>
                    <SubmitProposal />
                  </InfluencerRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <MyProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute>
                    <EditProfileWrapper />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer/:id"
                element={<InfluencerProfile />}
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
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
