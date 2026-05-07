import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent" style={{ fontFamily: "Oswald, sans-serif" }}>
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: May 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly (name, email, phone, profile data) and usage data (pages visited, actions taken) to improve our platform.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">2. How We Use Your Information</h2>
            <p>Your data is used to operate the platform, process payments, send notifications you&apos;ve opted into, and improve our services. We do not sell your personal data to third parties.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">3. Data Sharing</h2>
            <p>We share data with service providers (Supabase for database/auth, Razorpay for payments, Resend for email) solely to provide our service. All providers are bound by data processing agreements.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">4. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">5. Cookies</h2>
            <p>We use essential cookies for authentication and session management. No third-party tracking cookies are used without your consent.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. Contact us at <a href="mailto:support@kalakaarian.com" className="text-purple-600 hover:underline">support@kalakaarian.com</a> to exercise these rights.</p>
          </section>
        </div>
      </main>

      <footer className="border-t py-6 px-4 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-6 mb-2">
          <Link to="/terms" className="hover:text-foreground">Terms &amp; Conditions</Link>
          <Link to="/refund-policy" className="hover:text-foreground">Refund Policy</Link>
          <Link to="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link>
        </div>
        <p>&copy; 2026 Kalakaarian. All rights reserved.</p>
      </footer>
    </div>
  );
}
