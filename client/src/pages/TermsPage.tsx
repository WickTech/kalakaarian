import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    n: "1", title: "Acceptance of Terms",
    body: "By registering on Kalakaarian, the Brand agrees to comply with all platform rules, timelines, and campaign execution policies. These terms constitute a legally binding agreement between the Brand and Kalakaarian.",
  },
  {
    n: "2", title: "24–48 Hour Campaign Delivery Model",
    body: "Kalakaarian enables campaign execution within 24–48 hours, subject to complete and clear campaign brief submission and timely approvals from the Brand. The delivery timeline begins only after final brief submission and campaign budget escrow confirmation.",
  },
  {
    n: "3", title: "Mandatory Campaign Brief Requirement",
    body: "Brand must provide a complete brief including: campaign objective, content requirements, platform, target audience, and Do's & Don'ts. Incomplete or unclear briefs may delay execution and void the 24-hour delivery commitment.",
  },
  {
    n: "4", title: "Instant Approval Responsibility",
    body: "Brand agrees to provide approvals/revisions within 2–6 hours of content submission. Delayed approvals automatically extend delivery timelines and amount will be credited to the creator's account. These are not considered delays by creators or the platform.",
  },
  {
    n: "5", title: "Escrow-Based Payment System",
    body: "Brand must deposit 100% campaign budget upfront into Kalakaarian escrow. Campaign will not begin until payment is successfully secured. Payments are released to creators only after content submission and approval or auto-approval.",
  },
  {
    n: "6", title: "Auto-Approval Mechanism",
    body: "If Brand fails to respond within the defined approval window, content will be auto-approved by the system and payment will be released to the creator. This ensures fast execution and no delays in creator payouts.",
  },
  {
    n: "7", title: "Revision Policy",
    body: "Brand is entitled to 1–2 minor revisions per creator. Revision requests must be within the original brief scope. Major changes may require a new campaign or additional cost and may reset delivery timelines.",
  },
  {
    n: "8", title: "AI-Based Matching & Execution",
    body: "Kalakaarian uses AI to match brands with creators and optimize campaign performance. Brand agrees that AI-driven selection is final unless manual override is enabled. Performance may vary based on creator audience and platform algorithms.",
  },
  {
    n: "9", title: "No Guarantee of Performance Metrics",
    body: "Kalakaarian does not guarantee views or engagement. Platform guarantees delivery speed, execution efficiency, sales conversions, brand building & branding, and proven marketing strategy.",
  },
  {
    n: "10", title: "Zero Commission Model Transparency & Campaign Navigation",
    body: "Kalakaarian operates with zero commission from creators and transparent pricing for brands. Any platform/service fees will be clearly disclosed before campaign launch. Brands can navigate campaigns in the 'Your Campaign' section and track creator payment status.",
  },
  {
    n: "11", title: "Cancellation & Refund Policy",
    body: "Once a campaign is live, it cannot be cancelled. Before creator allocation, partial refunds may be processed (platform fee may apply). After creator assignment, no refunds for completed or in-progress work.",
  },
  {
    n: "12", title: "Delay & Liability Limitation",
    body: "Kalakaarian is not responsible for delays caused by brand-side delays or force majeure events. Platform liability is limited to the amount paid for the specific campaign.",
  },
  {
    n: "13", title: "Content Rights & Usage",
    body: "Upon payment, Brand receives usage rights as defined in the campaign brief. Extended usage (ads, whitelisting, etc.) must be pre-agreed or separately compensated.",
  },
  {
    n: "14", title: "Compliance & Legal Responsibility",
    body: "Brand must ensure all campaign content complies with Indian laws and no misleading or restricted promotions are made. Kalakaarian reserves the right to reject or remove campaigns violating policies.",
  },
  {
    n: "15", title: "Creator Protection Clause",
    body: "Brand agrees not to exploit creators beyond the agreed scope or demand unpaid additional work. Violations may result in account suspension and/or legal action.",
  },
  {
    n: "16", title: "Communication Policy",
    body: "All communication must occur within the Kalakaarian platform. Off-platform deals are strictly prohibited and may lead to permanent ban.",
  },
  {
    n: "17", title: "Force Majeure",
    body: "Delays due to natural disasters, platform outages, or government restrictions will not be considered a breach of these terms.",
  },
  {
    n: "18", title: "Dispute Resolution",
    body: "Disputes will be handled via the platform resolution system. Escalation proceeds to arbitration under Indian jurisdiction.",
  },
  {
    n: "19", title: "Modification of Terms",
    body: "Kalakaarian reserves the right to update these terms at any time. Continued usage of the platform implies acceptance of the updated terms.",
  },
  {
    n: "20", title: "Consent & Agreement",
    body: "By clicking 'Agree & Register', Brand confirms understanding of the 24–48 hour execution model, commitment to fast approvals, and acceptance of the auto-approval and escrow system.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent" style={{ fontFamily: "Oswald, sans-serif" }}>
          Terms &amp; Conditions
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: May 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          {SECTIONS.map((s) => (
            <section key={s.n}>
              <h2 className="text-lg font-bold text-foreground mb-2">{s.n}. {s.title}</h2>
              <p>{s.body}</p>
            </section>
          ))}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">Contact</h2>
            <p>For queries regarding these terms, reach us at{" "}
              <a href="mailto:support@kalakaarian.com" className="text-purple-600 hover:underline">support@kalakaarian.com</a>.
            </p>
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
