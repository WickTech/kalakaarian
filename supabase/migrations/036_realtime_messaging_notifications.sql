-- Phase 4: realtime for messaging + notifications.
--
-- Adds messages / notifications / conversations to the supabase_realtime
-- publication and locks down realtime visibility with RLS, so a browser
-- session only ever receives its own rows.
--
-- The Express server uses the service-role key (bypasses RLS) for all reads
-- and writes, so these policies do not affect the API — they are purely the
-- security boundary for what the realtime socket delivers to a session.

-- REPLICA IDENTITY FULL so UPDATE/DELETE events carry the filter columns
-- (conversation_id / user_id) used by postgres_changes subscriptions.
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;

-- Add to the realtime publication (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname = 'supabase_realtime' AND tablename = 'conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
END $$;

-- SELECT-only RLS — all writes go through the Express API (service role).
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- A user sees only their own notifications.
DROP POLICY IF EXISTS realtime_select_own ON notifications;
CREATE POLICY realtime_select_own ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- A user sees only conversations they participate in. The ::text casts make
-- the policy robust whether participant_ids is uuid[] or text[].
DROP POLICY IF EXISTS realtime_select_member ON conversations;
CREATE POLICY realtime_select_member ON conversations
  FOR SELECT USING ((auth.uid())::text = ANY ((participant_ids)::text[]));

-- A user sees only messages in conversations they participate in.
DROP POLICY IF EXISTS realtime_select_member ON messages;
CREATE POLICY realtime_select_member ON messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (auth.uid())::text = ANY ((c.participant_ids)::text[])
  ));
