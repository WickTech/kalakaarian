import { useState } from "react";

interface TermsModalProps {
  onAccept: () => void;
  onClose: () => void;
}

export function TermsModal({ onAccept, onClose }: TermsModalProps) {
  const [checks, setChecks] = useState({ age: false, terms: false });
  const allChecked = checks.age && checks.terms;

  const toggle = (key: keyof typeof checks) =>
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 space-y-5 shadow-2xl">
        <h2 className="text-lg font-bold text-foreground">Terms & Conditions</h2>
        <div className="h-40 overflow-y-auto text-xs text-muted-foreground space-y-3 pr-1 border border-border rounded-lg p-3 bg-muted/20">
          <p>By registering on Kalakaarian you agree to our platform guidelines, creator code of conduct, and privacy policy. Creators are responsible for delivering agreed deliverables on time. Payments are processed via Razorpay and are subject to platform fees. False follower counts or fake engagement will result in account termination. All content must comply with the Indian IT Act 2000 and applicable laws.</p>
          <p>Kalakaarian reserves the right to suspend accounts for policy violations. Disputes are subject to arbitration under Indian law in Mumbai jurisdiction.</p>
        </div>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={checks.age} onChange={() => toggle("age")} className="mt-0.5 accent-purple-600" />
            <span className="text-sm text-foreground">I confirm I am at least 18 years old</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={checks.terms} onChange={() => toggle("terms")} className="mt-0.5 accent-purple-600" />
            <span className="text-sm text-foreground">I have read and agree to the Terms & Conditions and Privacy Policy</span>
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button disabled={!allChecked} onClick={onAccept} className="flex-1 py-2.5 text-sm rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-40 disabled:cursor-not-allowed">
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
