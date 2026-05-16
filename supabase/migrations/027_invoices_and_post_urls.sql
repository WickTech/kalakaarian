-- 027: Invoices + live post URLs for campaign deliverables.
-- Adds creator's live Instagram/YouTube post URL after the deliverable goes live,
-- and an invoice_number on transactions for downloadable PDF invoices.

-- ─────────────────────────────────────────────
-- campaign_videos: live post URL after deliverable goes live
-- ─────────────────────────────────────────────
ALTER TABLE campaign_videos
  ADD COLUMN IF NOT EXISTS live_post_url      TEXT,
  ADD COLUMN IF NOT EXISTS live_post_platform TEXT
    CHECK (live_post_platform IN ('instagram', 'youtube'));

CREATE INDEX IF NOT EXISTS idx_campaign_videos_live_post
  ON campaign_videos(campaign_id)
  WHERE live_post_url IS NOT NULL;

-- ─────────────────────────────────────────────
-- transactions: invoice numbering
-- ─────────────────────────────────────────────
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;

CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || to_char(NOW(), 'YYYY') || '-' ||
      lpad(nextval('invoice_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transactions_invoice_number ON transactions;
CREATE TRIGGER trg_transactions_invoice_number
  BEFORE INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_invoice_number();

-- Backfill existing transactions
UPDATE transactions
   SET invoice_number = 'INV-' || to_char(created_at, 'YYYY') || '-' ||
       lpad(nextval('invoice_seq')::text, 5, '0')
 WHERE invoice_number IS NULL;

-- ─────────────────────────────────────────────
-- index: brand transactions ordered by date
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_brand_created
  ON transactions(brand_id, created_at DESC);
