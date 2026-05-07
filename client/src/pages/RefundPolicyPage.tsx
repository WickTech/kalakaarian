import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent" style={{ fontFamily: "Oswald, sans-serif" }}>
          Refund Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: May 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">1. Membership Refunds</h2>
            <p>Membership fees (Silver / Gold) are non-refundable once the subscription period has commenced. If you encounter a technical issue preventing access, contact us within 7 days of purchase.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">2. Campaign Payments</h2>
            <p>Payments made for campaign deliverables are held in escrow. Refunds are processed if the creator fails to deliver within the agreed timeline or the deliverable does not meet the agreed brief.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">3. Dispute Resolution</h2>
            <p>Disputes must be raised within 14 days of a transaction. Our team will review both parties&apos; submissions and issue a decision within 7 business days.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">4. Processing Time</h2>
            <p>Approved refunds are credited to the original payment method within 5–7 business days, subject to your bank&apos;s processing time.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">5. Contact</h2>
            <p>To raise a refund request, email <a href="mailto:support@kalakaarian.com" className="text-purple-600 hover:underline">support@kalakaarian.com</a> with your order ID and reason.</p>
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
