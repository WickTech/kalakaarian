import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, lazy, Suspense } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useCart } from "@/hooks/useCart";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CartDrawer } from "@/components/CartDrawer";
import Landing from "./pages/Landing";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import TermsPage from "./pages/TermsPage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import { InstallPrompt } from "@/components/InstallPrompt";
import { FloatingContactButton } from "@/components/FloatingContactButton";

const Marketplace = lazy(() => import("./pages/Marketplace"));
const InfluencerRegisterPage = lazy(() => import("./pages/InfluencerRegisterPage"));
const BrandRegisterPage = lazy(() => import("./pages/BrandRegisterPage"));
const BrandCampaignPage = lazy(() => import("./pages/BrandCampaignPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BrandDashboard = lazy(() => import("./pages/BrandDashboard"));
const CreateCampaign = lazy(() => import("./pages/CreateCampaign"));
const InfluencerDashboard = lazy(() => import("./pages/InfluencerDashboard"));
const BrowseCampaigns = lazy(() => import("./pages/BrowseCampaigns"));
const CampaignDetails = lazy(() => import("./pages/CampaignDetails"));
const SubmitProposal = lazy(() => import("./pages/SubmitProposal"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const EditInfluencerProfile = lazy(() => import("./pages/EditInfluencerProfile"));
const EditBrandProfile = lazy(() => import("./pages/EditBrandProfile"));
const Messages = lazy(() => import("./pages/Messages"));
const InfluencerProfile = lazy(() => import("./pages/InfluencerProfile"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const Feed = lazy(() => import("./pages/Feed"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" />
    </div>
  );
}

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
    return <Navigate to="/" replace />;
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
    return <Navigate to="/" replace />;
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

function AppContent() {
  const { dark, toggle } = useTheme();
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
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
        <Route path="/role-select" element={<Navigate to="/" replace />} />
        <Route path="/start-brand" element={<Navigate to="/brand-register" replace />} />
        <Route path="/start-influencer" element={<Navigate to="/influencer-register" replace />} />
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
        <Route path="/feed" element={<Feed />} />
        <Route
          path="/contact"
          element={<ContactPage />}
        />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart.items}
        removeFromCart={cart.removeFromCart}
        clearCart={cart.clearCart}
        total={cart.total}
        campaignName={cart.campaignName}
        campaignId={cart.campaignId}
        setCampaign={cart.setCampaign}
      />
      <InstallPrompt />
      <FloatingContactButton />
    </>
  );
}

const App = () => {
  const { dark, toggle } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
