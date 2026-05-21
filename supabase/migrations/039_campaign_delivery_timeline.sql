-- 039_campaign_delivery_timeline.sql
-- Adds campaign delivery-window tracking. Stamped at cart checkout: the moment
-- creators are attached + notified, delivery_started_at is set and
-- delivery_due_at = +48h (matches the 24-48h delivery terms shown at checkout).
-- Both nullable -> safe to apply with zero downtime.

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS delivery_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_due_at     TIMESTAMPTZ;
