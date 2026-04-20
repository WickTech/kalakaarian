declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
}

let scriptLoaded = false;

export async function loadRazorpay(): Promise<boolean> {
  if (scriptLoaded || window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => { scriptLoaded = true; resolve(true); };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(opts: {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string };
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onDismiss?: () => void;
}): Promise<void> {
  const loaded = await loadRazorpay();
  if (!loaded) throw new Error('Failed to load Razorpay checkout');

  return new Promise((resolve) => {
    const rz = new window.Razorpay({
      key: opts.keyId,
      amount: opts.amount,
      currency: opts.currency,
      name: opts.name,
      description: opts.description,
      order_id: opts.orderId,
      prefill: opts.prefill,
      theme: { color: '#6366f1' },
      handler: (response) => {
        opts.onSuccess(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature
        );
        resolve();
      },
      modal: { ondismiss: () => { opts.onDismiss?.(); resolve(); } },
    });
    rz.open();
  });
}
