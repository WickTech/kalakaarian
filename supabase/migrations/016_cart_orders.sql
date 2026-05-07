-- Phase 2: Cart orders table for Razorpay webhook reconciliation.
-- Stores a snapshot of cart contents at checkout time so the webhook can
-- process transactions and advance proposal workflow stages without relying
-- on Razorpay notes (which have size limits).

CREATE TABLE IF NOT EXISTS cart_orders (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id              UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  razorpay_order_id     TEXT        NOT NULL UNIQUE,
  amount_paise          INTEGER     NOT NULL,
  status                TEXT        NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending', 'paid', 'failed')),
  campaign_id           UUID        REFERENCES campaigns(id) ON DELETE SET NULL,
  cart_snapshot         JSONB       NOT NULL DEFAULT '[]',  -- [{influencer_id, price}]
  razorpay_payment_id   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_orders_brand_id           ON cart_orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_cart_orders_razorpay_order_id  ON cart_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_cart_orders_status             ON cart_orders(status) WHERE status = 'pending';

-- RLS: brands can see their own orders; service role bypasses.
ALTER TABLE cart_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY cart_orders_select ON cart_orders
  FOR SELECT USING (auth.uid() = brand_id);
