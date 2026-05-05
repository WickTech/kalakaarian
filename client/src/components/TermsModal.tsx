import { useState } from "react";
import { Link } from "react-router-dom";

interface TermsModalProps {
  onAccept: () => void;
  onClose: () => void;
  role?: "brand" | "influencer";
}

export function TermsModal({ onAccept, onClose, role = "influencer" }: TermsModalProps) {
  const [checks, setChecks] = useState({ primary: false, secondary: false });
  const allChecked = checks.primary && checks.secondary;

  const toggle = (key: keyof typeof checks) =>
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));

  const isBrand = role === "brand";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 space-y-5 shadow-2xl">
        <h2 className="text-lg font-bold text-foreground">Terms &amp; Conditions</h2>

        <div className="h-52 overflow-y-auto text-xs text-muted-foreground space-y-3 pr-1 border border-border rounded-lg p-3 bg-muted/20">
          <p className="font-semibold text-foreground text-xs">Key Terms Summary</p>
          {isBrand ? (
            <>
              <p><strong>24–48h Delivery:</strong> Campaigns execute within 24–48 hours after brief submission and escrow confirmation.</p>
              <p><strong>Approval Window:</strong> Brand must approve content within 2–6 hours. Late approvals trigger auto-approval and creator payout.</p>
              <p><strong>Escrow Payment:</strong> 100% campaign budget must be deposited upfront. Payment releases after content approval.</p>
              <p><strong>Revisions:</strong> 1–2 minor revisions per creator, within brief scope. Major changes may incur extra cost.</p>
              <p><strong>No Guarantee:</strong> Platform guarantees execution speed, not views or engagement metrics.</p>
              <p><strong>Cancellation:</strong> No cancellations once campaign is live. No refunds after creator assignment.</p>
              <p><strong>Creator Protection:</strong> No exploitation beyond agreed scope. Off-platform deals result in permanent ban.</p>
              <p><strong>Compliance:</strong> Brand ensures all content complies with Indian laws.</p>
            </>
          ) : (
            <>
              <p>By registering on Kalakaarian you agree to our platform guidelines, creator code of conduct, and privacy policy.</p>
              <p>Creators are responsible for delivering agreed deliverables on time. Payments are processed via Razorpay and are subject to platform fees.</p>
              <p>False follower counts or fake engagement will result in account termination. All content must comply with the Indian IT Act 2000 and applicable laws.</p>
              <p>Kalakaarian reserves the right to suspend accounts for policy violations. Disputes are subject to arbitration under Indian law.</p>
              <p>Zero commission from creators. Membership fees are non-refundable. Communication must occur within the platform only.</p>
            </>
          )}
          <p className="pt-1">
            <Link to="/terms" target="_blank" className="text-purple-500 hover:underline">
              View full Terms &amp; Conditions →
            </Link>
          </p>
        </div>

        <div className="space-y-3">
          {isBrand ? (
            <>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={checks.primary} onChange={() => toggle("primary")} className="mt-0.5 accent-purple-600" />
                <span className="text-sm text-foreground">I agree to the Terms &amp; Conditions</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={checks.secondary} onChange={() => toggle("secondary")} className="mt-0.5 accent-purple-600" />
                <span className="text-sm text-foreground">I understand the campaign execution &amp; payment policies (24–48h delivery, escrow, auto-approval)</span>
              </label>
            </>
          ) : (
            <>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={checks.primary} onChange={() => toggle("primary")} className="mt-0.5 accent-purple-600" />
                <span className="text-sm text-foreground">I confirm I am at least 18 years old</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={checks.secondary} onChange={() => toggle("secondary")} className="mt-0.5 accent-purple-600" />
                <span className="text-sm text-foreground">I have read and agree to the Terms &amp; Conditions and Privacy Policy</span>
              </label>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            disabled={!allChecked}
            onClick={onAccept}
            className="flex-1 py-2.5 text-sm rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Agree &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
