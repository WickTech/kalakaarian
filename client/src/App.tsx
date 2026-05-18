import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, lazy, Suspense } from "react";
import { useTheme } from "@/hooks/useTheme";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CartProvider, useCartContext } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { GlobalHeader } from "@/components/GlobalHeader";
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
const MyProfile = lazy(() => import("./pages/MyProfile"));
const EditInfluencerProfile = lazy(() => import("./pages/EditInfluencerProfile"));
const EditBrandProfile = lazy(() => import("./pages/EditBrandProfile"));
const InfluencerProfile = lazy(() => import("./pages/InfluencerProfile"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const Feed = lazy(() => import("./pages/Feed"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ProposalDetail = lazy(() => import("./pages/proposal/[id]"));
const SharedWorkflowView = lazy(() => import("./pages/proposal/SharedView"));
const BrandPublicProfile = lazy(() => import("./pages/BrandPublicProfile"));
const CampaignTrackPage = lazy(() => import("./pages/campaign/TrackPage"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const BrandWelcome = lazy(() => import("./pages/BrandWelcome"));
const CartPage = lazy(() => import("./pages/CartPage"));
const AccountLayout = lazy(() => import("./pages/account/AccountLayout"));
const AccountHome = lazy(() => import("./pages/account/AccountHome"));
const AccountPersonal = lazy(() => import("./pages/account/PersonalInfo"));
const AccountSecurity = lazy(() => import("./pages/account/Security"));
const AccountIntegrations = lazy(() => import("./pages/account/Integrations"));
const AccountPrivacy = lazy(() => import("./pages/account/Privacy"));
const AccountPayments = lazy(() => import("./pages/account/Payments"));
const GoogleOnboarding = lazy(() => import("./pages/GoogleOnboarding"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, gcTime: 5 * 60_000 } },
});

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

  if (user.onboardingCompleted === false) {
    return <Navigate to="/register/complete" replace />;
  }

  return <>{children}</>;
}

function BrandRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isSuperAdmin, viewAs } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboardingCompleted === false) return <Navigate to="/register/complete" replace />;
  if (isSuperAdmin && viewAs === "brand") return <>{children}</>;
  if (user.role !== "brand") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function InfluencerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isSuperAdmin, viewAs } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboardingCompleted === false) return <Navigate to="/register/complete" replace />;
  if (isSuperAdmin && viewAs === "creator") return <>{children}</>;
  if (user.role !== "influencer") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isSuperAdmin } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Blocks logged-in creators from brand-facing public pages. Anonymous + brand users pass through.
function BlockCreatorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isSuperAdmin } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" /></div>;
  if (!isSuperAdmin && user?.role === "influencer") return <Navigate to={`/influencer/${user.id}`} replace />;
  return <>{children}</>;
}

function ProfileRouter() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "influencer") return <Navigate to={`/influencer/${user.id}`} replace />;
  return <MyProfile />;
}

function SmartHome() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" />
    </div>
  );
  if (user?.role === "brand") return <Navigate to="/brand/welcome" replace />;
  if (user?.role === "influencer") return <Navigate to={`/influencer/${user.id}`} replace />;
  return <Landing />;
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
  const cart = useCartContext();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <GlobalHeader onCartOpen={() => setCartOpen(true)} />
      <main>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<SmartHome />} />
        <Route
          path="/marketplace"
          element={
            <BrandRoute>
              <Marketplace
                isInCart={cart.isInCart}
                addToCart={cart.addToCart}
                removeFromCart={cart.removeFromCart}
              />
            </BrandRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register/complete" element={<GoogleOnboarding />} />
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
            <BrandRoute>
              <BrandCampaignPage />
            </BrandRoute>
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
          path="/brand/welcome"
          element={
            <BrandRoute>
              <BrandWelcome />
            </BrandRoute>
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
            <InfluencerRoute>
              <InfluencerDashboard />
            </InfluencerRoute>
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
          path="/profile"
          element={<ProfileRouter />}
        />
        <Route
          path="/profile/edit"
          element={<Navigate to="/account/personal" replace />}
        />

        {/* Account Hub */}
        <Route
          path="/account"
          element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}
        >
          <Route index element={<AccountHome />} />
          <Route path="personal" element={<AccountPersonal />} />
          <Route path="security" element={<AccountSecurity />} />
          <Route path="integrations" element={<AccountIntegrations />} />
          <Route path="privacy" element={<AccountPrivacy />} />
          <Route path="payments" element={<AccountPayments />} />
        </Route>
        <Route path="/messages" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/influencer/:id"
          element={<InfluencerProfile />}
        />
        <Route path="/feed" element={<Feed />} />
        <Route path="/cart" element={<BrandRoute><CartPage /></BrandRoute>} />
        <Route path="/checkout" element={<BrandRoute><CheckoutPage /></BrandRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/proposals/:id" element={<ProtectedRoute><ProposalDetail /></ProtectedRoute>} />
        <Route path="/proposals/shared/:id" element={<SharedWorkflowView />} />
        <Route path="/brand/campaigns/:id/track" element={<BrandRoute><CampaignTrackPage /></BrandRoute>} />
        <Route path="/brand/:id" element={<BlockCreatorRoute><BrandPublicProfile /></BlockCreatorRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route
          path="/contact"
          element={<ContactPage />}
        />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      </main>
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart.items}
        removeFromCart={cart.removeFromCart}
        clearCart={cart.clearCart}
        total={cart.total}
        campaignName={cart.campaignName}
        campaignId={cart.campaignId}
        campaignDescription={cart.campaignDescription}
        setCampaign={cart.setCampaign}
        setCampaignDescription={cart.setCampaignDescription}
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
            <CartProvider>
            <AppContent />
            </CartProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
