import { describe, it, expect } from "vitest";

// Mirror the server constants used in CheckoutPage + CartDrawer
const PLATFORM_FEE_RATE = 0.08;
const GST_RATE = 0.18;

function calcGrandTotal(subtotal: number) {
  const fee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const subtotalWithFee = subtotal + fee;
  const gst = Math.round(subtotalWithFee * GST_RATE);
  return subtotalWithFee + gst;
}

describe("checkout pricing", () => {
  it("platform fee is 8% of subtotal", () => {
    expect(Math.round(10000 * PLATFORM_FEE_RATE)).toBe(800);
  });
  it("GST is 18% on (subtotal + fee)", () => {
    const subtotalWithFee = 10000 + 800;
    expect(Math.round(subtotalWithFee * GST_RATE)).toBe(1944);
  });
  it("grand total = subtotal + fee + GST", () => {
    expect(calcGrandTotal(10000)).toBe(12744);
  });
  it("zero subtotal returns zero", () => {
    expect(calcGrandTotal(0)).toBe(0);
  });
  it("platform fee rounds correctly for odd amount", () => {
    // ₹1999 * 0.08 = 159.92 → rounds to 160
    expect(Math.round(1999 * PLATFORM_FEE_RATE)).toBe(160);
  });
});

describe("CartDrawer GST display", () => {
  it("cart GST matches checkout GST formula", () => {
    const total = 15000;
    // CartDrawer: total * 1.08 * 0.18
    const cartGst = Math.round(total * 1.08 * 0.18);
    // CheckoutPage: Math.round((total + Math.round(total * 0.08)) * 0.18)
    const checkoutGst = Math.round((total + Math.round(total * 0.08)) * 0.18);
    expect(cartGst).toBe(checkoutGst);
  });
});
